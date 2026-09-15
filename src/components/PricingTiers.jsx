import React from "react";
import { Check, Minus } from "lucide-react";

const PLANS = [
  {
    name: "Starter", price: 49,
    tagline: "Explore the database",
    features: [["Browse properties", true], ["Search & filters", true], ["Basic property details", true], ["Ownership chain data", false], ["Place bids", false], ["ROI calculators", false]],
  },
  {
    name: "Pro", price: 149, featured: true,
    tagline: "For active investors",
    features: [["Everything in Starter", true], ["Full property details", true], ["Ownership chain + owner contacts", true], ["Place bids", true], ["ROI calculators", true], ["Market analytics", true]],
  },
  {
    name: "Elite", price: 499,
    tagline: "Institutional grade",
    features: [["Everything in Pro", true], ["Proxy (auto) bidding", true], ["Smart contract closing", true], ["Full analytics dashboard", true], ["Unlimited saved searches", true], ["Commercial properties", true]],
  },
];

export default function PricingTiers() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PLANS.map((p) => (
        <div
          key={p.name}
          className={`relative rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-1 ${
            p.featured ? "bg-[#0F2A1D] text-white ring-1 ring-[#0F2A1D]" : "bg-white ring-1 ring-[#E5EDEA]"
          }`}
        >
          {p.featured && (
            <span className="absolute right-6 top-6 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] uppercase tracking-widest">
              Popular
            </span>
          )}
          <p className={`text-sm ${p.featured ? "text-emerald-300" : "text-[#6B7B72]"}`}>{p.name}</p>
          <p className="mt-3 font-display text-4xl font-semibold tabular-nums">
            ${p.price}
            <span className={`text-base font-normal ${p.featured ? "text-white/60" : "text-[#6B7B72]"}`}>/mo</span>
          </p>
          <p className={`mt-1 text-sm ${p.featured ? "text-white/70" : "text-[#6B7B72]"}`}>{p.tagline}</p>

          <ul className="mt-6 space-y-3 text-sm">
            {p.features.map(([label, on]) => (
              <li key={label} className="flex items-start gap-2.5">
                {on
                  ? <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.featured ? "text-emerald-400" : "text-emerald-500"}`} />
                  : <Minus className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7B72]/50" />}
                <span className={on ? "" : "text-[#6B7B72]"}>{label}</span>
              </li>
            ))}
          </ul>

          <button
            className={`mt-7 w-full rounded-full py-3 text-sm font-medium transition-colors ${
              p.featured ? "bg-emerald-500 text-white hover:bg-emerald-400" : "bg-[#0F2A1D] text-white hover:bg-[#1A2B22]"
            }`}
          >
            Choose {p.name}
          </button>
        </div>
      ))}
    </div>
  );
}