/* ── Load: Orders ────────────────────────────────────────── */

/* ── Load: Orders ────────────────────────────────────────── */
async function loadOrders() {
  try {
    const data = await apiFetch('/api/orders/sales?limit=200&page=1');
    const orders = Array.isArray(data) ? data : (data.orders || data.data || []);
    const recent = orders.slice(0, 15);

    // Update sidebar badge for new orders
    const newCount = orders.filter(o => o.status === 'جديد').length;
    const badge = document.getElementById('badge-orders');
    if (newCount > 0) { badge.textContent = newCount; badge.style.display = 'flex'; }

    document.getElementById('orders-count').textContent = `${orders.length} total`;

    // Metric card: Orders
    setMetric('mv-orders', fmt(orders.length));
    const pendingCount = orders.filter(o => ['جديد','مؤكد','جاري الشحن'].includes(o.status)).length;
    setMetricSub('mc-ord-sub', `<span class="badge-neu">${pendingCount} pending</span>&nbsp;Compare to history`);

    // Metric card: Revenue
    const totalRev = orders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
    setMetric('mv-revenue', fmtEGP(totalRev));
    const paidRev = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + parseFloat(o.total || 0), 0);
    const paidPct = totalRev > 0 ? Math.round(paidRev / totalRev * 100) : 0;
    setMetricSub('mc-rev-sub', `<span class="badge-up">${paidPct}%</span>&nbsp;Collected`);

    // Render orders table
    if (!recent.length) {
      document.getElementById('orders-tbody').innerHTML =
        `<tr><td colspan="6"><div class="empty-box"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg><p>No orders found</p></div></td></tr>`;
      return;
    }

    document.getElementById('orders-tbody').innerHTML = recent.map(o => `
      <tr>
        <td class="cell-mono">${o.order_number || '#' + o.id}</td>
        <td class="cell-dim">${fmtDate(o.created_at || o.date)}</td>
        <td class="cell-dim">${o.items_count || '—'}</td>
        <td class="cell-bold">${fmtEGP(o.total)}</td>
        <td>${statusBadge(o.status, STATUS_MAP)}</td>
        <td>${statusBadge(o.payment_status || 'pending', PAY_MAP)}</td>
      </tr>`).join('');

    // Build donut & bar charts after orders load
    buildDonut(orders);
    buildBar(orders);

  } catch (err) {
    console.warn('Orders fetch error:', err);
    document.getElementById('orders-tbody').innerHTML =
      `<tr><td colspan="6" style="color:var(--red);padding:16px;text-align:center;font-size:13px">⚠ Failed to load orders</td></tr>`;
    document.getElementById('mv-orders').textContent = '—';
    document.getElementById('mv-revenue').textContent = '—';
  }
}

/* ── Load: Products / Stock ──────────────────────────────── */
async function loadProducts() {
  try {
    const data = await apiFetch('/api/warehouse/products');
    const products = Array.isArray(data) ? data : (data.products || []);
    const withStatus = products.map((p) => {
      const qty = Number(p.total_qty ?? p.stock ?? 0);
      const stock_status = qty <= 0 ? 'نفد' : qty <= 5 ? 'منخفض' : 'متاح';
      return { ...p, stock_status, sale_price: Number(p.price ?? p.sale_price ?? 0) };
    });

    const lowStock = withStatus.filter(p => p.stock_status === 'منخفض' || p.stock_status === 'نفد');
    const outStock  = withStatus.filter(p => p.stock_status === 'نفد');

    // Sidebar badge
    const badgeS = document.getElementById('badge-stock');
    if (lowStock.length > 0) { badgeS.textContent = lowStock.length; badgeS.style.display = 'flex'; }

    // Metrics
    setMetric('mv-products', fmt(withStatus.length));
    setMetricSub('mc-prod-sub', `<span class="badge-up">${withStatus.filter(p=>p.stock_status==='متاح').length} in stock</span>&nbsp;items`);

    setMetric('mv-lowstock', fmt(lowStock.length));
    setMetricSub('mc-stk-sub', `<span class="${outStock.length > 0 ? 'badge-down' : 'badge-neu'}">${outStock.length} out of stock</span>`);

    document.getElementById('stock-count').textContent = `${lowStock.length} alerts`;

    if (!lowStock.length) {
      document.getElementById('stock-tbody').innerHTML =
        `<tr><td colspan="5"><div class="empty-box"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><p>All products are well-stocked!</p></div></td></tr>`;
      return;
    }

    document.getElementById('stock-tbody').innerHTML = lowStock.slice(0, 15).map(p => `
      <tr>
        <td class="cell-bold" style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</td>
        <td class="cell-dim">${p.brand || '—'}</td>
        <td class="cell-dim">${p.category_name || '—'}</td>
        <td>${statusBadge(p.stock_status, STOCK_MAP)}</td>
        <td class="cell-bold">${fmtEGP(p.sale_price)}</td>
      </tr>`).join('');

  } catch (err) {
    console.warn('Products fetch error:', err);
    document.getElementById('stock-tbody').innerHTML =
      `<tr><td colspan="5" style="color:var(--red);padding:16px;text-align:center;font-size:13px">⚠ Failed to load inventory</td></tr>`;
    document.getElementById('mv-products').textContent = '—';
    document.getElementById('mv-lowstock').textContent = '—';
  }
}

/* ── Removed Metric helpers ──────────────────────────────── */

