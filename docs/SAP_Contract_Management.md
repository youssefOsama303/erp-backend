# SAP Contract Management — إدارة العقود

## 1. نظرة عامة

تمتد إدارة العقود في منظومة SAP عبر وحدتين رئيسيتين: **SAP SD** للعقود البيعية مع العملاء، و**SAP MM / Ariba** للعقود الشرائية مع الموردين. تُوفّر SAP CLM (Contract Lifecycle Management) — المتكاملة مع SAP Ariba — منصة موحدة لإدارة دورة حياة العقد بالكامل: من التفاوض والتأليف حتى الانتهاء والتجديد.

---

## 2. أنواع العقود في SAP

### 2.1 العقود الشرائية (Purchasing Contracts — MM/Ariba)

| النوع | الكود | الوصف |
|-------|-------|-------|
| Quantity Contract | MK | كمية إجمالية متفق عليها |
| Value Contract | WK | قيمة إجمالية متفق عليها |
| Scheduling Agreement | LP | جداول تسليم دورية محددة |
| Framework Order | FO | إطار عام بدون كميات محددة |

### 2.2 العقود البيعية (Sales Contracts — SD)

| النوع | الكود | الوصف |
|-------|-------|-------|
| Quantity Contract | QC | كمية محددة للعميل على مدة |
| Value Contract | VC | قيمة محددة للعميل |
| Service Contract | SC | عقود خدمات دورية |
| Maintenance Contract | WV | عقود صيانة مربوطة بأصول |

---

## 3. دورة حياة العقد (Contract Lifecycle)

```
الطلب والتفاوض
        ↓
تأليف العقد (Authoring — قوالب موحدة)
        ↓
المراجعة والاعتماد (Review & Approval Workflow)
        ↓
التوقيع (E-Signature / DocuSign Integration)
        ↓
تفعيل العقد (Contract Activation)
        ↓
تنفيذ الطلبات (Release Orders)
        ↓
متابعة الاستهلاك (Consumption Tracking)
        ↓
التجديد أو الإنهاء (Renewal / Termination)
```

---

## 4. SAP Ariba Contract Management

### 4.1 المزايا الرئيسية

- **Contract Repository** — مستودع مركزي لجميع العقود
- **Clause Library** — مكتبة بنود قانونية معتمدة
- **Template Management** — قوالب عقود موحدة
- **Obligation Tracking** — تتبع الالتزامات التعاقدية
- **Compliance Monitoring** — مراقبة الامتثال للشروط
- **Spend vs Contract** — مقارنة الإنفاق الفعلي بالمتعاقد عليه

### 4.2 سير العمل في Ariba Contracts

```
إنشاء طلب العقد (Contract Request)
        ↓
اختيار القالب والبنود (Template Selection)
        ↓
مفاوضة العقد (Negotiation — Track Changes)
        ↓
سير عمل الاعتماد (Approval Workflow)
        ↓
التوقيع الإلكتروني
        ↓
نشر العقد (Publish to SAP S/4HANA)
        ↓
إصدار أوامر الشراء من العقد (Release POs)
```

---

## 5. العقود الشرائية في SAP MM

### 5.1 Scheduling Agreement (اتفاقية الجدولة)

```
اتفاقية جدولة مع المورد
        ↓
خطوط جدولة (Schedule Lines)
   ├── تاريخ التسليم: 01/01
   ├── الكمية: 1000 وحدة
   ├── تاريخ التسليم: 01/02
   └── الكمية: 1500 وحدة
        ↓
إرسال فوري أو دوري (SA Release)
        ↓
استلام البضاعة وتسوية الفاتورة
```

### 5.2 العقد الإطاري (Blanket Purchase Order)

- **Item Category B** — لا كمية محددة، فقط سقف مالي
- **Goods Receipt Optional** — استلام أو فاتورة مباشرة
- **Time Limit** — يصلح لفترة محددة (سنة مالية)
- **Open PO Report** — متابعة الرصيد المتبقي

---

## 6. متابعة الاستهلاك

### 6.1 Contract Release Orders

```
عقد إطاري (Blanket Contract)
   الكمية/القيمة المتعاقدة: 100,000 SAR
        ↓
طلب شراء من العقد (Release PO #1): 20,000
طلب شراء من العقد (Release PO #2): 35,000
        ↓
المتبقي: 45,000 SAR
تنبيه عند: الوصول لـ 90%
```

### 6.2 التقارير الحيوية

| التقرير | الوصف |
|---------|-------|
| Contract Utilization | نسبة استهلاك كل عقد |
| Contracts Expiring Soon | عقود تنتهي قريباً |
| Off-Contract Spend | مشتريات خارج العقود |
| Supplier Contract Coverage | نسبة الإنفاق المغطى بعقود |
| Obligation Summary | ملخص الالتزامات التعاقدية |

---

## 7. التنبيهات والإشعارات التلقائية

| الحدث | الإشعار |
|-------|---------|
| انتهاء العقد خلال 60 يوماً | بريد تلقائي لمدير المشتريات |
| الوصول لـ 80% من القيمة | تنبيه لإعادة التفاوض |
| انتهاء الصلاحية دون تجديد | تجميد الطلبات من العقد |
| مخالفة شروط التسليم | إشعار لفريق الامتثال |

---

## 8. إدارة التجديد (Renewal Management)

```
قبل الانتهاء بـ 90 يوماً:
   ↓ إشعار تلقائي لفريق المشتريات
   ↓ مراجعة الأداء (KPIs)
   ↓ قرار: تجديد / تعديل / إنهاء
        ↓ تجديد
إنشاء عقد جديد من القديم (Clone)
   ↓ تحديث الشروط
   ↓ اعتماد مُختصر (Fast Track)
   ↓ تفعيل العقد الجديد
```

---

## 9. التكامل مع مكونات SAP

```
SAP Ariba Sourcing → تفاوض وترسية → Ariba Contracts
SAP Ariba Contracts → نشر → SAP S/4HANA MM (Outline Agreement)
SAP S/4HANA MM → أوامر شراء من العقد
SAP FI → تسجيل الالتزامات (Commitments)
SAP Analytics Cloud → تقارير الاستهلاك والامتثال
```

---

## 10. الامتثال والحوكمة

### 10.1 ضوابط العقود

- **Mandatory Clauses** — بنود إلزامية (GDPR, Sustainability)
- **Approval Matrix** — اعتماد حسب قيمة وطبيعة العقد
- **Audit Trail** — سجل كامل للتعديلات
- **Digital Signatures** — توقيع إلكتروني معتمد

### 10.2 مؤشرات الأداء

| المؤشر | الهدف |
|--------|-------|
| Contract Coverage % | > 90% من الإنفاق |
| Contracts Renewed On Time | > 95% |
| Off-Contract Spend | < 5% |
| Contract Cycle Time | < 10 أيام |

---

## 11. الاستخدام في المشاريع السحابية

```
✅ بناء مكتبة بنود موحدة في Ariba (Clause Library)
✅ إنشاء قوالب عقود لكل نوع من المشتريات
✅ ربط العقود بـ Supplier Qualification (Ariba SLP)
✅ تفعيل e-Signature (DocuSign / SAP Sign)
✅ نشر Contract Analytics على SAP Analytics Cloud
✅ إعداد تنبيهات التجديد مسبقاً بـ 90/60/30 يوماً
```

---

*آخر تحديث: 2025 | المرجع: SAP Help Portal — Ariba CLM / SAP MM Contracts*
