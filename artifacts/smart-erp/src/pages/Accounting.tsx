import React from "react";
import { apiFetch } from "../lib/api";

type Account = { id: number; code: string; name: string; type: string; nature: string; balance: string };

export function Accounting() {
  const [rows, setRows] = React.useState<Account[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiFetch<Account[]>("/api/accounts");
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "حدث خطأ");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (err) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{err}</div>;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-lg font-black text-slate-900">المحاسبة</div>
      <div className="mt-3 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-3 py-2 text-start text-xs text-slate-400">الكود</th>
              <th className="px-3 py-2 text-start text-xs text-slate-400">الحساب</th>
              <th className="px-3 py-2 text-start text-xs text-slate-400">النوع</th>
              <th className="px-3 py-2 text-start text-xs text-slate-400">الطبيعة</th>
              <th className="px-3 py-2 text-start text-xs text-slate-400">الرصيد</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="px-3 py-2 font-semibold">{a.code}</td>
                <td className="px-3 py-2">{a.name}</td>
                <td className="px-3 py-2">{a.type}</td>
                <td className="px-3 py-2">{a.nature}</td>
                <td className="px-3 py-2">{Number(a.balance ?? 0).toLocaleString("ar-EG")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

