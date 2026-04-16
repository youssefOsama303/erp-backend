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
    grc:        ['read', 'write', 'delete'],
    btp:        ['read', 'write'],
    ewm:        ['read', 'write', 'delete'],
    production: ['read', 'write', 'delete'],
    reports:    ['read', 'export'],
    users:      ['read', 'write', 'delete'],
    settings:   ['read', 'write'],
    orders:     ['read', 'write', 'delete'],
    warehouse:  ['read', 'write', 'delete'],
    invoices:   ['read', 'write', 'delete']
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
  },

  // ─ Role aliases for user-created accounts ─
  manager: {
    dashboard:  ['read'],
    accounting: ['read'],
    hr:         ['read', 'write'],
    inventory:  ['read', 'write'],
    sales:      ['read', 'write'],
    purchasing: ['read', 'write'],
    crm:        ['read', 'write'],
    projects:   ['read', 'write'],
    reports:    ['read', 'export']
  },

  sales: {
    dashboard:  ['read'],
    sales:      ['read', 'write'],
    crm:        ['read', 'write'],
    inventory:  ['read'],
    orders:     ['read', 'write'],
    invoices:   ['read', 'write'],
    reports:    ['read']
  },

  inventory: {
    dashboard:  ['read'],
    inventory:  ['read', 'write'],
    purchasing: ['read', 'write'],
    warehouse:  ['read', 'write'],
    orders:     ['read'],
    reports:    ['read']
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
    { id: 'dashboard',  label_ar: 'لوحة التحكم',      label_en: 'Dashboard',   icon: '🏢', url: '/admin/dashboard.html' },
    { id: 'accounting', label_ar: 'المحاسبة',          label_en: 'Accounting',  icon: '💰', url: '/admin/accounting.html' },
    { id: 'hr',         label_ar: 'الموارد البشرية',   label_en: 'HR',          icon: '👥', url: '/admin/hr.html' },
    { id: 'inventory',  label_ar: 'المخزون',            label_en: 'Inventory',   icon: '📦', url: '/admin/inventory.html' },
    { id: 'production', label_ar: 'الإنتاج',            label_en: 'Production',  icon: '🏭', url: '/admin/production.html' },
    { id: 'sales',      label_ar: 'المبيعات',           label_en: 'Sales',       icon: '🛒', url: '/admin/sales.html' },
    { id: 'purchasing', label_ar: 'المشتريات',          label_en: 'Purchasing',  icon: '🚚', url: '/admin/purchasing.html' },
    { id: 'crm',        label_ar: 'العملاء CRM',        label_en: 'CRM',         icon: '❤️', url: '/admin/crm.html' },
    { id: 'projects',   label_ar: 'المشاريع',           label_en: 'Projects',    icon: '📋', url: '/admin/projects.html' },
    { id: 'grc',        label_ar: 'الحوكمة GRC',        label_en: 'GRC',         icon: '🛡️', url: '/admin/grc.html' },
    { id: 'btp',        label_ar: 'المنصة BTP',         label_en: 'BTP',         icon: '🖥️', url: '/admin/btp.html' },
    { id: 'reports',    label_ar: 'التقارير',            label_en: 'Reports',     icon: '📊', url: '/admin/reports.html' },
    { id: 'settings',   label_ar: 'الإعدادات',          label_en: 'Settings',    icon: '⚙️', url: '/admin/settings.html' },
    { id: 'users',      label_ar: 'المستخدمون',         label_en: 'Users',       icon: '👤', url: '/admin/users.html' }
  ];

  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return [];
  if (rolePerms.all) return ALL_MENU;
  return ALL_MENU.filter(item => rolePerms[item.id]);
};

module.exports = { checkPermission, getMenuForRole, PERMISSIONS };
