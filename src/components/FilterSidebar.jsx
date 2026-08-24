import React from "react";
import { DISTRESS_TYPES, labelFor } from "@/components/DistressBadge";

const PROPERTY_TYPES = ["residential", "commercial", "land", "multi-family", "mixed-use"];

function Section({ title, children }) {
  return (
    <div className="border-b border-[#E5EDEA] pb-5">
      <p className="mb-3 text-[11px] uppercase tracking-widest text-[#6B7B72]">{title}</p>
      {children}
    </div>
  );
}

function Check({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-[#1A2B22]">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-[#E5EDEA] accent-emerald-500" />
      {label}
    </label>
  );
}

export default function FilterSidebar({ filters, setFilters }) {
  const toggle = (key, value) =>
    setFilters((f) => {
      const list = f[key];
      return { ...f, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });

  return (
    <aside className="space-y-5">
      <Section title="Property type">
        {PROPERTY_TYPES.map((t) => (
          <Check key={t} label={labelFor(t)} checked={filters.propertyTypes.includes(t)} onChange={() => toggle("propertyTypes", t)} />
        ))}
      </Section>

      <Section title="Distress type">
        <div className="max-h-56 overflow-y-auto pr-1">
          {DISTRESS_TYPES.map((t) => (
            <Check key={t} label={labelFor(t)} checked={filters.distressTypes.includes(t)} onChange={() => toggle("distressTypes", t)} />
          ))}
        </div>
      </Section>

      <Section title="Max asking price">
        <input
          type="range" min={50000} max={2000000} step={25000} value={filters.maxPrice}
          onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))}
          className="w-full accent-emerald-500"
        />
        <p className="mt-1 text-sm tabular-nums text-[#1A2B22]">Up to ${filters.maxPrice.toLocaleString()}</p>
      </Section>

      <Section title="Minimum score">
        <input
          type="range" min={0} max={100} value={filters.minScore}
          onChange={(e) => setFilters((f) => ({ ...f, minScore: Number(e.target.value) }))}
          className="w-full accent-emerald-500"
        />
        <p className="mt-1 text-sm tabular-nums text-[#1A2B22]">{filters.minScore}+</p>
      </Section>

      <Section title="Bedrooms">
        <select
          value={filters.minBeds}
          onChange={(e) => setFilters((f) => ({ ...f, minBeds: Number(e.target.value) }))}
          className="w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-[#E5EDEA] outline-none focus:ring-2 focus:ring-emerald-400"
        >
          {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n === 0 ? "Any" : `${n}+`}</option>)}
        </select>
      </Section>

      <Section title="Days on market">
        <select
          value={filters.maxDom}
          onChange={(e) => setFilters((f) => ({ ...f, maxDom: Number(e.target.value) }))}
          className="w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-[#E5EDEA] outline-none focus:ring-2 focus:ring-emerald-400"
        >
          {[0, 7, 14, 30, 60, 90].map((n) => <option key={n} value={n}>{n === 0 ? "Any" : `${n} days or less`}</option>)}
        </select>
      </Section>

      <button
        onClick={() => setFilters({ q: filters.q, propertyTypes: [], distressTypes: [], maxPrice: 2000000, minScore: 0, minBeds: 0, maxDom: 0, sort: "score" })}
        className="text-xs text-[#6B7B72] underline hover:text-[#1A2B22]"
      >
        Clear all filters
      </button>
    </aside>
  );
}