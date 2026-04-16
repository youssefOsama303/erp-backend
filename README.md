```
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗    ███████╗██████╗ ██████╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝    ██╔════╝██╔══██╗██╔══██╗
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗    █████╗  ██████╔╝██████╔╝
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║    ██╔══╝  ██╔══██╗██╔═══╝
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║    ███████╗██║  ██║██║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝    ╚══════╝╚═╝  ╚═╝╚═╝
```

<div align="center">

**نظام تخطيط موارد المؤسسات — Enterprise Resource Planning System**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)](https://expressjs.com)
[![License](https://img.shields.io/badge/License-Commercial-f5b335)](LICENSE)

</div>

---

## 🌐 ما هو Nexus ERP؟

**Nexus ERP** هو نظام متكامل لتخطيط موارد المؤسسات مبني بتقنيات الويب الحديثة، ومصمم ليُحاكي أنظمة SAP S/4HANA في الشركات المتوسطة والكبيرة. يتميز بـ:

- ✅ **9 وحدات متكاملة** — محاسبة، مخازن، HR، إنتاج، مبيعات، GRC وأكثر
- ✅ **بيانات حقيقية 100%** — كل الأرقام من PostgreSQL مباشرة (لا Mock Data)
- ✅ **RBAC متقدم** — 9 أدوار مختلفة بصلاحيات دقيقة لكل وحدة
- ✅ **SPA بدون React** — سرعة خارقة بـ Vanilla JS
- ✅ **Arabic-Ready** — دعم كامل للغة العربية والـ RTL

---

## 🚀 التنصيب السريع (5 خطوات)

### المتطلبات
- [Node.js 18+](https://nodejs.org)
- [PostgreSQL 14+](https://postgresql.org)

### خطوات التنصيب

```bash
# 1. انسخ المشروع
git clone https://github.com/yourusername/nexus-erp.git
cd nexus-erp

# 2. تنصيب الحزم
npm install

# 3. إعداد قاعدة البيانات — انسخ .env وعدّل بياناتك
cp .env.example .env
# عدّل DATABASE_URL و JWT_SECRET في .env

# 4. تهيئة قاعدة البيانات
npm run db:migrate

# 5. تشغيل السيرفر
npm run dev
```

**أو على Windows — كليك واحد:**
```
setup.bat
```

> 🌐 افتح المتصفح على: **http://localhost:5000**

---

## 🔐 بيانات الدخول التجريبية

| الدور | البريد الإلكتروني | كلمة السر | الصلاحيات |
|-------|------------------|-----------|-----------|
| **Admin** | admin@nexus.com | admin123 | كامل الصلاحيات |
| **Accountant** | accountant@nexus.com | acc123 | محاسبة + تقارير |
| **HR Manager** | hr@nexus.com | hr1234 | موارد بشرية |
| **Inventory** | inventory@nexus.com | inv123 | مخازن + مشتريات |
| **Sales** | sales@nexus.com | sales123 | مبيعات + CRM |
| **Viewer** | viewer@nexus.com | view123 | قراءة فقط |

**Company Code:** `nexus-demo`

---

## 📦 الوحدات المتوفرة

| الوحدة | الوصف | الحالة |
|--------|-------|--------|
| 🏠 Dashboard | لوحة تحكم مع KPIs حية | ✅ مكتمل |
| 💰 FI/CO | محاسبة مالية + دليل الحسابات | ✅ مكتمل |
| 👥 HR/HCM | موارد بشرية + رواتب + إجازات | ✅ مكتمل |
| 📦 EWM | مخازن متقدمة + خريطة حرارية | ✅ مكتمل |
| 🏭 PP | تخطيط الإنتاج + BOM | ✅ مكتمل |
| 🛒 MM | مشتريات + أوامر شراء | ✅ مكتمل |
| 📊 Sales | مبيعات + فواتير | ✅ مكتمل |
| 🤝 CRM | علاقات العملاء + Leads | ✅ مكتمل |
| 📋 Projects | إدارة المشاريع + Tasks | ✅ مكتمل |
| 🛡️ GRC | حوكمة + مخاطر + امتثال | ✅ مكتمل |
| 🖥️ BTP | منصة تقنية + Live Logs | ✅ مكتمل |
| 📈 Reports | تقارير مالية + مخزون + HR | ✅ مكتمل |

---

## 🏗️ هيكل المشروع

```
erp-backend/
├── server.js               ← نقطة الدخول الرئيسية
├── setup.bat               ← معالج التنصيب (Windows)
├── config/
│   └── db.js               ← إعداد PostgreSQL Pool
├── middleware/
│   ├── auth.js             ← JWT Authentication
│   └── rbac.js             ← Role-Based Access Control
├── routes/                 ← API Endpoints (12 ملف)
│   ├── accounts.js         ← /api/accounting
│   ├── hr.js               ← /api/hr
│   ├── production.js       ← /api/production
│   ├── projects.js         ← /api/projects
│   ├── purchasing.js       ← /api/purchasing
│   ├── grc.js              ← /api/grc
│   ├── btp.js              ← /api/btp
│   └── ...
├── public/
│   ├── index.html          ← Landing Page
│   └── admin/              ← لوحة التحكم (13 صفحة HTML)
├── seeds/
│   └── seed.js             ← Demo Data (20 منتج، 10 عملاء...)
└── db/
    └── migrate.js          ← Database Schema Migration
```

---

## ⚙️ متغيرات البيئة (.env)

```env
DATABASE_URL=postgres://postgres:password@localhost:5432/nexus_erp
JWT_SECRET=your-super-secret-key-min-32-chars
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5000
```

---

## 🗄️ أوامر مفيدة

```bash
npm run dev          # تشغيل بوضع التطوير (nodemon)
npm start            # تشغيل بوضع الإنتاج
npm run db:migrate   # تهيئة/تحديث schema قاعدة البيانات
npm run db:seed      # إضافة بيانات تجريبية

# فحص قاعدة البيانات
psql -U postgres -d nexus_erp -c "SELECT COUNT(*) FROM users;"

# فحص الـ API
curl http://localhost:5000/health
```

---

## 🏢 الفئات المستهدفة

- **الشركات التجارية المتوسطة** (20-500 موظف)
- **المصانع والشركات الصناعية** — لوحدة PP و EWM
- **شركات الاستيراد والتوزيع** — لوحدة MM و Warehouse
- **شركات الخدمات** — لوحدة HR و Projects و CRM
- **الشركات المصرية والخليجية** — دعم كامل للـ EGP و SAR

---

## 📞 التواصل والدعم

للاستفسارات عن التنصيب أو الدعم الفني، تواصل عبر WhatsApp أو المراسلة المباشرة.

---

## 📄 الرخصة

هذا البرنامج مرخص للاستخدام التجاري المقيّد. يُحظر إعادة البيع أو التوزيع دون إذن كتابي مسبق.

© 2026 Nexus ERP — All rights reserved.
