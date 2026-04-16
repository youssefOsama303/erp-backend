const form = document.getElementById('login-form');
const errEl = document.getElementById('err');
const langEl = document.getElementById('lang');

function applyLang(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('data-lang', lang);
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-ar]').forEach((el) => {
    el.textContent = el.getAttribute(`data-${lang}`) || el.textContent;
  });
  langEl.value = lang;
}

langEl.addEventListener('change', (e) => applyLang(e.target.value));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.textContent = '';
  const payload = { email: form.email.value.trim(), password: form.password.value };
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('token', data.token);
    localStorage.setItem('userRole', data.role);
    localStorage.setItem('userName', data.name || payload.email);
    window.location.href = '/admin/index.html';
  } catch (err) {
    errEl.textContent = err.message;
  }
});

applyLang(localStorage.getItem('lang') || 'en');
