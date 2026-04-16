/**
 * Nexus ERP — Utilities & RBAC UI Logic (v3.1 — EN Default)
 * Manages sidebar rendering, role-based menus, and shared UI actions.
 */

const NexusUtils = {

  // ─── 1. Role → Allowed Module IDs ───────────────────────────────────────
  ROLE_MENUS: {
    superadmin:         ['dashboard','accounting','hr','inventory','sales','purchasing','crm','projects','reports','settings','grc','btp','production','users'],
    admin:              ['dashboard','accounting','hr','inventory','sales','purchasing','crm','projects','reports','settings','grc','btp','production','users'],
    accountant:         ['dashboard','accounting','sales','purchasing','reports','grc'],
    hr:                 ['dashboard','hr','reports'],
    inventory_manager:  ['dashboard','inventory','purchasing','reports'],
    sales_manager:      ['dashboard','sales','crm','inventory','reports'],
    purchasing_manager: ['dashboard','purchasing','inventory','reports'],
    employee:           ['dashboard','inventory','sales'],
    viewer:             ['dashboard','accounting','hr','inventory','sales','purchasing','crm','projects','reports','grc','btp']
  },

  // ─── 2. Navigation Menu Definition ──────────────────────────────────────
  ALL_MENU: [
    // ── Core ──
    { id: 'core',       label: 'Core System',   labelAr: 'النظام الأساسي',   isHeader: true },
    { id: 'dashboard',  icon: '/icons/dashboard.svg',   ar: 'لوحة التحكم',       en: 'Dashboard',    route: 'welcome.html' },
    { id: 'accounting', icon: '/icons/accounting.svg',  ar: 'المحاسبة',           en: 'Accounting',   route: 'accounting.html' },
    { id: 'hr',         icon: '/icons/hr.svg',          ar: 'الموارد البشرية',   en: 'Human Resources', route: 'hr.html' },

    // ── Supply Chain ──
    { id: 'scm',        label: 'Supply Chain',  labelAr: 'سلسلة التوريد',    isHeader: true },
    { id: 'inventory',  icon: '/icons/warehouse.svg',   ar: 'المخازن (EWM)',     en: 'Warehouse (EWM)', route: 'inventory.html' },
    { id: 'sales',      icon: '/icons/sales.svg',       ar: 'المبيعات',           en: 'Sales',        route: 'sales.html' },
    { id: 'purchasing', icon: '/icons/purchasing.svg',  ar: 'المشتريات',          en: 'Purchasing',   route: 'purchasing.html' },
    { id: 'production', icon: '/icons/production.svg',  ar: 'تخطيط الإنتاج',    en: 'Production (PP)', route: 'production.html' },

    // ── CRM & Projects ──
    { id: 'crm_proj',   label: 'Customers & Projects', labelAr: 'العملاء والمشاريع', isHeader: true },
    { id: 'crm',        icon: '/icons/crm.svg',         ar: 'إدارة العملاء',     en: 'CRM',          route: 'crm.html' },
    { id: 'projects',   icon: '/icons/projects.svg',    ar: 'إدارة المشاريع',    en: 'Projects',     route: 'projects.html' },

    // ── Governance & Tech ──
    { id: 'tech',       label: 'Governance & Tech', labelAr: 'الحوكمة والتقنية', isHeader: true },
    { id: 'grc',        icon: '/icons/grc.svg',         ar: 'الحوكمة والمخاطر', en: 'GRC',          route: 'grc.html' },
    { id: 'btp',        icon: '/icons/btp.svg',         ar: 'منصة BTP',          en: 'BTP Platform', route: 'btp.html' },
    { id: 'reports',    icon: '/icons/reports.svg',     ar: 'التقارير',          en: 'Reports',      route: 'reports.html' },
    { id: 'settings',   icon: '/icons/settings.svg',    ar: 'الإعدادات',          en: 'Settings',     route: 'settings.html' },
    { id: 'users',      icon: '/icons/users.svg',       ar: 'المستخدمون',       en: 'Users',        route: 'users.html' }
  ],

  // ─── 3. Role Display Labels ──────────────────────────────────────────────
  ROLE_LABELS: {
    superadmin:         'System Administrator',
    admin:              'Administrator',
    accountant:         'Accountant',
    hr:                 'HR Manager',
    inventory_manager:  'Inventory Manager',
    sales_manager:      'Sales Manager',
    purchasing_manager: 'Purchasing Manager',
    employee:           'Employee',
    viewer:             'Viewer'
  },

  ROLE_LABELS_AR: {
    superadmin: 'مدير النظام', admin: 'مدير', accountant: 'محاسب',
    hr: 'موارد بشرية', inventory_manager: 'مدير المخزون',
    sales_manager: 'مدير المبيعات', purchasing_manager: 'مدير المشتريات',
    employee: 'موظف', viewer: 'مشاهد'
  },

  // ─── 4. Sidebar Builder ──────────────────────────────────────────────────
  initSidebar(activeRoute) {
    const user   = JSON.parse(localStorage.getItem('nexus_user')   || '{}');
    const tenant = JSON.parse(localStorage.getItem('nexus_tenant') || '{}');
    const lang   = localStorage.getItem('nexus_lang') || 'en';
    const role   = user.role || 'viewer';
    const allowed = this.ROLE_MENUS[role] || this.ROLE_MENUS.viewer;

    // ── Header meta ──
    const el = (id) => document.getElementById(id);
    if (el('tenantName'))  el('tenantName').textContent  = tenant.name || tenant.slug || 'NEXUS';
    if (el('userName'))    el('userName').textContent    = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || '?';
    if (el('userRole'))    el('userRole').textContent    = (lang === 'ar' ? this.ROLE_LABELS_AR : this.ROLE_LABELS)[role] || role;
    if (el('avatar'))      el('avatar').textContent      = (user.firstName || user.email || '?')[0].toUpperCase();

    // ── Build nav ──
    const nav = el('sidebarNav');
    if (!nav) return;
    nav.innerHTML = '';

    this.ALL_MENU
      .filter(item => item.isHeader || allowed.includes(item.id))
      .forEach(item => {
        if (item.isHeader) {
          const d = document.createElement('div');
          d.className = 'nav-header';
          d.textContent = lang === 'ar' ? item.labelAr : item.label;
          nav.appendChild(d);
          return;
        }

        const isActive = item.route === activeRoute;
        const a = document.createElement('a');
        a.href = `#${item.route}`;
        a.dataset.route = item.route;
        a.className = `nav-link${isActive ? ' active' : ''}`;
        a.title = lang === 'ar' ? item.ar : item.en;

        // Icon with fallback
        const iconEl = this._makeIcon(item.icon, item.en);
        a.appendChild(iconEl);

        const label = document.createElement('span');
        label.className = 'nav-label';
        label.textContent = lang === 'ar' ? item.ar : item.en;
        a.appendChild(label);

        nav.appendChild(a);
      });
  },

  // ─── 5. Inline SVG Factory ────────────────────────────────────────────────
  _makeIcon(src, fallbackText) {
    const SVGS = {
      '/icons/dashboard.svg':  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
      '/icons/accounting.svg': `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      '/icons/hr.svg':         `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      '/icons/warehouse.svg':  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      '/icons/sales.svg':      `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>`,
      '/icons/purchasing.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
      '/icons/production.svg': `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
      '/icons/crm.svg':        `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      '/icons/projects.svg':   `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
      '/icons/grc.svg':        `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      '/icons/btp.svg':        `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 9 8 12 2 12"/></svg>`,
      '/icons/settings.svg':   `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
    };

    const span = document.createElement('span');
    span.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;flex-shrink:0;';
    span.title = fallbackText;
    span.dataset.iconSrc = src;
    span.innerHTML = SVGS[src] || '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
    return span;
  },

  // ─── 6. Active link sync ─────────────────────────────────────────────────
  updateActiveNavLink(route) {
    document.querySelectorAll('.nav-link').forEach(link => {
      const isActive = link.dataset.route === route;
      link.classList.toggle('active', isActive);
      // No need to manually update mask icon color since stroke="currentColor"
      // inherits the color natively from .nav-link CSS which changes on active.
    });
  },

  // ─── 7. Sidebar toggle ───────────────────────────────────────────────────
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('mini');
  },

  // ─── 8. Logout ───────────────────────────────────────────────────────────
  logout() {
    if (confirm('Sign out of Nexus ERP?')) {
      localStorage.clear();
      window.location.href = '/admin/login.html';
    }
  },

  // ─── 9. Language toggle ──────────────────────────────────────────────────
  setLang(lang) {
    localStorage.setItem('nexus_lang', lang);
    this.initSidebar(location.hash.slice(1) || 'welcome.html');
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
};

window.NexusUtils = NexusUtils;
