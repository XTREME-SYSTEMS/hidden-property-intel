import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Clock, Wallet, FileSignature, Scale, Lock, Gavel,
  CheckCircle2, XCircle, ArrowRight, AlertTriangle, BadgeCheck,
  Handshake, Building2, TrendingDown, Sparkles, Phone,
} from "lucide-react";

const BROKER = {
  name: "Steve Giordano",
  title: "Licensed Real Estate Broker",
  company: "Giordano Customs",
  phone: "772-812-3930",
  address: "951 SW Country Club Dr, Suite 102, Port St. Lucie, FL",
};

const STEPS = [
  {
    n: "01",
    t: "Offer accepted",
    d: "Once you and the seller (or buyer) agree on price and terms, HPI generates the escrow contract automatically — no attorney drafting fees, no waiting.",
  },
  {
    n: "02",
    t: "Earnest money deposited on-chain",
    d: "Your good-faith deposit is held in the smart contract on the Polygon blockchain — not in a title company's bank account. It's locked, traceable, and tamper-proof.",
  },
  {
    n: "03",
    t: "Both parties sign digitally",
    d: "Buyer and seller sign the contract with on-chain signatures. Each signature is timestamped, immutable, and verifiable by anyone — no notary chase, no lost paperwork.",
  },
  {
    n: "04",
    t: "Contingencies tracked automatically",
    d: "Inspection, financing, and clear-title contingencies are built into the contract. Each one is updated as it's met, and the contract knows exactly when all conditions are satisfied.",
  },
  {
    n: "05",
    t: "Funds released instantly on closing",
    d: "When both parties confirm, the earnest money releases to the seller in minutes — not the 24–72 hour wire window of a traditional escrow. No wire-fraud risk. No waiting.",
  },
  {
    n: "06",
    t: "Final settlement & recording",
    d: "HPI coordinates the deed recording and final settlement statement. You get a complete, auditable transaction record stored permanently on-chain.",
  },
];

const OLD_VS_HPI = [
  {
    area: "Time to close",
    old: "30–45 days",
    hpi: "7–14 days",
    icon: Clock,
  },
  {
    area: "Escrow / attorney fees",
    old: "$1,500–$4,000",
    hpi: "Flat, transparent, fraction of the cost",
    icon: Wallet,
  },
  {
    area: "Earnest money handling",
    old: "Wire to a title company — wire-fraud risk, 24–72hr holds",
    hpi: "Held on-chain — instant, traceable, tamper-proof",
    icon: Lock,
  },
  {
    area: "Signatures & paperwork",
    old: "Notary appointments, lost docs, re-signing",
    hpi: "On-chain digital signatures, immutable & verifiable",
    icon: FileSignature,
  },
  {
    area: "Contingency tracking",
    old: "Manual, email chains, missed deadlines",
    hpi: "Built into the contract, auto-tracked",
    icon: BadgeCheck,
  },
  {
    area: "Fund release",
    old: "Wire window, bank delays, fraud risk",
    hpi: "Instant on mutual confirmation — minutes, not days",
    icon: TrendingDown,
  },
  {
    area: "Transparency",
    old: "You trust the escrow officer to do it right",
    hpi: "Every step is verifiable on a public blockchain",
    icon: ShieldCheck,
  },
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
  {
    icon: AlertTriangle,
    t: "Blockchain knowledge helps",
    d: "You'll need a crypto wallet to deposit and receive funds. We walk you through setup in minutes, and our team handles the heavy lifting — but it is a new tool for some users.",
  },
  {
    icon: AlertTriangle,
    t: "Smart contracts are immutable",
    d: "Once deployed, the contract logic can't be changed. This is what makes it trustworthy — but it also means terms must be confirmed before signing. We review every term with you.",
  },
  {
    icon: AlertTriangle,
    t: "Crypto price volatility",
    d: "Funds are held in stablecoin (USDC), pegged 1:1 to the US dollar, so volatility isn't a concern for the escrow itself. But you should be comfortable holding crypto briefly.",
  },
  {
    icon: AlertTriangle,
    t: "Title & deed still follow state law",
    d: "The smart contract handles the money. The deed recording and title transfer still follow your state's legal process — we coordinate both so nothing falls through the cracks.",
  },
];

