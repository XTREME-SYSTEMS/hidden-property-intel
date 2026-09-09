import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, TrendingUp, Shield, Zap, ArrowRight, Database, Cpu, FileSignature } from "lucide-react";
import { base44 } from "@/api/base44Client";
import V2PropertyCard from "@/components/v2/V2PropertyCard";

export default function V2Home() {
  const [query, setQuery] = useState("");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Property.list("-created_date", 8);
        setProperties(Array.isArray(list) ? list : []);
      } catch (e) {
        setProperties([]);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="v2-hero">
        <div className="v2-hero-inner">
          <h1>Find <em>off-market</em> distressed properties before anyone else.</h1>
          <p className="sub">AI-powered court records, assessor data, and 15-category enrichment — scored, skip-traced, and ready to close.</p>

          {/* Search */}
          <div className="v2-search">
            <div className="v2-search-input">
              <Search size={20} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter city, ZIP, or address"
              />
            </div>
            <div className="v2-search-divider" />
            <button className="v2-search-filter">
              <SlidersHorizontal size={16} /> Filters
            </button>
            <button className="v2-btn v2-btn-accent v2-search-btn">
              <Search size={18} /> Search
            </button>
          </div>

          {/* Quick chips */}
          <div className="v2-chips">
            <Link to="/v2" className="v2-chip">Pre-foreclosures</Link>
            <Link to="/v2" className="v2-chip">Probate</Link>
            <Link to="/v2" className="v2-chip">Tax delinquent</Link>
            <Link to="/v2" className="v2-chip">Code violations</Link>
            <Link to="/v2" className="v2-chip">Waterfront</Link>
            <Link to="/v2" className="v2-chip">Under $150k</Link>
          </div>

          {/* Stats */}
          <div className="v2-stats">
            <div className="v2-stat"><b>12,400+</b><span>Active distressed properties</span></div>
            <div className="v2-stat"><b>15</b><span>Enrichment data categories</span></div>
            <div className="v2-stat"><b>300+</b><span>Filter criteria</span></div>
            <div className="v2-stat"><b>6</b><span>Outreach channels</span></div>
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section className="v2-section v2-container">
        <div className="v2-section-head">
          <div>
            <h2>Featured distressed properties</h2>
            <p>Fresh off the scrape pipeline — scored and enriched.</p>
          </div>
          <Link to="/v2" className="v2-link">See all listings →</Link>
        </div>

        {loading ? (
          <div className="v2-loading">
            <div className="v2-spinner" />
            Loading properties…
          </div>
        ) : properties.length === 0 ? (
          <div className="v2-loading">No properties yet — the scrape pipeline is warming up.</div>
        ) : (
          <div className="v2-grid">
            {properties.map((p) => <V2PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="v2-section v2-container">
        <div className="v2-section-head">
          <div>
            <h2>Built for serious investors</h2>
            <p>Everything from discovery to closing — in one platform.</p>
          </div>
        </div>
        <div className="v2-features">
          <div className="v2-feature">
            <div className="v2-feature-icon"><Database size={22} /></div>
            <h3>Court-sourced leads</h3>
            <p>Divorce, eviction, probate, foreclosure, and tax delinquency records scraped daily from protected county sites.</p>
          </div>
          <div className="v2-feature">
            <div className="v2-feature-icon"><Cpu size={22} /></div>
            <h3>AI scoring & enrichment</h3>
            <p>9,000-attribute enrichment, computer-vision condition scoring, and multi-signal distress prediction on every property.</p>
          </div>
          <div className="v2-feature">
            <div className="v2-feature-icon"><FileSignature size={22} /></div>
            <h3>On-chain escrow closing</h3>
            <p>Polygon smart contracts for earnest money, digital signatures, and title — close deals without a title office.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="v2-container">
        <div className="v2-cta">
          <div>
            <h2>Start finding deals today</h2>
            <p>Free to browse. Upgrade for full enrichment, skip-trace, and outreach automation.</p>
          </div>
          <Link to="/v2" className="v2-btn v2-btn-accent" style={{ height: 48, padding: "0 28px" }}>
            Get started free <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}