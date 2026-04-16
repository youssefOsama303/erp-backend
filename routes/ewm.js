/**
 * routes/ewm.js — EWM (Extended Warehouse Management) API
 * Endpoints:
 *   GET  /api/ewm/warehouses
 *   GET  /api/ewm/bins         ?warehouse_id=&section_code=&status=
 *   GET  /api/ewm/bins/:id
 *   GET  /api/ewm/tasks        ?status=&type=&limit=
 *   PATCH /api/ewm/tasks/:id/status
 *   POST  /api/ewm/tasks
 *   GET  /api/ewm/heatmap      (bin occupancy data for visualization)
 *   GET  /api/ewm/stock        ?bin_code=
 *   POST /api/ewm/seed-demo    (superadmin only, EWM_SEED guard)
 */

const router  = require('express').Router();
const pool    = require('../config/db');
const { checkPermission } = require('../middleware/rbac');

// ── Helper: superadmin guard ──────────────────────────────────────────────
const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'superadmin' && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Superadmin required' });
  }
  next();
};

// ─────────────────────────────────────────────────────────────────────────
// GET /api/ewm/warehouses
// ─────────────────────────────────────────────────────────────────────────
router.get('/warehouses', checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT w.*,
              COUNT(DISTINCT et.id) AS storage_type_count,
              COUNT(DISTINCT eb.id) AS bin_count
       FROM ewm_warehouses w
       LEFT JOIN ewm_storage_types et ON et.warehouse_id = w.id
       LEFT JOIN ewm_storage_sections es ON es.storage_type_id = et.id
       LEFT JOIN ewm_bins eb ON eb.section_id = es.id
       WHERE w.tenant_id = $1
       GROUP BY w.id
       ORDER BY w.code`,
      [req.user.tenantId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[EWM /warehouses]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/ewm/bins  — with full hierarchy info + stock occupancy
// ─────────────────────────────────────────────────────────────────────────
router.get('/bins', checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const { warehouse_code, section_code, status, limit = 200 } = req.query;

    let q = `
      SELECT
        b.*,
        sec.code  AS section_code, sec.name AS section_name,
        st.code   AS storage_type_code, st.name AS storage_type_name, st.temperature_zone,
        wh.code   AS warehouse_code, wh.name AS warehouse_name,
        COALESCE(SUM(s.qty * m.weight_kg), 0) AS stock_kg,
        COUNT(s.id)                            AS sku_count
      FROM ewm_bins b
      JOIN ewm_storage_sections sec ON sec.id = b.section_id
      JOIN ewm_storage_types    st  ON st.id  = sec.storage_type_id
      JOIN ewm_warehouses       wh  ON wh.id  = st.warehouse_id
      LEFT JOIN ewm_stock       s   ON s.bin_id = b.id AND s.tenant_id = $1
      LEFT JOIN ewm_materials   m   ON m.id = s.material_id
      WHERE b.tenant_id = $1
    `;
    const params = [req.user.tenantId];
    let i = 2;

    if (warehouse_code) { q += ` AND wh.code = $${i++}`; params.push(warehouse_code); }
    if (section_code)   { q += ` AND sec.code = $${i++}`; params.push(section_code); }
    if (status)         { q += ` AND b.status = $${i++}`; params.push(status); }

    q += ` GROUP BY b.id, sec.code, sec.name, st.code, st.name, st.temperature_zone, wh.code, wh.name
           ORDER BY wh.code, sec.code, b.bin_code
           LIMIT $${i}`;
    params.push(limit);

    const { rows } = await pool.query(q, params);

    // Compute occupancy % for each bin
    const data = rows.map(b => ({
      ...b,
      occupancy_pct: b.capacity_kg > 0
        ? Math.min(100, Math.round((Number(b.stock_kg) / Number(b.capacity_kg)) * 100))
        : 0
    }));

    res.json({ success: true, data, total: data.length });
  } catch (err) {
    console.error('[EWM /bins]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/ewm/bins/:id — detail + full stock list
// ─────────────────────────────────────────────────────────────────────────
router.get('/bins/:id', checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*,
              sec.code AS section_code, sec.name AS section_name,
              st.name AS storage_type_name, wh.name AS warehouse_name
       FROM ewm_bins b
       JOIN ewm_storage_sections sec ON sec.id = b.section_id
       JOIN ewm_storage_types st     ON st.id  = sec.storage_type_id
       JOIN ewm_warehouses wh        ON wh.id  = st.warehouse_id
       WHERE b.id = $1 AND b.tenant_id = $2`,
      [req.params.id, req.user.tenantId]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Bin not found' });

    const { rows: stock } = await pool.query(
      `SELECT s.*, m.sku, m.name AS material_name, m.weight_kg
       FROM ewm_stock s JOIN ewm_materials m ON m.id = s.material_id
       WHERE s.bin_id = $1 AND s.tenant_id = $2`,
      [req.params.id, req.user.tenantId]
    );

    res.json({ success: true, data: { ...rows[0], stock } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/ewm/heatmap — compact occupancy map for visualizer
// ─────────────────────────────────────────────────────────────────────────
router.get('/heatmap', checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const { warehouse_code } = req.query;
    let q = `
      SELECT
        b.bin_code, b.x, b.y, b.z, b.rotation_deg, b.capacity_kg, b.status,
        sec.code AS section_code, st.temperature_zone,
        wh.code  AS warehouse_code,
        COALESCE(SUM(s.qty * m.weight_kg), 0)                              AS stock_kg,
        LEAST(100, ROUND(COALESCE(SUM(s.qty * m.weight_kg),0) / NULLIF(b.capacity_kg,0) * 100)) AS occupancy_pct
      FROM ewm_bins b
      JOIN ewm_storage_sections sec ON sec.id = b.section_id
      JOIN ewm_storage_types    st  ON st.id  = sec.storage_type_id
      JOIN ewm_warehouses       wh  ON wh.id  = st.warehouse_id
      LEFT JOIN ewm_stock       s   ON s.bin_id = b.id AND s.tenant_id = $1
      LEFT JOIN ewm_materials   m   ON m.id = s.material_id
      WHERE b.tenant_id = $1
    `;
    const params = [req.user.tenantId];
    if (warehouse_code) { q += ` AND wh.code = $2`; params.push(warehouse_code); }
    q += ' GROUP BY b.id, sec.code, st.temperature_zone, wh.code ORDER BY b.x, b.y, b.z';

    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/ewm/tasks
// ─────────────────────────────────────────────────────────────────────────
router.get('/tasks', checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const { status, type, limit = 50 } = req.query;
    let q = `
      SELECT t.*,
             bf.bin_code AS from_bin_code, bt.bin_code AS to_bin_code,
             m.sku, m.name AS material_name
      FROM ewm_tasks t
      LEFT JOIN ewm_bins      bf ON bf.id = t.bin_from_id
      LEFT JOIN ewm_bins      bt ON bt.id = t.bin_to_id
      LEFT JOIN ewm_materials m  ON m.id  = t.material_id
      WHERE t.tenant_id = $1
    `;
    const params = [req.user.tenantId];
    let i = 2;
    if (status) { q += ` AND t.status = $${i++}`; params.push(status); }
    if (type)   { q += ` AND t.task_type = $${i++}`; params.push(type); }
    q += ` ORDER BY t.priority ASC, t.created_at DESC LIMIT $${i}`;
    params.push(limit);

    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/ewm/tasks — create a new putaway / picking task
// ─────────────────────────────────────────────────────────────────────────
router.post('/tasks', checkPermission('inventory', 'write'), async (req, res) => {
  try {
    const { task_type, bin_from_id, bin_to_id, material_id, qty, priority, assigned_to, eta_minutes, notes } = req.body;
    if (!task_type || !qty) return res.status(400).json({ success: false, message: 'task_type and qty required' });

    const { rows } = await pool.query(
      `INSERT INTO ewm_tasks (task_type,bin_from_id,bin_to_id,material_id,qty,priority,assigned_to,eta_minutes,notes,tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [task_type, bin_from_id||null, bin_to_id||null, material_id||null, qty, priority||3, assigned_to||null, eta_minutes||null, notes||null, req.user.tenantId]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// PATCH /api/ewm/tasks/:id/status — advance task status
// ─────────────────────────────────────────────────────────────────────────
router.patch('/tasks/:id/status', checkPermission('inventory', 'write'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['open', 'in_progress', 'done', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const completedAt = status === 'done' ? new Date() : null;
    const { rows } = await pool.query(
      `UPDATE ewm_tasks SET status=$1, completed_at=$2 WHERE id=$3 AND tenant_id=$4 RETURNING *`,
      [status, completedAt, req.params.id, req.user.tenantId]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/ewm/stock  — current stock across all bins
// ─────────────────────────────────────────────────────────────────────────
router.get('/stock', checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const { bin_code, sku } = req.query;
    let q = `
      SELECT s.*, b.bin_code, m.sku, m.name AS material_name, m.uom
      FROM ewm_stock s
      JOIN ewm_bins      b ON b.id = s.bin_id
      JOIN ewm_materials m ON m.id = s.material_id
      WHERE s.tenant_id = $1
    `;
    const params = [req.user.tenantId];
    let i = 2;
    if (bin_code) { q += ` AND b.bin_code = $${i++}`; params.push(bin_code); }
    if (sku)      { q += ` AND m.sku = $${i++}`;      params.push(sku); }
    q += ' ORDER BY b.bin_code, m.sku';

    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/ewm/seed-demo — superadmin only, loads synthetic data
// Auto-runs the EWM migration first to ensure tables exist
// ─────────────────────────────────────────────────────────────────────────
router.post('/seed-demo', requireSuperAdmin, async (req, res) => {
  try {
    // Step 1: ensure EWM tables exist (idempotent — uses CREATE TABLE IF NOT EXISTS)
    const fs   = require('fs');
    const path = require('path');
    const migrationFile = path.join(__dirname, '../db/migration-ewm-v3-2.sql');
    if (fs.existsSync(migrationFile)) {
      const sql = fs.readFileSync(migrationFile, 'utf8');
      await pool.query(sql);
      console.log('[EWM] Migration tables ensured');
    }

    // Step 2: seed the data
    const { seedEWM } = require('../seeds/seed_ewm_synthetic');
    const result = await seedEWM(req.user.tenantId, pool);
    res.json({
      success: true,
      message: 'EWM demo data loaded successfully',
      counts: result.counts
    });
  } catch (err) {
    console.error('[EWM /seed-demo]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
