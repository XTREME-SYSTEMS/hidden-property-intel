import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Clock, Wallet, FileSignature, Scale, Lock, Gavel,
  CheckCircle2, XCircle, ArrowRight, AlertTriangle, BadgeCheck,
  Handshake, Building2, TrendingDown, Sparkles, Phone, PlayCircle,
} from "lucide-react";
import SmartContractSimulator from "@/components/SmartContractSimulator";
import SmartContractFAQ from "@/components/SmartContractFAQ";

const BROKER = {
  name: "Steve Giordano",
  title: "Licensed Real Estate Broker",
  company: "Giordano Customs",
  phone: "833-484-3799",
  address: "951 SW Country Club Dr, Suite 102, Port St. Lucie, FL",
};

const STEPS = [
  { n: "01", t: "Offer accepted", d: "Once you and the seller agree on price and terms, HPI generates the escrow contract automatically — no attorney drafting fees, no waiting." },
  { n: "02", t: "Earnest money deposited on-chain", d: "Your good-faith deposit is held in the smart contract on the Polygon blockchain — locked, traceable, and tamper-proof." },
  { n: "03", t: "Both parties sign digitally", d: "Buyer and seller sign with on-chain signatures. Each is timestamped, immutable, and verifiable by anyone — no notary chase." },
  { n: "04", t: "Contingencies tracked automatically", d: "Inspection, financing, and clear-title contingencies are built in. The contract knows exactly when all conditions are satisfied." },
  { n: "05", t: "Funds released instantly on closing", d: "When both parties confirm, earnest money releases to the seller in minutes — not the 24–72 hour wire window. No wire-fraud risk." },
  { n: "06", t: "Final settlement & recording", d: "HPI coordinates deed recording and final settlement. You get a complete, auditable transaction record stored permanently on-chain." },
];

const OLD_VS_HPI = [
  { area: "Time to close", old: "30–45 days", hpi: "7–14 days", icon: Clock },
  { area: "Escrow / attorney fees", old: "$1,500–$4,000", hpi: "Flat, transparent, fraction of the cost", icon: Wallet },
  { area: "Earnest money handling", old: "Wire to a title company — wire-fraud risk, 24–72hr holds", hpi: "Held on-chain — instant, traceable, tamper-proof", icon: Lock },
  { area: "Signatures & paperwork", old: "Notary appointments, lost docs, re-signing", hpi: "On-chain digital signatures, immutable & verifiable", icon: FileSignature },
  { area: "Contingency tracking", old: "Manual, email chains, missed deadlines", hpi: "Built into the contract, auto-tracked", icon: BadgeCheck },
  { area: "Fund release", old: "Wire window, bank delays, fraud risk", hpi: "Instant on mutual confirmation — minutes, not days", icon: TrendingDown },
  { area: "Transparency", old: "You trust the escrow officer to do it right", hpi: "Every step is verifiable on a public blockchain", icon: ShieldCheck },
];

const BENEFITS = [
  { icon: Clock, t: "Close in days, not months", d: "Most HPI closings complete in 7–14 days. The traditional process eats 30–45 days of your life." },
  { icon: Wallet, t: "Keep thousands in your pocket", d: "No attorney drafting fees, no bloated escrow charges. A flat, transparent cost that's a fraction of traditional closing costs." },
  { icon: Lock, t: "Wire-fraud-proof", d: "Your earnest money never sits in a bank account waiting to be stolen. It's locked on the Polygon blockchain until the contract releases it." },
  { icon: Scale, t: "Legally binding & enforceable", d: "Smart-contract escrow sits alongside a real, licensed real estate transaction. The on-chain record is evidence; the deed is the law." },
  { icon: ShieldCheck, t: "Fully transparent", d: "Every deposit, signature, contingency, and release is recorded on a public ledger you can verify yourself — no black-box escrow." },
  { icon: FileSignature, t: "No paperwork chaos", d: "No notary chases, no lost PDFs, no re-signing because someone's printer broke. Everything is digital, permanent, and organized." },
];

const RISKS = [
  { t: "Blockchain knowledge helps", d: "You'll need a crypto wallet to deposit and receive funds. We walk you through setup in minutes, and our team handles the heavy lifting." },
  { t: "Smart contracts are immutable", d: "Once deployed, the contract logic can't be changed. This is what makes it trustworthy — but terms must be confirmed before signing. We review every term with you." },
  { t: "Crypto price volatility", d: "Funds are held in stablecoin (USDC), pegged 1:1 to the US dollar, so volatility isn't a concern for the escrow itself. But you should be comfortable holding crypto briefly." },
  { t: "Title & deed still follow state law", d: "The smart contract handles the money. The deed recording and title transfer still follow your state's legal process — we coordinate both so nothing falls through the cracks." },
];

