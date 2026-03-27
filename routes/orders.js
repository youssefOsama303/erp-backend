const router = require("express").Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

router.get("/sales", auth(), async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  try {
    const { rows } = await pool.query(`
      SELECT o.*, c.name AS customer_name
      FROM sales_orders o JOIN customers c ON c.id = o.customer_id
      ${status ? "WHERE o.status = $1" : ""}
      ORDER BY o.date DESC LIMIT $${status ? 2 : 1} OFFSET $${status ? 3 : 2}
    `, status ? [status, limit, (page-1)*limit] : [limit, (page-1)*limit]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/sales", auth(["admin","sales"]), async (req, res) => {
  const { customer_id, date, delivery_date, lines = [], notes } = req.body;
  if (!customer_id || !date || !lines.length)
    return res.status(400).json({ message: "البيانات والبنود مطلوبة" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: last } = await client.query("SELECT order_number FROM sales_orders ORDER BY id DESC LIMIT 1");
    const lastNum = last[0] ? parseInt(last[0].order_number.split("-")[2] || 0) : 0;
    const order_number = `SO-${new Date().getFullYear()}-${String(lastNum+1).padStart(3,"0")}`;
    const subtotal = lines.reduce((s,l) => s + l.quantity * l.unit_price, 0);
    const total = subtotal * 1.15;
    const { rows } = await client.query(`
      INSERT INTO sales_orders (order_number, customer_id, date, delivery_date, subtotal, tax_amount, total, notes, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [order_number, customer_id, date, delivery_date, subtotal, subtotal*0.15, total, notes, req.user.id]);
    for (const l of lines) {
      await client.query(
        "INSERT INTO sales_order_lines (order_id, product_id, quantity, unit_price, total) VALUES ($1,$2,$3,$4,$5)",
        [rows[0].id, l.product_id, l.quantity, l.unit_price, l.quantity * l.unit_price]
      );
    }
    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
});

router.get("/purchases", auth(), async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  try {
    const { rows } = await pool.query(`
      SELECT o.*, s.name AS supplier_name
      FROM purchase_orders o JOIN suppliers s ON s.id = o.supplier_id
      ${status ? "WHERE o.status = $1" : ""}
      ORDER BY o.date DESC LIMIT $${status ? 2 : 1} OFFSET $${status ? 3 : 2}
    `, status ? [status, limit, (page-1)*limit] : [limit, (page-1)*limit]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/purchases", auth(["admin","warehouse"]), async (req, res) => {
  const { supplier_id, date, expected_date, lines = [], notes } = req.body;
  if (!supplier_id || !date || !lines.length)
    return res.status(400).json({ message: "البيانات والبنود مطلوبة" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: last } = await client.query("SELECT order_number FROM purchase_orders ORDER BY id DESC LIMIT 1");
    const lastNum = last[0] ? parseInt(last[0].order_number.split("-")[2] || 0) : 0;
    const order_number = `PO-${new Date().getFullYear()}-${String(lastNum+1).padStart(3,"0")}`;
    const subtotal = lines.reduce((s,l) => s + l.quantity * l.unit_price, 0);
    const total = subtotal * 1.15;
    const { rows } = await client.query(`
      INSERT INTO purchase_orders (order_number, supplier_id, date, expected_date, subtotal, tax_amount, total, notes, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [order_number, supplier_id, date, expected_date, subtotal, subtotal*0.15, total, notes, req.user.id]);
    for (const l of lines) {
      await client.query(
        "INSERT INTO purchase_order_lines (order_id, product_id, quantity, unit_price, total) VALUES ($1,$2,$3,$4,$5)",
        [rows[0].id, l.product_id, l.quantity, l.unit_price, l.quantity * l.unit_price]
      );
    }
    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
});

router.patch("/purchases/:id/status", auth(["admin","warehouse"]), async (req, res) => {
  const { status } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE purchase_orders SET status=$1 WHERE id=$2 RETURNING *", [status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "الأمر غير موجود" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// تحديث حالة أمر البيع
router.patch('/sales/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE sales_orders SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'تم تحديث الحالة بنجاح' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
