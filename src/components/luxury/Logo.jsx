import React from "react";

export function Mark({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      <rect x="7.5" y="7.5" width="25" height="25" rx="2" transform="rotate(45 20 20)" strokeWidth="1.5" />
      <rect x="14.5" y="14.5" width="11" height="11" rx="1" transform="rotate(45 20 20)" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Spread({ word }) {
  return (
    <span className="flex w-full justify-between">
      {word.split("").map((c, i) => (
        <span key={i}>{c}</span>
      ))}
    </span>
  );
}

export default function Logo({ variant = "dark", className = "" }) {
  const ink = variant === "light" ? "text-white" : "text-black";
  return (
    <div className={`flex items-center gap-3 ${ink} ${className}`}>
      <Mark className="h-8 w-8 shrink-0" />
      <div className="w-[6.75rem] text-[12px] font-medium uppercase leading-none">
        <Spread word="Property" />
        <div className="h-[3px]" />
        <Spread word="Intel" />
      </div>
    </div>
  );
}