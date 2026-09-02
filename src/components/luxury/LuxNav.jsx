import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/luxury/Logo";
import PWAInstall from "@/components/PWAInstall";
import AlertsBell from "@/components/AlertsBell";
import GlobalHamburger from "@/components/GlobalHamburger";
import { base44 } from "@/api/base44Client";

export default function LuxNav() {
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const links = [
    { label: "Inventory", to: "/listings" },
    { label: "For Investors", href: "/#investors" },
    { label: "For Sellers", href: "/#sellers" },
    { label: "Calculators", to: "/calculators" },
  ];

  const linkClass = "font-brand text-[11px] font-medium uppercase tracking-[0.3em] text-black/70 transition-colors hover:text-black";
  const renderLink = (l, onClick) =>
    l.to ? (
      <Link key={l.label} to={l.to} onClick={onClick} className={linkClass}>
        {l.label}
      </Link>
    ) : (
      <a key={l.label} href={l.href} onClick={onClick} className={linkClass}>
        {l.label}
      </a>
    );

  return (
    <header className="fixed top-0 z-50 w-full border-b border-black/10 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 md:h-28 max-w-[1400px] items-center justify-between px-5 sm:px-6 lg:px-12">
        <Link to="/" aria-label="Hidden Property Intel" className="flex items-center">
          <Logo variant="dark" className="h-12 w-auto sm:h-14 md:h-24" />
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {links.map((l) => renderLink(l))}
        </nav>

        <div className="flex items-center gap-4">
          <AlertsBell user={user} />
          <PWAInstall variant="nav" />
          <Link to="/seller/post-property" className="hidden rounded-sm bg-black px-5 py-2.5 font-brand text-[11px] font-medium uppercase tracking-[0.3em] text-white transition-colors hover:bg-black/80 sm:inline-block">
            List your property
          </Link>
          <GlobalHamburger />
        </div>
      </div>
    </header>
  );
}