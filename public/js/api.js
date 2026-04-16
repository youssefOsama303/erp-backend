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
      NexusUI.showToast(data.message || 'Access denied: insufficient permissions', 'error');
        return null;
      }

      return await res.json();
    } catch (err) {
      console.error(`API Error [${method} ${endpoint}]:`, err);
      NexusUI.showToast('Connection error — please try again', 'error');
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
