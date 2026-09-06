import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import PreflightGauge from "@/components/preflight/PreflightGauge";
import PreflightDimensionCard from "@/components/preflight/PreflightDimensionCard";
import { Loader2, RefreshCw, Rocket, AlertTriangle, CheckCircle2, XCircle, Activity } from "lucide-react";

export default function AdminPreflight() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const runAudit = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("systemPreflight", {});
      setReport(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setRunning(false);
  }, []);

  useEffect(() => { runAudit(); }, [runAudit]);

  const criticalDims = report?.dimensions?.filter(d => d.status === "critical") || [];
  const warningDims = report?.dimensions?.filter(d => d.status === "warning") || [];
  const healthyDims = report?.dimensions?.filter(d => d.status === "healthy") || [];
  const go = report?.go_no_go === "GO";

  if (loading || (!report && !error)) {
    return <div className="grid h-full place-items-center"><Loader2 className="h-8 w-8 animate-spin text-black/30" /></div>;
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0c0d0e] p-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-[#e4b653]" />
            <h2 className="font-display text-xl font-light">System Pre-Flight Audit</h2>
          </div>
          <p className="mt-1 text-xs text-white/50">End-to-end forensic audit · 20 dimensions · {report ? new Date(report.run_at).toLocaleString() : ""}</p>
        </div>
        <button
          onClick={runAudit}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-sm bg-[#e4b653] px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] text-black disabled:opacity-50"
        >
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} {running ? "Auditing…" : "Re-Run Audit"}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {report && (
        <>
          {/* GO / NO-GO banner */}
          <div className={`mt-5 flex items-center gap-4 rounded-sm border p-5 ${go ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/40 bg-red-500/10"}`}>
            {go ? <CheckCircle2 className="h-10 w-10 text-emerald-400" /> : <XCircle className="h-10 w-10 text-red-400" />}
            <div className="flex-1">
              <p className={`font-display text-3xl font-light ${go ? "text-emerald-300" : "text-red-300"}`}>{report.go_no_go}</p>
              <p className="text-xs text-white/60">
                {go ? "All systems pass pre-flight — autonomous operations cleared for launch." : `${criticalDims.length} critical dimension(s) blocking autonomous operations.`}
              </p>
            </div>
            <PreflightGauge score={report.overall_score} size={120} />
          </div>

          {/* Summary stats */}
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[
              { label: "Healthy", value: healthyDims.length, color: "text-emerald-400", icon: CheckCircle2 },
              { label: "Warning", value: warningDims.length, color: "text-amber-400", icon: AlertTriangle },
              { label: "Critical", value: criticalDims.length, color: "text-red-400", icon: XCircle },
              { label: "Findings", value: report.summary.total_findings, color: "text-[#e4b653]", icon: Activity },
            ].map(s => (
              <div key={s.label} className="rounded-sm border border-white/10 bg-white/[0.03] p-4">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <p className={`mt-2 font-display text-2xl font-light ${s.color}`}>{s.value}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/40">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Critical findings */}
          {report.critical_findings?.length > 0 && (
            <div className="mt-5 rounded-sm border border-red-500/30 bg-red-500/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-red-300">Critical Findings</p>
              <div className="mt-2 space-y-2">
                {report.critical_findings.map((f, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-red-200">{f.finding}</p>
                      <p className="text-white/50 mt-0.5"><span className="font-semibold">Fix:</span> {f.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System metrics */}
          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">System Inventory</p>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {Object.entries(report.metrics || {}).map(([k, v]) => (
                <div key={k} className="rounded-sm border border-white/10 bg-white/[0.03] px-3 py-2">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-white/40">{k.replace(/_/g, " ")}</p>
                  <p className="text-sm font-medium text-white/80">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dimension grid */}
          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Dimension Audit · {report.dimensions.length} systems</p>
            <div className="mt-2 grid gap-2 lg:grid-cols-2">
              {report.dimensions.map(d => (
                <PreflightDimensionCard key={d.dimension} dim={d} />
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-[9px] text-white/30">Preflight audit completed in {report.elapsed_ms}ms · {new Date(report.run_at).toISOString()}</p>
        </>
      )}
    </div>
  );
}