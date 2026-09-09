import React from "react";
import { Link } from "react-router-dom";
import { Radar, Brain, FileSignature, Users, ArrowRight } from "lucide-react";
import Seo from "@/components/Seo";

export default function About() {
  return (
    <div>
      <Seo
        title="About — AI-Powered Distressed Property Intelligence"
        description="Hidden Property Intel is an AI-powered real estate intelligence platform that surfaces distressed and off-market properties before they reach the MLS. Daily county-record scraping, AI deal scoring, ownership chain tracing, and Polygon smart-contract escrow."
        keywords="about hidden property intel, AI real estate platform, distressed property intelligence, real estate data platform, off-market real estate technology, AI property valuation, smart contract real estate, Polygon escrow real estate"
        path="/about"
        jsonLd={{
          "@context": "https://schema.org", "@type": "AboutPage", "name": "About Hidden Property Intel",
          "description": "AI-powered distressed property intelligence platform surfacing off-market properties before they reach the MLS.",
          "url": "https://hiddenpropertyintel.com/about",
          "mainEntity": {
            "@type": "Organization", "name": "Hidden Property Intel", "url": "https://hiddenpropertyintel.com/",
            "description": "AI-powered distressed property intelligence platform connecting off-market sellers with serious real estate investors.",
            "foundingDate": "2024",
            "knowsAbout": ["Distressed Property", "Pre-Foreclosure", "Probate Real Estate", "Real Estate Investment", "Property Valuation", "Skip Tracing", "Smart Contract Escrow", "AI Property Scoring"]
          }
        }}
      />

      <section className="z-page-hero">
        <p className="z-page-eyebrow">About</p>
        <h1 className="z-page-h1">Hidden Property Intel finds what others miss.</h1>
      </section>

      <section className="z-section-pad" style={{ paddingTop: 8, maxWidth: 820 }}>
        <div style={{ display: "grid", gap: 20 }}>
          <p className="z-page-lead">Hidden Property Intel is an AI-powered real estate intelligence platform built for one purpose: surfacing distressed and off-market properties before they reach the public listing services. Every day, an autonomous pipeline scans county assessor, tax-collector, probate, foreclosure, and code-violation records across the country, normalizes and deduplicates the data, and turns it into actionable investment inventory — complete with ownership chains, AI deal scoring, estimated repair costs, and after-repair value.</p>
          <p className="z-page-lead">The platform serves two audiences. For real estate investors, it offers a marketplace of pre-vetted distressed properties, each scored 0–100 for investment quality, with ROI calculators, exit-strategy modeling, and a negotiation assistant that scripts counter-offers against live market data. For distressed property owners — those facing foreclosure, probate, tax delinquency, or code violations — it offers a commission-free path to a fair cash offer, backed by AI pricing and on-chain escrow that closes in days rather than months.</p>
          <p className="z-page-lead">Hidden Property Intel is built and operated by a team specializing in distressed real estate and applied AI, in partnership with Giordano Customs, a licensed Florida real estate brokerage led by Steve Giordano. The platform combines public-records data engineering, large-language-model valuation, and Polygon smart-contract escrow to make distressed property transactions faster, more transparent, and more accurate than the traditional MLS-driven process.</p>
        </div>
      </section>

      <section className="z-section-alt">
        <div className="z-section-alt-inner">
          <div className="z-grid-4">
            {[
              { icon: Radar, t: "Autonomous data pipeline", d: "Daily county-record harvest across 27+ states." },
              { icon: Brain, t: "AI deal scoring", d: "0–100 investment score, ARV, and repair estimates." },
              { icon: Users, t: "Ownership intelligence", d: "Full ownership chains and probate heir tracing." },
              { icon: FileSignature, t: "On-chain escrow", d: "Polygon smart contracts for fast, transparent closings." },
            ].map((f) => (
              <div key={f.t} className="z-feature-card">
                <f.icon size={24} />
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
          <div className="z-cta-row" style={{ justifyContent: "flex-start", marginTop: 32 }}>
            <Link to="/v2/listings" className="v2-btn v2-btn-primary">Browse inventory <ArrowRight size={16} /></Link>
            <Link to="/contact" className="v2-btn v2-btn-ghost">Contact us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}