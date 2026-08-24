import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Building2, Search, Plus, Download } from "lucide-react";
import PWAInstall from "@/components/PWAInstall";
import MobileSearch from "@/components/MobileSearch";

export default function MobileNav() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  // Allow other components (e.g. home page search bar) to open the overlay
  useEffect(() => {
    const handler = () => setSearchOpen(true);
    window.addEventListener("open-mobile-search", handler);
    return () => window.removeEventListener("open-mobile-search", handler);
  }, []);

  const tabs = [
    { icon: Home, label: "Home", to: "/" },
    { icon: Building2, label: "Inventory", to: "/listings" },
    { icon: Search, label: "Search", action: () => setSearchOpen(true) },
    { icon: Plus, label: "List", to: "/seller/post-property" },
    { icon: Download, label: "Install", action: "install" },
  ];

  const isActive = (to) => {
    if (!to) return false;
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5 h-16">
          {tabs.map((tab) => {
            const active = isActive(tab.to);

            if (tab.action === "install") {
              return (
                <div key={tab.label} className="flex flex-col items-center justify-center gap-1.5">
                  <PWAInstall variant="mobiletab" />
                  <span className="font-brand text-[10px] uppercase tracking-[0.15em] text-black/40">{tab.label}</span>
                </div>
              );
            }

            const content = (
              <>
                <tab.icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={active ? 2.2 : 1.75}
                />
                <span className="font-brand text-[10px] uppercase tracking-[0.15em]">
                  {tab.label}
                </span>
                <span
                  className={`h-1 w-1 rounded-full transition-colors ${active ? "bg-gold" : "bg-transparent"}`}
                />
              </>
            );

            const className = `flex flex-col items-center justify-center gap-1.5 transition-colors ${
              active ? "text-black" : "text-black/40"
            }`;

            if (tab.action) {
              return (
                <button key={tab.label} onClick={tab.action} className={className} aria-label={tab.label}>
                  {content}
                </button>
              );
            }

            return (
              <Link key={tab.label} to={tab.to} className={className}>
                {content}
              </Link>
            );
          })}
        </div>
      </nav>

      <MobileSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}