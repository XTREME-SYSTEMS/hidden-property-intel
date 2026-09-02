import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Sparkles, TrendingUp, Shield, Crown, Building2, Zap } from "lucide-react";
import Seo from "@/components/Seo";

const TIERS = [
  {
    name: "Free",
    icon: Sparkles,
    price: "$0",
    period: "forever",
    tagline: "Kick the tires. See what's out there.",
    features: [
      "5 property views per month",
      "Basic search & filters",
      "City + state + zip only (no full address)",
      "Market overview dashboard",
      "Community access",
    ],
    notIncluded: ["AI deal scoring", "Ownership chains", "Skip tracing", "Smart-contract escrow"],
    cta: "Start free",
    ctaTo: "/register",
    highlight: false,
  },
  {
    name: "Starter",
    icon: TrendingUp,
    price: "$39",
    period: "/month",
    annual: "$31/mo billed annually",
    tagline: "For the part-time investor finding their first deals.",
    features: [
      "50 property views per month",
      "Full addresses revealed",
      "AI deal scoring (0–100)",
      "Basic filters (price, type, distress)",
      "Save up to 25 properties to watchlist",
      "ROI calculator access",
      "Email alerts",
    ],
    notIncluded: ["Ownership chains & heirs", "Skip tracing", "Smart-contract escrow"],
    cta: "Start Starter",
    ctaTo: "/register",
    highlight: false,
    competitor: "DealMachine Starter $49/mo — you save 20%",
  },
  {
    name: "Pro",
    icon: Zap,
    price: "$79",
    period: "/month",
    annual: "$63/mo billed annually",
    tagline: "For serious investors who need the full intelligence stack.",
    features: [
      "Unlimited property views",
      "Full AI scoring + score breakdown",
      "Ownership chains & probate heir tracing",
      "Advanced filters (165+ criteria)",
      "Comparable sales data",
      "Exit-strategy modeling (flip/BRRRR/rent)",
      "Negotiation assistant",
      "Unlimited watchlist + saved searches",
      "Daily alert notifications",
      "Priority email support",
    ],
    notIncluded: ["Smart-contract escrow", "Skip tracing credits"],
    cta: "Start Pro",
    ctaTo: "/register",
    highlight: true,
    competitor: "PropStream $99/mo — you save 20% + get ownership chains",
    badge: "Most popular",
  },
  {
    name: "Elite",
    icon: Crown,
    price: "$199",
    period: "/month",
    annual: "$159/mo billed annually",
    tagline: "The full arsenal. Smart contracts, skip traces, everything.",
    features: [
      "Everything in Pro, plus:",
      "Smart-contract escrow on Polygon",
      "50 skip-trace credits / month",
      "Title & lien risk assessment",
      "Live negotiation chat with sellers",
      "Property image pipeline (GIS + Street View)",
      "Market analytics & trend data",
      "API access (read-only)",
      "Dedicated account manager",
      "Phone + priority support",
    ],
    notIncluded: [],
    cta: "Start Elite",
    ctaTo: "/register",
    highlight: false,
    competitor: "PropertyRadar $599/mo — you save 67% + get smart contracts",
    badge: "Best value",
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: "Custom",
    period: "",
    tagline: "For funds, teams, and platforms operating at scale.",
    features: [
      "Everything in Elite, plus:",
      "Unlimited skip tracing",
      "Multi-seat team dashboard",
      "White-label branding option",
      "Full API access (read + write)",
      "Custom data sources & scraping",
      "Bulk property export",
      "Dedicated scraping infrastructure",
      "Custom smart-contract templates",
      "24/7 priority support + SLA",
      "Onboarding & training included",
    ],
    notIncluded: [],
    cta: "Contact sales",
    ctaTo: "/contact",
    highlight: false,
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
  if (val === true) return <Check className="h-4 w-4 text-emerald-600" />;
  if (val === "partial") return <span className="text-xs text-amber-600">Partial</span>;
  if (val === false) return <X className="h-4 w-4 text-black/20" />;
  return <span className="text-xs font-medium text-black/70">{val}</span>;
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-12">
      <Seo
        title="Pricing — Distressed Property Intelligence Plans"
        description="Hidden Property Intel pricing: Free, Starter $39/mo, Pro $79/mo, Elite $199/mo, Enterprise. AI-powered distressed property intelligence with smart-contract escrow. 20% cheaper than PropStream, DealMachine, and PropertyRadar."
        keywords="distressed property pricing, real estate investment software pricing, PropStream alternative, DealMachine alternative, PropertyRadar alternative, smart contract escrow pricing, AI property scoring cost, real estate data platform pricing"
        path="/pricing"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "PriceSpecification",
          "name": "Hidden Property Intel Pricing Plans",
          "description": "5-tier pricing from Free to Enterprise for AI-powered distressed property intelligence.",
        }}
      />

      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Pricing</p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-tight sm:text-6xl">
          More intelligence. <em className="not-italic text-gold">Less cost.</em>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-black/60">
          We priced ourselves against the top platforms in the market — then cut 20%+ off their price and added more
          features at every tier. No platform offers smart-contract escrow. No platform offers AI negotiation. We do.
        </p>

        <div className="mt-8 inline-flex items-center gap-3 rounded-sm border border-black/10 p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`rounded-sm px-5 py-2 text-[11px] uppercase tracking-[0.2em] transition-colors ${!annual ? "bg-black text-white" : "text-black/60"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`rounded-sm px-5 py-2 text-[11px] uppercase tracking-[0.2em] transition-colors ${annual ? "bg-black text-white" : "text-black/60"}`}
          >
            Annual <span className="text-gold">Save 20%</span>
          </button>
        </div>
      </div>

      {/* TIER CARDS */}
      <div className="mt-16 grid gap-6 lg:grid-cols-5">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`relative flex flex-col rounded-sm border p-6 ${
              t.highlight ? "border-black bg-white shadow-2xl lg:scale-105" : "border-black/10 bg-white"
            }`}
          >
            {t.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-[9px] uppercase tracking-[0.2em] text-black">
                {t.badge}
              </span>
            )}
            <div className="flex items-center justify-between">
              <t.icon className={`h-6 w-6 ${t.highlight ? "text-gold" : "text-black/60"}`} />
              <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">{t.name}</span>
            </div>
            <p className="mt-4 font-display text-4xl font-light tracking-tight">
              {t.price}
              {t.period && <span className="text-base text-black/40">{t.period}</span>}
            </p>
            {annual && t.annual && (
              <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-gold">{t.annual}</p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-black/55">{t.tagline}</p>

            <ul className="mt-6 flex-1 space-y-2.5">
              {t.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-black/70">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{f}</span>
                </li>
              ))}
              {t.notIncluded?.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-black/30">
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {t.competitor && (
              <p className="mt-4 rounded-sm bg-black/5 px-3 py-2 text-[10px] leading-relaxed text-black/50">
                {t.competitor}
              </p>
            )}

            <Link
              to={t.ctaTo}
              className={`mt-6 inline-flex items-center justify-center rounded-sm px-5 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                t.highlight
                  ? "bg-black text-white hover:bg-black/80"
                  : "border border-black/15 text-black hover:bg-black hover:text-white"
              }`}
            >
              {t.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* COMPETITOR COMPARISON */}
      <section className="mt-24">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Head-to-head</p>
          <h2 className="mt-3 font-display text-3xl font-light tracking-tight sm:text-4xl">
            How we stack up against the market.
          </h2>
        </div>
        <div className="mt-12 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/15 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                <th className="pb-4 pr-4">Feature</th>
                <th className="pb-4 pr-4 text-center">
                  <span className="flex flex-col items-center gap-1">
                    <Shield className="h-4 w-4 text-gold" />
                    HPI
                  </span>
                </th>
                <th className="pb-4 pr-4 text-center">PropStream</th>
                <th className="pb-4 pr-4 text-center">DealMachine</th>
                <th className="pb-4 text-center">PropertyRadar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {COMPETITOR_TABLE.map((row) => (
                <tr key={row.feature} className="align-middle">
                  <td className="py-4 pr-4 font-medium text-black/80">{row.feature}</td>
                  <td className="py-4 pr-4 text-center"><Mark val={row.us} /></td>
                  <td className="py-4 pr-4 text-center"><Mark val={row.propstream} /></td>
                  <td className="py-4 pr-4 text-center"><Mark val={row.dealmachine} /></td>
                  <td className="py-4 text-center"><Mark val={row.propertyradar} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-24 max-w-3xl">
        <h2 className="font-display text-3xl font-light tracking-tight">Pricing questions</h2>
        <div className="mt-8 space-y-6">
          {[
            { q: "Can I switch plans anytime?", a: "Yes. Upgrade or downgrade from your dashboard at any time. We prorate the difference automatically." },
            { q: "Is there a free trial on paid plans?", a: "Starter, Pro, and Elite all include a 7-day free trial. No credit card required to start." },
            { q: "What's the smart-contract escrow fee?", a: "Elite and Enterprise plans include smart-contract escrow at no additional platform cost. You only pay Polygon gas (typically under $1 per transaction)." },
            { q: "Do you offer team pricing?", a: "Enterprise plans include multi-seat dashboards, custom roles, and volume discounts. Contact us for a quote." },
            { q: "How are you cheaper than PropStream and PropertyRadar?", a: "We built our data pipeline on modern infrastructure (Supabase + Railway) instead of legacy data warehouses. That keeps our costs low — and we pass the savings to you." },
          ].map((f) => (
            <div key={f.q} className="border-b border-black/10 pb-5">
              <p className="font-display text-base font-medium">{f.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-black/60">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-20 rounded-sm bg-black p-10 text-center text-white lg:p-16">
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-light leading-tight">
          Still not sure which plan is right for you?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60">
          Start free, upgrade when you're ready. No lock-in, no hidden fees, cancel anytime.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/register" className="inline-flex items-center gap-2 rounded-sm bg-gold-warm px-6 py-3.5 text-[11px] uppercase tracking-[0.3em] text-black hover:opacity-90">
            Get started free
          </Link>
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-sm border border-white/25 px-6 py-3.5 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-white/10">
            Talk to us
          </Link>
        </div>
      </div>
    </div>
  );
}