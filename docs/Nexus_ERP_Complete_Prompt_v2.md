# 🧠 NEXUS ERP — MASTER BUILD PROMPT (COMPLETE)
### نسخة كاملة — للاستخدام مع أي AI Agent
### الإصدار: 2.0 | التاريخ: 2025
---

> **تعليمات للـ AI Agent:**
> اقرأ هذا الملف كاملاً قبل أي تنفيذ. نفّذ المهام بالترتيب. لا تتوقف في منتصف مهمة. إذا احتجت لفحص ملف موجود، افعل ذلك أولاً.

---

## 🎯 نظرة عامة على المشروع

اسم النظام: **Nexus ERP**
نوعه: نظام ERP متعدد المستأجرين (Multi-Tenant) يضاهي Oracle ERP Cloud
قابل للتشغيل على: Replit / Fly.io / Railway / VPS
الاستخدام: يباع كنسخ خاصة (White-Label) لكل شركة

---

## 🏗️ التقنيات المستخدمة (Tech Stack)

```
Backend:     Node.js + Express.js
Database:    PostgreSQL (مكتبة pg)
Auth:        JWT + bcrypt
Frontend:    Vanilla HTML + Tailwind CSS + Vanilla JS
i18n:        ملفات JSON للترجمة (AR / EN / FR / DE)
PDF:         PDFKit
Excel:       ExcelJS
Email:       Nodemailer
Deployment:  Replit (أو Fly.io)
```

---

## 📁 هيكل المجلدات الكامل

```
nexus-erp/
├── server/
│   ├── index.js                        ← نقطة الدخول الرئيسية
│   ├── config/
│   │   └── db.js                       ← اتصال PostgreSQL
│   ├── middleware/
│   │   ├── auth.js                     ← التحقق من JWT
│   │   ├── rbac.js                     ← التحكم في الصلاحيات
│   │   └── tenantResolver.js           ← تحديد الشركة من التوكن
│   ├── routes/
│   │   ├── auth.js
│   │   ├── tenants.js
│   │   ├── users.js
│   │   ├── accounting.js
│   │   ├── hr.js
│   │   ├── inventory.js
│   │   ├── sales.js
│   │   ├── purchasing.js
│   │   ├── crm.js
│   │   ├── projects.js
│   │   └── reports.js
│   └── utils/
│       ├── response.js
│       └── audit.js
├── public/
│   ├── index.html                      ← يحول تلقائياً لـ login.html
│   └── admin/
│       ├── login.html                  ← صفحة تسجيل الدخول
│       ├── dashboard.html              ← الصفحة الرئيسية بعد الدخول
│       ├── health.html                 ← صفحة فحص صحة النظام
│       ├── accounting.html
│       ├── hr.html
│       ├── inventory.html
│       ├── sales.html
│       ├── purchasing.html
│       ├── crm.html
│       ├── projects.html
│       ├── reports.html
│       └── settings.html
├── locales/
│   ├── ar.json
│   ├── en.json
│   └── fr.json
├── migrations/
│   └── 001_schema.sql
├── seeds/
│   └── seed.js
├── .env.example
└── package.json
```

---

## 🗃️ مخطط قاعدة البيانات (PostgreSQL — Multi-Tenant)

