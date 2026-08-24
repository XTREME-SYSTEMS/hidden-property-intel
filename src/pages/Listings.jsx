import React, { useMemo, useState } from "react";
import { Image } from "@/components/ui/image";
import { ESTATES, money } from "@/lib/luxury";
import EstateCard from "@/components/luxury/EstateCard";
import { Search, SlidersHorizontal } from "lucide-react";

const SORTS = {
  priceDesc: (a, b) => b.price - a.price,
  priceAsc: (a, b) => a.price - b.price,
  sqft: (a, b) => b.sqft - a.sqft,
};

export default function Listings() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("priceDesc");
  const [max, setMax] = useState(40000000);
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(() => {
    const f = ESTATES.filter((e) => e.price <= max);
    const s = q.trim().toLowerCase();
    const filtered = s ? f.filter((e) => [e.name, e.location].join(" ").toLowerCase().includes(s)) : f;
    return [...filtered].sort(SORTS[sort]);
  }, [q, sort, max]);

  return (
    <div>
      {/* Banner */}
      <section className="border-b border-black/10 bg-black px-6 py-20 text-white lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/50">The Portfolio</p>
          <h1 className="mt-5 font-display text-5xl font-light tracking-tight sm:text-6xl">The full collection</h1>
          <p className="mt-6 max-w-lg leading-relaxed text-white/60">
            {ESTATES.length} residences currently held by Maison. Filter by location, refine by price, and request
            a private viewing of any that meet your criteria.
          </p>
        </div>
      </section>

      {/* Controls */}
      <section className="sticky top-20 z-30 border-b border-black/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:px-12">
          <div className="flex flex-1 items-center gap-3 rounded-sm border border-black/15 px-4">
            <Search className="h-4 w-4 text-black/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by residence or location"
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-black/40"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-[10px] uppercase tracking-[0.3em] text-black/40">Max</span>
              <input
                type="range" min={10000000} max={40000000} step={500000} value={max}
                onChange={(e) => setMax(Number(e.target.value))}
                className="w-40 accent-black"
              />
              <span className="w-20 text-xs tabular-nums text-black/60">{money(max)}</span>
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-sm border border-black/15 bg-white px-4 py-3 text-[11px] uppercase tracking-[0.2em] outline-none"
            >
              <option value="priceDesc">Price · High to Low</option>
              <option value="priceAsc">Price · Low to High</option>
              <option value="sqft">Largest</option>
            </select>
            <button onClick={() => setShowFilters(!showFilters)} className="rounded-sm border border-black/15 p-3 lg:hidden">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
        {showFilters && (
          <div className="border-t border-black/10 px-6 py-5 lg:hidden">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.3em] text-black/40">Max</span>
              <input type="range" min={10000000} max={40000000} step={500000} value={max} onChange={(e) => setMax(Number(e.target.value))} className="flex-1 accent-black" />
              <span className="text-xs tabular-nums">{money(max)}</span>
            </div>
          </div>
        )}
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12">
        <p className="mb-8 text-[11px] uppercase tracking-[0.3em] text-black/40">
          {results.length} residence{results.length === 1 ? "" : "s"}
        </p>
        <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((e) => <EstateCard key={e.id} estate={e} />)}
        </div>
        {!results.length && (
          <div className="py-24 text-center">
            <p className="font-display text-2xl font-light">No residences match your criteria.</p>
            <p className="mt-2 text-sm text-black/50">Adjust your filters or broaden your search.</p>
          </div>
        )}
      </section>

      {/* Concierge strip */}
      <section className="bg-black px-6 py-20 text-center text-white lg:px-12">
        <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">Maison Concierge</p>
        <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-light tracking-tight sm:text-4xl">
          Can't find what you're seeking? We source off-market.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/60">
          A significant portion of our collection never reaches the public portfolio. Share your requirements and
          our advisory team will curate privately.
        </p>
      </section>
    </div>
  );
}