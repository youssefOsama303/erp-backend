# 🧠 NEXUS ERP — MASTER BUILD PROMPT
### For: Replit AI / Cursor / GPT-4 / Claude / Any AI Agent
### Project: Full Oracle-Like ERP System — "Nexus"
---

## 🎯 MISSION STATEMENT

Build a **production-ready, multi-tenant, multi-language ERP system** called **"Nexus"** that rivals Oracle ERP Cloud in functionality. The system must be fully self-contained, deployable on Replit, and support white-labeling so each company can get their own private instance.

---

## 🏗️ TECH STACK

```
Backend:     Node.js + Express.js
Database:    PostgreSQL (via pg library)
Auth:        JWT (JSON Web Tokens) + bcrypt
Frontend:    Vanilla HTML + Tailwind CSS + Alpine.js (or Vanilla JS)
Sessions:    Redis (optional) or JWT stateless
File Upload: Multer
Email:       Nodemailer
PDF:         PDFKit or Puppeteer
Charts:      Chart.js
i18n:        i18next (multi-language)
Deployment:  Replit (can export to Fly.io / Railway / VPS)
```

---

## 📁 PROJECT STRUCTURE

```
nexus-erp/
├── server/
│   ├── index.js                  # Entry point
│   ├── config/
│   │   ├── db.js                 # PostgreSQL connection
│   │   ├── redis.js              # Redis (optional)
│   │   └── env.js                # Environment variables
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   ├── tenantResolver.js     # Multi-tenant middleware
│   │   ├── rbac.js               # Role-based access control
│   │   └── logger.js             # Request logging
│   ├── modules/
│   │   ├── auth/
│   │   ├── tenants/
│   │   ├── users/
│   │   ├── accounting/
│   │   ├── hr/
│   │   ├── inventory/
│   │   ├── sales/
│   │   ├── purchasing/
│   │   ├── crm/
│   │   ├── projects/
│   │   ├── reports/
│   │   └── settings/
│   └── utils/
│       ├── response.js
│       ├── pagination.js
│       └── audit.js
├── client/
│   ├── index.html                # Login page
│   ├── dashboard.html
│   ├── modules/
│   │   ├── accounting.html
│   │   ├── hr.html
│   │   ├── inventory.html
│   │   ├── sales.html
│   │   ├── purchasing.html
│   │   ├── crm.html
│   │   ├── projects.html
│   │   └── reports.html
│   ├── js/
│   │   ├── core/
│   │   │   ├── auth.js
│   │   │   ├── api.js
│   │   │   ├── i18n.js
│   │   │   └── theme.js
│   │   └── modules/
│   │       └── [one JS per module]
│   ├── css/
│   │   └── nexus.css
│   └── locales/
│       ├── ar.json
│       ├── en.json
│       ├── fr.json
│       └── de.json
├── migrations/
│   └── 001_initial_schema.sql
├── seeds/
│   └── demo_data.sql
├── .env.example
├── package.json
└── README.md
```

---

## 🗃️ DATABASE SCHEMA (PostgreSQL — Multi-Tenant)

### CORE TABLES

