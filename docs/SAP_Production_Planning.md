# SAP Production Planning — تخطيط الإنتاج (PP)

## 1. نظرة عامة

SAP Production Planning (PP) يُدير دورة التصنيع الكاملة: من احتياجات المواد والطاقة الإنتاجية، مروراً بتنفيذ أوامر الإنتاج، حتى استلام المنتجات النهائية في المخزون. يتكامل بعمق مع MM (المواد)، QM (الجودة)، PM (الصيانة)، والـ CO (التكاليف).

---

## 2. البيانات الأساسية للإنتاج

### 2.1 قوائم المكونات — Bill of Materials (BOM)

```
المنتج النهائي (Finished Good)
    ├── مجموعة فرعية A (Semi-Finished)
    │     ├── مادة خام X — 2 كجم
    │     └── مادة خام Y — 1 لتر
    ├── مجموعة فرعية B (Semi-Finished)
    │     └── مادة خام Z — 500 جم
    └── مواد تعبئة (Packaging)
          └── كرتون — 1 قطعة
```

**أنواع BOM:**
| النوع | الاستخدام |
|-------|---------|
| Production BOM | الإنتاج الفعلي |
| Sales BOM | تسعير البيع |
| Engineering BOM | التصميم والهندسة |
| Multi-Level BOM | عدة مستويات من الصنع |

### 2.2 خطوط الإنتاج — Routings

```
Routing (مسار الإنتاج)
    ├── Operation 10: خلط المواد (Work Center: Mixer01)  — 30 دقيقة
    ├── Operation 20: الطبخ / المعالجة (Work Center: Oven01) — 60 دقيقة
    ├── Operation 30: فحص الجودة (QM Inspection Point)
    ├── Operation 40: التبريد (Work Center: Cooler01) — 45 دقيقة
    └── Operation 50: التعبئة (Work Center: Packing01) — 20 دقيقة
```

### 2.3 مراكز العمل — Work Centers

| الحقل | الوصف |
|-------|-------|
| Capacity | الطاقة الإنتاجية (ساعات/يوم) |
| Formula | معادلة حساب الوقت |
| Queue Time | وقت الانتظار بين العمليات |
| Cost Center | مركز التكلفة المرتبط |
| Shift | ورديات العمل |

---

## 3. تخطيط الاحتياجات — MRP

### 3.1 مفهوم MRP

```
طلبات المبيعات (Sales Orders)
+ خطة الإنتاج (Production Plan / PIR)
- المخزون الحالي (Available Stock)
- أوامر الشراء المفتوحة (Open POs)
= صافي الاحتياج (Net Requirement)
        ↓
MRP يولّد:
  ├── Planned Orders (للإنتاج)
  └── Purchase Requisitions (للشراء)
```

### 3.2 إجراءات MRP

| الإجراء | الكود | الوصف |
|---------|-------|-------|
| Reorder Point | VB | إعادة الطلب عند الوصول للحد |
| MRP | PD | تخطيط حسب الاحتياج الفعلي |
| Lot-for-Lot | EX | طلب بالكمية المطلوبة فقط |
| Fixed Lot Size | FX | كمية ثابتة في كل دورة |
| Economic Order Qty | WI | الكمية الاقتصادية المثلى |

### 3.3 أفق التخطيط

```
اليوم
  ↓ Demand Time Fence
      (لا تغيير تلقائي — تدخل بشري)
  ↓ Planning Time Fence
      (MRP يقترح، المخطط يعتمد)
  ↓ ما بعد الأفق
      (MRP يعمل تلقائياً)
```

---

## 4. أوامر الإنتاج

### 4.1 دورة أمر الإنتاج الكاملة

```
Planned Order (من MRP)
        ↓ تحويل
Production Order (أمر الإنتاج)
        ↓
تخصيص المواد (Component Availability Check)
        ↓
جدولة الطاقة (Capacity Scheduling)
        ↓
إصدار الأمر (Release)
        ↓
صرف المواد (Goods Issue — GI)
        ↓
تنفيذ العمليات (Operations Confirmation)
        ↓
فحص الجودة (QM In-Process)
        ↓
استلام المنتج النهائي (Goods Receipt — GR)
        ↓
التسوية المحاسبية (Settlement to Cost Center)
        ↓
إغلاق الأمر (TECO — Technically Complete)
```

### 4.2 أنواع أوامر الإنتاج

| النوع | الوصف | الاستخدام |
|-------|-------|---------|
| Production Order (PP) | أمر إنتاج كلاسيكي | صناعة متقطعة |
| Process Order (PI) | أمر عملية | صناعة مستمرة (كيماويات، غذاء) |
| Planned Order | مقترح MRP | يتحول لأمر إنتاج |
| Repetitive Manufacturing | إنتاج متكرر | خطوط تجميع مستمرة |

---

## 5. تخطيط الطاقة الإنتاجية

### 5.1 Capacity Planning

