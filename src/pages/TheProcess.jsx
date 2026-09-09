import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import FloatIn from "@/components/FloatIn";
import {
  UserPlus, Users, ShieldCheck, Search, Brain, Gavel, MessagesSquare,
  FileSignature, Wallet, ClipboardCheck, Zap, Landmark, KeyRound,
  ArrowRight, Clock, BadgeCheck, Lock, Scale, Sparkles, Play, Pause,
} from "lucide-react";

const STEPS = [
  { n: 1, t: "Create your free account", d: "Sign up in under two minutes. No credit card, no commitment. Sellers are free forever; investors get a free tour of the entire platform.", time: "2 min", icon: UserPlus, grad: "from-amber-50 to-yellow-100", trust: ["No credit card", "Free forever for sellers", "Bank-grade encryption"] },
  { n: 2, t: "Choose your role", d: "Tell us who you are — investor, seller, agent, broker, or business partner. We tailor your dashboard, tools, and workflow to your exact role.", time: "1 min", icon: Users, grad: "from-sky-50 to-blue-100", trust: ["Role-based access", "Personalized dashboard", "Tailored toolset"] },
  { n: 3, t: "Verify your identity (KYC)", d: "We run a quick identity verification to keep the platform trusted and fully compliant. Required once, takes about five minutes.", time: "5 min", icon: ShieldCheck, grad: "from-emerald-50 to-teal-100", trust: ["KYC verified", "Florida compliant", "Bank-grade encryption"] },
  { n: 4, t: "Browse off-market inventory", d: "Explore distressed, probate, tax-delinquent, and foreclosure properties scraped daily from county records — none of it on the MLS.", time: "10 min", icon: Search, grad: "from-violet-50 to-purple-100", trust: ["12,800+ properties", "Daily-refreshed", "Off-market only"] },
  { n: 5, t: "AI underwriting & pricing", d: "Every property is AI-scored 0–100 with ARV, repair estimates, ownership chains, and comparable sales. Sellers get an instant fair-offer price.", time: "~1 hour", icon: Brain, grad: "from-rose-50 to-pink-100", trust: ["0–100 AI score", "ARV + repair estimates", "Comparable sales"] },
  { n: 6, t: "Place your bid", d: "Investors place bids with proxy bidding. Sellers receive cash offers from a curated pool of 1,200+ verified, ready-to-close investors.", time: "~1 day", icon: Gavel, grad: "from-orange-50 to-amber-100", trust: ["Proxy bidding", "1,200+ verified investors", "Cash offers"] },
  { n: 7, t: "AI negotiation assistant", d: "Our AI coach analyzes every offer against live market data and scripts the counter — for both sides. You stay in complete control.", time: "1–3 days", icon: MessagesSquare, grad: "from-cyan-50 to-sky-100", trust: ["AI counter-scripts", "Market-data backed", "You stay in control"] },
  { n: 8, t: "Smart contract deployed", d: "Once terms are agreed, HPI generates and deploys the escrow contract to the Polygon blockchain automatically. No attorney drafting fees.", time: "15 min", icon: FileSignature, grad: "from-indigo-50 to-blue-100", trust: ["Auto-generated", "Polygon secured", "Audited contract"] },
  { n: 9, t: "Earnest money on-chain", d: "Your good-faith deposit is locked in the smart contract in USDC — tamper-proof, traceable, and with zero wire-fraud risk.", time: "5 min", icon: Wallet, grad: "from-lime-50 to-green-100", trust: ["USDC stablecoin", "Zero wire-fraud", "Immutable record"] },
  { n: 10, t: "Inspection & contingencies", d: "Inspection, financing, and title contingencies are tracked automatically. Fail one and the contract refunds your deposit instantly — guaranteed by code.", time: "7–14 days", icon: ClipboardCheck, grad: "from-yellow-50 to-amber-100", trust: ["Auto-tracked", "Auto-refund on fail", "Title insured"] },
  { n: 11, t: "Funds released instantly", d: "On mutual confirmation, earnest money releases to the seller in minutes — no wire window, no bank hold, no fraud risk.", time: "instant", icon: Zap, grad: "from-emerald-50 to-green-100", trust: ["Instant release", "No bank hold", "On-chain proof"] },
  { n: 12, t: "Deed recorded & title transferred", d: "HPI coordinates the title search, title insurance, and deed recording with the county clerk. Legal ownership officially transfers to you.", time: "1–2 days", icon: Landmark, grad: "from-stone-50 to-amber-100", trust: ["Title insured", "County recorded", "Licensed broker"] },
  { n: 13, t: "Keys & settlement delivered", d: "You receive the keys, the final settlement statement, and a permanent on-chain transaction record. The deal is officially closed.", time: "same day", icon: KeyRound, grad: "from-amber-100 to-yellow-200", trust: ["Keys in hand", "Settlement statement", "Permanent on-chain record"] },
];

