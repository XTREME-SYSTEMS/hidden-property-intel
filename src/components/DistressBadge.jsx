import React from "react";

export const DISTRESS_TYPES = [
  "pre-foreclosure", "foreclosure", "probate_inherited", "tax_delinquent",
  "code_violation", "divorce", "bankruptcy", "auction", "short_sale", "bank_owned",
];

const STYLES = {
  "pre-foreclosure": "bg-amber-50 text-amber-700 ring-amber-200",
  foreclosure: "bg-red-50 text-red-700 ring-red-200",
  probate_inherited: "bg-violet-50 text-violet-700 ring-violet-200",
  tax_delinquent: "bg-orange-50 text-orange-700 ring-orange-200",
  code_violation: "bg-yellow-50 text-yellow-800 ring-yellow-200",
  divorce: "bg-pink-50 text-pink-700 ring-pink-200",
  bankruptcy: "bg-slate-100 text-slate-700 ring-slate-200",
  auction: "bg-blue-50 text-blue-700 ring-blue-200",
  short_sale: "bg-teal-50 text-teal-700 ring-teal-200",
  bank_owned: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export const labelFor = (t) => (t || "").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

export default function DistressBadge({ type, className = "" }) {
  if (!type) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${STYLES[type] || STYLES.bankruptcy} ${className}`}>
      {labelFor(type)}
    </span>
  );
}