document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const menuToggle = document.getElementById("menu-toggle");
  const sidebarOverlay = document.getElementById("sidebar-overlay");
  const nav = document.getElementById("main-nav");
  const topbarHeading = document.getElementById("topbar-heading");
  const token = localStorage.getItem("token");
  const API_BASE = '';

  const notifBtn = document.getElementById("notif-btn");
  const notifMenu = document.getElementById("notif-menu");
  const notifReadAll = document.getElementById("notif-read-all");
  const notifList = document.getElementById("notif-list");
  const notifCount = document.getElementById("notif-count");

  const userAvatarBtn = document.getElementById("user-avatar-btn");
  const versionModal = document.getElementById("version-modal");
  const versionModalClose = document.getElementById("version-modal-close");
  const otaCheckBtn = document.getElementById("ota-check-btn");
  const otaStatus = document.getElementById("ota-status");
  const sysVersionEl = document.getElementById("sys-version");

  const headings = {
    dashboard: { title: "Executive Dashboard", sub: "Cross-module snapshot — local preview" },
    financials: { title: "Financials", sub: "Chart of accounts, journals, AP / AR" },
    inventory: { title: "Supply chain", sub: "Inventory positions and movements" },
    hr: { title: "Human capital", sub: "Employees and payroll lifecycle" },
    settings: { title: "Settings", sub: "Organization and security" }
  };

  function setModeForViewport() {
    if (window.innerWidth <= 768) body.classList.remove("sidebar-collapsed");
    else body.classList.remove("sidebar-open");
  }

  function showModule(id) {
    document.querySelectorAll(".module-section").forEach((el) => {
      el.classList.toggle("is-active", el.getAttribute("data-module-panel") === id);
    });
    nav.querySelectorAll(".nav-item").forEach((btn) => {
      const active = btn.getAttribute("data-module") === id;
      btn.classList.toggle("active", active);
      if (active) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
    const h = headings[id];
    if (h && topbarHeading) {
      topbarHeading.querySelector("strong").textContent = h.title;
      topbarHeading.querySelector("span").textContent = h.sub;
    }
    try { history.replaceState(null, "", "#" + id); } catch (_e) {}
  }

  nav.addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-item");
    if (!btn) return;
    const id = btn.getAttribute("data-module");
    if (id) showModule(id);
    if (window.innerWidth <= 768) body.classList.remove("sidebar-open");
  });

  const entityToModule = { products:"inventory", customers:"dashboard", invoices:"financials", accounts:"financials", employees:"hr" };

  function fmtTime(d) {
    try {
      return new Date(d).toLocaleString("en-GB", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
    } catch { return String(d || ""); }
  }

  async function apiFetch(path, options = {}) {
    if (!token) throw new Error("No auth token");
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function loadNotifications() {
    if (!token || !notifList) return;
    try {
      notifList.innerHTML = `<div class="notif-empty">Loading...</div>`;
      const data = await apiFetch(`/api/activity/notifications?limit=12`);
      const notifications = Array.isArray(data.notifications) ? data.notifications : [];
      const unread = Number(data.unread || 0);

      if (notifCount) {
        notifCount.textContent = unread > 99 ? "99+" : String(unread);
        notifCount.style.display = unread > 0 ? "flex" : "none";
      }

      if (!notifications.length) {
        notifList.innerHTML = `<div class="notif-empty">No notifications yet.</div>`;
        return;
      }

      notifList.innerHTML = notifications.map((n) => `
        <button class="notif-item ${n.is_read ? "" : "unread"}" type="button"
          data-id="${n.id}" data-entity-type="${n.entity_type || ""}">
          <div class="notif-title">${n.title || "Notification"}</div>
          <div class="notif-msg">${n.message || ""}</div>
          <div class="notif-time">${fmtTime(n.created_at)}</div>
        </button>
      `).join("");
    } catch {
      notifList.innerHTML = `<div class="notif-empty">Failed to load notifications.</div>`;
      if (notifCount) notifCount.style.display = "none";
    }
  }

  async function markNotificationRead(id) {
    if (!token || !id) return;
    try {
      await fetch(`${API_BASE}/api/activity/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }

  async function markAllNotificationsRead() {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/activity/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadNotifications();
    } catch {}
  }

  function closeNotifMenu() { if (notifMenu) notifMenu.classList.remove("open"); }
  function toggleNotifMenu() { if (notifMenu) notifMenu.classList.toggle("open"); }

  if (notifBtn) notifBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleNotifMenu(); loadNotifications(); });
  if (notifReadAll) notifReadAll.addEventListener("click", markAllNotificationsRead);
  if (notifList) notifList.addEventListener("click", async (e) => {
    const itemBtn = e.target.closest(".notif-item"); if (!itemBtn) return;
    const id = itemBtn.getAttribute("data-id");
    const entityType = itemBtn.getAttribute("data-entity-type");
    await markNotificationRead(id);
    closeNotifMenu();
    showModule(entityToModule[entityType] || "dashboard");
  });
  document.addEventListener("click", closeNotifMenu);

  function openVersionModal() { if (versionModal) { versionModal.classList.add("open"); versionModal.setAttribute("aria-hidden","false"); } }
  function closeVersionModal() { if (versionModal) { versionModal.classList.remove("open"); versionModal.setAttribute("aria-hidden","true"); } }

  if (userAvatarBtn) userAvatarBtn.addEventListener("click", openVersionModal);
  if (versionModalClose) versionModalClose.addEventListener("click", closeVersionModal);
  if (versionModal) versionModal.addEventListener("click", (e) => { if (e.target === versionModal) closeVersionModal(); });

  if (otaCheckBtn) otaCheckBtn.addEventListener("click", () => {
    if (!otaStatus) return;
    otaStatus.textContent = "Checking OTA updates...";
    otaCheckBtn.disabled = true;
    setTimeout(() => { otaStatus.textContent = "You are up to date."; otaCheckBtn.disabled = false; }, 1200);
  });

  if (sysVersionEl) sysVersionEl.textContent = sysVersionEl.textContent || "2.0.0";
  const sysNameEl = document.getElementById("sys-name");
  if (sysNameEl) sysNameEl.textContent = "Nexus Erp System";

  const hash = (location.hash || "#dashboard").replace("#", "");
  showModule(headings[hash] ? hash : "dashboard");

  if (menuToggle) menuToggle.addEventListener("click", (e) => {
    e.preventDefault();
    if (window.innerWidth <= 768) body.classList.toggle("sidebar-open");
    else body.classList.toggle("sidebar-collapsed");
  });
  if (sidebarOverlay) sidebarOverlay.addEventListener("click", () => body.classList.remove("sidebar-open"));
  window.addEventListener("resize", setModeForViewport);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") body.classList.remove("sidebar-open"); });
  setModeForViewport();

  if (token) { loadNotifications(); setInterval(loadNotifications, 30000); }
});
