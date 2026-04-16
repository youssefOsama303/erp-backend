# 🤖 NEXUS ERP — MASTER AI AGENT REFERENCE PROMPT
### مرجع شامل للـ AI Agent — اقرأ هذا الملف أولاً قبل أي عمل
### Version: 1.0 | 2025

---

> **⚠️ تعليمات إلزامية للـ AI Agent:**
> 1. اقرأ هذا الملف كاملاً قبل أي إجراء
> 2. افحص كل ملفات المشروع الموجودة قبل التعديل
> 3. لا تحذف كوداً موجوداً — فقط أصلح أو أضف
> 4. نفّذ المراحل بالترتيب المحدد
> 5. إذا اقتربت من نهاية التوكنز → أنشئ `AGENT_CHECKPOINT.txt` فوراً

---

## 📌 SECTION 1: هوية المشروع

```
اسم المشروع : Nexus ERP
النوع        : نظام ERP متعدد المستأجرين (Multi-Tenant)
الهدف        : يضاهي Oracle ERP — يُباع كنسخ White-Label للشركات
المنفذ       : 5000
المسار       : ep-backend/ (أو nexus-erp/)
الحالة       : قيد التطوير — مرحلة الاختبار
```

---

## 📌 SECTION 2: التقنيات المستخدمة (Tech Stack)

```
Backend  : Node.js + Express.js
Database : PostgreSQL (مكتبة pg)
Auth     : JWT (jsonwebtoken) + bcrypt
Frontend : Vanilla HTML + Tailwind CSS + Vanilla JS
Charts   : Chart.js
Icons    : Feather Icons / Emoji
i18n     : ملفات JSON (ar/en/fr)
Security : helmet + cors + express-rate-limit
Logging  : morgan
Deploy   : Replit / Fly.io / Localhost:5000
```

---

## 📌 SECTION 3: هيكل المجلدات الكامل

```
nexus-erp/  (أو ep-backend/)
├── server.js                    ← نقطة الدخول الرئيسية
├── package.json
├── .env                         ← متغيرات البيئة (لا تعدّلها)
├── .env.example
│
├── config/
│   └── db.js                    ← اتصال PostgreSQL (pool)
│
├── middleware/
│   ├── auth.js                  ← JWT verify → يُضيف req.user
│   └── rbac.js                  ← checkPermission(module, action)
│
├── routes/
│   ├── auth.js                  ← login / logout / refresh-token
│   ├── users.js
│   ├── accounting.js
│   ├── hr.js
│   ├── warehouse.js             ← products + stock
│   ├── orders.js                ← sales orders
│   ├── invoices.js
│   ├── sales.js
│   ├── purchasing.js
│   ├── crm.js
│   ├── projects.js
│   ├── reports.js
│   └── settings.js
│
├── public/
│   ├── index.html               ← redirect → /admin/login.html
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
│
├── public/js/                   ← (أو داخل admin/)
│   ├── api.js                   ← NexusAPI + interceptor 401/403
│   ├── auth.js                  ← login logic
│   ├── admin.js                 ← dashboard logic
│   └── utils.js                 ← helper functions + RBAC UI
│
├── locales/
│   ├── ar.json
│   ├── en.json
│   └── fr.json
│
├── migrations/
│   └── 001_schema.sql
│
├── seeds/
│   └── seed.js
│
└── docs/
    └── (SAP documentation files — لا تعدّلها)
```

---

## 📌 SECTION 4: قاعدة البيانات — الجداول الأساسية

```sql
-- الجداول الموجودة في PostgreSQL:
tenants          -- الشركات (id, name, slug, primary_color, ...)
users            -- المستخدمون (id, tenant_id, email, password_hash, role, ...)
audit_logs       -- سجل التدقيق
chart_of_accounts
journal_entries + journal_lines
departments + employees + attendance + leave_requests + payroll
warehouses + product_categories + products + stock_levels + stock_movements
customers + sales_orders + sales_order_lines + invoices + payments
suppliers + purchase_orders + purchase_order_lines
leads + activities
projects + project_tasks
tenant_settings
```

**⚠️ مهم:** كل جدول يحتوي على `tenant_id` — كل query يجب أن تُفلتر به.

---

## 📌 SECTION 5: نظام الأدوار والصلاحيات (RBAC)

