const router = require("express").Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

router.get("/", auth(), async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  try {
    const { rows } = await pool.query(`
      SELECT i.*, c.name AS customer_name
      FROM invoices i JOIN customers c ON c.id = i.customer_id
      ${status ? "WHERE i.status = $1" : ""}
      ORDER BY i.date DESC LIMIT $${status ? 2 : 1} OFFSET $${status ? 3 : 2}
    `, status ? [status, limit, (page-1)*limit] : [limit, (page-1)*limit]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", auth(), async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT i.*, c.name AS customer_name FROM invoices i JOIN customers c ON c.id = i.customer_id WHERE i.id = $1",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "الفاتورة غير موجودة" });
    const { rows: lines } = await pool.query(
      "SELECT * FROM invoice_lines WHERE invoice_id = $1", [req.params.id]
    );
    res.json({ ...rows[0], lines });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", auth(["admin","accountant","sales"]), async (req, res) => {
  const { customer_id, date, due_date, lines = [], tax_rate = 14, withholding_tax = 0, discount = 0, notes, status = 'معلقة' } = req.body;
  if (!customer_id || !date || !lines.length)
    return res.status(400).json({ message: "البيانات والبنود مطلوبة" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: last } = await client.query("SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1");
    const lastNum = last[0] ? parseInt(last[0].invoice_number.split("-")[2] || 0) : 0;
    const invoice_number = `INV-${new Date().getFullYear()}-${String(lastNum+1).padStart(3,"0")}`;
    const subtotal = lines.reduce((s,l) => s + l.quantity * l.unit_price, 0);
    const tax_amount = (subtotal - discount) * (tax_rate / 100);
    const wht_amount = subtotal * (withholding_tax / 100);
    const total = subtotal - discount + tax_amount - wht_amount;
    const { rows } = await client.query(`
  INSERT INTO invoices (invoice_number, customer_id, date, due_date, subtotal, tax_rate, tax_amount, withholding_tax, discount, total, notes, status, created_by)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
`, [invoice_number, customer_id, date, due_date, subtotal, tax_rate, tax_amount, withholding_tax, discount, total, notes, status, req.user.id]);
    for (const line of lines) {
  // تسجيل البند في الفاتورة
  await client.query(
    "INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, total) VALUES ($1,$2,$3,$4,$5,$6)",
    [rows[0].id, line.product_id || null, line.description, line.quantity, line.unit_price, line.quantity * line.unit_price]
  );

  // السحر هنا: الخصم التلقائي من كمية المنتج في المخزن (لو المنتج متسجل في الداتا بيز)
  if (line.product_id) {
    await client.query(
      "UPDATE products SET total_qty = total_qty - $1 WHERE id = $2",
      [line.quantity, line.product_id]
    );
  }
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

router.patch("/:id/status", auth(["admin","accountant"]), async (req, res) => {
  const { status } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE invoices SET status=$1 WHERE id=$2 RETURNING *", [status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "الفاتورة غير موجودة" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// جلب تفاصيل فاتورة للطباعة
router.get('/:id', async (req, res, next) => {
  try {
    const inv = await pool.query(`
      SELECT i.*, c.name as customer_name, c.tax_number, c.city 
      FROM invoices i JOIN customers c ON i.customer_id = c.id 
      WHERE i.id = $1`, [req.params.id]);

    if (inv.rows.length === 0) return res.status(404).json({ message: 'الفاتورة غير موجودة' });

    const lines = await pool.query('SELECT * FROM invoice_lines WHERE invoice_id = $1', [req.params.id]);
    res.json({ ...inv.rows[0], lines: lines.rows });
  } catch (err) { next(err); }
});

module.exports = router;
