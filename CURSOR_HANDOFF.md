# Nexus ERP — Cursor Handoff Document
**Date:** 2026-04-13 | **Port:** 5000 | **Stack:** Node.js + Express + PostgreSQL + Vanilla JS SPA

---

## 🔐 Login Credentials
```
URL:      http://localhost:5000/admin/login.html
Company:  nexus-demo
Email:    admin@nexus.com
Password: admin123
```

---

## 🏗️ Project Structure

```
d:\erp-backend\
├── server.js                  ← Main Express entry point
├── config/db.js               ← PostgreSQL pool (uses DATABASE_URL from .env)
├── middleware/
│   ├── auth.js                ← JWT authentication (Bearer token)
│   └── rbac.js                ← Role-based access control
├── routes/
│   ├── users.js
│   ├── accounts.js            ← Accounting / FI
│   ├── hr.js                  ← Human Resources
│   ├── warehouse.js           ← EWM / Warehouse
│   ├── orders.js              ← Sales orders
│   ├── invoices.js
│   ├── sales.js               ← Sales KPIs + summary
│   ├── purchasing.js
│   ├── crm.js                 ← Auto-creates crm_leads table
│   ├── projects.js            ← Auto-creates projects + project_tasks tables
│   ├── production.js          ← Auto-creates production_orders + bom_items tables
│   ├── grc.js                 ← Auto-creates grc_risks table
│   ├── btp.js                 ← Auto-creates btp_integrations + btp_logs tables
│   ├── reports.js             ← Dashboard KPIs + monthly charts
│   ├── activity.js            ← Notifications + activity log
│   └── ewm.js                 ← Extended Warehouse Management
├── db/
│   ├── schema.sql             ← Base schema (all core tables)
│   ├── migrate.js             ← Migration runner
│   └── migrations/            ← SQL migration files (run in order)
├── public/
│   ├── admin/
│   │   ├── index.html         ← ⭐ MAIN SPA SHELL (hardcoded sidebar + content-area)
│   │   ├── login.html
│   │   ├── dashboard.html     ← Dashboard SPA fragment (injected into index.html)
│   │   ├── accounting.html
│   │   ├── hr.html
│   │   ├── sales.html
│   │   ├── purchasing.html
│   │   ├── inventory.html     ← EWM Warehouse
│   │   ├── crm.html
│   │   ├── projects.html      ← ✅ Rebuilt — wired to /api/projects
│   │   ├── production.html    ← ✅ Rebuilt — wired to /api/production
│   │   ├── grc.html
│   │   ├── btp.html           ← ✅ Rebuilt — wired to /api/btp (dark theme, live logs)
│   │   ├── reports.html       ← ✅ Rebuilt — 3 tabs: Financial/Stock/HR + Chart.js
│   │   ├── settings.html
│   │   └── health.html        ← System health monitor (live polling /health)
│   ├── js/
│   │   ├── api.js             ← NexusAPI wrapper (baseURL: '/api', auto Bearer token)
│   │   └── utils.js           ← NexusUtils (sidebar render, theme, toast)
│   └── shared/
│       └── js/
│           └── utils.js       ← ⭐ ALSO USED by index.html SPA shell
│                                  Contains RBAC_POLICY for UI visibility
└── .env                       ← Environment variables (see below)
```

---

## ⚠️ Critical Architecture Note (SPA Shell)

The admin panel uses **TWO different utility files**:

| File | Used by | Purpose |
|------|---------|---------|
| `public/js/utils.js` | `dashboard.html` + module pages | NexusUtils, sidebar for fragment pages |
| `public/shared/js/utils.js` | `index.html` (main SPA shell) | RBAC_POLICY, theme, notifications |

**The sidebar visible to the user is in `public/admin/index.html` as hardcoded HTML.**  
The dynamic menu in `public/js/utils.js` (ALL_MENU) is only used when pages are loaded **directly** (not via the SPA shell).

---

## 🛣️ All API Routes (server.js mounted routes)

