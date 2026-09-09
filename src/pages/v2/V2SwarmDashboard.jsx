import React, { useEffect, useState } from "react";
import { Activity, Map, Zap, Cpu, Play, Loader2, Globe, Bot } from "lucide-react";
import { base44 } from "@/api/base44Client";

const AGENTS = [
  { name: "PRIME", role: "Orchestrator", icon: Bot, color: "#7c3aed", bg: "#ede9fe" },
  { name: "SENTINEL", role: "Data acquisition", icon: Globe, color: "#16a34a", bg: "#dcfce7" },
  { name: "ARCHITECT", role: "Enrichment", icon: Cpu, color: "#2563eb", bg: "#dbeafe" },
  { name: "ORACLE", role: "Scoring / prediction", icon: Zap, color: "#d97706", bg: "#fef3c7" },
  { name: "SIREN", role: "Outreach", icon: Activity, color: "#db2777", bg: "#fce7f3" },
  { name: "ANALYST", role: "Matching / alerts", icon: Map, color: "#0891b2", bg: "#cffafe" },
  { name: "REAPER", role: "Cleanup / expiry", icon: Activity, color: "#64748b", bg: "#f1f5f9" },
  { name: "HEALER", role: "Validation", icon: Activity, color: "#dc2626", bg: "#fee2e2" },
];

export default function V2SwarmDashboard() {
  const [status, setStatus] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await base44.functions.invoke("autonomousSwarmCycle", { action: "status" });
      const data = res?.data || res;
      if (data?.error && (res?.status === 401 || /unauthorized/i.test(String(data.error)))) {
        setError("signin");
      } else if (data?.error) {
        setError(data.error);
      } else {
        setStatus(data);
        setCycles(data.recent_cycles || []);
      }
    } catch (e) {
      setError(e?.response?.status === 401 ? "signin" : "Failed to load swarm status");
    }
    setLoading(false);
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const runCycle = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke("autonomousSwarmCycle", { action: "cycle", trigger_source: "manual" });
      await load();
    } catch (e) { setError(e?.message || "Cycle failed"); }
    setRunning(false);
  };

  if (loading) return <div className="v2-loading"><div className="v2-spinner" /> Loading swarm…</div>;
  if (error === "signin")
    return <div className="v2-intel-signin">Sign in as admin to view the AGI swarm. <a href="/login">Sign in →</a></div>;

  const cov = status?.coverage || {};
  const pct = status?.target_markets ? Math.round((cov.counties_covered / status.target_markets) * 100) : 0;

  return (
    <>
      <p className="v2-app-greeting">AGI Swarm</p>
      <h1 className="v2-app-title">National operations — autonomous</h1>

      <div className="v2-app-stats" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}><Activity size={18} /></div>
          <b>{cov.unenriched ?? "—"}</b><span>Need enrichment</span>
          {cov.total_properties ? <div className="up" style={{ color: "#d97706" }}>{cov.total_properties} total</div> : null}
        </div>
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}><Zap size={18} /></div>
          <b>{cov.unscored ?? "—"}</b><span>Need scoring</span>
        </div>
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}><Globe size={18} /></div>
          <b>{cov.states_covered || 0}</b><span>States · {cov.counties_covered || 0} counties</span>
        </div>
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}><Map size={18} /></div>
          <b>{cov.total_properties || 0}</b><span>Properties · {pct}% national</span>
        </div>
      </div>

      <div className="v2-app-section">
        <div className="v2-app-section-head">
          <h3>Swarm agents</h3>
          <button onClick={runCycle} disabled={running}
            style={{ height: 34, padding: "0 14px", border: 0, borderRadius: 8, background: "var(--v2-accent)", color: "#fff", fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {running ? "Running…" : "Run cycle now"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {AGENTS.map((a) => (
            <div key={a.name} className="v2-app-action" style={{ cursor: "default" }}>
              <div className="v2-app-action-icon" style={{ background: a.bg, color: a.color }}><a.icon size={20} /></div>
              <span><b>{a.name}</b><br />{a.role}</span>
            </div>
          ))}
        </div>
      </div>

      {cov.uncovered_markets?.length > 0 && (
        <div className="v2-app-section">
          <div className="v2-app-section-head"><h3>Next markets to expand ({cov.uncovered_markets.length})</h3></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {cov.uncovered_markets.slice(0, 16).map((m) => (
              <span key={m} style={{ padding: "5px 11px", borderRadius: 999, background: "#fff", border: "1px solid var(--v2-border)", fontSize: 12, color: "var(--v2-ink-soft)" }}>{m}</span>
            ))}
          </div>
        </div>
      )}

      <div className="v2-app-section">
        <div className="v2-app-section-head"><h3>Recent cycles</h3></div>
        <div className="v2-app-list">
          {cycles.length === 0 && <div className="v2-app-item"><div className="v2-app-item-main"><b>No cycles yet</b><span>The swarm runs every 5 minutes via Vercel cron</span></div></div>}
          {cycles.map((c) => (
            <div key={c.cycle_id} className="v2-app-item">
              <div className="v2-app-item-main">
                <b>{c.decision?.action || c.function_called || c.phase}</b>
                <span>{c.decision?.specialist_agent ? `${c.decision.specialist_agent} · ` : ""}{c.cycle_id} · {c.started_at?.slice(11, 19)}</span>
              </div>
              <span className={`v2-app-item-pill ${c.status === "complete" ? "active" : c.status === "failed" ? "pending" : "won"}`}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}