```sql
-- ================================================
-- الجدول 1: TENANTS (الشركات)
-- ================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#4F46E5',
  secondary_color VARCHAR(7) DEFAULT '#7C3AED',
  default_language VARCHAR(10) DEFAULT 'ar',
  default_currency VARCHAR(10) DEFAULT 'EGP',
  timezone VARCHAR(50) DEFAULT 'Africa/Cairo',
  subscription_plan VARCHAR(50) DEFAULT 'trial',
  subscription_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- الجدول 2: USERS (المستخدمون)
-- ================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  phone VARCHAR(30),
  language VARCHAR(10) DEFAULT 'ar',
  theme VARCHAR(10) DEFAULT 'light',
  role VARCHAR(50) NOT NULL DEFAULT 'employee',
  -- الأدوار: superadmin / admin / accountant / hr / inventory_manager / sales_manager / purchasing_manager / viewer
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- ================================================
-- الجدول 3: AUDIT_LOGS (سجل التدقيق)
-- ================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- الجدول 4: CHART_OF_ACCOUNTS (دليل الحسابات)
-- ================================================
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  -- asset / liability / equity / revenue / expense
  parent_id UUID REFERENCES chart_of_accounts(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- ================================================
-- الجدول 5: JOURNAL_ENTRIES (القيود اليومية)
-- ================================================
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  entry_number VARCHAR(50) NOT NULL,
  description TEXT,
  entry_date DATE NOT NULL,
  fiscal_year INT,
  period INT,
  status VARCHAR(20) DEFAULT 'draft',
  -- draft / posted / reversed
  created_by UUID REFERENCES users(id),
  posted_by UUID REFERENCES users(id),
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID REFERENCES chart_of_accounts(id),
  description TEXT,
  debit NUMERIC(18,2) DEFAULT 0,
  credit NUMERIC(18,2) DEFAULT 0,
  cost_center VARCHAR(100)
);

-- ================================================
-- الجدول 6-8: HR MODULE
-- ================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  manager_id UUID,
  parent_id UUID REFERENCES departments(id),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  employee_number VARCHAR(50),
  first_name_ar VARCHAR(100),
  last_name_ar VARCHAR(100),
  first_name_en VARCHAR(100),
  last_name_en VARCHAR(100),
  national_id VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(10),
  marital_status VARCHAR(20),
  department_id UUID REFERENCES departments(id),
  job_title_ar VARCHAR(255),
  job_title_en VARCHAR(255),
  hire_date DATE,
  employment_type VARCHAR(50),
  base_salary NUMERIC(18,2),
  currency VARCHAR(10) DEFAULT 'EGP',
  bank_account VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  employee_id UUID REFERENCES employees(id),
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status VARCHAR(20),
  -- present / absent / late / on_leave
  notes TEXT
);

CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  employee_id UUID REFERENCES employees(id),
  leave_type VARCHAR(50),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INT,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  employee_id UUID REFERENCES employees(id),
  period_month INT NOT NULL,
  period_year INT NOT NULL,
  base_salary NUMERIC(18,2),
  allowances NUMERIC(18,2) DEFAULT 0,
  deductions NUMERIC(18,2) DEFAULT 0,
  tax NUMERIC(18,2) DEFAULT 0,
  social_insurance NUMERIC(18,2) DEFAULT 0,
  net_salary NUMERIC(18,2),
  status VARCHAR(20) DEFAULT 'pending',
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- الجدول 9-12: INVENTORY MODULE
-- ================================================
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  location TEXT,
  manager_id UUID REFERENCES employees(id),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES product_categories(id),
  icon VARCHAR(100)
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(100),
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  category_id UUID REFERENCES product_categories(id),
  unit_of_measure VARCHAR(50),
  cost_price NUMERIC(18,2),
  selling_price NUMERIC(18,2),
  reorder_level INT DEFAULT 0,
  max_stock_level INT,
  is_active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, sku)
);

CREATE TABLE stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  product_id UUID REFERENCES products(id),
  warehouse_id UUID REFERENCES warehouses(id),
  quantity NUMERIC(18,3) DEFAULT 0,
  reserved_quantity NUMERIC(18,3) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id)
);

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  product_id UUID REFERENCES products(id),
  warehouse_id UUID REFERENCES warehouses(id),
  movement_type VARCHAR(50),
  -- receipt / issue / transfer / adjustment / return
  quantity NUMERIC(18,3),
  reference_type VARCHAR(50),
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- الجدول 13-17: SALES MODULE
-- ================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  customer_number VARCHAR(50),
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  customer_type VARCHAR(20) DEFAULT 'individual',
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Egypt',
  tax_number VARCHAR(100),
  credit_limit NUMERIC(18,2) DEFAULT 0,
  payment_terms INT DEFAULT 30,
  assigned_sales_rep UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  order_date DATE NOT NULL,
  delivery_date DATE,
  status VARCHAR(30) DEFAULT 'draft',
  -- draft / confirmed / picking / shipped / delivered / cancelled / returned
  warehouse_id UUID REFERENCES warehouses(id),
  subtotal NUMERIC(18,2),
  discount_amount NUMERIC(18,2) DEFAULT 0,
  tax_amount NUMERIC(18,2) DEFAULT 0,
  total_amount NUMERIC(18,2),
  paid_amount NUMERIC(18,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, order_number)
);

CREATE TABLE sales_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity NUMERIC(18,3) NOT NULL,
  unit_price NUMERIC(18,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  tax_percent NUMERIC(5,2) DEFAULT 0,
  line_total NUMERIC(18,2)
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  invoice_number VARCHAR(50) NOT NULL,
  order_id UUID REFERENCES sales_orders(id),
  customer_id UUID REFERENCES customers(id),
  invoice_date DATE NOT NULL,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'unpaid',
  -- unpaid / partial / paid / overdue / cancelled
  total_amount NUMERIC(18,2),
  paid_amount NUMERIC(18,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, invoice_number)
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  invoice_id UUID REFERENCES invoices(id),
  customer_id UUID REFERENCES customers(id),
  payment_date DATE NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  payment_method VARCHAR(50),
  -- cash / bank_transfer / cheque / card
  reference VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- الجدول 18-20: PURCHASING MODULE
-- ================================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_number VARCHAR(50),
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  country VARCHAR(100),
  tax_number VARCHAR(100),
  payment_terms INT DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  po_number VARCHAR(50) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  order_date DATE NOT NULL,
  expected_date DATE,
  status VARCHAR(30) DEFAULT 'draft',
  -- draft / sent / partial / received / cancelled
  warehouse_id UUID REFERENCES warehouses(id),
  subtotal NUMERIC(18,2),
  tax_amount NUMERIC(18,2) DEFAULT 0,
  total_amount NUMERIC(18,2),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, po_number)
);

CREATE TABLE purchase_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity NUMERIC(18,3) NOT NULL,
  unit_cost NUMERIC(18,2) NOT NULL,
  received_quantity NUMERIC(18,3) DEFAULT 0,
  line_total NUMERIC(18,2)
);

-- ================================================
-- الجدول 21-22: CRM MODULE
-- ================================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  source VARCHAR(100),
  status VARCHAR(50) DEFAULT 'new',
  -- new / contacted / qualified / proposal / won / lost
  assigned_to UUID REFERENCES users(id),
  estimated_value NUMERIC(18,2),
  expected_close_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  customer_id UUID REFERENCES customers(id),
  activity_type VARCHAR(50),
  -- call / email / meeting / note / task
  title VARCHAR(255),
  description TEXT,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- الجدول 23-24: PROJECTS MODULE
-- ================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  project_code VARCHAR(50),
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  customer_id UUID REFERENCES customers(id),
  manager_id UUID REFERENCES employees(id),
  start_date DATE,
  end_date DATE,
  status VARCHAR(30) DEFAULT 'planning',
  -- planning / active / on_hold / completed / cancelled
  budget NUMERIC(18,2),
  actual_cost NUMERIC(18,2) DEFAULT 0,
  progress_percent INT DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES employees(id),
  priority VARCHAR(20) DEFAULT 'medium',
  -- low / medium / high / critical
  status VARCHAR(30) DEFAULT 'todo',
  -- todo / in_progress / review / done
  start_date DATE,
  due_date DATE,
  estimated_hours NUMERIC(8,2),
  actual_hours NUMERIC(8,2) DEFAULT 0,
  parent_task_id UUID REFERENCES project_tasks(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- الجدول 25: TENANT_SETTINGS
-- ================================================
CREATE TABLE tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  company_name_ar VARCHAR(255),
  company_name_en VARCHAR(255),
  company_logo TEXT,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  tax_number VARCHAR(100),
  commercial_register VARCHAR(100),
  fiscal_year_start INT DEFAULT 1,
  date_format VARCHAR(30) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(10) DEFAULT '24h',
  currency VARCHAR(10) DEFAULT 'EGP',
  tax_percent NUMERIC(5,2) DEFAULT 14,
  invoice_prefix VARCHAR(20) DEFAULT 'INV',
  po_prefix VARCHAR(20) DEFAULT 'PO',
  so_prefix VARCHAR(20) DEFAULT 'SO',
  email_notifications BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 نظام المصادقة (Auth System)

### `server/routes/auth.js`

```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, tenant_slug } = req.body;

    // 1. جلب الشركة
    const tenantRes = await pool.query(
      'SELECT * FROM tenants WHERE slug = $1 AND is_active = TRUE',
      [tenant_slug]
    );
    if (!tenantRes.rows[0]) {
      return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
    }
    const tenant = tenantRes.rows[0];

    // 2. جلب المستخدم
    const userRes = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND tenant_id = $2 AND is_active = TRUE',
      [email.toLowerCase(), tenant.id]
    );
    if (!userRes.rows[0]) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }
    const user = userRes.rows[0];

    // 3. التحقق من كلمة المرور
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    // 4. إنشاء التوكنات
    const accessToken = jwt.sign(
      {
        userId: user.id,
        tenantId: tenant.id,
        role: user.role,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, tenantId: tenant.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // 5. تحديث آخر تسجيل دخول
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          language: user.language,
          theme: user.theme,
          avatarUrl: user.avatar_url
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logo: tenant.logo_url,
          primaryColor: tenant.primary_color,
          defaultLanguage: tenant.default_language
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// POST /api/auth/refresh-token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const userRes = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = TRUE',
      [decoded.userId]
    );
    if (!userRes.rows[0]) return res.status(401).json({ success: false });

    const user = userRes.rows[0];
    const accessToken = jwt.sign(
      { userId: user.id, tenantId: decoded.tenantId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ success: true, accessToken });
  } catch {
    res.status(401).json({ success: false, message: 'التوكن منتهي الصلاحية' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'تم تسجيل الخروج' });
});