```
أوامر الإنتاج الحالية
        ↓
حساب الحمل (Load) لكل Work Center
        ↓
مقارنة بالطاقة المتاحة (Available Capacity)
        ↓
كشف الاختناقات (Bottlenecks)
        ↓
إجراءات:
  ├── إعادة الجدولة (Rescheduling)
  ├── إضافة وردية إضافية
  ├── الاستعانة بمصادر خارجية (Subcontracting)
  └── تغيير تسلسل الأوامر (Sequencing)
```

### 5.2 أدوات تخطيط الطاقة

| الأداة | الوصف |
|--------|-------|
| Capacity Evaluation (CM01) | مقارنة الحمل بالطاقة |
| Planning Table | جدول تخطيط تفاعلي |
| Gantt Chart | مخطط جانت لتتابع الأوامر |
| Finite Scheduling | جدولة مع قيود الطاقة |

---

## 6. تأكيد الإنتاج (Confirmation)

### 6.1 ما يتم تسجيله عند التأكيد

- الوقت الفعلي للتشغيل
- الكميات المنتجة (جيد + خردة)
- المواد المستهلكة الإضافية
- الموظف المنفذ
- أي مشاكل أو ملاحظات

### 6.2 طرق التأكيد

| الطريقة | الوصف |
|---------|-------|
| Manual Confirmation | إدخال يدوي في SAP |
| Backflushing | تخصم المواد تلقائياً بالاستلام |
| MES Integration | نظام تنفيذ التصنيع |
| IoT / SCADA | أجهزة قياس تُسجّل تلقائياً |
| Mobile App (SAP WM) | تطبيق محمول لخط الإنتاج |

---

## 7. إدارة دُفعات الإنتاج (Batch Management)

```
أمر إنتاج → يُنشئ دُفعة (Batch)
        ↓
رقم الدفعة يُمكّن التتبع:
  ├── من أي مواد خام صُنعت؟
  ├── في أي تاريخ؟
  ├── على أي خط إنتاج؟
  └── من فحص الجودة؟
        ↓
عند الشكوى → Batch Traceability (تتبع الدفعة)
```

---

## 8. التكامل مع وحدات SAP الأخرى

```
SAP SD (طلبات المبيعات) → MRP → PP (أوامر إنتاج)
SAP MM → توفير المواد الخام لأوامر الإنتاج
SAP QM → فحص جودة في خط الإنتاج + استلام المنتج
SAP PM → الصيانة المخططة للآلات (تنسيق التوقف)
SAP CO → تسجيل تكاليف الإنتاج الفعلية
SAP EWM → توفير المواد من المستودع لخط الإنتاج
SAP MES (Manufacturing Execution) → تفاصيل خط الإنتاج
```

---

## 9. التقارير والمؤشرات

| المؤشر | الوصف | الهدف |
|--------|-------|-------|
| OEE | Overall Equipment Effectiveness | > 85% |
| Schedule Adherence | الالتزام بجدول الإنتاج | > 95% |
| First Pass Yield | النجاح من المرور الأول | > 98% |
| Scrap Rate | معدل الخردة | < 1% |
| Production Variance | انحراف التكلفة الفعلية | < 5% |
| MRP Exception Rate | استثناءات MRP | < 10% |
| Work-in-Process (WIP) | مخزون تحت التصنيع | حسب الهدف |

---

## 10. SAP Manufacturing Cloud (الحل السحابي)

### 10.1 SAP Digital Manufacturing (DM)

- **Shop Floor Integration** — ربط SAP S/4HANA بخط الإنتاج
- **OEE Dashboard** — مؤشرات كفاءة الآلات الفورية
- **Nonconformance Management** — إدارة عدم المطابقة
- **SFC (Shop Floor Control)** — تحكم في تسلسل الإنتاج
- **IoT Integration** — ربط SCADA وأجهزة القياس

### 10.2 SAP Integrated Business Planning (IBP)

- **Sales & Operations Planning (S&OP)** — خطة المبيعات والعمليات
- **Demand Sensing** — استشعار الطلب بالذكاء الاصطناعي
- **Supply Planning** — تخطيط الإمداد متعدد المواقع
- **Inventory Optimization** — تحسين مستويات المخزون

---

## 11. أفضل الممارسات في المشاريع السحابية

```
✅ بناء BOM هرمية دقيقة قبل أي تشغيل
✅ تعريف Work Centers مع الطاقة الصحيحة (ساعات / وردية)
✅ تفعيل MRP Level by Level (مستوى بمستوى)
✅ استخدام Backflushing للمواد منخفضة القيمة
✅ ربط PP مع QM لفحص كل دفعة إنتاج
✅ نشر OEE Dashboard على SAP Analytics Cloud
✅ التكامل مع SAP IBP للتخطيط طويل المدى
```

---

*آخر تحديث: 2025 | المرجع: SAP Help Portal — PP / MRP / Digital Manufacturing*
