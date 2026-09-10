import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, Loader2, Search, Activity, Database, AlertTriangle, CheckCircle2,
  Brain, FileSearch, TrendingUp, Zap, ChevronRight, Clock, Target, X,
} from "lucide-react";

export default function IntelligenceConsole() {
  const [tab, setTab] = useState("command");
  const [question, setQuestion] = useState("");
  const [target, setTarget] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [investigations, setInvestigations] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [audit, setAudit] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, ev] = await Promise.all([
        base44.entities.Investigation.list("-created_date", 20).catch(() => []),
        base44.entities.Evidence.list("-created_date", 20).catch(() => []),
      ]);
      setInvestigations(inv);
      setEvidence(ev);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const runInvestigation = async () => {
    if (!question.trim()) return;
    setRunning(true); setError(null); setResult(null);
    try {
      const r = await base44.functions.invoke("runInvestigation", { question, target_ref: target, depth: "standard" });
      setResult(r.data);
      load();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setRunning(false);
  };

  const runAudit = async () => {
    setAuditLoading(true);
    try {
      const r = await base44.functions.invoke("systemAudit", {});
      setAudit(r.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setAuditLoading(false);
  };

  const examples = [
    "Tell me everything important about this property",
    "Who is the owner of record and what is their situation?",
    "What changed recently on this property?",
    "Is this a good investment opportunity and why?",
    "What information is missing from this profile?",
  ];

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-black text-[#e4b653]"><Brain className="h-5 w-5" /></div>
        <div>
          <h1 className="font-display text-2xl font-light tracking-tight">Intelligence Command Console</h1>
          <p className="text-xs text-black/50">Autonomous investigation engine — ask a question, the system decomposes, acquires, verifies, and reports with evidence.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1 rounded-lg border border-black/10 bg-white p-1">
        {[
          { id: "command", label: "Command", icon: Sparkles },
          { id: "investigations", label: `Investigations (${investigations.length})`, icon: FileSearch },
          { id: "evidence", label: `Evidence (${evidence.length})`, icon: Database },
          { id: "audit", label: "System Audit", icon: Activity },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${tab === t.id ? "bg-black text-white" : "text-black/50 hover:bg-black/5"}`}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {error && <div className="mt-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"><AlertTriangle className="h-4 w-4" /> {error}</div>}

      {/* COMMAND TAB */}
      {tab === "command" && (
        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Investigation Question</label>
            <textarea className="mt-1.5 w-full rounded-md border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" rows={2}
              placeholder="e.g. Tell me everything important about this property"
              value={question} onChange={(e) => setQuestion(e.target.value)} />
            <label className="mt-3 block text-[10px] uppercase tracking-[0.2em] text-black/40">Target (address, entity, or region)</label>
            <input className="mt-1.5 w-full rounded-md border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black"
              placeholder="e.g. 1234 SE Magnolia Blvd, Port St. Lucie, FL 34983"
              value={target} onChange={(e) => setTarget(e.target.value)} />
            <div className="mt-3 flex items-center gap-2">
              <button onClick={runInvestigation} disabled={running || !question.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-black px-5 py-2.5 text-xs font-medium text-white disabled:opacity-40">
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} {running ? "Investigating…" : "Launch Investigation"}
              </button>
              <span className="text-[10px] text-black/40">Decomposes → acquires via web search → reasons → scores → reports with evidence</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {examples.map((ex) => (
                <button key={ex} onClick={() => setQuestion(ex)} className="rounded-full border border-black/10 px-2.5 py-1 text-[10px] text-black/50 hover:bg-black/5">{ex}</button>
              ))}
            </div>
          </div>

          {result && <InvestigationResult result={result} />}

          {loading && <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-black/30" /></div>}
          {!loading && investigations.length > 0 && (
            <div className="rounded-lg border border-black/10 bg-white p-4">
              <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-black/40">Recent Investigations</p>
              <div className="space-y-2">
                {investigations.slice(0, 5).map((inv) => (
                  <div key={inv.id} className="flex items-start gap-3 rounded-md border border-black/5 p-3">
                    <StatusDot status={inv.status} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{inv.question}</p>
                      <p className="mt-0.5 text-[10px] text-black/40">{inv.target_ref || "no target"} · {inv.steps_completed || 0}/{inv.steps_total || 0} steps · {inv.duration_ms ? `${(inv.duration_ms / 1000).toFixed(1)}s` : "—"}</p>
                    </div>
                    {inv.confidence_score != null && <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-mono">{inv.confidence_score}%</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* INVESTIGATIONS TAB */}
      {tab === "investigations" && (
        <div className="mt-5">
          {loading ? <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-black/30" /></div> :
           investigations.length === 0 ? <Empty icon={FileSearch} label="No investigations yet" /> :
           <div className="space-y-3">
             {investigations.map((inv) => <InvestigationCard key={inv.id} inv={inv} />)}
           </div>}
        </div>
      )}

      {/* EVIDENCE TAB */}
      {tab === "evidence" && (
        <div className="mt-5">
          {loading ? <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-black/30" /></div> :
           evidence.length === 0 ? <Empty icon={Database} label="No evidence recorded yet" /> :
           <div className="space-y-2">
             {evidence.map((ev) => (
               <div key={ev.id} className="rounded-lg border border-black/10 bg-white p-4">
                 <div className="flex items-start justify-between gap-3">
                   <p className="text-xs font-medium">{ev.claim}</p>
                   <div className="flex shrink-0 items-center gap-2">
                     <ClassBadge classification={ev.classification} />
                     <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-mono">{ev.confidence}%</span>
                   </div>
                 </div>
                 {ev.sources?.length > 0 && <p className="mt-2 text-[10px] text-black/40">Sources: {ev.sources.map((s) => s.source).join(", ")}</p>}
               </div>
             ))}
           </div>}
        </div>
      )}

      {/* AUDIT TAB */}
      {tab === "audit" && (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-black/50">Forensic architectural audit — truth model + gap matrix</p>
            <button onClick={runAudit} disabled={auditLoading} className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-xs font-medium text-white disabled:opacity-40">
              {auditLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />} {auditLoading ? "Auditing…" : "Run Audit"}
            </button>
          </div>
          {audit && <AuditView audit={audit} />}
        </div>
      )}
    </div>
  );
}

function InvestigationResult({ result }) {
  const inv = result.investigation;
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        <h3 className="text-sm font-semibold">Investigation Complete</h3>
        <span className="ml-auto rounded-full bg-black/5 px-2.5 py-1 text-xs font-mono">{inv.confidence_score}% confidence</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed">{inv.executive_summary}</p>
      {inv.findings?.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-black/40">Findings ({inv.findings.length})</p>
          <div className="space-y-1.5">
            {inv.findings.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <ClassBadge classification={f.classification} />
                <span className="flex-1">{f.finding}</span>
                <span className="shrink-0 text-[10px] text-black/40">{f.confidence}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {inv.recommended_next?.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-black/40">Recommended Next Steps</p>
          <ul className="space-y-1">{inv.recommended_next.map((n, i) => <li key={i} className="flex items-start gap-1.5 text-xs"><ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-black/40" />{n}</li>)}</ul>
        </div>
      )}
      <p className="mt-3 text-[10px] text-black/40">{result.evidence_count} evidence records · {result.entity_count} entities · sources: {inv.source_list?.join(", ")}</p>
    </div>
  );
}

function InvestigationCard({ inv }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-black/10 bg-white">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left">
        <StatusDot status={inv.status} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{inv.question}</p>
          <p className="mt-0.5 text-[10px] text-black/40">{inv.target_ref || "no target"} · {inv.steps_completed}/{inv.steps_total} steps · {inv.duration_ms ? `${(inv.duration_ms / 1000).toFixed(1)}s` : "—"}</p>
        </div>
        {inv.confidence_score != null && <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-mono">{inv.confidence_score}%</span>}
        <ChevronRight className={`h-4 w-4 shrink-0 text-black/30 transition ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-black/10 p-4">
          {inv.executive_summary && <p className="text-sm leading-relaxed">{inv.executive_summary}</p>}
          {inv.findings?.length > 0 && <div className="mt-3 space-y-1.5">{inv.findings.map((f, i) => <div key={i} className="flex items-start gap-2 text-xs"><ClassBadge classification={f.classification} /><span className="flex-1">{f.finding}</span></div>)}</div>}
          {inv.recommended_next?.length > 0 && <div className="mt-3"><p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-black/40">Next steps</p><ul className="space-y-1">{inv.recommended_next.map((n, i) => <li key={i} className="flex items-start gap-1.5 text-xs"><ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-black/40" />{n}</li>)}</ul></div>}
        </div>
      )}
    </div>
  );
}