module.exports = router;
```

---

## 🛡️ نظام الصلاحيات RBAC

### `server/middleware/rbac.js`

```javascript
// ======================================
// مصفوفة الصلاحيات الكاملة
// ======================================
const PERMISSIONS = {
  superadmin: { all: true },

  admin: {
    dashboard: ['read'],
    accounting: ['read', 'write', 'delete'],
    hr: ['read', 'write', 'delete'],
    inventory: ['read', 'write', 'delete'],
    sales: ['read', 'write', 'delete'],
    purchasing: ['read', 'write', 'delete'],
    crm: ['read', 'write', 'delete'],
    projects: ['read', 'write', 'delete'],
    reports: ['read', 'export'],
    users: ['read', 'write', 'delete'],
    settings: ['read', 'write']
  },

  accountant: {
    dashboard: ['read'],
    accounting: ['read', 'write', 'delete'],
    sales: ['read'],        // لرؤية الفواتير فقط
    purchasing: ['read'],   // لرؤية فواتير المشتريات
    reports: ['read', 'export']
  },

  hr: {
    dashboard: ['read'],
    hr: ['read', 'write', 'delete'],
    reports: ['read']
  },

  inventory_manager: {
    dashboard: ['read'],
    inventory: ['read', 'write', 'delete'],
    purchasing: ['read', 'write'],
    reports: ['read']
  },

  sales_manager: {
    dashboard: ['read'],
    sales: ['read', 'write', 'delete'],
    crm: ['read', 'write', 'delete'],
    inventory: ['read'],
    customers: ['read', 'write', 'delete'],
    reports: ['read']
  },

  purchasing_manager: {
    dashboard: ['read'],
    purchasing: ['read', 'write', 'delete'],
    inventory: ['read', 'write'],
    suppliers: ['read', 'write', 'delete'],
    reports: ['read']
  },

  viewer: {
    dashboard: ['read'],
    accounting: ['read'],
    hr: ['read'],
    inventory: ['read'],
    sales: ['read'],
    purchasing: ['read'],
    crm: ['read'],
    projects: ['read'],
    reports: ['read']
  }
};

// ======================================
// Middleware التحقق من الصلاحيات
// ======================================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'غير مصرح' });

  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'التوكن غير صالح' });
  }
};

const checkPermission = (module, action) => {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ success: false, message: 'غير مصرح' });

    const rolePerms = PERMISSIONS[role];
    if (!rolePerms) return res.status(403).json({ success: false, message: 'دور غير معروف' });

    // superadmin له كل الصلاحيات
    if (rolePerms.all) return next();

    const modulePerms = rolePerms[module];
    if (modulePerms && modulePerms.includes(action)) return next();

    return res.status(403).json({
      success: false,
      message: `ليس لديك صلاحية ${action} في وحدة ${module}`
    });
  };
};

// ======================================
// دالة مساعدة للواجهة الأمامية
// ======================================
const getMenuForRole = (role) => {
  const allMenuItems = [
    { id: 'dashboard',  label_ar: 'لوحة التحكم',    label_en: 'Dashboard',    icon: 'grid',         url: '/admin/dashboard.html',  module: 'dashboard' },
    { id: 'accounting', label_ar: 'المحاسبة',        label_en: 'Accounting',   icon: 'dollar-sign',  url: '/admin/accounting.html', module: 'accounting' },
    { id: 'hr',         label_ar: 'الموارد البشرية', label_en: 'HR',           icon: 'users',        url: '/admin/hr.html',         module: 'hr' },
    { id: 'inventory',  label_ar: 'المخزون',          label_en: 'Inventory',    icon: 'package',      url: '/admin/inventory.html',  module: 'inventory' },
    { id: 'sales',      label_ar: 'المبيعات',         label_en: 'Sales',        icon: 'shopping-cart',url: '/admin/sales.html',      module: 'sales' },
    { id: 'purchasing', label_ar: 'المشتريات',        label_en: 'Purchasing',   icon: 'truck',        url: '/admin/purchasing.html', module: 'purchasing' },
    { id: 'crm',        label_ar: 'العملاء CRM',      label_en: 'CRM',          icon: 'heart',        url: '/admin/crm.html',        module: 'crm' },
    { id: 'projects',   label_ar: 'المشاريع',         label_en: 'Projects',     icon: 'briefcase',    url: '/admin/projects.html',   module: 'projects' },
    { id: 'reports',    label_ar: 'التقارير',          label_en: 'Reports',      icon: 'bar-chart-2',  url: '/admin/reports.html',    module: 'reports' },
    { id: 'settings',   label_ar: 'الإعدادات',        label_en: 'Settings',     icon: 'settings',     url: '/admin/settings.html',   module: 'settings' }
  ];

  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return [];
  if (rolePerms.all) return allMenuItems;

  return allMenuItems.filter(item => rolePerms[item.module]);
};

