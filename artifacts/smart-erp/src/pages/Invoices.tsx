import React from "react";
import { apiFetch } from "../lib/api";

type InvoiceRow = {
  id: number;
  invoice_number: string;
  customer_name: string;
  date: string;
  total: string;
  status: string;
};

export function Invoices() {
  const [rows, setRows] = React.useState<InvoiceRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch<InvoiceRow[]>("/api/invoices?limit=50&page=1");
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-lg font-black text-slate-900">الفواتير</div>
        <a className="text-sm font-semibold text-blue-700 hover:underline" href="/api/invoices" target="_blank" rel="noreferrer">
          API
        </a>
      </div>

      <div className="mt-4 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-start text-xs font-semibold text-slate-400">رقم</th>
              <th className="px-4 py-3 text-start text-xs font-semibold text-slate-400">العميل</th>
              <th className="px-4 py-3 text-start text-xs font-semibold text-slate-400">التاريخ</th>
              <th className="px-4 py-3 text-start text-xs font-semibold text-slate-400">الإجمالي</th>
              <th className="px-4 py-3 text-start text-xs font-semibold text-slate-400">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length ? (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-black text-slate-900">{r.invoice_number}</td>
                  <td className="px-4 py-3">{r.customer_name}</td>
                  <td className="px-4 py-3">{new Date(r.date).toLocaleDateString("ar-EG")}</td>
                  <td className="px-4 py-3 font-semibold">{Number(r.total).toLocaleString("ar-EG")}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={5}>
                  لا توجد فواتير حالياً.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

