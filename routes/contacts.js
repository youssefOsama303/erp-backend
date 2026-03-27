const router = require("express").Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

// ═══════════════════════════════════════
// 1. العملاء (Customers)
// ═══════════════════════════════════════

// عرض العملاء
router.get("/customers", auth(), async (req, res) => {
  const { search } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM customers ${search ? "WHERE name ILIKE $1 OR code ILIKE $1" : ""} ORDER BY name`,
      search ? [`%${search}%`] : []
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// إضافة أو تعديل عميل ذكي (Upsert)
router.post('/customers', async (req, res, next) => {
  try {
    const { name, phone, email, tax_number, country, state, city, zip_code, address } = req.body;
    
    // لو الواجهة باعتة كود هنستخدمه، لو مش باعتة هنعمل كود جديد
    const code = req.body.code || `CUST-${Date.now().toString().slice(-6)}`;

    // أمر الحفظ الذكي: لو الكود موجود هيعمل تعديل، لو مش موجود هيعمل إضافة
    const result = await pool.query(
      `INSERT INTO customers (code, name, phone, email, tax_number, country, state, city, zip_code, address) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (code) DO UPDATE 
       SET name = EXCLUDED.name, phone = EXCLUDED.phone, email = EXCLUDED.email, 
           tax_number = EXCLUDED.tax_number, country = EXCLUDED.country, 
           state = EXCLUDED.state, city = EXCLUDED.city, 
           zip_code = EXCLUDED.zip_code, address = EXCLUDED.address
       RETURNING *`,
      [code, name, phone, email, tax_number, country, state, city, zip_code, address]
    );
    
    res.json(result.rows[0]);
  } catch (err) { 
    next(err); 
  }
});

// تعديل بيانات عميل (دي اللي كانت ناقصة بتعمل المشكلة)
router.put('/customers/:id', async (req, res, next) => {
  try {
    const { name, phone, email, tax_number, country, state, city, zip_code, address } = req.body;
    
    const result = await pool.query(
      `UPDATE customers 
       SET name = $1, phone = $2, email = $3, tax_number = $4, country = $5, state = $6, city = $7, zip_code = $8, address = $9
       WHERE id = $10 RETURNING *`,
      [name, phone, email, tax_number, country, state, city, zip_code, address, req.params.id]
    );
    
    res.json(result.rows[0]);
  } catch (err) { 
    next(err); 
  }
});

// مسح عميل
router.delete('/customers/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.json({ message: 'تم مسح العميل' });
  } catch (err) { next(err); }
});


// ═══════════════════════════════════════
// 2. الموردين (Suppliers)
// ═══════════════════════════════════════

// عرض الموردين
router.get("/suppliers", auth(), async (req, res) => {
  const { search } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM suppliers ${search ? "WHERE name ILIKE $1 OR code ILIKE $1" : ""} ORDER BY name`,
      search ? [`%${search}%`] : []
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// إضافة مورد جديد
router.post('/suppliers', async (req, res, next) => {
  try {
    const { name, phone, email, tax_number, country, state, city, zip_code, address } = req.body;
    
    // توليد كود تلقائي للمورد لتجنب إيرور null
    const code = req.body.code || `SUPP-${Date.now().toString().slice(-6)}`;

    const result = await pool.query(
      `INSERT INTO suppliers (code, name, phone, email, tax_number, country, state, city, zip_code, address) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [code, name, phone, email, tax_number, country, state, city, zip_code, address]
    );
    
    res.json(result.rows[0]);
  } catch (err) { 
    next(err); 
  }
});

// تعديل بيانات مورد (دي برضه ضفناها للأمان)
router.put('/suppliers/:id', async (req, res, next) => {
  try {
    const { name, phone, email, tax_number, country, state, city, zip_code, address } = req.body;
    
    const result = await pool.query(
      `UPDATE suppliers 
       SET name = $1, phone = $2, email = $3, tax_number = $4, country = $5, state = $6, city = $7, zip_code = $8, address = $9
       WHERE id = $10 RETURNING *`,
      [name, phone, email, tax_number, country, state, city, zip_code, address, req.params.id]
    );
    
    res.json(result.rows[0]);
  } catch (err) { 
    next(err); 
  }
});

// مسح مورد
router.delete('/suppliers/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE id = $1', [req.params.id]);
    res.json({ message: 'تم مسح المورد' });
  } catch (err) { next(err); }
});

module.exports = router;