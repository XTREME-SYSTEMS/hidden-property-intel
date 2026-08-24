import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/luxury/Logo";
import PWAInstall from "@/components/PWAInstall";
import AlertsBell from "@/components/AlertsBell";
import { base44 } from "@/api/base44Client";

export default function LuxNav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const links = [
    { label: "Inventory", to: "/listings" },
    { label: "For Investors", href: "/#investors" },
    { label: "For Sellers", href: "/#sellers" },
    { label: "Calculators", to: "/calculators" },
    { label: "Pipeline", to: "/investor/pipeline" },
  ];
  const adminLinks = [
    { label: "Scrape Sources", to: "/admin/sources" },
    { label: "Outreach", to: "/admin/outreach" },
  ];

  const renderLink = (l, onClick) =>
    l.to ? (
      <Link key={l.label} to={l.to} onClick={onClick} className="text-[11px] uppercase tracking-[0.25em] text-black/70 transition-colors hover:text-black">
        {l.label}
      </Link>
    ) : (
      <a key={l.label} href={l.href} onClick={onClick} className="text-[11px] uppercase tracking-[0.25em] text-black/70 transition-colors hover:text-black">
        {l.label}
      </a>
    );

  return (
    <header className="fixed top-0 z-50 w-full border-b border-black/10 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-32 max-w-[1400px] items-center justify-between px-6 lg:px-12">
        <Link to="/" aria-label="Hidden Property Intel" className="flex items-center">
          <Logo variant="dark" className="hidden h-[120px] w-auto sm:block" />
          <Logo variant="dark" compact className="h-[120px] w-[120px] sm:hidden" />
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {links.map((l) => renderLink(l))}
          {user?.role === "admin" && (
            <div className="flex items-center gap-5 border-l border-black/10 pl-6">
              {adminLinks.map((l) => renderLink(l))}
            </div>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <AlertsBell user={user} />
          <PWAInstall variant="nav" />
          <Link to="/seller/post-property" className="hidden rounded-sm bg-black px-5 py-2.5 text-[11px] uppercase tracking-[0.25em] text-white transition-colors hover:bg-black/80 sm:inline-block">
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
          {links.map((l) => renderLink(l, () => setOpen(false)))}
          {user?.role === "admin" && adminLinks.map((l) => renderLink(l, () => setOpen(false)))}
        </div>
      )}
    </header>
  );
}