const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { checkPermission } = require('../middleware/rbac');
const contacts = require('./contacts');

// ── Auto-create crm_leads table ─────────────────────────────────────────────
let leadsTableReady = false;
async function ensureLeadsTable() {
  if (leadsTableReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS crm_leads (
        id              SERIAL PRIMARY KEY,
        tenant_id       TEXT NOT NULL,
        name            TEXT NOT NULL,
        company         TEXT,
        email           TEXT,
        phone           TEXT,
        stage           TEXT NOT NULL DEFAULT 'new',
        estimated_value NUMERIC(14,2) DEFAULT 0,
        owner_id        TEXT,
        notes           TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_crm_leads_tenant ON crm_leads(tenant_id)`);
    leadsTableReady = true;
  } catch(e) {
    console.warn('⚠️ [CRM/leads] Table auto-create failed:', e.message);
  }
}

// ── GET /api/crm/leads ──────────────────────────────────────────────────────
router.get('/leads', checkPermission('crm', 'read'), async (req, res) => {
  try {
    await ensureLeadsTable();
    const { tenantId } = req.user;
    const { stage, q } = req.query;
    let sql   = `SELECT * FROM crm_leads WHERE tenant_id = $1`;
    const vals = [tenantId];
    if (stage) { sql += ` AND stage = $${vals.push(stage)}`; }
    if (q)     { sql += ` AND (name ILIKE $${vals.push('%'+q+'%')} OR company ILIKE $${vals.length})`; }
    sql += ` ORDER BY created_at DESC LIMIT 100`;
    const { rows } = await pool.query(sql, vals);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('💥 [CRM/leads] GET error:', err.message);
    res.json({ success: true, data: [], _warning: err.message });
  }
});

// ── POST /api/crm/leads ─────────────────────────────────────────────────────
router.post('/leads', checkPermission('crm', 'write'), async (req, res) => {
  try {
    await ensureLeadsTable();
    const { tenantId, userId } = req.user;
    const { name, company, email, phone, stage = 'new', estimated_value = 0, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'name required' });
    const { rows } = await pool.query(
      `INSERT INTO crm_leads (tenant_id, name, company, email, phone, stage, estimated_value, owner_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [tenantId, name, company, email, phone, stage, estimated_value, userId, notes]
    );
    res.json({ success: true, data: rows[0] });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/crm/leads/:id ────────────────────────────────────────────────
router.patch('/leads/:id', checkPermission('crm', 'write'), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { stage, estimated_value, notes } = req.body;
    const { rows } = await pool.query(
      `UPDATE crm_leads SET
         stage           = COALESCE($1, stage),
         estimated_value = COALESCE($2, estimated_value),
         notes           = COALESCE($3, notes),
         updated_at      = NOW()
       WHERE id = $4 AND tenant_id = $5
       RETURNING *`,
      [stage, estimated_value, notes, req.params.id, tenantId]
    );
    if (!rows.length) return res.status(404).json({ success:false, message:'Lead not found' });
    res.json({ success: true, data: rows[0] });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── DELETE /api/crm/leads/:id ───────────────────────────────────────────────
router.delete('/leads/:id', checkPermission('crm', 'delete'), async (req, res) => {
  try {
    const { tenantId } = req.user;
    await pool.query(`DELETE FROM crm_leads WHERE id=$1 AND tenant_id=$2`, [req.params.id, tenantId]);
    res.json({ success: true, message: 'Lead deleted' });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── Mount contacts routes (customers/accounts) ──────────────────────────────
router.use('/', contacts);

module.exports = router;
