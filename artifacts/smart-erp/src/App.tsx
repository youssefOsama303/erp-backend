import React from "react";
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./components/Logo";
import { clearAuth, getUser, ROLE_PERMISSIONS } from "./lib/auth";
import { getLang, setLang, t, type Lang } from "./lib/i18n";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Invoices } from "./pages/Invoices";
import { Warehouse } from "./pages/Warehouse";
import { HR } from "./pages/HR";
import { Accounting } from "./pages/Accounting";

type ModuleKey = "dashboard" | "invoices" | "warehouse" | "hr" | "accounting";

const NAV: Array<{ key: ModuleKey; path: string; labelKey: keyof ReturnType<typeof labels> }> = [
  { key: "dashboard", path: "/dashboard", labelKey: "dashboard" },
  { key: "invoices", path: "/invoices", labelKey: "invoices" },
  { key: "warehouse", path: "/warehouse", labelKey: "warehouse" },
  { key: "hr", path: "/hr", labelKey: "hr" },
  { key: "accounting", path: "/accounting", labelKey: "accounting" },
];

function labels() {
  return {
    dashboard: "dashboard",
    invoices: "invoices",
    warehouse: "warehouse",
    hr: "hr",
    accounting: "accounting",
  } as const;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = getUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

function Shell() {
  const navigate = useNavigate();
  const [langState, setLangState] = React.useState<Lang>(() => getLang());
  const user = getUser();

  React.useEffect(() => {
    setLang(langState);
  }, [langState]);

  const perms = user ? ROLE_PERMISSIONS[user.role] ?? ROLE_PERMISSIONS.user : ROLE_PERMISSIONS.user;
  const nav = NAV.filter((n) => perms.includes(n.key));

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside
          className="hidden lg:flex lg:flex-col"
          style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" }}
        >
          <div className="flex items-center gap-3 px-5 py-5">
            <Logo className="h-10 w-10" />
            <div className="text-sm font-black text-white">{t(langState, "appName")}</div>
          </div>

          <div className="px-3">
            <div className="px-3 py-2 text-xs font-bold tracking-wide text-white/50">القائمة الرئيسية</div>
            <nav className="space-y-1">
              {nav.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.path}
                  className={({ isActive }) =>
                    [
                      "block rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                      isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-white/80 hover:bg-white/10",
                    ].join(" ")
                  }
                >
                  {t(langState, item.labelKey as any)}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="mt-auto border-t border-white/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-white">{user?.name ?? "-"}</div>
                <div className="text-xs font-semibold text-white/60">{user?.role ?? "-"}</div>
              </div>
              <button
                onClick={() => {
                  clearAuth();
                  navigate("/login");
                }}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
              >
                {t(langState, "logout")}
              </button>
            </div>
          </div>
        </aside>

        <main className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="text-sm font-black text-slate-900">{t(langState, "appName")}</div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                  value={langState}
                  onChange={(e) => setLangState(e.target.value === "en" ? "en" : "ar")}
                  aria-label={t(langState, "language")}
                >
                  <option value="ar">AR</option>
                  <option value="en">EN</option>
                </select>
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-6xl flex-1 p-4">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/warehouse" element={<Warehouse />} />
              <Route path="/hr" element={<HR />} />
              <Route path="/accounting" element={<Accounting />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <Login
              onDone={() => {
                window.location.href = "/";
              }}
            />
          }
        />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Shell />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

