import React from "react";
import { Link } from "react-router-dom";
import { FileSignature, ShieldCheck, Lock, ArrowRight, Check } from "lucide-react";

const STAGES = [
  { label: "Draft", done: true },
  { label: "Signed", done: true },
  { label: "Funded", done: true },
  { label: "Closed", done: false },
];

export default function SmartContractShowcase() {
  return (
    <section className="relative overflow-hidden bg-charcoal text-white">
      {/* ambient gold glow */}
      <div className="pointer-events-none absolute -right-32 top-1/2 h-[480px] w-[480px] -translate-y-1/2 rounded-full bg-gold/10 blur-[120px]" />
      <div className="relative mx-auto grid max-w-[1400px] gap-14 px-6 py-24 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-12 lg:py-32">
        {/* Copy */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-gold-warm">On-chain escrow</p>
          <h2 className="mt-4 font-display text-4xl font-light leading-[1.05] tracking-tight sm:text-5xl">
            Close in days,<br />
            <span className="text-gold-warm">not months.</span>
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/65">
            Solidity smart contracts on Polygon manage earnest money, digital signatures, and deed transfer —
            replacing title-company delays with a cryptographically verifiable closing you can trust.
          </p>

          <ul className="mt-9 space-y-4">
            {[
              { icon: Lock, t: "Escrow-secured funds", d: "Earnest money locked on-chain until every contingency clears." },
              { icon: ShieldCheck, t: "Verifiable signatures", d: "Each party signs with a SHA-256 hash — tamper-proof and auditable." },
              { icon: FileSignature, t: "Automated deed transfer", d: "The contract releases funds and triggers transfer the moment conditions are met." },
            ].map((f) => (
              <li key={f.t} className="flex gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/[0.03]">
                  <f.icon className="h-4 w-4 text-gold-warm" />
                </span>
                <div>
                  <p className="font-display text-base tracking-tight">{f.t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/55">{f.d}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            to="/investor/signup"
            className="group mt-10 inline-flex items-center gap-2.5 rounded-md border border-white/25 px-6 py-3.5 font-brand text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-all duration-200 hover:border-gold-warm hover:bg-gold-warm hover:text-black"
          >
            Explore smart-contract closing
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Mock contract card */}
        <div className="relative">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15">
                  <FileSignature className="h-5 w-5 text-gold-warm" />
                </span>
                <div>
                  <p className="font-display text-sm tracking-tight">Escrow Agreement</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Polygon · Contract #4f8a2c</p>
                </div>
              </div>
              <span className="rounded-md bg-gold/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-warm">
                Funded
              </span>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              {[
                ["Purchase price", "$284,000"],
                ["Earnest money", "$14,200"],
                ["Closing date", "Sep 12, 2026"],
                ["Contingencies", "Inspection · Title"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <dt className="text-white/45">{k}</dt>
                  <dd className="font-display tabular-nums tracking-tight">{v}</dd>
                </div>
              ))}
            </dl>

            {/* Progress */}
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">Contract lifecycle</p>
              <div className="mt-4 flex items-center justify-between">
                {STAGES.map((s, i) => (
                  <React.Fragment key={s.label}>
                    <div className="flex flex-col items-center gap-2">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-[11px] ${
                          s.done
                            ? "border-gold-warm bg-gold-warm text-black"
                            : "border-white/20 bg-white/[0.03] text-white/40"
                        }`}
                      >
                        {s.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                      </span>
                      <span className={`text-[9px] uppercase tracking-[0.15em] ${s.done ? "text-white/80" : "text-white/35"}`}>
                        {s.label}
                      </span>
                    </div>
                    {i < STAGES.length - 1 && (
                      <span className={`mx-1 h-px flex-1 ${s.done ? "bg-gold-warm/50" : "bg-white/10"}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-6 space-y-2.5 border-t border-white/10 pt-5">
              {[
                ["M. Reyes", "Seller", "0x7a…3f1c"],
                ["J. Thompson", "Investor", "0x9b…8e2d"],
              ].map(([name, role, hash]) => (
                <div key={name} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Check className="h-3.5 w-3.5 text-gold-warm" strokeWidth={3} />
                    <span className="text-sm">{name}</span>
                    <span className="text-[10px] uppercase tracking-[0.15em] text-white/35">{role}</span>
                  </div>
                  <span className="font-mono text-[10px] text-white/40">{hash}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}