const API = '';
const token = localStorage.getItem('token');

/* ── Auth guard ──────────────────────────────────────────── */
const RBAC_POLICY = {
  superadmin: ["all"],
  admin: ["accounting", "hr", "inventory", "sales", "purchasing", "crm", "projects", "production", "grc", "btp", "reports", "settings"],
  accountant: ["accounting"],
  hr: ["hr"],
  inventory_manager: ["inventory"],
  sales_manager: ["sales"],
  purchasing_manager: ["purchasing"],
  viewer: ["all"]
};

function enforceUIPermissions(role) {
  const allowed = RBAC_POLICY[role] || [];
  if (allowed.includes("all")) return;
  document.querySelectorAll('[data-module]').forEach(el => {
    const mod = el.getAttribute('data-module');
    if (!allowed.includes(mod)) {
      el.style.display = 'none';
      
      // Also hide the corresponding sections in the main dashboard if they exist
      const section = document.getElementById(mod + '-section');
      if (section) section.style.display = 'none';
    }
  });

  // Specifically hide stock/orders sections if missing modules
  if (!allowed.includes("inventory")) {
    const stockSec = document.getElementById('stock-section');
    if (stockSec) stockSec.style.display = 'none';
  }
  if (!allowed.includes("sales") && !allowed.includes("accounting")) {
    const ordSec = document.getElementById('orders-section');
    if (ordSec) ordSec.style.display = 'none';
  }
}

function requireAuth() {
  if (!token) {
    document.getElementById('login-gate').style.display = 'flex';
    return false;
  }
  const name = localStorage.getItem('userName') || 'User';
  const role = localStorage.getItem('userRole') || 'employee';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  
  const avEl = document.getElementById('sidebar-avatar');
  const nameEl = document.getElementById('sidebar-name');
  const roleEl = document.getElementById('sidebar-role');
  
  if (avEl) avEl.textContent = initials;
  if (nameEl) nameEl.textContent = name;
  if (roleEl) roleEl.textContent = role.toUpperCase();
  
  enforceUIPermissions(role);
  return true;
}

/* ── Theme ───────────────────────────────────────────────── */
let theme = localStorage.getItem('erp-theme') || 'light';
function applyTheme(t) {
  theme = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('erp-theme', t);
  const sun = document.getElementById('icon-sun');
  const moon = document.getElementById('icon-moon');
  if (sun) sun.style.display  = t === 'dark'  ? 'none' : '';
  if (moon) moon.style.display = t === 'light' ? 'none' : '';
}
function toggleTheme() { applyTheme(theme === 'dark' ? 'light' : 'dark'); }

/* ── Sidebar mobile ──────────────────────────────────────── */
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  if (sb) sb.classList.toggle('open');
  if (ov) ov.classList.toggle('open');
}
function closeSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('open');
}
function scrollToSection(id) {
  closeSidebar();
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Fetch helpers ───────────────────────────────────────── */
async function apiFetch(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function fmt(n) { return Number(n).toLocaleString('en-US'); }
function fmtEGP(n) { return 'EGP ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); }
function fmtTime(d) { return new Date(d).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); }

/* ── Status helpers ──────────────────────────────────────── */
const STATUS_MAP = {
  'مُسلَّم':     { cls: 's-green',  label: 'Delivered' },
  'مؤكد':        { cls: 's-blue',   label: 'Confirmed' },
  'جاري الشحن':  { cls: 's-blue',   label: 'Shipping'  },
  'جديد':        { cls: 's-orange', label: 'New'       },
  'ملغي':        { cls: 's-red',    label: 'Cancelled' },
  'مسودة':       { cls: 's-gray',   label: 'Draft'     },
};
const PAY_MAP = {
  paid:    { cls: 's-green',  label: 'Paid'    },
  pending: { cls: 's-orange', label: 'Pending' },
  failed:  { cls: 's-red',    label: 'Failed'  },
};
const STOCK_MAP = {
  'نفد':     { cls: 's-red',    label: 'Out of Stock' },
  'منخفض':   { cls: 's-orange', label: 'Low Stock'    },
  'متاح':    { cls: 's-green',  label: 'In Stock'     },
};

function statusBadge(status, map) {
  const m = map[status] || { cls: 's-gray', label: status || '—' };
  return `<span class="status-badge ${m.cls}">${m.label}</span>`;
}

function setMetric(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('skel', 'skel-line');
  el.style = '';
  el.textContent = val;
}
function setMetricSub(id, html) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = html + '&nbsp;<span style="color:var(--text-light)">vs all time</span>';
}

/* ── Notifications ───────────────────────────────────────── */
async function loadNotificationsShared() {
  if (!token) return;
  try {
    const data = await apiFetch('/api/activity/notifications?limit=12');
    const notifications = Array.isArray(data.notifications) ? data.notifications : [];
    const unread = Number(data.unread || 0);
    const countEl = document.getElementById('notif-count');
    if (countEl) {
      countEl.textContent = unread > 99 ? '99+' : String(unread);
      countEl.style.display = unread > 0 ? 'flex' : 'none';
    }

    const listEl = document.getElementById('notif-list');
    if (!listEl) return;
    if (!notifications.length) {
      listEl.innerHTML = '<div class="notif-empty">No notifications yet.</div>';
      return;
    }

    listEl.innerHTML = notifications.map(n => `
      <button class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}" data-url="${n.redirect_url || '#'}">
        <div class="notif-title">${n.title || 'Notification'}</div>
        <div class="notif-msg">${n.message || ''}</div>
        <div class="notif-time">${fmtTime(n.created_at)}</div>
      </button>
    `).join('');
  } catch (err) {
    console.warn('Notifications fetch error:', err);
  }
}

async function initNotifications() {
  const notifBtn = document.getElementById('notif-btn');
  const notifMenu = document.getElementById('notif-menu');
  const notifReadAll = document.getElementById('notif-read-all');
  const notifList = document.getElementById('notif-list');

  if (notifBtn && notifMenu) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifMenu.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!notifMenu.contains(e.target) && !notifBtn.contains(e.target)) notifMenu.classList.remove('open');
    });
  }
  if (notifReadAll) {
    notifReadAll.addEventListener('click', async () => {
      if (!token) return;
      try {
        await fetch(`${API}/api/activity/notifications/read-all`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        });
        await loadNotificationsShared();
      } catch (_err) {}
    });
  }
  if (notifList) {
    notifList.addEventListener('click', async (e) => {
      const btn = e.target.closest('.notif-item');
      if (!btn) return;
      const notifId = btn.getAttribute('data-id');
      const url = btn.getAttribute('data-url') || '#';
      if (token) {
        try {
          await fetch(`${API}/api/activity/notifications/${notifId}/read`, {
             method: 'PATCH', headers: { Authorization: `Bearer ${token}` }
          });
        } catch(_e) {}
      }
      if (url !== '#') window.location.href = url;
    });
  }
  
  if (token) {
    loadNotificationsShared();
    setInterval(loadNotificationsShared, 30000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const dateEl = document.getElementById('dash-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  }
  applyTheme(theme);
  initNotifications();
});
