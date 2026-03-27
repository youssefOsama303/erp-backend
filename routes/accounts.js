const router = require('express').Router();
const pool = require('../config/db'); // تأكد إن مسار الـ db صح

// إضافة حساب جديد
router.post('/', async (req, res, next) => {
  try {
    const { code, name, type, nature, balance } = req.body;
    await pool.query(
      'INSERT INTO accounts (code, name, type, nature, balance) VALUES ($1, $2, $3, $4, $5)',
      [code, name, type, nature, balance]
    );
    res.json({ message: 'تم إضافة الحساب بنجاح' });
  } catch (err) {
    next(err);
  }
});

// عرض الحسابات (عشان الجدول يشتغل لو مش موجود)
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM accounts ORDER BY code');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;