```javascript
// الأدوار المتاحة:
const ROLES = [
  'superadmin',        // كل الصلاحيات
  'admin',             // كل شيء ما عدا super settings
  'accountant',        // المحاسبة + الفواتير + التقارير
  'hr',                // الموارد البشرية فقط
  'inventory_manager', // المخزون + المشتريات
  'sales_manager',     // المبيعات + CRM
  'purchasing_manager',// المشتريات + المستودع
  'employee',          // قراءة محدودة
  'viewer'             // قراءة فقط لكل شيء
];

// الـ Modules في RBAC:
// dashboard, accounting, hr, inventory, sales, purchasing,
// crm, projects, reports, settings, orders, warehouse, invoices, users
```

---

## 📌 SECTION 6: بيانات الاختبار (Seed Data)

```
Company Code (tenant_slug) : nexus-demo
URL تسجيل الدخول          : http://localhost:5000/admin/login.html

المستخدمون للاختبار:
┌────────────────────────────┬──────────────────┬─────────────────────┐
│ الدور                      │ البريد           │ كلمة المرور        │
├────────────────────────────┼──────────────────┼─────────────────────┤
│ superadmin                 │ superadmin@nexus │ super123            │
│ admin                      │ admin@nexus.com  │ admin123            │
│ admin (بديل)               │ admin@erp.com    │ admin123            │
│ admin (بديل)               │ admin@erp.sa     │ admin123            │
│ accountant                 │ accountant@nexus │ acc123              │
│ hr                         │ hr@nexus.com     │ hr1234              │
│ inventory_manager          │ inventory@nexus  │ inv123              │
│ sales_manager              │ sales@nexus.com  │ sales123            │
│ purchasing_manager         │ purchase@nexus   │ pur123              │
│ employee                   │ employee@nexus   │ emp123              │
│ viewer                     │ viewer@nexus.com │ view123             │
└────────────────────────────┴──────────────────┴─────────────────────┘
```

---

## 📌 SECTION 7: المشاكل المعروفة وحلولها

### ❌ خطأ 1: ENOENT — index.html غير موجود
```javascript
// في server.js أضف:
app.get('/', (req, res) => res.redirect('/admin/login.html'));
```

### ❌ خطأ 2: 403 Forbidden على /api/orders أو /api/warehouse
```javascript
// السبب: ترتيب middleware خاطئ أو module غير موجود في RBAC
// الحل في server.js:
app.use('/api/auth', authLimiter, require('./routes/auth')); // بدون auth
app.use('/api', authenticate); // ← هذا يُطبق على الكل
app.use('/api/orders', require('./routes/orders'));          // بعد authenticate

// الحل في rbac.js:
// تأكد أن 'orders' و 'warehouse' و 'invoices' موجودة في كل role
```

### ❌ خطأ 3: Health Check يعرض ERROR
```javascript
// في server.js تأكد:
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch(e) { dbStatus = 'error: ' + e.message; }
  res.json({ status: dbStatus === 'connected' ? 'ok' : 'error', database: dbStatus, uptime: `${Math.floor(process.uptime())}s`, serverTime: new Date().toISOString(), version: '2.1.0' });
});
```

### ❌ خطأ 4: توكن منتهي الصلاحية لا يُعالج
```javascript
// في public/js/api.js — interceptor:
if (res.status === 401 && retry) {
  const refreshed = await this.refreshToken();
  if (refreshed) return this.request(method, endpoint, data, false);
  else { localStorage.clear(); window.location.href = '/admin/login.html'; }
}
```

### ❌ خطأ 5: القائمة الجانبية لا تتغير حسب الدور
```javascript
// في dashboard.html تأكد من:
const user = JSON.parse(localStorage.getItem('nexus_user') || '{}');
const role = user.role || 'viewer';
// ثم فلتر القائمة بناءً على ROLE_MENUS[role]
```

### ❌ خطأ 6: CORS Error
```javascript
// في server.js:
app.use(cors({ origin: '*' })); // أو حدد الأصل المحدد
```

### ❌ خطأ 7: req.user غير معرّف داخل route
```javascript
// السبب: authenticate لم يُطبَّق
// الحل: تأكد أن app.use('/api', authenticate) قبل routes
// أو أضف authenticate يدوياً: router.get('/path', authenticate, handler)
```

---

## 📌 SECTION 8: الكود الحرج — يجب التحقق منه

