# SAP Warehouse Management — إدارة المستودعات (WM / EWM)

## 1. نظرة عامة

تُوفّر SAP حلَّين لإدارة المستودعات:
- **SAP WM (Warehouse Management)** — الحل الكلاسيكي المدمج في S/4HANA (يُدار تدريجياً للتقاعد)
- **SAP EWM (Extended Warehouse Management)** — الحل المتقدم المُوصى به، متاح داخل S/4HANA أو منفصلاً على BTP

---

## 2. هيكل المستودع

### 2.1 التسلسل الهرمي

```
Warehouse Number (رقم المستودع)
    └── Warehouse Type / Storage Type (نوع التخزين)
           ├── Open Storage (تخزين مفتوح)
           ├── Fixed Bin (رف ثابت)
           ├── High Rack Storage (رفوف عالية)
           └── Hazardous Materials Area
                   └── Storage Section (قسم التخزين)
                          └── Storage Bin (خلية التخزين)
                                 └── Quant (كمية في الخلية)
```

### 2.2 أنواع حركات المستودع

| نوع الحركة | الاتجاه | الوصف |
|------------|---------|-------|
| Goods Receipt (GR) | وارد ← | استلام بضاعة من المورد |
| Goods Issue (GI) | صادر → | صرف بضاعة للإنتاج أو العميل |
| Stock Transfer | داخلي ↔ | نقل بين خلايا أو مستودعات |
| Putaway | داخلي ↓ | وضع البضاعة في الخلية |
| Picking | داخلي ↑ | التقاط البضاعة للشحن |
| Physical Inventory | داخلي | جرد وعدّ المخزون |

---

## 3. SAP EWM — المزايا المتقدمة

### 3.1 مقارنة WM vs EWM

| الميزة | SAP WM | SAP EWM |
|--------|--------|---------|
| بنية التخزين | بسيطة | معقدة ومرنة |
| استراتيجيات Putaway | محدودة | متقدمة (capacity, mixed storage) |
| استراتيجيات Picking | محدودة | FIFO/FEFO/LIFO/Nearest Bin |
| Wave Management | ❌ | ✅ |
| Labor Management | ❌ | ✅ |
| Yard Management | ❌ | ✅ |
| Value-Added Services | ❌ | ✅ |
| RF/Voice/RFID | محدود | كامل |
| Integration IoT | ❌ | ✅ |

### 3.2 استراتيجيات Putaway (وضع البضاعة)

```
بضاعة واردة
      ↓
EWM يحدد الخلية المناسبة بناءً على:
  ├── Fixed Bin — خلية محددة لكل مادة
  ├── Open Storage — أي خلية فارغة
  ├── Addition to Existing Stock — مع مخزون موجود
  ├── Capacity Check — حسب سعة الخلية
  ├── Storage Unit Type — نوع الوحدة (بليت، صندوق)
  └── Hazardous Materials — مناطق خاصة
```

### 3.3 استراتيجيات Picking (الالتقاط)

| الاستراتيجية | الوصف | الاستخدام |
|-------------|-------|---------|
| FIFO | First In First Out | الغذاء والدواء |
| FEFO | First Expired First Out | المنتجات ذات الصلاحية |
| LIFO | Last In First Out | المواد الخام المتكدسة |
| Largest Quantity | أكبر كمية أولاً | تقليل عدد الخلايا |
| Nearest Bin | أقرب خلية | تقليل مسافة التنقل |

---

## 4. Wave Management (إدارة الموجات)

### 4.1 مفهوم الموجة

```
طلبات التسليم المتعددة
        ↓
تجميع في موجة واحدة (Wave)
        ↓
تحسين مسارات الالتقاط
        ↓
توزيع على عمال المستودع
        ↓
تنفيذ دفعة واحدة
```

### 4.2 فوائد Wave Management

- تقليل وقت الالتقاط بنسبة 30-40%
- تحسين استخدام الموارد البشرية
- دمج طلبات نفس المسار
- التزامن مع مواعيد الشحن

---

## 5. Transfer Orders (أوامر النقل)