```sql
-- ===========================
-- TENANTS (Companies)
-- ===========================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,         -- used in subdomain or URL
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#4F46E5',
  secondary_color VARCHAR(7) DEFAULT '#7C3AED',
  default_language VARCHAR(10) DEFAULT 'ar',
  default_currency VARCHAR(10) DEFAULT 'EGP',
  timezone VARCHAR(50) DEFAULT 'Africa/Cairo',
  subscription_plan VARCHAR(50) DEFAULT 'trial',  -- trial, basic, pro, enterprise
  subscription_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- USERS
-- ===========================
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
  theme VARCHAR(10) DEFAULT 'light',          -- light / dark
  role VARCHAR(50) NOT NULL DEFAULT 'employee', -- superadmin / admin / manager / employee / viewer
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- ===========================
-- PERMISSIONS (RBAC)
-- ===========================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY(user_id, role_id)
);

-- ===========================
-- AUDIT LOG
-- ===========================
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

-- ===========================
-- ACCOUNTING MODULE
-- ===========================
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL,  -- asset, liability, equity, revenue, expense
  parent_id UUID REFERENCES chart_of_accounts(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  entry_number VARCHAR(50) NOT NULL,
  description TEXT,
  entry_date DATE NOT NULL,
  fiscal_year INT,
  period INT,
  status VARCHAR(20) DEFAULT 'draft',  -- draft, posted, reversed
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

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  account_id UUID REFERENCES chart_of_accounts(id),
  fiscal_year INT NOT NULL,
  period INT NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  actual NUMERIC(18,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- HR MODULE
-- ===========================
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
  employment_type VARCHAR(50),  -- full_time, part_time, contractor
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
  status VARCHAR(20),  -- present, absent, late, on_leave
  notes TEXT
);

CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  employee_id UUID REFERENCES employees(id),
  leave_type VARCHAR(50),  -- annual, sick, unpaid, emergency
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INT,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
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
  status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, paid
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- INVENTORY MODULE
-- ===========================
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
  movement_type VARCHAR(50),  -- receipt, issue, transfer, adjustment, return
  quantity NUMERIC(18,3),
  reference_type VARCHAR(50), -- po, so, transfer, manual
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- SALES MODULE
-- ===========================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  customer_number VARCHAR(50),
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  customer_type VARCHAR(20) DEFAULT 'individual',  -- individual, company
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Egypt',
  tax_number VARCHAR(100),
  credit_limit NUMERIC(18,2) DEFAULT 0,
  payment_terms INT DEFAULT 30,  -- days
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
  status VARCHAR(30) DEFAULT 'draft',  -- draft, confirmed, picking, shipped, delivered, cancelled, returned
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
  status VARCHAR(20) DEFAULT 'unpaid',  -- unpaid, partial, paid, overdue, cancelled
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
  payment_method VARCHAR(50),  -- cash, bank_transfer, cheque, card
  reference VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- PURCHASING MODULE
-- ===========================
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
  status VARCHAR(30) DEFAULT 'draft',  -- draft, sent, partial, received, cancelled
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

-- ===========================
-- CRM MODULE
-- ===========================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  source VARCHAR(100),  -- website, referral, social, cold_call
  status VARCHAR(50) DEFAULT 'new',  -- new, contacted, qualified, proposal, won, lost
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
  activity_type VARCHAR(50),  -- call, email, meeting, note, task
  title VARCHAR(255),
  description TEXT,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- PROJECTS MODULE
-- ===========================
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
  status VARCHAR(30) DEFAULT 'planning',  -- planning, active, on_hold, completed, cancelled
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
  priority VARCHAR(20) DEFAULT 'medium',  -- low, medium, high, critical
  status VARCHAR(30) DEFAULT 'todo',  -- todo, in_progress, review, done
  start_date DATE,
  due_date DATE,
  estimated_hours NUMERIC(8,2),
  actual_hours NUMERIC(8,2) DEFAULT 0,
  parent_task_id UUID REFERENCES project_tasks(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- SETTINGS MODULE
-- ===========================
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
  fiscal_year_start INT DEFAULT 1,  -- month
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

## 🔐 AUTHENTICATION SYSTEM

### File: `server/modules/auth/auth.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const { login, logout, refreshToken, forgotPassword, resetPassword, changePassword } = require('./auth.controller');
const { verifyToken } = require('../../middleware/auth');

router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', verifyToken, changePassword);

module.exports = router;
```

### File: `server/modules/auth/auth.controller.js`

```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/db');

