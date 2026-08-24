import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import PropertyCard from "@/components/PropertyCard";
import FilterSidebar from "@/components/FilterSidebar";
import { Search, SlidersHorizontal } from "lucide-react";

const PER_PAGE = 12;

const DEFAULTS = {
  q: "", propertyTypes: [], distressTypes: [], maxPrice: 2000000,
  minScore: 0, minBeds: 0, maxDom: 0, sort: "score",
};

export default function Properties() {
  const [all, setAll] = useState(null);
  const [filters, setFilters] = useState(DEFAULTS);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    base44.entities.Property.filter({ status: "active" }, "-property_score", 300).then(setAll);
  }, []);

  useEffect(() => setPage(1), [filters]);

  const results = useMemo(() => {
    if (!all) return [];
    const q = filters.q.trim().toLowerCase();
    let list = all.filter((p) => {
      if (q && ![p.city, p.state, p.zip_code, p.address].some((v) => (v || "").toLowerCase().includes(q))) return false;
      if (filters.propertyTypes.length && !filters.propertyTypes.includes(p.property_type)) return false;
      if (filters.distressTypes.length && !filters.distressTypes.includes(p.distress_type)) return false;
      if ((p.proposed_asking_price || 0) > filters.maxPrice) return false;
      if ((p.property_score || 0) < filters.minScore) return false;
      if ((p.bedrooms || 0) < filters.minBeds) return false;
      if (filters.maxDom && (p.days_on_market || 0) > filters.maxDom) return false;
      return true;
    });
    const by = {
      score: (a, b) => (b.property_score || 0) - (a.property_score || 0),
      price: (a, b) => (a.proposed_asking_price || 0) - (b.proposed_asking_price || 0),
      newest: (a, b) => (a.days_on_market || 0) - (b.days_on_market || 0),
      value: (a, b) => (b.estimated_value || 0) - (a.estimated_value || 0),
    };
    return list.sort(by[filters.sort] || by.score);
  }, [all, filters]);

  const pageItems = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE));

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Distressed property search</h1>
      <p className="mt-2 text-sm text-[#6B7B72]">
        {all === null ? "Loading the database…" : `${results.length.toLocaleString()} properties match your criteria`}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-[#E5EDEA] focus-within:ring-2 focus-within:ring-emerald-400">
          <Search className="h-4 w-4 text-[#6B7B72]" />
          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="City, state, or ZIP code"
            className="w-full bg-transparent py-3 text-sm outline-none"
          />
        </div>
        <select
          value={filters.sort}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
          className="rounded-full bg-white px-4 py-3 text-sm ring-1 ring-[#E5EDEA] outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <option value="score">Score: high to low</option>
          <option value="price">Price: low to high</option>
          <option value="newest">Newest listings</option>
          <option value="value">Highest est. value</option>
        </select>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0F2A1D] px-4 py-3 text-sm text-white lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className={`${showFilters ? "block" : "hidden"} lg:block`}>
          <FilterSidebar filters={filters} setFilters={setFilters} />
        </div>

        <div>
          {all !== null && !results.length && (
            <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-[#E5EDEA]">
              <p className="font-medium">No properties match these filters</p>
              <p className="mt-1 text-sm text-[#6B7B72]">Try widening your price range or clearing distress types.</p>
            </div>
          )}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>

          {pages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`h-9 w-9 rounded-full text-sm tabular-nums transition-colors ${
                    n === page ? "bg-[#0F2A1D] text-white" : "bg-white ring-1 ring-[#E5EDEA] hover:bg-[#E5EDEA]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}