# 🧠 NEXUS ERP — MASTER PROMPT v3.0 (COMPLETE + FIXES)
### نسخة شاملة — تشمل البناء الكامل + إصلاح جميع الأخطاء المعروفة
### للاستخدام مع: Replit AI / Google AI Studio / Cursor / GPT-4 / Claude
---

> **⚠️ تعليمات للـ AI Agent — اقرأ أولاً:**
> 1. اقرأ هذا الملف كاملاً قبل أي تنفيذ
> 2. افحص الملفات الموجودة في المشروع أولاً قبل إنشاء أي ملف جديد
> 3. نفّذ الخطوات **بالترتيب المذكور** ولا تتجاوز أي خطوة
> 4. إذا واجهت خطأً، أوقف وأخبر المستخدم بالتفصيل
> 5. لا تحذف بيانات موجودة في قاعدة البيانات

---

## 📌 خلفية المشروع

- **الاسم:** Nexus ERP
- **النوع:** نظام ERP متعدد المستأجرين (Multi-Tenant) — يضاهي Oracle ERP
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL (مكتبة `pg`)
- **Auth:** JWT + bcrypt
- **Frontend:** Vanilla HTML + Tailwind CSS + Vanilla JS
- **المنفذ:** 5000
- **مجلد الواجهة:** `public/admin/`
- **الأدوار:** `superadmin`, `admin`, `accountant`, `hr`, `inventory_manager`, `sales_manager`, `purchasing_manager`, `viewer`

---

## 📁 هيكل المجلدات المطلوب

```
nexus-erp/  (أو ep-backend/)
├── server.js                          ← نقطة الدخول الرئيسية
├── package.json
├── .env
├── config/
│   └── db.js                          ← اتصال PostgreSQL
├── middleware/
│   ├── auth.js                        ← التحقق من JWT → يضيف req.user
│   └── rbac.js                        ← التحكم في الصلاحيات
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── accounting.js
│   ├── hr.js
│   ├── warehouse.js                   ← المخزون والمنتجات
│   ├── orders.js                      ← الطلبات
│   ├── invoices.js                    ← الفواتير
│   ├── sales.js
│   ├── purchasing.js
│   ├── crm.js
│   ├── projects.js
│   ├── reports.js
│   └── settings.js
├── public/
│   ├── index.html                     ← يعيد توجيه إلى /admin/login.html
│   └── admin/
│       ├── login.html
│       ├── dashboard.html
│       ├── health.html
│       ├── accounting.html
│       ├── hr.html
│       ├── inventory.html
│       ├── sales.html
│       ├── purchasing.html
│       ├── crm.html
│       ├── projects.html
│       ├── reports.html
│       └── settings.html
│   └── js/
│       ├── api.js                     ← طلبات HTTP مع interceptor
│       ├── auth.js                    ← تسجيل الدخول والخروج
│       ├── admin.js                   ← منطق Dashboard
│       └── utils.js                   ← دوال مشتركة + RBAC أمامي
├── seeds/
│   └── seed.js
├── migrations/
│   └── 001_schema.sql
└── FIXES_SUMMARY.md
```

---

## 🔧 المرحلة 1: إصلاح المشاكل المعروفة (ابدأ هنا أولاً)

### ❌ المشكلة 1: `index.html` غير موجود

**الخطأ:**
```
Server Error: ENOENT: no such file or directory, stat '/public/index.html'
```

**السبب:** `express.static('public')` يبحث عن `index.html` في جذر `public/` لكن الملف في `public/admin/`

**الحل في `server.js`:**
```javascript
// بعد سطر express.static
app.use(express.static(path.join(__dirname, 'public')));

// أضف هذا السطر
app.get('/', (req, res) => {
  res.redirect('/admin/login.html');
});

// fallback للمسارات غير الموجودة
app.get('/admin/*', (req, res) => {
  const filePath = path.join(__dirname, 'public', req.path);
  const fs = require('fs');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.redirect('/admin/login.html');
  }
});
```

---

### ❌ المشكلة 2: أخطاء 403 Forbidden

**الخطأ:**
```
GET /api/orders/sales     → 403 Forbidden
GET /api/warehouse/products → 403 Forbidden
```

**السبب:** middleware الصلاحيات يمنع حتى الـ admin، أو الترتيب خاطئ، أو `req.user.role` فارغ

**الإصلاح الكامل:**

#### أ) `middleware/auth.js` — التحقق من التوكن
```javascript
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
```

