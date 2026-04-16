# SAP GRC — الحوكمة وإدارة المخاطر والامتثال

## 1. نظرة عامة

SAP GRC (Governance, Risk & Compliance) منصة متكاملة تُمكّن المؤسسات من إدارة المخاطر، ضبط الصلاحيات، وضمان الامتثال للوائح التنظيمية (SOX، GDPR، ISO 27001...) بطريقة مؤتمتة ومدمجة مع SAP S/4HANA.

---

## 2. مكونات SAP GRC الأربعة

```
┌─────────────────────────────────────────────────┐
│              SAP GRC Suite                       │
├──────────────┬──────────────┬────────────────────┤
│ Access Control│Process Control│  Risk Management  │
│  (AC)        │   (PC)       │     (RM)          │
│              │              │                    │
│ إدارة        │ ضوابط        │ سجل               │
│ الصلاحيات   │ العمليات     │ المخاطر            │
└──────────────┴──────────────┴────────────────────┘
                      │
              ┌────────▼────────┐
              │  Audit Management│
              │  إدارة التدقيق   │
              └─────────────────┘
```

---

## 3. SAP GRC Access Control (AC) — إدارة الصلاحيات

### 3.1 المشاكل التي يحلها

- **Segregation of Duties (SoD)** — تعارض الصلاحيات (مثل: صلاحية إنشاء مورد + اعتماد فاتورة لنفس الشخص)
- **Excessive Access** — صلاحيات زائدة عن الحاجة
- **Orphaned Accounts** — حسابات موظفين مغادرين
- **Emergency Access** — وصول الطوارئ غير المراقب

### 3.2 طلبات الوصول (Access Request Management)

```
الموظف / المدير يطلب صلاحية
        ↓
SAP GRC يفحص: هل يوجد تعارض SoD؟
        ↓ لا تعارض
سير عمل الاعتماد (Approval Workflow)
  ├── مدير الموظف
  ├── مالك التطبيق (Application Owner)
  └── فريق الامتثال (إذا لزم)
        ↓
تفعيل الصلاحية في SAP
        ↓
مراجعة دورية (Access Review — كل 6 أشهر)
```

### 3.3 تحليل SoD (Segregation of Duties)

| مثال على التعارض | الخطر | الحل |
|-----------------|-------|------|
| إنشاء مورد + اعتماد فاتورة | احتيال | فصل الصلاحيتين |
| إنشاء موظف + صرف راتب | تلاعب بالرواتب | مراقب إضافي |
| تعديل سعر + إنشاء طلب شراء | تضارب مصالح | Mitigating Control |
| صلاحية كاملة F_BKPF_BUK | وصول غير محدود | تقييد بمركز تكلفة |

### 3.4 Firefighter (Emergency Access)

```
موظف يحتاج وصولاً طارئاً
        ↓
طلب Firefighter ID
        ↓
اعتماد المشرف (خلال دقائق)
        ↓
تفعيل الوصول المؤقت (محدود المدة)
        ↓
تسجيل كامل لكل أمر تم تنفيذه
        ↓
مراجعة السجل من مالك الـ Firefighter ID
```

---

## 4. SAP GRC Process Control (PC) — ضوابط العمليات

### 4.1 المفهوم

Process Control يُحوّل ضوابط التدقيق الداخلي من عملية يدوية (ورقية) إلى ضوابط مؤتمتة مدمجة مباشرة في SAP.

### 4.2 أنواع الضوابط

| النوع | الوصف | مثال |
|-------|-------|------|
| Automated Control | ضابط تلقائي في النظام | 3-Way Match في AP |
| Manual Control | ضابط بشري موثق | توقيع مدير على تقرير |
| Monitoring Control | رصد مستمر | تنبيه عند تجاوز حد ائتمان |
| Preventive Control | يمنع الخطأ قبل حدوثه | حقل إلزامي في النموذج |
| Detective Control | يكتشف الخطأ بعد حدوثه | تقرير المراجعة الشهري |

### 4.3 هيكل الامتثال في Process Control

```
Framework (إطار الامتثال — مثل COSO)
    └── Organization (وحدة الأعمال)
           └── Process (العملية — مثل AP)
                  └── Sub-Process (العملية الفرعية)
                         └── Control (الضابط)
                                └── Test (الاختبار الدوري)
```

### 4.4 اللوائح المدعومة

| اللائحة | المجال | المتطلبات الرئيسية |
|---------|--------|------------------|
| SOX (Sarbanes-Oxley) | شركات مدرجة أمريكية | ضوابط التقارير المالية |
| GDPR | حماية البيانات الأوروبية | خصوصية البيانات الشخصية |
| ISO 27001 | أمن المعلومات | ضوابط أمن تقنية المعلومات |
| Basel III | البنوك والمالية | إدارة المخاطر المصرفية |
| IFRS | المعايير الدولية | التقارير المالية |

