import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { ENRICHMENT_CATEGORIES, STATUS_META } from "@/lib/enrichmentCategories";
import { Building2, FileText, DollarSign, MapPin, TrendingUp, AlertTriangle, UserSearch, Swords, ShieldAlert, Brain, Image, Scale, Calculator, Bell, Database, Loader2, Play, CheckCircle, AlertCircle, Zap, Activity, Rocket } from "lucide-react";

const ICONS = { Building2, FileText, DollarSign, MapPin, TrendingUp, AlertTriangle, UserSearch, Swords, ShieldAlert, Brain, Image, Scale, Calculator, Bell, Database };

const CATEGORY_LABELS = {
  structural: "Structural", title_legal: "Title/Legal", valuation: "Valuation", neighborhood: "Neighborhood",
  market: "Market", distress: "Distress", skip_tracing: "Skip Tracing", competitive: "Competitive",
  risk: "Risk", ai_analysis: "AI Analysis", visual_spatial: "Visual/Spatial", legal_compliance: "Legal",
  financial_modeling: "Financial", alerts: "Alerts", data_sources: "Data Sources",
};

export default function AdminEnrichmentUpgrades() {
  const [running, setRunning] = useState(false);
  const [validating, setValidating] = useState(false);
  const [healing, setHealing] = useState(false);
  const [results, setResults] = useState(null);
  const [validation, setValidation] = useState(null);
  const [error, setError] = useState(null);
  const [expandedCat, setExpandedCat] = useState(null);

  const totalFeatures = useMemo(() => ENRICHMENT_CATEGORIES.reduce((sum, c) => sum + c.features.length, 0), []);
  const activeFeatures = useMemo(() => ENRICHMENT_CATEGORIES.reduce((sum, c) => sum + c.features.filter(f => f.status === "active").length, 0), []);

  const runEnrichment = async (mode = "batch") => {
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const res = await base44.functions.invoke("runMasterEnrichment", { mode, threshold: 80 });
      setResults(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setRunning(false);
  };

  const runValidation = async () => {
    setValidating(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("validateEnrichment", {});
      setValidation(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setValidating(false);
  };

  const runAutoHeal = async () => {
    setHealing(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("runMasterEnrichment", { mode: "auto_heal", threshold: 80 });
      setResults(res.data);
      // Re-validate after healing
      const valRes = await base44.functions.invoke("validateEnrichment", {});
      setValidation(valRes.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setHealing(false);
  };

  const systemScore = validation?.system_completeness ?? 0;
  const isReady = systemScore >= 80;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-black/60" />
            <h2 className="font-display text-xl">Master Enrichment System</h2>
          </div>
          <p className="mt-1 text-xs text-black/50">
            15 categories · {totalFeatures} features · {activeFeatures} active · The ultimate property intelligence engine
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => runEnrichment("batch")}
            disabled={running || validating || healing}
            className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white disabled:opacity-50"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Run Enrichment
          </button>
          <button
            onClick={runValidation}
            disabled={running || validating || healing}
            className="inline-flex items-center gap-2 rounded-sm border border-black/15 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-black/70 disabled:opacity-50"
          >
            {validating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />} Validate
          </button>
          <button
            onClick={runAutoHeal}
            disabled={running || validating || healing}
            className="inline-flex items-center gap-2 rounded-sm border border-amber-300 bg-amber-50 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-amber-700 disabled:opacity-50"
          >
            {healing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} Auto-Heal
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* System Score + Launch */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <div className="rounded-sm border border-black/10 bg-black/[0.02] p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">System Completeness</p>
          <div className="mt-2 flex items-end gap-2">
            <span className={`font-display text-4xl ${isReady ? 'text-emerald-600' : 'text-black/70'}`}>{systemScore}%</span>
            {validation && (
              <span className="mb-1 text-[10px] text-black/40">
                / {validation.total_properties || 0} properties
              </span>
            )}
          </div>
          <div className="mt-3 h-2 rounded-full bg-black/10 overflow-hidden">
            <div className={`h-full transition-all ${isReady ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${systemScore}%` }} />
          </div>
          {isReady ? (
            <p className="mt-2 text-[11px] text-emerald-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> System ready for launch
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-amber-600">
              {validation ? `${validation.auto_heal_candidates || 0} properties need auto-heal` : 'Run validation to check'}
            </p>
          )}
        </div>

        <div className="rounded-sm border border-black/10 bg-black/[0.02] p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Feature Installation</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-4xl text-black/70">{activeFeatures}</span>
            <span className="mb-1 text-[10px] text-black/40">/ {totalFeatures} active</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-black/10 overflow-hidden">
            <div className="h-full bg-black/60 transition-all" style={{ width: `${(activeFeatures / totalFeatures) * 100}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-black/40">
            {Math.round((activeFeatures / totalFeatures) * 100)}% of features installed
          </p>
        </div>

        <div className="rounded-sm border border-black/10 bg-black/[0.02] p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Last Enrichment Run</p>
          {results ? (
            <div className="mt-2 space-y-1">
              <p className="font-display text-2xl text-black/70">{results.enriched || 0} enriched</p>
              <p className="text-[11px] text-black/40">
                {results.failed || 0} failed · avg {results.system_avg_completeness || 0}% completeness
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-black/30">No runs yet</p>
          )}
        </div>
      </div>

      {/* Validation Results */}
      {validation && (
        <div className="mt-4 rounded-sm border border-black/10 bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 mb-3">Category Scores</p>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(validation.category_scores || {}).map(([cat, pct]) => (
              <div key={cat} className="rounded-sm border border-black/5 bg-black/[0.02] p-2.5">
                <p className="text-[9px] uppercase tracking-[0.15em] text-black/40">{CATEGORY_LABELS[cat] || cat}</p>
                <p className={`mt-1 font-display text-lg ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{pct}%</p>
              </div>
            ))}
          </div>
          {validation.weakest_categories?.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-black/50">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span>Weakest: {validation.weakest_categories.map(c => `${c.category} (${c.completeness}%)`).join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Enrichment Run Results */}
      {results && (
        <div className="mt-4 rounded-sm border border-black/10 bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 mb-3">Enrichment Results</p>
          <div className="space-y-1.5">
            {results.results?.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-sm border border-black/5 bg-black/[0.02] px-3 py-2">
                <span className="text-xs text-black/70">{r.address}</span>
                <div className="flex items-center gap-2">
                  {r.action === 'enriched' && <span className="text-[10px] text-emerald-600">{r.completeness}% complete</span>}
                  {r.action === 'error' && <span className="text-[10px] text-red-500">error</span>}
                  {r.action === 'skipped' && <span className="text-[10px] text-black/30">skipped</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Grid */}
      <div className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 mb-3">All 15 Categories — {totalFeatures} Features</p>
        <div className="grid gap-3 lg:grid-cols-2">
          {ENRICHMENT_CATEGORIES.map((cat) => {
            const Icon = ICONS[cat.icon] || Building2;
            const catScore = validation?.category_scores?.[cat.id];
            const activeCount = cat.features.filter(f => f.status === "active").length;
            const isExpanded = expandedCat === cat.id;
            return (
              <div key={cat.id} className="rounded-sm border border-black/10 bg-white overflow-hidden">
                <button
                  onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-black/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-black/[0.04]">
                      <Icon className="h-4 w-4 text-black/60" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{cat.name}</p>
                      <p className="text-[10px] text-black/40">{cat.features.length} features · {activeCount} active</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {catScore !== undefined && (
                      <span className={`text-xs font-medium ${catScore >= 80 ? 'text-emerald-600' : catScore >= 50 ? 'text-amber-600' : 'text-black/40'}`}>{catScore}%</span>
                    )}
                    <span className="text-[10px] text-black/30">{isExpanded ? '−' : '+'}</span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-black/5 p-4 space-y-2">
                    {cat.features.map((f) => {
                      const meta = STATUS_META[f.status];
                      return (
                        <div key={f.name} className="flex items-start gap-2 py-1.5">
                          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${f.status === 'active' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-black/80">{f.name}</p>
                            <p className="text-[10px] text-black/40 leading-relaxed mt-0.5">
                              <span className="text-black/50">Why:</span> {f.why} · <span className="text-black/50">Advantage:</span> {f.advantage}
                            </p>
                            <p className="text-[10px] text-black/30 mt-0.5">{f.technology}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${f.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {meta?.label || f.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Launch Banner */}
      {isReady && (
        <div className="mt-6 flex items-center justify-between rounded-sm border border-emerald-200 bg-emerald-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <Rocket className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-emerald-800">System at {systemScore}% — Ready for Launch</p>
              <p className="text-[11px] text-emerald-600">All enrichment categories validated. System is operational.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}