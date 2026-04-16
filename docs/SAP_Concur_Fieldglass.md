# SAP Concur & SAP Fieldglass — المصروفيات والعمالة الخارجية

## 1. نظرة عامة

### SAP Concur
منصة سحابية لإدارة مصروفيات السفر والأعمال: من حجز الرحلات والفنادق، مروراً بتقارير المصروفيات، حتى المراجعة والسداد. الأكثر استخداماً عالمياً في هذا المجال.

### SAP Fieldglass
منصة إدارة العمالة الخارجية (Contingent Workforce): المستقلون، المتعاقدون، موظفو الوكالات، وخدمات الأعمال الخارجية (SOW — Statement of Work).

---

## 2. SAP Concur — إدارة المصروفيات والسفر

### 2.1 دورة المصروف الكاملة

```
احتياج للسفر أو مصروف
        ↓
طلب سفر مسبق (Pre-Trip Request)
        ↓
اعتماد المدير
        ↓
حجز: طيران + فندق + تأجير سيارة (Concur Travel)
        ↓
تنفيذ السفر
        ↓
رفع تقرير المصروفيات (Expense Report)
  ├── مصروفات من بطاقة الشركة (تلقائية)
  ├── مصروفات نقدية (يدوية + إيصال)
  └── مصروفات من تطبيق الموبايل (صورة إيصال)
        ↓
اعتماد المدير / المراجع
        ↓
التحقق من السياسة (Policy Check — تلقائي)
        ↓
سداد للموظف
        ↓
ترحيل لـ SAP FI (مراكز التكلفة)
```

### 2.2 Concur Travel — حجوزات السفر

| الخدمة | الوصف |
|--------|-------|
| Flight Booking | حجز الطيران بأفضل الأسعار |
| Hotel Booking | فنادق مع أسعار مفاوضة |
| Car Rental | تأجير سيارات |
| Rail | قطارات |
| Airport Transfers | نقل المطار |
| Travel Policy Enforcement | تطبيق سياسة السفر تلقائياً |

### 2.3 Concur Expense — تقارير المصروفيات

```
طرق إدخال المصروفات:
├── بطاقة الشركة (Corporate Card) → استيراد تلقائي
├── تطبيق Concur Mobile → صور الإيصالات بالـ AI (OCR)
├── SAP Concur Drive → مصروفات التنقل (مسافة × معدل)
└── Expensit Bot → رفع إيصال بصورة واحدة
```

### 2.4 سياسات المصروفيات (Expense Policies)

| السياسة | الوصف |
|---------|-------|
| Daily Meal Limit | حد يومي للوجبات |
| Hotel Per Diem | سقف سعر الفندق |
| Flight Class | درجة السفر المسموحة |
| Advance Booking | الحجز مبكراً (خصم) |
| Out-of-Policy Alert | تنبيه عند تجاوز السياسة |
| Receipt Required | الإيصال مطلوب فوق مبلغ معين |

### 2.5 أنواع الاعتماد

```
تقرير المصروفيات
        ↓
[تلقائي] فحص السياسة
        ↓ إذا بلا مخالفات
اعتماد المدير المباشر
        ↓ إذا > حد مالي معين
اعتماد إضافي (CFO / مدير المالية)
        ↓ دائماً
قسم الحسابات — مراجعة نهائية
        ↓
سداد للموظف (ACH / تحويل بنكي)
```

---

## 3. Concur Invoice — فواتير المدفوعات الصغيرة

- إدارة فواتير الموردين الصغيرة (غير المدارة في Ariba)
- رفع الفاتورة + مطابقة مع أمر الشراء
- سير عمل اعتماد متكامل
- ترحيل لـ SAP S/4HANA AP

---

## 4. SAP Fieldglass — العمالة الخارجية

### 4.1 أنواع العمالة الخارجية المُدارة

| النوع | الوصف |
|-------|-------|
| Contingent Workers | موظفون مؤقتون من وكالات |
| Independent Contractors | مستقلون بعقود مباشرة |
| SOW Workers | موردو خدمات بنطاق عمل محدد |
| Interns | متدربون |
| Secondments | موظفو شركات تابعة |

### 4.2 دورة العمال الخارجيين

```
احتياج لعامل خارجي
        ↓
إنشاء طلب عمل (Job Requisition)
        ↓
إرسال لوكالات / موردين (Vendor Network)
        ↓
استقبال مرشحين (Candidate Submission)
        ↓
اختيار وتوظيف
        ↓
إنشاء عقد (Work Order / SOW)
        ↓
تسجيل وقت العمل (Timesheet)
  ├── يُوافق عليه المشرف
  └── يُرسل للمورد للفوترة
        ↓
فاتورة المورد ← مطابقة مع الوقت المسجل
        ↓
سداد المورد (SAP S/4HANA AP)
        ↓
إنهاء العقد (Offboarding)
```

