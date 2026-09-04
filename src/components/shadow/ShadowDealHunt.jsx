import React from "react";
import { TrendingUp, Target, Eye, Zap, AlertCircle } from "lucide-react";

function Section({ icon: Icon, title, items, color }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-sm border border-black/10 bg-white p-5">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">{title}</p>
        <span className="ml-auto text-xs font-medium text-black/40">{items.length}</span>
      </div>
      <div className="mt-3 space-y-3">
        {items.map((item, i) => (
          <div key={i} className="border-l-2 border-black/10 pl-3">
            {Object.entries(item).map(([k, v]) => (
              <p key={k} className="text-xs">
                <span className="font-medium text-black/70 capitalize">{k.replace(/_/g, ' ')}:</span>{" "}
                <span className="text-black/55">{Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShadowDealHunt({ results }) {
  if (!results) {
    return <div className="rounded-sm border border-dashed border-black/20 p-8 text-center text-sm text-black/40">No deal hunt results yet. Run a hunt to discover opportunities.</div>;
  }
  const r = results.deal_hunt_results || results;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section icon={Zap} title="Distressed Opportunities" items={r.opportunities} color="text-red-600" />
      <Section icon={TrendingUp} title="Cross-County Arbitrage" items={r.arbitrage} color="text-amber-600" />
      <Section icon={Target} title="Zero-Competition Niches" items={r.niches} color="text-violet-600" />
      <Section icon={Eye} title="Competitor Intelligence" items={r.competitor_intel} color="text-blue-600" />
      <Section icon={AlertCircle} title="Emerging Trends" items={r.trends} color="text-emerald-600" />
    </div>
  );
}