import React, { useState } from "react";
import { Plus, Trash2, Play, Loader2, ChevronDown, ChevronUp, Workflow, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STEP_TYPES = [
  { value: "scrapeProperties", label: "Scrape Properties", desc: "Run a scrape source to find new properties" },
  { value: "runMasterEnrichment", label: "Master Enrichment", desc: "Enrich properties with 15-category data" },
  { value: "scoreAllActiveProperties", label: "Score Properties", desc: "AI score all active properties 0-100" },
  { value: "scrapePropertyImages", label: "Scrape Images", desc: "Fetch property photos from listings" },
  { value: "outreachInvestors", label: "Email Investors", desc: "Send outreach to investor leads" },
  { value: "outreachSellers", label: "Email Sellers", desc: "Send outreach to property owners" },
  { value: "processFollowUps", label: "Process Follow-ups", desc: "Send due follow-up emails" },
  { value: "shadowOrchestrator", label: "Shadow Audit", desc: "Run 8-dimension system audit" },
  { value: "autonomousMasterLoop", label: "Autonomous Cycle", desc: "Full AI self-reflection + fix cycle" },
  { value: "validateSystem", label: "Validate System", desc: "System health check + auto-heal" },
  { value: "predictDistress", label: "Predict Distress", desc: "ML distress prediction on properties" },
  { value: "generateMorningBrief", label: "Morning Brief", desc: "Generate AI intelligence brief" },
  { value: "syncToSupabase", label: "Sync to Supabase", desc: "Mirror data to Supabase warehouse" },
  { value: "submitSitemap", label: "Submit Sitemap", desc: "Submit sitemap to search engines" },
];

export default function WorkflowCreator() {
  const [steps, setSteps] = useState([]);
  const [name, setName] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(true);

  const addStep = (fnName) => {
    const step = STEP_TYPES.find(s => s.value === fnName);
    if (!step) return;
    setSteps(prev => [...prev, { id: Date.now() + Math.random(), fn: fnName, label: step.label, desc: step.desc, params: {} }]);
  };

  const removeStep = (id) => setSteps(prev => prev.filter(s => s.id !== id));

  const moveStep = (id, dir) => {
    setSteps(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  const runWorkflow = async () => {
    if (steps.length === 0) return;
    setRunning(true);
    setResult(null);
    const results = [];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      try {
        const res = await base44.functions.invoke(step.fn, step.params || {});
        results.push({ step: step.label, status: "success", data: res.data });
      } catch (e) {
        results.push({ step: step.label, status: "error", error: e.response?.data?.error || e.message });
      }
    }
    setResult(results);
    setRunning(false);
  };

  return (
    <div className="rounded-sm border border-black/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-black/60" />
          <div>
            <h2 className="font-display text-base font-light">Step-by-Step Workflow Creator</h2>
            <p className="text-xs text-black/40">Build a custom automation pipeline — add steps, reorder, and run sequentially.</p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="rounded-sm p-1.5 text-black/40 hover:bg-black/5">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4">
          {/* Name */}
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Workflow name (e.g. Morning Acquisition Pipeline)"
            className="w-full rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black"
          />

          {/* Step builder */}
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Add a step</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {STEP_TYPES.map(s => (
                <button
                  key={s.value}
                  onClick={() => addStep(s.value)}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-black/15 px-3 py-1.5 text-[10px] font-medium text-black/60 transition hover:bg-black hover:text-white"
                >
                  <Plus className="h-3 w-3" /> {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Steps list */}
          {steps.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Pipeline ({steps.length} steps)</p>
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-3 rounded-sm border border-black/10 bg-[#f7f5f0] px-3 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="text-[10px] text-black/40">{step.desc}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveStep(step.id, -1)} disabled={i === 0} className="rounded-sm p-1 text-black/40 hover:bg-black/5 disabled:opacity-20">↑</button>
                    <button onClick={() => moveStep(step.id, 1)} disabled={i === steps.length - 1} className="rounded-sm p-1 text-black/40 hover:bg-black/5 disabled:opacity-20">↓</button>
                    <button onClick={() => removeStep(step.id)} className="rounded-sm p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
              <button
                onClick={runWorkflow}
                disabled={running || steps.length === 0}
                className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-2.5 text-[11px] uppercase tracking-[0.3em] text-white transition hover:bg-black/80 disabled:opacity-50"
              >
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {running ? "Running workflow…" : "Run Workflow"}
              </button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="mt-4 rounded-sm border border-black/10 bg-black/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Results</p>
              <div className="mt-2 space-y-1.5">
                {result.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`h-2 w-2 rounded-full ${r.status === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
                    <span className="font-medium">{r.step}</span>
                    <span className={r.status === "success" ? "text-emerald-600" : "text-red-600"}>
                      {r.status === "success" ? "✓ done" : `✗ ${r.error}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {steps.length === 0 && (
            <div className="mt-4 flex items-center justify-center rounded-sm border border-dashed border-black/15 py-8 text-sm text-black/30">
              <Zap className="mr-2 h-4 w-4" /> Add steps above to build your workflow pipeline
            </div>
          )}
        </div>
      )}
    </div>
  );
}