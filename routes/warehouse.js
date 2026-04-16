const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

// ------------------- PUBLIC ENDPOINTS -------------------
// جلب المنتجات المتاحة للجمهور (مع دعم البحث، التصنيف، العلامة التجارية، الصفحات)
router.get('/public-products', async (req, res) => {
  try {
    const { search, category, brand, sort = 'name', page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.id, p.name, p.brand, p.sale_price AS price, p.image_url, p.total_qty AS stock,
             pc.name AS category_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.is_active = true
    `;
    const values = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.brand ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }
    if (category) {
      query += ` AND pc.name = $${paramIndex}`;
      values.push(category);
      paramIndex++;
    }
    if (brand) {
      query += ` AND p.brand = $${paramIndex}`;
      values.push(brand);
      paramIndex++;
    }

    // الترتيب
    switch (sort) {
      case 'price_asc':
        query += ` ORDER BY p.sale_price ASC`;
        break;
      case 'price_desc':
        query += ` ORDER BY p.sale_price DESC`;
        break;
      default:
        query += ` ORDER BY p.name ASC`;
    }

    // جلب العدد الكلي قبل تطبيق LIMIT
    const countQuery = query.replace(
      /SELECT p\.id, p\.name, p\.brand, p\.sale_price AS price, p\.image_url, p\.total_qty AS stock, pc\.name AS category_name/,
      'SELECT COUNT(*) AS total'
    ).replace(/ORDER BY .*$/, '');
    const countRes = await pool.query(countQuery, values);
    const total = parseInt(countRes.rows[0].total);

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    res.json({ success: true, products: result.rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('💥 [GET /public-products] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب المنتجات العامة' });
  }
});

// جلب جميع العلامات التجارية المتاحة (للفلترة)
router.get('/brands', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT brand FROM products WHERE is_active = true AND brand IS NOT NULL ORDER BY brand
    `);
    res.json(result.rows.map(r => r.brand));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في جلب العلامات التجارية' });
  }
});

// ------------------- ERP ENDPOINTS (تتطلب تسجيل دخول وصلاحيات) -------------------
router.get('/products', [checkPermission('warehouse', 'read')], async (req, res) => {
  try {
    const { tenantId } = req.user;
    const result = await pool.query(`
      SELECT
        p.*,
        pc.name AS category_name,
        COALESCE(SUM(s.quantity), 0) AS current_stock,
        string_agg(DISTINCT w.name, ', ') AS warehouse_names
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN stock s ON s.product_id = p.id
      LEFT JOIN warehouses w ON w.id = s.warehouse_id
      WHERE p.is_active = true AND p.tenant_id = $1
      GROUP BY p.id, pc.name
      ORDER BY p.id
    `, [tenantId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('💥 [GET /products] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب قائمة المنتجات' });
  }
});

router.get('/products/:id', [checkPermission('inventory', 'read')], async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;
    const result = await pool.query(`
      SELECT p.*, pc.name AS category_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.id = $1 AND p.tenant_id = $2 AND p.is_active = true
    `, [id, tenantId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود أو تابع لشركة أخرى' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('💥 [GET /products/:id] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
  }
});

router.post('/products', [checkPermission('inventory', 'write')], async (req, res) => {
  try {
    const { name, brand, price, image_url, category_id, total_qty } = req.body;
    const { tenantId } = req.user;
    
    // Generate a random product code
    const code = 'PRD-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    const result = await pool.query(`
      INSERT INTO products (code, name, brand, sale_price, image_url, category_id, total_qty, tenant_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) RETURNING *
    `, [code, name, brand || null, price || 0, image_url || null, category_id || null, total_qty || 0, tenantId]);
    res.status(201).json({ success: true, message: 'تم إضافة المنتج بنجاح', data: result.rows[0] });
  } catch (err) {
    console.error('💥 [POST /products] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في إضافة المنتج الجديد' });
  }
});

router.put('/products/:id', [checkPermission('warehouse', 'write')], async (req, res) => {
  const { id } = req.params;
  const { name, price, min_stock, brand, category_id, total_qty, image_url } = req.body;
  const { tenantId } = req.user;

  if (price === undefined || price === null || price === '' || price === 'null') {
    return res.status(400).json({ message: 'السعر مطلوب لتحديث المنتج' });
  }

  try {
    const result = await pool.query(
      `UPDATE products 
       SET name = $1, sale_price = $2, min_quantity = $3, brand = $4, category_id = $5, total_qty = $6, image_url = $7, updated_at = NOW()
       WHERE id = $8 AND tenant_id = $9 RETURNING *`,
      [name, price, min_stock || 0, brand || null, category_id || null, total_qty || 0, image_url || null, id, tenantId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'المنتج غير موجود أو تابع لشركة أخرى' });
    res.json({ success: true, message: 'تم تحديث المنتج بنجاح', data: result.rows[0] });
  } catch (err) {
    console.error('💥 [PUT /products/:id] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم أثناء التحديث' });
  }
});

router.patch('/products/:id', [checkPermission('warehouse', 'write')], async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;
    const fields = [];
    const values = [];
    let paramIndex = 1;
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'لا توجد حقول للتحديث' });
    }
    values.push(id, tenantId);
    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} RETURNING *`;
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود أو تابع لشركة أخرى' });
    }
    res.json({ success: true, message: 'تم تحديث المنتج بنجاح', data: result.rows[0] });
  } catch (err) {
    console.error('💥 [PATCH /products/:id] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في تحديث بيانات المنتج' });
  }
});

