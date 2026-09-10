import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Loader2, Network, GitMerge, Activity, Target, ShieldCheck, ChevronRight,
} from "lucide-react";

const TOOLS = [
  { id: "planInvestigation", icon: Target, label: "Information-Gain Planner", desc: "Classify known/unknown, rank by expected value", placeholder: "What should we investigate?" },
  { id: "verifyFinding", icon: ShieldCheck, label: "Adversarial Verification", desc: "Challenge a finding — search for contradictions", placeholder: "Claim to verify" },
  { id: "resolveEntities", icon: GitMerge, label: "Entity Resolution", desc: "Find duplicate entities, score similarity, merge", placeholder: "Find duplicates (leave blank)" },
  { id: "queryGraph", icon: Network, label: "Graph Query", desc: "Traverse relationships, find paths", placeholder: "Entity ID to traverse from" },
  { id: "detectChanges", icon: Activity, label: "Change Detection", desc: "Snapshot + diff → IntelEvents", placeholder: "Target ref (address)" },
];

export default function IntelligenceTools() {
  const [activeTool, setActiveTool] = useState(null);
  const [input, setInput] = useState("");
  const [target, setTarget] = useState("");
  const [data, setData] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    setRunning(true); setError(null); setResult(null);
    try {
      let payload = {};
      if (activeTool === "planInvestigation") payload = { question: input, target_ref: target, current_confidence: 30, decision_threshold: 75 };
      else if (activeTool === "verifyFinding") payload = { claim: input, target_ref: target, original_confidence: 75, classification: "inference" };
      else if (activeTool === "resolveEntities") payload = { find_duplicates: true };
      else if (activeTool === "queryGraph") payload = { start_entity_id: input, mode: "traverse", max_depth: 3 };
      else if (activeTool === "detectChanges") payload = { source: "manual", target_ref: target, current_data: JSON.parse(data || "{}") };

      const r = await base44.functions.invoke(activeTool, payload);
      setResult(r.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setRunning(false);
  };

  return (
    <div className="mt-5 space-y-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {TOOLS.map((t) => (
          <button key={t.id} onClick={() => { setActiveTool(t.id); setResult(null); setError(null); }}
            className={`rounded-lg border p-3 text-left transition ${activeTool === t.id ? "border-black bg-black text-white" : "border-black/10 bg-white hover:border-black/30"}`}>
            <t.icon className={`h-4 w-4 ${activeTool === t.id ? "text-[#e4b653]" : "text-black/40"}`} />
            <p className="mt-1.5 text-xs font-medium">{t.label}</p>
            <p className={`text-[10px] ${activeTool === t.id ? "text-white/60" : "text-black/40"}`}>{t.desc}</p>
          </button>
        ))}
      </div>

      {activeTool && (
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <div className="space-y-3">
            {activeTool !== "resolveEntities" && (
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">
                  {activeTool === "detectChanges" ? "JSON Data (current state)" : activeTool === "queryGraph" ? "Entity ID" : "Question / Claim"}
                </label>
                {activeTool === "detectChanges" ? (
                  <textarea className="mt-1.5 w-full rounded-md border border-black/15 px-3 py-2 text-xs font-mono" rows={4}
                    placeholder='{"owner_name": "John Smith", "estimated_value": 350000}'
                    value={data} onChange={(e) => setData(e.target.value)} />
                ) : (
                  <input className="mt-1.5 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
                    placeholder={TOOLS.find((t) => t.id === activeTool)?.placeholder}
                    value={input} onChange={(e) => setInput(e.target.value)} />
                )}
              </div>
            )}
            {(activeTool === "planInvestigation" || activeTool === "verifyFinding" || activeTool === "detectChanges") && (
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Target (address or entity ref)</label>
                <input className="mt-1.5 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
                  placeholder="1234 SE Magnolia Blvd, Port St. Lucie, FL 34983"
                  value={target} onChange={(e) => setTarget(e.target.value)} />
              </div>
            )}
            <button onClick={run} disabled={running || (activeTool !== "resolveEntities" && !input && !data)}
              className="inline-flex items-center gap-2 rounded-md bg-black px-5 py-2.5 text-xs font-medium text-white disabled:opacity-40">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />} {running ? "Running…" : "Execute"}
            </button>
          </div>
        </div>
      )}

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-black/40">Result</p>
          <pre className="max-h-96 overflow-auto rounded bg-gray-900 p-3 text-[10px] leading-relaxed text-white/80 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}