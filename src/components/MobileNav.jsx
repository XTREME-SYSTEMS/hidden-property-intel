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
    { icon: Search, label: "Search", action: () => setSearchOpen(true), center: true },
    { icon: Plus, label: "List", to: "/seller/post-property" },
    { icon: Download, label: "Install", action: "install" },
  ];

  const isActive = (to) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  return (
    <>
      {/* Bottom tab bar — app-like navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="relative flex h-16 items-center justify-around px-3">
          {tabs.map((tab) => {
            if (tab.center) {
              return (
                <button
                  key={tab.label}
                  onClick={tab.action}
                  className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  aria-label={tab.label}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-black to-charcoal text-white shadow-[0_4px_14px_rgba(0,0,0,0.35)] ring-4 ring-white transition-transform active:scale-95">
                    <tab.icon className="h-6 w-6" strokeWidth={2.2} />
                  </span>
                </button>
              );
            }
            if (tab.action === "install") {
              return (
                <div key={tab.label} className="flex flex-1 flex-col items-center gap-1">
                  <PWAInstall variant="mobiletab" />
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-black/40">{tab.label}</span>
                </div>
              );
            }
            const active = isActive(tab.to);
            return (
              <Link
                key={tab.label}
                to={tab.to}
                className="flex flex-1 flex-col items-center gap-1.5 transition-transform active:scale-95"
              >
                <span className={`flex h-7 w-7 items-center justify-center transition-colors ${active ? "text-black" : "text-black/35"}`}>
                  <tab.icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span className={`text-[9px] font-semibold uppercase tracking-wider transition-colors ${active ? "text-black" : "text-black/35"}`}>
                  {tab.label}
                </span>
                {active && <span className="absolute bottom-0 h-0.5 w-6 rounded-full bg-gold" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Full-screen AI search overlay */}
      <MobileSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}