router.delete('/products/:id', [checkPermission('warehouse', 'write')], async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;
    const result = await pool.query('UPDATE products SET is_active = false WHERE id = $1 AND tenant_id = $2 RETURNING id', [id, tenantId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود أو تابع لشركة أخرى' });
    }
    res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
  } catch (err) {
    console.error('💥 [DELETE /products/:id] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حذف المنتج' });
  }
});

// جلب التصنيفات (للوحة التحكم)
router.get('/categories', [checkPermission('inventory', 'read')], async (req, res) => {
  try {
    const { tenantId } = req.user;
    const result = await pool.query('SELECT * FROM product_categories WHERE tenant_id = $1 OR tenant_id IS NULL ORDER BY name', [tenantId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('💥 [GET /categories] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب التصنيفات' });
  }
});

// جلب المستودعات
router.get('/warehouses', [checkPermission('inventory', 'read')], async (req, res) => {
  try {
    const { tenantId } = req.user;
    const result = await pool.query('SELECT * FROM warehouses WHERE is_active = true AND tenant_id = $1', [tenantId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('💥 [GET /warehouses] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب المستودعات' });
  }
});

// حركات المخزون (للـ ERP)
router.post('/movements', [checkPermission('inventory', 'write')], async (req, res) => {
  try {
    const { product_id, warehouse_id, quantity, movement_type, reference, notes } = req.body;
    const { tenantId } = req.user;

    // التحقق من ملكية المنتج والمستودع
    const prodCheck = await pool.query('SELECT id FROM products WHERE id = $1 AND tenant_id = $2', [product_id, tenantId]);
    if (prodCheck.rows.length === 0) return res.status(403).json({ error: 'المنتج غير موجود أو غير تابع لك' });

    const result = await pool.query(`
      INSERT INTO stock_movements (product_id, warehouse_id, quantity, movement_type, reference, notes, tenant_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [product_id, warehouse_id, quantity, movement_type, reference, notes, tenantId]);
    // تحديث total_qty في جدول المنتجات
    await pool.query(`
      UPDATE products SET total_qty = total_qty + $1 WHERE id = $2 AND tenant_id = $3
    `, [movement_type === 'IN' ? quantity : -quantity, product_id, tenantId]);
    res.status(201).json({ success: true, message: 'تم تسجيل الحركة بنجاح', data: result.rows[0] });
  } catch (err) {
    console.error('💥 [POST /movements] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في تسجيل حركة المخزون' });
  }
});

router.get('/movements', [checkPermission('inventory', 'read')], async (req, res) => {
  try {
    const { tenantId } = req.user;
    const result = await pool.query(`
      SELECT sm.*, p.name AS product_name, w.name AS warehouse_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN warehouses w ON sm.warehouse_id = w.id
      WHERE sm.tenant_id = $1
      ORDER BY sm.created_at DESC
    `, [tenantId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('💥 [GET /movements] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب حركات المخزون' });
  }
});

// استيراد دفعة (للمسؤولين)
router.post('/bulk-import', [checkPermission('inventory', 'write')], async (req, res) => {
  try {
    const { products } = req.body; // مصفوفة منتجات
    const { tenantId } = req.user;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const prod of products) {
        await client.query(`
          INSERT INTO products (name, brand, sale_price, image_url, category_id, total_qty, tenant_id, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true)
          ON CONFLICT (name, tenant_id) DO UPDATE SET
            brand = EXCLUDED.brand,
            sale_price = EXCLUDED.sale_price,
            image_url = EXCLUDED.image_url,
            total_qty = EXCLUDED.total_qty
        `, [prod.name, prod.brand, prod.price, prod.image_url, prod.category_id, prod.total_qty, tenantId]);
      }
      await client.query('COMMIT');
      res.json({ success: true, message: 'تم استيراد المنتجات بنجاح' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('💥 [POST /bulk-import] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الاستيراد الدفعي' });
  }
});

// ------------------- EWM (Extended Warehouse Management) -------------------

// GET /api/warehouse/bins
router.get('/bins', [checkPermission('inventory', 'read')], async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { warehouse_id } = req.query;
    let query = 'SELECT * FROM storage_bins WHERE tenant_id = $1';
    const params = [tenantId];
    
    if (warehouse_id) {
      query += ' AND warehouse_id = $2';
      params.push(warehouse_id);
    }
    
    const result = await pool.query(query + ' ORDER BY zone, bin_code', params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching bins' });
  }
});

// POST /api/warehouse/bins
router.post('/bins', [checkPermission('inventory', 'write')], async (req, res) => {
  try {
    const { warehouse_id, bin_code, zone, capacity_m3 } = req.body;
    const { tenantId } = req.user;
    const result = await pool.query(
      `INSERT INTO storage_bins (warehouse_id, bin_code, zone, capacity_m3, tenant_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [warehouse_id, bin_code, zone, capacity_m3, tenantId]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating bin' });
  }
});

// POST /api/warehouse/tasks
router.post('/tasks', [checkPermission('inventory', 'write')], async (req, res) => {
  try {
    const { task_type, product_id, from_bin_id, to_bin_id, quantity } = req.body;
    const { tenantId, userId } = req.user;

    const result = await pool.query(
      `INSERT INTO warehouse_tasks (task_type, product_id, from_bin_id, to_bin_id, quantity, assigned_to, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [task_type, product_id, from_bin_id, to_bin_id, quantity, userId, tenantId]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating warehouse task' });
  }
});

module.exports = router;