const login = async (req, res) => {
  try {
    const { email, password, tenant_slug } = req.body;

    // Find tenant
    const tenantResult = await pool.query(
      'SELECT * FROM tenants WHERE slug = $1 AND is_active = TRUE',
      [tenant_slug]
    );
    if (!tenantResult.rows[0]) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    const tenant = tenantResult.rows[0];

    // Find user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND tenant_id = $2 AND is_active = TRUE',
      [email.toLowerCase(), tenant.id]
    );
    if (!userResult.rows[0]) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const user = userResult.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, tenantId: tenant.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, tenantId: tenant.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
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
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { login };
```

---

## 🌍 MULTI-LANGUAGE SYSTEM (i18n)

### File: `client/locales/ar.json`

```json
{
  "app": {
    "name": "نكسس ERP",
    "tagline": "نظام إدارة موارد المؤسسات"
  },
  "nav": {
    "dashboard": "لوحة التحكم",
    "accounting": "المحاسبة",
    "hr": "الموارد البشرية",
    "inventory": "المخزون",
    "sales": "المبيعات",
    "purchasing": "المشتريات",
    "crm": "إدارة العملاء",
    "projects": "المشاريع",
    "reports": "التقارير",
    "settings": "الإعدادات"
  },
  "auth": {
    "login": "تسجيل الدخول",
    "logout": "تسجيل الخروج",
    "email": "البريد الإلكتروني",
    "password": "كلمة المرور",
    "company_code": "كود الشركة",
    "forgot_password": "نسيت كلمة المرور؟",
    "remember_me": "تذكرني"
  },
  "common": {
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "add": "إضافة",
    "search": "بحث",
    "filter": "تصفية",
    "export": "تصدير",
    "import": "استيراد",
    "print": "طباعة",
    "loading": "جاري التحميل...",
    "no_data": "لا توجد بيانات",
    "confirm_delete": "هل أنت متأكد من الحذف؟",
    "success": "تم بنجاح",
    "error": "حدث خطأ",
    "required": "هذا الحقل مطلوب",
    "status": "الحالة",
    "actions": "الإجراءات",
    "date": "التاريخ",
    "total": "الإجمالي"
  }
}
```

### File: `client/locales/en.json`

```json
{
  "app": {
    "name": "Nexus ERP",
    "tagline": "Enterprise Resource Planning System"
  },
  "nav": {
    "dashboard": "Dashboard",
    "accounting": "Accounting",
    "hr": "Human Resources",
    "inventory": "Inventory",
    "sales": "Sales",
    "purchasing": "Purchasing",
    "crm": "CRM",
    "projects": "Projects",
    "reports": "Reports",
    "settings": "Settings"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "email": "Email",
    "password": "Password",
    "company_code": "Company Code",
    "forgot_password": "Forgot Password?",
    "remember_me": "Remember Me"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "import": "Import",
    "print": "Print",
    "loading": "Loading...",
    "no_data": "No Data",
    "confirm_delete": "Are you sure you want to delete?",
    "success": "Success",
    "error": "Error occurred",
    "required": "This field is required",
    "status": "Status",
    "actions": "Actions",
    "date": "Date",
    "total": "Total"
  }
}
```

### File: `client/js/core/i18n.js`

```javascript
const I18n = {
  currentLang: localStorage.getItem('nexus_lang') || 'ar',
  translations: {},

  async init() {
    await this.loadLanguage(this.currentLang);
    this.applyDirection();
    this.translatePage();
  },

  async loadLanguage(lang) {
    const res = await fetch(`/locales/${lang}.json`);
    this.translations = await res.json();
    this.currentLang = lang;
    localStorage.setItem('nexus_lang', lang);
  },

  t(key) {
    const keys = key.split('.');
    let value = this.translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  },

  applyDirection() {
    const rtlLangs = ['ar', 'he', 'fa', 'ur'];
    document.documentElement.dir = rtlLangs.includes(this.currentLang) ? 'rtl' : 'ltr';
    document.documentElement.lang = this.currentLang;
  },

  translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });
  },

  async switchLanguage(lang) {
    await this.loadLanguage(lang);
    this.applyDirection();
    this.translatePage();
    // Optionally save to user profile via API
    NexusAPI.put('/users/language', { language: lang }).catch(() => {});
  }
};
```

---

## 🏢 MULTI-TENANT SYSTEM

### File: `server/middleware/tenantResolver.js`

```javascript
const { pool } = require('../config/db');

