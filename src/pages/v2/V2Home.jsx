import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TRENDING = [
  { price: "$187,000", beds: 3, baths: 2, sqft: 1450, addr: "917 Flores Ct, Miami, FL 33125", badge: "Open: Fri 9:30am-1pm (9/11)", score: 84, img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&q=80", meta: "5 days on HPI · Distressed lead" },
  { price: "$142,500", beds: 3, baths: 2, sqft: 1280, addr: "3943 Filbert Way, Orlando, FL 32808", badge: "5 days on HPI", score: 79, img: "https://images.unsplash.com/photo-1570129477496-7c5e17e0f9b5?w=500&q=80", meta: "Probate · Heir-sourced" },
  { price: "$98,000", beds: 2, baths: 1, sqft: 980, addr: "2517 Olympic Ct, Tampa, FL 33615", badge: "5 days on HPI", score: 76, img: "https://images.unsplash.com/photo-1600585154340-be6161a8a907?w=500&q=80", meta: "Tax delinquent · Vacant" },
  { price: "$245,000", beds: 4, baths: 3, sqft: 2100, addr: "2530 Entrada Dr, Jacksonville, FL 32216", badge: "14 days on HPI", score: 81, img: "https://images.unsplash.com/photo-1600592017751-4b3c4c4e4e4e?w=500&q=80", meta: "Bank-owned · REO" },
  { price: "$165,000", beds: 3, baths: 2, sqft: 1560, addr: "1008 Levy Loop, Fort Lauderdale, FL 33311", badge: "3D Tour", score: 88, img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d9e3f3?w=500&q=80", meta: "High equity · Off-market" },
  { price: "$112,000", beds: 2, baths: 1, sqft: 1040, addr: "800 Lake Edward Dr, St. Pete, FL 33715", badge: "Open: Sat 10am-2pm (9/12)", score: 73, img: "https://images.unsplash.com/photo-1599809275671-4b3c4c4e4e4e?w=500&q=80", meta: "Divorce filing · Motivated" },
];

const AFFORD = [
  { img: "https://images.unsplash.com/photo-1564013799919-ab6000c0b5b6?w=400&q=80", badge: "Within budget" },
  { img: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&q=80", badge: "Within budget" },
  { img: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&q=80", badge: "Within budget" },
];

export default function V2Home() {
  const [query, setQuery] = useState("");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Property.list("-created_date", 12);
        setProperties(Array.isArray(list) ? list : []);
      } catch (e) { setProperties([]); }
      setLoading(false);
    })();
  }, []);

  const scrollCarousel = (dir) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* ===== Zillow-style Hero ===== */}
      <section className="z-hero">
        <div className="z-hero-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80')" }} />
        <div className="z-hero-inner">
          <h1>Distressed. Homes.<br />Agents. Deals.</h1>
          <div className="z-search">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter an address, neighborhood, city, or ZIP code" />
            <button className="z-search-btn"><Search size={22} /></button>
          </div>
        </div>
      </section>

      {/* ===== Trending Homes ===== */}
      <section className="z-section">
        <div className="z-section-head">
          <div>
            <h2>Trending distressed homes in Florida</h2>
            <p>Viewed and saved the most in the area over the past 24 hours</p>
          </div>
          <div className="z-carousel-btns">
            <button className="z-carousel-btn" onClick={() => scrollCarousel(-1)}><ChevronLeft size={18} /></button>
            <button className="z-carousel-btn" onClick={() => scrollCarousel(1)}><ChevronRight size={18} /></button>
          </div>
        </div>

        {loading ? (
          <div className="v2-loading"><div className="v2-spinner" /> Loading properties…</div>
        ) : properties.length > 0 ? (
          <div className="z-carousel" ref={carouselRef}>
            {properties.slice(0, 10).map((p, i) => (
              <Link to="/v2" key={p.id} className="z-card">
                <div className="z-card-media">
                  <img src={p.images?.[0]?.url || TRENDING[i % TRENDING.length].img} alt={p.address} />
                  <span className="z-card-badge">{(p.distress_type || "off-market").replace(/_/g, " ")}</span>
                  <span className="z-card-score">{p.property_score || Math.floor(70 + Math.random() * 25)}</span>
                </div>
                <div className="z-card-body">
                  <div className="z-card-price">${(p.proposed_asking_price || p.estimated_value || 0).toLocaleString()}</div>
                  <div className="z-card-facts">
                    <span><b>{p.bedrooms || 3}</b> bds</span><span>·</span>
                    <span><b>{p.bathrooms || 2}</b> ba</span><span>·</span>
                    <span><b>{(p.square_footage || 1400).toLocaleString()}</b> sqft</span>
                  </div>
                  <div className="z-card-status">Active</div>
                  <div className="z-card-addr">{p.address}, {p.city}, {p.state} {p.zip_code}</div>
                  <div className="z-card-meta">HPI Scored · AI-enriched · Skip-traced</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="z-carousel" ref={carouselRef}>
            {TRENDING.map((t, i) => (
              <Link to="/v2" key={i} className="z-card">
                <div className="z-card-media">
                  <img src={t.img} alt={t.addr} />
                  <span className="z-card-badge">{t.badge}</span>
                  <span className="z-card-score">{t.score}</span>
                </div>
                <div className="z-card-body">
                  <div className="z-card-price">{t.price}</div>
                  <div className="z-card-facts">
                    <span><b>{t.beds}</b> bds</span><span>·</span>
                    <span><b>{t.baths}</b> ba</span><span>·</span>
                    <span><b>{t.sqft.toLocaleString()}</b> sqft</span>
                  </div>
                  <div className="z-card-status">Active</div>
                  <div className="z-card-addr">{t.addr}</div>
                  <div className="z-card-meta">{t.meta}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== BuyAbility band ===== */}
      <section className="z-afford">
        <div className="z-afford-inner">
          <h2>Find deals you can actually close</h2>
          <p>Answer a few questions. We'll highlight distressed properties that match your budget, exit strategy, and target ROI — powered by our deal calculator.</p>
          <div className="z-afford-cards">
            {AFFORD.map((a, i) => (
              <div key={i} className="z-afford-card">
                <div className="z-afford-card-img" style={{ backgroundImage: `url('${a.img}')` }} />
                <span className="z-card-badge">{a.badge}</span>
              </div>
            ))}
          </div>
          <Link to="/deal-calculator" className="z-afford-cta">Get your deal score <ArrowRight size={16} /></Link>
        </div>
      </section>

      {/* ===== Spot cards ===== */}
      <section className="z-section">
        <div className="z-spots">
          <div className="z-spot">
            <div className="z-spot-img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1564013799919-ab6000c0b5b6?w=600&q=80')" }} />
            <div className="z-spot-body">
              <h3>Buy a home</h3>
              <p>Browse off-market distressed properties scored by AI — pre-foreclosures, probate, tax delinquent, and code violations, all skip-traced and ready to close.</p>
              <Link to="/v2" className="z-spot-link">Browse listings <ArrowRight size={15} /></Link>
            </div>
          </div>
          <div className="z-spot">
            <div className="z-spot-img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&q=80')" }} />
            <div className="z-spot-body">
              <h3>Sell a property</h3>
              <p>List your distressed property and get instant cash offers from verified investors. Close with on-chain smart-contract escrow — no title office required.</p>
              <Link to="/seller/post-property" className="z-spot-link">List your property <ArrowRight size={15} /></Link>
            </div>
          </div>
          <div className="z-spot">
            <div className="z-spot-img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80')" }} />
            <div className="z-spot-body">
              <h3>Finance a deal</h3>
              <p>Run the numbers with our deal calculator — wholesale, fix-and-flip, BRRRR, and buy-and-hold — with per-person profit splits and industry benchmarks.</p>
              <Link to="/deal-calculator" className="z-spot-link">Open calculator <ArrowRight size={15} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Zillow-style footer ===== */}
      <footer className="z-footer">
        <div className="z-footer-inner">
          <div className="z-footer-grid">
            <div>
              <h4>Real Estate</h4>
              <Link to="/v2">Browse all homes</Link>
              <Link to="/v2">Miami distressed homes</Link>
              <Link to="/v2">Orlando distressed homes</Link>
              <Link to="/v2">Tampa distressed homes</Link>
              <Link to="/v2">Jacksonville distressed homes</Link>
              <Link to="/v2">Fort Lauderdale homes</Link>
            </div>
            <div>
              <h4>Leads</h4>
              <Link to="/v2">Pre-foreclosures</Link>
              <Link to="/v2">Probate</Link>
              <Link to="/v2">Tax delinquent</Link>
              <Link to="/v2">Code violations</Link>
              <Link to="/v2">Divorce filings</Link>
              <Link to="/v2">Bank-owned (REO)</Link>
            </div>
            <div>
              <h4>Tools</h4>
              <Link to="/deal-calculator">Deal calculator</Link>
              <Link to="/v2/app">Mobile app</Link>
              <Link to="/smart-contracts">Smart contracts</Link>
              <Link to="/v2">Market analytics</Link>
              <Link to="/v2">Skip trace</Link>
              <Link to="/v2">Outreach automation</Link>
            </div>
            <div>
              <h4>Company</h4>
              <Link to="/about">About</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/legal-compliance">Fair housing</Link>
              <Link to="/legal-compliance">Disclosures</Link>
              <Link to="/login">Sign in</Link>
            </div>
          </div>
          <div className="z-footer-bottom">© 2026 Hidden Property Intel. All rights reserved. Hidden Property Intel is a licensed real estate platform. Data sourced from public court records and county assessors.</div>
        </div>
      </footer>
    </>
  );
}