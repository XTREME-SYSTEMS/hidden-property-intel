import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Check } from "lucide-react";

const PERKS = ["No commissions", "No listing fees", "No closing costs to us", "Cash offers in 48 hours"];

export default function SellerFreeCTA() {
  return (
    <section className="bg-black">
      <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-12 lg:py-28">
        <div className="relative overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-br from-charcoal via-black to-charcoal p-8 sm:p-12 lg:p-16">
          {/* gold glow */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-gold/15 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-gold/10 blur-[110px]" />

          <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/[0.06] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-warm">
                <BadgeCheck className="h-3.5 w-3.5" /> 100% free for sellers
              </span>
              <h2 className="mt-6 max-w-xl font-display text-4xl font-light leading-[1.05] tracking-tight text-white sm:text-5xl">
                Have a distressed property?<br />
                <span className="text-gold-warm">List it free — get cash offers.</span>
              </h2>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/65">
                Inherited a home, facing foreclosure, or just tired of a property that's become a burden?
                Sign up free and get cash offers from verified investors in as little as 48 hours —
                with an AI negotiation coach in your corner.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/seller/post-property"
                  className="group inline-flex items-center gap-2.5 rounded-md bg-gold-warm px-7 py-4 font-brand text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition-all duration-200 hover:bg-white"
                >
                  List your property — free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2.5 rounded-md border border-white/25 px-7 py-4 font-brand text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-all duration-200 hover:border-white/60 hover:bg-white/10"
                >
                  Create free account
                </Link>
              </div>
            </div>

            <ul className="grid gap-3">
              {PERKS.map((p) => (
                <li
                  key={p}
                  className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur-sm"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15">
                    <Check className="h-3.5 w-3.5 text-gold-warm" strokeWidth={3} />
                  </span>
                  <span className="font-display text-base tracking-tight text-white">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}