const resolveTenant = async (req, res, next) => {
  try {
    // Option 1: From JWT (most secure)
    if (req.user?.tenantId) {
      const result = await pool.query(
        'SELECT * FROM tenants WHERE id = $1 AND is_active = TRUE',
        [req.user.tenantId]
      );
      if (!result.rows[0]) {
        return res.status(403).json({ success: false, message: 'Tenant not found or inactive' });
      }
      req.tenant = result.rows[0];
      return next();
    }

    // Option 2: From subdomain (e.g., company1.nexus-erp.com)
    const host = req.hostname;
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www') {
      const result = await pool.query(
        'SELECT * FROM tenants WHERE slug = $1 AND is_active = TRUE',
        [subdomain]
      );
      if (result.rows[0]) {
        req.tenant = result.rows[0];
        return next();
      }
    }

    return res.status(400).json({ success: false, message: 'Tenant could not be resolved' });
  } catch (err) {
    next(err);
  }
};

module.exports = { resolveTenant };
```

### File: `server/modules/tenants/tenants.controller.js`

```javascript
// SuperAdmin only — manages all companies
const createTenant = async (req, res) => {
  const { name, slug, adminEmail, adminPassword, plan } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create tenant
    const tenantResult = await client.query(
      `INSERT INTO tenants (name, slug, subscription_plan)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, slug, plan || 'trial']
    );
    const tenant = tenantResult.rows[0];

    // Create tenant settings
    await client.query(
      `INSERT INTO tenant_settings (tenant_id, company_name_en)
       VALUES ($1, $2)`,
      [tenant.id, name]
    );

    // Create admin user
    const hash = await bcrypt.hash(adminPassword, 12);
    await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, role, first_name)
       VALUES ($1, $2, $3, 'admin', 'Admin')`,
      [tenant.id, adminEmail, hash]
    );

    // Seed default chart of accounts
    await seedDefaultAccounts(client, tenant.id);

    // Seed default roles
    await seedDefaultRoles(client, tenant.id);

    await client.query('COMMIT');
    res.json({ success: true, data: tenant });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};
```

---

## 🖥️ FRONTEND — LOGIN PAGE

### File: `client/index.html`

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus ERP — تسجيل الدخول</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    :root { --primary: #4F46E5; --secondary: #7C3AED; }
    [dir="rtl"] { font-family: 'Cairo', sans-serif; }
    [dir="ltr"] { font-family: 'Inter', sans-serif; }
    .gradient-bg { background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); }
    .glass { backdrop-filter: blur(20px); background: rgba(255,255,255,0.1); }
    .animate-float { animation: float 6s ease-in-out infinite; }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  </style>
</head>
<body class="min-h-screen gradient-bg flex items-center justify-center p-4">

  <!-- Language Switcher -->
  <div class="fixed top-4 right-4 z-50">
    <select id="langSwitcher" class="bg-white/20 text-white border border-white/30 rounded-lg px-3 py-1.5 text-sm cursor-pointer">
      <option value="ar">🇪🇬 العربية</option>
      <option value="en">🇺🇸 English</option>
      <option value="fr">🇫🇷 Français</option>
    </select>
  </div>

  <!-- Login Card -->
  <div class="w-full max-w-md">
    <!-- Logo -->
    <div class="text-center mb-8 animate-float">
      <div class="inline-flex items-center justify-center w-20 h-20 bg-white/20 glass rounded-2xl mb-4">
        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      </div>
      <h1 class="text-3xl font-black text-white">Nexus ERP</h1>
      <p class="text-white/70 mt-1" data-i18n="app.tagline">نظام إدارة موارد المؤسسات</p>
    </div>

    <!-- Form Card -->
    <div class="bg-white rounded-3xl p-8 shadow-2xl">
      <h2 class="text-2xl font-bold text-gray-800 mb-6" data-i18n="auth.login">تسجيل الدخول</h2>

      <div id="loginError" class="hidden bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm"></div>

      <div class="space-y-4">
        <!-- Company Code -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5" data-i18n="auth.company_code">كود الشركة</label>
          <input id="tenantSlug" type="text" placeholder="company-code"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5" data-i18n="auth.email">البريد الإلكتروني</label>
          <input id="loginEmail" type="email"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
        </div>

        <!-- Password -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5" data-i18n="auth.password">كلمة المرور</label>
          <div class="relative">
            <input id="loginPassword" type="password"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
            <button type="button" onclick="togglePassword()" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg id="eyeIcon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Remember Me -->
        <div class="flex items-center justify-between">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="rememberMe" class="w-4 h-4 rounded text-indigo-600">
            <span class="text-sm text-gray-600" data-i18n="auth.remember_me">تذكرني</span>
          </label>
          <a href="/forgot-password.html" class="text-sm text-indigo-600 hover:underline" data-i18n="auth.forgot_password">نسيت كلمة المرور؟</a>
        </div>

        <!-- Submit -->
        <button id="loginBtn" onclick="handleLogin()"
          class="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition duration-200 flex items-center justify-center gap-2">
          <span data-i18n="auth.login">تسجيل الدخول</span>
        </button>
      </div>
    </div>

    <p class="text-center text-white/50 text-xs mt-6">© 2025 Nexus ERP. All rights reserved.</p>
  </div>

  <script src="/js/core/i18n.js"></script>
  <script src="/js/core/api.js"></script>
  <script>
    I18n.init();

    document.getElementById('langSwitcher').addEventListener('change', (e) => {
      I18n.switchLanguage(e.target.value);
    });

    function togglePassword() {
      const input = document.getElementById('loginPassword');
      input.type = input.type === 'password' ? 'text' : 'password';
    }

    async function handleLogin() {
      const btn = document.getElementById('loginBtn');
      const errorDiv = document.getElementById('loginError');
      const tenant_slug = document.getElementById('tenantSlug').value.trim();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!tenant_slug || !email || !password) {
        errorDiv.textContent = I18n.t('common.required');
        errorDiv.classList.remove('hidden');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = `<svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>`;

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
          window.location.href = '/dashboard.html';
        } else {
          errorDiv.textContent = data.message;
          errorDiv.classList.remove('hidden');
          btn.disabled = false;
          btn.innerHTML = `<span data-i18n="auth.login">${I18n.t('auth.login')}</span>`;
        }
      } catch (err) {
        errorDiv.textContent = I18n.t('common.error');
        errorDiv.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = `<span>${I18n.t('auth.login')}</span>`;
      }
    }
  </script>
</body>
</html>
```