module.exports = { verifyToken, checkPermission, getMenuForRole, PERMISSIONS };
```

---

## 🖥️ `server/index.js` الكامل

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { pool } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// Security Middleware
// ===============================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting على Auth فقط
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'كثير من المحاولات، انتظر 15 دقيقة' }
});

// ===============================
// Static Files
// ===============================
app.use(express.static(path.join(__dirname, '../public')));

// ===============================
// Health Check
// ===============================
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

  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'error',
    database: dbStatus,
    dbLatency: dbLatency ? `${dbLatency}ms` : null,
    uptime: `${Math.floor(process.uptime())}s`,
    serverTime: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  });
});

// ===============================
// API Routes
// ===============================
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/accounting', require('./routes/accounting'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/purchasing', require('./routes/purchasing'));
app.use('/api/crm', require('./routes/crm'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/tenants', require('./routes/tenants'));

// ===============================
// API: Menu للواجهة الأمامية
// ===============================
const { verifyToken, getMenuForRole } = require('./middleware/rbac');
app.get('/api/menu', verifyToken, (req, res) => {
  const menu = getMenuForRole(req.user.role);
  res.json({ success: true, data: menu });
});

// ===============================
// SPA Fallback
// ===============================
app.get('/admin/*', (req, res) => {
  const requestedFile = path.join(__dirname, '../public', req.path);
  const fs = require('fs');
  if (fs.existsSync(requestedFile)) {
    res.sendFile(requestedFile);
  } else {
    res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
  }
});

app.get('/', (req, res) => {
  res.redirect('/admin/login.html');
});

// ===============================
// Error Handler
// ===============================
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.listen(PORT, () => {
  console.log(`🚀 Nexus ERP Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login page: http://localhost:${PORT}/admin/login.html`);
});
```

---

## 🌐 واجهة المستخدم — صفحة Login

### `public/admin/login.html`

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus ERP — تسجيل الدخول</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    [dir="rtl"] { font-family: 'Cairo', sans-serif; }
    [dir="ltr"] { font-family: 'Inter', sans-serif; }
    .gradient-bg { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); }
    .animate-float { animation: float 6s ease-in-out infinite; }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    .input-field {
      width: 100%; padding: 12px 16px; border: 2px solid #E5E7EB;
      border-radius: 12px; font-size: 14px; transition: all 0.2s;
      outline: none; background: #FAFAFA;
    }
    .input-field:focus { border-color: #4F46E5; background: white; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
    .btn-primary {
      width: 100%; padding: 14px; background: linear-gradient(135deg, #4F46E5, #7C3AED);
      color: white; border-radius: 12px; font-weight: 700; font-size: 16px;
      border: none; cursor: pointer; transition: all 0.2s;
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(79,70,229,0.4); }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
  </style>
</head>
<body class="min-h-screen gradient-bg flex items-center justify-center p-4">

  <!-- Language Switcher -->
  <div class="fixed top-4 left-4 z-50" id="langContainer">
    <select id="langSwitcher" onchange="switchLang(this.value)"
      class="bg-white/20 text-white border border-white/30 rounded-lg px-3 py-2 text-sm cursor-pointer backdrop-blur">
      <option value="ar">🇪🇬 العربية</option>
      <option value="en">🇺🇸 English</option>
      <option value="fr">🇫🇷 Français</option>
    </select>
  </div>

  <div class="w-full max-w-md">
    <!-- Logo Section -->
    <div class="text-center mb-8 animate-float">
      <div class="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur rounded-2xl mb-4 shadow-lg">
        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      </div>
      <h1 class="text-4xl font-black text-white tracking-tight">Nexus ERP</h1>
      <p class="text-white/70 mt-1 text-sm" id="tagline">نظام إدارة موارد المؤسسات</p>
    </div>

    <!-- Login Card -->
    <div class="bg-white rounded-3xl p-8 shadow-2xl">
      <h2 class="text-2xl font-bold text-gray-800 mb-6" id="loginTitle">تسجيل الدخول</h2>

      <!-- Error Message -->
      <div id="errorMsg" class="hidden bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-5 text-sm flex items-center gap-2">
        <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
        </svg>
        <span id="errorText"></span>
      </div>

      <div class="space-y-4">
        <!-- Company Code -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5" id="lblCompany">كود الشركة</label>
          <input id="tenantSlug" type="text" class="input-field" placeholder="nexus-demo"
            value="nexus-demo" autocomplete="organization">
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5" id="lblEmail">البريد الإلكتروني</label>
          <input id="loginEmail" type="email" class="input-field" placeholder="admin@nexus.com"
            value="admin@nexus.com" autocomplete="email">
        </div>

        <!-- Password -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5" id="lblPassword">كلمة المرور</label>
          <div class="relative">
            <input id="loginPassword" type="password" class="input-field" placeholder="••••••••"
              value="admin123" autocomplete="current-password">
            <button type="button" onclick="togglePwd()"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition">
              <svg id="eyeOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Submit -->
        <button id="loginBtn" onclick="handleLogin()" class="btn-primary mt-2" id="btnLogin">
          <span id="btnText">تسجيل الدخول</span>
        </button>
      </div>

      <p class="text-center text-gray-400 text-xs mt-6">Nexus ERP v2.0 © 2025</p>
    </div>
  </div>

<script>
const LANGS = {
  ar: { tagline: 'نظام إدارة موارد المؤسسات', loginTitle: 'تسجيل الدخول', lblCompany: 'كود الشركة', lblEmail: 'البريد الإلكتروني', lblPassword: 'كلمة المرور', btnText: 'تسجيل الدخول', dir: 'rtl', font: 'Cairo' },
  en: { tagline: 'Enterprise Resource Planning System', loginTitle: 'Sign In', lblCompany: 'Company Code', lblEmail: 'Email Address', lblPassword: 'Password', btnText: 'Sign In', dir: 'ltr', font: 'Inter' },
  fr: { tagline: 'Système de Planification des Ressources', loginTitle: 'Connexion', lblCompany: 'Code Entreprise', lblEmail: 'Adresse Email', lblPassword: 'Mot de passe', btnText: 'Se connecter', dir: 'ltr', font: 'Inter' }
};

let currentLang = localStorage.getItem('nexus_lang') || 'ar';

function switchLang(lang) {
  currentLang = lang;
  localStorage.setItem('nexus_lang', lang);
  const L = LANGS[lang];
  document.documentElement.dir = L.dir;
  document.documentElement.lang = lang;
  document.getElementById('tagline').textContent = L.tagline;
  document.getElementById('loginTitle').textContent = L.loginTitle;
  document.getElementById('lblCompany').textContent = L.lblCompany;
  document.getElementById('lblEmail').textContent = L.lblEmail;
  document.getElementById('lblPassword').textContent = L.lblPassword;
  document.getElementById('btnText').textContent = L.btnText;
  document.getElementById('langSwitcher').value = lang;
}

function togglePwd() {
  const input = document.getElementById('loginPassword');
  input.type = input.type === 'password' ? 'text' : 'password';
}

async function handleLogin() {
  const btn = document.getElementById('loginBtn');
  const errorMsg = document.getElementById('errorMsg');
  const errorText = document.getElementById('errorText');
  errorMsg.classList.add('hidden');

  const tenant_slug = document.getElementById('tenantSlug').value.trim();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!tenant_slug || !email || !password) {
    errorText.textContent = currentLang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields';
    errorMsg.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  document.getElementById('btnText').textContent = currentLang === 'ar' ? 'جاري الدخول...' : 'Signing in...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, tenant_slug })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('nexus_token', data.data.accessToken);
      localStorage.setItem('nexus_refresh', data.data.refreshToken);
      localStorage.setItem('nexus_user', JSON.stringify(data.data.user));
      localStorage.setItem('nexus_tenant', JSON.stringify(data.data.tenant));
      window.location.href = '/admin/dashboard.html';
    } else {
      errorText.textContent = data.message || 'خطأ في تسجيل الدخول';
      errorMsg.classList.remove('hidden');
      btn.disabled = false;
      document.getElementById('btnText').textContent = LANGS[currentLang].btnText;
    }
  } catch (err) {
    errorText.textContent = 'لا يمكن الاتصال بالخادم';
    errorMsg.classList.remove('hidden');
    btn.disabled = false;
    document.getElementById('btnText').textContent = LANGS[currentLang].btnText;
  }
}

// تطبيق اللغة عند التحميل
switchLang(currentLang);

// Enter key
document.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
</script>
</body>
</html>
```

---

## 🏠 واجهة Dashboard الكاملة

