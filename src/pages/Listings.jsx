import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { IMAGES } from "@/lib/luxury";
import { Image } from "@/components/ui/image";
import LuxuryListingCard from "@/components/luxury/LuxuryListingCard";
import { DISTRESS_TYPES, labelFor } from "@/components/DistressBadge";
import { Search, SlidersHorizontal } from "lucide-react";

const PER_PAGE = 9;

export default function Listings() {
  const [all, setAll] = useState(null);
  const [q, setQ] = useState("");
  const [distress, setDistress] = useState([]);
  const [maxPrice, setMaxPrice] = useState(2000000);
  const [minScore, setMinScore] = useState(0);
  const [sort, setSort] = useState("score");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    base44.entities.Property.filter({ status: "active" }, "-property_score", 300).then(setAll).catch(() => setAll([]));
  }, []);
  useEffect(() => setPage(1), [q, distress, maxPrice, minScore, sort]);

  const results = useMemo(() => {
    if (!all) return [];
    const s = q.trim().toLowerCase();
    let list = all.filter((p) => {
      if (s && ![p.address, p.city, p.state, p.zip_code].some((v) => (v || "").toLowerCase().includes(s))) return false;
      if (distress.length && !distress.includes(p.distress_type)) return false;
      if ((p.proposed_asking_price || 0) > maxPrice) return false;
      if ((p.property_score || 0) < minScore) return false;
      return true;
    });
    const by = {
      score: (a, b) => (b.property_score || 0) - (a.property_score || 0),
      priceAsc: (a, b) => (a.proposed_asking_price || 0) - (b.proposed_asking_price || 0),
      priceDesc: (a, b) => (b.proposed_asking_price || 0) - (a.proposed_asking_price || 0),
      newest: (a, b) => (a.days_on_market || 0) - (b.days_on_market || 0),
    };
    return list.sort(by[sort] || by.score);
  }, [all, q, distress, maxPrice, minScore, sort]);

  const pageItems = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const toggle = (t) => setDistress((d) => (d.includes(t) ? d.filter((x) => x !== t) : [...d, t]));

  return (
    <div>
      <section className="relative overflow-hidden border-b border-black/10 bg-black px-6 py-20 text-white lg:px-12 lg:py-28">
        <Image src={IMAGES.aerial} alt="" fittingType="fill" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/85" />
        <div className="relative mx-auto max-w-[1400px]">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/50">Distressed inventory</p>
          <h1 className="mt-5 font-display text-5xl font-light tracking-tight sm:text-6xl">Off-market properties, refreshed daily.</h1>
          <p className="mt-6 max-w-lg leading-relaxed text-white/60">
            {all === null ? "Loading the database…" : `${results.length.toLocaleString()} distressed, inherited, and under-stress properties available right now.`}
          </p>
        </div>
      </section>

      {/* Controls */}
      <section className="sticky top-20 z-30 border-b border-black/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:px-12">
          <div className="flex flex-1 items-center gap-3 rounded-sm border border-black/15 px-4">
            <Search className="h-4 w-4 text-black/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by address, city, state, or ZIP" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-black/40" />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 md:flex">
              <span className="text-[10px] uppercase tracking-[0.3em] text-black/40">Max</span>
              <input type="range" min={50000} max={2000000} step={25000} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-40 accent-black" />
              <span className="w-24 text-xs tabular-nums text-black/60">${maxPrice.toLocaleString()}</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-black/40">Score</span>
              <input type="range" min={0} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="w-28 accent-black" />
              <span className="w-10 text-xs tabular-nums text-black/60">{minScore}+</span>
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-sm border border-black/15 bg-white px-4 py-3 text-[11px] uppercase tracking-[0.2em] outline-none">
              <option value="score">Score · High to Low</option>
              <option value="priceAsc">Price · Low to High</option>
              <option value="priceDesc">Price · High to Low</option>
              <option value="newest">Newest</option>
            </select>
            <button onClick={() => setShowFilters(!showFilters)} className="rounded-sm border border-black/15 p-3 lg:hidden" aria-label="Filters">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Distress chips */}
        <div className="mx-auto max-w-[1400px] px-6 pb-5 lg:px-12">
          <div className="flex flex-wrap gap-2">
            {DISTRESS_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => toggle(t)}
                className={`rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors ${
                  distress.includes(t) ? "bg-black text-white" : "border border-black/15 text-black/60 hover:border-black/40"
                }`}
              >
                {labelFor(t)}
              </button>
            ))}
          </div>
          {showFilters && (
            <div className="mt-4 grid grid-cols-2 gap-4 lg:hidden">
              <label className="text-[10px] uppercase tracking-[0.3em] text-black/40">
                Max price
                <input type="range" min={50000} max={2000000} step={25000} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="mt-2 w-full accent-black" />
                <span className="mt-1 block text-xs tabular-nums text-black/60">${maxPrice.toLocaleString()}</span>
              </label>
              <label className="text-[10px] uppercase tracking-[0.3em] text-black/40">
                Min score
                <input type="range" min={0} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="mt-2 w-full accent-black" />
                <span className="mt-1 block text-xs tabular-nums text-black/60">{minScore}+</span>
              </label>
            </div>
          )}
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12">
        <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((p) => <LuxuryListingCard key={p.id} property={p} />)}
        </div>
        {all !== null && !results.length && (
          <div className="py-24 text-center">
            <p className="font-display text-2xl font-light">No properties match your criteria.</p>
            <p className="mt-2 text-sm text-black/50">Adjust your filters or broaden your search.</p>
          </div>
        )}
        {pages > 1 && (
          <div className="mt-14 flex items-center justify-center gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)} className={`h-9 w-9 rounded-sm text-sm tabular-nums transition-colors ${n === page ? "bg-black text-white" : "border border-black/15 hover:bg-black/5"}`}>{n}</button>
            ))}
          </div>
        )}
      </section>

      {/* Concierge strip */}
      <section className="bg-black px-6 py-20 text-center text-white lg:px-12">
        <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">Hidden Property Intel Concierge</p>
        <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-light tracking-tight sm:text-4xl">Selling a distressed property? List free and get a cash offer.</h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/60">No commissions. AI pricing and negotiation assistant included. Close on your timeline.</p>
      </section>
    </div>
  );
}