import React from "react";

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

function colorFor(score) {
  return score >= 80 ? "#247a45" : score >= 50 ? "#a6640b" : "#b33a31";
}

export default function ShadowDimensions({ scores }) {
  if (!scores) return null;
  const entries = Object.entries(scores);

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
        </div>
      ))}
    </div>
  );
}