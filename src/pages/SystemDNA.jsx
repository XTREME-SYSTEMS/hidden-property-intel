import React from "react";
import { Link } from "react-router-dom";
import { Radar, Brain, FileSignature, Users, RefreshCw, Mail, ShieldCheck, Database, TrendingUp, Target, Zap, ArrowRight, Copy, Bug, Gauge } from "lucide-react";

/**
 * System DNA — the architectural benchmark Hidden Property Intel is built toward.
 * Maps every capability of the top distressed-property platforms to what we have
 * today and what's next, so the team always knows the gap and the goal.
 */

const BENCHMARKS = [
  {
    name: "PropStream",
    url: "propstream.com",
    price: "$99/mo",
    strength: "150M+ involuntary liens, 41M pre-foreclosures, 165 filters, 20 lead lists, list-stacking for motivated sellers.",
    take: "Depth of lien + equity data and filter granularity. We match with AI scoring + ownership chains but should add equity-position and mortgage-balance fields.",
  },
  {
    name: "DealMachine",
    url: "dealmachine.com",
    price: "$99+/mo",
    strength: "Driving-for-Dollars mobile app, skip tracing, CRM, marketing automation in one subscription. 250K+ users, 100K+ deals closed.",
    take: "Mobile-first field acquisition + CRM. We have a PWA and investor pipeline; next is in-app skip-trace and a D4$ map mode.",
  },
  {
    name: "PropertyRadar",
    url: "propertyradar.com",
    price: "$249/mo",
    strength: "Regional distressed-property focus, list-stacking across multiple distress lists, strong Western-state county coverage.",
    take: "List-stacking (cross-referencing multiple distress indicators on one property). Our crossReferenceProperties function does this; expose it in the UI.",
  },
  {
    name: "ATTOM Data",
    url: "attomdata.com",
    price: "Enterprise",
    strength: "Foreclosure timelines (default, auction, REO), Propensity-to-Default scoring, nationwide property data warehouse.",
    take: "Propensity / predictive scoring. Our 0–100 score is the equivalent; enrich it with default-propensity signals from market analytics.",
  },
  {
    name: "BatchData",
    url: "batchdata.io",
    price: "Tiered",
    strength: "Multi-source resilience, 99.99% uptime real-time API, daily freshness checks, skip tracing, investor lead data.",
    take: "Data-freshness SLA and multi-source resilience. Our validateSystem + expireStaleProperties daily sweep is our equivalent — keep it rigorous.",
  },
  {
    name: "DealCheck",
    url: "dealcheck.io",
    price: "Free–$49/mo",
    strength: "Fast deal analysis — cash flow, cap rate, ROI, sale profit from public records + listings, with photos.",
    take: "Underwriting speed and clarity. Our ROI calculators + exit-strategy models match; keep the mobile analyzer one-tap.",
  },
];

const OUR_CAPABILITIES = [
  { icon: Radar, t: "Autonomous county-record scraping", d: "Daily LLM web-search + Browserbase harvest of assessor, tax, probate, foreclosure, code-violation, and obituary records across 27 states.", status: "Live" },
  { icon: Users, t: "Full ownership chain + heirs", d: "Current, previous, and potential-heir owners traced through probate — reach the right party with context.", status: "Live" },
  { icon: Brain, t: "AI deal scoring & underwriting", d: "0–100 score, ARV, repair-cost estimate, comparable sales, and estimated ROI on every property.", status: "Live" },
  { icon: Brain, t: "AI negotiation assistant", d: "Sellers get a coach that analyzes every offer against market data and scripts the counter — no agent required.", status: "Live" },
  { icon: FileSignature, t: "Smart-contract escrow on Polygon", d: "Solidity 0.8.20 contracts manage earnest money, signatures, and fund release. Closes in days, not months.", status: "Live" },
  { icon: Mail, t: "Autonomous investor + seller outreach", d: "Polished, personalized email engines that auto-scrape contacts and send with correct names, company, and property data.", status: "Live" },
  { icon: RefreshCw, t: "Daily freshness & auto-heal", d: "Nightly integrity sweep re-runs failed sources, resets errors, and expires stale inventory so data stays current.", status: "Live" },
  { icon: TrendingUp, t: "Market analytics & trend pricing", d: "Regional avg price, price/sqft, days-on-market, distress counts, and ROI trends synced from live web data.", status: "Live" },
];

