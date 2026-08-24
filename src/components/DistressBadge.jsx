import React from "react";

export const DISTRESS_TYPES = [
  "pre-foreclosure", "foreclosure", "probate_inherited", "tax_delinquent",
  "code_violation", "divorce", "bankruptcy", "auction", "short_sale", "bank_owned",
];

export const labelFor = (t) => (t || "").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

export default function DistressBadge({ type, className = "" }) {
  if (!type) return null;
  return (
    <span className={`inline-flex items-center rounded-full bg-[#c5a059]/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-[#c5a059] ring-1 ring-inset ring-[#c5a059]/30 ${className}`}>
      {labelFor(type)}
    </span>
  );
}