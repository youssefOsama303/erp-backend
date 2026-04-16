/**
 * /api/projects — Project Management routes
 * Auto-creates tables if they don't exist.
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
      CREATE TABLE IF NOT EXISTS projects (
        id          SERIAL PRIMARY KEY,
        tenant_id   TEXT NOT NULL,
        code        TEXT,
        name        TEXT NOT NULL,
        description TEXT,
        status      TEXT NOT NULL DEFAULT 'planning',
        priority    TEXT NOT NULL DEFAULT 'medium',
        start_date  DATE,
        end_date    DATE,
        budget      NUMERIC(14,2) DEFAULT 0,
        spent       NUMERIC(14,2) DEFAULT 0,
        progress    INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
        owner_id    TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_tasks (
        id          SERIAL PRIMARY KEY,
        project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title       TEXT NOT NULL,
        assignee    TEXT,
        status      TEXT NOT NULL DEFAULT 'todo',
        due_date    DATE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id)`);

    // ── Seed Initial Data if empty ──
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM projects');
    if (parseInt(rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial projects into database...');
      const tenantId = 'nexus-demo';
      await pool.query(`
        INSERT INTO projects (tenant_id, code, name, description, status, budget, progress, start_date, end_date) VALUES
        ($1, 'PRJ-101', 'تطوير القطاع الشرقي', 'مشروع توسعة البنية التحتية', 'active', 500000, 75, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '90 days'),
        ($1, 'PRJ-102', 'منصة المبيعات B2B', 'منصة الكترونية للتجار', 'active', 250000, 60, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '45 days'),
        ($1, 'PRJ-103', 'ترحيل خوادم البيانات Cloud', 'بنية سحابية جديدة', 'planning', 800000, 10, CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '120 days'),
        ($1, 'PRJ-104', 'تكامل SAP EWM', 'ربط المخازن الخارجية', 'completed', 1200000, 100, CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '2 days')
      `, [tenantId]);
    }
    
    ready = true;
  } catch(e) {
    console.warn('⚠️ [Projects] Table setup failed:', e.message);
  }
}

// ── GET /api/projects ──────────────────────────────────────────────────────
router.get('/', checkPermission('projects', 'read'), async (req, res) => {
  try {
    await ensureTables();
    const { tenantId } = req.user;
    const { rows } = await pool.query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM project_tasks WHERE project_id = p.id) AS task_count,
              (SELECT COUNT(*) FROM project_tasks WHERE project_id = p.id AND status = 'done') AS done_count
       FROM projects p WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [tenantId]
    );
    res.json({ success: true, data: rows });
  } catch(err) {
    res.json({ success: true, data: [], _warning: err.message });
  }
});

// ── POST /api/projects ─────────────────────────────────────────────────────
router.post('/', checkPermission('projects', 'write'), async (req, res) => {
  try {
    await ensureTables();
    const { tenantId, userId } = req.user;
    const { name, description, status = 'planning', priority = 'medium',
            start_date, end_date, budget = 0 } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'name required' });

    const code = 'PRJ-' + Date.now().toString().slice(-5);
    const { rows } = await pool.query(
      `INSERT INTO projects (tenant_id, code, name, description, status, priority, start_date, end_date, budget, owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [tenantId, code, name, description, status, priority, start_date || null, end_date || null, budget, userId]
    );
    res.json({ success: true, data: rows[0] });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/projects/:id ────────────────────────────────────────────────
router.patch('/:id', checkPermission('projects', 'write'), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { status, progress, spent } = req.body;
    const { rows } = await pool.query(
      `UPDATE projects SET
         status     = COALESCE($1, status),
         progress   = COALESCE($2, progress),
         spent      = COALESCE($3, spent),
         updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5 RETURNING *`,
      [status, progress, spent, req.params.id, tenantId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── DELETE /api/projects/:id ───────────────────────────────────────────────
router.delete('/:id', checkPermission('projects', 'delete'), async (req, res) => {
  try {
    const { tenantId } = req.user;
    await pool.query(`DELETE FROM projects WHERE id=$1 AND tenant_id=$2`, [req.params.id, tenantId]);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/projects/:id/tasks ────────────────────────────────────────────
router.get('/:id/tasks', checkPermission('projects', 'read'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM project_tasks WHERE project_id = $1 ORDER BY created_at`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch(err) {
    res.json({ success: true, data: [] });
  }
});

module.exports = router;
