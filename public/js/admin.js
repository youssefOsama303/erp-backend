/**
 * Nexus ERP — SPA-Lite Administrative Controller (v3.1)
 * Handles dynamic section loading, notification hub, and search filtering.
 */
const NexusAdmin = (() => {
    let contentArea, bell, dropdown, notifBadge, notifList;

    // ─── Show non-blocking Toast ──────────────────────────────────────────────
    function showToast(message, type = 'error') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.style.cssText = `
            background:${type === 'error' ? '#ef4444' : '#10b981'};
            color:white;padding:12px 20px;border-radius:8px;font-size:13px;font-weight:600;
            box-shadow:0 10px 25px rgba(0,0,0,0.2); opacity:0; transform:translateY(20px);
            transition: opacity 0.3s, transform 0.3s;
        `;
        toast.textContent = message;
        container.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });
        
        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // ─── Load a page section into #content-area ──────────────────────────────
    async function loadSection(route) {
        if (!route || route === '#') route = 'welcome.html';

        contentArea = contentArea || document.getElementById('content-area');
        if (!contentArea) return;

        // Show clean spinner, prevent flicker if very fast
        const loadStartTime = Date.now();
        contentArea.style.opacity = '0.4';
        contentArea.style.transition = 'opacity 0.2s';
        
        const path = route.startsWith('/') ? route : `/admin/${route}`;

        try {
            const res = await fetch(path, { cache: 'no-cache' });
            if (res.status === 404) {
                throw new Error('404 Not Found');
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Prefer <main>, fall back to <body>
            const newContent = doc.querySelector('main') || doc.body;

            // Extract <style> tags from the fetched document to prevent losing custom CSS
            const styles = Array.from(doc.querySelectorAll('style')).map(s => s.outerHTML).join('\n');

            // Ensure minimum 300ms loader so it doesn't flicker obnoxiously
            const elapsed = Date.now() - loadStartTime;
            if (elapsed < 300) {
               await new Promise(r => setTimeout(r, 300 - elapsed));
            }

            contentArea.innerHTML = styles + '\n' + newContent.innerHTML;
            contentArea.style.opacity = '1';

            // Push history state
            if (location.hash !== `#${route}`) {
                window.history.pushState({ route }, '', `#${route}`);
            }

            // Re-execute inline scripts
            newContent.querySelectorAll('script').forEach(oldScript => {
                const s = document.createElement('script');
                Array.from(oldScript.attributes).forEach(a => s.setAttribute(a.name, a.value));
                s.textContent = oldScript.textContent;
                document.body.appendChild(s);
                try { document.body.removeChild(s); } catch (_) {}
            });

            NexusUtils.updateActiveNavLink(route);

        } catch (err) {
            contentArea.style.opacity = '1';
            
            // If 404, we fallback safely instead of crashing to blank
            if (err.message.includes('404') && route !== 'welcome.html') {
                showToast('Page not available yet. Redirecting to Dashboard.', 'error');
                history.replaceState(null, '', '#welcome.html');
                return loadSection('welcome.html');
            }

            contentArea.innerHTML = `
                <div class="error-area" style="text-align:center;padding:60px 20px;">
                    <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
                    <h2 style="font-size:20px;font-weight:700;color:#ef4444;margin-bottom:8px;">Section Unavailable</h2>
                    <p style="color:#94a3b8;font-size:14px;margin-bottom:24px;">${err.message}</p>
                    <button onclick="NexusAdmin.loadSection('${route}')" 
                      style="background:#0f3a5a;color:white;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">
                      Retry
                    </button>
                </div>
            `;
            console.error('[SPA Error]', err);
        }
    }

    // ─── Notifications ────────────────────────────────────────────────────────
    async function loadNotifications() {
        notifList   = notifList   || document.getElementById('notif-list');
        notifBadge  = notifBadge  || document.getElementById('notif-badge');
        if (!notifList) return;

        try {
            const token = localStorage.getItem('nexus_token');
            if (!token) return;

            const res = await fetch('/api/activity/notifications?limit=10&unreadOnly=false', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`${res.status}`);

            const data = await res.json();
            // API returns { notifications: [...], unread: N, total: N }
            const items = data.notifications || [];
            const unread = data.unread || 0;

            // Update badge
            if (notifBadge) {
                if (unread > 0) {
                    notifBadge.textContent = unread > 99 ? '99+' : unread;
                    notifBadge.classList.remove('hidden');
                } else {
                    notifBadge.classList.add('hidden');
                }
            }

            // Render list
            if (items.length === 0) {
                notifList.innerHTML = `<li style="padding:32px;text-align:center;color:#94a3b8;font-size:13px;">No notifications</li>`;
                return;
            }

            notifList.innerHTML = items.map(n => {
                const time = n.created_at
                    ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';
                const isUnread = !n.is_read;
                return `
                  <li onclick="NexusAdmin.markRead('${n.id}')" 
                    style="padding:12px 20px;cursor:pointer;${isUnread ? 'background:#f0fdf4;' : ''}border-bottom:1px solid #f8fafc;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px;">
                      <span style="font-weight:${isUnread ? '700' : '500'};font-size:13px;color:#1e293b;">${n.title || n.action_type || 'Notification'}</span>
                      <span style="font-size:10px;color:#94a3b8;white-space:nowrap;margin-left:8px;">${time}</span>
                    </div>
                    <p style="font-size:12px;color:#64748b;margin:0;line-height:1.4;">${n.message || ''}</p>
                  </li>
                `;
            }).join('');

        } catch (e) {
            console.warn('Notifications fetch issue:', e.message);
            if (notifList) {
                // Do not throw a hard error message UI to the user to keep it clean.
                notifList.innerHTML = `<li style="padding:24px;text-align:center;color:#94a3b8;font-size:13px;">Currently offline or no data</li>`;
            }
        }
    }

    async function markRead(id) {
        const token = localStorage.getItem('nexus_token');
        if (!token || !id) return;
        try {
            await fetch(`/api/activity/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            loadNotifications(); // refresh
        } catch (_) {}
    }

    // ─── Init ─────────────────────────────────────────────────────────────────
    function init() {
        contentArea = document.getElementById('content-area');
        bell        = document.getElementById('notif-bell');
        dropdown    = document.getElementById('notif-dropdown');
        notifBadge  = document.getElementById('notif-badge');
        notifList   = document.getElementById('notif-list');

        // Notification bell toggle
        bell?.addEventListener('click', e => {
            e.stopPropagation();
            const isHidden = dropdown.classList.toggle('hidden');
            if (!isHidden) loadNotifications();
        });

        // Close notifications on outside click
        document.addEventListener('click', e => {
            if (dropdown && !dropdown.classList.contains('hidden')) {
                if (!dropdown.contains(e.target) && e.target !== bell && !bell?.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            }
        });

        // SPA nav link delegation (sidebar)
        document.addEventListener('click', e => {
            const link = e.target.closest('.nav-link[data-route]');
            if (link) {
                e.preventDefault();
                loadSection(link.dataset.route);
            }
        });

        // Browser Back/Forward
        window.addEventListener('popstate', e => {
            const route = e.state?.route || location.hash.slice(1) || 'welcome.html';
            loadSection(route);
        });

        // Global Search — filter sidebar links
        const searchInput = document.getElementById('globalSearch');
        searchInput?.addEventListener('input', e => {
            const q = e.target.value.trim().toLowerCase();
            document.querySelectorAll('.nav-link').forEach(l => {
                l.classList.toggle('hidden', q !== '' && !l.textContent.toLowerCase().includes(q));
            });
            document.querySelectorAll('.nav-header').forEach(h => {
                h.classList.toggle('hidden', q !== '');
            });
        });

        // Initial page load
        const initialRoute = location.hash ? location.hash.slice(1) : 'welcome.html';
        loadSection(initialRoute);

        // Poll notifications every 60 s
        loadNotifications();
        setInterval(loadNotifications, 60_000);

        // Sync theme toggle icon on init
        syncThemeIcon();
    }

    // ─── Dark / Light Mode ────────────────────────────────────────────────────
    function toggleTheme() {
        const isDark = document.body.classList.toggle('theme-dark');
        localStorage.setItem('nexus_theme', isDark ? 'dark' : 'light');
        document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
        const btn = document.getElementById('themeToggleBtn');
        if (btn) btn.textContent = isDark ? '☀️' : '🌙';
    }

    function syncThemeIcon() {
        const btn = document.getElementById('themeToggleBtn');
        if (btn) btn.textContent = document.body.classList.contains('theme-dark') ? '☀️' : '🌙';
    }

    return { init, loadSection, markRead, toggleTheme };
})();

// Bootstrap
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    NexusAdmin.init();
} else {
    document.addEventListener('DOMContentLoaded', NexusAdmin.init);
}
