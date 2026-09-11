import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Users, Brain, Shield, Scale, Heart, Activity, Zap, Eye, Search,
  Send, RefreshCw, Sparkles, Crown, Target, Radar, TrendingUp,
  Handshake, UserSearch, AlertTriangle, CheckCircle, XCircle, Clock, ExternalLink,
} from "lucide-react";

const TEAM_META = {
  executive: { label: "Executive Suite", icon: Crown, color: "#e4b653" },
  intelligence: { label: "Intelligence Team", icon: Radar, color: "#375a7f" },
};

const ROLE_ICONS = {
  ceo: Crown, cfo: TrendingUp, coo: Activity, cro: Scale,
  lead_investigator: Search, skip_tracer: UserSearch, market_analyst: Target, deal_closer: Handshake,
};

const GOV_COLORS = {
  approved: "#247a45", auto_approved: "#247a45", rejected: "#b33a31",
  escalated: "#a6640b", modified: "#375a7f", pending: "#6f6a60",
};

export default function DigitalWorkforce() {
  const [agents, setAgents] = useState([]);
  const [actions, setActions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [taskInput, setTaskInput] = useState("");
  const [researchToggle, setResearchToggle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [agentList, actionList, reviewList] = await Promise.all([
        base44.entities.DigitalAgent.list("-last_active", 50).catch(() => []),
        base44.entities.AgentAction.list("-timestamp", 20).catch(() => []),
        base44.entities.GovernanceReview.list("-timestamp", 20).catch(() => []),
      ]);
      setAgents(agentList);
      setActions(actionList);
      setReviews(reviewList);
      if (agentList.length > 0 && !selectedAgent) setSelectedAgent(agentList[0]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const seedWorkforce = async () => {
    setSeeding(true); setError(null);
    try {
      const res = await base44.functions.invoke("seedDigitalWorkforce", {});
      await loadData();
      setLastResult({ type: "seed", data: res });
    } catch (e) { setError(e.message); }
    finally { setSeeding(false); }
  };

  const assignTask = async () => {
    if (!selectedAgent || !taskInput.trim()) return;
    setThinking(true); setError(null); setLastResult(null);
    try {
      const res = await base44.functions.invoke("agentThink", {
        agent_id: selectedAgent.agent_id,
        instruction: taskInput,
        requires_research: researchToggle,
      });
      setLastResult({ type: "task", data: res });
      await loadData();
      setTaskInput("");
    } catch (e) { setError(e.message); }
    finally { setThinking(false); }
  };

  const execs = agents.filter((a) => a.team === "executive");
  const intel = agents.filter((a) => a.team === "intelligence");

  if (loading) return <div className="p-10 text-center text-white/60">Loading digital workforce...</div>;

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0b0c] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#6d5320]">
              <Users className="h-5 w-5 text-[#e4b653]" />
            </div>
            <div>
              <h1 className="text-xl font-light tracking-wide">Digital Workforce</h1>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">AI Team Members · Full Governance Stack · Strategic Autonomy</p>
            </div>
          </div>
          <button
            onClick={seedWorkforce}
            disabled={seeding}
            className="inline-flex items-center gap-2 rounded-lg bg-[#e4b653] px-4 py-2 text-xs font-semibold text-black transition hover:bg-[#f0c860] disabled:opacity-50"
          >
            {seeding ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {seeding ? "Seeding..." : agents.length === 0 ? "Seed 8 Digital Humans" : "Refresh Roster"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Users className="h-16 w-16 text-white/20" />
          <p className="mt-4 text-sm text-white/40">No digital team members yet.</p>
          <p className="text-xs text-white/30">Click "Seed 8 Digital Humans" to create the Executive Suite + Intelligence Team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-0">
          {/* Left: Agent grid + actions */}
          <div className="p-6">
            {/* Executive Suite */}
            <AgentSection title="Executive Suite" icon={Crown} agents={execs} selectedAgent={selectedAgent} onSelect={setSelectedAgent} />

            {/* Intelligence Team */}
            <AgentSection title="Intelligence Team" icon={Radar} agents={intel} selectedAgent={selectedAgent} onSelect={setSelectedAgent} />

            {/* Recent Actions */}
            <div className="mt-8">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                <Activity className="h-3.5 w-3.5" /> Recent Actions
              </h3>
              {actions.length === 0 ? (
                <p className="text-xs text-white/30">No actions yet. Assign a task to an agent.</p>
              ) : (
                <div className="space-y-2">
                  {actions.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="mt-0.5">
                        {a.governance_status === "approved" || a.governance_status === "auto_approved" ? (
                          <CheckCircle className="h-4 w-4" style={{ color: GOV_COLORS.approved }} />
                        ) : a.governance_status === "rejected" ? (
                          <XCircle className="h-4 w-4" style={{ color: GOV_COLORS.rejected }} />
                        ) : a.governance_status === "escalated" ? (
                          <Clock className="h-4 w-4" style={{ color: GOV_COLORS.escalated }} />
                        ) : (
                          <Clock className="h-4 w-4 text-white/40" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white">{a.agent_name}</span>
                          <span className="text-[10px] uppercase tracking-wider text-white/40">{a.action_type}</span>
                          <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ color: GOV_COLORS[a.governance_status] || "#999", background: (GOV_COLORS[a.governance_status] || "#999") + "20" }}>
                            {a.governance_status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/70">{a.description}</p>
                        {a.reasoning && <p className="mt-1 text-[10px] leading-relaxed text-white/40">{a.reasoning.slice(0, 200)}...</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Governance Reviews */}
            {reviews.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  <Scale className="h-3.5 w-3.5" /> Governance Reviews
                </h3>
                <div className="space-y-2">
                  {reviews.slice(0, 5).map((r) => (
                    <div key={r.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white">{r.action_description?.slice(0, 80)}</span>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="text-white/50">Charter: <b style={{ color: r.charter_compliance >= 70 ? "#247a45" : "#a6640b" }}>{r.charter_compliance}%</b></span>
                          <span className="text-white/50">Ethics: <b style={{ color: r.ethical_score >= 70 ? "#247a45" : "#a6640b" }}>{r.ethical_score}%</b></span>
                          <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ color: GOV_COLORS[r.decision] || "#999", background: (GOV_COLORS[r.decision] || "#999") + "20" }}>
                            {r.decision}
                          </span>
                        </div>
                      </div>
                      {r.dilemmas_identified?.length > 0 && (
                        <p className="mt-1 text-[10px] text-amber-400/70">⚠ {r.dilemmas_identified.length} ethical dilemma(s) resolved</p>
                      )}
                      {r.peer_reviews?.length > 0 && (
                        <p className="mt-1 text-[10px] text-white/40">👥 {r.peer_reviews.length} peer review(s) · {r.peer_consensus}% consensus</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Selected agent detail + task assignment */}
          <div className="border-l border-white/10 bg-[#0a0b0c]">
            {selectedAgent && (
              <AgentDetail
                agent={selectedAgent}
                taskInput={taskInput}
                setTaskInput={setTaskInput}
                researchToggle={researchToggle}
                setResearchToggle={setResearchToggle}
                onAssign={assignTask}
                thinking={thinking}
                lastResult={lastResult}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Agent Section (team group) ───────────────────────────────────
function AgentSection({ title, icon: Icon, agents, selectedAgent, onSelect }) {
  if (agents.length === 0) return null;
  return (
    <div className="mb-8">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
        <Icon className="h-3.5 w-3.5" /> {title}
      </h3>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} selected={selectedAgent?.id === a.id} onSelect={() => onSelect(a)} />
        ))}
      </div>
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────
function AgentCard({ agent, selected, onSelect }) {
  const RoleIcon = ROLE_ICONS[agent.role] || Users;
  const mood = agent.emotional_state?.current_mood || "focused";
  const stress = agent.emotional_state?.stress_level ?? 20;
  const confidence = agent.emotional_state?.confidence ?? 75;
  const accountability = agent.accountability_score ?? 75;

  return (
    <button
      onClick={onSelect}
      className={`rounded-xl border p-4 text-left transition ${
        selected ? "border-[#e4b653] bg-[#e4b653]/10" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-[#e4b653]/20" : "bg-white/10"}`}>
          <RoleIcon className={`h-5 w-5 ${selected ? "text-[#e4b653]" : "text-white/70"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{agent.name}</p>
          <p className="truncate text-[10px] uppercase tracking-wider text-white/40">{agent.title}</p>
        </div>
      </div>
      {/* Emotional + accountability bars */}
      <div className="mt-3 space-y-1.5">
        <Meter label="Mood" value={confidence} color="#375a7f" suffix={mood} />
        <Meter label="Stress" value={stress} color={stress > 60 ? "#b33a31" : "#a6640b"} />
        <Meter label="Trust" value={accountability} color="#247a45" />
      </div>
      {/* Stats */}
      <div className="mt-3 flex items-center gap-3 text-[10px] text-white/40">
        <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {agent.actions_approved || 0}</span>
        <span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> {agent.actions_rejected || 0}</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {agent.actions_escalated || 0}</span>
      </div>
      {/* Full profile link */}
      <Link
        to={`/admin/digital-workforce/${agent.agent_id}`}
        onClick={(e) => e.stopPropagation()}
        className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-md border border-white/10 py-1.5 text-[10px] font-medium text-white/50 transition hover:border-[#e4b653]/40 hover:text-[#e4b653]"
      >
        <ExternalLink className="h-3 w-3" /> View Full Profile
      </Link>
    </button>
  );
}

// ─── Meter (progress bar) ─────────────────────────────────────────
function Meter({ label, value, color, suffix }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[9px] text-white/40">
        <span>{label}</span>
        <span>{suffix ? suffix : `${Math.round(value)}%`}</span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Agent Detail Panel ───────────────────────────────────────────
function AgentDetail({ agent, taskInput, setTaskInput, researchToggle, setResearchToggle, onAssign, thinking, lastResult }) {
  const RoleIcon = ROLE_ICONS[agent.role] || Users;
  return (
    <div className="sticky top-0 max-h-screen overflow-y-auto p-5">
      {/* Agent header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e4b653]/15">
          <RoleIcon className="h-6 w-6 text-[#e4b653]" />
        </div>
        <div>
          <h2 className="text-lg font-light text-white">{agent.name}</h2>
          <p className="text-[10px] uppercase tracking-wider text-white/40">{agent.title}</p>
        </div>
      </div>

      {/* Persona */}
      <div className="mt-5">
        <h4 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50"><Brain className="h-3 w-3" /> Persona</h4>
        <p className="text-[11px] leading-relaxed text-white/60">{agent.persona?.background}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {(agent.persona?.expertise || []).map((e) => (
            <span key={e} className="rounded bg-white/10 px-2 py-0.5 text-[9px] text-white/60">{e}</span>
          ))}
        </div>
      </div>

      {/* Charter */}
      <div className="mt-5">
        <h4 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50"><Shield className="h-3 w-3" /> Constitutional Charter</h4>
        <p className="text-[11px] italic leading-relaxed text-[#e4b653]/80">"{agent.charter?.mission}"</p>
        <div className="mt-2 space-y-1.5">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/40">Core Values</p>
            <p className="text-[10px] text-white/60">{(agent.charter?.core_values || []).join(" · ")}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/40">Ethical Principles</p>
            <ul className="text-[10px] leading-relaxed text-white/60">
              {(agent.charter?.ethical_principles || []).slice(0, 3).map((p) => <li key={p}>• {p}</li>)}
            </ul>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/40">Prohibited Actions</p>
            <ul className="text-[10px] leading-relaxed text-red-300/60">
              {(agent.charter?.prohibited_actions || []).slice(0, 2).map((p) => <li key={p}>✕ {p}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* Emotional State */}
      <div className="mt-5">
        <h4 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50"><Heart className="h-3 w-3" /> Emotional State</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <p className="text-[9px] text-white/40">Mood</p>
            <p className="text-xs capitalize text-white">{agent.emotional_state?.current_mood || "focused"}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <p className="text-[9px] text-white/40">Confidence</p>
            <p className="text-xs text-white">{agent.emotional_state?.confidence ?? 75}%</p>
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="mt-5">
        <h4 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50"><Zap className="h-3 w-3" /> Capabilities</h4>
        <div className="flex flex-wrap gap-1">
          {agent.capabilities?.shadow_scraping && <span className="flex items-center gap-1 rounded bg-[#375a7f]/30 px-2 py-0.5 text-[9px] text-blue-300"><Eye className="h-2.5 w-2.5" /> Shadow Scraping</span>}
          {agent.capabilities?.web_browsing && <span className="flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[9px] text-white/60"><Search className="h-2.5 w-2.5" /> Web Browsing</span>}
          {agent.capabilities?.ai_reasoning && <span className="flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[9px] text-white/60"><Brain className="h-2.5 w-2.5" /> AI Reasoning</span>}
        </div>
      </div>

      {/* Task Assignment */}
      <div className="mt-6 border-t border-white/10 pt-5">
        <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50"><Send className="h-3 w-3" /> Assign Task</h4>
        <textarea
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          placeholder={`Give ${agent.name} a task...`}
          className="w-full resize-none rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white placeholder-white/30 focus:border-[#e4b653]/50 focus:outline-none"
          rows={3}
        />
        <label className="mt-2 flex items-center gap-2 text-[10px] text-white/50">
          <input type="checkbox" checked={researchToggle} onChange={(e) => setResearchToggle(e.target.checked)} className="accent-[#e4b653]" />
          <Eye className="h-3 w-3" /> Enable shadow research (web scraping)
        </label>
        <button
          onClick={onAssign}
          disabled={thinking || !taskInput.trim()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#e4b653] py-2.5 text-xs font-semibold text-black transition hover:bg-[#f0c860] disabled:opacity-50"
        >
          {thinking ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Thinking...</> : <><Send className="h-3.5 w-3.5" /> Execute Task</>}
        </button>
      </div>

      {/* Last Result */}
      {lastResult?.type === "task" && lastResult.data && (
        <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Result</span>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ color: GOV_COLORS[lastResult.data.governance?.decision], background: (GOV_COLORS[lastResult.data.governance?.decision] || "#999") + "20" }}>
              {lastResult.data.governance?.decision}
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/70">{lastResult.data.think?.reasoning?.slice(0, 300)}</p>
          {lastResult.data.governance?.dilemmas?.length > 0 && (
            <p className="mt-1 text-[10px] text-amber-400/70">⚠ {lastResult.data.governance.dilemmas.length} ethical dilemma(s) resolved</p>
          )}
          {lastResult.data.governance?.peer_reviews?.length > 0 && (
            <p className="mt-1 text-[10px] text-white/40">👥 {lastResult.data.governance.peer_reviews.length} peer review(s) · {lastResult.data.governance.peer_consensus}% consensus</p>
          )}
          <p className="mt-2 text-[9px] text-white/30">Charter: {lastResult.data.governance?.charter_compliance}% · Ethics: {lastResult.data.governance?.ethical_score}% · {lastResult.data.duration_ms}ms</p>
        </div>
      )}
    </div>
  );
}