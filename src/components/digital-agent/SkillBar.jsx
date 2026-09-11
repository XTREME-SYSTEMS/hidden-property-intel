import React from "react";

// Reusable 1-10 skill level bar — light theme.
export default function SkillBar({ label, level, category, max = 10 }) {
  const pct = (level / max) * 100;
  const color = level >= 9 ? "#247a45" : level >= 7 ? "#c38a1b" : level >= 5 ? "#a6640b" : "#6f6a60";
  return (
    <div className="flex items-center gap-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate text-[11px] font-medium text-[#12110f]">{label}</span>
          <span className="shrink-0 text-[10px] font-mono font-bold" style={{ color }}>{level}/{max}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e7e1d6]">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
        {category && <span className="mt-0.5 block text-[9px] uppercase tracking-wider text-[#6f6a60]">{category}</span>}
      </div>
    </div>
  );
}