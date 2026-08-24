import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function LuxNav() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/", label: "Residences" },
    { to: "/listings", label: "Portfolio" },
    { to: "/listings", label: "Collections" },
    { to: "/listings", label: "Journal" },
  ];
  return (
    <header className="fixed top-0 z-50 w-full border-b border-black/10 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6 lg:px-12">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-sm bg-black text-xs font-semibold tracking-widest text-white">P</span>
          <span className="text-sm font-medium uppercase tracking-[0.3em] text-black">PropertyIntel</span>
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {links.map((l, i) => (
            <Link
              key={i}
              to={l.to}
              className="text-[11px] uppercase tracking-[0.25em] text-black/70 transition-colors hover:text-black"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/listings" className="hidden rounded-sm border border-black px-5 py-2.5 text-[11px] uppercase tracking-[0.25em] text-black transition-colors hover:bg-black hover:text-white sm:inline-block">
            Enquire
          </Link>
          <button onClick={() => setOpen(!open)} className="lg:hidden">
            <span className="block h-px w-6 bg-black" />
            <span className="mt-1.5 block h-px w-6 bg-black" />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-black/10 bg-white px-6 py-4 lg:hidden">
          {links.map((l, i) => (
            <Link key={i} to={l.to} onClick={() => setOpen(false)} className="block py-3 text-xs uppercase tracking-[0.25em] text-black/70">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}