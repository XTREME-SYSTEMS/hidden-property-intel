import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Mail, Briefcase, Globe, Wallet, Image as ImageIcon, Zap, Loader2,
  CheckCircle2, AlertCircle, Lock, Sparkles, Play, ArrowLeft, ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";

const CATEGORY_ICONS = {
  google_workspace: Mail,
  daily_business: Briefcase,
  web_accounts: Globe,
  crypto: Wallet,
  media: ImageIcon,
};

const STATUS_META = {
  authorized: { label: "Authorized", color: "#247a45", icon: CheckCircle2 },
  available: { label: "Available", color: "#c38a1b", icon: Zap },
  needs_auth: { label: "Needs Auth", color: "#a6640b", icon: Lock },
  credits_exhausted: { label: "Credits Exhausted", color: "#b33a31", icon: AlertCircle },
};

export default function AgentToolGenerator() {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [executing, setExecuting] = useState(null);
  const [results, setResults] = useState({});
  const [toolInputs, setToolInputs] = useState({});

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("agentToolGenerator", { action: "list" });
      setCatalog(res.data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  const executeTool = async (tool) => {
    setExecuting(tool.id);
    try {
      const inputs = toolInputs[tool.id] || {};
      const res = await base44.functions.invoke("agentToolGenerator", {
        action: "execute",
        tool_id: tool.id,
        inputs,
      });
      setResults(prev => ({ ...prev, [tool.id]: res.data }));
    } catch (e) {
      setResults(prev => ({ ...prev, [tool.id]: { result: { status: "error", message: e.message } } }));
    }
    setExecuting(null);
  };

  const updateInput = (toolId, field, value) => {
    setToolInputs(prev => ({
      ...prev,
      [toolId]: { ...(prev[toolId] || {}), [field]: value },
    }));
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-white text-[#6f6a60]">Loading tool catalog...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-white text-[#12110f]">
      {/* Header */}
      <div className="border-b border-[#e7e1d6] bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/digital-workforce" className="inline-flex items-center gap-1.5 text-[11px] text-[#6f6a60] transition hover:text-[#c38a1b]">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff8e9]">
              <Zap className="h-5 w-5 text-[#c38a1b]" />
            </div>
            <div>
              <h1 className="text-xl font-light tracking-wide text-[#12110f]">Agent Tool Generator</h1>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#6f6a60]">Full tool catalog · Google Workspace · Web Accounts · Crypto · Media</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[#6f6a60]">
            <span>{catalog?.total_tools || 0} total tools</span>
            <span>•</span>
            <span>{catalog?.categories?.length || 0} categories</span>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="border-b border-[#e7e1d6] bg-[#f7f5f0] px-6 py-3">
        <div className="flex flex-wrap gap-3">
          {(catalog?.categories || []).map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] || Zap;
            const isExpanded = expandedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  isExpanded ? "border-[#c38a1b] bg-[#fff8e9] text-[#c38a1b]" : "border-[#e7e1d6] bg-white text-[#6f6a60] hover:border-[#c38a1b]/40"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
                <span className="rounded-full bg-[#f7f5f0] px-1.5 py-0.5 text-[9px]">{cat.tools.length}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool categories */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        {(catalog?.categories || []).map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] || Zap;
          const isExpanded = expandedCategory === cat.id;
          return (
            <div key={cat.id} className="mb-4 rounded-xl border border-[#e7e1d6] bg-white shadow-[0_6px_20px_rgba(30,25,15,0.04)]">
              {/* Category header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff8e9]">
                  <Icon className="h-4.5 w-4.5 text-[#c38a1b]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-[#12110f]">{cat.label}</h2>
                  <p className="text-[11px] text-[#6f6a60]">{cat.description}</p>
                </div>
                <span className="rounded-full bg-[#f7f5f0] px-2.5 py-1 text-[10px] font-bold text-[#6f6a60]">{cat.tools.length} tools</span>
                <ChevronDown className={`h-4 w-4 text-[#6f6a60] transition ${isExpanded ? "rotate-180" : ""}`} />
              </button>

              {/* Tools grid */}
              {isExpanded && (
                <div className="grid grid-cols-1 gap-3 border-t border-[#e7e1d6] p-4 lg:grid-cols-2">
                  {cat.tools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      executing={executing === tool.id}
                      result={results[tool.id]}
                      inputs={toolInputs[tool.id] || {}}
                      onInputChange={(field, val) => updateInput(tool.id, field, val)}
                      onExecute={() => executeTool(tool)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tool Card ───────────────────────────────────────────────────────
function ToolCard({ tool, executing, result, inputs, onInputChange, onExecute }) {
  const status = STATUS_META[tool.status] || STATUS_META.available;
  const StatusIcon = status.icon;

  return (
    <div className="rounded-lg border border-[#e7e1d6] bg-[#f7f5f0] p-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#12110f]">{tool.name}</p>
          <p className="mt-0.5 text-[10px] text-[#6f6a60]">{tool.description}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ background: status.color + "15", color: status.color }}>
          <StatusIcon className="h-2.5 w-2.5" /> {status.label}
        </span>
      </div>

      {/* Method badge */}
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded bg-white px-1.5 py-0.5 text-[8px] font-mono uppercase text-[#6f6a60]">{tool.method}</span>
        {tool.connector && <span className="text-[9px] text-[#6f6a60]">→ {tool.connector}</span>}
        {tool.function && <span className="text-[9px] text-[#6f6a60]">→ {tool.function}</span>}
      </div>

      {/* Input fields */}
      {tool.inputs && Object.keys(tool.inputs).length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          {Object.entries(tool.inputs).map(([field, type]) => (
            <div key={field}>
              <label className="text-[9px] uppercase tracking-wider text-[#6f6a60]">{field} ({type})</label>
              <input
                type={type === "number" ? "number" : "text"}
                value={inputs[field] || ""}
                onChange={(e) => onInputChange(field, e.target.value)}
                placeholder={`Enter ${field}...`}
                className="w-full rounded border border-[#e7e1d6] bg-white px-2 py-1 text-[10px] text-[#12110f] placeholder-[#6f6a60]/40 focus:border-[#c38a1b]/40 focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      {/* Execute button */}
      <button
        onClick={onExecute}
        disabled={executing || tool.status === "credits_exhausted"}
        className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#12110f] py-1.5 text-[10px] font-medium text-white transition hover:bg-[#c38a1b] disabled:opacity-40"
      >
        {executing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
        {executing ? "Executing..." : "Execute Tool"}
      </button>

      {/* Result */}
      {result && (
        <div className={`mt-2.5 rounded-md border p-2 ${result.result?.status === "success" ? "border-[#247a45]/20 bg-[#247a45]/5" : "border-[#b33a31]/20 bg-[#b33a31]/5"}`}>
          <div className="flex items-center gap-1.5">
            {result.result?.status === "success" ? (
              <CheckCircle2 className="h-3 w-3 text-[#247a45]" />
            ) : (
              <AlertCircle className="h-3 w-3 text-[#b33a31]" />
            )}
            <span className="text-[10px] font-medium" style={{ color: result.result?.status === "success" ? "#247a45" : "#b33a31" }}>
              {result.result?.status === "success" ? "Success" : "Error"}
            </span>
          </div>
          <pre className="mt-1 max-h-[120px] overflow-auto rounded bg-white/50 p-1.5 text-[9px] text-[#12110f]">
            {JSON.stringify(result.result, null, 2).slice(0, 500)}
          </pre>
        </div>
      )}
    </div>
  );
}