### `server.js` — الترتيب الصحيح الإلزامي:
```javascript
// 1. Static files
app.use(express.static(path.join(__dirname, 'public')));

// 2. Root redirect
app.get('/', (req, res) => res.redirect('/admin/login.html'));

// 3. Health (بدون auth)
app.get('/health', async (req, res) => { /* ... */ });

// 4. Auth routes (بدون authenticate)
app.use('/api/auth', authLimiter, require('./routes/auth'));

// 5. ← هذا السطر يحمي كل ما يليه
app.use('/api', authenticate);

// 6. باقي الـ routes
app.use('/api/warehouse', require('./routes/warehouse'));
app.use('/api/orders',    require('./routes/orders'));
// ...

// 7. Menu endpoint
app.get('/api/menu', (req, res) => {
  const menu = getMenuForRole(req.user.role);
  res.json({ success: true, data: menu });
});

// 8. Admin fallback
app.get('/admin/*', (req, res) => { /* ... */ });

// 9. Error handler
app.use((err, req, res, next) => { /* ... */ });
```

### `middleware/auth.js` — يجب أن يُعيد req.user:
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded;
// decoded يحتوي: { userId, tenantId, role, email }
next();
```

### كل route يجب أن يُفلتر بـ tenant_id:
```javascript
// ✅ صحيح:
const result = await pool.query(
  'SELECT * FROM products WHERE tenant_id = $1',
  [req.user.tenantId]
);

// ❌ خطأ — بيانات جميع الشركات تظهر:
const result = await pool.query('SELECT * FROM products');
```

---

## 📌 SECTION 9: المهام المطلوبة من الـ AI Agent (بالترتيب)

---

### 🔵 PHASE 1: فحص شامل للملفات (File Audit)

```
STEP 1.1: افحص server.js
  - هل الترتيب صحيح؟ (static → health → auth → authenticate → routes)
  - هل /health موجود ويعمل؟
  - هل redirect '/' موجود؟
  - هل error handler موجود؟

STEP 1.2: افحص middleware/auth.js
  - هل يتحقق من token صحيح؟
  - هل يُضيف req.user مع { userId, tenantId, role }؟
  - هل يعيد 401 عند فشل التحقق؟

STEP 1.3: افحص middleware/rbac.js
  - هل جميع الأدوار موجودة؟ (superadmin, admin, accountant, hr, inventory_manager, sales_manager, purchasing_manager, employee, viewer)
  - هل جميع الـ modules موجودة؟ (dashboard, accounting, hr, inventory, sales, purchasing, crm, projects, reports, settings, orders, warehouse, invoices, users)
  - هل superadmin له { all: true }؟
  - هل getMenuForRole موجودة ومُصدَّرة؟

STEP 1.4: افحص كل route في routes/
  - هل كل route يستخدم checkPermission الصحيح؟
  - هل كل query يُفلتر بـ tenant_id؟
  - هل هناك try/catch في كل handler؟

STEP 1.5: افحص public/js/api.js
  - هل NexusAPI موجود ومكتمل؟
  - هل هناك interceptor للـ 401؟
  - هل هناك معالجة للـ 403؟
  - هل refreshToken موجود؟

STEP 1.6: افحص public/admin/login.html
  - هل تستدعي /api/auth/login ؟
  - هل تحفظ في localStorage: nexus_token, nexus_refresh, nexus_user, nexus_tenant؟
  - هل تحوّل إلى /admin/dashboard.html بعد النجاح؟

STEP 1.7: افحص public/admin/dashboard.html
  - هل تتحقق من وجود nexus_token في localStorage؟
  - هل تبني القائمة الجانبية ديناميكياً حسب req.user.role؟
  - هل تستدعي /api/orders/sales أو /api/menu لجلب البيانات؟
  - هل Chart.js مُدرج وشغّال؟

STEP 1.8: افحص public/admin/health.html
  - هل تجلب /health وتعرض البيانات؟
  - هل هناك تحديث تلقائي كل 30 ثانية؟
```

---

### 🟡 PHASE 2: إصلاح الأخطاء (Fix All Errors)

```
STEP 2.1: لكل خطأ وجدته في PHASE 1 → أصلحه فوراً
STEP 2.2: تأكد من عدم وجود:
  - routes غير معرّفة (undefined routes)
  - require() لملفات غير موجودة
  - متغيرات environment غير مُعرّفة (process.env.XXX)
  - SQL queries بدون tenant_id
  - console.error بدون handling
  - CORS blocked (أضف cors middleware)
  
STEP 2.3: تحقق من package.json
  - هل جميع dependencies موجودة؟
    express, pg, bcryptjs, jsonwebtoken, cors, helmet,
    morgan, express-rate-limit, dotenv, uuid
  - هل scripts محددة؟ (start, dev, seed, migrate)

STEP 2.4: تحقق من .env.example
  - DATABASE_URL
  - JWT_SECRET
  - JWT_REFRESH_SECRET
  - PORT=5000
  - NODE_ENV
