const jwt = require("jsonwebtoken");

const auth = (roles = []) => {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer "))
      return res.status(401).json({ message: "غير مصرح" });

    const token = header.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      if (roles.length && !roles.includes(decoded.role))
        return res.status(403).json({ message: "ليس لديك صلاحية" });
      next();
    } catch {
      return res.status(401).json({ message: "الجلسة منتهية" });
    }
  };
};

module.exports = auth;