#### ب) `middleware/rbac.js` — الصلاحيات الكاملة
```javascript
// ======================================
// جدول الصلاحيات الكامل
// ======================================
const PERMISSIONS = {
  superadmin: { all: true },

  admin: {
    dashboard:  ['read'],
    accounting: ['read', 'write', 'delete'],
    hr:         ['read', 'write', 'delete'],
    inventory:  ['read', 'write', 'delete'],
    sales:      ['read', 'write', 'delete'],
    purchasing: ['read', 'write', 'delete'],
    crm:        ['read', 'write', 'delete'],
    projects:   ['read', 'write', 'delete'],
    reports:    ['read', 'export'],
    users:      ['read', 'write', 'delete'],
    settings:   ['read', 'write'],
    orders:     ['read', 'write', 'delete'],  // ← مهم
    warehouse:  ['read', 'write', 'delete'],  // ← مهم
    invoices:   ['read', 'write', 'delete']   // ← مهم
  },

  manager: {
    dashboard:  ['read'],
    accounting: ['read'],
    hr:         ['read', 'write'],
    inventory:  ['read', 'write', 'delete'],
    sales:      ['read', 'write', 'delete'],
    purchasing: ['read', 'write', 'delete'],
    crm:        ['read', 'write'],
    projects:   ['read', 'write'],
    reports:    ['read'],
    orders:     ['read', 'write'],
    warehouse:  ['read', 'write'],
    invoices:   ['read', 'write']
  },

  accountant: {
    dashboard:  ['read'],
    accounting: ['read', 'write', 'delete'],
    sales:      ['read'],
    purchasing: ['read'],
    reports:    ['read', 'export'],
    invoices:   ['read', 'write', 'delete'],
    orders:     ['read']
  },

  hr: {
    dashboard: ['read'],
    hr:        ['read', 'write', 'delete'],
    reports:   ['read']
  },

  inventory_manager: {
    dashboard:  ['read'],
    inventory:  ['read', 'write', 'delete'],
    purchasing: ['read', 'write'],
    reports:    ['read'],
    warehouse:  ['read', 'write', 'delete'],
    orders:     ['read']
  },

  sales_manager: {
    dashboard:  ['read'],
    sales:      ['read', 'write', 'delete'],
    crm:        ['read', 'write', 'delete'],
    inventory:  ['read'],
    reports:    ['read'],
    orders:     ['read', 'write', 'delete'],
    invoices:   ['read', 'write']
  },

  purchasing_manager: {
    dashboard:  ['read'],
    purchasing: ['read', 'write', 'delete'],
    inventory:  ['read', 'write'],
    reports:    ['read'],
    warehouse:  ['read', 'write'],
    orders:     ['read', 'write']
  },

  employee: {
    dashboard:  ['read'],
    inventory:  ['read'],
    sales:      ['read'],
    orders:     ['read'],
    warehouse:  ['read']
  },

  viewer: {
    dashboard:  ['read'],
    accounting: ['read'],
    hr:         ['read'],
    inventory:  ['read'],
    sales:      ['read'],
    purchasing: ['read'],
    crm:        ['read'],
    projects:   ['read'],
    reports:    ['read'],
    orders:     ['read'],
    warehouse:  ['read'],
    invoices:   ['read']
  }
};

// ======================================
// Middleware التحقق من الصلاحيات
// ======================================
const checkPermission = (module, action) => {
  return (req, res, next) => {
    // تأكد أن authenticate شغال قبل هذا
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'غير مصرح — لم يتم التحقق من الهوية' });
    }

    const role = req.user.role;
    console.log(`🛡️ RBAC Check: role="${role}" | module="${module}" | action="${action}"`);

    if (!role) {
      return res.status(403).json({ success: false, message: 'دور المستخدم غير محدد في التوكن' });
    }

    const rolePerms = PERMISSIONS[role];
    if (!rolePerms) {
      return res.status(403).json({ success: false, message: `الدور "${role}" غير موجود في نظام الصلاحيات` });
    }

    // superadmin له كل شيء
    if (rolePerms.all === true) {
      console.log('✅ RBAC: superadmin — access granted');
      return next();
    }

    const modulePerms = rolePerms[module];
    if (modulePerms && modulePerms.includes(action)) {
      console.log(`✅ RBAC: access granted (${role} → ${module}:${action})`);
      return next();
    }

    console.log(`❌ RBAC: access DENIED (${role} → ${module}:${action})`);
    return res.status(403).json({
      success: false,
      message: `ليس لديك صلاحية "${action}" في وحدة "${module}"`,
      role,
      module,
      action
    });
  };
};

// ======================================
// دالة مساعدة: القائمة حسب الدور
// ======================================
const getMenuForRole = (role) => {
  const ALL_MENU = [
    { id: 'dashboard',  label_ar: 'لوحة التحكم',    label_en: 'Dashboard',    icon: '⊞', url: '/admin/dashboard.html' },
    { id: 'accounting', label_ar: 'المحاسبة',        label_en: 'Accounting',   icon: '💰', url: '/admin/accounting.html' },
    { id: 'hr',         label_ar: 'الموارد البشرية', label_en: 'HR',           icon: '👥', url: '/admin/hr.html' },
    { id: 'inventory',  label_ar: 'المخزون',          label_en: 'Inventory',    icon: '📦', url: '/admin/inventory.html' },
    { id: 'sales',      label_ar: 'المبيعات',         label_en: 'Sales',        icon: '🛒', url: '/admin/sales.html' },
    { id: 'purchasing', label_ar: 'المشتريات',        label_en: 'Purchasing',   icon: '🚚', url: '/admin/purchasing.html' },
    { id: 'crm',        label_ar: 'العملاء CRM',      label_en: 'CRM',          icon: '❤️', url: '/admin/crm.html' },
    { id: 'projects',   label_ar: 'المشاريع',         label_en: 'Projects',     icon: '📋', url: '/admin/projects.html' },
    { id: 'reports',    label_ar: 'التقارير',          label_en: 'Reports',      icon: '📊', url: '/admin/reports.html' },
    { id: 'settings',   label_ar: 'الإعدادات',        label_en: 'Settings',     icon: '⚙️', url: '/admin/settings.html' }
  ];

  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return [];
  if (rolePerms.all) return ALL_MENU;
  return ALL_MENU.filter(item => rolePerms[item.id]);
};

module.exports = { checkPermission, getMenuForRole, PERMISSIONS };
```

#### ج) ترتيب Middleware في `server.js` — **هذا هو الأهم**
```javascript
const { authenticate } = require('./middleware/auth');
const { checkPermission } = require('./middleware/rbac');

// ✅ الترتيب الصحيح:
// 1. Static files (بدون auth)
app.use(express.static(path.join(__dirname, 'public')));

// 2. Health check (بدون auth — مفتوح للجميع)
app.get('/health', async (req, res) => { /* ... */ });

// 3. Auth routes (بدون auth — هي المسؤولة عن التوكن)
app.use('/api/auth', require('./routes/auth'));

// 4. باقي API routes (مع authenticate أولاً)
app.use('/api', authenticate); // ← يُطبق على جميع /api/* ما عدا /api/auth

// 5. باقي الـ routes (authenticate اتطبق بالفعل)
app.use('/api/users',      require('./routes/users'));
app.use('/api/accounting', require('./routes/accounting'));
app.use('/api/hr',         require('./routes/hr'));
app.use('/api/warehouse',  require('./routes/warehouse'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/invoices',   require('./routes/invoices'));
app.use('/api/sales',      require('./routes/sales'));
app.use('/api/purchasing', require('./routes/purchasing'));
app.use('/api/crm',        require('./routes/crm'));
app.use('/api/projects',   require('./routes/projects'));
app.use('/api/reports',    require('./routes/reports'));
app.use('/api/settings',   require('./routes/settings'));

// 6. Menu API
app.get('/api/menu', (req, res) => {
  const { getMenuForRole } = require('./middleware/rbac');
  const menu = getMenuForRole(req.user.role);
  res.json({ success: true, data: menu });
});
```

#### د) مثال على `routes/warehouse.js` بعد الإصلاح
```javascript
const express = require('express');
const router = express.Router();
const { checkPermission } = require('../middleware/rbac');
const { pool } = require('../config/db');

// GET /api/warehouse/products
router.get('/products',
  checkPermission('warehouse', 'read'),  // ← authenticate تطبق بالفعل في server.js
  async (req, res) => {
    try {
      const { tenantId } = req.user;
      const result = await pool.query(
        'SELECT * FROM products WHERE tenant_id = $1 AND is_active = TRUE ORDER BY created_at DESC',
        [tenantId]
      );
      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('warehouse/products error:', err);
      res.status(500).json({ success: false, message: 'خطأ في جلب المنتجات' });
    }
  }
);

// GET /api/warehouse/stock
router.get('/stock',
  checkPermission('warehouse', 'read'),
  async (req, res) => {
    try {
      const { tenantId } = req.user;
      const result = await pool.query(`
        SELECT p.name_ar, p.sku, sl.quantity, sl.reserved_quantity, w.name_ar as warehouse
        FROM stock_levels sl
        JOIN products p ON sl.product_id = p.id
        JOIN warehouses w ON sl.warehouse_id = w.id
        WHERE sl.tenant_id = $1
        ORDER BY sl.quantity ASC
      `, [tenantId]);
      res.json({ success: true, data: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, message: 'خطأ في جلب المخزون' });
    }
  }
);

module.exports = router;
```

