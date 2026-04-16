/**
 * /api/users — User Management (Admin only)
 * Full CRUD: list, create, update role/status, delete
 */
const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const pool     = require('../config/db');
const { checkPermission } = require('../middleware/rbac');
const { validateBody }    = require('../utils/validate');

// ── GET /api/users  — list all users in tenant ────────────────────────────
router.get('/', checkPermission('settings', 'read'), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { rows } = await pool.query(
      `SELECT id, name, email, role, is_active, created_at
       FROM users
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/users/profile — current user profile ─────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, is_active, created_at
       FROM users WHERE id = $1`,
      [req.user.userId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/users — create new user (admin only) ────────────────────────
router.post('/',
  checkPermission('settings', 'write'),
  validateBody({
    name:     'required|min:2|max:100',
    email:    'required|email|max:150',
    password: 'required|min:6|max:100',
    role:     'required|in:admin,superadmin,accountant,hr,manager,sales,inventory,viewer'
  }),
  async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { name, email, password, role } = req.body;


    // Check email not already used in this tenant
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
      [email.toLowerCase().trim(), tenantId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role, is_active, tenant_id)
       VALUES ($1, $2, $3, $4, true, $5)
       RETURNING id, name, email, role, is_active, created_at`,
      [name.trim(), email.toLowerCase().trim(), hash, role, tenantId]
    );

    res.status(201).json({ success: true, data: rows[0], message: 'تم إنشاء الحساب بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/users/:id — update name/role/status ───────────────────────
router.patch('/:id', checkPermission('settings', 'write'), async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;
    const { name, role, is_active } = req.body;

    // Prevent admin from disabling themselves
    if (id === userId && is_active === false) {
      return res.status(400).json({ success: false, message: 'لا يمكنك تعطيل حسابك الخاص' });
    }

    const { rows } = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           role = COALESCE($2, role),
           is_active = COALESCE($3, is_active),
           updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5
       RETURNING id, name, email, role, is_active`,
      [name, role, is_active, id, tenantId]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    res.json({ success: true, data: rows[0], message: 'تم التحديث بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/users/:id/password — reset password (admin) ───────────────
router.patch('/:id/password', checkPermission('settings', 'write'), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rowCount } = await pool.query(
      `UPDATE users SET password = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3`,
      [hash, id, tenantId]
    );

    if (!rowCount) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/users/:id — delete user ──────────────────────────────────
router.delete('/:id', checkPermission('settings', 'write'), async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;

    if (id === userId) {
      return res.status(400).json({ success: false, message: 'لا يمكنك حذف حسابك الخاص' });
    }

    const { rowCount } = await pool.query(
      'DELETE FROM users WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (!rowCount) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
