import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#0F2A1D] text-white/70 mt-24">
      <div className="mx-auto max-w-7xl px-6 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold text-white">PropertyIntel</p>
          <p className="mt-2 text-sm leading-relaxed">
            AI-powered discovery of distressed and inherited real estate.
          </p>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-white text-xs uppercase tracking-widest">Invest</p>
          <Link className="block hover:text-white" to="/properties">Browse properties</Link>
          <Link className="block hover:text-white" to="/calculators">ROI calculators</Link>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-white text-xs uppercase tracking-widest">Sell</p>
          <Link className="block hover:text-white" to="/properties">Market data</Link>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-white text-xs uppercase tracking-widest">Company</p>
          <Link className="block hover:text-white" to="/">Home</Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs">
        © {new Date().getFullYear()} PropertyIntel. All rights reserved.
      </div>
    </footer>
  );
}