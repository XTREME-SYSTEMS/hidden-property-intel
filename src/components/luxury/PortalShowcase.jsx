import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Gavel, LayoutGrid, Bell, TrendingUp, Scale, Building2, Brain } from "lucide-react";

const TABS = {
  investor: {
    label: "Investor portal",
    features: [
      { icon: Gavel, t: "Live bidding dashboard", d: "Place bids, set proxy maxes, and watch auctions resolve in real time." },
      { icon: LayoutGrid, t: "Deal pipeline", d: "Track every property from lead to exit across seven clear stages." },
      { icon: TrendingUp, t: "ROI calculators", d: "Model flips, BRRRR, and buy-and-hold with repair, holding, and ARV inputs." },
      { icon: Bell, t: "Instant alerts", d: "Get notified on outbids, price drops, and new matches the moment they happen." },
    ],
  },
  seller: {
    label: "Seller portal",
    features: [
      { icon: Scale, t: "Offer comparison", d: "Review every cash offer side-by-side with AI-scored terms and recommendations." },
      { icon: Brain, t: "AI negotiation coach", d: "Every counter offer analyzed against market data — accept, counter, or reject with reasoning." },
      { icon: Building2, t: "Listing management", d: "Edit your listing, upload photos, and track investor activity in one place." },
      { icon: Bell, t: "Bid notifications", d: "Know the second an offer arrives, a bid is accepted, or a contract advances." },
    ],
  },
};

function MockPortal({ tab }) {
  return (
    <div className="relative">
      {/* Browser frame */}
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-1.5 border-b border-black/10 bg-black/[0.02] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
          <span className="ml-3 rounded-md bg-white px-3 py-1 text-[10px] text-black/40 shadow-sm">
            my-property-intel.base44.app/{tab === "investor" ? "investor/dashboard" : "seller/dashboard"}
          </span>
        </div>

        {tab === "investor" ? <InvestorMock /> : <SellerMock />}
      </div>
    </div>
  );
}

function InvestorMock() {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm tracking-tight">Active Bids</p>
        <span className="rounded-md bg-black px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-white">3 live</span>
      </div>
      <div className="mt-4 space-y-3">
        {[
          { addr: "4821 Lindcrest Dr", city: "Phoenix, AZ", bid: "$201,000", score: 87, status: "Leading", statusClass: "bg-green-100 text-green-700" },
          { addr: "119 Maple St", city: "Atlanta, GA", bid: "$94,500", score: 72, status: "Outbid", statusClass: "bg-amber-100 text-amber-700" },
          { addr: "770 River Rd", city: "Tampa, FL", bid: "$142,000", score: 81, status: "Proxy", statusClass: "bg-blue-100 text-blue-700" },
        ].map((b) => (
          <div key={b.addr} className="flex items-center justify-between rounded-lg border border-black/[0.07] p-3.5">
            <div>
              <p className="text-sm font-medium">{b.addr}</p>
              <p className="text-[11px] text-black/45">{b.city} · Score {b.score}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-sm tabular-nums">{b.bid}</p>
              <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${b.statusClass}`}>
                {b.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-black/[0.03] p-3">
        <TrendingUp className="h-4 w-4 text-gold" />
        <p className="text-[11px] text-black/55">Pipeline value <span className="font-semibold text-black">$1.42M</span> across 7 deals</p>
      </div>
    </div>
  );
}

function SellerMock() {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm tracking-tight">Latest Offers</p>
        <span className="rounded-md bg-gold/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-gold">2 new</span>
      </div>
      <div className="mt-4 space-y-3">
        {[
          { inv: "Thompson Capital", amt: "$284,000", rec: "Strong", recClass: "bg-green-100 text-green-700" },
          { inv: "BlueLine Holdings", amt: "$271,500", rec: "Counter", recClass: "bg-amber-100 text-amber-700" },
        ].map((o) => (
          <div key={o.inv} className="rounded-lg border border-black/[0.07] p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{o.inv}</p>
              <p className="font-display text-sm tabular-nums">{o.amt}</p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-black/45">Cash · 7-day close · No contingencies</span>
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${o.recClass}`}>
                AI: {o.rec}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-gold/[0.06] p-3.5">
        <Brain className="h-4 w-4 shrink-0 text-gold" />
        <p className="text-[11px] leading-relaxed text-black/65">
          <span className="font-semibold text-black">AI suggests:</span> Counter Thompson at $291,000 — comps support $296K.
        </p>
      </div>
    </div>
  );
}

export default function PortalShowcase() {
  const [tab, setTab] = useState("investor");
  const active = TABS[tab];

  return (
    <section className="border-y border-black/10 bg-white">
      <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-12 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          {/* Copy + tabs */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Client portals</p>
            <h2 className="mt-4 font-display text-4xl font-light leading-[1.05] tracking-tight sm:text-5xl">
              Your deal room,<br />
              <span className="text-gold">always in your pocket.</span>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-black/60">
              A dedicated portal for every investor and seller — track bids, manage listings, negotiate with AI,
              and close on-chain, all in one polished command center.
            </p>

            {/* Tab switcher */}
            <div className="mt-8 inline-flex rounded-lg border border-black/10 bg-black/[0.02] p-1">
              {Object.entries(TABS).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`rounded-md px-5 py-2.5 font-brand text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-200 ${
                    tab === key ? "bg-black text-white shadow-sm" : "text-black/45 hover:text-black"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {active.features.map((f) => (
                <div key={f.t} className="flex gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-black/10 bg-black/[0.02]">
                    <f.icon className="h-4 w-4 text-gold" />
                  </span>
                  <div>
                    <p className="font-display text-[15px] tracking-tight">{f.t}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-black/55">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to={tab === "investor" ? "/investor/dashboard" : "/seller/dashboard"}
              className="group mt-10 inline-flex items-center gap-2.5 rounded-md bg-black px-6 py-3.5 font-brand text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-all duration-200 hover:bg-gold hover:text-black"
            >
              Open the {tab === "investor" ? "investor" : "seller"} portal
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Mock portal */}
          <MockPortal tab={tab} />
        </div>
      </div>
    </section>
  );
}