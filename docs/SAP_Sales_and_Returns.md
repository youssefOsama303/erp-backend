# SAP Sales Order Management & Returns — إدارة المبيعات والمرتجعات

## 1. نظرة عامة

وحدة SAP Sales & Distribution (SD) في S/4HANA تُدير الدورة الكاملة من عرض السعر حتى استلام المدفوعات، بما يشمل متابعة الطلبات، الشحن، الفوترة، وإدارة المرتجعات. تُعدّ نقطة التماس المباشرة بين الشركة وعملائها.

---

## 2. دورة المبيعات الكاملة (Order-to-Cash)

```
استفسار العميل (Inquiry)
        ↓
عرض السعر (Quotation)
        ↓
أمر المبيعات (Sales Order)
        ↓
تأكيد التوافر (Availability Check - ATP)
        ↓
تخطيط الشحن (Delivery Scheduling)
        ↓
أمر التسليم (Outbound Delivery)
        ↓
التقاط / تعبئة / شحن (Pick / Pack / Ship)
        ↓
الفاتورة (Billing Document)
        ↓
الترحيل للمحاسبة (FI Posting)
        ↓
استلام الدفع (Payment)
```

---

## 3. أنواع أوامر المبيعات

| نوع الأمر | الكود | الوصف |
|-----------|-------|-------|
| Standard Order | OR | البيع العادي |
| Rush Order | SO | شحن في نفس اليوم |
| Cash Sales | BV | دفع فوري نقداً |
| Free of Charge | FD | منح مجاني (ترويجي) |
| Consignment Fill-up | KB | تعبئة مخزون الوديعة |
| Third Party | TA | طلب يُشحن مباشرة من المورد |
| Contract Release | KE | إطلاق من عقد إطاري |

---

## 4. إدارة أوامر المبيعات

### 4.1 مكونات أمر المبيعات

```
Sales Order Header
├── Customer (العميل + عنوان الشحن)
├── Pricing Conditions (الأسعار والخصومات)
├── Payment Terms (شروط الدفع)
├── Delivery Terms (Incoterms)
└── Order Items
      ├── Material / Quantity
      ├── Confirmed Date (ATP)
      ├── Plant & Storage Location
      └── Pricing per Item
```

### 4.2 فحص التوافر (ATP Check)

| الأسلوب | الوصف |
|---------|-------|
| Check Against Stock | فحص المخزون الحالي |
| Check with Replenishment | يشمل أوامر الإنتاج والشراء |
| Capable to Promise (CTP) | يُجدوِل الإنتاج بناءً على الطلب |
| Global ATP (gATP) | توافر عبر مواقع متعددة |

---

## 5. متابعة الطلبات (Order Tracking)

### 5.1 Document Flow (سجل المستندات)

```
Quotation #1234
      ↓ تحوّل إلى
Sales Order #5678
      ↓ يولّد
Outbound Delivery #90123
      ↓ يولّد
Transfer Order (WM Picking)
      ↓
Goods Issue Posted
      ↓ يولّد
Invoice #INV-456
      ↓
Accounting Document
```

> **مثال حقيقي:** كما في صور **Sales Order — Document Flow**، يستطيع موظف خدمة العملاء تتبع أي طلب من لحظة إنشائه حتى الفوترة من شاشة واحدة، مع رؤية كل مستند مرتبط.

### 5.2 حالات الأمر

| الحالة | الوصف |
|--------|-------|
| Open | مفتوح، لم يُشحن |
| Partially Delivered | شُحن جزئياً |
| Fully Delivered | شُحن بالكامل |
| Invoiced | صدرت الفاتورة |
| Completed | مكتمل وتم الدفع |

---

## 6. إدارة المرتجعات (Returns Management)

### 6.1 أنواع المرتجعات

| النوع | الكود | الإجراء |
|-------|-------|---------|
| Customer Return (RE) | RE | استلام البضاعة + رصيد للعميل |
| Free of Charge Return | REN | استبدال مجاني |
| Returns Delivery | LR | إعادة للمستودع |
| Credit Note | G2 | إشعار دائن |
| Debit Note | L2 | إشعار مدين |

### 6.2 دورة المرتجعات الكاملة