#### هـ) مثال على `routes/orders.js` بعد الإصلاح
```javascript
const express = require('express');
const router = express.Router();
const { checkPermission } = require('../middleware/rbac');
const { pool } = require('../config/db');

// GET /api/orders/sales
router.get('/sales',
  checkPermission('orders', 'read'),
  async (req, res) => {
    try {
      const { tenantId } = req.user;
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT so.*, c.name_ar as customer_name
        FROM sales_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        WHERE so.tenant_id = $1
      `;
      const params = [tenantId];

      if (status) {
        query += ` AND so.status = $${params.length + 1}`;
        params.push(status);
      }

      query += ` ORDER BY so.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json({ success: true, data: result.rows, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
      console.error('orders/sales error:', err);
      res.status(500).json({ success: false, message: 'خطأ في جلب الطلبات' });
    }
  }
);

module.exports = router;
```

---

### ❌ المشكلة 3: Health Check لا يعمل

**الإصلاح الكامل في `server.js`:**
```javascript
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbLatency = null;

  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    dbLatency = Date.now() - start;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error: ' + err.message;
    console.error('❌ DB Health Check failed:', err.message);
  }

  const status = dbStatus === 'connected' ? 'ok' : 'error';

  res.status(status === 'ok' ? 200 : 503).json({
    status,
    database: dbStatus,
    dbLatency: dbLatency ? `${dbLatency}ms` : null,
    uptime: `${Math.floor(process.uptime())}s`,
    serverTime: new Date().toISOString(),
    version: process.env.npm_package_version || '2.1.0',
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  });
});
```

---

### ❌ المشكلة 4: انتهاء صلاحية التوكن لا يُعالج

**`public/js/api.js` — الكامل مع interceptor:**
```javascript
const NexusAPI = {
  baseURL: '/api',

  getHeaders() {
    const token = localStorage.getItem('nexus_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  },

  async request(method, endpoint, data = null, retry = true) {
    const options = {
      method,
      headers: this.getHeaders()
    };
    if (data) options.body = JSON.stringify(data);

    try {
      const res = await fetch(`${this.baseURL}${endpoint}`, options);

      // معالجة 401 — التوكن منتهي
      if (res.status === 401 && retry) {
        console.warn('⚠️ Token expired, trying refresh...');
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.request(method, endpoint, data, false); // إعادة المحاولة مرة واحدة
        } else {
          console.error('❌ Refresh failed, redirecting to login...');
          this.logout();
          return null;
        }
      }

      // معالجة 403 — لا صلاحية
      if (res.status === 403) {
        const data = await res.json();
        console.error('🚫 Access Denied:', data.message);
        NexusUI.showToast(data.message || 'ليس لديك صلاحية للوصول', 'error');
        return null;
      }

      return await res.json();
    } catch (err) {
      console.error(`API Error [${method} ${endpoint}]:`, err);
      NexusUI.showToast('خطأ في الاتصال بالخادم', 'error');
      return null;
    }
  },

  async refreshToken() {
    const refresh = localStorage.getItem('nexus_refresh');
    if (!refresh) return false;

    try {
      const res = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh })
      });
      const data = await res.json();

      if (data.success && data.accessToken) {
        localStorage.setItem('nexus_token', data.accessToken);
        console.log('✅ Token refreshed successfully');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  logout() {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_refresh');
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_tenant');
    window.location.href = '/admin/login.html';
  },

  get:    (url)       => NexusAPI.request('GET',    url),
  post:   (url, data) => NexusAPI.request('POST',   url, data),
  put:    (url, data) => NexusAPI.request('PUT',     url, data),
  patch:  (url, data) => NexusAPI.request('PATCH',  url, data),
  delete: (url)       => NexusAPI.request('DELETE', url)
};

// Helper UI
const NexusUI = {
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = { success: '#10B981', error: '#EF4444', info: '#4F46E5', warning: '#F59E0B' };
    toast.style.cssText = `
      position:fixed; bottom:20px; right:20px; z-index:9999;
      background:${colors[type] || colors.info}; color:white;
      padding:12px 20px; border-radius:12px; font-size:14px;
      box-shadow:0 4px 20px rgba(0,0,0,0.3); font-family:'Cairo',sans-serif;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }
};
```

---

## 🔧 المرحلة 2: `server.js` الكامل والنهائي

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { pool } = require('./config/db');
const { authenticate } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ===================================
// Security & Logging
// ===================================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===================================
// Static Files
// ===================================
app.use(express.static(path.join(__dirname, 'public')));

// ===================================
// Redirect Root
// ===================================
app.get('/', (req, res) => {
  res.redirect('/admin/login.html');
});

// ===================================
// Health Check (بدون auth — عام)
// ===================================
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbLatency = null;

  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    dbLatency = Date.now() - start;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }

  const ok = dbStatus === 'connected';
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'error',
    database: dbStatus,
    dbLatency: dbLatency ? `${dbLatency}ms` : null,
    uptime: `${Math.floor(process.uptime())}s`,
    serverTime: new Date().toISOString(),
    version: '2.1.0',
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  });
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
// ⚠️ كل ما يلي يحتاج authenticate ⚠️
// ===================================
app.use('/api', authenticate);

// ===================================
// API Routes (مع authenticate مطبق)
// ===================================
app.use('/api/users',      require('./routes/users'));
app.use('/api/accounting', require('./routes/accounting'));
app.use('/api/hr',         require('./routes/hr'));
app.use('/api/warehouse',  require('./routes/warehouse'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/invoices',   require('./routes/invoices'));
app.use('/api/sales',      require('./routes/sales'));
app.use('/api/purchasing', require('./routes/purchasing'));
app.use('/api/crm',        require('./routes/crm'));
app.use('/api/projects',   require('./routes/projects'));
app.use('/api/reports',    require('./routes/reports'));
app.use('/api/settings',   require('./routes/settings'));

// ===================================
// Menu API (ديناميكي حسب الدور)
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
```

---

## 🌐 المرحلة 3: واجهة المستخدم الكاملة