```

---

### 🟢 PHASE 3: ربط الملفات (Connect Everything)

```
STEP 3.1: تأكد أن كل صفحة HTML تحمّل api.js قبل أي script آخر
  <script src="/js/api.js"></script>
  أو
  <script src="/admin/js/api.js"></script>

STEP 3.2: تأكد أن كل صفحة HTML تتحقق من التوكن
  const token = localStorage.getItem('nexus_token');
  if (!token) window.location.href = '/admin/login.html';

STEP 3.3: تأكد أن القائمة الجانبية في كل صفحة تُبنى من نفس دالة buildSidebar()
  - الدالة تقرأ من localStorage: nexus_user → role
  - تُظهر فقط الصفحات المسموح بها

STEP 3.4: تأكد أن كل صفحة وحدة تستدعي API الصحيح عند التحميل
  - accounting.html → /api/accounting/...
  - hr.html → /api/hr/...
  - inventory.html → /api/warehouse/products
  - sales.html → /api/orders/sales
  - purchasing.html → /api/purchasing/...

STEP 3.5: تأكد أن /api/menu endpoint موجود ويُعيد القائمة حسب الدور

STEP 3.6: تأكد من ربط النتائج بين الصفحات:
  - زر "عرض الكل" في Dashboard → يذهب للصفحة المناسبة
  - زر "طلب جديد" → يفتح form في نفس الصفحة أو صفحة منفصلة
  - Navigation links تعمل جميعها

STEP 3.7: تأكد من وجود مؤشر Loading في كل API call:
  // قبل الطلب
  showLoading();
  // بعد الطلب
  hideLoading();
```

---

### 🔴 PHASE 4: تشغيل ومراقبة السيرفر

```
STEP 4.1: بعد إكمال PHASE 1-3، شغّل:
  npm install         (إذا لم يُشغَّل من قبل)
  npm run seed        (لإضافة بيانات تجريبية)
  npm run dev         (أو npm start)

STEP 4.2: تحقق من مخرجات الطرفية (Terminal):
  ✅ يجب أن ترى:
     🚀 Nexus ERP running on http://localhost:5000
     📊 Health: http://localhost:5000/health
  
  ❌ أي خطأ مثل:
     Error: Cannot find module './routes/xxx'   → أنشئ الملف الناقص
     Error: connect ECONNREFUSED 127.0.0.1:5432 → PostgreSQL غير مشغّل
     SyntaxError: Unexpected token              → خطأ في الكود
     Error: listen EADDRINUSE                   → منفذ 5000 مشغول (غير المنفذ)

STEP 4.3: اختبر هذه الـ URLs بالترتيب:
  1. http://localhost:5000           → يجب redirect لـ login
  2. http://localhost:5000/health    → JSON بـ status: "ok"
  3. http://localhost:5000/admin/login.html → صفحة login
  4. تسجيل دخول admin@nexus.com / admin123 / nexus-demo
  5. http://localhost:5000/admin/dashboard.html → لوحة التحكم
  6. http://localhost:5000/admin/health.html → بطاقات صحة النظام

STEP 4.4: اختبر الـ APIs في المتصفح (Developer Tools → Network):
  GET /api/orders/sales          → 200 (ليس 403 أو 404)
  GET /api/warehouse/products    → 200 (ليس 403 أو 404)
  GET /health                    → 200 { status: "ok" }

STEP 4.5: اختبر كل دور:
  - viewer@nexus.com   → قائمة جانبية محدودة (قراءة فقط)
  - hr@nexus.com       → يرى HR فقط
  - sales@nexus.com    → يرى Sales + CRM
  - admin@nexus.com    → يرى كل شيء
```

---

### 🔁 PHASE 5: مراقبة الأخطاء أثناء التشغيل

```
STEP 5.1: افتح Developer Tools في المتصفح (F12)
  → Console Tab: ابحث عن أخطاء حمراء
  → Network Tab: ابحث عن:
     - طلبات 400/401/403/404/500
     - طلبات Failed (شبكة)
     - Blocked (CORS)

STEP 5.2: لكل خطأ تجده في Console:
  - اقرأ رسالة الخطأ
  - حدد الملف والسطر
  - أصلح المشكلة
  - أعد تشغيل الخادم إذا لزم