### `public/admin/dashboard.html`

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus ERP — لوحة التحكم</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/feather-icons"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    [dir="rtl"] body { font-family: 'Cairo', sans-serif; }
    [dir="ltr"] body { font-family: 'Inter', sans-serif; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #F1F5F9; }
    #sidebar { width: 260px; min-height: 100vh; background: linear-gradient(180deg, #1E1B4B 0%, #312E81 100%); transition: width 0.3s; }
    #sidebar.collapsed { width: 70px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: rgba(255,255,255,0.7); border-radius: 10px; margin: 2px 8px; cursor: pointer; transition: all 0.2s; text-decoration: none; }
    .nav-item:hover { background: rgba(255,255,255,0.1); color: white; }
    .nav-item.active { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; box-shadow: 0 4px 12px rgba(79,70,229,0.4); }
    .nav-item .label { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; }
    .stat-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); transition: all 0.2s; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.12); }
    .icon-box { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
    .topbar { height: 64px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.08); display: flex; align-items: center; padding: 0 24px; gap: 16px; }
    #sidebar.collapsed .label { display: none; }
    #sidebar.collapsed .nav-item { justify-content: center; }
    #sidebar.collapsed .logo-text { display: none; }
    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .table-row { transition: background 0.15s; }
    .table-row:hover { background: #F8FAFC; }
    @media (max-width: 768px) { #sidebar { position: fixed; z-index: 100; transform: translateX(260px); } #sidebar.mobile-open { transform: translateX(0); } [dir="ltr"] #sidebar { transform: translateX(-260px); } [dir="ltr"] #sidebar.mobile-open { transform: translateX(0); } }
  </style>
</head>
<body>
<div class="flex min-h-screen">

  <!-- ================== SIDEBAR ================== -->
  <aside id="sidebar">
    <!-- Logo -->
    <div class="p-5 flex items-center gap-3 border-b border-white/10">
      <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      </div>
      <div class="logo-text">
        <div class="text-white font-black text-lg">Nexus ERP</div>
        <div class="text-white/50 text-xs" id="tenantNameDisplay">تحميل...</div>
      </div>
    </div>

    <!-- Navigation -->
    <nav id="sidebarNav" class="p-3 mt-2 space-y-0.5">
      <!-- يتم ملؤها ديناميكياً بـ JavaScript -->
      <div class="text-white/30 text-xs px-3 py-2">جاري التحميل...</div>
    </nav>

    <!-- User at bottom -->
    <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" id="userAvatar">U</div>
        <div class="logo-text overflow-hidden">
          <div class="text-white text-sm font-semibold truncate" id="userFullName">...</div>
          <div class="text-white/50 text-xs" id="userRoleDisplay">...</div>
        </div>
        <button onclick="logout()" class="logo-text text-white/50 hover:text-red-400 transition mr-auto flex-shrink-0" title="تسجيل الخروج">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>
    </div>
  </aside>

  <!-- ================== MAIN CONTENT ================== -->
  <div class="flex-1 flex flex-col overflow-hidden">

    <!-- Top Bar -->
    <header class="topbar">
      <button onclick="toggleSidebar()" class="text-gray-500 hover:text-indigo-600 transition">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      <div class="flex-1 max-w-sm relative">
        <input type="text" placeholder="بحث سريع..." class="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>

      <div class="mr-auto flex items-center gap-3">
        <!-- Language Switcher -->
        <select id="topLangSwitcher" onchange="switchLang(this.value)"
          class="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="ar">🇪🇬 AR</option>
          <option value="en">🇺🇸 EN</option>
          <option value="fr">🇫🇷 FR</option>
        </select>

        <!-- Notifications -->
        <button class="relative text-gray-500 hover:text-indigo-600 transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
        </button>

        <!-- Theme Toggle -->
        <button onclick="toggleTheme()" class="text-gray-500 hover:text-indigo-600 transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
        </button>

        <!-- Health Status -->
        <a href="/admin/health.html" class="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition" id="healthIndicator">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>النظام يعمل</span>
        </a>
      </div>
    </header>

    <!-- Page Content -->
    <main class="flex-1 overflow-y-auto p-6">

      <!-- Page Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-black text-gray-800" id="pageTitle">لوحة التحكم</h1>
          <p class="text-gray-500 text-sm mt-1" id="pageSubtitle">مرحباً بك في Nexus ERP</p>
        </div>
        <div class="text-sm text-gray-500" id="currentDateTime"></div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6" id="kpiCards">
        <!-- يتم ملؤها ديناميكياً -->
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div class="lg:col-span-2 stat-card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-gray-700">الإيرادات مقابل المصروفات</h3>
            <select class="text-xs border border-gray-200 rounded-lg px-2 py-1">
              <option>آخر 6 أشهر</option>
              <option>هذا العام</option>
            </select>
          </div>
          <canvas id="revenueChart" height="100"></canvas>
        </div>
        <div class="stat-card">
          <h3 class="font-bold text-gray-700 mb-4">توزيع المبيعات</h3>
          <canvas id="salesChart" height="160"></canvas>
        </div>
      </div>

      <!-- Recent Orders Table -->
      <div class="stat-card mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-gray-700">آخر الطلبات</h3>
          <a href="/admin/sales.html" class="text-sm text-indigo-600 hover:underline font-medium">عرض الكل</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-right border-b border-gray-100">
                <th class="pb-3 text-gray-500 font-semibold">رقم الطلب</th>
                <th class="pb-3 text-gray-500 font-semibold">العميل</th>
                <th class="pb-3 text-gray-500 font-semibold">التاريخ</th>
                <th class="pb-3 text-gray-500 font-semibold">المبلغ</th>
                <th class="pb-3 text-gray-500 font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody id="recentOrdersTable">
              <tr><td colspan="5" class="py-8 text-center text-gray-400">جاري التحميل...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bottom Row: Alerts + Quick Actions -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Alerts -->
        <div class="stat-card">
          <h3 class="font-bold text-gray-700 mb-4">⚠️ تنبيهات المخزون</h3>
          <div id="stockAlerts" class="space-y-2">
            <p class="text-gray-400 text-sm">جاري التحميل...</p>
          </div>
        </div>
        <!-- Quick Actions -->
        <div class="stat-card">
          <h3 class="font-bold text-gray-700 mb-4">⚡ إجراءات سريعة</h3>
          <div class="grid grid-cols-2 gap-3" id="quickActions">
            <!-- يتم ملؤها حسب الصلاحيات -->
          </div>
        </div>
      </div>
    </main>
  </div>
</div>

<script>
// ==========================================
// 1. التحقق من تسجيل الدخول
// ==========================================
const token = localStorage.getItem('nexus_token');
const user = JSON.parse(localStorage.getItem('nexus_user') || '{}');
const tenant = JSON.parse(localStorage.getItem('nexus_tenant') || '{}');

if (!token || !user.id) {
  window.location.href = '/admin/login.html';
}

// ==========================================
// 2. تعريف القائمة حسب الأدوار
// ==========================================
const MENU_BY_ROLE = {
  superadmin: ['dashboard','accounting','hr','inventory','sales','purchasing','crm','projects','reports','settings'],
  admin:      ['dashboard','accounting','hr','inventory','sales','purchasing','crm','projects','reports','settings'],
  accountant: ['dashboard','accounting','sales','purchasing','reports'],
  hr:         ['dashboard','hr','reports'],
  inventory_manager: ['dashboard','inventory','purchasing','reports'],
  sales_manager:     ['dashboard','sales','crm','inventory','reports'],
  purchasing_manager:['dashboard','purchasing','inventory','reports'],
  viewer:     ['dashboard','accounting','hr','inventory','sales','purchasing','crm','projects','reports']
};

const ALL_MENU_ITEMS = [
  { id: 'dashboard',  label_ar: 'لوحة التحكم',    label_en: 'Dashboard',    icon: '⊞', url: '/admin/dashboard.html' },
  { id: 'accounting', label_ar: 'المحاسبة',        label_en: 'Accounting',   icon: '💰', url: '/admin/accounting.html' },
  { id: 'hr',         label_ar: 'الموارد البشرية', label_en: 'HR',           icon: '👥', url: '/admin/hr.html' },
  { id: 'inventory',  label_ar: 'المخزون',          label_en: 'Inventory',    icon: '📦', url: '/admin/inventory.html' },
  { id: 'sales',      label_ar: 'المبيعات',         label_en: 'Sales',        icon: '🛒', url: '/admin/sales.html' },
  { id: 'purchasing', label_ar: 'المشتريات',        label_en: 'Purchasing',   icon: '🚚', url: '/admin/purchasing.html' },
  { id: 'crm',        label_ar: 'إدارة العملاء',    label_en: 'CRM',          icon: '❤️', url: '/admin/crm.html' },
  { id: 'projects',   label_ar: 'المشاريع',         label_en: 'Projects',     icon: '📋', url: '/admin/projects.html' },
  { id: 'reports',    label_ar: 'التقارير',          label_en: 'Reports',      icon: '📊', url: '/admin/reports.html' },
  { id: 'settings',   label_ar: 'الإعدادات',        label_en: 'Settings',     icon: '⚙️', url: '/admin/settings.html' }
];

// ==========================================
// 3. بناء القائمة الجانبية
// ==========================================
function buildSidebar() {
  const role = user.role || 'viewer';
  const allowedIds = MENU_BY_ROLE[role] || MENU_BY_ROLE.viewer;
  const currentPage = window.location.pathname;
  const lang = localStorage.getItem('nexus_lang') || 'ar';

  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';

  const filteredMenu = ALL_MENU_ITEMS.filter(item => allowedIds.includes(item.id));

  filteredMenu.forEach(item => {
    const isActive = currentPage.includes(item.id) || (item.id === 'dashboard' && currentPage.includes('dashboard'));
    const a = document.createElement('a');
    a.href = item.url;
    a.className = `nav-item ${isActive ? 'active' : ''}`;
    a.innerHTML = `
      <span style="font-size:18px;flex-shrink:0">${item.icon}</span>
      <span class="label">${lang === 'en' ? item.label_en : item.label_ar}</span>
    `;
    nav.appendChild(a);
  });

  // User info
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  document.getElementById('userFullName').textContent = fullName;
  document.getElementById('userRoleDisplay').textContent = getRoleLabel(role);
  document.getElementById('userAvatar').textContent = fullName.charAt(0).toUpperCase();
  document.getElementById('tenantNameDisplay').textContent = tenant.name || 'Nexus ERP';
}

function getRoleLabel(role) {
  const labels = { superadmin: 'مدير النظام', admin: 'مدير', accountant: 'محاسب', hr: 'موارد بشرية', inventory_manager: 'مدير المخزون', sales_manager: 'مدير المبيعات', purchasing_manager: 'مدير المشتريات', viewer: 'مشاهد' };
  return labels[role] || role;
}

// ==========================================
// 4. بطاقات KPI
// ==========================================
function buildKPICards() {
  const cards = [
    { title: 'إجمالي الإيرادات', value: '٢٣٥,٤٠٠ ج.م', change: '+12.5%', positive: true, color: 'bg-blue-500', icon: '💰' },
    { title: 'إجمالي المصروفات', value: '١٢٨,٩٠٠ ج.م', change: '-3.2%', positive: false, color: 'bg-red-500', icon: '💸' },
    { title: 'صافي الربح', value: '١٠٦,٥٠٠ ج.م', change: '+8.1%', positive: true, color: 'bg-green-500', icon: '📈' },
    { title: 'فواتير معلقة', value: '١٨ فاتورة', change: 'تحتاج متابعة', positive: null, color: 'bg-orange-500', icon: '⏰' }
  ];

  const container = document.getElementById('kpiCards');
  container.innerHTML = cards.map(card => `
    <div class="stat-card">
      <div class="flex items-center justify-between mb-3">
        <span class="text-2xl">${card.icon}</span>
        <span class="badge ${card.positive === true ? 'bg-green-100 text-green-700' : card.positive === false ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}">${card.change}</span>
      </div>
      <div class="text-2xl font-black text-gray-800 mb-1">${card.value}</div>
      <div class="text-sm text-gray-500">${card.title}</div>
    </div>
  `).join('');
}

// ==========================================
// 5. الرسوم البيانية
// ==========================================
function buildCharts() {
  // Revenue Chart
  const revenueCtx = document.getElementById('revenueChart').getContext('2d');
  new Chart(revenueCtx, {
    type: 'bar',
    data: {
      labels: ['أكتوبر', 'نوفمبر', 'ديسمبر', 'يناير', 'فبراير', 'مارس'],
      datasets: [
        { label: 'الإيرادات', data: [180000, 210000, 195000, 220000, 240000, 235400], backgroundColor: 'rgba(79,70,229,0.8)', borderRadius: 8 },
        { label: 'المصروفات', data: [120000, 130000, 125000, 135000, 140000, 128900], backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 8 }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { callback: v => (v/1000)+'K' } } } }
  });

  // Sales Donut Chart
  const salesCtx = document.getElementById('salesChart').getContext('2d');
  new Chart(salesCtx, {
    type: 'doughnut',
    data: {
      labels: ['إلكترونيات', 'أجهزة', 'ملحقات', 'أخرى'],
      datasets: [{ data: [45, 28, 17, 10], backgroundColor: ['#4F46E5', '#7C3AED', '#06B6D4', '#F59E0B'], borderWidth: 0 }]
    },
    options: { responsive: true, cutout: '70%', plugins: { legend: { position: 'bottom' } } }
  });
}

// ==========================================
// 6. جدول آخر الطلبات (Demo Data)
// ==========================================
function buildRecentOrders() {
  const orders = [
    { number: 'SO-2025-001', customer: 'شركة النيل للتجارة', date: '2025-03-28', amount: '45,200 ج.م', status: 'مكتمل', statusClass: 'bg-green-100 text-green-700' },
    { number: 'SO-2025-002', customer: 'مؤسسة الأهرام', date: '2025-03-27', amount: '12,800 ج.م', status: 'معلق', statusClass: 'bg-yellow-100 text-yellow-700' },
    { number: 'SO-2025-003', customer: 'شركة المستقبل', date: '2025-03-26', amount: '8,500 ج.م', status: 'شحن', statusClass: 'bg-blue-100 text-blue-700' },
    { number: 'SO-2025-004', customer: 'مكتبة القاهرة', date: '2025-03-25', amount: '3,200 ج.م', status: 'ملغي', statusClass: 'bg-red-100 text-red-700' },
    { number: 'SO-2025-005', customer: 'مطابع الوطن', date: '2025-03-24', amount: '67,900 ج.م', status: 'مكتمل', statusClass: 'bg-green-100 text-green-700' }
  ];

  const tbody = document.getElementById('recentOrdersTable');
  tbody.innerHTML = orders.map(o => `
    <tr class="table-row border-b border-gray-50">
      <td class="py-3 font-mono text-indigo-600 font-semibold">${o.number}</td>
      <td class="py-3 text-gray-700">${o.customer}</td>
      <td class="py-3 text-gray-500">${o.date}</td>
      <td class="py-3 font-bold text-gray-800">${o.amount}</td>
      <td class="py-3"><span class="badge ${o.statusClass}">${o.status}</span></td>
    </tr>
  `).join('');
}

// ==========================================
// 7. الإجراءات السريعة حسب الدور
// ==========================================
function buildQuickActions() {
  const role = user.role || 'viewer';
  const allActions = [
    { label: 'فاتورة جديدة', icon: '📄', url: '/admin/sales.html', roles: ['superadmin','admin','accountant','sales_manager'] },
    { label: 'أمر شراء', icon: '🛍️', url: '/admin/purchasing.html', roles: ['superadmin','admin','purchasing_manager','inventory_manager'] },
    { label: 'موظف جديد', icon: '👤', url: '/admin/hr.html', roles: ['superadmin','admin','hr'] },
    { label: 'منتج جديد', icon: '📦', url: '/admin/inventory.html', roles: ['superadmin','admin','inventory_manager'] },
    { label: 'عميل جديد', icon: '🤝', url: '/admin/crm.html', roles: ['superadmin','admin','sales_manager','crm'] },
    { label: 'مشروع جديد', icon: '🚀', url: '/admin/projects.html', roles: ['superadmin','admin'] }
  ];

  const allowed = allActions.filter(a => a.roles.includes(role));
  const container = document.getElementById('quickActions');
  container.innerHTML = allowed.slice(0,6).map(a => `
    <a href="${a.url}" class="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-indigo-50 rounded-xl transition cursor-pointer text-center">
      <span class="text-2xl">${a.icon}</span>
      <span class="text-xs font-semibold text-gray-600">${a.label}</span>
    </a>
  `).join('');

  if (allowed.length === 0) {
    container.innerHTML = '<p class="text-gray-400 text-sm col-span-2">لا توجد إجراءات متاحة</p>';
  }
}

// ==========================================
// 8. التاريخ والوقت
// ==========================================
function updateDateTime() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  document.getElementById('currentDateTime').textContent = now.toLocaleDateString('ar-EG', options);
}

