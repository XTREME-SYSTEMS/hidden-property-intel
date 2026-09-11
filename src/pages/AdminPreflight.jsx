import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import PreflightGauge from "@/components/preflight/PreflightGauge";
import PreflightDimensionCard from "@/components/preflight/PreflightDimensionCard";
import {
  Loader2, RefreshCw, Rocket, AlertTriangle, CheckCircle2, XCircle, Activity,
  ShieldCheck, Mail, Search, Zap, Database, Wallet, Globe, Cpu, Users,
  FileCheck, Scale, Layout, Sparkles, ChevronDown,
} from "lucide-react";

const CHECKLIST_ICONS = {
  email_system: Mail, browser_engine: Globe, ai_gateway: Cpu, data_sources: Database,
  property_inventory: Database, owner_identification: Search, smart_contracts: Wallet,
  stripe_payments: Wallet, security_audit: ShieldCheck, legal_compliance: Scale,
  frontend_polish: Layout, digital_workforce: Users,
};

export default function AdminPreflight() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [showChecklist, setShowChecklist] = useState(true);

  const runAudit = useCallback(async () => {
    setRunning(true);
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("systemPreflight", {});
      setReport(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
      setRunning(false);
    }
  }, []);

  useEffect(() => { runAudit(); }, [runAudit]);

  const criticalDims = report?.dimensions?.filter(d => d.status === "critical") || [];
  const warningDims = report?.dimensions?.filter(d => d.status === "warning") || [];
  const healthyDims = report?.dimensions?.filter(d => d.status === "healthy") || [];
  const go = report?.go_no_go === "GO";
  const checklist = report?.production_checklist;
  const launchReady = checklist?.production_ready;

  if (loading || (!report && !error)) {
    return <div className="grid h-full place-items-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-[#c38a1b]" /></div>;
  }

  return (
    <div className="min-h-screen bg-white text-[#12110f]">
      {/* Header */}
      <div className="border-b border-[#e7e1d6] bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c38a1b] bg-[#fff8e9]">
              <Rocket className="h-5 w-5 text-[#c38a1b]" />
            </div>
            <div>
              <h2 className="text-xl font-light tracking-wide text-[#12110f]">System Pre-Flight Audit</h2>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#6f6a60]">20 dimensions · Production launch checklist · {report ? new Date(report.run_at).toLocaleString() : ""}</p>
            </div>
          </div>
          <button
            onClick={runAudit}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-[#c38a1b] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#e4b653] disabled:opacity-50"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {running ? "Auditing…" : "Re-Run Audit"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {report && (
          <>
            {/* GO / NO-GO banner */}
            <div className={`flex items-center gap-4 rounded-xl border p-5 ${go ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
              {go ? <CheckCircle2 className="h-10 w-10 text-emerald-600" /> : <XCircle className="h-10 w-10 text-red-600" />}
              <div className="flex-1">
                <p className={`text-2xl font-light ${go ? "text-emerald-700" : "text-red-700"}`}>{report.go_no_go}</p>
                <p className="text-xs text-[#6f6a60]">
                  {go ? "All systems pass pre-flight — autonomous operations cleared." : `${criticalDims.length} critical dimension(s) blocking autonomous operations.`}
                </p>
              </div>
              <PreflightGauge score={report.overall_score} size={120} />
            </div>

            {/* Production Launch Checklist */}
            {checklist && (
              <div className="mt-5 rounded-xl border border-[#e7e1d6] bg-[#f7f5f0]">
                <button
                  onClick={() => setShowChecklist(!showChecklist)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${launchReady ? "bg-emerald-100" : "bg-amber-100"}`}>
                    {launchReady ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <FileCheck className="h-5 w-5 text-amber-600" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#12110f]">Production Launch Checklist</h3>
                    <p className="text-[11px] text-[#6f6a60]">{checklist.pass}/{checklist.total} checks passed · {checklist.fail} failed · {checklist.warning} warnings</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${launchReady ? "bg-emerald-600 text-white" : checklist.fail > 0 ? "bg-red-600 text-white" : "bg-amber-600 text-white"}`}>
                    {checklist.launch_status}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-[#6f6a60] transition ${showChecklist ? "rotate-180" : ""}`} />
                </button>

                {showChecklist && (
                  <div className="grid grid-cols-1 gap-2 border-t border-[#e7e1d6] p-4 lg:grid-cols-2">
                    {checklist.items.map((item) => {
                      const Icon = CHECKLIST_ICONS[item.id] || Activity;
                      const statusColor = item.status === "pass" ? "#247a45" : item.status === "warning" ? "#a6640b" : "#b33a31";
                      return (
                        <div key={item.id} className="flex items-start gap-3 rounded-lg border border-[#e7e1d6] bg-white p-3">
                          <div className="mt-0.5">
                            {item.status === "pass" ? (
                              <CheckCircle2 className="h-5 w-5" style={{ color: statusColor }} />
                            ) : item.status === "warning" ? (
                              <AlertTriangle className="h-5 w-5" style={{ color: statusColor }} />
                            ) : (
                              <XCircle className="h-5 w-5" style={{ color: statusColor }} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5 text-[#6f6a60]" />
                              <p className="text-xs font-semibold text-[#12110f]">{item.label}</p>
                            </div>
                            <p className="mt-1 text-[11px] text-[#6f6a60]">{item.detail}</p>
                            {item.action && (
                              <p className="mt-1 text-[10px] font-medium" style={{ color: statusColor }}>→ {item.action}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Summary stats */}
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[
                { label: "Healthy", value: healthyDims.length, color: "text-emerald-600", icon: CheckCircle2 },
                { label: "Warning", value: warningDims.length, color: "text-amber-600", icon: AlertTriangle },
                { label: "Critical", value: criticalDims.length, color: "text-red-600", icon: XCircle },
                { label: "Findings", value: report.summary.total_findings, color: "text-[#c38a1b]", icon: Activity },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-[#e7e1d6] bg-white p-4">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <p className={`mt-2 text-2xl font-light ${s.color}`}>{s.value}</p>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#6f6a60]">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Critical findings */}
            {report.critical_findings?.length > 0 && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-red-700">Critical Findings</p>
                <div className="mt-2 space-y-2">
                  {report.critical_findings.map((f, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-red-800">{f.finding}</p>
                        <p className="text-[#6f6a60] mt-0.5"><span className="font-semibold">Fix:</span> {f.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System metrics */}
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#6f6a60]">System Inventory</p>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {Object.entries(report.metrics || {}).map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-[#e7e1d6] bg-[#f7f5f0] px-3 py-2">
                    <p className="text-[8px] uppercase tracking-[0.1em] text-[#6f6a60]">{k.replace(/_/g, " ")}</p>
                    <p className="text-sm font-medium text-[#12110f]">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dimension grid */}
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#6f6a60]">Dimension Audit · {report.dimensions.length} systems</p>
              <div className="mt-2 grid gap-2 lg:grid-cols-2">
                {report.dimensions.map(d => (
                  <PreflightDimensionCard key={d.dimension} dim={d} />
                ))}
              </div>
            </div>

            <p className="mt-6 text-center text-[9px] text-[#6f6a60]/70">Preflight audit completed in {report.elapsed_ms}ms · {new Date(report.run_at).toISOString()}</p>
          </>
        )}
      </div>
    </div>
  );
}