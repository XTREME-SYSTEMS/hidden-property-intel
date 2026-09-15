import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Zap, MessageSquare, Brain, Activity, Send, Plus, Play, RefreshCw, CheckCircle, AlertCircle, Cpu, Mail, Phone, Users, TrendingUp } from "lucide-react";

export default function AdminXtremeVision() {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // AI Gateway state
  const [gatewayModels, setGatewayModels] = useState(null);
  const [gatewayResult, setGatewayResult] = useState(null);
  const [gatewayPrompt, setGatewayPrompt] = useState("Analyze the Florida real estate market for distressed property investment opportunities in 2026.");
  const [gatewayModel, setGatewayModel] = useState("anthropic/claude-sonnet-5");

  // Xtreme Comms state
  const [commsDashboard, setCommsDashboard] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [conversations, setConversations] = useState([]);

  // Autonomous loop state
  const [cycles, setCycles] = useState([]);
  const [cycleRunning, setCycleRunning] = useState(false);

  // Enrichment state
  const [enrichmentStatus, setEnrichmentStatus] = useState(null);

  // Template generation
  const [tplChannel, setTplChannel] = useState("email");
  const [tplAudience, setTplAudience] = useState("investor");
  const [tplSituation, setTplSituation] = useState("outreach");
  const [tplTone, setTplTone] = useState("professional");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [models, comms, enrichment, loopStatus] = await Promise.all([
        base44.functions.invoke("aiGatewayGenerate", { action: "models" }),
        base44.functions.invoke("xtremeComms", { action: "dashboard" }),
        base44.functions.invoke("validateEnrichment", {}),
        base44.functions.invoke("autonomousMasterLoop", { action: "status" }),
      ]);
      setGatewayModels(models.data);
      setCommsDashboard(comms.data);
      setEnrichmentStatus(enrichment.data);
      setCycles(loopStatus.data.cycles || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const runGatewayGenerate = async () => {
    setLoading(true);
    setError(null);
    setGatewayResult(null);
    try {
      const res = await base44.functions.invoke("aiGatewayGenerate", {
        action: "generate",
        prompt: gatewayPrompt,
        model: gatewayModel,
        fallback_to_invoke_llm: true,
      });
      setGatewayResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  const generateTemplate = async () => {
    setLoading(true);
    setError(null);
    try {
      await base44.functions.invoke("xtremeComms", {
        action: "generate_template",
        channel: tplChannel,
        target_audience: tplAudience,
        situation: tplSituation,
        tone: tplTone,
        ai_persona: "Eden Skye",
      });
      await loadAll();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  const runAutonomousCycle = async () => {
    setCycleRunning(true);
    setError(null);
    try {
      await base44.functions.invoke("autonomousMasterLoop", { action: "run", trigger_source: "manual" });
      await loadAll();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setCycleRunning(false);
  };

  const runAutoHeal = async () => {
    setLoading(true);
    setError(null);
    try {
      await base44.functions.invoke("runMasterEnrichment", { mode: "auto_heal" });
      await loadAll();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <h2 className="font-display text-xl">Xtreme Vision — Unified Command Center</h2>
          </div>
          <p className="mt-1 text-xs text-black/50">
            Vercel AI Gateway · Xtreme Communications · Autonomous Master Loop · 15-Category Enrichment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAll} className="inline-flex items-center gap-1.5 rounded-sm border border-black/10 px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-black/60 hover:bg-black/[0.02]">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Tab Bar */}
      <div className="mt-5 flex items-center gap-1 rounded-sm border border-black/10 p-1">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "gateway", label: "AI Gateway", icon: Cpu },
          { id: "comms", label: "Xtreme Comms", icon: MessageSquare },
          { id: "autonomous", label: "Autonomous Loop", icon: Brain },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] ${tab === t.id ? "bg-black text-white" : "text-black/50"}`}>
            <t.icon className="h-3 w-3" /> {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="mt-5 space-y-4">
          {/* Status Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatusCard icon={Cpu} label="AI Gateway" value={gatewayModels?.configured ? "Connected" : "Not Configured"} status={gatewayModels?.configured ? "success" : "error"} detail={`${Object.keys(gatewayModels?.models || {}).length} models available`} />
            <StatusCard icon={TrendingUp} label="Enrichment" value={`${enrichmentStatus?.system_completeness || 0}%`} status={(enrichmentStatus?.system_completeness || 0) >= 80 ? "success" : "warning"} detail={`${enrichmentStatus?.auto_heal_candidates || 0} candidates to heal`} />
            <StatusCard icon={MessageSquare} label="Campaigns" value={`${commsDashboard?.campaigns?.total || 0}`} status="info" detail={`${commsDashboard?.campaigns?.active || 0} active`} />
            <StatusCard icon={Brain} label="Autonomous" value={cycles[0]?.status || "idle"} status={cycles[0]?.status === "complete" ? "success" : cycles[0]?.status === "running" ? "warning" : "info"} detail={cycles[0]?.phase || "No cycles yet"} />
          </div>

          {/* Launch Readiness */}
          <div className={`rounded-sm border p-5 ${(enrichmentStatus?.system_completeness || 0) >= 80 ? "border-green-300 bg-green-50" : "border-amber-300 bg-amber-50"}`}>
            <div className="flex items-center gap-3">
              {(enrichmentStatus?.system_completeness || 0) >= 80 ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
              )}
              <div>
                <p className="font-display text-base">
                  {(enrichmentStatus?.system_completeness || 0) >= 80 ? "System Launch Ready" : "Enrichment In Progress"}
                </p>
                <p className="text-xs text-black/55">
                  {(enrichmentStatus?.system_completeness || 0) >= 80
                    ? "All systems operational. Master enrichment has reached 80%+ completeness."
                    : `${enrichmentStatus?.auto_heal_candidates || 0} properties still need enrichment. Run Auto-Heal to continue.`}
                </p>
              </div>
              <button onClick={runAutoHeal} disabled={loading} className="ml-auto inline-flex items-center gap-2 rounded-sm bg-black px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white disabled:opacity-50">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} Run Auto-Heal
              </button>
            </div>
          </div>

          {/* Category Scores */}
          {enrichmentStatus?.category_scores && (
            <div className="rounded-sm border border-black/10 p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Enrichment Category Scores</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {Object.entries(enrichmentStatus.category_scores).map(([cat, score]) => (
                  <div key={cat} className="rounded-sm border border-black/10 p-3">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-black/40">{cat.replace(/_/g, " ")}</p>
                    <p className="mt-1 font-display text-lg">{score}%</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/10">
                      <div className={`h-full rounded-full ${score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-400"}`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI GATEWAY TAB */}
      {tab === "gateway" && (
        <div className="mt-5 space-y-4">
          <div className="rounded-sm border border-black/10 p-5">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-black/50" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Vercel AI Gateway — Multi-Model Access</p>
            </div>
            <p className="mt-2 text-xs text-black/55">
              {gatewayModels?.configured
                ? `Connected — ${Object.keys(gatewayModels.models).length} models available across OpenAI, Anthropic, and Google.`
                : "Not configured. Set AI_GATEWAY_API_KEY in Settings → Secrets."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {gatewayModels?.models && Object.entries(gatewayModels.models).map(([id, m]) => (
                <button key={id} onClick={() => setGatewayModel(id)} className={`rounded-sm border px-3 py-2 text-left transition ${gatewayModel === id ? "border-black bg-black/[0.03]" : "border-black/10 hover:bg-black/[0.02]"}`}>
                  <p className="text-xs font-medium">{m.label}</p>
                  <p className="text-[10px] text-black/45">{m.provider} · {m.tier}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-sm border border-black/10 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Test Generation</p>
            <textarea value={gatewayPrompt} onChange={(e) => setGatewayPrompt(e.target.value)} className="mt-2 h-28 w-full resize-none rounded-sm border border-black/15 p-3 text-sm outline-none focus:border-black" />
            <button onClick={runGatewayGenerate} disabled={loading || !gatewayPrompt.trim()} className="mt-3 inline-flex items-center gap-2 rounded-sm bg-black px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white disabled:opacity-50">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Generate via {gatewayModel}
            </button>
            {gatewayResult && (
              <div className="mt-4 rounded-sm border border-black/10 bg-black/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-black/40">Result · {gatewayResult.source}</p>
                  {gatewayResult.usage && <p className="text-[10px] text-black/40">{gatewayResult.usage.total_tokens} tokens</p>}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-black/70">
                  {typeof gatewayResult.result === "string" ? gatewayResult.result : JSON.stringify(gatewayResult.result, null, 2).slice(0, 2000)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* XTREME COMMS TAB */}
      {tab === "comms" && (
        <div className="mt-5 space-y-4">
          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Mail} label="Campaigns" value={commsDashboard?.campaigns?.total || 0} sub={`${commsDashboard?.campaigns?.active || 0} active`} />
            <StatCard icon={MessageSquare} label="Templates" value={commsDashboard?.templates?.total || 0} sub={`${commsDashboard?.templates?.active || 0} active`} />
            <StatCard icon={Users} label="Conversations" value={commsDashboard?.conversations?.total || 0} sub={`${commsDashboard?.conversations?.active || 0} active`} />
            <StatCard icon={TrendingUp} label="Response Rate" value={`${commsDashboard?.events?.response_rate || 0}%`} sub={`${commsDashboard?.events?.replied || 0} replies`} />
          </div>

          {/* AI Template Generator */}
          <div className="rounded-sm border border-black/10 p-5">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-black/50" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">AI Template Generator</p>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-black/40">Channel</label>
                <select value={tplChannel} onChange={(e) => setTplChannel(e.target.value)} className="mt-1 w-full rounded-sm border border-black/15 px-3 py-2 text-sm">
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="voice">Voice</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-black/40">Audience</label>
                <select value={tplAudience} onChange={(e) => setTplAudience(e.target.value)} className="mt-1 w-full rounded-sm border border-black/15 px-3 py-2 text-sm">
                  <option value="investor">Investor</option>
                  <option value="owner">Property Owner</option>
                  <option value="heir">Probate Heir</option>
                  <option value="agent">Agent</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-black/40">Situation</label>
                <select value={tplSituation} onChange={(e) => setTplSituation(e.target.value)} className="mt-1 w-full rounded-sm border border-black/15 px-3 py-2 text-sm">
                  <option value="outreach">Outreach</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="objection_handling">Objection Handling</option>
                  <option value="closing">Closing</option>
                  <option value="nurture">Nurture</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-black/40">Tone</label>
                <select value={tplTone} onChange={(e) => setTplTone(e.target.value)} className="mt-1 w-full rounded-sm border border-black/15 px-3 py-2 text-sm">
                  <option value="professional">Professional</option>
                  <option value="empathetic">Empathetic</option>
                  <option value="persuasive">Persuasive</option>
                  <option value="consultative">Consultative</option>
                </select>
              </div>
            </div>
            <button onClick={generateTemplate} disabled={loading} className="mt-3 inline-flex items-center gap-2 rounded-sm bg-black px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white disabled:opacity-50">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Generate AI Template
            </button>
          </div>
        </div>
      )}

      {/* AUTONOMOUS LOOP TAB */}
      {tab === "autonomous" && (
        <div className="mt-5 space-y-4">
          <div className="rounded-sm border border-black/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-black/50" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Autonomous Master Loop</p>
                </div>
                <p className="mt-2 text-xs text-black/55">
                  4-phase self-reflection engine: Forensic Audit → Self-Reflection → Architect → Act.
                  Uses Vercel AI Gateway for analysis and safely executes enrichment, validation, and comms functions.
                </p>
              </div>
              <button onClick={runAutonomousCycle} disabled={cycleRunning} className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-white disabled:opacity-50">
                {cycleRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Run Cycle
              </button>
            </div>
          </div>

          {/* Cycle History */}
          {cycles.length > 0 && (
            <div className="rounded-sm border border-black/10 p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Recent Cycles</p>
              <div className="mt-3 space-y-2">
                {cycles.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-sm border border-black/10 p-3">
                    <div className={`h-2 w-2 rounded-full ${c.status === "complete" ? "bg-green-500" : c.status === "running" ? "bg-amber-500" : c.status === "failed" ? "bg-red-500" : "bg-gray-400"}`} />
                    <div className="flex-1">
                      <p className="text-xs font-medium">{c.cycle_id}</p>
                      <p className="text-[10px] text-black/45">{new Date(c.started_at).toLocaleString()} · Phase: {c.phase}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">{c.health_after ? `${c.health_after}%` : "—"}</p>
                      <p className="text-[10px] text-black/45">{c.items_identified || 0} findings</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusCard({ icon: Icon, label, value, status, detail }) {
  const colors = { success: "text-green-600", warning: "text-amber-600", error: "text-red-600", info: "text-black/60" };
  return (
    <div className="rounded-sm border border-black/10 p-4">
      <Icon className={`h-5 w-5 ${colors[status] || colors.info}`} />
      <p className="mt-3 text-[10px] uppercase tracking-[0.1em] text-black/40">{label}</p>
      <p className="font-display text-lg">{value}</p>
      <p className="text-[10px] text-black/45">{detail}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-sm border border-black/10 p-4">
      <Icon className="h-4 w-4 text-black/40" />
      <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-black/40">{label}</p>
      <p className="font-display text-xl">{value}</p>
      <p className="text-[10px] text-black/45">{sub}</p>
    </div>
  );
}