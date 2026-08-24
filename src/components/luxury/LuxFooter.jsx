import React from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/luxury/Logo";

export default function LuxFooter() {
  const cols = [
    { h: "Explore", items: [["Inventory", "/listings"], ["How it works", "/"], ["ROI calculators", "/calculators"], ["Market data", "/listings"]] },
    { h: "For Investors", items: [["Browse inventory", "/listings"], ["Pricing", "/#investors"], ["Smart contracts", "/listings"], ["Ownership chains", "/listings"]] },
    { h: "For Sellers", items: [["List your property", "/seller/post-property"], ["AI pricing", "/#sellers"], ["Negotiation assistant", "/#sellers"], ["No commissions", "/#sellers"]] },
    { h: "Company", items: [["About", "/"], ["Concierge", "/"], ["Press", "/"], ["Contact", "/"]] },
  ];
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <div>
            <Logo variant="light" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/50">
              The marketplace where distressed sellers meet serious investors — backed by AI pricing, ownership-chain
              intelligence, and on-chain escrow.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">{c.h}</p>
              <ul className="mt-6 space-y-3">
                {c.items.map(([label, to]) => (
                  <li key={label}><Link to={to} className="text-sm text-white/70 transition-colors hover:text-white">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-[11px] uppercase tracking-[0.2em] text-white/40 sm:flex-row">
          <span>© {new Date().getFullYear()} Hidden Property Intel. All rights reserved.</span>
          <span>Black · White · Silver</span>
        </div>
      </div>
    </footer>
  );
}