### `public/admin/login.html` — صفحة تسجيل الدخول

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus ERP — تسجيل الدخول</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    [dir="rtl"] { font-family: 'Cairo', sans-serif; }
    [dir="ltr"] { font-family: 'Inter', sans-serif; }
    body { background: linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4F46E5 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: white; border-radius: 24px; padding: 40px; width: 100%; max-width: 420px; box-shadow: 0 25px 50px rgba(0,0,0,0.4); }
    .input { width: 100%; padding: 12px 16px; border: 2px solid #E5E7EB; border-radius: 12px; font-size: 14px; outline: none; transition: all 0.2s; font-family: inherit; }
    .input:focus { border-color: #4F46E5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
    .btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 16px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(79,70,229,0.4); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .error-box { background: #FEF2F2; border: 1px solid #FECACA; color: #DC2626; border-radius: 10px; padding: 12px 16px; font-size: 14px; display: none; margin-bottom: 16px; }
  </style>
</head>
<body>
  <!-- Language Switcher -->
  <div style="position:fixed;top:16px;left:16px;z-index:50">
    <select onchange="switchLang(this.value)" id="langSel"
      style="background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.3);border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer;backdrop-filter:blur(10px)">
      <option value="ar">🇪🇬 العربية</option>
      <option value="en">🇺🇸 English</option>
      <option value="fr">🇫🇷 Français</option>
    </select>
  </div>

  <div class="card">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#4F46E5,#7C3AED);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
        <svg style="width:32px;height:32px;color:white" fill="none" stroke="white" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      </div>
      <div style="font-size:28px;font-weight:900;color:#1E1B4B">Nexus ERP</div>
      <div style="color:#6B7280;font-size:14px;margin-top:4px" id="tagline">نظام إدارة موارد المؤسسات</div>
    </div>

    <div class="error-box" id="errorBox" id="errorText"></div>

    <div style="display:flex;flex-direction:column;gap:16px">
      <div>
        <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px" id="lblTenant">كود الشركة</label>
        <input class="input" id="tenantSlug" type="text" placeholder="nexus-demo" value="nexus-demo">
      </div>
      <div>
        <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px" id="lblEmail">البريد الإلكتروني</label>
        <input class="input" id="email" type="email" placeholder="admin@nexus.com" value="admin@nexus.com">
      </div>
      <div>
        <label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px" id="lblPassword">كلمة المرور</label>
        <input class="input" id="password" type="password" placeholder="••••••••" value="admin123">
      </div>
      <button class="btn" id="loginBtn" onclick="doLogin()">
        <span id="btnText">تسجيل الدخول</span>
      </button>
    </div>

    <p style="text-align:center;color:#9CA3AF;font-size:12px;margin-top:24px">Nexus ERP v2.1 © 2025</p>
  </div>

<script>
const T = {
  ar: { tagline:'نظام إدارة موارد المؤسسات', lblTenant:'كود الشركة', lblEmail:'البريد الإلكتروني', lblPassword:'كلمة المرور', btnText:'تسجيل الدخول', dir:'rtl' },
  en: { tagline:'Enterprise Resource Planning', lblTenant:'Company Code', lblEmail:'Email Address', lblPassword:'Password', btnText:'Sign In', dir:'ltr' },
  fr: { tagline:'Système de Planification ERP', lblTenant:'Code Entreprise', lblEmail:'Adresse Email', lblPassword:'Mot de passe', btnText:'Se connecter', dir:'ltr' }
};

let lang = localStorage.getItem('nexus_lang') || 'ar';

function switchLang(l) {
  lang = l;
  localStorage.setItem('nexus_lang', l);
  const t = T[l];
  document.documentElement.dir = t.dir;
  document.documentElement.lang = l;
  document.getElementById('langSel').value = l;
  ['tagline','lblTenant','lblEmail','lblPassword','btnText'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = t[id];
  });
}

async function doLogin() {
  const btn = document.getElementById('loginBtn');
  const errorBox = document.getElementById('errorBox');
  errorBox.style.display = 'none';

  const tenant_slug = document.getElementById('tenantSlug').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!tenant_slug || !email || !password) {
    errorBox.textContent = 'يرجى ملء جميع الحقول';
    errorBox.style.display = 'block';
    return;
  }

  btn.disabled = true;
  document.getElementById('btnText').textContent = '...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, tenant_slug })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('nexus_token',  data.data.accessToken);
      localStorage.setItem('nexus_refresh', data.data.refreshToken);
      localStorage.setItem('nexus_user',   JSON.stringify(data.data.user));
      localStorage.setItem('nexus_tenant', JSON.stringify(data.data.tenant));
      window.location.href = '/admin/dashboard.html';
    } else {
      errorBox.textContent = data.message || 'بيانات الدخول غير صحيحة';
      errorBox.style.display = 'block';
      btn.disabled = false;
      document.getElementById('btnText').textContent = T[lang].btnText;
    }
  } catch {
    errorBox.textContent = 'لا يمكن الاتصال بالخادم';
    errorBox.style.display = 'block';
    btn.disabled = false;
    document.getElementById('btnText').textContent = T[lang].btnText;
  }
}