STEP 5.3: أخطاء شائعة أثناء التشغيل:
  
  ❌ "NexusAPI is not defined"
  → api.js لم يُحمَّل، أضف <script src="/js/api.js"> قبل باقي scripts
  
  ❌ "Cannot read properties of null (reading 'role')"
  → localStorage.getItem('nexus_user') يعيد null
  → أضف: const user = JSON.parse(localStorage.getItem('nexus_user') || '{}');
  
  ❌ "Failed to fetch"
  → السيرفر غير مشغّل أو CORS blocked
  → تأكد npm run dev شغّال
  
  ❌ "Uncaught SyntaxError"
  → خطأ في JavaScript
  → افتح الملف المذكور وأصلح الـ Syntax
  
  ❌ "404 /api/xxx"
  → route غير موجود في server.js
  → أضفه: app.use('/api/xxx', require('./routes/xxx'))
  
  ❌ "503 / Database disconnected"
  → PostgreSQL غير مشغّل
  → شغّل: pg_ctl start أو service postgresql start

STEP 5.4: تحقق دورياً من /health كل دقيقة:
  إذا database: "error" → راجع .env ومتغير DATABASE_URL
  إذا status: "ok" → النظام يعمل بشكل طبيعي

STEP 5.5: بعد إصلاح كل الأخطاء، جرّب:
  - تسجيل الدخول والخروج
  - تصفح كل صفحة (accounting, hr, inventory, ...)
  - تأكد من عدم وجود صفحة "فارغة" أو "Error 500"
```

---

## 📌 SECTION 10: معايير الجودة النهائية

```
✅ لا يوجد خطأ في Terminal عند بدء التشغيل
✅ /health يعيد { status: "ok", database: "connected" }
✅ تسجيل الدخول يعمل لجميع الأدوار
✅ القائمة الجانبية تتغير حسب الدور
✅ لا توجد أخطاء 403 للمستخدمين المصرح لهم
✅ لا توجد أخطاء في Console بالمتصفح
✅ كل صفحة تُحمّل بياناتها من API بنجاح
✅ صفحة health.html تعرض البيانات بشكل رسومي
✅ تسجيل الخروج يمسح localStorage ويعيد للـ login
✅ التوكن المنتهي يُعيد المستخدم للـ login تلقائياً
✅ المستخدم غير المصرح (403) يرى رسالة واضحة
✅ الصفحة تعمل بالعربية والإنجليزية (RTL/LTR)
```

---

## 📌 SECTION 11: آلية حفظ الحالة (Checkpoint)

إذا اقتربت من نهاية التوكنز قبل إكمال جميع المراحل، أنشئ هذا الملف فوراً:

```
اسم الملف: AGENT_CHECKPOINT.txt
المحتوى:
  - آخر STEP اكتملت (مثل: PHASE 2 STEP 2.3)
  - الملفات التي تم تعديلها حتى الآن
  - الأخطاء التي تم إصلاحها
  - الأخطاء المتبقية التي تحتاج إصلاح
  - الـ STEP التالي المطلوب
```

ثم اكتب:
**"⚠️ تم حفظ نقطة توقف. استخدم AGENT_CHECKPOINT.txt لمواصلة العمل مع وكيل آخر."**

---

## 📌 SECTION 12: روابط المراجع

```
SAP Docs (للوحدة docs/ في المشروع):
  - SAP_Financial_Management.md
  - SAP_Quality_Management.md
  - SAP_Plant_Maintenance_Assets.md
  - SAP_Sales_and_Returns.md
  - SAP_Contract_Management.md
  - SAP_Business_Network_Taulia.md
  - SAP_Business_Accelerator_Hub.md
  - SAP_Warehouse_Management.md
  - SAP_Production_Planning.md
  - SAP_GRC_Compliance.md
  - SAP_BTP_Extensions.md
  - SAP_Customer_Experience.md
  - SAP_Concur_Fieldglass.md
  ⚠️ هذه الملفات للمرجعية فقط — لا تُعدّلها

Nexus ERP Docs:
  - Nexus_ERP_Master_Prompt_v3_COMPLETE.md (البرومبت الرئيسي)
  - PROGRESS_CHECKPOINT.txt (نقطة توقف سابقة)
```

---

## 🚀 ابدأ الآن

```
الأمر:
1. اقرأ هذا الملف كاملاً ✓
2. افحص هيكل المجلدات الموجود: ls -la (أو dir)
3. ابدأ من PHASE 1 STEP 1.1
4. نفّذ المراحل 1 → 2 → 3 → 4 → 5 بالترتيب
5. إذا اقتربت من نهاية التوكنز → أنشئ AGENT_CHECKPOINT.txt
6. اكتب تقريراً نهائياً عند الانتهاء:
   "✅ اكتمل الفحص والإصلاح. الخادم يعمل على http://localhost:5000"
```

---

*Nexus ERP — AI Agent Master Reference | Version 1.0 | 2025*
