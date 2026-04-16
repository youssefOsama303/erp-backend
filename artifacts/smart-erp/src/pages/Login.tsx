import React from "react";
import { apiFetch, ApiError } from "../lib/api";
import { setAuth } from "../lib/auth";
import { getLang, setLang, t } from "../lib/i18n";
import { Logo } from "../components/Logo";

type LoginResponse = {
  token: string;
  user: { id: string; name: string; email: string; role: string };
};

export function Login({ onDone }: { onDone: () => void }) {
  const [lang, setLangState] = React.useState(() => getLang());
  const [email, setEmail] = React.useState("admin@erp.sa");
  const [password, setPassword] = React.useState("admin123");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLang(lang);
  }, [lang]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuth(res.token, res.user as any);
      onDone();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError(t(lang, "invalidCreds"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 overflow-hidden lg:grid-cols-5">
        <div className="order-2 flex items-center justify-center p-6 lg:order-1 lg:col-span-3">
          <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Logo className="h-10 w-10" />
                <div>
                  <div className="text-base font-black text-slate-900">{t(lang, "appName")}</div>
                  <div className="text-xs text-slate-500">{t(lang, "login")}</div>
                </div>
              </div>

              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                value={lang}
                onChange={(e) => setLangState(e.target.value === "en" ? "en" : "ar")}
                aria-label={t(lang, "language")}
              >
                <option value="ar">AR</option>
                <option value="en">EN</option>
              </select>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t(lang, "email")}</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t(lang, "password")}</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                  {error}
                </div>
              ) : null}

              <button
                disabled={loading}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #2563EB 0%, #1e40af 100%)" }}
              >
                {loading ? "..." : t(lang, "signIn")}
              </button>
            </div>
          </form>
        </div>

        <div
          className="order-1 flex items-center justify-center p-8 text-white lg:order-2 lg:col-span-2"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #1e40af 100%)" }}
        >
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <Logo className="h-12 w-12" />
              <div className="text-lg font-black">{t(lang, "appName")}</div>
            </div>
            <div className="mt-3 text-sm text-white/80">
              واجهة عربية RTL حديثة + صلاحيات + تقارير + مخازن + محاسبة.
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                ["99.9%", "Uptime"],
                ["500+", "Companies"],
                ["24/7", "Support"],
              ].map(([v, k]) => (
                <div key={k} className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                  <div className="text-xl font-black">{v}</div>
                  <div className="text-xs text-white/70">{k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

