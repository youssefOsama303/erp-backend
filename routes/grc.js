const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { checkPermission } = require('../middleware/rbac');

// ── Auto-create grc_risks table on first use ────────────────────────────────
let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grc_risks (
        id              SERIAL PRIMARY KEY,
        tenant_id       TEXT NOT NULL,
        code            TEXT,
        title           TEXT,
        category        TEXT NOT NULL DEFAULT 'Operational',
        owner_id        TEXT,
        likelihood      INTEGER NOT NULL DEFAULT 3,
        impact          INTEGER NOT NULL DEFAULT 3,
        status          TEXT NOT NULL DEFAULT 'open',
        mitigation_plan TEXT,
        next_review_at  TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    // Safely add any columns added after initial table creation
    await pool.query(`ALTER TABLE grc_risks ADD COLUMN IF NOT EXISTS title TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE grc_risks ADD COLUMN IF NOT EXISTS code TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE grc_risks ADD COLUMN IF NOT EXISTS owner_id TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE grc_risks ADD COLUMN IF NOT EXISTS mitigation_plan TEXT`).catch(() => {});
    await pool.query(`ALTER TABLE grc_risks ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMPTZ`).catch(() => {});
    await pool.query(`ALTER TABLE grc_risks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`).catch(() => {});
    // Add score column safely
    await pool.query(`
      ALTER TABLE grc_risks ADD COLUMN IF NOT EXISTS score INTEGER
        GENERATED ALWAYS AS (likelihood * impact) STORED
    `).catch(() => {});
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_grc_risks_tenant ON grc_risks(tenant_id)`);

    // ── Seed initial risks if empty ──
    const { rows } = await pool.query(`SELECT COUNT(*) as count FROM grc_risks`);
    if (parseInt(rows[0].count, 10) === 0) {
      console.log('🛡️ Seeding initial GRC risks into database...');
      // Get real tenant UUID — don't hardcode the slug as UUID
      const tRes = await pool.query(`SELECT id FROM tenants WHERE slug = 'nexus-demo' LIMIT 1`);
      const tenantId = tRes.rows[0]?.id;
      if (!tenantId) { console.warn('⚠️ [GRC] Tenant nexus-demo not found — skipping seed'); return; }
      await pool.query(`
        INSERT INTO grc_risks (tenant_id, code, title, category, likelihood, impact, status, mitigation_plan) VALUES
        ($1, 'R-1002', 'Liquidity Risk', 'Financial', 4, 3, 'In Treatment', 'Establish credit line with 3 banks'),
        ($1, 'R-1005', 'Privileged Access Abuse', 'IT', 5, 5, 'open', 'Implement PAM solution & quarterly access review'),
        ($1, 'R-1008', 'GDPR Compliance Gap', 'Compliance', 2, 4, 'Monitoring', 'Data mapping project underway'),
        ($1, 'R-1011', 'Key Person Dependency', 'Operational', 3, 4, 'open', 'Cross-training program initiated')
      `, [tenantId]);
    }

    tableReady = true;
  } catch (e) {
    console.warn('⚠️ [GRC] Table auto-create failed:', e.message);
  }
}

// ── GET /api/grc/risks ──────────────────────────────────────────────────────
router.get('/risks', checkPermission('grc', 'read'), async (req, res) => {
  try {
    await ensureTable();
    const { tenantId } = req.user;
    const result = await pool.query(
      `SELECT *, COALESCE(likelihood * impact, 0) AS computed_score
       FROM grc_risks
       WHERE tenant_id = $1
       ORDER BY likelihood * impact DESC, created_at DESC`,
      [tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('💥 [GRC/risks] Error:', err.message);
    // Return empty set instead of 500 — UI uses fallback
    res.json({ success: true, data: [], _warning: err.message });
  }
});

// ── POST /api/grc/risks ─────────────────────────────────────────────────────
router.post('/risks', checkPermission('grc', 'write'), async (req, res) => {
  try {
    await ensureTable();
    const { tenantId, userId } = req.user;
    const {
      code, title, category = 'Operational',
      likelihood = 3, impact = 3,
      mitigation_plan, next_review_at
    } = req.body;

    const autoCode = code || `R-${Date.now().toString().slice(-6)}`;
    const autoTitle = title || `Risk ${autoCode}`;

    const result = await pool.query(
      `INSERT INTO grc_risks
         (tenant_id, code, title, category, owner_id, likelihood, impact, mitigation_plan, next_review_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *, likelihood * impact AS computed_score`,
      [tenantId, autoCode, autoTitle, category, userId, likelihood, impact, mitigation_plan, next_review_at || null]
    );
    res.json({ success: true, message: 'Risk registered', data: result.rows[0] });
  } catch (err) {
    console.error('💥 [GRC/risks] Create Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/grc/risks/:id ───────────────────────────────────────────────
router.delete('/risks/:id', checkPermission('grc', 'delete'), async (req, res) => {
  try {
    const { tenantId } = req.user;
    await pool.query(`DELETE FROM grc_risks WHERE id=$1 AND tenant_id=$2`, [req.params.id, tenantId]);
    res.json({ success: true, message: 'Risk deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/grc/controls ───────────────────────────────────────────────────
router.get('/controls', checkPermission('grc', 'read'), async (req, res) => {
  try {
    const { tenantId } = req.user;

    // Try compliance_controls table; gracefully fallback
    const result = await pool.query(
      `SELECT * FROM compliance_controls WHERE tenant_id = $1 LIMIT 50`,
      [tenantId]
    ).catch(() => ({ rows: [] }));

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

module.exports = router;
