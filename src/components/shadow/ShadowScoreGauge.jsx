import React from "react";

export default function ShadowScoreGauge({ score, delta }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#247a45" : score >= 50 ? "#a6640b" : "#b33a31";
  const status = score >= 80 ? "Healthy" : score >= 50 ? "Degraded" : "Critical";

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-44 w-44">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#e7e1d6" strokeWidth="12" />
          <circle
            cx="100" cy="100" r={radius} fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-5xl font-light tabular-nums" style={{ color }}>{score}</span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-black/40">/ 100</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium" style={{ color }}>{status}</p>
      {delta !== undefined && delta !== 0 && (
        <p className={`text-xs ${delta > 0 ? "text-emerald-600" : "text-red-600"}`}>
          {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} pts since last audit
        </p>
      )}
    </div>
  );
}