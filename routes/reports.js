const router = require("express").Router();
const pool = require("../config/db");
const { checkPermission } = require("../middleware/rbac");

// ── GET /api/reports/dashboard — KPIs ──────────────────────────────────────
router.get("/dashboard", checkPermission('reports', 'read'), async (req, res) => {
  try {
    const [revenues, expenses, stockAlerts, empStats, pendingLeaves] =
      await Promise.allSettled([
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

    const val = (r) => r.status === 'fulfilled' ? r.value : { rows: [{ total: 0, count: 0 }] };

    res.json({
      success:        true,
      revenue:        +(val(revenues).rows[0]?.total  || 0),
      expenses:       +(val(expenses).rows[0]?.total  || 0),
      net_profit:     +(val(revenues).rows[0]?.total  || 0) - +(val(expenses).rows[0]?.total || 0),
      stock_alerts:   val(stockAlerts).rows  || [],
      employee_stats: val(empStats).rows     || [],
      pending_leaves: +(val(pendingLeaves).rows[0]?.count || 0),
    });
  } catch (err) {
    // Never 500 — return empty structure
    res.json({
      success: true,
      revenue: 0, expenses: 0, net_profit: 0,
      stock_alerts: [], employee_stats: [], pending_leaves: 0,
      _warning: err.message
    });
  }
});

// ── GET /api/reports/monthly — Revenue & Expenses by month ────────────────
router.get("/monthly", checkPermission('reports', 'read'), async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  try {
    const [rev, exp] = await Promise.allSettled([
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
    res.json({
      success:  true,
      revenues: rev.status === 'fulfilled' ? rev.value.rows : [],
      expenses: exp.status === 'fulfilled' ? exp.value.rows : []
    });
  } catch (err) {
    res.json({ success: true, revenues: [], expenses: [], _warning: err.message });
  }
});

module.exports = router;
