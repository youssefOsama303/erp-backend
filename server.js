require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const pool       = require('./config/db');
const { authenticate } = require('./middleware/auth');

const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// ===================================
// Security & Logging
// ===================================
app.use(helmet({ contentSecurityPolicy: false }));

// ── CORS — whitelist approach (localhost & LAN allowed) ──────────────────
const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5173',
  ...(process.env.CLIENT_URL || '').split(',').map(s => s.trim()).filter(Boolean)
];

// Regex for local network IPs: 192.168.x.x, 10.x.x.x, 172.16-31.x.x
const isLanIp = (origin) => {
  if (!origin) return false;
  const ip = origin.replace(/^https?:\/\//, '').split(':')[0];
  return /^192\.168\.\d+\.\d+$/.test(ip) || 
         /^10\.\d+\.\d+\.\d+$/.test(ip) || 
         /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(ip);
};

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Postman / curl / same-origin
    if (allowedOrigins.includes(origin) || isLanIp(origin)) return cb(null, true);
    cb(new Error(`CORS: origin not allowed — ${origin}`));
  },
  credentials: true
}));


// Morgan with trace-id token
morgan.token('trace-id', (req) => req.traceId || '-');
app.use((req, _res, next) => { req.traceId = crypto.randomUUID().slice(0, 8); next(); });
app.use(morgan(':method :url :status :response-time ms - tid=:trace-id'));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===================================
// Static Files
// ===================================
app.use(express.static(path.join(__dirname, 'public')));

// Serve landing page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Serve minimal favicon to prevent 404
app.get('/favicon.ico', (_req, res) => {
  // 1x1 transparent GIF
  const ico = Buffer.from('AAABAAEAAQEAAAEAIAAwAAAAFgAAACgAAAABAAAAAgAAAAEAIAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==', 'base64');
  res.setHeader('Content-Type', 'image/x-icon');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(ico);
});

// ===================================
// Health Endpoints (public, no auth)
// ===================================
async function dbHealthCheck() {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    return { status: 'connected', latency: `${Date.now() - start}ms` };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

app.get('/health', async (req, res) => {
  const db = await dbHealthCheck();
  const ok = db.status === 'connected';
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'error',
    database: db.status,
    dbLatency: db.latency || null,
    uptime: `${Math.floor(process.uptime())}s`,
    serverTime: new Date().toISOString(),
    version: '3.2.0',
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  });
});

// Kubernetes-style liveness + readiness
app.get('/healthz',  (_req, res) => res.status(200).send('OK'));
app.get('/readiness', async (req, res) => {
  const db = await dbHealthCheck();
  res.status(db.status === 'connected' ? 200 : 503).json({ ready: db.status === 'connected', db });
});

// ===================================
// Auth Routes (بدون authenticate)
// ===================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'محاولات كثيرة جداً، انتظر 15 دقيقة' }
});
app.use('/api/auth', authLimiter, require('./routes/auth'));

// ===================================
// 5. Global API Rate Limiter + Auth
// ===================================
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  max:      parseInt(process.env.API_RATE_LIMIT_MAX      || '2000'),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests — please slow down' },
  skip: (req) => req.path.startsWith('/api/auth') // auth has its own limiter
});
app.use('/api', apiLimiter);
app.use('/api', authenticate);

// ===================================
// 6. Business Routes (مع authenticate مطبق)
// ===================================
const safeRequire = (p) => { try { return require(p); } catch { return express.Router(); } };

app.use('/api/users',      safeRequire('./routes/users'));
app.use('/api/accounting', safeRequire('./routes/accounts'));
app.use('/api/hr',         safeRequire('./routes/hr'));
app.use('/api/warehouse',  safeRequire('./routes/warehouse'));
app.use('/api/orders',     safeRequire('./routes/orders'));
app.use('/api/invoices',   safeRequire('./routes/invoices'));
app.use('/api/sales',      safeRequire('./routes/sales'));
app.use('/api/purchasing', safeRequire('./routes/purchasing'));
app.use('/api/crm',        safeRequire('./routes/crm'));
app.use('/api/projects',   safeRequire('./routes/projects'));
app.use('/api/production', safeRequire('./routes/production'));
app.use('/api/grc',        safeRequire('./routes/grc'));
app.use('/api/btp',        safeRequire('./routes/btp'));
app.use('/api/reports',    safeRequire('./routes/reports'));
app.use('/api/activity',   safeRequire('./routes/activity'));
app.use('/api/ewm',        safeRequire('./routes/ewm'));
// Settings: inline route (read/write from users + localStorage sync)
(()=>{
  const settingsRouter = express.Router();
  settingsRouter.get('/', async (req, res) => {
    try {
      const u = await pool.query('SELECT id,email,name,role FROM users WHERE id=$1',[req.user.userId]);
      res.json({ success:true, data:{ user: u.rows[0], lang:'en', currency:'EGP' } });
    } catch(e) { res.status(500).json({success:false,message:e.message}); }
  });
  app.use('/api/settings', settingsRouter);
})();

// Inline: admin self-name update (superadmin/admin only)
app.post('/api/admin/update-name', async (req, res) => {
  if (!['admin','superadmin'].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Admin only' });
  }
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: 'name required' });
  try {
    const r = await pool.query(
      `UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name`,
      [name.trim(), req.user.userId]
    );
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===================================
// 7. Menu API (ديناميكي حسب الدور)
// ===================================
app.get('/api/menu', (req, res) => {
  const { getMenuForRole } = require('./middleware/rbac');
  const menu = getMenuForRole(req.user.role);
  res.json({ success: true, data: menu, role: req.user.role });
});

// ===================================
// Admin Pages Fallback
// ===================================
app.get('/admin/*', (req, res) => {
  const fs = require('fs');
  const filePath = path.join(__dirname, 'public', req.path);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.redirect('/admin/login.html');
  }
});
// ===================================
// 404 Not Found Handler
// ===================================
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});
// ===================================
// Global Error Handler
// ===================================
app.use((err, req, res, next) => {
  console.error('💥 Server Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'خطأ داخلي في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ===================================
// Start Server
// ===================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Nexus ERP running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Login:  http://localhost:${PORT}/admin/login.html`);
});

// Trigger nodemon restart
