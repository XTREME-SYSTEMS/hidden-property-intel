import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { base44 } from "@/api/base44Client";
import { IMAGES } from "@/lib/luxury";
import LuxuryListingCard from "@/components/luxury/LuxuryListingCard";
import FAQ from "@/components/FAQ";
import { ArrowRight, Radar, Brain, FileSignature, Building2, Users, Scale, BadgeCheck } from "lucide-react";

const INVESTOR_STEPS = [
  { n: "01", t: "Browse off-market inventory", d: "Distressed, probate, tax-delinquent, and foreclosure properties scraped daily from county records — none of it on the MLS." },
  { n: "02", t: "Underwrite with AI", d: "Every property carries a 0–100 score, repair estimate, after-repair value, ownership chain, and comparable sales." },
  { n: "03", t: "Bid and close on-chain", d: "Place bids with proxy bidding, then close with smart-contract escrow on Polygon. Fast, verified, transparent." },
];
const SELLER_STEPS = [
  { n: "01", t: "List in minutes — free", d: "Tell us about the property and the situation. No commissions, no listing fees, ever." },
  { n: "02", t: "AI does the heavy lifting", d: "We price it against comparable sales, write the listing, and surface it to qualified, verified investors." },
  { n: "03", t: "Accept on your terms", d: "Review cash offers with our AI negotiation assistant coaching every counter. You stay in control." },
];
const DIFFERENTIATORS = [
  { icon: Radar, t: "Autonomous county-record scraping", d: "Our cloud browser scans assessor, tax, probate, foreclosure, and obituary records daily to surface inherited and under-stress properties before anyone else." },
  { icon: Users, t: "Full ownership chain + heirs", d: "We trace current owners, previous owners, and potential heirs identified through probate — so you reach the right party, with context." },
  { icon: Brain, t: "AI negotiation assistant", d: "Sellers get a coach that analyzes every offer against market data and scripts the counter — no agent required." },
  { icon: FileSignature, t: "Smart-contract escrow", d: "Solidity contracts on Polygon manage earnest money, signatures, and deed transfer — closing in days, not months." },
];
const INVESTOR_PERKS = [
  { icon: Building2, t: "Off-market inventory", d: "12,800+ distressed properties tracked across 27 states." },
  { icon: Brain, t: "AI scoring & ownership chains", d: "0–100 scores, ARV, repair estimates, and full owner trace." },
  { icon: Scale, t: "Proxy bidding", d: "Set a max and let the system bid for you, auction-style." },
  { icon: FileSignature, t: "On-chain closing", d: "Smart-contract escrow on Polygon. No title-company delays." },
];
const SELLER_PERKS = [
  { icon: BadgeCheck, t: "List for free", d: "No commissions, no listing fees, no closing costs to us." },
  { icon: Brain, t: "AI pricing & listing optimization", d: "We write the listing and price it against comparable sales." },
  { icon: Users, t: "AI negotiation assistant", d: "Every offer analyzed — accept, counter, or reject with reasoning." },
  { icon: Building2, t: "Cash offers from verified investors", d: "A curated pool of 1,200+ investors ready to close." },
];
const PLANS = [
  { name: "Starter", price: 49, tagline: "Explore the database", features: ["Browse all properties", "Search & filters", "Basic property details", "3 saved searches"], featured: false },
  { name: "Pro", price: 149, tagline: "For active investors", features: ["Everything in Starter", "Ownership chains + owner contacts", "Place bids", "ROI calculators", "Market analytics"], featured: true },
  { name: "Elite", price: 499, tagline: "Institutional grade", features: ["Everything in Pro", "Proxy (auto) bidding", "Smart-contract closing", "Unlimited saved searches", "Commercial properties"], featured: false },
];

