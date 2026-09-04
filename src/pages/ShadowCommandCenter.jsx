import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Zap, FileText, Radar, Activity, ChevronRight } from "lucide-react";
import ShadowScoreGauge from "@/components/shadow/ShadowScoreGauge";
import ShadowDimensions from "@/components/shadow/ShadowDimensions";
import ShadowFindings from "@/components/shadow/ShadowFindings";
import ShadowDealHunt from "@/components/shadow/ShadowDealHunt";
import ShadowBrief from "@/components/shadow/ShadowBrief";

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "findings", label: "Audit Findings", icon: Zap },
  { id: "dealhunt", label: "Deal Hunt", icon: Radar },
  { id: "brief", label: "Morning Brief", icon: FileText },
];

export default function ShadowCommandCenter() {
  const [activeTab, setActiveTab] = useState("overview");
  const [orchReport, setOrchReport] = useState(null);
  const [huntReport, setHuntReport] = useState(null);
  const [briefReport, setBriefReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orch, hunt, brief, hist] = await Promise.all([
        base44.entities.ShadowReport.filter({ type: "orchestrator" }, "-created_date", 1),
        base44.entities.ShadowReport.filter({ type: "deal_hunt" }, "-created_date", 1),
        base44.entities.ShadowReport.filter({ type: "brief" }, "-created_date", 1),
        base44.entities.ShadowReport.list("-created_date", 20),
      ]);
      setOrchReport(orch[0] || null);
      setHuntReport(hunt[0] || null);
      setBriefReport(brief[0] || null);
      setHistory(hist || []);
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const runOrchestrator = async () => {
    setRunning("orchestrator");
    try {
      await base44.functions.invoke("shadowOrchestrator", {});
      await load();
    } catch (e) { /* ignore */ }
    setRunning(null);
  };

  const runDealHunt = async () => {
    setRunning("dealhunt");
    try {
      await base44.functions.invoke("shadowDealHunt", {});
      await load();
    } catch (e) { /* ignore */ }
    setRunning(null);
  };

  const runBrief = async () => {
    setRunning("brief");
    try {
      await base44.functions.invoke("generateMorningBrief", {});
      await load();
    } catch (e) { /* ignore */ }
    setRunning(null);
  };

  const runAll = async () => {
    setRunning("all");
    try {
      await base44.functions.invoke("shadowOrchestrator", {});
      await base44.functions.invoke("shadowDealHunt", {});
      await base44.functions.invoke("generateMorningBrief", {});
      await load();
    } catch (e) { /* ignore */ }
    setRunning(null);
  };

  if (loading) return <div className="px-6 py-32 text-center text-sm text-black/50">Loading Shadow Command Center…</div>;

  const score = orchReport?.overall_score || 0;
  const delta = orchReport?.convergence_delta;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Shadow · Autonomous Intelligence</p>
          <h1 className="mt-2 font-display text-4xl font-light tracking-tight sm:text-5xl">Shadow Command Center</h1>
          <p className="mt-2 max-w-2xl text-sm text-black/50">
            The system's autonomous intelligence layer — persistently audits every dimension, self-heals to 100/100,
            hunts for deals, and generates daily intelligence briefs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={runAll} disabled={!!running} className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-2.5 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
            {running === "all" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {running === "all" ? "Running…" : "Run Full Cycle"}
          </button>
        </div>
      </div>

      {/* Score + Quick Actions */}
      <div className="mt-8 grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center rounded-sm border border-black/10 bg-white p-8">
          <ShadowScoreGauge score={score} delta={delta} />
          <p className="mt-3 text-[10px] text-black/40">Last audit: {orchReport?.run_at ? new Date(orchReport.run_at).toLocaleString() : "never"}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <ActionCard icon={Activity} title="Run Audit" desc="Audit all 8 dimensions + self-heal" onClick={runOrchestrator} loading={running === "orchestrator"} />
          <ActionCard icon={Radar} title="Deal Hunt" desc="AI web-search for FL opportunities" onClick={runDealHunt} loading={running === "dealhunt"} />
          <ActionCard icon={FileText} title="Morning Brief" desc="Generate AI intelligence brief" onClick={runBrief} loading={running === "brief"} />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10 flex gap-1 border-b border-black/10">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-medium transition ${
              activeTab === t.id ? "border-black text-black" : "border-transparent text-black/40 hover:text-black/70"
            }`}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-4 font-display text-lg font-light">System Dimensions</h2>
              <ShadowDimensions scores={orchReport?.dimension_scores} />
            </div>
            {orchReport?.metrics && (
              <div>
                <h2 className="mb-4 font-display text-lg font-light">Live Metrics</h2>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 sm:grid-cols-4 lg:grid-cols-6">
                  <Metric label="Properties" value={orchReport.metrics.total_properties || 0} />
                  <Metric label="Active Sources" value={`${orchReport.metrics.active_sources || 0}/${orchReport.metrics.total_sources || 0}`} />
                  <Metric label="Investors" value={orchReport.metrics.total_investors || 0} />
                  <Metric label="Active Deals" value={orchReport.metrics.active_deals || 0} />
                  <Metric label="Subscriptions" value={orchReport.metrics.active_subscriptions || 0} />
                  <Metric label="Audit Findings" value={orchReport.audit_findings?.length || 0} />
                </div>
              </div>
            )}
            {orchReport?.capability_matrix && (
              <div>
                <h2 className="mb-4 font-display text-lg font-light">Capability Matrix</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-black/15 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                        <th className="pb-2 pr-4">Capability</th>
                        <th className="pb-2 pr-4">Score</th>
                        <th className="pb-2 pr-4">Status</th>
                        <th className="pb-2">Gap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10">
                      {orchReport.capability_matrix.map((c, i) => (
                        <tr key={i}>
                          <td className="py-2.5 pr-4 text-xs font-medium">{c.capability}</td>
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-black/10">
                                <div className="h-full bg-black" style={{ width: `${c.score}%` }} />
                              </div>
                              <span className="text-xs text-black/60">{c.score}</span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-4 text-xs text-black/60">{c.status}</td>
                          <td className="py-2.5 text-xs text-black/50">{c.gap}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "findings" && (
          <ShadowFindings findings={orchReport?.audit_findings} actions={orchReport?.actions_taken} />
        )}

        {activeTab === "dealhunt" && (
          <ShadowDealHunt results={huntReport} />
        )}

        {activeTab === "brief" && (
          <ShadowBrief brief={briefReport} topProperties={briefReport?.brief_sections?.top_properties} />
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 font-display text-lg font-light">Execution History</h2>
          <div className="divide-y divide-black/10 border-y border-black/10">
            {history.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] ${
                    r.type === "orchestrator" ? "bg-black text-white" : r.type === "deal_hunt" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  }`}>{r.type}</span>
                  <span className="text-xs text-black/50">{new Date(r.run_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-black/50">
                  {r.overall_score !== undefined && <span>Score: <b className="text-black/70">{r.overall_score}</b></span>}
                  {r.metrics?.opportunities_found !== undefined && <span>Opps: <b className="text-black/70">{r.metrics.opportunities_found}</b></span>}
                  {r.audit_findings?.length !== undefined && <span>Findings: <b className="text-black/70">{r.audit_findings.length}</b></span>}
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({ icon: Icon, title, desc, onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="flex flex-col items-start rounded-sm border border-black/10 bg-white p-5 text-left transition hover:border-black/30 disabled:opacity-50">
      <Icon className={`h-5 w-5 text-black/40 ${loading ? "animate-spin" : ""}`} />
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-[10px] text-black/40">{desc}</p>
    </button>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-white p-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">{label}</p>
      <p className="mt-1 font-display text-xl font-light tabular-nums">{value}</p>
    </div>
  );
}