---

## 📊 DASHBOARD

### File: `client/dashboard.html` — Key sections to build:

```
1. Top Navigation Bar:
   - Logo (tenant logo if set)
   - Search bar (global search across all modules)
   - Notifications bell
   - Language switcher
   - User profile dropdown (profile, settings, logout)

2. Sidebar Navigation:
   - All module links with icons
   - Collapsible submenu per module
   - Active state highlighting
   - Mini/full toggle

3. KPI Cards Row:
   - Total Revenue (this month)
   - Total Expenses (this month)
   - Net Profit
   - Outstanding Invoices
   - Low Stock Alerts
   - Open Tasks

4. Charts Row:
   - Revenue vs Expenses (bar chart - last 6 months)
   - Sales Pipeline (funnel/donut chart)

5. Quick Actions:
   - New Invoice
   - New Purchase Order
   - New Employee
   - New Product

6. Recent Activity Feed

7. Alerts Section:
   - Low stock items
   - Overdue invoices
   - Upcoming payroll
   - Pending leave requests
```

---

## 🔧 CORE API MODULE

### File: `client/js/core/api.js`

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

  async request(method, endpoint, data = null) {
    try {
      const options = {
        method,
        headers: this.getHeaders()
      };
      if (data) options.body = JSON.stringify(data);

      const res = await fetch(`${this.baseURL}${endpoint}`, options);

      if (res.status === 401) {
        // Try refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) return this.request(method, endpoint, data);
        window.location.href = '/';
        return;
      }

      return await res.json();
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  },

  async refreshToken() {
    const refresh = localStorage.getItem('nexus_refresh');
    if (!refresh) return false;
    const res = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('nexus_token', data.accessToken);
      return true;
    }
    return false;
  },

  get: (url) => NexusAPI.request('GET', url),
  post: (url, data) => NexusAPI.request('POST', url, data),
  put: (url, data) => NexusAPI.request('PUT', url, data),
  delete: (url) => NexusAPI.request('DELETE', url),
  patch: (url, data) => NexusAPI.request('PATCH', url, data)
};
```

---

## 🔑 ROLE-BASED ACCESS CONTROL

### Roles & Permissions Matrix:

```
ROLE          | accounting | hr  | inventory | sales | purchasing | crm | projects | settings | admin
--------------|------------|-----|-----------|-------|------------|-----|----------|----------|-------
superadmin    |  full      |full |   full    | full  |   full     |full |  full    |  full    | full
admin         |  full      |full |   full    | full  |   full     |full |  full    |  full    | no
manager       |  read      |read |   full    | full  |   full     |full |  full    |  no      | no
employee      |  none      |self |   read    | read  |   read     |own  |  own     |  no      | no
viewer        |  read      |none |   read    | read  |   read     |read |  read    |  no      | no
```

### File: `server/middleware/rbac.js`

```javascript
const permissions = {
  superadmin: { all: true },
  admin: {
    accounting: ['read','write','delete'],
    hr: ['read','write','delete'],
    inventory: ['read','write','delete'],
    sales: ['read','write','delete'],
    purchasing: ['read','write','delete'],
    crm: ['read','write','delete'],
    projects: ['read','write','delete'],
    settings: ['read','write']
  },
  manager: {
    accounting: ['read'],
    hr: ['read','write'],
    inventory: ['read','write','delete'],
    sales: ['read','write','delete'],
    purchasing: ['read','write','delete'],
    crm: ['read','write','delete'],
    projects: ['read','write','delete']
  },
  employee: {
    hr: ['read_self'],
    inventory: ['read'],
    sales: ['read'],
    purchasing: ['read'],
    crm: ['read','write_own'],
    projects: ['read','write_own']
  },
  viewer: {
    accounting: ['read'],
    inventory: ['read'],
    sales: ['read'],
    purchasing: ['read'],
    crm: ['read'],
    projects: ['read']
  }
};

