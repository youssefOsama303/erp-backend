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
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id             SERIAL PRIMARY KEY,
        tenant_id      TEXT NOT NULL,
        po_number      TEXT,
        supplier_name  TEXT NOT NULL,
        description    TEXT,
        total_amount   NUMERIC(14,2) DEFAULT 0,
        status         TEXT NOT NULL DEFAULT 'open',
        expected_date  DATE,
        created_by     TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_po_tenant ON purchase_orders(tenant_id)`);
    // Safely add any missing columns from older schema
    await pool.query(`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tenant_id TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS po_number TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS created_by TEXT`).catch(() => {});

    const { rows } = await pool.query(`SELECT COUNT(*) as count FROM purchase_orders`);
    if (parseInt(rows[0].count, 10) === 0) {
      console.log('🛒 Seeding initial purchase orders into database...');
      // Get real tenant UUID from DB
      const tRes = await pool.query(`SELECT id FROM tenants WHERE slug = 'nexus-demo' LIMIT 1`);
      const tenantId = tRes.rows[0]?.id;
      if (!tenantId) { console.warn('⚠️ [Purchasing] Tenant not found — skipping seed'); ready = true; return; }
      await pool.query(`
        INSERT INTO purchase_orders (tenant_id, po_number, supplier_name, description, total_amount, status, expected_date) VALUES
        ($1, 'PO-3042', 'Al-Amal Paper Co.', 'A4 Paper & Office Supplies', 45000, 'shipped', CURRENT_DATE + INTERVAL '5 days'),
        ($1, 'PO-3045', 'Tech Systems Ltd', 'Server Hardware - Dell PowerEdge', 120000, 'received', CURRENT_DATE - INTERVAL '1 days'),
        ($1, 'PO-3048', 'Al-Nahda Industrial', 'Steel Pipes & Fittings', 78500, 'open', CURRENT_DATE + INTERVAL '12 days'),
        ($1, 'PO-3051', 'Cairo Electric Co.', 'Electrical Components', 34200, 'open', CURRENT_DATE + INTERVAL '7 days')
      `, [tenantId]);
    }
    ready = true;
  } catch(e) { console.warn('⚠️ [Purchasing] Table setup failed:', e.message); }
}

// GET /api/purchasing/orders
router.get('/orders', checkPermission('purchasing', 'read'), async (req, res) => {
  try {
    await ensureTables();
    const { tenantId } = req.user;
    const result = await pool.query(
      `SELECT * FROM purchase_orders WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.json({ success: false, data: [], message: err.message });
  }
});


// POST /api/purchasing/orders
router.post('/orders', checkPermission('purchasing', 'write'), async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { supplier_name, description, total_amount, expected_date } = req.body;
    const poNumber = 'PO-' + Date.now().toString().slice(-6);
    const result = await pool.query(
      `INSERT INTO purchase_orders
         (po_number, supplier_name, description, total_amount, expected_date, status, tenant_id, created_by)
       VALUES ($1,$2,$3,$4,$5,'open',$6,$7)
       RETURNING *`,
      [poNumber, supplier_name, description, total_amount, expected_date, tenantId, userId]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    // Table might not exist — return graceful error
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