switchLang(lang);
document.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
</script>
</body>
</html>
```

---

### `public/admin/dashboard.html` — Dashboard مع RBAC

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus ERP — لوحة التحكم</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    [dir="rtl"] { font-family: 'Cairo', sans-serif; }
    [dir="ltr"] { font-family: 'Inter', sans-serif; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #F1F5F9; display: flex; min-height: 100vh; }
    #sidebar { width: 250px; background: linear-gradient(180deg,#1E1B4B,#312E81); min-height: 100vh; flex-shrink: 0; transition: width .3s; position: relative; }
    #sidebar.mini { width: 68px; }
    .nav-link { display: flex; align-items: center; gap: 12px; padding: 11px 16px; margin: 2px 8px; border-radius: 10px; color: rgba(255,255,255,.7); text-decoration: none; transition: all .2s; font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; }
    .nav-link:hover { background: rgba(255,255,255,.1); color: white; }
    .nav-link.active { background: linear-gradient(135deg,#4F46E5,#7C3AED); color: white; box-shadow: 0 4px 12px rgba(79,70,229,.4); }
    #sidebar.mini .nav-label { display: none; }
    #sidebar.mini .nav-link { justify-content: center; padding: 12px; }
    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .topbar { height: 60px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,.08); display: flex; align-items: center; padding: 0 20px; gap: 12px; flex-shrink: 0; }
    .content { flex: 1; overflow-y: auto; padding: 24px; }
    .card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .stat-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.08); transition: transform .2s, box-shadow .2s; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,.12); }
    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-ok { background: #D1FAE5; color: #065F46; }
    .status-error { background: #FEE2E2; color: #991B1B; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 8px; text-align: right; border-bottom: 1px solid #F1F5F9; font-size: 14px; }
    th { color: #6B7280; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    tr:hover td { background: #F8FAFC; }
    .toast { position: fixed; bottom: 20px; right: 20px; z-index: 9999; padding: 12px 20px; border-radius: 12px; color: white; font-size: 14px; box-shadow: 0 4px 20px rgba(0,0,0,.3); }
  </style>
</head>
<body>

<!-- SIDEBAR -->
<aside id="sidebar">
  <!-- Logo -->
  <div style="padding:20px 16px;border-bottom:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:12px">
    <div style="width:38px;height:38px;background:rgba(255,255,255,.2);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px">⊞</div>
    <div id="logoText">
      <div style="color:white;font-weight:900;font-size:16px">Nexus ERP</div>
      <div style="color:rgba(255,255,255,.5);font-size:11px" id="tenantName">تحميل...</div>
    </div>
  </div>

  <!-- Nav -->
  <nav id="sidebarNav" style="padding:12px 0;flex:1">
    <div style="color:rgba(255,255,255,.3);font-size:11px;padding:8px 24px">جاري التحميل...</div>
  </nav>

  <!-- User -->
  <div style="padding:16px;border-top:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:10px">
    <div id="avatar" style="width:36px;height:36px;background:#4F46E5;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;flex-shrink:0">?</div>
    <div id="logoText" style="overflow:hidden;flex:1">
      <div id="userName" style="color:white;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">...</div>
      <div id="userRole" style="color:rgba(255,255,255,.5);font-size:11px">...</div>
    </div>
    <button onclick="logout()" style="background:none;border:none;color:rgba(255,255,255,.4);cursor:pointer;font-size:18px;padding:4px" title="تسجيل الخروج">⏻</button>
  </div>
</aside>

<!-- MAIN -->
<div class="main">
  <!-- Topbar -->
  <header class="topbar">
    <button onclick="toggleSidebar()" style="background:none;border:none;cursor:pointer;font-size:20px;color:#6B7280">☰</button>

    <div style="flex:1;max-width:320px;position:relative">
      <input placeholder="بحث سريع..." style="width:100%;padding:8px 12px 8px 36px;background:#F1F5F9;border:none;border-radius:10px;font-size:13px;outline:none;font-family:inherit">
      <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#9CA3AF">🔍</span>
    </div>

    <div style="margin-right:auto;display:flex;align-items:center;gap:10px">
      <select id="langSwitcher" onchange="switchLang(this.value)"
        style="font-size:13px;border:1px solid #E5E7EB;border-radius:8px;padding:6px 10px;background:white;cursor:pointer;font-family:inherit">
        <option value="ar">🇪🇬 AR</option>
        <option value="en">🇺🇸 EN</option>
        <option value="fr">🇫🇷 FR</option>
      </select>

      <a href="/admin/health.html" id="healthBadge"
        style="display:flex;align-items:center;gap:6px;font-size:12px;color:#059669;background:#D1FAE5;padding:6px 12px;border-radius:8px;text-decoration:none">
        <span style="width:8px;height:8px;background:#10B981;border-radius:50%;display:inline-block;animation:pulse 2s infinite"></span>
        يعمل
      </a>

      <div id="currentTime" style="font-size:12px;color:#9CA3AF"></div>
    </div>
  </header>

  <!-- Content -->
  <main class="content">
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <div>
        <h1 id="pageTitle" style="font-size:24px;font-weight:900;color:#1E1B4B">لوحة التحكم</h1>
        <p id="pageSubtitle" style="color:#6B7280;font-size:14px;margin-top:4px">مرحباً بك في Nexus ERP</p>
      </div>
    </div>

    <!-- KPI Cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px" id="kpiGrid">
      <!-- يتم ملؤها ديناميكياً -->
    </div>

    <!-- Charts -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:24px">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="font-weight:700;color:#374151">الإيرادات مقابل المصروفات</h3>
        </div>
        <canvas id="revenueChart" height="90"></canvas>
      </div>
      <div class="card">
        <h3 style="font-weight:700;color:#374151;margin-bottom:16px">توزيع المبيعات</h3>
        <canvas id="donutChart" height="160"></canvas>
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="card" style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="font-weight:700;color:#374151">آخر الطلبات</h3>
        <a href="/admin/sales.html" style="font-size:13px;color:#4F46E5;text-decoration:none;font-weight:600">عرض الكل ←</a>
      </div>
      <table>
        <thead>
          <tr>
            <th>رقم الطلب</th><th>العميل</th><th>التاريخ</th><th>المبلغ</th><th>الحالة</th>
          </tr>
        </thead>
        <tbody id="ordersTable">
          <tr><td colspan="5" style="text-align:center;color:#9CA3AF;padding:32px">جاري تحميل الطلبات...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Quick Actions -->
    <div class="card">
      <h3 style="font-weight:700;color:#374151;margin-bottom:16px">⚡ إجراءات سريعة</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px" id="quickActions"></div>
    </div>
  </main>
</div>

<script src="/js/api.js"></script>
<script>
// ==========================================
// Guard: التحقق من تسجيل الدخول
// ==========================================
const token  = localStorage.getItem('nexus_token');
const user   = JSON.parse(localStorage.getItem('nexus_user')   || '{}');
const tenant = JSON.parse(localStorage.getItem('nexus_tenant') || '{}');

if (!token || !user.id) {
  window.location.href = '/admin/login.html';
}

// ==========================================
// تعريف القائمة حسب الأدوار
// ==========================================
const ROLE_MENUS = {
  superadmin:          ['dashboard','accounting','hr','inventory','sales','purchasing','crm','projects','reports','settings'],
  admin:               ['dashboard','accounting','hr','inventory','sales','purchasing','crm','projects','reports','settings'],
  accountant:          ['dashboard','accounting','sales','purchasing','reports'],
  hr:                  ['dashboard','hr','reports'],
  inventory_manager:   ['dashboard','inventory','purchasing','reports'],
  sales_manager:       ['dashboard','sales','crm','inventory','reports'],
  purchasing_manager:  ['dashboard','purchasing','inventory','reports'],
  employee:            ['dashboard','inventory','sales'],
  viewer:              ['dashboard','accounting','hr','inventory','sales','purchasing','crm','projects','reports']
};

const ALL_MENU = [
  { id:'dashboard',  icon:'⊞', ar:'لوحة التحكم',    en:'Dashboard',    url:'/admin/dashboard.html'  },
  { id:'accounting', icon:'💰', ar:'المحاسبة',        en:'Accounting',   url:'/admin/accounting.html' },
  { id:'hr',         icon:'👥', ar:'الموارد البشرية', en:'HR',           url:'/admin/hr.html'         },
  { id:'inventory',  icon:'📦', ar:'المخزون',          en:'Inventory',    url:'/admin/inventory.html'  },
  { id:'sales',      icon:'🛒', ar:'المبيعات',         en:'Sales',        url:'/admin/sales.html'      },
  { id:'purchasing', icon:'🚚', ar:'المشتريات',        en:'Purchasing',   url:'/admin/purchasing.html' },
  { id:'crm',        icon:'❤️', ar:'إدارة العملاء',    en:'CRM',          url:'/admin/crm.html'        },
  { id:'projects',   icon:'📋', ar:'المشاريع',         en:'Projects',     url:'/admin/projects.html'   },
  { id:'reports',    icon:'📊', ar:'التقارير',          en:'Reports',      url:'/admin/reports.html'    },
  { id:'settings',   icon:'⚙️', ar:'الإعدادات',        en:'Settings',     url:'/admin/settings.html'   }
];

const ROLE_LABELS = {
  superadmin:'مدير النظام', admin:'مدير', accountant:'محاسب', hr:'موارد بشرية',
  inventory_manager:'مدير المخزون', sales_manager:'مدير المبيعات',
  purchasing_manager:'مدير المشتريات', employee:'موظف', viewer:'مشاهد'
};

// ==========================================
// بناء القائمة الجانبية
// ==========================================
function buildSidebar() {
  const role = user.role || 'viewer';
  const allowed = ROLE_MENUS[role] || ROLE_MENUS.viewer;
  const lang = localStorage.getItem('nexus_lang') || 'ar';
  const current = window.location.pathname;

  document.getElementById('tenantName').textContent = tenant.name || 'Nexus';
  const fullName = `${user.firstName||''} ${user.lastName||''}`.trim() || user.email || '?';
  document.getElementById('userName').textContent = fullName;
  document.getElementById('userRole').textContent = ROLE_LABELS[role] || role;
  document.getElementById('avatar').textContent = fullName.charAt(0).toUpperCase();

  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';

  ALL_MENU
    .filter(item => allowed.includes(item.id))
    .forEach(item => {
      const isActive = current.includes(item.id) || (item.id === 'dashboard' && current.includes('dashboard'));
      const a = document.createElement('a');
      a.href = item.url;
      a.className = `nav-link${isActive ? ' active' : ''}`;
      a.innerHTML = `<span style="font-size:18px;flex-shrink:0">${item.icon}</span><span class="nav-label">${lang === 'en' ? item.en : item.ar}</span>`;
      nav.appendChild(a);
    });
}

// ==========================================
// بطاقات KPI
// ==========================================
function buildKPI() {
  const cards = [
    { icon:'💰', title:'إجمالي الإيرادات', value:'٢٣٥,٤٠٠ ج.م', change:'+12.5%', color:'#4F46E5' },
    { icon:'💸', title:'إجمالي المصروفات', value:'١٢٨,٩٠٠ ج.م', change:'-3.2%',  color:'#EF4444' },
    { icon:'📈', title:'صافي الربح',        value:'١٠٦,٥٠٠ ج.م', change:'+8.1%',  color:'#10B981' },
    { icon:'⏰', title:'فواتير معلقة',      value:'١٨ فاتورة',     change:'تحتاج مراجعة', color:'#F59E0B' }
  ];

  document.getElementById('kpiGrid').innerHTML = cards.map(c => `
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
        <span style="font-size:28px">${c.icon}</span>
        <span style="font-size:12px;font-weight:700;color:${c.color};background:${c.color}15;padding:4px 10px;border-radius:20px">${c.change}</span>
      </div>
      <div style="font-size:22px;font-weight:900;color:#1E1B4B;margin-bottom:4px">${c.value}</div>
      <div style="font-size:13px;color:#6B7280">${c.title}</div>
    </div>
  `).join('');
}

// ==========================================
// جلب الطلبات من API
// ==========================================
async function loadOrders() {
  const tbody = document.getElementById('ordersTable');
  try {
    const data = await NexusAPI.get('/orders/sales?limit=5');
    if (!data || !data.success || !data.data?.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9CA3AF;padding:32px">لا توجد طلبات حتى الآن</td></tr>';
      return;
    }

    const STATUS = { draft:'مسودة', confirmed:'مؤكد', shipped:'شحن', delivered:'مكتمل', cancelled:'ملغي' };
    const STATUS_COLOR = { draft:'#6B7280', confirmed:'#4F46E5', shipped:'#0891B2', delivered:'#059669', cancelled:'#EF4444' };

    tbody.innerHTML = data.data.map(o => `
      <tr>
        <td style="font-weight:600;color:#4F46E5;font-family:monospace">${o.order_number || o.id?.slice(0,8)}</td>
        <td>${o.customer_name || '—'}</td>
        <td style="color:#6B7280">${o.order_date ? new Date(o.order_date).toLocaleDateString('ar-EG') : '—'}</td>
        <td style="font-weight:700">${Number(o.total_amount || 0).toLocaleString('ar-EG')} ج.م</td>
        <td><span class="badge" style="background:${STATUS_COLOR[o.status] || '#6B7280'}20;color:${STATUS_COLOR[o.status] || '#6B7280'}">${STATUS[o.status] || o.status}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#EF4444;padding:20px">خطأ في جلب الطلبات</td></tr>`;
  }
}

