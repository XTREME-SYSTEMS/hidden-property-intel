import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PropertyCard from "@/components/PropertyCard";
import PricingTiers from "@/components/PricingTiers";
import FAQ from "@/components/FAQ";
import { ArrowRight, Radar, Brain, FileSignature, Sparkles } from "lucide-react";

const STEPS = [
  { icon: Radar, title: "We scrape county records daily", text: "Assessor, tax, probate, foreclosure and obituary filings — surfaced before they hit the MLS." },
  { icon: Brain, title: "AI scores every property", text: "Repair costs, after-repair value, equity and distress severity distilled into one 0–100 score." },
  { icon: FileSignature, title: "Bid and close on-chain", text: "Investors bid, sellers accept, and smart contracts on Polygon handle escrow and deed transfer." },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    base44.entities.Property.filter({ status: "active" }, "-property_score", 6).then(setFeatured);
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-[#0F2A1D] text-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" /> Off-market intelligence, updated daily
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Find distressed properties before anyone else.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            AI-powered platform that scrapes county records, probate filings, and foreclosure data daily to
            surface off-market investment opportunities — with ownership chains, property scores, and smart
            contract closing.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/properties" className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-medium transition-colors hover:bg-emerald-400">
              Browse properties <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/properties" className="rounded-full bg-white/10 px-6 py-3.5 text-sm font-medium ring-1 ring-white/20 transition-colors hover:bg-white/20">
              List your property — free
            </Link>
          </div>

          <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-8 border-t border-white/10 pt-8">
            {[["12,847", "Properties tracked"], ["$340M", "In property value"], ["1,200+", "Active investors"]].map(([v, l]) => (
              <div key={l}>
                <dd className="font-display text-2xl font-semibold tabular-nums sm:text-3xl">{v}</dd>
                <dt className="mt-1 text-xs text-white/60">{l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <h2 className="font-display text-3xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-3xl bg-white p-7 ring-1 ring-[#E5EDEA]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50">
                  <s.icon className="h-5 w-5 text-emerald-600" />
                </span>
                <span className="text-xs uppercase tracking-widest text-[#6B7B72]">Step {i + 1}</span>
              </div>
              <p className="mt-5 text-lg font-medium leading-snug">{s.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#6B7B72]">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:pb-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Featured opportunities</h2>
          <Link to="/properties" className="inline-flex items-center gap-1.5 text-sm text-emerald-700 hover:text-emerald-600">
            View all properties <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight">For investors</h2>
          <p className="mt-3 max-w-xl text-[#6B7B72]">Pick the level of access you need. Cancel anytime.</p>
          <div className="mt-10"><PricingTiers /></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <div className="grid gap-10 rounded-3xl bg-[#0F2A1D] p-9 text-white sm:p-14 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">For sellers — list for free</h2>
            <p className="mt-4 leading-relaxed text-white/70">
              No commission, no listing fees, no closing costs to us. Post your property in minutes and let our AI
              write the listing, price it against comparable sales, and coach you through every offer.
            </p>
            <Link to="/properties" className="mt-7 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-medium hover:bg-emerald-400">
              List your property <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="space-y-4 self-center text-sm">
            {["AI listing optimization — title, description and pricing", "AI negotiation assistant analyzes every offer", "Bid management with proxy-bid visibility", "Smart contract closing with on-chain escrow"].map((t) => (
              <li key={t} className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />{t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Frequently asked</h2>
        <div className="mt-8"><FAQ /></div>
      </section>
    </div>
  );
}