---

## 5. SAP GRC Risk Management (RM) — إدارة المخاطر

### 5.1 دورة إدارة المخاطر

```
تحديد المخاطر (Risk Identification)
        ↓
تقييم المخاطر (Risk Assessment)
  ├── Likelihood (الاحتمالية): 1-5
  └── Impact (الأثر): 1-5
        ↓
Risk Score = Likelihood × Impact
        ↓
خريطة المخاطر (Heat Map)
        ↓
المعالجة (Risk Treatment)
  ├── Accept (قبول)
  ├── Mitigate (تخفيف)
  ├── Transfer (نقل — تأمين)
  └── Avoid (تجنب)
        ↓
المراقبة الدورية (Monitoring)
```

### 5.2 خريطة المخاطر (Heat Map)

```
الأثر
5 │  ○  ●  ●  ■  ■
4 │  ○  ○  ●  ■  ■
3 │  ○  ○  ○  ●  ■
2 │  ○  ○  ○  ○  ●
1 │  ○  ○  ○  ○  ○
  └─────────────────
     1   2   3   4   5
         الاحتمالية

■ مخاطر حرجة    ● مخاطر عالية    ○ مخاطر منخفضة
```

### 5.3 سجل المخاطر (Risk Register)

| حقل | الوصف |
|-----|-------|
| Risk ID | رمز فريد للخطر |
| Risk Category | مالي / تشغيلي / تقني / امتثال |
| Risk Owner | مالك الخطر المسؤول |
| Inherent Risk | المخاطرة قبل الضوابط |
| Residual Risk | المخاطرة بعد الضوابط |
| Control Link | الضوابط المرتبطة |
| Review Date | موعد المراجعة القادمة |

---

## 6. Audit Management — إدارة التدقيق

### 6.1 دورة التدقيق الداخلي

```
خطة التدقيق السنوية (Audit Universe)
        ↓
تحديد نطاق التدقيق (Scope)
        ↓
إرسال إشعار للجهة المُدقَّقة
        ↓
جمع الأدلة (Evidence Collection)
        ↓
اختبار الضوابط (Control Testing)
        ↓
النتائج والملاحظات (Findings)
        ↓
تقرير التدقيق (Audit Report)
        ↓
خطة التصحيح (Corrective Action Plan — CAP)
        ↓
متابعة تنفيذ CAP
```

### 6.2 أنواع التدقيق

| النوع | الوصف |
|-------|-------|
| Financial Audit | تدقيق القوائم المالية |
| Operational Audit | تدقيق كفاءة العمليات |
| Compliance Audit | تدقيق الالتزام باللوائح |
| IT Audit | تدقيق أمن المعلومات |
| Fraud Investigation | التحقيق في الاحتيال |

---

## 7. التكامل مع SAP S/4HANA

```
SAP S/4HANA (FI/MM/SD)
        ↓
SAP GRC Access Control ← يتحكم في الصلاحيات
        ↓
SAP GRC Process Control ← يراقب العمليات تلقائياً
        ↓
SAP GRC Risk Management ← يُقيّم المخاطر
        ↓
SAP GRC Audit Management ← يُنشئ خطة التدقيق
        ↓
SAP Analytics Cloud ← تقارير GRC للإدارة العليا
```

---

## 8. مؤشرات الأداء

| المؤشر | الهدف |
|--------|-------|
| SoD Violations | صفر تعارض غير معالج |
| Open Audit Findings | < 30 يوماً للإغلاق |
| Control Effectiveness | > 95% |
| Access Review Completion | 100% في الموعد |
| Residual Risk (High) | < 5% من إجمالي المخاطر |
| Firefighter Log Review | 100% مراجعة خلال 48 ساعة |

---

## 9. الاستخدام في المشاريع السحابية

```
✅ بناء SoD Rule Set قبل منح أي صلاحيات للمستخدمين
✅ تفعيل Automated Controls في عمليات AP و AR
✅ إنشاء Risk Register شامل في مرحلة التصميم
✅ ربط GRC Findings بخطط المشروع لمتابعة الإغلاق
✅ تقارير GRC Dashboard على SAP Analytics Cloud للإدارة
✅ تكامل GRC مع SAP Identity Authentication (IAS)
✅ إجراء SoD Analysis قبل كل Go-Live
```

---

*آخر تحديث: 2025 | المرجع: SAP Help Portal — GRC 12.0 | SAP S/4HANA Security Guide*
