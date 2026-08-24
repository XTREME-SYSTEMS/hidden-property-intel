import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/luxury/Logo";

export default function LuxNav() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Inventory", to: "/listings" },
    { label: "For Investors", href: "/#investors" },
    { label: "For Sellers", href: "/#sellers" },
    { label: "Calculators", to: "/calculators" },
  ];
  return (
    <header className="fixed top-0 z-50 w-full border-b border-black/10 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6 lg:px-12">
        <Link to="/" aria-label="PropertyIntel"><Logo variant="dark" /></Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {links.map((l) =>
            l.to ? (
              <Link key={l.label} to={l.to} className="text-[11px] uppercase tracking-[0.25em] text-black/70 transition-colors hover:text-black">
                {l.label}
              </Link>
            ) : (
              <a key={l.label} href={l.href} className="text-[11px] uppercase tracking-[0.25em] text-black/70 transition-colors hover:text-black">
                {l.label}
              </a>
            )
          )}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/listings" className="hidden rounded-sm bg-black px-5 py-2.5 text-[11px] uppercase tracking-[0.25em] text-white transition-colors hover:bg-black/80 sm:inline-block">
            List your property
          </Link>
          <button onClick={() => setOpen(!open)} className="lg:hidden" aria-label="Menu">
            <span className="block h-px w-6 bg-black" />
            <span className="mt-1.5 block h-px w-6 bg-black" />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-black/10 bg-white px-6 py-4 lg:hidden">
          {links.map((l) =>
            l.to ? (
              <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className="block py-3 text-xs uppercase tracking-[0.25em] text-black/70">
                {l.label}
              </Link>
            ) : (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="block py-3 text-xs uppercase tracking-[0.25em] text-black/70">
                {l.label}
              </a>
            )
          )}
        </div>
      )}
    </header>
  );
}