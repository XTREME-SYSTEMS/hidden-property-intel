import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import V2PropertyCard from "@/components/v2/V2PropertyCard";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Seo from "@/components/Seo";

const DISTRESS_OPTIONS = [
  { value: "pre-foreclosure", label: "Pre-Foreclosure" },
  { value: "foreclosure", label: "Foreclosure" },
  { value: "probate_inherited", label: "Probate" },
  { value: "tax_delinquent", label: "Tax Delinquent" },
  { value: "code_violation", label: "Code Violation" },
  { value: "divorce", label: "Divorce" },
  { value: "bankruptcy", label: "Bankruptcy" },
  { value: "auction", label: "Auction" },
  { value: "short_sale", label: "Short Sale" },
  { value: "bank_owned", label: "Bank Owned" },
];
const TYPE_OPTIONS = ["residential", "commercial", "land", "multi-family", "mixed-use"];
const PER_PAGE = 12;

export default function V2Listings() {
  const [searchParams] = useSearchParams();
  const [all, setAll] = useState(null);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [distress, setDistress] = useState([]);
  const [types, setTypes] = useState([]);
  const [maxPrice, setMaxPrice] = useState(2000000);
  const [minScore, setMinScore] = useState(0);
  const [minBeds, setMinBeds] = useState(0);
  const [sort, setSort] = useState("score");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    base44.entities.Property.filter({ status: "active" }, "-property_score", 300)
      .then(setAll)
      .catch(() => setAll([]));
  }, []);
  useEffect(() => setPage(1), [q, distress, types, maxPrice, minScore, minBeds, sort]);

  const results = useMemo(() => {
    if (!all) return [];
    const s = q.trim().toLowerCase();
    let list = all.filter((p) => {
      if (s && ![p.address, p.city, p.state, p.zip_code].some((v) => (v || "").toLowerCase().includes(s))) return false;
      if (distress.length && !distress.includes(p.distress_type)) return false;
      if (types.length && !types.includes(p.property_type)) return false;
      if ((p.proposed_asking_price || p.estimated_value || 0) > maxPrice) return false;
      if ((p.property_score || 0) < minScore) return false;
      if (minBeds && (p.bedrooms || 0) < minBeds) return false;
      return true;
    });
    const by = {
      score: (a, b) => (b.property_score || 0) - (a.property_score || 0),
      priceAsc: (a, b) => (a.proposed_asking_price || 0) - (b.proposed_asking_price || 0),
      priceDesc: (a, b) => (b.proposed_asking_price || 0) - (a.proposed_asking_price || 0),
      newest: (a, b) => (a.days_on_market || 0) - (b.days_on_market || 0),
    };
    return list.sort(by[sort] || by.score);
  }, [all, q, distress, types, maxPrice, minScore, minBeds, sort]);

  const pageItems = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const toggle = (val, arr, set) => set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  const activeCount = distress.length + types.length + (minScore > 0 ? 1 : 0) + (minBeds > 0 ? 1 : 0) + (maxPrice < 2000000 ? 1 : 0);
  const clearAll = () => { setDistress([]); setTypes([]); setMaxPrice(2000000); setMinScore(0); setMinBeds(0); };

  return (
    <div className="z-listings">
      <Seo
        title="Distressed Property Listings — Off-Market Real Estate"
        description="Browse off-market distressed properties: pre-foreclosures, probate, tax-delinquent, code-violation, and auction properties. AI-scored for investment quality."
        path="/v2/listings"
      />

      {/* Toolbar */}
      <div className="z-list-toolbar">
        <div className="z-list-toolbar-inner">
          <div className="z-search-field">
            <Search size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Address, city, or ZIP" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="score">Score · High to Low</option>
            <option value="priceAsc">Price · Low to High</option>
            <option value="priceDesc">Price · High to Low</option>
            <option value="newest">Newest</option>
          </select>
          <button className="z-filter-toggle" onClick={() => setShowFilters((s) => !s)}>
            <SlidersHorizontal size={16} /> Filters {activeCount > 0 && <span className="z-filter-count">{activeCount}</span>}
          </button>
          <span className="z-result-count">{all === null ? "Loading…" : `${results.length} results`}</span>
        </div>
      </div>

      <div className="z-list-layout">
        {/* Filters */}
        <aside className={`z-filters ${showFilters ? "open" : ""}`}>
          <div className="z-filter-head">
            <h3>Filters</h3>
            {activeCount > 0 && <button className="z-clear" onClick={clearAll}>Clear all</button>}
          </div>

          <div className="z-filter-group">
            <h4>Distress type</h4>
            <div className="z-checks">
              {DISTRESS_OPTIONS.map((o) => (
                <label key={o.value} className="z-check">
                  <input type="checkbox" checked={distress.includes(o.value)} onChange={() => toggle(o.value, distress, setDistress)} />
                  {o.label}
                </label>
              ))}
            </div>
          </div>

          <div className="z-filter-group">
            <h4>Max price</h4>
            <div className="z-range">
              <input type="range" min={50000} max={2000000} step={25000} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
              <b>${maxPrice.toLocaleString()}</b>
            </div>
          </div>

          <div className="z-filter-group">
            <h4>Min AI score</h4>
            <div className="z-range">
              <input type="range" min={0} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
              <b>{minScore}+</b>
            </div>
          </div>

          <div className="z-filter-group">
            <h4>Bedrooms</h4>
            <div className="z-chip-row">
              {[0, 1, 2, 3, 4].map((n) => (
                <button key={n} className={`z-chip-btn ${minBeds === n ? "active" : ""}`} onClick={() => setMinBeds(n)}>
                  {n === 0 ? "Any" : `${n}+`}
                </button>
              ))}
            </div>
          </div>

          <div className="z-filter-group">
            <h4>Property type</h4>
            <div className="z-checks">
              {TYPE_OPTIONS.map((t) => (
                <label key={t} className="z-check">
                  <input type="checkbox" checked={types.includes(t)} onChange={() => toggle(t, types, setTypes)} />
                  {t.replace("-", " ")}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="z-list-results">
          {all === null ? (
            <div className="v2-loading"><div className="v2-spinner" /> Loading properties…</div>
          ) : results.length === 0 ? (
            <div className="z-empty">
              <h3>No properties match your filters</h3>
              <p>Try widening your price range or clearing some filters.</p>
              {activeCount > 0 && <button className="z-clear" onClick={clearAll}>Clear all filters</button>}
            </div>
          ) : (
            <>
              <div className="z-list-grid">
                {pageItems.map((p) => <V2PropertyCard key={p.id} property={p} />)}
              </div>
              {pages > 1 && (
                <div className="z-pagination">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                    <button key={n} className={`z-page-btn ${n === page ? "active" : ""}`} onClick={() => setPage(n)}>{n}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}