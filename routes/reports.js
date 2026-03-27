const router = require("express").Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

router.get("/dashboard", auth(), async (req, res) => {
  try {
    const [revenues, expenses, stockAlerts, empStats, pendingLeaves] =
      await Promise.all([
        pool.query("SELECT COALESCE(SUM(total),0) AS total FROM invoices WHERE status='مدفوعة'"),
        pool.query("SELECT COALESCE(SUM(total),0) AS total FROM purchase_orders WHERE status='مُستلَم'"),
        pool.query(`
          SELECT p.id, p.code, p.name, p.min_quantity, COALESCE(SUM(s.quantity),0) AS qty
          FROM products p LEFT JOIN stock s ON s.product_id = p.id
          WHERE p.is_active = true
          GROUP BY p.id
          HAVING COALESCE(SUM(s.quantity),0) <= p.min_quantity
        `),
        pool.query("SELECT status, COUNT(*) AS count FROM employees GROUP BY status"),
        pool.query("SELECT COUNT(*) AS count FROM leave_requests WHERE status='معلقة'"),
      ]);
    res.json({
      revenue:        +revenues.rows[0].total,
      expenses:       +expenses.rows[0].total,
      net_profit:     +revenues.rows[0].total - +expenses.rows[0].total,
      stock_alerts:   stockAlerts.rows,
      employee_stats: empStats.rows,
      pending_leaves: +pendingLeaves.rows[0].count,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/monthly", auth(), async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  try {
    const [rev, exp] = await Promise.all([
      pool.query(`
        SELECT to_char(date,'YYYY-MM') AS month, SUM(total) AS amount
        FROM invoices WHERE EXTRACT(YEAR FROM date)=$1 AND status='مدفوعة'
        GROUP BY month ORDER BY month
      `, [year]),
      pool.query(`
        SELECT to_char(date,'YYYY-MM') AS month, SUM(total) AS amount
        FROM purchase_orders WHERE EXTRACT(YEAR FROM date)=$1 AND status='مُستلَم'
        GROUP BY month ORDER BY month
      `, [year]),
    ]);
    res.json({ revenues: rev.rows, expenses: exp.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
