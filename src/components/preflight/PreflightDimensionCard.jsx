import React, { useState } from "react";
import { ChevronDown, AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";

const STATUS_COLOR = {
  healthy: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  critical: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },
};

const SEV_ICON = {
  critical: AlertCircle,
  high: AlertTriangle,
  medium: Info,
  low: Info,
  info: CheckCircle2,
};

const SEV_COLOR = {
  critical: "text-red-600 bg-red-100",
  high: "text-amber-600 bg-amber-100",
  medium: "text-blue-600 bg-blue-100",
  low: "text-black/50 bg-black/5",
  info: "text-emerald-600 bg-emerald-100",
};

const LABELS = {
  vision_strategy: "Vision & Strategy", sources_seeds: "Sources & Seeds",
  data_acquisition: "Data Acquisition", scraping_engine: "Scraping Engine",
  normalization: "Normalization", data_enrichment: "Data Enrichment",
  images: "Images", cleaning: "Cleaning", analyzing: "Analyzing",
  auditing: "Auditing", archiving: "Archiving", organizing: "Organizing",
  storage: "Storage", security: "Security", validation: "Validation",
  smart_contracts: "Smart Contracts", ai_systems: "AI Systems",
  integrations: "Integrations", financial_health: "Financial Health",
  frontend: "Frontend",
};

export default function PreflightDimensionCard({ dim }) {
  const [open, setOpen] = useState(false);
  const c = STATUS_COLOR[dim.status];
  const label = LABELS[dim.dimension] || dim.dimension;
  const findings = dim.findings || [];
  const metricEntries = Object.entries(dim.metrics || {}).filter(([, v]) => v !== null && v !== undefined);

  return (
    <div className={`rounded-sm border ${c.border} ${c.bg} overflow-hidden transition`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full ${c.dot}`} />
          <div>
            <p className="text-xs font-semibold text-black/80">{label}</p>
            <p className="text-[9px] uppercase tracking-[0.15em] text-black/40">{dim.status} · {findings.length} finding{findings.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-display text-xl font-light ${c.text}`}>{dim.score}</span>
          <ChevronDown className={`h-4 w-4 text-black/30 transition ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="border-t border-black/10 bg-white px-4 py-3">
          {metricEntries.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-1.5">
              {metricEntries.map(([k, v]) => (
                <div key={k} className="rounded-sm border border-black/5 bg-black/[0.02] px-2 py-1.5">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-black/40">{k.replace(/_/g, " ")}</p>
                  <p className="text-xs font-medium text-black/70">{typeof v === "boolean" ? (v ? "✓" : "✗") : String(v)}</p>
                </div>
              ))}
            </div>
          )}
          {findings.length === 0 ? (
            <p className="text-[11px] text-emerald-600">✓ No issues detected.</p>
          ) : (
            <div className="space-y-2">
              {findings.map((f, i) => {
                const Icon = SEV_ICON[f.severity] || Info;
                return (
                  <div key={i} className="flex gap-2 rounded-sm border border-black/5 p-2">
                    <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${SEV_COLOR[f.severity]?.split(" ")[0] || "text-black/40"}`} />
                    <div>
                      <p className="text-[11px] text-black/70">{f.finding}</p>
                      <p className="text-[10px] text-black/50 mt-0.5"><span className="font-semibold">Fix:</span> {f.recommendation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}