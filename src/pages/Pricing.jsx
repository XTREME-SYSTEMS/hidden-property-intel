import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Sparkles, TrendingUp, Shield, Crown, Building2, Zap } from "lucide-react";
import Seo from "@/components/Seo";

const TIERS = [
  {
    name: "Free", icon: Sparkles, price: "$0", period: "forever",
    tagline: "Kick the tires. See what's out there.",
    features: ["5 property views per month", "Basic search & filters", "City + state + zip only (no full address)", "Market overview dashboard", "Community access"],
    notIncluded: ["AI deal scoring", "Ownership chains", "Skip tracing", "Smart-contract escrow"],
    cta: "Start free", ctaTo: "/register", highlight: false,
  },
  {
    name: "Starter", icon: TrendingUp, price: "$39", period: "/month", annual: "$31/mo billed annually",
    tagline: "For the part-time investor finding their first deals.",
    features: ["50 property views per month", "Full addresses revealed", "AI deal scoring (0–100)", "Basic filters (price, type, distress)", "Save up to 25 properties to watchlist", "ROI calculator access", "Email alerts"],
    notIncluded: ["Ownership chains & heirs", "Skip tracing", "Smart-contract escrow"],
    cta: "Start Starter", ctaTo: "/register", highlight: false,
    competitor: "DealMachine Starter $49/mo — you save 20%",
  },
  {
    name: "Pro", icon: Zap, price: "$79", period: "/month", annual: "$63/mo billed annually",
    tagline: "For serious investors who need the full intelligence stack.",
    features: ["Unlimited property views", "Full AI scoring + score breakdown", "Ownership chains & probate heir tracing", "Advanced filters (165+ criteria)", "Comparable sales data", "Exit-strategy modeling (flip/BRRRR/rent)", "Negotiation assistant", "Unlimited watchlist + saved searches", "Daily alert notifications", "Priority email support"],
    notIncluded: ["Smart-contract escrow", "Skip tracing credits"],
    cta: "Start Pro", ctaTo: "/register", highlight: true,
    competitor: "PropStream $99/mo — you save 20% + get ownership chains",
    badge: "Most popular",
  },
  {
    name: "Elite", icon: Crown, price: "$199", period: "/month", annual: "$159/mo billed annually",
    tagline: "The full arsenal. Smart contracts, skip traces, everything.",
    features: ["Everything in Pro, plus:", "Smart-contract escrow on Polygon", "50 skip-trace credits / month", "Title & lien risk assessment", "Live negotiation chat with sellers", "Property image pipeline (GIS + Street View)", "Market analytics & trend data", "API access (read-only)", "Dedicated account manager", "Phone + priority support"],
    notIncluded: [],
    cta: "Start Elite", ctaTo: "/register", highlight: false,
    competitor: "PropertyRadar $599/mo — you save 67% + get smart contracts",
    badge: "Best value",
  },
  {
    name: "Enterprise", icon: Building2, price: "Custom", period: "",
    tagline: "For funds, teams, and platforms operating at scale.",
    features: ["Everything in Elite, plus:", "Unlimited skip tracing", "Multi-seat team dashboard", "White-label branding option", "Full API access (read + write)", "Custom data sources & scraping", "Bulk property export", "Dedicated scraping infrastructure", "Custom smart-contract templates", "24/7 priority support + SLA", "Onboarding & training included"],
    notIncluded: [],
    cta: "Contact sales", ctaTo: "/contact", highlight: false,
  },
];

const COMPETITOR_TABLE = [
  { feature: "AI deal scoring (0–100)", us: true, propstream: true, dealmachine: false, propertyradar: false },
  { feature: "Ownership chain & heir tracing", us: true, propstream: "partial", dealmachine: false, propertyradar: true },
  { feature: "Smart-contract escrow", us: true, propstream: false, dealmachine: false, propertyradar: false },
  { feature: "AI negotiation assistant", us: true, propstream: false, dealmachine: false, propertyradar: false },
  { feature: "Daily county-record scraping", us: true, propstream: true, dealmachine: false, propertyradar: true },
  { feature: "165+ search filters", us: true, propstream: true, dealmachine: "partial", propertyradar: true },
  { feature: "Skip tracing", us: true, propstream: true, dealmachine: true, propertyradar: true },
  { feature: "Mobile app / PWA", us: true, propstream: true, dealmachine: true, propertyradar: false },
  { feature: "Starting price", us: "$0", propstream: "$99/mo", dealmachine: "$49/mo", propertyradar: "$599/mo" },
];