// ==========================================
// الرسوم البيانية
// ==========================================
function buildCharts() {
  const rCtx = document.getElementById('revenueChart')?.getContext('2d');
  if (rCtx) {
    new Chart(rCtx, {
      type: 'bar',
      data: {
        labels: ['أكتوبر','نوفمبر','ديسمبر','يناير','فبراير','مارس'],
        datasets: [
          { label:'إيرادات', data:[180,210,195,220,240,235], backgroundColor:'rgba(79,70,229,0.8)', borderRadius:6 },
          { label:'مصروفات', data:[120,130,125,135,140,129], backgroundColor:'rgba(239,68,68,0.7)', borderRadius:6 }
        ]
      },
      options: { responsive:true, plugins:{legend:{position:'top'}}, scales:{y:{beginAtZero:true,ticks:{callback:v=>v+'K'}}} }
    });
  }

  const dCtx = document.getElementById('donutChart')?.getContext('2d');
  if (dCtx) {
    new Chart(dCtx, {
      type: 'doughnut',
      data: {
        labels: ['إلكترونيات','أجهزة','ملحقات','أخرى'],
        datasets: [{ data:[45,28,17,10], backgroundColor:['#4F46E5','#7C3AED','#06B6D4','#F59E0B'], borderWidth:0 }]
      },
      options: { responsive:true, cutout:'70%', plugins:{legend:{position:'bottom'}} }
    });
  }
}

// ==========================================
// الإجراءات السريعة حسب الدور
// ==========================================
function buildQuickActions() {
  const role = user.role || 'viewer';
  const ALL_ACTIONS = [
    { icon:'📄', label:'فاتورة جديدة',  url:'/admin/accounting.html', roles:['superadmin','admin','accountant','sales_manager'] },
    { icon:'🛍️', label:'أمر شراء',      url:'/admin/purchasing.html', roles:['superadmin','admin','purchasing_manager','inventory_manager'] },
    { icon:'👤', label:'موظف جديد',     url:'/admin/hr.html',         roles:['superadmin','admin','hr'] },
    { icon:'📦', label:'منتج جديد',     url:'/admin/inventory.html',  roles:['superadmin','admin','inventory_manager'] },
    { icon:'🤝', label:'عميل جديد',     url:'/admin/crm.html',        roles:['superadmin','admin','sales_manager'] },
    { icon:'🚀', label:'مشروع جديد',    url:'/admin/projects.html',   roles:['superadmin','admin'] }
  ];

  const allowed = ALL_ACTIONS.filter(a => a.roles.includes(role));
  const container = document.getElementById('quickActions');

  if (!allowed.length) {
    container.innerHTML = '<p style="color:#9CA3AF;font-size:13px">لا توجد إجراءات متاحة</p>';
    return;
  }

  container.innerHTML = allowed.map(a => `
    <a href="${a.url}" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px;background:#F8FAFC;border-radius:12px;text-decoration:none;transition:all .2s" onmouseover="this.style.background='#EEF2FF'" onmouseout="this.style.background='#F8FAFC'">
      <span style="font-size:24px">${a.icon}</span>
      <span style="font-size:12px;font-weight:600;color:#374151;text-align:center">${a.label}</span>
    </a>
  `).join('');
}

// ==========================================
// التاريخ والوقت
// ==========================================
function updateTime() {
  const now = new Date();
  document.getElementById('currentTime').textContent =
    now.toLocaleDateString('ar-EG', {weekday:'short', month:'short', day:'numeric'}) + ' ' +
    now.toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'});
}

// ==========================================
// تبديل اللغة
// ==========================================
const LANGS_D = {
  ar: { dir:'rtl', pageTitle:'لوحة التحكم', pageSubtitle:'مرحباً بك في Nexus ERP' },
  en: { dir:'ltr', pageTitle:'Dashboard',   pageSubtitle:'Welcome to Nexus ERP' },
  fr: { dir:'ltr', pageTitle:'Tableau de bord', pageSubtitle:'Bienvenue dans Nexus ERP' }
};

function switchLang(lang) {
  localStorage.setItem('nexus_lang', lang);
  const L = LANGS_D[lang] || LANGS_D.ar;
  document.documentElement.dir = L.dir;
  document.documentElement.lang = lang;
  document.getElementById('langSwitcher').value = lang;
  document.getElementById('pageTitle').textContent = L.pageTitle;
  document.getElementById('pageSubtitle').textContent = L.pageSubtitle;
  buildSidebar();
}

