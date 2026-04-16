# SAP Plant Maintenance & Asset Management — الصيانة وإدارة الأصول

## 1. نظرة عامة

SAP Plant Maintenance (PM) — المُدمج في SAP S/4HANA تحت مسمى **Asset Management** — يدير دورة حياة الأصول المادية الكاملة: من التخطيط والجدولة، عبر التنفيذ والمتابعة، حتى تقاعد الأصل. يدعم الصيانة التصحيحية والوقائية والتنبؤية.

---

## 2. التسلسل الهرمي للأصول التقنية

```
Functional Location (الموقع الوظيفي)
    └── Equipment (المعدة)
           └── Equipment (معدة فرعية)
                  └── Serial Number / Batch
```

### 2.1 الفرق بين الموقع والمعدة

| العنصر | الوصف | مثال |
|--------|-------|------|
| Functional Location | مكان ثابت في المصنع | خط الإنتاج A / محطة الضخ 01 |
| Equipment | أصل متحرك قابل للنقل | مضخة #1234 / رافعة شوكية |

---

## 3. أنواع الصيانة

### 3.1 الصيانة التصحيحية (Corrective Maintenance)

```
اكتشاف العطل (Breakdown / User Report)
        ↓
إشعار صيانة (Maintenance Notification)
        ↓
أمر عمل صيانة (Maintenance Order)
        ↓
تخطيص الموارد (Personnel + Materials + Services)
        ↓
تنفيذ وتأكيد العمل (Confirmation)
        ↓
إغلاق الأمر والتسوية المحاسبية
```

### 3.2 الصيانة الوقائية (Preventive Maintenance)

- **Time-Based** — كل 3 أشهر / كل 1000 ساعة تشغيل
- **Counter-Based** — عند الوصول لعداد معين (KM / Cycles)
- **Condition-Based** — بناءً على قراءات مستشعرات (IoT)
- **Maintenance Plans** — خطط دورية تُولّد الأوامر تلقائياً

### 3.3 الصيانة التنبؤية (Predictive Maintenance)

| المصدر | البيانات | الإجراء |
|--------|---------|---------|
| IoT Sensors | اهتزاز / حرارة / ضغط | تنبيه عند تجاوز الحد |
| ML Models | أنماط التوقف التاريخية | توقع العطل قبل حدوثه |
| SAP APM | Condition Monitoring | لوحة تحكم الأصول |

---

## 4. أوامر العمل (Work Orders)

### 4.1 مكونات أمر العمل

```
Maintenance Order
├── Header (نوع الأمر، الأولوية، التواريخ)
├── Operations (الأعمال المطلوبة)
│     ├── Work Centers (مراكز العمل)
│     └── Capacity Requirements
├── Components (قطع الغيار)
├── Costs (التكاليف المخططة والفعلية)
└── Permits (تصاريح السلامة)
```

### 4.2 أولويات أوامر العمل

| الأولوية | الوصف | وقت الاستجابة |
|---------|-------|--------------|
| Very High | إيقاف تام للإنتاج | فوري |
| High | تأثير على الإنتاج | < 4 ساعات |
| Medium | لا تأثير فوري | < 24 ساعة |
| Low | صيانة دورية | < أسبوع |

---

## 5. إدارة قطع الغيار

### 5.1 تكامل PM مع MM

```
أمر عمل صيانة
       ↓ طلب قطعة غيار
حجز مخزون (Reservation)
       ↓ إذا لم تتوفر
طلب شراء تلقائي (Purchase Requisition)
       ↓
استلام وصرف لأمر الصيانة
       ↓
تسجيل التكلفة على الأصل
```

### 5.2 أنواع مخزون قطع الغيار

- **Reorder Point Planning** — إعادة الطلب عند الوصول لحد أدنى
- **Consumables** — مواد استهلاكية (زيوت، فلاتر)
- **Spare Parts** — قطع احتياطية حرجة (لا تُستهلك بانتظام)
- **Rotable Spares** — قطع تُصلح وتُعاد للاستخدام

---

## 6. Measurement Documents & Counters

| العداد | وحدة القياس | الاستخدام |
|--------|------------|---------|
| Operating Hours | ساعات | المحركات والمضخات |
| Production Cycles | دورة | آلات التشكيل |
| Distance | كيلومتر | المركبات والرافعات |
| Temperature Cycles | دورة | أفران المعالجة |

---

## 7. التقارير والتحليلات

| التقرير | الوصف |
|---------|-------|
| Equipment History | تاريخ كل عمليات الصيانة لأصل |
| Breakdown Analysis | تحليل أسباب الأعطال |
| MTBF / MTTR | متوسط الوقت بين الأعطال / وقت الإصلاح |
| Cost per Equipment | تكلفة الصيانة لكل أصل |
| PM Order Status | حالة جميع أوامر الصيانة |
| Overdue Inspections | الفحوصات المتأخرة |

---

## 8. السلامة وتصاريح العمل

### 8.1 Work Clearance Management

```
طلب تصريح عمل
       ↓
مراجعة مسؤول السلامة
       ↓
إجراءات العزل (Isolation / Lockout-Tagout)
       ↓
تنفيذ أعمال الصيانة
       ↓
إعادة التشغيل بعد التحقق
```

### 8.2 إشعارات الجودة المرتبطة بالصيانة

- ربط عيوب الجودة (QM) بأوامر الصيانة تلقائياً
- تتبع الإجراءات التصحيحية من الجذر

---

## 9. التكامل مع مكونات SAP الأخرى

```
SAP FI/CO  → تسجيل تكاليف الصيانة على مراكز التكلفة
SAP MM     → توفير قطع الغيار والمواد
SAP QM     → إشعارات العيوب → أوامر صيانة
SAP PP     → التنسيق مع جداول الإنتاج للتوقف المخطط
SAP PS     → الصيانة الرأسمالية كمشاريع
SAP APM    → Asset Performance Management (السحابة)
```

---

## 10. الاستخدام في المشاريع السحابية

### 10.1 SAP Asset Performance Management (APM)

- **Digital Twin** — نسخة رقمية من الأصل الفعلي
- **Failure Mode Analysis (FMEA)** — تحليل أنماط الفشل
- **Risk-Based Maintenance** — الصيانة المبنية على المخاطر
- **IoT Integration** — ربط مستشعرات SAP IoT

### 10.2 أفضل الممارسات

```
✅ بناء هيكل Functional Location قبل ترحيل الأصول
✅ تفعيل Preventive Maintenance Plans للأصول الحرجة
✅ ربط أوامر الصيانة بمراكز التكلفة للتقارير المالية
✅ استخدام SAP Work Manager (Mobile) للفنيين الميدانيين
✅ نشر KPIs (MTBF, OEE) على SAP Analytics Cloud
```

---

## 11. مؤشرات الأداء (KPIs)

| المؤشر | المعنى | الهدف |
|--------|--------|-------|
| OEE | Overall Equipment Effectiveness | > 85% |
| MTBF | Mean Time Between Failures | ↑ تزيد |
| MTTR | Mean Time To Repair | ↓ تقل |
| PM Compliance | نسبة تنفيذ الصيانة المجدولة | > 95% |
| Breakdown Rate | نسبة أوامر الطوارئ | < 10% |

---

*آخر تحديث: 2025 | المرجع: SAP Help Portal — PM / EAM Module*
