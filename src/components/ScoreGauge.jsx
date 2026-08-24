import React from "react";

export default function ScoreGauge({ score = 0, size = 56, label }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = score >= 70 ? "#10B981" : score >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EFEFEB" strokeWidth="5" />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
            style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-semibold tabular-nums"
          style={{ color, fontSize: size * 0.3 }}
        >
          {Math.round(score)}
        </span>
      </div>
      {label && <span className="text-[10px] uppercase tracking-widest text-muted-text">{label}</span>}
    </div>
  );
}