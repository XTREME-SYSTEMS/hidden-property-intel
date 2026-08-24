import React from "react";

export function Mark({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M4 19 L13 9 L22 19" />
      <path d="M7 19 L7 33 L19 33 L19 19" />
      <path d="M11 33 L11 26 L15 26 L15 33" />
      <path d="M23 33 L23 14 L34 14 L34 33" />
      <path d="M26 19 L26 21 M31 19 L31 21 M26 24 L26 26 M31 24 L31 26" />
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