```
POST   /api/users/login          ← Public — returns JWT token
GET    /api/users/me
GET    /api/accounting/*         ← auth required
GET    /api/hr/*
GET    /api/warehouse/*
GET    /api/orders/*
GET    /api/invoices/*
GET/POST /api/sales/*
GET/POST /api/purchasing/*
GET/POST /api/crm/*              ← crm_leads table (auto-created)
GET/POST /api/projects/*         ← projects + project_tasks (auto-created)
GET/POST/PATCH /api/production/* ← production_orders + bom_items (auto-created)
GET    /api/grc/*                ← grc_risks table (auto-created)
GET    /api/btp/*                ← btp_integrations + btp_logs (auto-created)
GET    /api/reports/dashboard
GET    /api/reports/monthly?year=YYYY
GET    /api/activity/notifications
PATCH  /api/activity/notifications/:id/read
PATCH  /api/activity/notifications/read-all
GET    /api/ewm/*
GET    /api/settings             ← auth required (user settings)
GET    /health                   ← Public — JSON health check
GET    /healthz                  ← Public alias
GET    /readiness                ← Public alias
```

---

## 🔐 RBAC System

### Backend (`middleware/rbac.js`)
Usage: `checkPermission('module', 'action')` as Express middleware.

Admin role has access to:
`dashboard, accounting, hr, inventory, sales, purchasing, crm, projects, production, grc, btp, ewm, reports, users, settings, orders, warehouse, invoices`

### Frontend (`public/shared/js/utils.js` → `RBAC_POLICY`)
Controls which sidebar links are visible per role in the SPA shell.
Admin currently has: `["accounting", "hr", "inventory", "sales", "purchasing", "crm", "projects", "production", "grc", "btp", "reports", "settings"]`

---

## 🗄️ Database Tables

### Core (schema.sql + migrations)
```sql
users, accounts, customers, suppliers
invoices, invoice_lines
warehouses, product_categories, products, stock, stock_movements
sales_orders, sales_order_lines
purchase_orders, purchase_order_lines
departments, employees, leave_requests, payroll
activity_logs, notifications
journal_entries (GL)
ewm_zones, ewm_bins, ewm_tasks
```

### Auto-created on first API request
```sql
crm_leads          ← routes/crm.js
grc_risks          ← routes/grc.js
projects           ← routes/projects.js
project_tasks      ← routes/projects.js
production_orders  ← routes/production.js
bom_items          ← routes/production.js
btp_integrations   ← routes/btp.js
btp_logs           ← routes/btp.js
```

---

## ✅ What Was Built / Fixed in This Session

### Backend Fixes
| File | What Changed |
|------|-------------|
| `server.js` | Added rate limiter (200 req/15min), removed `compression` (not installed), mounted all new routes |
| `middleware/rbac.js` | Added `production` permission to `admin` role |
| `routes/reports.js` | Switched `Promise.all` → `Promise.allSettled` — never returns 500, always returns graceful fallback |
| `routes/projects.js` | Full replacement of 707-byte stub → complete CRUD + auto-migrate |
| `routes/production.js` | New file: production orders, BOM, work centers, summary endpoint |
| `routes/btp.js` | Full replacement of stub → status/logs/metrics endpoints with auto-migrate |

### Frontend Fixes
| File | What Changed |
|------|-------------|
| `public/shared/js/utils.js` | Fixed `RBAC_POLICY` — admin was missing CRM, Projects, Production, GRC, BTP, Reports |
| `public/js/utils.js` | Added `reports` to `ALL_MENU` (for standalone page loads) |
| `public/admin/index.html` | Added hardcoded sidebar links for Production, CRM, Projects, Reports, GRC, BTP |
| `public/admin/production.html` | Complete rebuild: no Tailwind CDN, wired to `/api/production`, KPIs + orders table + BOM tree + donut chart + new order modal |
| `public/admin/reports.html` | Complete rebuild: no Tailwind CDN, 3-tab layout (Financial/Stock Alerts/HR), Chart.js bar + donut, CSV export |
| `public/admin/projects.html` | Complete rebuild: no Tailwind CDN, wired to `/api/projects`, project grid + KPIs + Add modal |
| `public/admin/btp.html` | Complete rebuild: dark theme, wired to `/api/btp`, live log terminal + services table + KPIs, auto-refreshes every 15s |
| `public/admin/settings.html` | Added System Monitoring card with live health polling every 30s + link to health.html |
| `public/admin/health.html` | NEW: Live system health monitor polling `/health` endpoint |

