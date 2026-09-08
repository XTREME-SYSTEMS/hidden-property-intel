import React, { useState } from "react";
import { Wrench, Heart, Shield, Zap, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const DIMENSION_LABELS = {
  data_acquisition: "Data Acquisition",
  property_enrichment: "Property Enrichment",
  deal_pipeline: "Deal Pipeline",
  outreach_engine: "Outreach Engine",
  system_intelligence: "System Intelligence",
  security_compliance: "Security & Compliance",
  seo_visibility: "SEO & Visibility",
  financial_health: "Financial Health",
};

const DIMENSION_ICONS = {
  data_acquisition: "📡", property_enrichment: "🏠", deal_pipeline: "🎯",
  outreach_engine: "✉️", system_intelligence: "🧠", security_compliance: "🔒",
  seo_visibility: "🔍", financial_health: "💰",
};

// Map each dimension to the backend function that best targets it
const DIMENSION_ACTIONS = {
  data_acquisition: { fix: "runDailyScrapePipeline", heal: "runDailyScrapePipeline", harden: "validateSystem", optimize: "scrapeInvestors" },
  property_enrichment: { fix: "runMasterEnrichment", heal: "validateEnrichment", harden: "validateEnrichment", optimize: "scoreAllActiveProperties" },
  deal_pipeline: { fix: "autonomousMasterLoop", heal: "autonomousMasterLoop", harden: "shadowOrchestrator", optimize: "scoreAllActiveProperties" },
  outreach_engine: { fix: "runDailyOutreach", heal: "processFollowUps", harden: "validateSystem", optimize: "runDailyOutreach" },
  system_intelligence: { fix: "autonomousMasterLoop", heal: "autonomousMasterLoop", harden: "shadowOrchestrator", optimize: "autonomousMasterLoop" },
  security_compliance: { fix: "validateSystem", heal: "validateSystem", harden: "shadowOrchestrator", optimize: "validateSystem" },
  seo_visibility: { fix: "submitSitemap", heal: "submitSitemap", harden: "syncSearchConsole", optimize: "dynamicSitemap" },
  financial_health: { fix: "autonomousMasterLoop", heal: "shadowOrchestrator", harden: "shadowOrchestrator", optimize: "autonomousMasterLoop" },
};

const ACTIONS = [
  { key: "fix", label: "Fix", icon: Wrench, color: "text-blue-600 hover:bg-blue-50" },
  { key: "heal", label: "Heal", icon: Heart, color: "text-rose-600 hover:bg-rose-50" },
  { key: "harden", label: "Harden", icon: Shield, color: "text-emerald-600 hover:bg-emerald-50" },
  { key: "optimize", label: "Optimize", icon: Zap, color: "text-amber-600 hover:bg-amber-50" },
];

function colorFor(score) {
  return score >= 80 ? "#247a45" : score >= 50 ? "#a6640b" : "#b33a31";
}

export default function ShadowDimensions({ scores, onAction }) {
  const [busy, setBusy] = useState({});

  if (!scores) return null;
  const entries = Object.entries(scores);

  const runAction = async (dimension, actionKey) => {
    const fnName = DIMENSION_ACTIONS[dimension]?.[actionKey];
    if (!fnName) return;
    const busyKey = `${dimension}-${actionKey}`;
    setBusy(prev => ({ ...prev, [busyKey]: true }));
    try {
      await base44.functions.invoke(fnName, { target_dimension: dimension, focus: actionKey });
      if (onAction) onAction(dimension, actionKey);
    } catch (e) {
      console.error(`${actionKey} failed for ${dimension}:`, e);
    }
    setBusy(prev => ({ ...prev, [busyKey]: false }));
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {entries.map(([key, score]) => (
        <div key={key} className="rounded-sm border border-black/10 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg">{DIMENSION_ICONS[key] || "📊"}</span>
            <span className="font-display text-2xl font-light tabular-nums" style={{ color: colorFor(score) }}>
              {Math.round(score)}
            </span>
          </div>
          <p className="mt-2 text-xs font-medium text-black/70">{DIMENSION_LABELS[key] || key}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: colorFor(score) }} />
          </div>
          {/* Action buttons */}
          <div className="mt-3 grid grid-cols-4 gap-1">
            {ACTIONS.map(({ key: actionKey, label, icon: Icon, color }) => {
              const busyKey = `${key}-${actionKey}`;
              const isBusy = busy[busyKey];
              return (
                <button
                  key={actionKey}
                  onClick={() => runAction(key, actionKey)}
                  disabled={isBusy}
                  title={`${label} ${DIMENSION_LABELS[key] || key}`}
                  className={`flex flex-col items-center gap-0.5 rounded-sm border border-black/10 px-1 py-1.5 text-[9px] font-medium uppercase tracking-wide transition disabled:opacity-40 ${color}`}
                >
                  {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}