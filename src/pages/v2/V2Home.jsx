import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, ArrowRight, Database, Cpu, FileSignature, Smartphone, Apple, Check, Zap, ShieldCheck, Bell, TrendingUp, MapPin, Clock } from "lucide-react";
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
      {/* ===== Hero with image ===== */}
      <section className="v2-hero">
        <div className="v2-container">
          <div className="v2-hero-grid">
            <div className="v2-hero-copy">
              <span className="v2-eyebrow">AI-powered distressed property intelligence</span>
              <h1>Find <em>off-market</em> deals before anyone else.</h1>
              <p className="sub">Court records, assessor data, and 15-category enrichment — scored, skip-traced, and ready to close. Built for serious Florida investors.</p>

              <div className="v2-search">
                <div className="v2-search-input">
                  <Search size={20} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter city, ZIP, or address" />
                </div>
                <div className="v2-search-divider" />
                <button className="v2-search-filter"><SlidersHorizontal size={16} /> Filters</button>
                <button className="v2-btn v2-btn-accent v2-search-btn"><Search size={18} /> Search</button>
              </div>

              <div className="v2-chips">
                <Link to="/v2" className="v2-chip">Pre-foreclosures</Link>
                <Link to="/v2" className="v2-chip">Probate</Link>
                <Link to="/v2" className="v2-chip">Tax delinquent</Link>
                <Link to="/v2" className="v2-chip">Code violations</Link>
                <Link to="/v2" className="v2-chip">Waterfront</Link>
                <Link to="/v2" className="v2-chip">Under $150k</Link>
              </div>
            </div>

            <div className="v2-hero-visual">
              <img src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80" alt="Distressed property" />
              <div className="v2-hero-float">
                <div className="ring"><b>82</b></div>
                <div className="txt"><b>Investor Score</b><span>AI-enriched · Pre-foreclosure</span></div>
              </div>
            </div>
          </div>

          <div className="v2-stats">
            <div className="v2-stat"><b>12,400+</b><span>Active distressed properties</span></div>
            <div className="v2-stat"><b>15</b><span>Enrichment data categories</span></div>
            <div className="v2-stat"><b>300+</b><span>Filter criteria</span></div>
            <div className="v2-stat"><b>6</b><span>Outreach channels</span></div>
          </div>
        </div>
      </section>

      {/* ===== Featured listings ===== */}
      <section className="v2-section v2-container">
        <div className="v2-section-head">
          <div>
            <h2>Featured distressed properties</h2>
            <p>Fresh off the scrape pipeline — scored and enriched.</p>
          </div>
          <Link to="/v2" className="v2-link">See all listings →</Link>
        </div>
        {loading ? (
          <div className="v2-loading"><div className="v2-spinner" /> Loading properties…</div>
        ) : properties.length === 0 ? (
          <div className="v2-loading">No properties yet — the scrape pipeline is warming up.</div>
        ) : (
          <div className="v2-grid">{properties.map((p) => <V2PropertyCard key={p.id} property={p} />)}</div>
        )}
      </section>

      {/* ===== App Download Section ===== */}
      <section className="v2-container" style={{ margin: "24px auto" }}>
        <div className="v2-app-download">
          <div>
            <span className="eyebrow">The PropertyIntel App</span>
            <h2>Your entire deal pipeline in your pocket.</h2>
            <p>Get real-time alerts on new distressed properties, bid from anywhere, sign smart contracts on-chain, and manage every deal — all from a premium mobile experience.</p>

            <div className="v2-store-badges">
              <a href="/v2/app" className="v2-store-badge">
                <Apple size={28} />
                <div><small>Download on the</small><b>App Store</b></div>
              </a>
              <a href="/v2/app" className="v2-store-badge">
                <Smartphone size={26} />
                <div><small>Get it on</small><b>Google Play</b></div>
              </a>
            </div>

            <div className="v2-app-benefits">
              <div className="v2-app-benefit"><span className="ck"><Check size={14} /></span> Instant push alerts on new distressed listings in your farm area</div>
              <div className="v2-app-benefit"><span className="ck"><Check size={14} /></span> One-tap bidding & smart-contract escrow from your phone</div>
              <div className="v2-app-benefit"><span className="ck"><Check size={14} /></span> Persona dashboards for investors, agents, sellers & brokers</div>
              <div className="v2-app-benefit"><span className="ck"><Check size={14} /></span> Offline access to saved searches & deal calculators</div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="v2-phone-mockup">
            <div className="v2-phone-screen">
              <div className="v2-phone-notch" />
              <div className="v2-phone-bar">
                <div className="av" />
                <b>Investor Portal</b>
              </div>
              <div className="v2-phone-body">
                <div className="v2-phone-card">
                  <div className="img" />
                  <b>$187,000 · Pre-foreclosure</b><br />
                  <span>Miami, FL · Score 84</span>
                </div>
                <div className="v2-phone-card">
                  <div className="img" style={{ background: "linear-gradient(135deg,#dbeafe,#60a5fa)" }} />
                  <b>$142,500 · Probate</b><br />
                  <span>Orlando, FL · Score 79</span>
                </div>
                <div className="v2-phone-card">
                  <div className="img" style={{ background: "linear-gradient(135deg,#fef3c7,#fbbf24)" }} />
                  <b>$98,000 · Tax delinquent</b><br />
                  <span>Tampa, FL · Score 76</span>
                </div>
              </div>
              <div className="v2-phone-nav">
                <div>⌂</div><div>⌕</div><div>✎</div><div>✉</div><div>☻</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Benefits grid ===== */}
      <section className="v2-section v2-container">
        <div className="v2-section-head">
          <div>
            <h2>Why investors choose PropertyIntel</h2>
            <p>Systems and services the competition doesn't offer.</p>
          </div>
        </div>
        <div className="v2-benefits">
          <div className="v2-benefit">
            <div className="v2-benefit-icon" style={{ background: "#dcfce7", color: "#16a34a" }}><Zap size={22} /></div>
            <h3>Real-time lead alerts</h3>
            <p>Push notifications the moment a new distressed property hits your farm area — beat the competition by hours.</p>
          </div>
          <div className="v2-benefit">
            <div className="v2-benefit-icon" style={{ background: "#dbeafe", color: "#2563eb" }}><ShieldCheck size={22} /></div>
            <h3>On-chain smart contracts</h3>
            <p>Polygon escrow, digital signatures, and title — close deals securely without a traditional title office.</p>
          </div>
          <div className="v2-benefit">
            <div className="v2-benefit-icon" style={{ background: "#fef3c7", color: "#d97706" }}><Database size={22} /></div>
            <h3>9,000-attribute enrichment</h3>
            <p>Deep property data — ownership, liens, permits, code violations, flood zones, and more on every listing.</p>
          </div>
          <div className="v2-benefit">
            <div className="v2-benefit-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}><Cpu size={22} /></div>
            <h3>AI computer-vision scoring</h3>
            <p>Automated property condition assessment from imagery — know repair costs before you ever visit.</p>
          </div>
          <div className="v2-benefit">
            <div className="v2-benefit-icon" style={{ background: "#fce7f3", color: "#db2777" }}><Bell size={22} /></div>
            <h3>6-channel outreach automation</h3>
            <p>Email, SMS, voice, WhatsApp, RCS & in-app — Eden Skye AI handles replies and follow-ups automatically.</p>
          </div>
          <div className="v2-benefit">
            <div className="v2-benefit-icon" style={{ background: "#cffafe", color: "#0891b2" }}><TrendingUp size={22} /></div>
            <h3>Predictive distress model</h3>
            <p>ML model flags properties likely to enter distress before they hit public records — get there first.</p>
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
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

      {/* ===== CTA ===== */}
      <section className="v2-container">
        <div className="v2-cta">
          <div>
            <h2>Start finding deals today</h2>
            <p>Free to browse. Upgrade for full enrichment, skip-trace, and outreach automation.</p>
          </div>
          <Link to="/v2/app" className="v2-btn v2-btn-accent" style={{ height: 48, padding: "0 28px" }}>
            Get started free <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}