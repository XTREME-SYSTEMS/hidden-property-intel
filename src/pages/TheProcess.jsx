import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import {
  UserPlus, Users, ShieldCheck, Search, Brain, Gavel, MessagesSquare,
  FileSignature, Wallet, ClipboardCheck, Zap, Landmark, KeyRound,
  ArrowRight, Clock, BadgeCheck, Lock, Scale, Sparkles, Play, Pause,
} from "lucide-react";

const STEPS = [
  { n: 1, t: "Create your free account", d: "Sign up in under two minutes. No credit card, no commitment. Sellers are free forever; investors get a free tour of the entire platform.", time: "2 min", icon: UserPlus, trust: ["No credit card", "Free forever for sellers", "Bank-grade encryption"] },
  { n: 2, t: "Choose your role", d: "Tell us who you are — investor, seller, agent, broker, or business partner. We tailor your dashboard, tools, and workflow to your exact role.", time: "1 min", icon: Users, trust: ["Role-based access", "Personalized dashboard", "Tailored toolset"] },
  { n: 3, t: "Verify your identity (KYC)", d: "We run a quick identity verification to keep the platform trusted and fully compliant. Required once, takes about five minutes.", time: "5 min", icon: ShieldCheck, trust: ["KYC verified", "Florida compliant", "Bank-grade encryption"] },
  { n: 4, t: "Browse off-market inventory", d: "Explore distressed, probate, tax-delinquent, and foreclosure properties scraped daily from county records — none of it on the MLS.", time: "10 min", icon: Search, trust: ["12,800+ properties", "Daily-refreshed", "Off-market only"] },
  { n: 5, t: "AI underwriting & pricing", d: "Every property is AI-scored 0–100 with ARV, repair estimates, ownership chains, and comparable sales. Sellers get an instant fair-offer price.", time: "~1 hour", icon: Brain, trust: ["0–100 AI score", "ARV + repair estimates", "Comparable sales"] },
  { n: 6, t: "Place your bid", d: "Investors place bids with proxy bidding. Sellers receive cash offers from a curated pool of 1,200+ verified, ready-to-close investors.", time: "~1 day", icon: Gavel, trust: ["Proxy bidding", "1,200+ verified investors", "Cash offers"] },
  { n: 7, t: "AI negotiation assistant", d: "Our AI coach analyzes every offer against live market data and scripts the counter — for both sides. You stay in complete control.", time: "1–3 days", icon: MessagesSquare, trust: ["AI counter-scripts", "Market-data backed", "You stay in control"] },
  { n: 8, t: "Smart contract deployed", d: "Once terms are agreed, HPI generates and deploys the escrow contract to the Polygon blockchain automatically. No attorney drafting fees.", time: "15 min", icon: FileSignature, trust: ["Auto-generated", "Polygon secured", "Audited contract"] },
  { n: 9, t: "Earnest money on-chain", d: "Your good-faith deposit is locked in the smart contract in USDC — tamper-proof, traceable, and with zero wire-fraud risk.", time: "5 min", icon: Wallet, trust: ["USDC stablecoin", "Zero wire-fraud", "Immutable record"] },
  { n: 10, t: "Inspection & contingencies", d: "Inspection, financing, and title contingencies are tracked automatically. Fail one and the contract refunds your deposit instantly — guaranteed by code.", time: "7–14 days", icon: ClipboardCheck, trust: ["Auto-tracked", "Auto-refund on fail", "Title insured"] },
  { n: 11, t: "Funds released instantly", d: "On mutual confirmation, earnest money releases to the seller in minutes — no wire window, no bank hold, no fraud risk.", time: "instant", icon: Zap, trust: ["Instant release", "No bank hold", "On-chain proof"] },
  { n: 12, t: "Deed recorded & title transferred", d: "HPI coordinates the title search, title insurance, and deed recording with the county clerk. Legal ownership officially transfers to you.", time: "1–2 days", icon: Landmark, trust: ["Title insured", "County recorded", "Licensed broker"] },
  { n: 13, t: "Keys & settlement delivered", d: "You receive the keys, the final settlement statement, and a permanent on-chain transaction record. The deal is officially closed.", time: "same day", icon: KeyRound, trust: ["Keys in hand", "Settlement statement", "Permanent on-chain record"] },
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

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 3800);
    return () => clearInterval(id);
  }, [playing]);

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
    <div>
      <Seo
        title="The Process — From Sign-Up to Keys in Hand | Hidden Property Intel"
        description="An interactive, step-by-step timeline of the entire Hidden Property Intel journey — from free account creation through AI underwriting, smart-contract escrow, deed recording, and keys in hand."
        keywords="real estate closing process, smart contract escrow process, how to close a real estate deal, step by step real estate timeline"
        path="/process"
      />

      {/* HERO */}
      <section className="z-page-hero">
        <p className="z-page-eyebrow"><Sparkles size={14} style={{ display: "inline", marginRight: 4 }} /> The Process</p>
        <h1 className="z-page-h1">From sign-up to <em>keys in hand</em> — every step, timed.</h1>
        <p className="z-page-lead">Watch the entire Hidden Property Intel journey unfold. The timeline below auto-advances step by step — scroll the steps and the top timeline stays in sync. Each stage carries a real time estimate and the trust safeguards that protect you.</p>
        <div className="z-cta-row" style={{ justifyContent: "flex-start", marginTop: 24 }}>
          <Link to="/register" className="v2-btn v2-btn-primary">Start step 1 <ArrowRight size={16} /></Link>
          <Link to="/smart-contracts" className="v2-btn v2-btn-ghost">Smart-contract escrow</Link>
        </div>
      </section>

      {/* STICKY TIMELINE */}
      <div className="z-timeline-bar">
        <div className="z-timeline-inner">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--z-muted)" }}>The journey</p>
            <button onClick={() => setPlaying((p) => !p)} className="v2-btn v2-btn-ghost v2-btn-sm" style={{ height: 30 }}>
              {playing ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Play</>}
            </button>
          </div>
          <div className="z-timeline-track">
            {STEPS.map((s, i) => {
              const isActive = i === active;
              const isDone = i < active;
              return (
                <button key={s.n} className={`z-tl-dot ${isActive ? "active" : ""} ${isDone ? "done" : ""}`} onClick={() => goTo(i)}>
                  <span className="z-tl-circle">{isDone ? "✓" : s.n}</span>
                  <span className="z-tl-label">{s.t.split(" ").slice(0, 2).join(" ")}</span>
                </button>
              );
            })}
          </div>
          <div className="z-tl-active">
            <span className="z-tl-time"><Clock size={11} style={{ display: "inline", marginRight: 3 }} /> {activeStep.time}</span>
            <div>
              <b>{activeStep.t}</b>
              <p>{activeStep.d}</p>
            </div>
          </div>
        </div>
      </div>

      {/* STEPS GRID */}
      <section className="z-section-pad">
        <div className="z-grid-3">
          {STEPS.map((s, i) => {
            const isActive = i === active;
            return (
              <div
                key={s.n}
                ref={(el) => (stepRefs.current[i] = el)}
                data-idx={i}
                className="z-step-card"
                style={isActive ? { borderColor: "var(--z-blue)", boxShadow: "0 8px 30px rgba(0,106,255,.12)" } : {}}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="z-step-num">{String(s.n).padStart(2, "0")}</span>
                  <s.icon size={22} style={{ color: "var(--z-blue)" }} />
                </div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                  <span className="z-tl-time">{s.time}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--z-muted)", border: "1px solid var(--z-border)", borderRadius: 999, padding: "2px 8px" }}>Step {s.n} of {STEPS.length}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                  {s.trust.map((t) => (
                    <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 999, padding: "3px 8px" }}>
                      <BadgeCheck size={12} /> {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="z-section-alt">
        <div className="z-section-alt-inner">
          <p style={{ textAlign: "center", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--z-muted)" }}>Protected at every stage</p>
          <div className="z-trust-strip">
            {TRUST_STRIP.map((t) => (
              <div key={t.label}><t.icon size={20} /> {t.label}</div>
            ))}
          </div>
        </div>
      </section>

      {/* DEED NOTE */}
      <section className="z-section-pad" style={{ maxWidth: 920 }}>
        <div className="z-note-card" style={{ background: "#fff", borderColor: "var(--z-border)" }}>
          <Landmark size={24} />
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--z-ink)", margin: "0 0 10px" }}>Automated deed recording & title transfer</h2>
            <p>Steps 11–13 are coordinated end-to-end by HPI. Funds release on-chain instantly, then our team orchestrates the title search, title insurance, and deed recording with the county clerk. In counties that support e-recording, the deed is filed the same day. You receive both a permanent on-chain transaction record and the legally recorded deed — proof of funds flow and proof of ownership, together.</p>
            <p style={{ fontSize: 12, marginTop: 10, color: "var(--z-muted-2)" }}>Full e-recording automation (direct county API integration via Simplifile / ePN) is on the roadmap. Today, HPI coordinates recording through licensed title professionals — fully compliant, fully handled for you.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="z-cta-band">
        <h2>Ready to start at step 1?</h2>
        <p>It takes two minutes, it's free, and every step after is mapped out for you.</p>
        <div className="z-cta-row">
          <Link to="/register" className="v2-btn v2-btn-primary">Create free account <ArrowRight size={16} /></Link>
          <Link to="/launch" className="v2-btn v2-btn-ghost" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.3)" }}>Claim free Elite month</Link>
        </div>
      </div>
    </div>
  );
}