// ==========================================
// 9. تبديل اللغة
// ==========================================
const LANGS = { ar: { dir: 'rtl', pageTitle: 'لوحة التحكم', pageSubtitle: 'مرحباً بك في Nexus ERP' }, en: { dir: 'ltr', pageTitle: 'Dashboard', pageSubtitle: 'Welcome to Nexus ERP' }, fr: { dir: 'ltr', pageTitle: 'Tableau de bord', pageSubtitle: 'Bienvenue dans Nexus ERP' } };

function switchLang(lang) {
  localStorage.setItem('nexus_lang', lang);
  document.documentElement.dir = LANGS[lang].dir;
  document.documentElement.lang = lang;
  document.getElementById('pageTitle').textContent = LANGS[lang].pageTitle;
  document.getElementById('pageSubtitle').textContent = LANGS[lang].pageSubtitle;
  document.getElementById('topLangSwitcher').value = lang;
  buildSidebar();
}

// ==========================================
// 10. وظائف عامة
// ==========================================
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

function logout() {
  if (confirm('هل تريد تسجيل الخروج؟')) {
    localStorage.clear();
    window.location.href = '/admin/login.html';
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark');
}

// ==========================================
// 11. تشغيل كل شيء
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  const lang = localStorage.getItem('nexus_lang') || 'ar';
  document.getElementById('topLangSwitcher').value = lang;
  switchLang(lang);
  buildSidebar();
  buildKPICards();
  buildCharts();
  buildRecentOrders();
  buildQuickActions();
  updateDateTime();
  setInterval(updateDateTime, 60000);

  // فحص صحة النظام
  fetch('/health').then(r => r.json()).then(data => {
    const indicator = document.getElementById('healthIndicator');
    if (data.status !== 'ok') {
      indicator.className = 'flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg';
      indicator.innerHTML = '<span class="w-2 h-2 bg-red-500 rounded-full"></span><span>خطأ في النظام</span>';
    }
  }).catch(() => {
    const indicator = document.getElementById('healthIndicator');
    indicator.className = 'flex items-center gap-1.5 text-xs text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg';
    indicator.innerHTML = '<span class="w-2 h-2 bg-yellow-500 rounded-full"></span><span>تحقق من الاتصال</span>';
  });
});
</script>
</body>
</html>
```

---

## 🏥 صفحة Health Check

### `public/admin/health.html`

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
    body { font-family: 'Cairo', sans-serif; background: #0F172A; color: white; min-height: 100vh; }
    .card { background: #1E293B; border: 1px solid #334155; border-radius: 16px; padding: 24px; }
    .status-ok { color: #10B981; }
    .status-error { color: #EF4444; }
    .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
    .metric { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #334155; }
    .metric:last-child { border-bottom: none; }
  </style>
</head>
<body class="p-6">
  <div class="max-w-3xl mx-auto">
    <div class="flex items-center gap-4 mb-8">
      <a href="/admin/dashboard.html" class="text-slate-400 hover:text-white transition">← العودة</a>
      <h1 class="text-3xl font-black">🩺 System Health — Nexus ERP</h1>
      <div id="autoRefreshBadge" class="text-xs bg-blue-900 text-blue-300 px-3 py-1 rounded-full">تحديث تلقائي كل 30 ث</div>
    </div>

    <!-- Main Status -->
    <div class="card mb-5">
      <div class="flex items-center gap-4">
        <div id="statusDot" class="w-4 h-4 rounded-full bg-gray-500 pulse"></div>
        <div>
          <div class="text-xl font-bold" id="statusText">جاري الفحص...</div>
          <div class="text-slate-400 text-sm" id="statusSubtext">يرجى الانتظار</div>
        </div>
        <button onclick="checkHealth()" class="mr-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition">🔄 فحص الآن</button>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
      <div class="card">
        <h3 class="font-bold text-slate-300 mb-3 text-sm uppercase tracking-wide">قاعدة البيانات</h3>
        <div class="metric"><span class="text-slate-400">الحالة</span><span id="dbStatus" class="font-mono">—</span></div>
        <div class="metric"><span class="text-slate-400">زمن الاستجابة</span><span id="dbLatency" class="font-mono">—</span></div>
      </div>
      <div class="card">
        <h3 class="font-bold text-slate-300 mb-3 text-sm uppercase tracking-wide">الخادم</h3>
        <div class="metric"><span class="text-slate-400">وقت التشغيل</span><span id="uptime" class="font-mono">—</span></div>
        <div class="metric"><span class="text-slate-400">البيئة</span><span id="environment" class="font-mono">—</span></div>
      </div>
      <div class="card">
        <h3 class="font-bold text-slate-300 mb-3 text-sm uppercase tracking-wide">الذاكرة</h3>
        <div class="metric"><span class="text-slate-400">المستخدمة</span><span id="memUsed" class="font-mono">—</span></div>
        <div class="metric"><span class="text-slate-400">الإجمالية</span><span id="memTotal" class="font-mono">—</span></div>
      </div>
      <div class="card">
        <h3 class="font-bold text-slate-300 mb-3 text-sm uppercase tracking-wide">النظام</h3>
        <div class="metric"><span class="text-slate-400">الإصدار</span><span id="version" class="font-mono">—</span></div>
        <div class="metric"><span class="text-slate-400">وقت الخادم</span><span id="serverTime" class="font-mono text-xs">—</span></div>
      </div>
    </div>

    <!-- Raw JSON -->
    <div class="card">
      <h3 class="font-bold text-slate-300 mb-3 text-sm">📋 Raw API Response — <code class="text-indigo-400">GET /health</code></h3>
      <pre id="rawJson" class="text-green-400 text-xs overflow-x-auto leading-relaxed">جاري التحميل...</pre>
    </div>

    <p class="text-center text-slate-600 text-xs mt-4" id="lastChecked">لم يتم الفحص بعد</p>
  </div>

<script>
async function checkHealth() {
  try {
    const res = await fetch('/health');
    const data = await res.json();

    const isOk = data.status === 'ok';
    document.getElementById('statusDot').className = `w-4 h-4 rounded-full pulse ${isOk ? 'bg-green-500' : 'bg-red-500'}`;
    document.getElementById('statusText').textContent = isOk ? '✅ النظام يعمل بشكل طبيعي' : '❌ يوجد مشكلة في النظام';
    document.getElementById('statusText').className = isOk ? 'text-xl font-bold text-green-400' : 'text-xl font-bold text-red-400';
    document.getElementById('statusSubtext').textContent = isOk ? 'جميع الخدمات تعمل' : 'تحقق من سجلات الخادم';

    document.getElementById('dbStatus').textContent = data.database;
    document.getElementById('dbStatus').className = `font-mono ${data.database === 'connected' ? 'text-green-400' : 'text-red-400'}`;
    document.getElementById('dbLatency').textContent = data.dbLatency || '—';
    document.getElementById('uptime').textContent = data.uptime;
    document.getElementById('environment').textContent = data.environment || 'development';
    document.getElementById('memUsed').textContent = data.memory?.used || '—';
    document.getElementById('memTotal').textContent = data.memory?.total || '—';
    document.getElementById('version').textContent = data.version;
    document.getElementById('serverTime').textContent = new Date(data.serverTime).toLocaleString('ar-EG');
    document.getElementById('rawJson').textContent = JSON.stringify(data, null, 2);
    document.getElementById('lastChecked').textContent = `آخر فحص: ${new Date().toLocaleTimeString('ar-EG')}`;

  } catch (err) {
    document.getElementById('statusDot').className = 'w-4 h-4 rounded-full bg-red-500 pulse';
    document.getElementById('statusText').textContent = '🔴 لا يمكن الاتصال بالخادم';
    document.getElementById('statusText').className = 'text-xl font-bold text-red-400';
    document.getElementById('statusSubtext').textContent = 'تحقق من تشغيل الخادم: npm run dev';
    document.getElementById('rawJson').textContent = 'Error: ' + err.message;
  }
}

// تشغيل فوري وتحديث كل 30 ثانية
checkHealth();
setInterval(checkHealth, 30000);
</script>
</body>
</html>
```