const checkPermission = (module, action) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const rolePerms = permissions[role];
  if (rolePerms?.all || rolePerms?.[module]?.includes(action)) {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
};

module.exports = { checkPermission };
```

---

## 📄 REPORTS MODULE

### Report Types to Build:

```
1.  Profit & Loss Statement (Income Statement)
2.  Balance Sheet
3.  Trial Balance
4.  Cash Flow Statement
5.  Accounts Receivable Aging Report
6.  Accounts Payable Aging Report
7.  Sales Report (by period, customer, product, rep)
8.  Inventory Valuation Report
9.  Low Stock Report
10. Purchase History Report
11. Payroll Summary Report
12. Employee Attendance Report
13. Leave Balance Report
14. Project Budget vs Actual Report
15. Customer Statement
16. Supplier Statement
17. Tax Report (VAT)
18. Audit Trail Report
```

### All reports must support:
- Date range filter
- Export to PDF (via PDFKit)
- Export to Excel (via ExcelJS)
- Print view
- Email sending

---

## ⚙️ SETTINGS MODULE

### Sections to build:

```
1. Company Profile (logo, name, address, tax number)
2. Users & Permissions (create/edit/deactivate users, assign roles)
3. Roles Management (create custom roles, set granular permissions)
4. Chart of Accounts (add/edit/deactivate accounts)
5. Currencies & Exchange Rates
6. Tax Configuration (VAT rates, tax groups)
7. Numbering Sequences (invoice prefix, PO prefix, etc.)
8. Email Templates (invoice email, payroll slip, etc.)
9. Notifications (which events trigger notifications to which roles)
10. Integrations (API keys, webhooks)
11. Backup & Export (export all data as JSON/Excel)
12. Audit Log Viewer
```

---

## 🌐 MULTI-TENANT DEPLOYMENT OPTIONS

### Option A — Single Instance, Tenant via DB (Recommended for Replit)
- One deployment
- Tenant identified by `tenant_slug` in login + JWT
- All data separated by `tenant_id` in every table
- Easy to scale

### Option B — Subdomain per Tenant
- `company1.nexus-erp.com`
- `company2.nexus-erp.com`
- Requires wildcard DNS + reverse proxy (Nginx/Caddy)
- More isolated

### Option C — Separate Deployments per Client (White-label)
- Fork the repo for each client
- Set `.env` with client-specific DB and branding
- Full isolation, fully white-labeled
- Best for enterprise clients

---

## 📦 PACKAGE.JSON

```json
{
  "name": "nexus-erp",
  "version": "1.0.0",
  "description": "Multi-tenant ERP System",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js",
    "dev": "nodemon server/index.js",
    "migrate": "node migrations/run.js",
    "seed": "node seeds/run.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5",
    "nodemailer": "^6.9.7",
    "pdfkit": "^0.14.0",
    "exceljs": "^4.3.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## 🔒 SECURITY REQUIREMENTS

```
1. All passwords hashed with bcrypt (salt rounds: 12)
2. JWT with short expiry (8h access, 7d refresh)
3. Rate limiting on auth endpoints (5 attempts per 15 min)
4. Helmet.js for HTTP security headers
5. CORS configured per tenant allowed origins
6. SQL injection prevention via parameterized queries ONLY
7. XSS prevention via input sanitization
8. HTTPS enforced in production
9. Audit log for all write operations
10. Super admin access protected by separate secret key
```

---

## 🚀 REPLIT DEPLOYMENT NOTES

```
1. Set environment variables in Replit Secrets:
   - DATABASE_URL=postgresql://...
   - JWT_SECRET=<random 64 char string>
   - JWT_REFRESH_SECRET=<random 64 char string>
   - NODE_ENV=production
   - PORT=3000

2. Use Replit's built-in PostgreSQL or connect to external Neon/Supabase

3. Run migrations on first start:
   npm run migrate

4. Create first superadmin tenant via:
   POST /api/tenants/setup (protected by SETUP_SECRET env var)

5. Always keep the client/ folder served as static files via Express:
   app.use(express.static(path.join(__dirname, '../client')));
```

---

## 📋 BUILD ORDER (Sprint Plan)

```
Sprint 1 — Foundation
  ✅ Project setup, DB schema, migrations
  ✅ Auth system (login, JWT, refresh)
  ✅ Multi-tenant middleware
  ✅ Login page (multi-language)

Sprint 2 — Core UI
  ✅ Dashboard layout (sidebar, topbar)
  ✅ i18n system (AR/EN/FR)
  ✅ Theme system (light/dark)
  ✅ User management

Sprint 3 — Accounting
  - Chart of accounts
  - Journal entries
  - Trial balance report

Sprint 4 — Inventory
  - Products CRUD
  - Warehouses
  - Stock movements

Sprint 5 — Sales
  - Customers
  - Sales orders
  - Invoices & payments

Sprint 6 — Purchasing
  - Suppliers
  - Purchase orders
  - Goods receipt

Sprint 7 — HR
  - Employees
  - Attendance
  - Payroll

Sprint 8 — CRM & Projects
  - Leads pipeline
  - Activities
  - Project management

Sprint 9 — Reports
  - All financial reports
  - PDF/Excel export

Sprint 10 — Settings & Polish
  - Company settings
  - White-label branding per tenant
  - Performance optimization
```

---

## ✅ FINAL CHECKLIST

```
[ ] Multi-tenant: Every query filters by tenant_id
[ ] Multi-language: All UI text uses i18n keys, no hardcoded strings
[ ] RTL/LTR: Direction auto-switches with language
[ ] Auth: JWT + refresh token + role check on every protected route
[ ] RBAC: checkPermission middleware on all module routes
[ ] Audit: Every INSERT/UPDATE/DELETE writes to audit_logs
[ ] Reports: PDF + Excel export for every report
[ ] Settings: Each tenant can customize branding (logo, colors, name)
[ ] Security: bcrypt, helmet, rate-limit, parameterized queries
[ ] Mobile: Responsive layout works on tablet and phone
```

---

*End of Nexus ERP Master Prompt — Part 1 of 1*
*If this file was split due to token limits, continue with Part 2 which covers: remaining module implementations, seeding scripts, and deployment configuration.*
