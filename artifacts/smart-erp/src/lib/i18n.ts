export type Lang = "ar" | "en";

const ar = {
  appName: "NEXUS ERP Enterprise Suite",
  login: "تسجيل الدخول",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  signIn: "دخول",
  invalidCreds: "بيانات غير صحيحة",
  dashboard: "لوحة التحكم",
  invoices: "الفواتير",
  warehouse: "المخازن",
  hr: "الموارد البشرية",
  accounting: "المحاسبة",
  logout: "تسجيل الخروج",
  language: "اللغة",
};

const en: typeof ar = {
  appName: "NEXUS ERP Enterprise Suite",
  login: "Sign in",
  email: "Email",
  password: "Password",
  signIn: "Sign in",
  invalidCreds: "Invalid credentials",
  dashboard: "Dashboard",
  invoices: "Invoices",
  warehouse: "Warehouse",
  hr: "HR",
  accounting: "Accounting",
  logout: "Logout",
  language: "Language",
};

const dict = { ar, en } as const;

export function getLang(): Lang {
  const raw = localStorage.getItem("erp_lang");
  return raw === "en" ? "en" : "ar";
}

export function setLang(lang: Lang) {
  localStorage.setItem("erp_lang", lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

export function t(lang: Lang, key: keyof typeof ar): string {
  return dict[lang][key];
}