export default function LuxuryHome() {
  const [featured, setFeatured] = useState([]);
  useEffect(() => {
    base44.entities.Property.filter({ status: "active", is_featured: true }, "-property_score", 6).then(setFeatured).catch(() => {});
  }, []);

  return (
    <div className="font-body">
      {/* Hero */}
      <section className="relative h-[94vh] min-h-[660px] w-full overflow-hidden bg-black">
        <Image src={IMAGES.hero} alt="PropertyIntel" fittingType="fill" className="absolute inset-0 h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />
        <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-end px-6 pb-20 lg:px-12">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/60">PropertyIntel · The distressed property marketplace</p>
          <h1 className="mt-6 max-w-4xl font-display text-5xl font-light leading-[1.02] tracking-tight text-white sm:text-7xl lg:text-8xl">
            Where distressed sellers<br />meet serious investors.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-white/70">
            We scrape county records daily to surface off-market distressed, inherited, and under-stress properties —
            then connect motivated sellers with verified investors ready to close. AI pricing, ownership-chain
            intelligence, and on-chain escrow built in.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/listings" className="group inline-flex items-center gap-3 rounded-sm bg-white px-7 py-4 text-[11px] uppercase tracking-[0.3em] text-black transition-colors hover:bg-black hover:text-white">
              Browse distressed inventory
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/listings" className="inline-flex items-center gap-3 rounded-sm border border-white/40 px-7 py-4 text-[11px] uppercase tracking-[0.3em] text-white transition-colors hover:bg-white/10">
              List your property — free
            </Link>
          </div>
          <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-8 border-t border-white/10 pt-8 sm:grid-cols-4">
            {[["12,847", "Properties tracked"], ["$340M", "In property value"], ["1,200+", "Active investors"], ["1,400+", "Deals closed"]].map(([v, l]) => (
              <div key={l}>
                <dd className="font-display text-2xl font-light tabular-nums sm:text-3xl">{v}</dd>
                <dt className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/50">{l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Positioning */}
      <section className="mx-auto max-w-[1400px] px-6 py-24 lg:px-12 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Two sides. One marketplace.</p>
          <p className="font-display text-2xl font-light leading-snug tracking-tight text-black sm:text-3xl">
            Most platforms serve one side of the deal. PropertyIntel serves both — giving sellers a free, AI-guided
            path to a fair cash offer, and investors a daily-refreshed pipeline of off-market distressed inventory
            with the underwriting already done.
          </p>
        </div>
      </section>

      {/* How it works — dual track */}
      <section id="how-it-works" className="border-y border-black/10 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-12 lg:py-32">
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">How it works</p>
          <h2 className="mt-3 font-display text-4xl font-light tracking-tight sm:text-5xl">A clear path for both sides.</h2>
          <div className="mt-14 grid gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-black/50">For investors</p>
              <ol className="mt-8 space-y-8">
                {INVESTOR_STEPS.map((s) => (
                  <li key={s.n} className="flex gap-6 border-b border-black/10 pb-8">
                    <span className="font-display text-2xl font-light tabular-nums text-black/30">{s.n}</span>
                    <div>
                      <p className="font-display text-xl tracking-tight">{s.t}</p>
                      <p className="mt-2 text-sm leading-relaxed text-black/60">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link to="/listings" className="mt-8 inline-flex items-center gap-3 border-b border-black pb-2 text-[11px] uppercase tracking-[0.3em] hover:text-black/60">
                Start browsing <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-black/50">For sellers</p>
              <ol className="mt-8 space-y-8">
                {SELLER_STEPS.map((s) => (
                  <li key={s.n} className="flex gap-6 border-b border-black/10 pb-8">
                    <span className="font-display text-2xl font-light tabular-nums text-black/30">{s.n}</span>
                    <div>
                      <p className="font-display text-xl tracking-tight">{s.t}</p>
                      <p className="mt-2 text-sm leading-relaxed text-black/60">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link to="/listings" className="mt-8 inline-flex items-center gap-3 border-b border-black pb-2 text-[11px] uppercase tracking-[0.3em] hover:text-black/60">
                List your property <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured distressed listings */}
      <section className="mx-auto max-w-[1400px] px-6 py-24 lg:px-12 lg:py-32">
        <div className="flex items-end justify-between border-b border-black/10 pb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Featured inventory</p>
            <h2 className="mt-3 font-display text-3xl font-light tracking-tight sm:text-4xl">Fresh distressed opportunities</h2>
          </div>
          <Link to="/listings" className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.3em] hover:text-black/60 sm:flex">
            All properties <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => <LuxuryListingCard key={p.id} property={p} />)}
          {!featured.length && <p className="text-sm text-black/50">Loading inventory…</p>}
        </div>
      </section>

      {/* For investors */}
      <section id="investors" className="border-y border-black/10 bg-black text-white">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-12 lg:py-32">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">For investors</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-light tracking-tight sm:text-5xl">An off-market pipeline, underwritten for you.</h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {INVESTOR_PERKS.map((p) => (
              <div key={p.t} className="border-t border-white/15 pt-6">
                <p.icon className="h-6 w-6 text-white/70" />
                <p className="mt-5 font-display text-lg tracking-tight">{p.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{p.d}</p>
              </div>
            ))}
          </div>

          <p className="mt-20 text-[11px] uppercase tracking-[0.4em] text-white/40">Membership</p>
          <h3 className="mt-3 font-display text-3xl font-light tracking-tight">Choose your access level.</h3>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.name} className={`flex flex-col rounded-sm p-8 ${p.featured ? "bg-white text-black" : "border border-white/20"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">{p.name}</p>
                  {p.featured && <span className="rounded-sm bg-black px-2.5 py-1 text-[9px] uppercase tracking-[0.25em] text-white">Popular</span>}
                </div>
                <p className={`mt-5 font-display text-4xl font-light tabular-nums ${p.featured ? "text-black" : "text-white"}`}>
                  ${p.price}<span className="text-base text-white/50">/mo</span>
                </p>
                <p className={`mt-1 text-sm ${p.featured ? "text-black/60" : "text-white/50"}`}>{p.tagline}</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className={`mt-2 h-1 w-1 shrink-0 rounded-full ${p.featured ? "bg-black" : "bg-white/60"}`} />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/listings" className={`mt-8 rounded-sm py-3.5 text-center text-[11px] uppercase tracking-[0.3em] transition-colors ${p.featured ? "bg-black text-white hover:bg-black/80" : "border border-white/40 text-white hover:bg-white/10"}`}>
                  Choose {p.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For sellers */}
      <section id="sellers" className="mx-auto max-w-[1400px] px-6 py-24 lg:px-12 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">For sellers</p>
            <h2 className="mt-3 font-display text-4xl font-light leading-tight tracking-tight sm:text-5xl">List free.<br />Sell on your terms.</h2>
            <p className="mt-6 max-w-md leading-relaxed text-black/60">
              Whether you're dealing with a probate inheritance, a pre-foreclosure, or a property that's become a
              burden — PropertyIntel gets you a fair cash offer from a verified investor, with an AI assistant in
              your corner. No commissions. No fees.
            </p>
            <Link to="/listings" className="mt-8 inline-flex items-center gap-3 rounded-sm bg-black px-7 py-4 text-[11px] uppercase tracking-[0.3em] text-white transition-colors hover:bg-black/80">
              List your property — free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {SELLER_PERKS.map((p) => (
              <div key={p.t} className="rounded-sm border border-black/10 p-6">
                <p.icon className="h-6 w-6 text-black/70" />
                <p className="mt-5 font-display text-lg tracking-tight">{p.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-black/55">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-12 lg:py-32">
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Why PropertyIntel</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-light tracking-tight sm:text-5xl">Four things no competitor does.</h2>
          <div className="mt-14 grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 sm:grid-cols-2">
            {DIFFERENTIATORS.map((d) => (
              <div key={d.t} className="bg-white p-8 lg:p-10">
                <d.icon className="h-7 w-7 text-black/70" />
                <p className="mt-6 font-display text-xl tracking-tight">{d.t}</p>
                <p className="mt-3 text-sm leading-relaxed text-black/60">{d.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[1100px] px-6 py-24 lg:px-12 lg:py-32">
        <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Frequently asked</p>
        <h2 className="mt-3 font-display text-4xl font-light tracking-tight sm:text-5xl">Questions, answered.</h2>
        <div className="mt-10"><FAQ /></div>
      </section>

      {/* Final CTA */}
      <section className="bg-black px-6 py-24 text-center text-white lg:px-12 lg:py-32">
        <h2 className="mx-auto max-w-2xl font-display text-4xl font-light leading-tight tracking-tight sm:text-5xl">
          Join the marketplace built for both sides of the deal.
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/listings" className="inline-flex items-center gap-3 rounded-sm bg-white px-7 py-4 text-[11px] uppercase tracking-[0.3em] text-black transition-colors hover:bg-black hover:text-white">
            Browse inventory <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/listings" className="inline-flex items-center gap-3 rounded-sm border border-white/40 px-7 py-4 text-[11px] uppercase tracking-[0.3em] text-white transition-colors hover:bg-white/10">
            List your property
          </Link>
        </div>
      </section>
    </div>
  );
}