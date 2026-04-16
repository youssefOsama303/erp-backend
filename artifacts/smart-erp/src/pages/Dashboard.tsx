import React from "react";
import { apiFetch } from "../lib/api";

type DashboardRes = {
  revenue: number;
  expenses: number;
  net_profit: number;
  stock_alerts: Array<{ id: number; code: string; name: string; min_quantity: number; qty: string }>;
  employee_stats: Array<{ status: string; count: string }>;
  pending_leaves: number;
};

type MonthlyRes = {
  revenues: Array<{ month: string; amount: string }>;
  expenses: Array<{ month: string; amount: string }>;
};

export function Dashboard() {
  const [data, setData] = React.useState<DashboardRes | null>(null);
  const [monthly, setMonthly] = React.useState<MonthlyRes | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [d, m] = await Promise.all([
          apiFetch<DashboardRes>("/api/reports/dashboard"),
          apiFetch<MonthlyRes>("/api/reports/monthly"),
        ]);
        if (!alive) return;
        setData(d);
        setMonthly(m);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "حدث خطأ");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <div className="text-sm font-semibold text-slate-600">جار التحميل…</div>;
  if (err) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
        {err}
      </div>
    );
  }

  if (!data) return null;

  const fmt = (n: number) => n.toLocaleString("ar-EG");
  const kpis = [
    { label: "إجمالي المبيعات", value: fmt(data.revenue), sub: "مدفوعة" },
    { label: "إجمالي المصروفات", value: fmt(data.expenses), sub: "مستلم" },
    { label: "صافي الربح", value: fmt(data.net_profit), sub: "تقريبي" },
    { label: "طلبات الإجازات", value: fmt(data.pending_leaves), sub: "معلقة" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-500">{k.label}</div>
            <div className="mt-1 text-2xl font-black text-slate-900">{k.value}</div>
            <div className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-black text-slate-900">تنبيهات المخزون (منخفض)</div>
          <div className="mt-3 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-start text-xs font-semibold text-slate-400">الكود</th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-slate-400">المنتج</th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-slate-400">الكمية</th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-slate-400">الحد الأدنى</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.stock_alerts.length ? (
                  data.stock_alerts.slice(0, 8).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold">{p.code}</td>
                      <td className="px-4 py-3">{p.name}</td>
                      <td className="px-4 py-3 font-black text-rose-700">{Number(p.qty).toLocaleString("ar-EG")}</td>
                      <td className="px-4 py-3">{Number(p.min_quantity).toLocaleString("ar-EG")}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={4}>
                      لا توجد تنبيهات مخزون حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-black text-slate-900">مبيعات/مصروفات شهرياً</div>
          <div className="mt-2 text-xs text-slate-500">عرض JSON مبسّط (سنستبدله بـ Recharts بعد تثبيت التصميم النهائي).</div>
          <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
{JSON.stringify(monthly, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

