const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'لم يتم توفير التوكن' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // يجب أن يحتوي على: { userId, tenantId, role, email }
    console.log('🔑 Auth OK - User:', req.user.email, '| Role:', req.user.role);
    next();
  } catch (err) {
    console.error('🔴 Auth Error:', err.message);
    return res.status(401).json({ success: false, message: 'التوكن غير صالح أو منتهي الصلاحية' });
  }
};

module.exports = { authenticate };
