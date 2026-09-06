import React from "react";

export default function PreflightGauge({ score, size = 180 }) {
  const r = (size - 24) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circ - (pct / 100) * circ;
  const color = score >= 80 ? "#247a45" : score >= 55 ? "#a6640b" : "#b33a31";
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7e1d6" strokeWidth="14" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="14"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-5xl font-light" style={{ color }}>{score}</p>
        <p className="text-[9px] uppercase tracking-[0.3em] text-black/40">System Score</p>
      </div>
    </div>
  );
}