function AuditView({ audit }) {
  const [openSection, setOpenSection] = useState(null);
  return (
    <div className="mt-4 space-y-4">
      {/* Scores */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(audit.scores || {}).map(([k, v]) => (
          <div key={k} className="rounded-lg border border-black/10 bg-white p-4">
            <p className="text-[9px] uppercase tracking-[0.15em] text-black/40">{k.replace(/_/g, " ")}</p>
            <p className="mt-1 font-display text-2xl font-light">{v}<span className="text-sm text-black/30">/100</span></p>
          </div>
        ))}
      </div>
      {/* Checks */}
      <div className="rounded-lg border border-black/10 bg-white p-4">
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-black/40">Live Checks</p>
        {audit.checks?.map((c) => (
          <div key={c.name} className="flex items-center gap-2 py-1.5 text-xs">
            {c.status === "healthy" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
            <span className="font-medium">{c.name}</span>
            <span className="text-black/40">{c.detail}</span>
          </div>
        ))}
      </div>
      {/* Truth model */}
      <div className="rounded-lg border border-black/10 bg-white p-4">
        <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-black/40">Architectural Truth Model</p>
        {Object.entries(audit.truth_model || {}).map(([domain, caps]) => (
          <div key={domain} className="mb-2">
            <button onClick={() => setOpenSection(openSection === domain ? null : domain)} className="flex w-full items-center gap-2 py-1 text-left">
              <ChevronRight className={`h-3 w-3 transition ${openSection === domain ? "rotate-90" : ""}`} />
              <span className="text-xs font-semibold capitalize">{domain.replace(/_/g, " ")}</span>
            </button>
            {openSection === domain && (
              <div className="ml-5 space-y-1 py-1">
                {Object.entries(caps).map(([cap, info]) => (
                  <div key={cap} className="flex items-start gap-2 text-[11px]">
                    <StateBadge state={info.state} />
                    <span className="font-medium">{cap.replace(/_/g, " ")}</span>
                    <span className="text-black/40">{info.note}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Gap matrix */}
      <div className="rounded-lg border border-black/10 bg-white p-4">
        <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-black/40">Gap Matrix (prioritized)</p>
        <div className="space-y-2">
          {audit.gap_matrix?.map((g, i) => (
            <div key={i} className="rounded-md border border-black/5 p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{g.component}</span>
                <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase ${g.severity === "HIGH" ? "bg-red-100 text-red-700" : g.severity === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-black/5 text-black/50"}`}>{g.severity}</span>
                <span className="ml-auto text-[10px] text-black/40">Base44: {g.base44_can === true ? "yes" : g.base44_can === "partial" ? "partial" : "no"}</span>
              </div>
              <p className="mt-1 text-[11px] text-black/50">{g.impact}</p>
              <p className="mt-0.5 text-[11px] text-black/60"><strong>Fix:</strong> {g.solution}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const color = { completed: "bg-emerald-500", running: "bg-blue-500 animate-pulse", failed: "bg-red-500", queued: "bg-black/20", planning: "bg-amber-500" }[status] || "bg-black/20";
  return <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${color}`} />;
}

function ClassBadge({ classification }) {
  const map = {
    fact: "bg-emerald-100 text-emerald-700", observation: "bg-blue-100 text-blue-700",
    inference: "bg-purple-100 text-purple-700", hypothesis: "bg-amber-100 text-amber-700",
    prediction: "bg-cyan-100 text-cyan-700", unverified: "bg-black/10 text-black/50",
    contradicted: "bg-red-100 text-red-700", stale: "bg-gray-200 text-gray-600",
  };
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${map[classification] || map.unverified}`}>{classification}</span>;
}

function StateBadge({ state }) {
  const map = {
    IMPLEMENTED: "bg-emerald-100 text-emerald-700", PARTIALLY_IMPLEMENTED: "bg-amber-100 text-amber-700",
    STUB: "bg-black/10 text-black/50", MOCK: "bg-red-100 text-red-700", BROKEN: "bg-red-100 text-red-700",
    REQUIRES_EXTERNAL_SERVICE: "bg-purple-100 text-purple-700", ARCHITECTURALLY_WEAK: "bg-red-100 text-red-700",
    SECURITY_RISK: "bg-red-100 text-red-700", UI_ONLY: "bg-black/10 text-black/50",
  };
  return <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] ${map[state] || "bg-black/10 text-black/50"}`}>{state}</span>;
}

function Empty({ icon: Icon, label }) {
  return <div className="py-12 text-center"><Icon className="mx-auto mb-3 h-8 w-8 text-black/20" /><p className="text-sm text-black/40">{label}</p></div>;
}