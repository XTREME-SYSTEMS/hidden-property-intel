import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Seo from "@/components/Seo";
import FloatIn from "@/components/FloatIn";
import { Sparkles, Gift, Copy, Check, Zap, Crown, ArrowRight, ShieldCheck, Star, Clock, TrendingUp } from "lucide-react";

const PROMO = "ELITE30";

const ELITE_FEATURES = [
  "Everything in Pro, unlocked",
  "Proxy (auto) bidding on any deal",
  "Smart-contract escrow closing on Polygon",
  "Unlimited saved searches & alerts",
  "Commercial properties & multi-family",
  "Priority investor leaderboard ranking",
  "Institutional-grade deal flow",
  "Direct broker support line",
];

export default function LaunchElite() {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const start = async () => {
    if (window.self !== window.top) {
      alert("Checkout works only from the published app. Open the app in a new tab to claim your free Elite month.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("createCheckoutSession", {
        plan: "elite",
        promotion_code: PROMO,
        success_url: window.location.origin + "/investor/dashboard?upgraded=elite",
        cancel_url: window.location.origin + "/launch",
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError(res.data?.error || "Could not start checkout. Try again in a moment.");
      }
    } catch (e) {
      setError(e.message || "Checkout failed to start.");
    }
    setBusy(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(PROMO);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden">
      <Seo
        title="Launch Offer — Free 1 Month of Elite | Hidden Property Intel"
        description="Launch celebration: claim one free month of Hidden Property Intel Elite ($499/mo value) with promo code ELITE30. Proxy bidding, smart-contract escrow, unlimited searches, and commercial deals. No card charged for 30 days."
        keywords="free elite real estate platform, HPI launch offer, ELITE30 promo code, free month real estate investor, smart contract escrow free trial, distressed property platform free"
        path="/launch"
      />

      {/* HERO */}
      <section className="relative bg-black px-6 py-24 text-white lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 50% 10%, rgba(229,182,83,0.3), transparent 50%)" }} />
        <div className="relative mx-auto max-w-[1100px] text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-warm/40 px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] text-gold-warm">
            <Sparkles className="h-3.5 w-3.5" /> Launch celebration
          </div>
          <h1 className="mt-7 font-display text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            One free month of <em className="not-italic text-gold-warm">Elite</em>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70">
            To celebrate the launch of Hidden Property Intel, we're giving away a full month of our top-tier Elite
            membership — a $499 value — free. No card charged for 30 days. Cancel anytime.
          </p>

          {/* Promo code card */}
          <FloatIn className="mx-auto mt-10 max-w-md">
            <div className="rounded-2xl border border-gold-warm/40 bg-white/[0.04] p-6 backdrop-blur">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Your promo code</p>
              <div className="mt-3 flex items-center gap-3">
                <code className="flex-1 rounded-sm border border-gold-warm/30 bg-black px-4 py-3 font-mono text-2xl tracking-[0.2em] text-gold-warm">
                  {PROMO}
                </code>
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-1.5 rounded-sm bg-gold-warm px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-black hover:opacity-90"
                >
                  {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
                </button>
              </div>
              <button
                onClick={start}
                disabled={busy}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-gold-warm px-6 py-4 text-[11px] uppercase tracking-[0.3em] text-black transition hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Starting checkout…" : <>Claim my free month <ArrowRight className="h-4 w-4" /></>}
              </button>
              {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
              <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-white/40">
                $0 today · $499/mo after 30 days · cancel anytime
              </p>
            </div>
          </FloatIn>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">What's in Elite</p>
          <h2 className="mt-3 font-display text-3xl font-light tracking-tight sm:text-5xl">
            Everything, unlocked — for 30 days, free.
          </h2>
          <FloatIn className="mt-12 grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 sm:grid-cols-2">
            {ELITE_FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-3 bg-white p-6 hpi-hover">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black text-gold-warm">
                  <Check className="h-4 w-4" />
                </div>
                <p className="text-sm leading-relaxed text-black/70">{f}</p>
              </div>
            ))}
          </FloatIn>
        </div>
      </section>

      {/* VALUE STRIP */}
      <section className="bg-[#f7f5f0] px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 md:grid-cols-3">
            <div className="bg-white p-8 text-center hpi-hover">
              <Crown className="mx-auto h-7 w-7 text-gold" />
              <p className="mt-4 font-display text-4xl font-light">$499</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-black/40">Monthly value</p>
            </div>
            <div className="bg-white p-8 text-center hpi-hover">
              <Clock className="mx-auto h-7 w-7 text-gold" />
              <p className="mt-4 font-display text-4xl font-light">30 days</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-black/40">Free, no card charged</p>
            </div>
            <div className="bg-white p-8 text-center hpi-hover">
              <TrendingUp className="mx-auto h-7 w-7 text-gold" />
              <p className="mt-4 font-display text-4xl font-light">Cancel</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-black/40">Anytime, no hassle</p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1100px] text-center">
          <div className="flex items-center justify-center gap-2 text-gold">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-gold" />)}
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-black/60">
            Hidden Property Intel operates under the license of Steve Giordano, Licensed Real Estate Broker. Every
            transaction is Florida-compliant, every escrow is secured on the Polygon blockchain, and every deed is
            recorded with the county clerk. Your free month is the full Elite experience — nothing held back.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-black/50">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-gold" /> Licensed FL broker</span>
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-gold" /> Polygon secured</span>
            <span className="flex items-center gap-1.5"><Gift className="h-4 w-4 text-gold" /> No card charged for 30 days</span>
          </div>
          <button
            onClick={start}
            disabled={busy}
            className="mt-10 inline-flex items-center gap-2 rounded-sm bg-black px-8 py-4 text-[11px] uppercase tracking-[0.3em] text-white transition hover:bg-black/80 disabled:opacity-50"
          >
            {busy ? "Starting checkout…" : <>Claim my free Elite month <ArrowRight className="h-4 w-4" /></>}
          </button>
          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
          <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-black/40">
            Promo code <span className="text-gold">{PROMO}</span> · applies automatically at checkout
          </p>
        </div>
      </section>
    </div>
  );
}