import React from "react";
import { apiFetch } from "../lib/api";

type Employee = { id: number; code: string; name: string; job_title?: string; status?: string };

export function HR() {
  const [rows, setRows] = React.useState<Employee[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiFetch<Employee[]>("/api/hr/employees");
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
      <div className="text-lg font-black text-slate-900">الموارد البشرية</div>
      <div className="mt-3 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-3 py-2 text-start text-xs text-slate-400">الكود</th>
              <th className="px-3 py-2 text-start text-xs text-slate-400">الاسم</th>
              <th className="px-3 py-2 text-start text-xs text-slate-400">الوظيفة</th>
              <th className="px-3 py-2 text-start text-xs text-slate-400">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((e) => (
              <tr key={e.id}>
                <td className="px-3 py-2 font-semibold">{e.code}</td>
                <td className="px-3 py-2">{e.name}</td>
                <td className="px-3 py-2">{e.job_title ?? "-"}</td>
                <td className="px-3 py-2">{e.status ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