### 4.3 Statement of Work (SOW)

```
مشروع بنطاق عمل محدد
        ↓
Fieldglass SOW:
  ├── نطاق العمل والمخرجات
  ├── الجدول الزمني
  ├── الميزانية
  └── معايير القبول
        ↓
الفوترة حسب المخرجات (Milestone / Fixed)
        ↓
مراجعة الأداء وقبول المخرجات
        ↓
سداد المورد
```

---

## 5. التكامل مع SAP S/4HANA

### 5.1 Concur ↔ S/4HANA

```
SAP Concur (تقرير المصروف معتمد)
        ↓
ترحيل تلقائي عبر Integration Suite
        ↓
SAP FI (مستند محاسبي)
  ├── مدين: مركز التكلفة / مشروع
  └── دائن: حساب الذمم للموظف
        ↓
سداد عبر الدفعات الدورية (F110)
```

### 5.2 Fieldglass ↔ S/4HANA

```
SAP Fieldglass (Timesheet معتمد)
        ↓
إنشاء Service Entry Sheet في S/4HANA MM
        ↓
مطابقة مع PO الخدمات
        ↓
ترحيل التكاليف على مراكز التكلفة / المشاريع
        ↓
دفع الفاتورة للوكالة
```

### 5.3 التكامل مع SAP SuccessFactors

```
SAP SuccessFactors (الموظف الدائم)
SAP Fieldglass (الموظف الخارجي)
        ↓ مزامنة
SAP BTP Unified View
  └── كل القوى العاملة في تقرير واحد
```

---

## 6. Compliance والامتثال

### 6.1 في Concur

- **Policy Violations** — كشف التجاوزات تلقائياً
- **Audit Rules** — قواعد تدقيق مخصصة
- **Receipt Audit** — مراجعة الإيصالات بالـ AI
- **GDPR Compliance** — إدارة بيانات الموظفين
- **Tax Compliance** — ضريبة القيمة المضافة على المصروفيات

### 6.2 في Fieldglass

- **Co-Employment Risk** — تجنب مخاطر التوظيف المزدوج
- **Worker Classification** — تصنيف العمال الصحيح
- **Background Checks** — التحقق من الخلفية
- **Certification Tracking** — متابعة الشهادات المطلوبة
- **Insurance Verification** — التأكد من تأمين المورد

---

## 7. تقارير ومؤشرات الأداء

### 7.1 Concur KPIs

| المؤشر | الوصف | الهدف |
|--------|-------|-------|
| Expense Report Cycle Time | وقت معالجة التقرير | < 5 أيام |
| Policy Compliance Rate | الالتزام بالسياسة | > 90% |
| Mobile Adoption | نسبة استخدام التطبيق | > 80% |
| Receipt Capture Rate | نسبة رفع الإيصالات | > 95% |
| Avg Spend per Trip | متوسط تكلفة الرحلة | يُقارن بالسوق |

### 7.2 Fieldglass KPIs

| المؤشر | الوصف | الهدف |
|--------|-------|-------|
| Time-to-Fill | وقت شغل المنصب الخارجي | < 7 أيام |
| Timesheet Approval Rate | نسبة الجداول المعتمدة في الموعد | > 95% |
| Vendor Performance | أداء وكالات التوظيف | تقييم ربعي |
| Contractor Tenure | مدة بقاء المتعاقد | حسب السياسة |
| Contingent Spend Visibility | نسبة الإنفاق المرئي | > 95% |

---

## 8. أفضل الممارسات في المشاريع السحابية

```
✅ Concur: فعّل Corporate Card Integration لتقليل الإدخال اليدوي
✅ Concur: استخدم OCR في الموبايل لكل الإيصالات
✅ Concur: اربط سياسة السفر بحجوزات Concur Travel تلقائياً
✅ Concur: ادمج مع SAP FI عبر Integration Suite
✅ Fieldglass: أنشئ Vendor Network قبل بدء أول طلب توظيف
✅ Fieldglass: فعّل Co-Employment Controls للامتثال القانوني
✅ كليهما: اربطهما بـ SAP Analytics Cloud لتقارير موحدة
```

---

*آخر تحديث: 2025 | المرجع: SAP Concur Documentation | SAP Fieldglass Help Portal*
