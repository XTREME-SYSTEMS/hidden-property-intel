import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogIn, ChevronRight } from "lucide-react";

const PAGES = [
  { label: "Home", to: "/" },
  { label: "Inventory", to: "/listings" },
  { label: "For Investors", href: "/#investors" },
  { label: "For Sellers", href: "/#sellers" },
  { label: "Calculators", to: "/calculators" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "Smart Contracts", to: "/smart-contracts" },
  { label: "Blog", to: "/blog" },
  { label: "Contact", to: "/contact" },
];

export default function GlobalHamburger() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="All pages menu"
        className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-black/15 text-black transition-colors hover:bg-black hover:text-white"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-sm border border-black/10 bg-white shadow-2xl">
          <div className="flex flex-col items-end gap-0.5 p-4">
            {PAGES.map((p) =>
              p.to ? (
                <Link
                  key={p.label}
                  to={p.to}
                  onClick={close}
                  className="group flex w-full items-center justify-end gap-2 py-2.5 text-right font-brand text-sm font-medium uppercase tracking-[0.2em] text-black/70 transition-colors hover:text-black"
                >
                  {p.label}
                  <ChevronRight className="h-3 w-3 text-black/30 transition-colors group-hover:text-gold" />
                </Link>
              ) : (
                <a
                  key={p.label}
                  href={p.href}
                  onClick={close}
                  className="group flex w-full items-center justify-end gap-2 py-2.5 text-right font-brand text-sm font-medium uppercase tracking-[0.2em] text-black/70 transition-colors hover:text-black"
                >
                  {p.label}
                  <ChevronRight className="h-3 w-3 text-black/30 transition-colors group-hover:text-gold" />
                </a>
              )
            )}

            <div className="mt-2 w-full border-t border-black/10 pt-3">
              <Link
                to="/login?returnTo=/investor/dashboard"
                onClick={close}
                className="group flex w-full items-center justify-end gap-2 py-2.5 text-right font-brand text-sm font-bold uppercase tracking-[0.2em] text-black transition-colors hover:text-gold"
              >
                Portal Sign In
                <LogIn className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}