const QUALIFY = [
  { icon: Building2, t: "You're buying or selling a real property", d: "Residential, commercial, land, or multi-family — the HPI escrow works for any property type in our active markets." },
  { icon: Handshake, t: "Both parties agree to the terms", d: "Price, earnest money, closing date, and contingencies are settled before the contract is generated." },
  { icon: Wallet, t: "You can fund with stablecoin", d: "Earnest money is deposited in USDC. We help you set up a wallet and convert if needed." },
  { icon: BadgeCheck, t: "You want a faster, cheaper close", d: "If you value time and transparency over the old way, HPI is for you." },
];

export default function SmartContractMarketing() {
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative bg-black px-6 py-24 text-white lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 70% 20%, rgba(229,182,83,0.25), transparent 45%)" }} />
        <div className="relative mx-auto max-w-[1400px]">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-gold-warm">
            <Sparkles className="h-4 w-4" /> HPI Smart-Contract Escrow
          </div>
          <h1 className="mt-6 max-w-4xl font-display text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Close your deal in <em className="not-italic text-gold-warm">days</em>, not months — with money that's <em className="not-italic text-gold-warm">locked, traceable, and yours.</em>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/70">
            The old way of closing a real estate deal is slow, expensive, and built on trust in people you've never met.
            HPI replaces it with a smart-contract escrow on the blockchain — holding your money safely, automating every step,
            and releasing funds the moment both parties agree. No wire fraud. No 30-day waits. No black box.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/listings" className="inline-flex items-center gap-2 rounded-sm bg-gold-warm px-6 py-3.5 text-[11px] uppercase tracking-[0.3em] text-black hover:opacity-90">
              Browse live deals <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={`tel:${BROKER.phone.replace(/[^0-9]/g, "")}`} className="inline-flex items-center gap-2 rounded-sm border border-white/25 px-6 py-3.5 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-white/10">
              <Phone className="h-4 w-4" /> Talk to {BROKER.name.split(" ")[0]}
            </a>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-white/15 bg-white/10 sm:grid-cols-4">
            {[
              { v: "7–14", l: "Days to close" },
              { v: "$3K+", l: "Saved in escrow fees" },
              { v: "0", l: "Wire-fraud risk" },
              { v: "100%", l: "On-chain transparency" },
            ].map((s) => (
              <div key={s.l} className="bg-black p-6 text-center">
                <p className="font-display text-3xl font-light text-gold-warm">{s.v}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-white/50">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE OUTCOME — BENEFITS */}
      <section className="px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">The outcome</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-light tracking-tight sm:text-5xl">
            What you actually get when you close with HPI.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-black/60">
            We're not selling blockchain. We're selling the result: a faster, cheaper, safer close where you stay in control
            of your money the entire time.
          </p>
          <div className="mt-12 grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.t} className="bg-white p-7">
                <b.icon className="h-7 w-7 text-gold" />
                <p className="mt-5 font-display text-lg tracking-tight">{b.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-black/55">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — LEGALLY */}
      <section className="bg-[#0c0c0b] px-6 py-20 text-white lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-[11px] uppercase tracking-[0.4em] text-gold-warm">How it works — and how it's legal</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-light tracking-tight sm:text-5xl">
            A licensed real estate transaction, supercharged by a smart contract.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/65">
            HPI's smart-contract escrow doesn't replace the law — it sits on top of it. The property transfer still follows
            your state's real estate statutes, handled by a licensed broker. The smart contract handles the money:
            holding it, tracking signatures and contingencies, and releasing it the instant conditions are met.
            Think of it as a digital escrow officer that never sleeps, never makes mistakes, and never loses your file.
          </p>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-sm border border-white/10 bg-white/[0.03] p-7">
                <div className="flex items-center gap-3">
                  <span className="font-display text-2xl font-light text-gold-warm">{s.n}</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <p className="mt-5 font-display text-lg tracking-tight">{s.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{s.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-start gap-3 rounded-sm border border-gold-warm/30 bg-gold-warm/[0.06] p-6">
            <Scale className="mt-0.5 h-6 w-6 shrink-0 text-gold-warm" />
            <p className="text-sm leading-relaxed text-white/75">
              <span className="font-medium text-white">The legal foundation:</span> Every HPI transaction is conducted under
              the license of {BROKER.name}, {BROKER.title} ({BROKER.company}), in compliance with Florida real estate law.
              The smart contract is the escrow instrument; the recorded deed is the legal transfer of ownership. Both work
              together — the blockchain proves what happened, the county record proves who owns the property.
            </p>
          </div>
        </div>
      </section>

      {/* OLD vs HPI COMPARISON */}
      <section className="px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">The comparison</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-light tracking-tight sm:text-5xl">
            The old way vs. the HPI way.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-black/60">
            Same property. Same buyer and seller. Two completely different experiences.
          </p>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-black/15 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                  <th className="pb-4 pr-4">What you care about</th>
                  <th className="pb-4 pr-4">
                    <span className="flex items-center gap-2 text-black/50"><Gavel className="h-4 w-4" /> Traditional escrow</span>
                  </th>
                  <th className="pb-4">
                    <span className="flex items-center gap-2 text-gold"><ShieldCheck className="h-4 w-4" /> HPI smart contract</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {OLD_VS_HPI.map((row) => (
                  <tr key={row.area} className="align-top">
                    <td className="py-5 pr-4">
                      <div className="flex items-center gap-2">
                        <row.icon className="h-4 w-4 text-black/40" />
                        <span className="font-medium">{row.area}</span>
                      </div>
                    </td>
                    <td className="py-5 pr-4">
                      <div className="flex items-start gap-2 text-black/55">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500/70" />
                        <span>{row.old}</span>
                      </div>
                    </td>
                    <td className="py-5">
                      <div className="flex items-start gap-2 text-black/80">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{row.hpi}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* time + money saved band */}
          <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 md:grid-cols-2">
            <div className="bg-black p-8 text-white lg:p-10">
              <p className="text-[11px] uppercase tracking-[0.4em] text-gold-warm">Time saved</p>
              <p className="mt-4 font-display text-5xl font-light">~25 days</p>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                The average traditional close takes 30–45 days. The average HPI close takes 7–14. That's nearly a month of
                your life back — and for investors, a month of capital freed up to do the next deal.
              </p>
            </div>
            <div className="bg-white p-8 lg:p-10">
              <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Money saved</p>
              <p className="mt-4 font-display text-5xl font-light text-gold">$1,500–$4,000</p>
              <p className="mt-3 text-sm leading-relaxed text-black/60">
                Typical escrow and attorney drafting fees on a $200K deal run $1,500–$4,000. HPI replaces that with a flat,
                transparent cost — a fraction of the old number, with no surprise line items.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW TO QUALIFY */}
      <section className="bg-[#f7f5f0] px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">How to qualify</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-light tracking-tight sm:text-5xl">
            Is the HPI smart-contract close right for your deal?
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-black/60">
            You qualify if all four of these are true. If they are, you're ready to close the modern way.
          </p>
          <div className="mt-12 grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
            {QUALIFY.map((q) => (
              <div key={q.t} className="bg-white p-7">
                <q.icon className="h-7 w-7 text-gold" />
                <p className="mt-5 font-display text-base tracking-tight">{q.t}</p>
                <p className="mt-2 text-xs leading-relaxed text-black/55">{q.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAFETY & GUARANTEE */}
      <section className="px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Safe & guaranteed</p>
              <h2 className="mt-3 font-display text-3xl font-light tracking-tight sm:text-4xl">
                Your money is protected at every step.
              </h2>
              <div className="mt-8 space-y-5">
                {[
                  { icon: Lock, t: "Funds locked on the Polygon blockchain", d: "Your earnest money is held in the smart contract itself — not in any person's or company's bank account. It can only move according to the contract's rules." },
                  { icon: ShieldCheck, t: "Licensed broker oversight", d: `Every transaction runs under the license of ${BROKER.name}, ${BROKER.title}. There's a real, accountable human behind every deal.` },
                  { icon: BadgeCheck, t: "Contingencies protect you", d: "Inspection, financing, and title contingencies are built in. If a contingency fails, the contract refunds your deposit automatically." },
                  { icon: Scale, t: "Immutable, auditable record", d: "Every deposit, signature, and release is permanently recorded on-chain. You can verify the entire transaction history yourself, anytime." },
                ].map((s) => (
                  <div key={s.t} className="flex gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-sm bg-black text-gold-warm">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display text-base tracking-tight">{s.t}</p>
                      <p className="mt-1 text-sm leading-relaxed text-black/55">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-sm border border-black/10 bg-black p-8 text-white lg:p-10">
              <ShieldCheck className="h-10 w-10 text-gold-warm" />
              <p className="mt-6 font-display text-2xl font-light leading-snug">
                The HPI close guarantee
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                If a contingency you relied on fails — inspection, financing, or clear title — the smart contract
                automatically returns your full earnest-money deposit. No escrow officer deciding whether you "deserve"
                your money back. The rules are written in code, and the code doesn't play favorites.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                If both parties fulfill every term, funds release to the seller within minutes of final confirmation —
                guaranteed by the contract, not by a bank's wire schedule.
              </p>
              <div className="mt-7 rounded-sm border border-white/15 p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Licensed by</p>
                <p className="mt-2 font-display text-base">{BROKER.name}</p>
                <p className="text-sm text-white/60">{BROKER.title} · {BROKER.company}</p>
                <p className="mt-1 text-xs text-white/40">{BROKER.address}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINALIZATION */}
      <section className="bg-[#0c0c0b] px-6 py-20 text-white lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-[11px] uppercase tracking-[0.4em] text-gold-warm">Finalization</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-light tracking-tight sm:text-5xl">
            What happens at the finish line.
          </h2>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[
              { icon: CheckCircle2, t: "Both parties confirm", d: "Buyer and seller each confirm the final terms on-chain. The contract verifies all contingencies are cleared and both signatures are recorded." },
              { icon: Wallet, t: "Funds release instantly", d: "The earnest money releases to the seller in minutes. No wire window, no bank hold, no fraud risk — the contract executes the transfer itself." },
              { icon: FileSignature, t: "Deed recorded & delivered", d: "HPI coordinates the deed recording with the county and delivers the final settlement statement. You receive a permanent on-chain transaction record and the legal deed." },
            ].map((f) => (
              <div key={f.t} className="rounded-sm border border-white/10 bg-white/[0.03] p-7">
                <f.icon className="h-7 w-7 text-gold-warm" />
                <p className="mt-5 font-display text-lg tracking-tight">{f.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RISKS — FULL TRANSPARENCY */}
      <section className="px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Full transparency</p>
          </div>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-light tracking-tight sm:text-5xl">
            The honest part — what could be a downside.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-black/60">
            We believe you should know the full picture before you choose HPI. Here's what's real, what's different, and
            what to expect — the good and the friction.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {RISKS.map((r) => (
              <div key={r.t} className="flex gap-4 rounded-sm border border-amber-200/60 bg-amber-50/40 p-6">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-display text-base tracking-tight text-black/80">{r.t}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-black/60">{r.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-sm border border-black/10 bg-white p-7">
            <p className="text-sm leading-relaxed text-black/65">
              <span className="font-medium text-black">The bottom line:</span> HPI isn't magic — it's a better tool. It
              trades a little new-tech setup for a lot of time, money, and risk removed. If you're comfortable with a
              crypto wallet (or willing to let us help you set one up), the upside is significant. If you'd rather do
              everything the way it's always been done, the old escrow process is still available — we just think you
              deserve the choice.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 lg:px-12">
        <div className="mx-auto max-w-[1400px] rounded-sm bg-black p-10 text-center text-white lg:p-16">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-light leading-tight tracking-tight sm:text-4xl">
            Ready to close your next deal the modern way?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/65">
            Browse live off-market deals, or call {BROKER.name} directly to walk through how an HPI smart-contract close
            would work for your specific property.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/listings" className="inline-flex items-center gap-2 rounded-sm bg-gold-warm px-6 py-3.5 text-[11px] uppercase tracking-[0.3em] text-black hover:opacity-90">
              Browse live deals <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={`tel:${BROKER.phone.replace(/[^0-9]/g, "")}`} className="inline-flex items-center gap-2 rounded-sm border border-white/25 px-6 py-3.5 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-white/10">
              <Phone className="h-4 w-4" /> {BROKER.phone}
            </a>
          </div>
          <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-white/40">
            {BROKER.name} · {BROKER.title} · {BROKER.company}
          </p>
        </div>
      </section>
    </div>
  );
}