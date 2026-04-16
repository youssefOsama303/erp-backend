const jwt = require("jsonwebtoken");

/**
 * authCustomer — verifies JWT and ensures role === 'customer'
 * Used by website routes (register, login, orders, etc.)
 */
module.exports = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token)
    return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "customer")
      return res.status(403).json({ message: "غير مصرح لك بهذه العملية" });
    req.customer = decoded;   // { id, name, role }
    next();
  } catch {
    return res.status(401).json({ message: "الجلسة منتهية، يرجى تسجيل الدخول مجدداً" });
  }
};
