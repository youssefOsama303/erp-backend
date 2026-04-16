const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { validateBody } = require('../utils/validate');

router.post('/login', validateBody({
  email: 'required|email',
  password: 'required|min:6',
  tenant_slug: 'required'
}), async (req, res) => {
  const { email, password, tenant_slug } = req.body;



  try {
    // get tenant
    let tenantRes = await pool.query('SELECT * FROM tenants WHERE slug = $1', [tenant_slug]);
    if (tenantRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'كود الشركة غير صحيح' });
    }
    let tenant = tenantRes.rows[0];

    // get user
    let userRes = await pool.query('SELECT * FROM users WHERE email = $1 AND tenant_id = $2', [email, tenant.id]);
    let user;
    let isMatch = false;

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني غير مسجل في هذه الشركة' });
    } else {
      user = userRes.rows[0];
      // check password
      isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
         return res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });
      }
    }

    const payload = {
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
      email: user.email
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Split `name` field into firstName/lastName for frontend compatibility
    const nameParts = (user.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName  = nameParts.slice(1).join(' ') || '';

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, role: user.role, firstName, lastName, name: user.name },
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, language: tenant.default_language }
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
  }
});

router.post('/refresh-token', validateBody({ refreshToken: 'required' }), async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const payload = { userId: decoded.userId, tenantId: decoded.tenantId, role: decoded.role, email: decoded.email };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, accessToken });
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid refresh token' });
  }
});

module.exports = router;
