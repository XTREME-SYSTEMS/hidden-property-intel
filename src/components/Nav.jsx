import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Building2 } from "lucide-react";

const links = [
  { to: "/properties", label: "Properties" },
  { to: "/calculators", label: "Calculators" },
];

export default function Nav() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-[#E5EDEA] bg-[#F8FAF9]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0F2A1D]">
            <Building2 className="h-4 w-4 text-emerald-400" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight text-[#0F2A1D]">Hidden Property Intel</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`rounded-full px-3.5 py-2 text-sm transition-colors ${
                pathname.startsWith(l.to) ? "bg-[#0F2A1D] text-white" : "text-[#1A2B22] hover:bg-[#E5EDEA]"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/properties"
            className="ml-2 hidden rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 sm:block"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}