const TRUST_STRIP = [
  { icon: Scale, label: "Licensed FL broker" },
  { icon: Lock, label: "Polygon secured" },
  { icon: BadgeCheck, label: "Title insured" },
  { icon: ShieldCheck, label: "KYC verified" },
  { icon: FileSignature, label: "Immutable record" },
];

export default function TheProcess() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const stepRefs = useRef([]);

  // Auto-advance the active step left → right, slowly.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 3800);
    return () => clearInterval(id);
  }, [playing]);

  // Scroll sync: the zig-zag step in view drives the top timeline.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number(e.target.dataset.idx);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        });
      },
      { threshold: 0.5 }
    );
    stepRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const goTo = useCallback((i) => setActive(i), []);
  const activeStep = STEPS[active];

  return (
    <div className="overflow-hidden">
      <Seo
        title="The Process — From Sign-Up to Keys in Hand | Hidden Property Intel"
        description="An interactive, step-by-step timeline of the entire Hidden Property Intel journey — from free account creation through AI underwriting, smart-contract escrow, deed recording, and keys in hand. Every step timed. Every stage explained."
        keywords="real estate closing process, smart contract escrow process, how to close a real estate deal, step by step real estate timeline, deed recording process, title transfer process, AI real estate workflow"
        path="/process"
      />

      {/* HERO */}
      <section className="relative bg-black px-6 py-24 text-white lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 70% 20%, rgba(229,182,83,0.25), transparent 45%)" }} />
        <div className="relative mx-auto max-w-[1400px]">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-gold-warm">
            <Sparkles className="h-4 w-4" /> The Process
          </div>
          <h1 className="mt-6 max-w-4xl font-display text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            From sign-up to <em className="not-italic text-gold-warm">keys in hand</em> — every step, timed.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/70">
            Watch the entire Hidden Property Intel journey unfold. The timeline below auto-advances step by step —
            scroll the zig-zag and the top timeline stays in sync. Each stage carries a real time estimate and the
            trust safeguards that protect you.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-sm bg-gold-warm px-6 py-3.5 text-[11px] uppercase tracking-[0.3em] text-black hover:opacity-90">
              Start step 1 <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/smart-contracts" className="inline-flex items-center gap-2 rounded-sm border border-white/25 px-6 py-3.5 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-white/10">
              Smart-contract escrow
            </Link>
          </div>
        </div>
      </section>

      {/* STICKY HORIZONTAL TIMELINE */}
      <section className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-6 py-4 lg:px-12">
          <div className="flex items-center justify-between gap-4">
            <p className="hidden text-[10px] uppercase tracking-[0.3em] text-black/40 sm:block">The journey</p>
            <button
              onClick={() => setPlaying((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-black/60 hover:bg-black hover:text-white"
            >
              {playing ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Play</>}
            </button>
          </div>

          {/* Circle row */}
          <div className="mt-3 flex items-center overflow-x-auto pb-2">
            <div className="relative flex min-w-max items-center">
              {/* connecting line */}
              <div className="absolute left-0 right-0 top-5 h-px bg-black/10" />
              <div
                className="absolute left-0 top-5 h-px bg-gold-warm transition-all duration-700"
                style={{ width: `${(active / (STEPS.length - 1)) * 100}%` }}
              />
              {STEPS.map((s, i) => {
                const isActive = i === active;
                const isDone = i < active;
                return (
                  <button
                    key={s.n}
                    onClick={() => goTo(i)}
                    className="relative z-10 flex flex-col items-center px-2"
                  >
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-full border-2 text-xs font-semibold transition-all duration-300 ${
                        isActive
                          ? "scale-125 border-gold-warm bg-gold-warm text-black shadow-[0_0_0_4px_rgba(229,182,83,0.25)]"
                          : isDone
                          ? "border-gold-warm bg-white text-gold-warm"
                          : "border-black/20 bg-white text-black/40"
                      }`}
                    >
                      {isDone ? "✓" : s.n}
                    </span>
                    <span className={`mt-2 hidden text-center text-[9px] uppercase tracking-[0.15em] lg:block ${isActive ? "text-black" : "text-black/40"}`}>
                      {s.t.split(" ").slice(0, 2).join(" ")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active step illuminated description */}
          <div className="mt-2 rounded-sm border border-gold-warm/40 bg-gold-warm/[0.06] p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-warm text-sm font-bold text-black">{activeStep.n}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-base tracking-tight">{activeStep.t}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-gold-warm">
                    <Clock className="h-2.5 w-2.5" /> {activeStep.time}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-black/60">{activeStep.d}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ZIG-ZAG STEP DETAIL */}
      <section className="mx-auto max-w-[1200px] px-6 py-20 lg:px-12 lg:py-28">
        <div className="space-y-20 lg:space-y-28">
          {STEPS.map((s, i) => {
            const isActive = i === active;
            const left = i % 2 === 0;
            return (
              <div
                key={s.n}
                ref={(el) => (stepRefs.current[i] = el)}
                data-idx={i}
                className="scroll-mt-64"
              >
                <FloatIn
                  className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${!left ? "lg:[direction:rtl]" : ""}`}
                >
                  {/* Visual */}
                  <div className={`[direction:ltr]`}>
                    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${s.grad} ${isActive ? "border-gold-warm shadow-[0_0_0_1px_rgba(229,182,83,0.5),0_20px_50px_-20px_rgba(195,138,27,0.4)]" : "border-black/10"} p-8 transition-all duration-500`}>
                      <span className="pointer-events-none absolute -right-4 -top-6 font-display text-[120px] font-light leading-none text-black/5">
                        {String(s.n).padStart(2, "0")}
                      </span>
                      <s.icon className="h-12 w-12 text-black/70" />
                      <div className="mt-6 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-gold-warm">
                          <Clock className="h-3 w-3" /> {s.time}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-black/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-black/50">
                          Step {s.n} of {STEPS.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Text */}
                  <div className="[direction:ltr]">
                    <span className="font-mono text-sm text-gold-warm">{String(s.n).padStart(2, "0")}</span>
                    <h3 className={`mt-2 font-display text-2xl font-light tracking-tight transition-colors sm:text-3xl ${isActive ? "text-black" : "text-black/80"}`}>
                      {s.t}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-black/60 sm:text-base">{s.d}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {s.trust.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/50 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-700">
                          <BadgeCheck className="h-3 w-3" /> {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </FloatIn>
              </div>
            );
          })}
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-12">
          <p className="text-center text-[10px] uppercase tracking-[0.4em] text-black/40">Protected at every stage</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {TRUST_STRIP.map((t) => (
              <div key={t.label} className="flex items-center gap-2 text-sm text-black/60">
                <t.icon className="h-5 w-5 text-gold" /> {t.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEED RECORDING NOTE */}
      <section className="mx-auto max-w-[1000px] px-6 py-20 lg:px-12 lg:py-28">
        <div className="rounded-2xl border border-black/10 bg-[#f7f5f0] p-8 lg:p-12">
          <Landmark className="h-8 w-8 text-gold" />
          <h2 className="mt-5 font-display text-2xl font-light tracking-tight sm:text-3xl">
            Automated deed recording & title transfer
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-black/60">
            Steps 11–13 are coordinated end-to-end by HPI. Funds release on-chain instantly, then our team orchestrates
            the title search, title insurance, and deed recording with the county clerk. In counties that support
            e-recording, the deed is filed the same day. You receive both a permanent on-chain transaction record and
            the legally recorded deed — proof of funds flow and proof of ownership, together.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-black/45">
            Full e-recording automation (direct county API integration via Simplifile / ePN) is on the roadmap. Today,
            HPI coordinates recording through licensed title professionals — fully compliant, fully handled for you.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black px-6 py-24 text-center text-white lg:px-12 lg:py-32">
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-light leading-tight tracking-tight sm:text-5xl">
          Ready to start at step 1?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/65">
          It takes two minutes, it's free, and every step after is mapped out for you.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/register" className="inline-flex items-center gap-2 rounded-sm bg-gold-warm px-7 py-4 text-[11px] uppercase tracking-[0.3em] text-black hover:opacity-90">
            Create free account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/launch" className="inline-flex items-center gap-2 rounded-sm border border-white/25 px-7 py-4 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-white/10">
            Claim free Elite month
          </Link>
        </div>
      </section>
    </div>
  );
}