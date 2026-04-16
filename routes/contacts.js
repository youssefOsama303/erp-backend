const router = require("express").Router();
const pool = require("../config/db");
const { checkPermission } = require("../middleware/rbac");

// ═══════════════════════════════════════
// 1. العملاء (Customers)
// ═══════════════════════════════════════

// عرض العملاء
router.get("/customers", [checkPermission('crm', 'read')], async (req, res) => {
  const { search } = req.query;
  const { tenantId } = req.user;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM customers WHERE tenant_id = $1 ${search ? "AND (name ILIKE $2 OR code ILIKE $2)" : ""} ORDER BY name`,
      search ? [tenantId, `%${search}%`] : [tenantId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('💥 [GET /customers] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب بيانات العملاء' });
  }
});

// إضافة أو تعديل عميل ذكي (Upsert)
router.post('/customers', [checkPermission('crm', 'write')], async (req, res, next) => {
  try {
    const { name, phone, email, tax_number, country, state, city, zip_code, address } = req.body;
    const { tenantId } = req.user;
    
    // لو الواجهة باعتة كود هنستخدمه، لو مش باعتة هنعمل كود جديد
    const code = req.body.code || `CUST-${Date.now().toString().slice(-6)}`;

    // أمر الحفظ الذكي: لو الكود موجود هيعمل تعديل، لو مش موجود هيعمل إضافة
    const result = await pool.query(
      `INSERT INTO customers (code, name, phone, email, tax_number, country, state, city, zip_code, address, tenant_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (code, tenant_id) DO UPDATE 
       SET name = EXCLUDED.name, phone = EXCLUDED.phone, email = EXCLUDED.email, 
           tax_number = EXCLUDED.tax_number, country = EXCLUDED.country, 
           state = EXCLUDED.state, city = EXCLUDED.city, 
           zip_code = EXCLUDED.zip_code, address = EXCLUDED.address
       RETURNING *`,
      [code, name, phone, email, tax_number, country, state, city, zip_code, address, tenantId]
    );
    
    res.json({ success: true, message: 'تم حفظ بيانات العميل بنجاح', data: result.rows[0] });
  } catch (err) {
    console.error('💥 [POST /customers] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم أثناء حفظ العميل' });
  }
});

// تعديل بيانات عميل
router.put('/customers/:id', [checkPermission('crm', 'write')], async (req, res, next) => {
  try {
    const { name, phone, email, tax_number, country, state, city, zip_code, address } = req.body;
    const { tenantId } = req.user;
    
    const result = await pool.query(
      `UPDATE customers 
       SET name = $1, phone = $2, email = $3, tax_number = $4, country = $5, state = $6, city = $7, zip_code = $8, address = $9
       WHERE id = $10 AND tenant_id = $11 RETURNING *`,
      [name, phone, email, tax_number, country, state, city, zip_code, address, req.params.id, tenantId]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'العميل غير موجود أو تابع لشركة أخرى' });
    res.json({ success: true, message: 'تم تحديث بيانات العميل بنجاح', data: result.rows[0] });
  } catch (err) {
    console.error('💥 [PUT /customers/:id] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
  }
});

// مسح عميل
router.delete('/customers/:id', [checkPermission('crm', 'delete')], async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const result = await pool.query('DELETE FROM customers WHERE id = $1 AND tenant_id = $2 RETURNING id', [req.params.id, tenantId]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    res.json({ success: true, message: 'تم مسح العميل' });
  } catch (err) {
    console.error('💥 [DELETE /customers/:id] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حذف العميل' });
  }
});


// ═══════════════════════════════════════
// 2. الموردين (Suppliers)
// ═══════════════════════════════════════

// عرض الموردين
router.get("/suppliers", [checkPermission('purchasing', 'read')], async (req, res) => {
  const { search } = req.query;
  const { tenantId } = req.user;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM suppliers WHERE tenant_id = $1 ${search ? "AND (name ILIKE $2 OR code ILIKE $2)" : ""} ORDER BY name`,
      search ? [tenantId, `%${search}%`] : [tenantId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('💥 [GET /suppliers] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب بيانات الموردين' });
  }
});

// إضافة مورد جديد
router.post('/suppliers', [checkPermission('purchasing', 'write')], async (req, res, next) => {
  try {
    const { name, phone, email, tax_number, country, state, city, zip_code, address } = req.body;
    const { tenantId } = req.user;
    
    // توليد كود تلقائي للمورد لتجنب إيرور null
    const code = req.body.code || `SUPP-${Date.now().toString().slice(-6)}`;

    const result = await pool.query(
      `INSERT INTO suppliers (code, name, phone, email, tax_number, country, state, city, zip_code, address, tenant_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [code, name, phone, email, tax_number, country, state, city, zip_code, address, tenantId]
    );
    
    res.json({ success: true, message: 'تم إضافة المورد بنجاح', data: result.rows[0] });
  } catch (err) {
    console.error('💥 [POST /suppliers] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
  }
});

// تعديل بيانات مورد
router.put('/suppliers/:id', [checkPermission('purchasing', 'write')], async (req, res, next) => {
  try {
    const { name, phone, email, tax_number, country, state, city, zip_code, address } = req.body;
    const { tenantId } = req.user;
    
    const result = await pool.query(
      `UPDATE suppliers 
       SET name = $1, phone = $2, email = $3, tax_number = $4, country = $5, state = $6, city = $7, zip_code = $8, address = $9
       WHERE id = $10 AND tenant_id = $11 RETURNING *`,
      [name, phone, email, tax_number, country, state, city, zip_code, address, req.params.id, tenantId]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'المورد غير موجود أو تابع لشركة أخرى' });
    res.json({ success: true, message: 'تم تحديث بيانات المورد بنجاح', data: result.rows[0] });
  } catch (err) {
    console.error('💥 [PUT /suppliers/:id] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
  }
});

// مسح مورد
router.delete('/suppliers/:id', [checkPermission('purchasing', 'delete')], async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 AND tenant_id = $2 RETURNING id', [req.params.id, tenantId]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'المورد غير موجود' });
    res.json({ success: true, message: 'تم مسح المورد' });
  } catch (err) {
    console.error('💥 [DELETE /suppliers/:id] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حذف المورد' });
  }
});

module.exports = router;