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
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-black/[0.06] shadow-[0_-1px_24px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5 h-[58px]">
          {tabs.map((tab) => {
            const active = isActive(tab.to);

            if (tab.action === "install") {
              return (
                <div key={tab.label} className="flex items-center justify-center">
                  <PWAInstall variant="mobiletab" active={active} />
                </div>
              );
            }

            const inner = (
              <span
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-colors duration-200 ${
                  active ? "bg-black/[0.04]" : ""
                }`}
              >
                <tab.icon
                  className="h-[21px] w-[21px] transition-colors duration-200"
                  strokeWidth={active ? 2.25 : 1.6}
                />
                <span className="font-brand text-[9.5px] uppercase tracking-[0.14em] leading-none">
                  {tab.label}
                </span>
              </span>
            );

            const className = `flex items-center justify-center transition-colors duration-200 ${
              active ? "text-black" : "text-black/35"
            }`;

            if (tab.action) {
              return (
                <button key={tab.label} onClick={tab.action} className={className} aria-label={tab.label}>
                  {inner}
                </button>
              );
            }

            return (
              <Link key={tab.label} to={tab.to} className={className}>
                {inner}
              </Link>
            );
          })}
        </div>
      </nav>

      <MobileSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}