const QUALIFY = [
  { icon: Building2, t: "You're buying or selling a real property", d: "Residential, commercial, land, or multi-family — the HPI escrow works for any property type in our active markets." },
  { icon: Handshake, t: "Both parties agree to the terms", d: "Price, earnest money, closing date, and contingencies are settled before the contract is generated." },
  { icon: Wallet, t: "You can fund with stablecoin", d: "Earnest money is deposited in USDC. We help you set up a wallet and convert if needed." },
  { icon: BadgeCheck, t: "You want a faster, cheaper close", d: "If you value time and transparency over the old way, HPI is for you." },
];

export default function SmartContractMarketing() {
  return (
    <div>
      {/* HERO */}
      <section className="z-page-hero">
        <p className="z-page-eyebrow"><Sparkles size={14} style={{ display: "inline", marginRight: 4 }} /> HPI Smart-Contract Escrow</p>
        <h1 className="z-page-h1">Close your deal in <em>days</em>, not months — with money that's <em>locked, traceable, and yours.</em></h1>
        <p className="z-page-lead">The old way of closing a real estate deal is slow, expensive, and built on trust in people you've never met. HPI replaces it with a smart-contract escrow on the blockchain — holding your money safely, automating every step, and releasing funds the moment both parties agree. No wire fraud. No 30-day waits. No black box.</p>
        <div className="z-cta-row" style={{ justifyContent: "flex-start", marginTop: 24 }}>
          <Link to="/v2/listings" className="v2-btn v2-btn-primary">Browse live deals <ArrowRight size={16} /></Link>
          <a href={`tel:${BROKER.phone.replace(/[^0-9]/g, "")}`} className="v2-btn v2-btn-ghost"><Phone size={16} /> Talk to {BROKER.name.split(" ")[0]}</a>
        </div>
        <div className="z-stat-row">
          {[{ v: "7–14", l: "Days to close" }, { v: "$3K+", l: "Saved in escrow fees" }, { v: "0", l: "Wire-fraud risk" }, { v: "100%", l: "On-chain transparency" }].map((s) => (
            <div key={s.l} className="z-stat"><b>{s.v}</b><span>{s.l}</span></div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="z-section-alt">
        <div className="z-section-alt-inner">
          <p className="z-page-eyebrow">The outcome</p>
          <h2 className="z-page-h2">What you actually get when you close with HPI.</h2>
          <p className="z-page-sub">We're not selling blockchain. We're selling the result: a faster, cheaper, safer close where you stay in control of your money the entire time.</p>
          <div className="z-grid-3">
            {BENEFITS.map((b) => (
              <div key={b.t} className="z-feature-card">
                <b.icon size={26} />
                <h3>{b.t}</h3>
                <p>{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="z-section-pad">
        <p className="z-page-eyebrow">How it works — and how it's legal</p>
        <h2 className="z-page-h2">A licensed real estate transaction, supercharged by a smart contract.</h2>
        <p className="z-page-sub">HPI's smart-contract escrow doesn't replace the law — it sits on top of it. The property transfer still follows your state's real estate statutes, handled by a licensed broker. The smart contract handles the money: holding it, tracking signatures and contingencies, and releasing it the instant conditions are met.</p>
        <div className="z-grid-3">
          {STEPS.map((s) => (
            <div key={s.n} className="z-step-card">
              <div className="z-step-num">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
        <div className="z-note-card">
          <Scale size={22} />
          <p><b>The legal foundation:</b> Every HPI transaction is conducted under the license of {BROKER.name}, {BROKER.title} ({BROKER.company}), in compliance with Florida real estate law. The smart contract is the escrow instrument; the recorded deed is the legal transfer of ownership. Both work together — the blockchain proves what happened, the county record proves who owns the property.</p>
        </div>
      </section>

      {/* SIMULATOR */}
      <section className="z-section-alt">
        <div className="z-section-alt-inner">
          <p className="z-page-eyebrow"><PlayCircle size={14} style={{ display: "inline", marginRight: 4 }} /> Try it live</p>
          <h2 className="z-page-h2">See a smart-contract close run in real time.</h2>
          <p className="z-page-sub">Enter your deal numbers below and watch the contract deploy, fund, collect signatures, clear contingencies, and release funds — exactly as it would on the Polygon blockchain. No wallet needed. This is a live simulation.</p>
          <SmartContractSimulator />
        </div>
      </section>

      {/* COMPARISON */}
      <section className="z-section-pad">
        <p className="z-page-eyebrow">The comparison</p>
        <h2 className="z-page-h2">The old way vs. the HPI way.</h2>
        <p className="z-page-sub">Same property. Same buyer and seller. Two completely different experiences.</p>
        <div style={{ overflowX: "auto" }}>
          <table className="z-compare-table">
            <thead>
              <tr>
                <th>What you care about</th>
                <th><Gavel size={14} style={{ display: "inline", marginRight: 4 }} /> Traditional escrow</th>
                <th className="us"><ShieldCheck size={14} style={{ display: "inline", marginRight: 4 }} /> HPI smart contract</th>
              </tr>
            </thead>
            <tbody>
              {OLD_VS_HPI.map((row) => (
                <tr key={row.area}>
                  <td><row.icon size={15} style={{ display: "inline", marginRight: 6, color: "var(--z-muted)" }} />{row.area}</td>
                  <td><XCircle size={15} style={{ display: "inline", marginRight: 6, color: "#dc2626", verticalAlign: "middle" }} />{row.old}</td>
                  <td className="us"><CheckCircle2 size={15} style={{ display: "inline", marginRight: 6, color: "var(--z-blue)", verticalAlign: "middle" }} />{row.hpi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="z-save-band">
          <div className="z-save-card dark">
            <p className="z-save-eyebrow">Time saved</p>
            <b>~25 days</b>
            <p>The average traditional close takes 30–45 days. The average HPI close takes 7–14. That's nearly a month of your life back — and for investors, a month of capital freed up to do the next deal.</p>
          </div>
          <div className="z-save-card light">
            <p className="z-save-eyebrow">Money saved</p>
            <b style={{ color: "var(--z-blue)" }}>$1,500–$4,000</b>
            <p>Typical escrow and attorney drafting fees on a $200K deal run $1,500–$4,000. HPI replaces that with a flat, transparent cost — a fraction of the old number, with no surprise line items.</p>
          </div>
        </div>
      </section>

      {/* QUALIFY */}
      <section className="z-section-alt">
        <div className="z-section-alt-inner">
          <p className="z-page-eyebrow">How to qualify</p>
          <h2 className="z-page-h2">Is the HPI smart-contract close right for your deal?</h2>
          <p className="z-page-sub">You qualify if all four of these are true. If they are, you're ready to close the modern way.</p>
          <div className="z-grid-4">
            {QUALIFY.map((q) => (
              <div key={q.t} className="z-feature-card">
                <q.icon size={26} />
                <h3>{q.t}</h3>
                <p>{q.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAFETY */}
      <section className="z-section-pad">
        <div className="z-grid-2">
          <div>
            <p className="z-page-eyebrow">Safe & guaranteed</p>
            <h2 className="z-page-h2">Your money is protected at every step.</h2>
            <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
              {[
                { icon: Lock, t: "Funds locked on the Polygon blockchain", d: "Your earnest money is held in the smart contract itself — not in any person's or company's bank account. It can only move according to the contract's rules." },
                { icon: ShieldCheck, t: "Licensed broker oversight", d: `Every transaction runs under the license of ${BROKER.name}, ${BROKER.title}. There's a real, accountable human behind every deal.` },
                { icon: BadgeCheck, t: "Contingencies protect you", d: "Inspection, financing, and title contingencies are built in. If a contingency fails, the contract refunds your deposit automatically." },
                { icon: Scale, t: "Immutable, auditable record", d: "Every deposit, signature, and release is permanently recorded on-chain. You can verify the entire transaction history yourself, anytime." },
              ].map((s) => (
                <div key={s.t} style={{ display: "flex", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--z-ink)", color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}><s.icon size={20} /></div>
                  <div><b style={{ display: "block", color: "var(--z-ink)", fontSize: 15 }}>{s.t}</b><p style={{ fontSize: 14, color: "var(--z-muted)", lineHeight: 1.6, margin: "4px 0 0" }}>{s.d}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="z-save-card dark" style={{ display: "flex", flexDirection: "column" }}>
            <ShieldCheck size={36} />
            <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "16px 0 12px" }}>The HPI close guarantee</h2>
            <p>If a contingency you relied on fails — inspection, financing, or clear title — the smart contract automatically returns your full earnest-money deposit. No escrow officer deciding whether you "deserve" your money back. The rules are written in code, and the code doesn't play favorites.</p>
            <p>If both parties fulfill every term, funds release to the seller within minutes of final confirmation — guaranteed by the contract, not by a bank's wire schedule.</p>
            <div style={{ marginTop: 18, border: "1px solid rgba(255,255,255,.15)", borderRadius: 10, padding: 16 }}>
              <p className="z-save-eyebrow" style={{ color: "#8ab4ff" }}>Licensed by</p>
              <b style={{ display: "block", marginTop: 6, fontSize: 16 }}>{BROKER.name}</b>
              <p style={{ fontSize: 14 }}>{BROKER.title} · {BROKER.company}</p>
              <p style={{ fontSize: 12, marginTop: 4, opacity: .6 }}>{BROKER.address}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINALIZATION */}
      <section className="z-section-alt">
        <div className="z-section-alt-inner">
          <p className="z-page-eyebrow">Finalization</p>
          <h2 className="z-page-h2">What happens at the finish line.</h2>
          <div className="z-grid-3">
            {[
              { icon: CheckCircle2, t: "Both parties confirm", d: "Buyer and seller each confirm the final terms on-chain. The contract verifies all contingencies are cleared and both signatures are recorded." },
              { icon: Wallet, t: "Funds release instantly", d: "The earnest money releases to the seller in minutes. No wire window, no bank hold, no fraud risk — the contract executes the transfer itself." },
              { icon: FileSignature, t: "Deed recorded & delivered", d: "HPI coordinates the deed recording with the county and delivers the final settlement statement. You receive a permanent on-chain transaction record and the legal deed." },
            ].map((f) => (
              <div key={f.t} className="z-step-card">
                <f.icon size={26} style={{ color: "var(--z-blue)" }} />
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RISKS */}
      <section className="z-section-pad">
        <p className="z-page-eyebrow"><AlertTriangle size={14} style={{ display: "inline", marginRight: 4 }} /> Full transparency</p>
        <h2 className="z-page-h2">The honest part — what could be a downside.</h2>
        <p className="z-page-sub">We believe you should know the full picture before you choose HPI. Here's what's real, what's different, and what to expect.</p>
        <div className="z-grid-2">
          {RISKS.map((r) => (
            <div key={r.t} className="z-feature-card" style={{ borderColor: "#fcd9a8", background: "#fffaf0" }}>
              <AlertTriangle size={20} style={{ color: "#b45309" }} />
              <h3>{r.t}</h3>
              <p>{r.d}</p>
            </div>
          ))}
        </div>
        <div className="z-note-card" style={{ background: "#fff", borderColor: "var(--z-border)" }}>
          <p><b>The bottom line:</b> HPI isn't magic — it's a better tool. It trades a little new-tech setup for a lot of time, money, and risk removed. If you're comfortable with a crypto wallet (or willing to let us help you set one up), the upside is significant. If you'd rather do everything the way it's always been done, the old escrow process is still available — we just think you deserve the choice.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="z-section-alt">
        <div className="z-section-alt-inner" style={{ maxWidth: 920 }}>
          <p className="z-page-eyebrow">Everything you want to know</p>
          <h2 className="z-page-h2">Smart contract escrow — every question answered.</h2>
          <p className="z-page-sub">The fastest close, the accounts you need, the cost, the legal foundation, the security model — all in one place. If your question isn't here, call {BROKER.name} directly at {BROKER.phone}.</p>
          <SmartContractFAQ />
        </div>
      </section>

      {/* CTA */}
      <div className="z-cta-band">
        <h2>Ready to close your next deal the modern way?</h2>
        <p>Browse live off-market deals, or call {BROKER.name} directly to walk through how an HPI smart-contract close would work for your specific property.</p>
        <div className="z-cta-row">
          <Link to="/v2/listings" className="v2-btn v2-btn-primary">Browse live deals <ArrowRight size={16} /></Link>
          <a href={`tel:${BROKER.phone.replace(/[^0-9]/g, "")}`} className="v2-btn v2-btn-ghost" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.3)" }}><Phone size={16} /> {BROKER.phone}</a>
        </div>
        <p style={{ fontSize: 12, marginTop: 18, opacity: .5 }}>{BROKER.name} · {BROKER.title} · {BROKER.company}</p>
      </div>
    </div>
  );
}