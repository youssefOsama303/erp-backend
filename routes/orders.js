const router = require("express").Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const { checkPermission } = require("../middleware/rbac");

router.get("/sales", [checkPermission('orders', 'read')], async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const { tenantId } = req.user;
  try {
    const { rows } = await pool.query(`
      SELECT o.*, c.name AS customer_name
      FROM sales_orders o JOIN customers c ON c.id = o.customer_id
      WHERE o.tenant_id = $1 ${status ? "AND o.status = $2" : ""}
      ORDER BY o.date DESC LIMIT $${status ? 3 : 2} OFFSET $${status ? 4 : 3}
    `, status ? [tenantId, status, limit, (page-1)*limit] : [tenantId, limit, (page-1)*limit]);
    res.json(rows);
  } catch (err) {
    console.error('💥 [GET /sales] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب بيانات المبيعات' });
  }
});

router.post("/sales", [checkPermission('sales', 'write')], async (req, res) => {
  const { customer_id, date, delivery_date, lines = [], notes } = req.body;
  if (!customer_id || !date || !lines.length)
    return res.status(400).json({ success: false, message: "بيانات العميل والبنود والتاريخ مطلوبة" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: last } = await client.query("SELECT order_number FROM sales_orders ORDER BY id DESC LIMIT 1");
    const lastNum = last[0] ? parseInt(last[0].order_number.split("-")[2] || 0) : 0;
    const order_number = `SO-${new Date().getFullYear()}-${String(lastNum+1).padStart(3,"0")}`;
    const subtotal = lines.reduce((s,l) => s + l.quantity * l.unit_price, 0);
    const total = subtotal * 1.14;
    const { rows } = await client.query(`
      INSERT INTO sales_orders (order_number, customer_id, date, delivery_date, subtotal, tax_amount, total, notes, created_by, tenant_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [order_number, customer_id, date, delivery_date, subtotal, subtotal*0.14, total, notes, req.user.id, req.user.tenantId]);
    for (const l of lines) {
      await client.query(
        "INSERT INTO sales_order_lines (order_id, product_id, quantity, unit_price, total) VALUES ($1,$2,$3,$4,$5)",
        [rows[0].id, l.product_id, l.quantity, l.unit_price, l.quantity * l.unit_price]
      );
    }
    await client.query("COMMIT");
    res.status(201).json({ success: true, message: 'تم إنشاء طلب البيع بنجاح', data: rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error('💥 [POST /sales] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم أثناء إنشاء الطلب' });
  } finally {
    client.release();
  }
});

router.get("/purchases", [checkPermission('purchasing', 'read')], async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const { tenantId } = req.user;
  try {
    const { rows } = await pool.query(`
      SELECT o.*, s.name AS supplier_name
      FROM purchase_orders o JOIN suppliers s ON s.id = o.supplier_id
      WHERE o.tenant_id = $1 ${status ? "AND o.status = $2" : ""}
      ORDER BY o.date DESC LIMIT $${status ? 3 : 2} OFFSET $${status ? 4 : 3}
    `, status ? [tenantId, status, limit, (page-1)*limit] : [tenantId, limit, (page-1)*limit]);
    res.json(rows);
  } catch (err) {
    console.error('💥 [GET /purchases] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب بيانات المشتريات' });
  }
});

router.post("/purchases", [checkPermission('purchasing', 'write')], async (req, res) => {
  const { supplier_id, date, expected_date, lines = [], notes } = req.body;
  const { tenantId } = req.user;
  if (!supplier_id || !date || !lines.length)
    return res.status(400).json({ message: "البيانات والبنود مطلوبة" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: last } = await client.query("SELECT order_number FROM purchase_orders WHERE tenant_id = $1 ORDER BY id DESC LIMIT 1", [tenantId]);
    const lastNum = last[0] ? parseInt(last[0].order_number.split("-")[2] || 0) : 0;
    const order_number = `PO-${new Date().getFullYear()}-${String(lastNum+1).padStart(3,"0")}`;
    const subtotal = lines.reduce((s,l) => s + l.quantity * l.unit_price, 0);
    const total = subtotal * 1.14; // Unify tax to 14%
    const { rows } = await client.query(`
      INSERT INTO purchase_orders (order_number, supplier_id, date, expected_date, subtotal, tax_amount, total, notes, created_by, tenant_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [order_number, supplier_id, date, expected_date, subtotal, subtotal*0.14, total, notes, req.user.id, tenantId]);
    for (const l of lines) {
      await client.query(
        "INSERT INTO purchase_order_lines (order_id, product_id, quantity, unit_price, total) VALUES ($1,$2,$3,$4,$5)",
        [rows[0].id, l.product_id, l.quantity, l.unit_price, l.quantity * l.unit_price]
      );
    }
    await client.query("COMMIT");
    res.status(201).json({ success: true, message: 'تم إنشاء أمر الشراء بنجاح', data: rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error('💥 [POST /purchases] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم أثناء إنشاء أمر الشراء' });
  } finally {
    client.release();
  }
});

router.patch("/purchases/:id/status", [checkPermission('purchasing', 'write')], async (req, res) => {
  const { status } = req.body;
  const { tenantId } = req.user;
  try {
    const { rows } = await pool.query(
      "UPDATE purchase_orders SET status=$1 WHERE id=$2 AND tenant_id=$3 RETURNING *", [status, req.params.id, tenantId]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: "الأمر غير موجود أو تابع لشركة أخرى" });
    res.json({ success: true, message: 'تم تحديث حالة أمر الشراء بنجاح', data: rows[0] });
  } catch (err) {
    console.error('💥 [PATCH /purchases/status] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
  }
});

// تحديث حالة أمر البيع
router.patch('/sales/:id/status', [checkPermission('orders', 'write')], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { tenantId } = req.user;
    const result = await pool.query('UPDATE sales_orders SET status = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *', [status, id, tenantId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'الأمر غير موجود أو تابع لشركة أخرى' });
    res.json({ success: true, message: 'تم تحديث حالة طلب البيع بنجاح', data: result.rows[0] });
  } catch (err) {
    console.error('💥 [PATCH /sales/status] Error:', err);
    res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
  }
});

module.exports = router;
