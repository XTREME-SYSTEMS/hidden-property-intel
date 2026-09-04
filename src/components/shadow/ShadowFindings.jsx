import React from "react";
import { AlertTriangle, CheckCircle2, Info, Wrench } from "lucide-react";

const SEVERITY_STYLE = {
  critical: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: AlertTriangle },
  high: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: AlertTriangle },
  medium: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: Info },
  low: { color: "text-black/50", bg: "bg-black/5", border: "border-black/10", icon: Info },
  info: { color: "text-black/50", bg: "bg-black/5", border: "border-black/10", icon: Info },
};

export default function ShadowFindings({ findings, actions }) {
  return (
    <div className="space-y-6">
      {actions?.length > 0 && (
        <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-emerald-600" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-700">Auto-Healing Actions ({actions.length})</p>
          </div>
          <ul className="mt-2 space-y-1">
            {actions.map((a, i) => (
              <li key={i} className="flex gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-black/40">Audit Findings ({findings?.length || 0})</p>
        {findings?.length === 0 ? (
          <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="mt-2 text-sm text-emerald-700">All clear — no issues found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {findings.map((f, i) => {
              const style = SEVERITY_STYLE[f.severity] || SEVERITY_STYLE.medium;
              const Icon = style.icon;
              return (
                <div key={i} className={`flex items-start gap-3 rounded-sm border ${style.border} ${style.bg} p-3`}>
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.color}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] uppercase tracking-[0.2em] ${style.color}`}>{f.severity}</span>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-black/30">· {f.dimension}</span>
                      {f.auto_healed && <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-white">Healed</span>}
                    </div>
                    <p className="mt-1 text-xs font-medium text-black/80">{f.finding}</p>
                    <p className="mt-0.5 text-xs text-black/50">→ {f.action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}