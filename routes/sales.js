/**
 * /api/sales — Sales module routes (alias + extensions of /api/orders/sales)
 * Mounted at: app.use('/api/sales', require('./routes/sales'))
 */
const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { checkPermission } = require('../middleware/rbac');

// ── GET /api/sales/orders — list sales orders with graceful fallback ─────────
router.get('/orders', checkPermission('sales', 'read'), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { status, limit = 200, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    let q    = `SELECT o.*, c.name AS customer_name
                FROM sales_orders o
                LEFT JOIN customers c ON c.id = o.customer_id
                WHERE o.tenant_id = $1`;
    const v  = [tenantId];
    if (status) { q += ` AND o.status = $${v.push(status)}`; }
    q += ` ORDER BY o.date DESC LIMIT $${v.push(limit)} OFFSET $${v.push(offset)}`;

    const { rows } = await pool.query(q, v);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('💥 [GET /sales/orders]', err.message);
    // Graceful: return empty set so UI uses fallback
    res.json({ success: true, data: [], _warning: err.message });
  }
});

// ── GET /api/sales/summary — KPI summary ────────────────────────────────────
router.get('/summary', checkPermission('sales', 'read'), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)                                              AS total_orders,
        COUNT(*) FILTER (WHERE status = 'confirmed')         AS confirmed,
        COUNT(*) FILTER (WHERE status IN ('draft','confirmed','shipped')) AS open_orders,
        COALESCE(SUM(total) FILTER (WHERE status <> 'cancelled'), 0) AS total_revenue,
        COALESCE(AVG(total) FILTER (WHERE status = 'confirmed'), 0)  AS avg_order
      FROM sales_orders
      WHERE tenant_id = $1
    `, [tenantId]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.json({ success: true, data: { total_orders:0, confirmed:0, open_orders:0, total_revenue:0, avg_order:0 } });
  }
});

module.exports = router;
