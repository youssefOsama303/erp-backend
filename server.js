require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const helmet   = require("helmet");
const rateLimit = require("express-rate-limit");
const path     = require("path");

const app = express();

// ══════════════════════════════════════════════
//  SECURITY MIDDLEWARE
// ══════════════════════════════════════════════

// Helmet - HTTP security headers
app.use(helmet({
  contentSecurityPolicy: false, // نوقفه عشان CDN scripts تشتغل
  crossOriginEmbedderPolicy: false,
}));

// CORS - السماح للـ frontend فقط
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://127.0.0.1:5500", // السطر ده ضفناه علشان متجر يوسف
  "http://localhost:5500"  // وده كمان لزيادة التأكيد
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("CORS: Origin not allowed"));
  },
  credentials: true,
}));

// Rate Limiting - الحماية من الـ brute force
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 200,
  message: { message: "طلبات كثيرة جداً، يرجى المحاولة لاحقاً" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 محاولات فقط للـ login
  message: { message: "محاولات تسجيل دخول كثيرة، يرجى الانتظار 15 دقيقة" },
  skipSuccessfulRequests: true,
});

app.use("/api", generalLimiter);
app.use("/api/auth/login", authLimiter);

// Body Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ══════════════════════════════════════════════
//  STATIC FILES (Frontend)
// ══════════════════════════════════════════════
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: "1d",
  etag: true
}));

app.use('/uploads', express.static('uploads'));

// ══════════════════════════════════════════════
//  API ROUTES
// ══════════════════════════════════════════════
app.use("/api/auth",      require("./routes/auth"));
app.use("/api/invoices",  require("./routes/invoices"));
app.use("/api/orders",    require("./routes/orders"));
app.use("/api/warehouse", require("./routes/warehouse"));
app.use("/api/hr",        require("./routes/hr"));
app.use("/api/reports",   require("./routes/reports"));
app.use("/api",           require("./routes/contacts"));
app.use("/api/accounts", require("./routes/accounts"));
app.use("/api/locations", require("./routes/locations"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/website", require("./routes/website"));

// Health check
app.get("/api/health", (_req, res) => res.json({
  status: "ok",
  time: new Date(),
  uptime: process.uptime(),
  version: "1.0.0"
}));

// ══════════════════════════════════════════════
//  SPA FALLBACK - كل route يرجع لـ index.html
// ══════════════════════════════════════════════
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  }
});

// ══════════════════════════════════════════════
//  ERROR HANDLERS
// ══════════════════════════════════════════════
app.use((_req, res) => res.status(404).json({ message: "المسار غير موجود" }));

app.use((err, _req, res, _next) => {
  // لا تكشف تفاصيل الأخطاء في الـ production
  const isDev = process.env.NODE_ENV !== "production";
  console.error("❌ Server Error:", err.message);
  res.status(err.status || 500).json({
    message: isDev ? err.message : "خطأ داخلي في الخادم",
    ...(isDev && { stack: err.stack })
  });
});

// ══════════════════════════════════════════════
//  START
// ══════════════════════════════════════════════
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 ERP API running on port ${PORT}`);
    console.log(`🔒 Security: Helmet + Rate Limiting enabled`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}\n`);
});
