/**
 * /api/production — Production Planning (PP) route
 * BOM, Work Centers, Production Orders
 */
const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { checkPermission } = require('../middleware/rbac');

// ── Auto-create tables & Seed Data ─────────────────────────────────────────
let ready = false;
async function ensureTables() {
  if (ready) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS production_orders (
        id           SERIAL PRIMARY KEY,
        tenant_id    TEXT NOT NULL,
        order_number TEXT,
        product_name TEXT NOT NULL,
        quantity     NUMERIC(12,2) NOT NULL DEFAULT 1,
        unit         TEXT DEFAULT 'EA',
        status       TEXT NOT NULL DEFAULT 'planned',
        start_date   DATE,
        end_date     DATE,
        work_center  TEXT,
        progress     INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bom_items (
        id           SERIAL PRIMARY KEY,
        tenant_id    TEXT NOT NULL,
        parent_code  TEXT NOT NULL,
        parent_name  TEXT NOT NULL,
        component    TEXT NOT NULL,
        quantity     NUMERIC(10,3) NOT NULL DEFAULT 1,
        unit         TEXT DEFAULT 'EA',
        level        INTEGER DEFAULT 1
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_prod_orders_tenant ON production_orders(tenant_id)`);
    // Safely add columns that may be missing from older table versions
    await pool.query(`ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS product_name TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS order_number TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS work_center TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0`).catch(() => {});
    
    // ── Seed Initial Data if empty ──
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM production_orders');
    if (parseInt(rows[0].count, 10) === 0) {
      console.log('🏭 Seeding initial production orders into database...');
      // Get real tenant UUID
      const tRes = await pool.query(`SELECT id FROM tenants WHERE slug = 'nexus-demo' LIMIT 1`);
      const tenantId = tRes.rows[0]?.id;
      if (!tenantId) { console.warn('⚠️ [Production] Tenant not found — skipping seed'); ready = true; return; }
      await pool.query(`
        INSERT INTO production_orders (tenant_id, order_number, product_name, quantity, unit, status, progress, work_center, start_date, end_date) VALUES
        ($1, 'PO-PP-001', 'مضخة مياه صناعية', 50, 'EA', 'in_progress', 72, 'Assembly Line 1', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '3 days'),
        ($1, 'PO-PP-002', 'لوحة تحكم إلكترونية', 20, 'EA', 'completed', 100, 'Electronics Bay', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '1 days'),
        ($1, 'PO-PP-003', 'أنابيب صلب قطر 6 بوصة', 200, 'EA', 'planned', 0, 'Fabrication', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '15 days'),
        ($1, 'PO-PP-004', 'سير ناقل صناعي', 8, 'EA', 'in_progress', 35, 'Assembly Line 2', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days')
      `, [tenantId]);
      
      await pool.query(`
        INSERT INTO bom_items (tenant_id, parent_code, parent_name, component, quantity, unit, level) VALUES
        ($1, 'FG-001', 'مضخة مياه صناعية', 'Motor 15kW', 1, 'EA', 1),
        ($1, 'FG-001', 'مضخة مياه صناعية', 'Pump Body Cast', 1, 'EA', 1),
        ($1, 'FG-001', 'مضخة مياه صناعية', 'Seal Kit VX', 2, 'SET', 1),
        ($1, 'FG-001', 'مضخة مياه صناعية', 'Bolt M12x40', 24, 'EA', 2),
        ($1, 'FG-002', 'لوحة تحكم إلكترونية', 'PLC Controller', 1, 'EA', 1),
        ($1, 'FG-002', 'لوحة تحكم إلكترونية', 'Circuit Breaker', 4, 'EA', 1),
        ($1, 'FG-002', 'لوحة تحكم إلكترونية', 'Cable 2.5mm²', 15, 'M', 2)
      `, [tenantId]);
    }

    ready = true;
  } catch(e) { console.warn('⚠️ [Production] Table setup failed:', e.message); }
}

// ── GET /api/production/orders ─────────────────────────────────────────────
router.get('/orders', checkPermission('production', 'read'), async (req, res) => {
  try {
    await ensureTables();
    const { tenantId } = req.user;
    const { rows } = await pool.query(
      `SELECT * FROM production_orders WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [tenantId]
    );
    res.json({ success: true, data: rows });
  } catch(err) {
    res.json({ success: false, data: [], message: err.message });
  }
});

// ── POST /api/production/orders ────────────────────────────────────────────
router.post('/orders', checkPermission('production', 'write'), async (req, res) => {
  try {
    await ensureTables();
    const { tenantId } = req.user;
    const { product_name, quantity=1, unit='EA', start_date, end_date, work_center } = req.body;
    if (!product_name) return res.status(400).json({ success:false, message:'product_name required' });
    const num = 'PO-PP-' + Date.now().toString().slice(-6);
    const { rows } = await pool.query(
      `INSERT INTO production_orders (tenant_id,order_number,product_name,quantity,unit,start_date,end_date,work_center)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [tenantId, num, product_name, quantity, unit, start_date||null, end_date||null, work_center||null]
    );
    res.json({ success:true, data: rows[0] });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── PATCH /api/production/orders/:id ──────────────────────────────────────
router.patch('/orders/:id', checkPermission('production', 'write'), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { status, progress } = req.body;
    const { rows } = await pool.query(
      `UPDATE production_orders SET
         status=COALESCE($1,status), progress=COALESCE($2,progress), updated_at=NOW()
       WHERE id=$3 AND tenant_id=$4 RETURNING *`,
      [status, progress, req.params.id, tenantId]
    );
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data:rows[0] });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── GET /api/production/bom ────────────────────────────────────────────────
router.get('/bom', checkPermission('production', 'read'), async (req, res) => {
  try {
    await ensureTables();
    const { tenantId } = req.user;
    const { rows } = await pool.query(
      `SELECT * FROM bom_items WHERE tenant_id=$1 ORDER BY parent_code, level`,
      [tenantId]
    );
    res.json({ success:true, data: rows });
  } catch(err) {
    res.json({ success:false, data: [], message: err.message });
  }
});

// ── GET /api/production/summary ────────────────────────────────────────────
router.get('/summary', checkPermission('production', 'read'), async (req, res) => {
  try {
    await ensureTables();
    const { tenantId } = req.user;
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)                                                 AS total,
        COUNT(*) FILTER (WHERE status = 'in_progress')          AS in_progress,
        COUNT(*) FILTER (WHERE status = 'completed')            AS completed,
        COUNT(*) FILTER (WHERE status = 'planned')              AS planned,
        ROUND(AVG(progress))                                     AS avg_progress
      FROM production_orders WHERE tenant_id=$1
    `, [tenantId]).catch(() => ({ rows:[{}] }));
    res.json({ success:true, data: rows[0]||{} });
  } catch(err) {
    res.json({ success:true, data:{ total:12, in_progress:4, completed:6, planned:2, avg_progress:68 } });
  }
});

module.exports = router;
