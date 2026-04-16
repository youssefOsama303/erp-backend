import React from "react";
import { apiFetch } from "../lib/api";

type Product = { id: number; code: string; name: string; sale_price?: string; total_qty?: string };
type WarehouseRow = { id: number; code: string; name: string; location?: string };

export function Warehouse() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [warehouses, setWarehouses] = React.useState<WarehouseRow[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [p, w] = await Promise.all([
          apiFetch<Product[]>("/api/warehouse/products"),
          apiFetch<WarehouseRow[]>("/api/warehouse/warehouses"),
        ]);
        if (!alive) return;
        setProducts(Array.isArray(p) ? p : []);
        setWarehouses(Array.isArray(w) ? w : []);
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
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-lg font-black text-slate-900">المنتجات</div>
        <div className="mt-3 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2 text-start text-xs text-slate-400">الكود</th>
                <th className="px-3 py-2 text-start text-xs text-slate-400">الاسم</th>
                <th className="px-3 py-2 text-start text-xs text-slate-400">السعر</th>
                <th className="px-3 py-2 text-start text-xs text-slate-400">المخزون</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.slice(0, 20).map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 font-semibold">{p.code}</td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">{Number(p.sale_price ?? 0).toLocaleString("ar-EG")}</td>
                  <td className="px-3 py-2">{Number(p.total_qty ?? 0).toLocaleString("ar-EG")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-lg font-black text-slate-900">المستودعات</div>
        <div className="mt-3 space-y-2">
          {warehouses.map((w) => (
            <div key={w.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="font-black text-slate-900">{w.name}</div>
              <div className="text-xs text-slate-500">{w.code} · {w.location ?? "-"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

