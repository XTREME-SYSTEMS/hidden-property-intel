import React from "react";
import { FileText, CheckCircle2, AlertTriangle, TrendingUp, Target, Eye, Zap } from "lucide-react";

export default function ShadowBrief({ brief, topProperties }) {
  if (!brief) {
    return <div className="rounded-sm border border-dashed border-black/20 p-8 text-center text-sm text-black/40">No morning brief yet. Generate one to get your daily intelligence summary.</div>;
  }
  const sections = brief.brief_sections || brief;
  return (
    <div className="space-y-4">
      <div className="rounded-sm border border-black/10 bg-gradient-to-br from-[#0c0d0e] to-[#1a1a1a] p-6 text-white">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#e4b653]" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Morning Brief</p>
        </div>
        <h3 className="mt-3 font-display text-xl font-light leading-snug">{sections.headline || brief.morning_brief?.split('\n')[0]}</h3>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BriefCard icon={CheckCircle2} title="System Status" text={sections.system_status} color="text-emerald-600" />
        <BriefCard icon={TrendingUp} title="Revenue Summary" text={sections.revenue_summary} color="text-amber-600" />
        <BriefCard icon={Eye} title="Competitive Intel" text={sections.competitive_intel} color="text-blue-600" />
        <BriefList icon={Target} title="Action Items" items={sections.action_items} color="text-violet-600" />
        <BriefList icon={Zap} title="Opportunities" items={sections.opportunities} color="text-emerald-600" />
        <BriefList icon={AlertTriangle} title="Risks" items={sections.risks} color="text-red-600" />
      </div>

      {topProperties?.length > 0 && (
        <div className="rounded-sm border border-black/10 bg-white p-5">
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-black/40">Top Properties by Score</p>
          <div className="space-y-2">
            {topProperties.map((p, i) => (
              <div key={i} className="flex items-center justify-between border-t border-black/5 pt-2 first:border-0">
                <div>
                  <p className="text-xs font-medium text-black/80">{p.address}</p>
                  <p className="text-[10px] text-black/40">{p.city} · {p.distress_type}</p>
                </div>
                <div className="flex items-center gap-3">
                  {p.estimated_value && <span className="text-xs text-black/50">${(p.estimated_value / 1000).toFixed(0)}k</span>}
                  <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-[#e4b653]">{p.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BriefCard({ icon: Icon, title, text, color }) {
  return (
    <div className="rounded-sm border border-black/10 bg-white p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">{title}</p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-black/65">{text}</p>
    </div>
  );
}

function BriefList({ icon: Icon, title, items, color }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-sm border border-black/10 bg-white p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">{title}</p>
      </div>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-xs text-black/65">
            <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${color.replace('text-', 'bg-')}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}