// ==========================================
// وظائف عامة
// ==========================================
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('mini');
  const logoTexts = document.querySelectorAll('#logoText');
  logoTexts.forEach(el => el.style.display = document.getElementById('sidebar').classList.contains('mini') ? 'none' : '');
}

function logout() {
  if (confirm('هل تريد تسجيل الخروج؟')) {
    localStorage.clear();
    window.location.href = '/admin/login.html';
  }
}

// ==========================================
// فحص Health Check
// ==========================================
async function checkHealth() {
  try {
    const res = await fetch('/health');
    const data = await res.json();
    const badge = document.getElementById('healthBadge');
    if (data.status === 'ok') {
      badge.style.color = '#059669';
      badge.style.background = '#D1FAE5';
      badge.innerHTML = '<span style="width:8px;height:8px;background:#10B981;border-radius:50%;display:inline-block"></span> يعمل';
    } else {
      badge.style.color = '#DC2626';
      badge.style.background = '#FEE2E2';
      badge.innerHTML = '<span style="width:8px;height:8px;background:#EF4444;border-radius:50%;display:inline-block"></span> خطأ';
    }
  } catch {
    const badge = document.getElementById('healthBadge');
    badge.style.color = '#D97706';
    badge.style.background = '#FEF3C7';
    badge.innerHTML = '⚠️ غير متصل';
  }
}

// ==========================================
// تشغيل كل شيء
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  const lang = localStorage.getItem('nexus_lang') || 'ar';
  switchLang(lang);
  buildSidebar();
  buildKPI();
  buildCharts();
  buildQuickActions();
  loadOrders();
  updateTime();
  checkHealth();
  setInterval(updateTime, 60000);
  setInterval(checkHealth, 60000);
});
</script>
</body>
</html>
```

---

### `public/admin/health.html` — صفحة فحص النظام

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus ERP — System Health</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family:'Cairo',sans-serif; background:#0F172A; color:white; min-height:100vh; padding:24px; }
    .card { background:#1E293B; border:1px solid #334155; border-radius:16px; padding:24px; }
    .metric { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #334155; font-size:14px; }
    .metric:last-child { border-bottom:none; }
    .ok { color:#10B981; }
    .err { color:#EF4444; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    .pulse { animation:pulse 2s infinite; }
  </style>
</head>
<body>
  <div style="max-width:800px;margin:0 auto">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
      <a href="/admin/dashboard.html" style="color:#64748B;text-decoration:none;font-size:14px">← العودة</a>
      <h1 style="font-size:28px;font-weight:900">🩺 System Health</h1>
      <span id="autoRefresh" style="font-size:12px;color:#60A5FA;background:#1E3A5F;padding:4px 12px;border-radius:20px">تحديث كل 30 ثانية</span>
      <button onclick="check()" style="background:#4F46E5;color:white;border:none;padding:8px 16px;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit">🔄 الآن</button>
    </div>

    <!-- Status Card -->
    <div class="card" style="margin-bottom:16px;display:flex;align-items:center;gap:16px">
      <div id="dot" style="width:16px;height:16px;border-radius:50%;background:#6B7280" class="pulse"></div>
      <div>
        <div id="statusText" style="font-size:20px;font-weight:700">جاري الفحص...</div>
        <div id="statusSub" style="color:#64748B;font-size:13px;margin-top:2px">يرجى الانتظار</div>
      </div>
    </div>

    <!-- Metrics -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div class="card">
        <div style="font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;margin-bottom:12px">قاعدة البيانات</div>
        <div class="metric"><span>الحالة</span><span id="dbStatus" style="font-family:monospace">—</span></div>
        <div class="metric"><span>زمن الاستجابة</span><span id="dbLatency" style="font-family:monospace">—</span></div>
      </div>
      <div class="card">
        <div style="font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;margin-bottom:12px">الخادم</div>
        <div class="metric"><span>وقت التشغيل</span><span id="uptime" style="font-family:monospace">—</span></div>
        <div class="metric"><span>البيئة</span><span id="env" style="font-family:monospace">—</span></div>
      </div>
      <div class="card">
        <div style="font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;margin-bottom:12px">الذاكرة</div>
        <div class="metric"><span>المستخدمة</span><span id="memUsed" style="font-family:monospace">—</span></div>
        <div class="metric"><span>الإجمالية</span><span id="memTotal" style="font-family:monospace">—</span></div>
      </div>
      <div class="card">
        <div style="font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;margin-bottom:12px">النظام</div>
        <div class="metric"><span>الإصدار</span><span id="version" style="font-family:monospace">—</span></div>
        <div class="metric"><span>وقت الخادم</span><span id="serverTime" style="font-family:monospace;font-size:12px">—</span></div>
      </div>
    </div>

    <!-- Raw JSON -->
    <div class="card">
      <div style="font-size:13px;color:#64748B;margin-bottom:12px">📋 Raw Response — <code style="color:#818CF8">GET /health</code></div>
      <pre id="raw" style="color:#4ADE80;font-size:12px;overflow-x:auto;line-height:1.6">جاري التحميل...</pre>
    </div>

    <p id="lastChecked" style="text-align:center;color:#334155;font-size:12px;margin-top:12px">لم يتم الفحص بعد</p>
  </div>

<script>
async function check() {
  try {
    const res = await fetch('/health');
    const d = await res.json();
    const ok = d.status === 'ok';

    document.getElementById('dot').style.background = ok ? '#10B981' : '#EF4444';
    document.getElementById('statusText').textContent = ok ? '✅ النظام يعمل بشكل طبيعي' : '❌ يوجد مشكلة';
    document.getElementById('statusText').style.color = ok ? '#10B981' : '#EF4444';
    document.getElementById('statusSub').textContent = ok ? 'جميع الخدمات تعمل' : 'راجع سجلات الخادم';

    document.getElementById('dbStatus').textContent = d.database;
    document.getElementById('dbStatus').style.color = d.database === 'connected' ? '#10B981' : '#EF4444';
    document.getElementById('dbLatency').textContent = d.dbLatency || '—';
    document.getElementById('uptime').textContent = d.uptime;
    document.getElementById('env').textContent = d.environment || 'development';
    document.getElementById('memUsed').textContent = d.memory?.used || '—';
    document.getElementById('memTotal').textContent = d.memory?.total || '—';
    document.getElementById('version').textContent = d.version;
    document.getElementById('serverTime').textContent = new Date(d.serverTime).toLocaleString('ar-EG');
    document.getElementById('raw').textContent = JSON.stringify(d, null, 2);
    document.getElementById('lastChecked').textContent = 'آخر فحص: ' + new Date().toLocaleTimeString('ar-EG');

  } catch (err) {
    document.getElementById('dot').style.background = '#EF4444';
    document.getElementById('statusText').textContent = '🔴 لا يمكن الوصول للخادم';
    document.getElementById('statusText').style.color = '#EF4444';
    document.getElementById('statusSub').textContent = 'تأكد من تشغيل: npm run dev';
    document.getElementById('raw').textContent = 'Error: ' + err.message;
  }
}

check();
setInterval(check, 30000);
</script>
</body>
</html>
```