---

## 📦 package.json

```json
{
  "name": "nexus-erp",
  "version": "2.0.0",
  "description": "Multi-Tenant Oracle-like ERP System",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js",
    "dev": "nodemon server/index.js",
    "migrate": "node migrations/run.js",
    "seed": "node seeds/seed.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "exceljs": "^4.3.0",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "multer": "^1.4.5",
    "nodemailer": "^6.9.7",
    "pdfkit": "^0.14.0",
    "pg": "^8.11.3",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## ⚙️ ملف `.env.example`

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nexus_erp
PGHOST=localhost
PGPORT=5432
PGDATABASE=nexus_erp
PGUSER=postgres
PGPASSWORD=yourpassword

# JWT
JWT_SECRET=your_very_long_secret_key_minimum_64_characters_change_this
JWT_REFRESH_SECRET=another_very_long_refresh_secret_key_change_this_too

# Server
PORT=5000
NODE_ENV=development

# SuperAdmin Setup Secret
SETUP_SECRET=nexus_setup_2025

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
```

---

## 🌱 ملف Seed (إنشاء بيانات تجريبية)

### `seeds/seed.js`

```javascript
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  console.log('🌱 Starting seed...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. إنشاء شركة تجريبية
    const tenantRes = await client.query(`
      INSERT INTO tenants (name, slug, primary_color, default_language, default_currency, subscription_plan)
      VALUES ('شركة نكسس للتجارة', 'nexus-demo', '#4F46E5', 'ar', 'EGP', 'enterprise')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `);
    const tenant = tenantRes.rows[0];
    console.log('✅ Tenant created:', tenant.slug);

    // 2. إنشاء إعدادات الشركة
    await client.query(`
      INSERT INTO tenant_settings (tenant_id, company_name_ar, company_name_en, currency, tax_percent)
      VALUES ($1, 'شركة نكسس للتجارة', 'Nexus Trading Company', 'EGP', 14)
      ON CONFLICT (tenant_id) DO NOTHING
    `, [tenant.id]);

    // 3. إنشاء المستخدمين لكل دور
    const users = [
      { email: 'superadmin@nexus.com', password: 'super123', role: 'superadmin', firstName: 'Super', lastName: 'Admin' },
      { email: 'admin@nexus.com', password: 'admin123', role: 'admin', firstName: 'أحمد', lastName: 'محمد' },
      { email: 'accountant@nexus.com', password: 'acc123', role: 'accountant', firstName: 'محمد', lastName: 'علي' },
      { email: 'hr@nexus.com', password: 'hr123', role: 'hr', firstName: 'سارة', lastName: 'أحمد' },
      { email: 'inventory@nexus.com', password: 'inv123', role: 'inventory_manager', firstName: 'خالد', lastName: 'عمر' },
      { email: 'sales@nexus.com', password: 'sales123', role: 'sales_manager', firstName: 'فاطمة', lastName: 'حسن' },
      { email: 'purchasing@nexus.com', password: 'pur123', role: 'purchasing_manager', firstName: 'عمر', lastName: 'يوسف' },
      { email: 'viewer@nexus.com', password: 'view123', role: 'viewer', firstName: 'مريم', lastName: 'علي' }
    ];

    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 12);
      await client.query(`
        INSERT INTO users (tenant_id, email, password_hash, role, first_name, last_name, language)
        VALUES ($1, $2, $3, $4, $5, $6, 'ar')
        ON CONFLICT (tenant_id, email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      `, [tenant.id, u.email, hash, u.role, u.firstName, u.lastName]);
      console.log(`✅ User: ${u.email} (${u.role})`);
    }

    await client.query('COMMIT');
    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Company Code: nexus-demo');
    users.forEach(u => console.log(`  ${u.role}: ${u.email} / ${u.password}`));

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
```

---

## 🌍 ملفات الترجمة

### `locales/ar.json` (مختصر — وسّعه حسب الحاجة)

```json
{
  "app": { "name": "نكسس ERP", "tagline": "نظام إدارة موارد المؤسسات" },
  "nav": { "dashboard": "لوحة التحكم", "accounting": "المحاسبة", "hr": "الموارد البشرية", "inventory": "المخزون", "sales": "المبيعات", "purchasing": "المشتريات", "crm": "إدارة العملاء", "projects": "المشاريع", "reports": "التقارير", "settings": "الإعدادات" },
  "auth": { "login": "تسجيل الدخول", "logout": "تسجيل الخروج", "email": "البريد الإلكتروني", "password": "كلمة المرور", "company_code": "كود الشركة", "forgot_password": "نسيت كلمة المرور؟" },
  "common": { "save": "حفظ", "cancel": "إلغاء", "delete": "حذف", "edit": "تعديل", "add": "إضافة جديدة", "search": "بحث", "filter": "تصفية", "export": "تصدير", "print": "طباعة", "loading": "جاري التحميل...", "no_data": "لا توجد بيانات", "success": "تم بنجاح", "error": "حدث خطأ", "total": "الإجمالي", "status": "الحالة", "actions": "الإجراءات" }
}
```

---

## 🔄 ترتيب البناء (Build Order)

```
1. npm init + install packages (npm install)
2. إنشاء .env من .env.example
3. تشغيل migrations: npm run migrate
4. تشغيل seed: npm run seed
5. npm run dev
6. فتح: http://localhost:5000/admin/login.html
7. تسجيل الدخول بـ: nexus-demo / admin@nexus.com / admin123
8. اختبار: http://localhost:5000/health
```

---

## ✅ قائمة التحقق الكاملة

```
[ ] كل query تحتوي على فلتر tenant_id
[ ] كل route محمي بـ verifyToken + checkPermission
[ ] القائمة الجانبية تتغير حسب دور المستخدم
[ ] صفحة login تعمل بالعربية والإنجليزية والفرنسية
[ ] RTL يعمل مع العربية، LTR مع الإنجليزية
[ ] /health يعيد JSON كامل
[ ] health.html يتحدث كل 30 ثانية
[ ] Audit log يُسجل كل عملية كتابة
[ ] Rate limiting على مسارات Auth
[ ] bcrypt مع 12 rounds
[ ] JWT بـ 8 ساعات + refresh token بـ 7 أيام
[ ] كل تقرير يدعم PDF و Excel
[ ] الإعدادات تسمح بتغيير اللوجو والألوان لكل شركة
```

---

## 📌 تعليمات تحديد الأولوية لـ AI Agent

```
أولاً: أنشئ هيكل المجلدات كاملاً
ثانياً: أنشئ server/index.js + config/db.js
ثالثاً: أنشئ migrations/001_schema.sql وشغّله
رابعاً: أنشئ routes/auth.js + middleware/rbac.js
خامساً: أنشئ public/admin/login.html
سادساً: أنشئ public/admin/dashboard.html
سابعاً: أنشئ public/admin/health.html
ثامناً: أنشئ seeds/seed.js وشغّله
تاسعاً: اختبر كل شيء وأصلح الأخطاء
عاشراً: أنشئ باقي صفحات الوحدات (accounting, hr, inventory...)
```

---

*نهاية البرومبت — Nexus ERP Master Prompt v2.0*
*إذا انتهت التوكنز، ابدأ محادثة جديدة بهذا الملف مع قول: "استكمل من الخطوة رقم X"*