```
طلب إرجاع من العميل (Return Request)
        ↓
إنشاء أمر مرتجع (Return Order - RE)
        ↓
ترخيص إرجاع البضاعة (RMA Number)
        ↓
استلام البضاعة في المستودع (Returns Delivery)
        ↓
فحص الجودة (Quality Inspection - QM)
        ↓
قرار الاستخدام:
  ├── جيد → إعادة لمخزون قابل للبيع
  ├── قابل للإصلاح → أمر صيانة (PM)
  └── خردة → إتلاف (Scrap)
        ↓
إشعار دائن للعميل (Credit Memo)
```

### 6.3 Advanced Returns Management (ARM)

- **Refund Management** — إدارة الاسترداد المالي
- **Follow-Up Actions** — إجراءات تلقائية بعد قرار المرتجع
- **Logistical Returns** — شحن المرتجعات للمورد الأصلي
- **Customer Refund** — استرداد نقدي أو رصيد مستقبلي

---

## 7. إدارة الأسعار والخصومات (Pricing)

### 7.1 هيكل شروط الأسعار

```
Gross Price (السعر الإجمالي)
   - Customer Discount (خصم العميل)
   - Material Discount (خصم المادة)
   - Volume Discount (خصم الكمية)
   ─────────────────────────────
   = Net Price
   + Freight (شحن)
   + Tax (ضريبة)
   ─────────────────────────────
   = Final Price
```

### 7.2 أنواع الخصومات

| نوع الخصم | الأساس |
|-----------|--------|
| Customer-specific | مفاوض مع العميل |
| Material Group | مجموعة المنتجات |
| Quantity Break | أسعار الكميات |
| Promotional | حملات محدودة المدة |
| Rebate | خصم نهاية الفترة (حسب الحجم السنوي) |

---

## 8. التسليم والشحن

### 8.1 أنواع التسليم

- **Outbound Delivery** — شحن من المستودع للعميل
- **Intercompany Delivery** — شحن بين شركات في المجموعة
- **Drop Shipment** — شحن مباشر من المورد للعميل

### 8.2 مراحل معالجة التسليم

```
إنشاء أمر التسليم
        ↓
تخصيص مكان التخزين (Storage Location)
        ↓
الالتقاط (Picking — WM or EWM)
        ↓
التعبئة والتغليف (Packing)
        ↓
إصدار البضاعة (Goods Issue — GI)
        ↓
طباعة مستندات الشحن (BOL, Packing List)
        ↓
تسليم لشركة الشحن
```

---

## 9. الفوترة (Billing)

| نوع الوثيقة | الوصف |
|------------|-------|
| Invoice (F2) | فاتورة عادية |
| Pro Forma Invoice | فاتورة أولية (للجمارك) |
| Advance Billing | فوترة مسبقة |
| Milestone Billing | فوترة على دفعات (مشاريع) |
| Periodic Billing | فوترة دورية (اشتراكات) |

---

## 10. التكامل مع مكونات SAP

```
SAP CRM / C4C  ← طلبات العملاء من قنوات البيع
SAP SD         ← معالجة الطلب والشحن
SAP WM / EWM   ← إدارة المستودع والالتقاط
SAP QM         ← فحص المرتجعات
SAP FI         ← تسجيل الإيرادات والذمم
SAP CO         ← تحليل ربحية العميل / المنتج
SAP Analytics  ← تقارير المبيعات والمرتجعات
```

---

## 11. الاستخدام في المشاريع السحابية

```
✅ تفعيل Automatic Availability Check لجميع أنواع الطلبات
✅ إعداد ATP rules للأسواق المختلفة
✅ أتمتة إنشاء أوامر التسليم من أوامر المبيعات
✅ تفعيل Advanced Returns Management لتبسيط المرتجعات
✅ ربط SAP S/4HANA SD مع SAP Commerce Cloud (eCommerce)
✅ نشر تقارير المبيعات الفورية على SAP Analytics Cloud
```

---

## 12. KPIs المبيعات والمرتجعات

| المؤشر | الوصف | الهدف |
|--------|-------|-------|
| Order Fulfillment Rate | نسبة تلبية الطلبات | > 98% |
| Perfect Order Rate | طلبات بلا أخطاء | > 95% |
| Return Rate | نسبة المرتجعات | < 3% |
| Days Sales Outstanding (DSO) | أيام استيفاء الذمم | < 30 يوم |
| Order Cycle Time | وقت من الطلب للتسليم | حسب SLA |

---

*آخر تحديث: 2025 | المرجع: SAP Help Portal — SD Module | SAP S/4HANA Cloud*