---

## 🚧 Remaining TODOs (What's NOT Done Yet)

### High Priority
1. **Buttons with no handler** — Some pages still have buttons that do nothing silently. Need to either wire to API or show `Toast("Coming soon")`.
   - `accounting.html` — "New Journal Entry" button is static
   - `hr.html` — "Add Employee" modal doesn't save
   - `settings.html` — Payment integration cards (Stripe/Paymob) are placeholders

2. **Smoke test all modules** — Need browser verification that 401s are truly gone after RBAC fix on Production/Projects/BTP

3. **Delete dead file** — `public/js/nexus-phase1-layout.js` is unused (was for old layout)

### Medium Priority
4. **`NODE_ENV`** — Still set to `development` in `.env`, change to `production` for real deployment
5. **`JWT_SECRET`** — Currently `erp_secret_key_2024` (weak). Generate strong 64-char hex:
   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
6. **Tailwind CDN warning** — May still appear in browser console from pages not yet rebuilt (check `accounting.html`, `hr.html`, `purchasing.html`)

### Low Priority
7. **Reports icon** — Using `accounting.svg` as fallback, ideally needs `reports.svg` in `/icons/`
8. **`compression` package** — Not installed. If needed for production: `npm install compression`

---

## 🔧 Environment (`.env`)

```env
PORT=5000
NODE_ENV=development          ← Change to production
DATABASE_URL=postgresql://...
JWT_SECRET=erp_secret_key_2024  ← REPLACE with 64-char random hex!
CLIENT_URL=http://localhost:5000
EWM_SEED=true                 ← Set to false in production
```

---

## 🚀 How to Start

```bash
cd d:\erp-backend
npm run dev
# Opens: http://localhost:5000/admin/login.html
# Health: http://localhost:5000/health
# Health UI: http://localhost:5000/admin/health.html
```

---

## 📋 Recommended Next Tasks for Cursor

### Task 1: Smoke Test & Fix 401s
```
Open browser and visit each of these URLs after login:
- /admin/production.html  → Should show orders table (not loading spinner)
- /admin/projects.html    → Should show project grid (not loading spinner)  
- /admin/btp.html         → Should show services table (not loading spinner)
- /admin/reports.html     → Should show KPI numbers (not "—")
If any show loading spinners, check DevTools Network tab for 401/403 errors.
```

### Task 2: Wire Dead Buttons
```
Search for buttons/links in public/admin/*.html that have no onclick handler
or point to "#". Either:
a) Wire them to the correct API endpoint
b) Add: onclick="alert('Coming soon — this feature is in development')"
c) Add disabled attribute + visual styling for "not ready" state
```

### Task 3: Fix Remaining Tailwind CDN Warnings
```
Check these files for <script src="https://cdn.tailwindcss.com"> and remove it:
- public/admin/accounting.html
- public/admin/hr.html
- public/admin/purchasing.html
Any Tailwind classes in those files should be converted to inline styles or 
the existing scoped CSS in each file.
```

### Task 4: Production Security
```
1. Generate JWT_SECRET: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
2. Update .env: JWT_SECRET=<generated>, NODE_ENV=production, CLIENT_URL=<real domain>
3. Set EWM_SEED=false in .env for production
4. Verify CORS in server.js is NOT using wildcard '*' origin
```

---

## 📁 Key Files Reference

| What you need | File path |
|--------------|-----------|
| Start server | `npm run dev` in `d:\erp-backend` |
| Add API routes | `routes/*.js` + mount in `server.js` |
| Change sidebar links | `public/admin/index.html` (lines 40-95) |
| Change who sees what | `public/shared/js/utils.js` → `RBAC_POLICY` |
| Backend permissions | `middleware/rbac.js` → `PERMISSIONS.admin` |
| DB schema | `db/schema.sql` + `db/migrations/*.sql` |
| API wrapper (frontend) | `public/js/api.js` → `NexusAPI.get/post/put/delete` |
| Full status log | `AGENT_CHECKPOINT.txt` (this directory) |