function Mark({ val }) {
  if (val === true) return <Check size={16} style={{ color: "var(--z-blue)" }} />;
  if (val === "partial") return <span style={{ fontSize: 12, color: "#b45309", fontWeight: 600 }}>Partial</span>;
  if (val === false) return <X size={16} style={{ color: "var(--z-border)" }} />;
  return <span style={{ fontSize: 13, fontWeight: 600, color: "var(--z-ink)" }}>{val}</span>;
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      <Seo
        title="Pricing — Distressed Property Intelligence Plans"
        description="Hidden Property Intel pricing: Free, Starter $39/mo, Pro $79/mo, Elite $199/mo, Enterprise. AI-powered distressed property intelligence with smart-contract escrow."
        keywords="distressed property pricing, real estate investment software pricing, PropStream alternative, DealMachine alternative, PropertyRadar alternative"
        path="/pricing"
      />

      <section className="z-page-hero" style={{ textAlign: "center" }}>
        <p className="z-page-eyebrow">Pricing</p>
        <h1 className="z-page-h1" style={{ margin: "10px auto 14px" }}>More intelligence. <em>Less cost.</em></h1>
        <p className="z-page-lead" style={{ margin: "0 auto" }}>We priced ourselves against the top platforms in the market — then cut 20%+ off their price and added more features at every tier. No platform offers smart-contract escrow. No platform offers AI negotiation. We do.</p>
        <div className="z-toggle" style={{ marginTop: 24 }}>
          <button className={!annual ? "on" : ""} onClick={() => setAnnual(false)}>Monthly</button>
          <button className={annual ? "on" : ""} onClick={() => setAnnual(true)}>Annual · Save 20%</button>
        </div>
      </section>

      {/* TIER CARDS */}
      <section className="z-section-pad" style={{ paddingTop: 24 }}>
        <div className="z-grid-3 z-tier-grid" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
          {TIERS.map((t) => (
            <div key={t.name} className={`z-tier-card ${t.highlight ? "featured" : ""}`}>
              {t.badge && <span className="z-badge-pill">{t.badge}</span>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <t.icon size={22} style={{ color: t.highlight ? "var(--z-blue)" : "var(--z-muted)" }} />
                <span className="z-tier-name">{t.name}</span>
              </div>
              <div className="z-tier-price">{t.price}{t.period && <small>{t.period}</small>}</div>
              {annual && t.annual && <div className="z-tier-annual">{t.annual}</div>}
              <p className="z-tier-tag">{t.tagline}</p>
              <ul>
                {t.features.map((f, i) => (
                  <li key={i}><Check size={15} /> <span>{f}</span></li>
                ))}
                {t.notIncluded?.map((f, i) => (
                  <li key={i} className="no"><X size={15} /> <span>{f}</span></li>
                ))}
              </ul>
              {t.competitor && <div className="z-tier-competitor">{t.competitor}</div>}
              <Link to={t.ctaTo} className={`v2-btn ${t.highlight ? "v2-btn-primary" : "v2-btn-ghost"}`}>{t.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* COMPETITOR COMPARISON */}
      <section className="z-section-alt">
        <div className="z-section-alt-inner">
          <div style={{ textAlign: "center" }}>
            <p className="z-page-eyebrow">Head-to-head</p>
            <h2 className="z-page-h2" style={{ margin: "8px auto 0" }}>How we stack up against the market.</h2>
            <p className="z-page-sub" style={{ margin: "0 auto 28px" }}>Feature-by-feature, platform-by-platform. HPI matches or beats every competitor — at a lower price.</p>
          </div>
          <div style={{ overflowX: "auto", border: "1px solid var(--z-border)", borderRadius: 12 }}>
            <table className="z-compare-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th style={{ textAlign: "center" }}><Shield size={16} style={{ display: "inline", marginRight: 4, color: "var(--z-blue)" }} /> HPI</th>
                  <th style={{ textAlign: "center" }}>PropStream</th>
                  <th style={{ textAlign: "center" }}>DealMachine</th>
                  <th style={{ textAlign: "center" }}>PropertyRadar</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITOR_TABLE.map((row, i) => (
                  <tr key={row.feature} style={{ background: i % 2 === 0 ? "#fff" : "var(--z-surface)" }}>
                    <td><b>{row.feature}</b></td>
                    <td style={{ textAlign: "center", background: "#f0f6ff" }}><Mark val={row.us} /></td>
                    <td style={{ textAlign: "center" }}><Mark val={row.propstream} /></td>
                    <td style={{ textAlign: "center" }}><Mark val={row.dealmachine} /></td>
                    <td style={{ textAlign: "center" }}><Mark val={row.propertyradar} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 14, fontSize: 13, color: "var(--z-muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Check size={15} style={{ color: "var(--z-blue)" }} /> Included</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#b45309", fontWeight: 600 }}>Partial</span> Limited or restricted</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><X size={15} style={{ color: "var(--z-border)" }} /> Not available</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="z-section-pad" style={{ maxWidth: 820 }}>
        <h2 className="z-page-h2">Pricing questions</h2>
        <div style={{ marginTop: 20 }}>
          {[
            { q: "Can I switch plans anytime?", a: "Yes. Upgrade or downgrade from your dashboard at any time. We prorate the difference automatically." },
            { q: "Is there a free trial on paid plans?", a: "Starter, Pro, and Elite all include a 7-day free trial. No credit card required to start." },
            { q: "What's the smart-contract escrow fee?", a: "Elite and Enterprise plans include smart-contract escrow at no additional platform cost. You only pay Polygon gas (typically under $1 per transaction)." },
            { q: "Do you offer team pricing?", a: "Enterprise plans include multi-seat dashboards, custom roles, and volume discounts. Contact us for a quote." },
            { q: "How are you cheaper than PropStream and PropertyRadar?", a: "We built our data pipeline on modern infrastructure (Supabase + Railway) instead of legacy data warehouses. That keeps our costs low — and we pass the savings to you." },
          ].map((f) => (
            <div key={f.q} className="z-faq-item">
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="z-cta-band">
        <h2>Still not sure which plan is right for you?</h2>
        <p>Start free, upgrade when you're ready. No lock-in, no hidden fees, cancel anytime.</p>
        <div className="z-cta-row">
          <Link to="/register" className="v2-btn v2-btn-primary">Get started free</Link>
          <Link to="/contact" className="v2-btn v2-btn-ghost" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.3)" }}>Talk to us</Link>
        </div>
      </div>
    </div>
  );
}