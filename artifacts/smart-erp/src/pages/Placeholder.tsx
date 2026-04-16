import React from "react";

export function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-lg font-black text-slate-900">{title}</div>
      <div className="mt-2 text-sm text-slate-500">قريباً… (تم تجهيز صفحة مبدئية للربط مع الـ API)</div>
    </div>
  );
}