---

## 🌱 `seeds/seed.js` — بيانات تجريبية

```javascript
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  console.log('🌱 Starting seed...\n');

  try {
    await client.query('BEGIN');

    // Tenant
    const tenantRes = await client.query(`
      INSERT INTO tenants (name, slug, primary_color, default_language, default_currency, subscription_plan)
      VALUES ('شركة نكسس للتجارة', 'nexus-demo', '#4F46E5', 'ar', 'EGP', 'enterprise')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING *
    `);
    const tenant = tenantRes.rows[0];
    console.log('✅ Tenant:', tenant.slug);

    // Tenant settings
    await client.query(`
      INSERT INTO tenant_settings (tenant_id, company_name_ar, company_name_en, currency, tax_percent)
      VALUES ($1, 'شركة نكسس للتجارة', 'Nexus Trading Co.', 'EGP', 14)
      ON CONFLICT (tenant_id) DO NOTHING
    `, [tenant.id]);

    // Users — كل الأدوار
    const USERS = [
      { email:'superadmin@nexus.com', pass:'super123',  role:'superadmin',          fname:'Super',  lname:'Admin'    },
      { email:'admin@nexus.com',      pass:'admin123',  role:'admin',               fname:'أحمد',   lname:'محمد'     },
      { email:'admin@erp.com',        pass:'admin123',  role:'admin',               fname:'Ahmed',  lname:'ERP'      },
      { email:'admin@erp.sa',         pass:'admin123',  role:'admin',               fname:'Ahmed',  lname:'SA'       },
      { email:'accountant@nexus.com', pass:'acc123',    role:'accountant',          fname:'محمد',   lname:'علي'      },
      { email:'hr@nexus.com',         pass:'hr1234',    role:'hr',                  fname:'سارة',   lname:'أحمد'     },
      { email:'inventory@nexus.com',  pass:'inv123',    role:'inventory_manager',   fname:'خالد',   lname:'عمر'      },
      { email:'sales@nexus.com',      pass:'sales123',  role:'sales_manager',       fname:'فاطمة',  lname:'حسن'      },
      { email:'purchase@nexus.com',   pass:'pur123',    role:'purchasing_manager',  fname:'عمر',    lname:'يوسف'     },
      { email:'employee@nexus.com',   pass:'emp123',    role:'employee',            fname:'مريم',   lname:'علي'      },
      { email:'viewer@nexus.com',     pass:'view123',   role:'viewer',              fname:'مشاهد',  lname:'فقط'      }
    ];

    for (const u of USERS) {
      const hash = await bcrypt.hash(u.pass, 12);
      await client.query(`
        INSERT INTO users (tenant_id, email, password_hash, role, first_name, last_name, language)
        VALUES ($1,$2,$3,$4,$5,$6,'ar')
        ON CONFLICT (tenant_id, email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role=EXCLUDED.role
      `, [tenant.id, u.email, hash, u.role, u.fname, u.lname]);
      console.log(`  ✅ ${u.role.padEnd(20)} ${u.email} / ${u.pass}`);
    }

    await client.query('COMMIT');
    console.log('\n🎉 Seed completed!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Company Code: nexus-demo');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    USERS.forEach(u => console.log(`  ${u.role.padEnd(22)} ${u.email} / ${u.pass}`));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
```

---

## 📄 `FIXES_SUMMARY.md` — يتم إنشاؤه تلقائياً

```markdown
# Nexus ERP — FIXES SUMMARY

## الملفات المعدلة
- `server.js` — إضافة redirect للـ root، إصلاح ترتيب middleware، إصلاح health check
- `middleware/auth.js` — إضافة console.log للتشخيص، التأكد من إضافة req.user
- `middleware/rbac.js` — إضافة جميع الأدوار والموديولات المفقودة (orders, warehouse, invoices)
- `routes/warehouse.js` — استخدام checkPermission الصحيح
- `routes/orders.js` — استخدام checkPermission الصحيح
- `public/js/api.js` — إضافة interceptor للـ 401 و 403
- `public/admin/login.html` — إنشاء صفحة جديدة
- `public/admin/dashboard.html` — إنشاء dashboard مع RBAC
- `public/admin/health.html` — إصلاح جلب وعرض البيانات
- `seeds/seed.js` — إضافة جميع أنواع المستخدمين

## المشاكل التي تم حلها
1. ✅ ENOENT index.html — تم إضافة redirect
2. ✅ 403 Forbidden — تم إصلاح ترتيب middleware وإضافة الـ modules المفقودة
3. ✅ Health Check ERROR — تم إصلاح endpoint والصفحة
4. ✅ Token Expiry — تم إضافة interceptor في api.js
5. ✅ RBAC UI — القائمة الجانبية تتغير حسب الدور

## طريقة الاختبار
1. `npm run dev`
2. افتح: http://localhost:5000 (يحول تلقائياً لـ login)
3. سجل الدخول: nexus-demo / admin@nexus.com / admin123
4. افتح: http://localhost:5000/health
5. جرب: http://localhost:5000/api/orders/sales (بالتوكن في header)
```

---

## 🔄 ترتيب التنفيذ (Execute In Order)

```
STEP 1:  افحص الملفات الموجودة (ls / dir)
STEP 2:  عدّل server.js (redirect + middleware order + health)
STEP 3:  عدّل middleware/auth.js (تأكد أن req.user يحتوي role)
STEP 4:  عدّل middleware/rbac.js (أضف orders, warehouse, invoices)
STEP 5:  عدّل routes/warehouse.js و routes/orders.js
STEP 6:  أنشئ/عدّل public/js/api.js (interceptor)
STEP 7:  أنشئ public/admin/login.html
STEP 8:  أنشئ public/admin/dashboard.html
STEP 9:  أنشئ public/admin/health.html
STEP 10: شغّل seeds/seed.js (npm run seed)
STEP 11: شغّل الخادم (npm run dev)
STEP 12: اختبر كل شيء وأنشئ FIXES_SUMMARY.md
```

---

## ✅ قائمة الاختبار النهائية

```
[ ] http://localhost:5000           → يحول إلى /admin/login.html
[ ] تسجيل الدخول nexus-demo / admin@nexus.com / admin123 ← يفتح dashboard
[ ] http://localhost:5000/health    → JSON بدون 404
[ ] http://localhost:5000/admin/health.html → تعرض البيانات بشكل رسومي
[ ] GET /api/orders/sales (مع توكن) → 200 OK وليس 403
[ ] GET /api/warehouse/products (مع توكن) → 200 OK وليس 403
[ ] تسجيل دخول viewer@nexus.com → قائمة جانبية محدودة
[ ] تسجيل دخول hr@nexus.com → يرى فقط HR والتقارير
[ ] توكن منتهي الصلاحية → يحول تلقائياً لـ login
[ ] لا توجد أخطاء في terminal بعد تشغيل npm run dev
```

---

*نهاية البرومبت — Nexus ERP Master Prompt v3.0*
*إذا انتهت التوكنز في أي وقت، ابدأ محادثة جديدة برفع هذا الملف وقل: "استكمل من STEP رقم X"*