```
طلب نقل (Transfer Requirement)
        ↓
إنشاء أمر نقل (Transfer Order)
        ↓
تعيين لعامل مستودع
        ↓
تنفيذ (Confirm) — Barcode / RFID / Voice
        ↓
تحديث المخزون في الخلية
        ↓
تأكيد أمر التسليم / الاستلام
```

---

## 6. الجرد (Physical Inventory)

### 6.1 أنواع الجرد

| النوع | الوصف |
|-------|-------|
| Annual Inventory | جرد سنوي شامل |
| Cycle Counting | جرد دوري لخلايا محددة |
| Continuous Inventory | كل خلية مرة في السنة |
| Zero Stock Check | فحص الخلايا الفارغة |
| Inventory Sampling | عينة إحصائية |

### 6.2 دورة الجرد

```
إنشاء وثيقة جرد (Inventory Document)
        ↓
طباعة قوائم العدّ
        ↓
العدّ الفعلي (بـ RF أو يدوياً)
        ↓
تسجيل النتائج
        ↓
مقارنة مع النظام
        ↓
إذا اختلاف > حد مسموح → إعادة العد
        ↓
ترحيل الفروقات (+ / -)
```

---

## 7. Value-Added Services (VAS)

خدمات تُضاف على البضاعة داخل المستودع:

| الخدمة | الوصف |
|--------|-------|
| Kitting | تجميع مكونات في مجموعة |
| Labeling | لصق ملصقات العميل |
| Repacking | إعادة التعبئة |
| Quality Inspection | فحص الجودة |
| Gift Wrapping | تغليف الهدايا |
| Postponement | تأجيل التخصيص للأسواق |

---

## 8. Yard Management (إدارة الساحة)

```
شاحنة تصل للمستودع
        ↓
تسجيل في Yard (Check-In)
        ↓
تعيين Dock Door (رصيف)
        ↓
عملية الاستلام / الشحن
        ↓
مغادرة الشاحنة (Check-Out)
```

---

## 9. تقنيات التنفيذ

| التقنية | الوصف | المزايا |
|---------|-------|---------|
| RF Scanning | ماسح باركود محمول | سريع وموثوق |
| Voice Picking | توجيه صوتي | يد حرة — أمان أعلى |
| RFID | قراءة تلقائية | سرعة قصوى |
| Pick-to-Light | مصابيح إرشادية | دقة عالية |
| Goods-to-Person | Robot يجلب البضاعة | أتمتة كاملة |
| SAP Work Manager | تطبيق موبايل | للعمل الميداني |

---

## 10. التكامل مع مكونات SAP

```
SAP SD (Delivery) → Picking Request → EWM → Transfer Order
SAP MM (GR) → Putaway Request → EWM → Storage Bin
SAP PP (Production Supply) → Replenishment → EWM
SAP QM (Quality) → Inspection Lot → EWM (Quality Stock)
SAP TM (Transportation) → Truck Scheduling → Yard Management
SAP FI → Inventory Adjustments → GL Posting
```

---

## 11. التقارير والمؤشرات

| المؤشر | الوصف | الهدف |
|--------|-------|-------|
| Warehouse Utilization | نسبة الخلايا المشغولة | 75-85% |
| Picking Accuracy | دقة الالتقاط | > 99.5% |
| Put-Away Time | وقت وضع البضاعة في الخلية | < 2 ساعة |
| Order Fulfillment Rate | نسبة الطلبات المكتملة | > 98% |
| Inventory Accuracy | دقة المخزون | > 99% |
| Lines per Hour | إنتاجية عمال المستودع | حسب القطاع |

---

## 12. الاستخدام في المشاريع السحابية

```
✅ اختر EWM بدلاً من WM لأي مشروع جديد
✅ ابدأ بتصميم هيكل المستودع (Storage Types & Bins) قبل التنفيذ
✅ فعّل Cycle Counting بدلاً من الجرد السنوي
✅ استخدم RF Scanning كحد أدنى — Voice للبيئات الكبيرة
✅ ادمج EWM مع SAP TM لتحسين الشحن
✅ نشر KPIs المستودع على SAP Analytics Cloud
✅ فكر في Automation (Goods-to-Person) للمستودعات الكبيرة
```

---

*آخر تحديث: 2025 | المرجع: SAP Help Portal — EWM Module | SAP S/4HANA Embedded EWM*
