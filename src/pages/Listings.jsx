import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { IMAGES } from "@/lib/luxury";
import { Image } from "@/components/ui/image";
import MarketplaceCard from "@/components/luxury/MarketplaceCard";
import { DISTRESS_TYPES, labelFor } from "@/components/DistressBadge";
import { Search, SlidersHorizontal, Map as MapIcon, List, X } from "lucide-react";

const PER_PAGE = 12;
const PROPERTY_TYPES = ["residential", "commercial", "land", "multi-family", "mixed-use"];

export default function Listings() {
  const [all, setAll] = useState(null);
  const [q, setQ] = useState("");
  const [distress, setDistress] = useState([]);
  const [types, setTypes] = useState([]);
  const [maxPrice, setMaxPrice] = useState(2000000);
  const [minScore, setMinScore] = useState(0);
  const [sort, setSort] = useState("score");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    base44.entities.Property.filter({ status: "active" }, "-property_score", 300).then(setAll).catch(() => setAll([]));
  }, []);
  useEffect(() => setPage(1), [q, distress, types, maxPrice, minScore, sort]);

  const results = useMemo(() => {
    if (!all) return [];
    const s = q.trim().toLowerCase();
    let list = all.filter((p) => {
      if (s && ![p.address, p.city, p.state, p.zip_code].some((v) => (v || "").toLowerCase().includes(s))) return false;
      if (distress.length && !distress.includes(p.distress_type)) return false;
      if (types.length && !types.includes(p.property_type)) return false;
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
  }, [all, q, distress, types, maxPrice, minScore, sort]);

  const pageItems = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const toggle = (t, arr, set) => set(arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]);

  const FilterContent = () => (
    <div className="space-y-7">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#707070]">Location</p>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#e0e0e0] px-3">
          <Search className="h-4 w-4 text-[#707070]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="City, state, ZIP…" className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-[#707070]" />
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#707070]">Property Type</p>
        <div className="mt-3 space-y-2">
          {PROPERTY_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2.5 text-sm capitalize cursor-pointer">
              <input type="checkbox" checked={types.includes(t)} onChange={() => toggle(t, types, setTypes)} className="h-4 w-4 accent-[#c5a059]" />
              {labelFor(t)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#707070]">Max Price</p>
          <span className="text-xs tabular-nums text-[#0a0a0a]">${maxPrice.toLocaleString()}</span>
        </div>
        <input type="range" min={50000} max={2000000} step={25000} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="mt-2 w-full accent-[#c5a059]" />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#707070]">Min HPI Score</p>
          <span className="text-xs tabular-nums text-[#0a0a0a]">{minScore}+</span>
        </div>
        <input type="range" min={0} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="mt-2 w-full accent-[#c5a059]" />
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#707070]">Distress Types</p>
        <div className="mt-3 space-y-2">
          {DISTRESS_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" checked={distress.includes(t)} onChange={() => toggle(t, distress, setDistress)} className="h-4 w-4 accent-[#c5a059]" />
              {labelFor(t)}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="relative overflow-hidden bg-[#0a0a0a] px-6 py-16 text-white lg:px-12 lg:py-20">
        <Image src={IMAGES.aerial} alt="" fittingType="fill" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 to-[#0a0a0a]" />
        <div className="relative mx-auto max-w-[1400px]">
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#c5a059]">Marketplace</p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Off-market inventory.</h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/60">
            {all === null ? "Loading…" : `${results.length.toLocaleString()} distressed properties available right now.`}
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/map" className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-white hover:border-[#c5a059] hover:text-[#c5a059]">
              <MapIcon className="h-4 w-4" /> Map view
            </Link>
          </div>
        </div>
      </section>

      {/* Mobile filter toggle */}
      <div className="border-b border-[#e0e0e0] px-6 py-4 lg:hidden">
        <button onClick={() => setShowFilters(!showFilters)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e0e0e0] py-3 text-[11px] uppercase tracking-[0.2em]">
          <SlidersHorizontal className="h-4 w-4" /> Filters {distress.length + types.length > 0 && `(${distress.length + types.length})`}
        </button>
        {showFilters && (
          <div className="mt-4 rounded-xl border border-[#e0e0e0] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Filters</p>
              <button onClick={() => setShowFilters(false)}><X className="h-4 w-4 text-[#707070]" /></button>
            </div>
            <div className="mt-4"><FilterContent /></div>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <section className="mx-auto max-w-[1400px] px-6 py-8 lg:px-12 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-xl border border-[#e0e0e0] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Filters</p>
                {(distress.length > 0 || types.length > 0 || q) && (
                  <button onClick={() => { setDistress([]); setTypes([]); setQ(""); }} className="text-[10px] uppercase tracking-[0.15em] text-[#c5a059]">Clear</button>
                )}
              </div>
              <div className="mt-5"><FilterContent /></div>
            </div>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-[#707070]">{results.length} {results.length === 1 ? "property" : "properties"}</p>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-[#e0e0e0] bg-white px-3 py-2 text-[11px] uppercase tracking-[0.15em] outline-none">
                <option value="score">Score · High to Low</option>
                <option value="priceAsc">Price · Low to High</option>
                <option value="priceDesc">Price · High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            <div className="space-y-4">
              {pageItems.map((p) => <MarketplaceCard key={p.id} property={p} />)}
            </div>

            {all !== null && !results.length && (
              <div className="py-24 text-center">
                <p className="font-display text-2xl font-light">No properties match your criteria.</p>
                <p className="mt-2 text-sm text-[#707070]">Adjust your filters or broaden your search.</p>
              </div>
            )}

            {pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setPage(n)} className={`h-9 w-9 rounded-lg text-sm tabular-nums transition-colors ${n === page ? "bg-[#c5a059] text-[#0a0a0a]" : "border border-[#e0e0e0] hover:bg-[#f5f5f5]"}`}>{n}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}