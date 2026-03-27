const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const auth = require("../middleware/auth");

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "البريد وكلمة المرور مطلوبان" });
  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND is_active = true", [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "بيانات غير صحيحة" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "بيانات غير صحيحة" });
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", auth(), async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1", [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// مسار سريع لإضافة مستخدمين للتجربة
router.post('/add-user', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    // تشفير كلمة المرور (تأكد إن مكتبة التشفير اللي عندك اسمها كده)
    const bcrypt = require('bcryptjs'); 
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // لو متغير الداتا بيز عندك فوق اسمه client أو db غير كلمة pool
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      [name, email, hashedPassword, role]
    );
    
    res.json({ message: 'تم إنشاء الحساب بنجاح' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