const ROADMAP = [
  { icon: Database, t: "Equity & mortgage-balance fields", d: "Add lien_total, mortgage_balance, and equity-position to properties (PropStream parity).", done: false },
  { icon: Target, t: "List-stacking UI", d: "DistressStack component live on property detail — shows all stacked distress signals.", done: true },
  { icon: Zap, t: "In-app skip trace", d: "InvokeLLM web-search skip-trace live as fallback. One-tap button on property detail for admins.", done: true },
  { icon: Radar, t: "Driving-for-Dollars map mode", d: "Mobile map to tag off-market properties in the field and auto-create draft records.", done: false },
  { icon: Copy, t: "Address normalization + dedupe", d: "normalizeAddress + geohash proximity dedupe live. Batch merge function cleans duplicates.", done: true },
  { icon: Bug, t: "Failure counter + auto-pause", d: "DataSource auto-pauses after 3 consecutive failures, recovers next cycle.", done: true },
  { icon: Gauge, t: "SEO + AEO + schema", d: "JSON-LD, sitemap, robots.txt, dynamic sitemap, Search Console sync — all live.", done: true },
];

export default function SystemDNA() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12">
      <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">System DNA</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight sm:text-5xl">The benchmark we're built toward.</h1>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-black/60">
        Hidden Property Intel is engineered against the best distressed-property platforms in the market.
        This page maps their strengths to our capabilities — what we have today, and what we're building next —
        so the team always knows the gap and the goal.
      </p>

      {/* Our capabilities */}
      <section className="mt-14">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl font-light">Our capabilities — live now</h2>
        </div>
        <div className="mt-8 grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
          {OUR_CAPABILITIES.map((c) => (
            <div key={c.t} className="bg-white p-6">
              <div className="flex items-center justify-between">
                <c.icon className="h-6 w-6 text-black/70" />
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-white">{c.status}</span>
              </div>
              <p className="mt-5 font-display text-base tracking-tight">{c.t}</p>
              <p className="mt-2 text-xs leading-relaxed text-black/55">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benchmark matrix */}
      <section className="mt-16">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl font-light">Competitive benchmark</h2>
        </div>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/15 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                <th className="pb-3 pr-4">Platform</th>
                <th className="pb-3 pr-4">Price</th>
                <th className="pb-3 pr-4">Core strength</th>
                <th className="pb-3">What we take from it</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {BENCHMARKS.map((b) => (
                <tr key={b.name} className="align-top">
                  <td className="py-4 pr-4">
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-black/40">{b.url}</p>
                  </td>
                  <td className="py-4 pr-4 text-black/60">{b.price}</td>
                  <td className="py-4 pr-4 text-black/70">{b.strength}</td>
                  <td className="py-4 text-black/60">{b.take}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Roadmap */}
      <section className="mt-16">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl font-light">Next on the DNA ladder</h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROADMAP.map((r) => (
            <div key={r.t} className={`rounded-sm border p-6 ${r.done ? "border-emerald-200 bg-emerald-50/50" : "border-black/10"}`}>
              <div className="flex items-center justify-between">
                <r.icon className={`h-6 w-6 ${r.done ? "text-emerald-600" : "text-black/70"}`} />
                {r.done && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-white">Done</span>}
              </div>
              <p className="mt-5 font-display text-base tracking-tight">{r.t}</p>
              <p className="mt-2 text-xs leading-relaxed text-black/55">{r.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture summary */}
      <section className="mt-16 rounded-sm bg-black p-8 text-white lg:p-12">
        <h2 className="font-display text-2xl font-light">Architecture in one breath</h2>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/70">
          A daily pipeline scrapes county records (LLM web-search + cloud browser) → upserts properties with
          address dedupe → ingests real images → scores every property with AI → traces ownership chains and
          heirs → syncs market analytics. Two autonomous email engines grow the investor network and contact
          distressed owners. Accepted bids generate Solidity escrow contracts on Polygon. A nightly integrity
          sweep auto-heals failures and expires stale inventory. Everything is logged, measurable, and
          auto-healing — so the system stays current without human intervention.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/admin/outreach" className="inline-flex items-center gap-2 rounded-sm bg-white px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-black hover:bg-gold-warm">
            Outreach console <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/admin/test-lab" className="inline-flex items-center gap-2 rounded-sm border border-white/30 px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-white/10">
            Test lab <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}