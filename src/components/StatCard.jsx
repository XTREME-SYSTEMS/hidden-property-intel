import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ label, value, trend, hint }) {
  const up = typeof trend === "number" && trend >= 0;
  return (
    <div className="rounded-2xl bg-white ring-1 ring-[#E5EDEA] p-5">
      <p className="text-[11px] uppercase tracking-widest text-[#6B7B72]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-[#1A2B22]">{value}</p>
      {typeof trend === "number" && (
        <p className={`mt-1 flex items-center gap-1 text-xs tabular-nums ${up ? "text-emerald-600" : "text-red-500"}`}>
          {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {up ? "+" : ""}{trend}%
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-[#6B7B72]">{hint}</p>}
    </div>
  );
}