/* ── Bar Chart ───────────────────────────────────────────── */
function buildBar(orders) {
  // Group orders by month (last 6)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: d.toLocaleDateString('en-GB',{month:'short'}) });
  }

  const grouped = {};
  months.forEach(m => { grouped[m.key] = { delivered: 0, processing: 0, newOrd: 0 }; });
  orders.forEach(o => {
    const d = new Date(o.created_at || o.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (!grouped[key]) return;
    if (o.status === 'مُسلَّم') grouped[key].delivered++;
    else if (['مؤكد','جاري الشحن'].includes(o.status)) grouped[key].processing++;
    else grouped[key].newOrd++;
  });

  const W = 480, H = 160, pad = { l:28, r:8, t:8, b:28 };
  const cW = (W - pad.l - pad.r) / months.length;
  const maxVal = Math.max(...months.map(m => grouped[m.key].delivered + grouped[m.key].processing + grouped[m.key].newOrd), 1);
  const chartH = H - pad.t - pad.b;

  let bars = '';
  months.forEach((m, i) => {
    const g = grouped[m.key];
    const total = g.delivered + g.processing + g.newOrd;
    const x = pad.l + i * cW + cW * .15;
    const bW = cW * .7;

    const scl = v => v > 0 ? Math.max(v / maxVal * chartH, 4) : 0;
    const hD = scl(g.delivered), hP = scl(g.processing), hN = scl(g.newOrd);
    const y3 = pad.t + chartH - hD;
    const y2 = y3 - hP;
    const y1 = y2 - hN;

    bars += `<title>${m.label}: ${total} orders</title>`;
    if (g.delivered) bars += `<rect x="${x}" y="${y3}" width="${bW}" height="${hD}" fill="#3b82f6" rx="3"/>`;
    if (g.processing) bars += `<rect x="${x}" y="${y2}" width="${bW}" height="${hP}" fill="#60a5fa" rx="3"/>`;
    if (g.newOrd)     bars += `<rect x="${x}" y="${y1}" width="${bW}" height="${hN}" fill="#bfdbfe" rx="3"/>`;

    bars += `<text x="${x + bW/2}" y="${H - 6}" text-anchor="middle" font-size="10" fill="var(--text-muted)">${m.label}</text>`;
  });

  // Y axis labels
  const yLabels = [0, Math.round(maxVal/2), maxVal].map(v =>
    `<text x="${pad.l - 4}" y="${pad.t + chartH - (v/maxVal)*chartH + 4}" text-anchor="end" font-size="9" fill="var(--text-light)">${v}</text>`
  ).join('');

  const wrap = document.getElementById('bar-chart-wrap');
  wrap.innerHTML = `<svg class="bar-chart-svg" viewBox="0 0 ${W} ${H}">${bars}${yLabels}</svg>`;
  document.getElementById('bar-legend').style.display = 'flex';
}

/* ── Donut Chart ─────────────────────────────────────────── */
function buildDonut(orders) {
  const STATUS_COLORS = [
    { key: 'مُسلَّم',    color: '#16a34a', label: 'Delivered'  },
    { key: 'مؤكد',       color: '#3b82f6', label: 'Confirmed'  },
    { key: 'جاري الشحن', color: '#60a5fa', label: 'Shipping'   },
    { key: 'جديد',       color: '#f59e0b', label: 'New'        },
    { key: 'ملغي',       color: '#dc2626', label: 'Cancelled'  },
  ];

  const counts = {};
  orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
  const total = orders.length || 1;
  const R = 60, cx = 80, cy = 80, strokeW = 22;
  const circumference = 2 * Math.PI * R;

  let offset = 0;
  let arcs = '';
  const legendItems = [];

  STATUS_COLORS.forEach(s => {
    const cnt = counts[s.key] || 0;
    if (!cnt) return;
    const pct = cnt / total;
    const dash = pct * circumference;
    arcs += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${s.color}" stroke-width="${strokeW}"
      stroke-dasharray="${dash} ${circumference - dash}"
      stroke-dashoffset="${-offset * circumference}"
      transform="rotate(-90 ${cx} ${cy})">
      <title>${s.label}: ${cnt}</title></circle>`;
    offset += pct;
    legendItems.push({ ...s, cnt, pct: Math.round(pct * 100) });
  });

  const svgHTML = `<svg class="donut-svg" viewBox="0 0 160 160" width="140" height="140">
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--border)" stroke-width="${strokeW}"/>
    ${arcs}
    <text class="donut-center donut-val" x="${cx}" y="${cy - 6}">${fmt(total)}</text>
    <text class="donut-center donut-sub" x="${cx}" y="${cy + 14}">orders</text>
  </svg>`;

  const legendHTML = legendItems.map(s =>
    `<div class="dl-row">
      <div class="dl-dot" style="background:${s.color}"></div>
      <div class="dl-label">${s.label}</div>
      <div class="dl-val">${s.cnt}</div>
      <div class="dl-pct">${s.pct}%</div>
    </div>`).join('');

  document.getElementById('donut-wrap').innerHTML =
    svgHTML + `<div class="donut-legend">${legendHTML}</div>`;
}

/* ── Load all ────────────────────────────────────────────── */
async function loadAll() {
  // Reset skeltons on metrics
  ['mv-revenue','mv-orders','mv-products','mv-lowstock'].forEach(id => {
    const el = document.getElementById(id);
    el.className = 'metric-value skel skel-line';
    el.style.height = '30px'; el.style.width = '80px';
    el.textContent = '';
  });
  await Promise.all([loadOrders(), loadProducts(), loadNotifications()]);
}

/* ── Init ────────────────────────────────────────────────── */
if (requireAuth()) {
  loadAll();
}
