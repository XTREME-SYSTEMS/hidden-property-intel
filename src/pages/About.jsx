import React from "react";
import { Link } from "react-router-dom";
import { Radar, Brain, FileSignature, Users, ShieldCheck } from "lucide-react";

export default function About() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 py-20 lg:px-12">
      <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">About</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight sm:text-5xl">
        Hidden Property Intel finds what others miss.
      </h1>

      <div className="mt-10 max-w-3xl space-y-6 text-base leading-relaxed text-black/70">
        <p>
          Hidden Property Intel is an AI-powered real estate intelligence platform built for one purpose: surfacing
          distressed and off-market properties before they reach the public listing services. Every day, an autonomous
          pipeline scans county assessor, tax-collector, probate, foreclosure, and code-violation records across the
          country, normalizes and deduplicates the data, and turns it into actionable investment inventory — complete
          with ownership chains, AI deal scoring, estimated repair costs, and after-repair value.
        </p>
        <p>
          The platform serves two audiences. For real estate investors, it offers a marketplace of pre-vetted
          distressed properties, each scored 0–100 for investment quality, with ROI calculators, exit-strategy
          modeling, and a negotiation assistant that scripts counter-offers against live market data. For distressed
          property owners — those facing foreclosure, probate, tax delinquency, or code violations — it offers a
          commission-free path to a fair cash offer, backed by AI pricing and on-chain escrow that closes in days
          rather than months.
        </p>
        <p>
          Hidden Property Intel is built and operated by a team specializing in distressed real estate and applied AI,
          in partnership with Giordano Customs, a licensed Florida real estate brokerage led by Steve Giordano. The
          platform combines public-records data engineering, large-language-model valuation, and Polygon smart-contract
          escrow to make distressed property transactions faster, more transparent, and more accurate than the
          traditional MLS-driven process.
        </p>
      </div>

      <div className="mt-14 grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Radar, t: "Autonomous data pipeline", d: "Daily county-record harvest across 27+ states." },
          { icon: Brain, t: "AI deal scoring", d: "0–100 investment score, ARV, and repair estimates." },
          { icon: Users, t: "Ownership intelligence", d: "Full ownership chains and probate heir tracing." },
          { icon: FileSignature, t: "On-chain escrow", d: "Polygon smart contracts for fast, transparent closings." },
        ].map((f) => (
          <div key={f.t} className="bg-white p-6">
            <f.icon className="h-6 w-6 text-black/70" />
            <p className="mt-4 font-display text-base tracking-tight">{f.t}</p>
            <p className="mt-2 text-xs leading-relaxed text-black/55">{f.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 flex flex-wrap gap-3">
        <Link to="/listings" className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-black/80">
          Browse inventory
        </Link>
        <Link to="/contact" className="inline-flex items-center gap-2 rounded-sm border border-black/15 px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-black hover:bg-black/5">
          Contact us
        </Link>
      </div>
    </div>
  );
}