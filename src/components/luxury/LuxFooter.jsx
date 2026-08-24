import React from "react";
import { Link } from "react-router-dom";

export default function LuxFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-sm bg-white text-xs font-semibold tracking-widest text-black">M</span>
              <span className="text-sm font-medium uppercase tracking-[0.3em]">Maison</span>
            </div>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/50">
              A private collection of the world's most extraordinary residences, curated for the discerning few.
            </p>
          </div>
          {[
            { h: "Explore", items: ["Residences", "Portfolio", "Collections", "Journal"] },
            { h: "Company", items: ["About", "Advisory", "Press", "Careers"] },
            { h: "Connect", items: ["Enquire", "Concierge", "Newsletter", "Contact"] },
          ].map((c) => (
            <div key={c.h}>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">{c.h}</p>
              <ul className="mt-6 space-y-3">
                {c.items.map((i) => (
                  <li key={i}><Link to="/listings" className="text-sm text-white/70 transition-colors hover:text-white">{i}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-[11px] uppercase tracking-[0.2em] text-white/40 sm:flex-row">
          <span>© {new Date().getFullYear()} Maison. All rights reserved.</span>
          <span>Black · White · Silver</span>
        </div>
      </div>
    </footer>
  );
}