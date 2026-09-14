import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Activity, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Clock,
  Cpu, GitCommit, Play, RefreshCw, Lock, ChevronRight, Gauge,
} from "lucide-react";

const MODE_STYLES = {
  completion: { label: "COMPLETION", color: "#f0bf54", bg: "rgba(240,191,84,.12)" },
  preservation: { label: "PRESERVATION", color: "#3bbd72", bg: "rgba(59,189,114,.12)" },
  incident: { label: "INCIDENT", color: "#b33a31", bg: "rgba(179,58,49,.15)" },
};

export default function ConvergenceCenter() {
  const [heartbeat, setHeartbeat] = useState(null);
  const [gates, setGates] = useState([]);
  const [findings, setFindings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [validations, setValidations] = useState([]);
  const [subsystems, setSubsystems] = useState([]);
  const [validationTasks, setValidationTasks] = useState([]);
  const [runningValidators, setRunningValidators] = useState(false);
  const [running, setRunning] = useState(false);
  const [isolation, setIsolation] = useState(null);
  const [runningIsolation, setRunningIsolation] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [beats, gateRes, fnds, tks, vals, subs, vtasks] = await Promise.all([
        base44.entities.HeartbeatReceipt.list("-timestamp", 1).catch(() => []),
        base44.entities.GateResult.list("-evaluated_at", 60).catch(() => []),
        base44.entities.Finding.filter({ status: { $in: ["discovered", "diagnosed", "repair_planned", "failed", "blocked"] } }, "-discovered_at", 30).catch(() => []),
        base44.entities.RepairTask.filter({ status: { $in: ["queued", "in_progress"] } }, "-created_at", 20).catch(() => []),
        base44.entities.ValidationReceipt.list("-timestamp", 10).catch(() => []),
        base44.entities.SubsystemState.list("-updated_at", 20).catch(() => []),
        base44.entities.ValidationTask.filter({ status: { $in: ["UNKNOWN", "VALIDATOR_REQUIRED", "VALIDATOR_READY", "VALIDATING", "BLOCKED"] } }, "-updated_at", 40).catch(() => []),
      ]);
      setHeartbeat(beats[0] || null);
      setGates(gateRes || []);
      setFindings(fnds || []);
      setTasks(tks || []);
      setValidations(vals || []);
      setSubsystems(subs || []);
      setValidationTasks(vtasks || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runHeartbeat = async () => {
    setRunning(true);
    try { await base44.functions.invoke("alphaPrime", {}); await load(); }
    finally { setRunning(false); }
  };

  const runValidatorsNow = async () => {
    setRunningValidators(true);
    try { await base44.functions.invoke("runValidators", {}); await load(); }
    finally { setRunningValidators(false); }
  };

  const runIsolationRegression = async () => {
    setRunningIsolation(true);
    try {
      const res = await base44.functions.invoke("adminIsolationRegression", {});
      setIsolation(res?.data || res);
      await load();
    } finally { setRunningIsolation(false); }
  };

  const WAVE1_GATES = ["ci.sha_stamped", "code.build", "code.lint", "code.typecheck", "workflows.heartbeat_active", "workflows.no_duplicate_cron"];
  const latestGate = (gid) => gates.find((g) => g.gate_id === gid);

  const mode = heartbeat?.mode || "completion";
  const modeStyle = MODE_STYLES[mode];
  const mandatoryGates = gates.filter((g) => g.mandatory);
  const passed = mandatoryGates.filter((g) => g.status === "PASS").length;
  const failedGates = mandatoryGates.filter((g) => g.status === "FAIL" || g.status === "BLOCKED");
  const unknownGates = mandatoryGates.filter((g) => g.status === "UNKNOWN");
  const releaseReady = heartbeat?.release_ready || false;
  const p0 = findings.filter((f) => f.priority === "p0");
  const p1 = findings.filter((f) => f.priority === "p1");
  const blocked = findings.filter((f) => f.status === "blocked");

  if (loading && !heartbeat) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-[#f0bf54]" /></div>;
  }

  return (
    <div className="min-h-[calc(100vh-74px)] bg-[#0c0d0e] text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Cpu className="h-7 w-7 text-[#f0bf54]" />
              <h1 className="text-3xl font-bold tracking-tight">Convergence Center</h1>
            </div>
            <p className="mt-1 text-sm text-[#8d8f92]">Alpha Prime governor — evidence-backed autonomous convergence</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runIsolationRegression}
              disabled={runningIsolation}
              className="inline-flex items-center gap-2 rounded-lg border border-[#3a3a2a] bg-[#1a1a14] px-4 py-2.5 text-sm font-bold text-[#c9b45a] transition hover:border-[#c9b45a] disabled:opacity-50"
            >
              {runningIsolation ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {runningIsolation ? "Probing…" : "Isolation regression"}
            </button>
            <button
              onClick={runValidatorsNow}
              disabled={runningValidators}
              className="inline-flex items-center gap-2 rounded-lg border border-[#3a3a2a] bg-[#1a1a14] px-4 py-2.5 text-sm font-bold text-[#c9b45a] transition hover:border-[#c9b45a] disabled:opacity-50"
            >
              {runningValidators ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {runningValidators ? "Validating…" : "Run Wave 1 validators"}
            </button>
            <button
              onClick={runHeartbeat}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#e4b653] to-[#c38a1b] px-5 py-2.5 text-sm font-bold text-[#120e07] transition hover:opacity-90 disabled:opacity-50"
            >
              {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? "Running heartbeat…" : "Run heartbeat now"}
            </button>
          </div>
        </div>

        {/* Top status bar */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatusCard
            label="Current Mode"
            value={modeStyle.label}
            color={modeStyle.color}
            bg={modeStyle.bg}
            icon={<Activity className="h-5 w-5" />}
          />
          <StatusCard
            label="Release Ready"
            value={releaseReady ? "TRUE" : "FALSE"}
            color={releaseReady ? "#3bbd72" : "#b33a31"}
            bg={releaseReady ? "rgba(59,189,114,.1)" : "rgba(179,58,49,.1)"}
            icon={releaseReady ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          />
          <StatusCard
            label="Mandatory Gates"
            value={`${passed} / ${mandatoryGates.length}`}
            color="#f0bf54"
            bg="rgba(240,191,84,.1)"
            icon={<Gauge className="h-5 w-5" />}
          />
          <StatusCard
            label="Source SHA"
            value={heartbeat?.source_sha ? heartbeat.source_sha.slice(0, 8) : "pending"}
            color="#8d8f92"
            bg="rgba(141,143,146,.1)"
            icon={<GitCommit className="h-5 w-5" />}
          />
        </div>

        {/* Failed gates + incidents */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Failed Mandatory Gates" icon={<XCircle className="h-4 w-4 text-[#b33a31]" />} count={failedGates.length}>
            {failedGates.length === 0 ? (
              <Empty text="No failed mandatory gates" tone="good" />
            ) : (
              <div className="space-y-2">
                {failedGates.slice(0, 10).map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded-lg border border-[#2b2c2f] bg-[#141516] px-3 py-2.5">
                    <div>
                      <div className="text-xs font-semibold text-white">{g.gate_id}</div>
                      <div className="text-[10px] text-[#8d8f92]">{g.detail}</div>
                    </div>
                    <span className="rounded-full bg-[#3a2112] px-2 py-0.5 text-[9px] font-bold text-[#f0c05b]">{g.status}</span>
                  </div>
                ))}
                {unknownGates.length > 0 && (
                  <div className="mt-2 rounded-lg border border-[#3a3a2a] bg-[#1a1a14] px-3 py-2 text-[10px] text-[#c9b45a]">
                    {unknownGates.length} mandatory gates still UNKNOWN — UNKNOWN never counts as PASS.
                  </div>
                )}
              </div>
            )}
          </Panel>

          <Panel title="Active Incidents / Blocked Actions" icon={<AlertTriangle className="h-4 w-4 text-[#b33a31]" />} count={blocked.length}>
            {blocked.length === 0 ? (
              <Empty text="No blocked actions" tone="good" />
            ) : (
              <div className="space-y-2">
                {blocked.slice(0, 10).map((f) => (
                  <div key={f.id} className="rounded-lg border border-[#3a2112] bg-[#1a1410] px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{f.title}</span>
                      <Lock className="h-3 w-3 text-[#b33a31]" />
                    </div>
                    <div className="mt-1 text-[10px] text-[#8d8f92]">{f.subsystem} · awaiting operator approval</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Wave 1 validator results + Validation task queue */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Wave 1 Validator Results" icon={<ShieldCheck className="h-4 w-4 text-[#f0bf54]" />}>
            <div className="space-y-2">
              {WAVE1_GATES.map((gid) => {
                const g = latestGate(gid);
                const status = g?.status || "UNKNOWN";
                const tone = status === "PASS" ? "#3bbd72" : status === "FAIL" ? "#b33a31" : status === "BLOCKED" ? "#b33a31" : "#8d8f92";
                return (
                  <div key={gid} className="flex items-start justify-between gap-3 rounded-lg border border-[#2b2c2f] bg-[#141516] px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white">{gid}</div>
                      <div className="mt-0.5 truncate text-[10px] text-[#8d8f92]">{g?.detail || "no validator receipt yet"}</div>
                    </div>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ color: tone, background: `${tone}22` }}>{status}</span>
                  </div>
                );
              })}
              <div className="mt-2 rounded-lg border border-[#3a3a2a] bg-[#1a1a14] px-3 py-2 text-[10px] text-[#c9b45a]">
                Source SHA: <span className="font-mono text-white">{heartbeat?.source_sha ? heartbeat.source_sha.slice(0, 12) : "pending"}</span> — stamped on every receipt
              </div>
            </div>
          </Panel>

          <Panel title="Validation Task Queue (UNKNOWN gates)" icon={<Clock className="h-4 w-4 text-[#f0bf54]" />} count={validationTasks.length}>
            {validationTasks.length === 0 ? <Empty text="No validation tasks — all gates resolved or validated" tone="good" /> : (
              <div className="max-h-72 space-y-2 overflow-auto">
                {validationTasks.slice(0, 20).map((vt) => (
                  <div key={vt.id} className="rounded-lg border border-[#2b2c2f] bg-[#141516] px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{vt.gate_id}</span>
                      <span className="rounded-full bg-[#241e12] px-2 py-0.5 text-[9px] font-bold text-[#f0c05b]">{vt.status}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-[#8d8f92]">{vt.reason || vt.blocker}</div>
                    <div className="mt-1 flex items-center gap-2 text-[9px] text-[#6a6a6a]">
                      <span>{vt.validator_id}</span>·<span>{vt.wave || "unassigned"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Admin isolation regression */}
        {isolation && (
          <div className="mb-6 rounded-xl border border-[#292a2d] bg-[#0f1011] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#f0bf54]" />
                <h2 className="text-sm font-bold text-white">Admin Isolation Regression</h2>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: isolation.status === 'PASS' ? '#3bbd72' : isolation.status === 'FAIL' ? '#b33a31' : '#f0bf54', background: (isolation.status === 'PASS' ? '#3bbd72' : isolation.status === 'FAIL' ? '#b33a31' : '#f0bf54') + '22' }}>{isolation.status}</span>
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] text-[#8d8f92]">
              <span>Caller: <span className="text-white">{isolation.caller_role}</span></span>
              <span>·</span>
              <span>Coverage: {isolation.coverage?.join(', ') || 'none'}</span>
              {isolation.missing_roles?.length > 0 && <><span>·</span><span className="text-[#f0bf54]">Awaiting: {isolation.missing_roles.join(', ')}</span></>}
            </div>
            <div className="text-[10px] text-[#8d8f92]">{isolation.reason}</div>
            {isolation.probes?.filter((p) => p.result === 'FAIL').length > 0 && (
              <div className="mt-2 space-y-1">
                {isolation.probes.filter((p) => p.result === 'FAIL').map((p) => (
                  <div key={p.name} className="text-[10px] text-[#b33a31]">{p.name}: expected {p.expected}, got {p.actual} — {p.evidence}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Findings + repair queue */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="P0 Findings" icon={<AlertTriangle className="h-4 w-4 text-[#b33a31]" />} count={p0.length}>
            {p0.length === 0 ? <Empty text="No P0 findings" tone="good" /> : (
              <div className="space-y-2">
                {p0.slice(0, 8).map((f) => <FindingRow key={f.id} f={f} />)}
                {p1.length > 0 && <div className="mt-3 border-t border-[#26272a] pt-2 text-[10px] text-[#8d8f92]">{p1.length} P1 findings</div>}
              </div>
            )}
          </Panel>

          <Panel title="Repair Queue (in progress)" icon={<Clock className="h-4 w-4 text-[#f0bf54]" />} count={tasks.length}>
            {tasks.length === 0 ? <Empty text="Queue empty" tone="neutral" /> : (
              <div className="space-y-2">
                {tasks.slice(0, 10).map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-[#2b2c2f] bg-[#141516] px-3 py-2.5">
                    <div>
                      <div className="text-xs font-semibold text-white">{t.action}</div>
                      <div className="text-[10px] text-[#8d8f92]">{t.specialist} · {t.subsystem}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#241e12] px-2 py-0.5 text-[9px] font-bold text-[#f0c05b]">
                      <RefreshCw className="h-2.5 w-2.5 animate-spin" />{t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Heartbeat + next due */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="Last Heartbeat" icon={<Activity className="h-4 w-4 text-[#f0bf54]" />}>
            {heartbeat ? (
              <div className="space-y-1.5 text-xs">
                <Row k="Time" v={new Date(heartbeat.timestamp).toLocaleString()} />
                <Row k="Mode" v={MODE_STYLES[heartbeat.mode]?.label || heartbeat.mode} />
                <Row k="Jobs due" v={heartbeat.jobs_due} />
                <Row k="Dispatched" v={heartbeat.jobs_dispatched} />
                <Row k="Receipts" v={heartbeat.receipts_collected} />
                <Row k="Open findings" v={heartbeat.open_findings} />
                <Row k="Duration" v={`${(heartbeat.duration_ms / 1000).toFixed(1)}s`} />
                <Row k="Lease" v={heartbeat.lease_acquired ? "acquired" : "contended"} />
              </div>
            ) : <Empty text="No heartbeat yet" tone="neutral" />}
          </Panel>

          <Panel title="Next Due" icon={<Clock className="h-4 w-4 text-[#f0bf54]" />}>
            <div className="space-y-2 text-xs">
              <Row k="Smoke (15m)" v={heartbeat?.next_due_smoke ? new Date(heartbeat.next_due_smoke).toLocaleTimeString() : "—"} />
              <Row k="Optimize (1h)" v={heartbeat?.next_due_optimize ? new Date(heartbeat.next_due_optimize).toLocaleTimeString() : "—"} />
              <Row k="Benchmark (24h)" v={heartbeat?.next_due_benchmark ? new Date(heartbeat.next_due_benchmark).toLocaleString() : "—"} />
            </div>
          </Panel>

          <Panel title="Recent Validations" icon={<ShieldCheck className="h-4 w-4 text-[#3bbd72]" />}>
            {validations.length === 0 ? <Empty text="No validations yet" tone="neutral" /> : (
              <div className="space-y-2">
                {validations.slice(0, 6).map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-[#8d8f92]">{v.verdict === "pass" ? "PASS" : v.verdict.toUpperCase()}</span>
                    <span className="text-[#6a6a6a]">{new Date(v.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Subsystem health matrix */}
        <Panel title="Subsystem Health" icon={<Gauge className="h-4 w-4 text-[#f0bf54]" />}>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            {subsystems.length === 0 ? <Empty text="No subsystem state yet — run a heartbeat" tone="neutral" /> : (
              subsystems.map((s) => {
                const tone = s.health === "healthy" ? "#3bbd72" : s.health === "critical" ? "#b33a31" : "#f0bf54";
                return (
                  <div key={s.id} className="rounded-lg border border-[#2b2c2f] bg-[#141516] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold capitalize text-white">{s.subsystem}</span>
                      <span className="h-2 w-2 rounded-full" style={{ background: tone }} />
                    </div>
                    <div className="mt-1.5 text-[10px] text-[#8d8f92]">{MODE_STYLES[s.current_mode]?.label || s.current_mode}</div>
                    <div className="mt-1 text-[10px] text-[#6a6a6a]">{s.open_findings} open · {s.failed_gates?.length || 0} failed gates</div>
                  </div>
                );
              })
            )}
          </div>
        </Panel>

        <div className="mt-6 flex items-center justify-between text-[10px] text-[#6a6a6a]">
          <span>RELEASE_READY = AND of all mandatory gates. UNKNOWN ≠ PASS. No evidence = no PASS.</span>
          <Link to="/admin" className="inline-flex items-center gap-1 text-[#f0bf54] hover:underline">Admin home <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, color, bg, icon }) {
  return (
    <div className="rounded-xl border border-[#2b2c2f] p-4" style={{ background: bg }}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
        {icon}{label}
      </div>
      <div className="mt-2 text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function Panel({ title, icon, count, children }) {
  return (
    <div className="rounded-xl border border-[#292a2d] bg-[#0f1011] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-bold text-white">{title}</h2>
        </div>
        {count !== undefined && <span className="rounded-full bg-[#241e12] px-2 py-0.5 text-[10px] font-bold text-[#f0c05b]">{count}</span>}
      </div>
      {children}
    </div>
  );
}

function FindingRow({ f }) {
  const sev = f.severity === "critical" ? "#b33a31" : f.severity === "high" ? "#f0bf54" : "#8d8f92";
  return (
    <div className="rounded-lg border border-[#2b2c2f] bg-[#141516] px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white">{f.title}</span>
        <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase" style={{ color: sev, background: `${sev}22` }}>{f.severity}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[10px] text-[#8d8f92]">
        <span>{f.subsystem}</span>·<span>{f.status}</span>
        {f.assigned_specialist && <><span>·</span><span>{f.assigned_specialist}</span></>}
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between border-b border-[#1f2022] py-1">
      <span className="text-[#8d8f92]">{k}</span>
      <span className="font-semibold text-white">{v}</span>
    </div>
  );
}

function Empty({ text, tone }) {
  const color = tone === "good" ? "#3bbd72" : tone === "neutral" ? "#8d8f92" : "#b33a31";
  return <div className="py-6 text-center text-xs" style={{ color }}>{text}</div>;
}