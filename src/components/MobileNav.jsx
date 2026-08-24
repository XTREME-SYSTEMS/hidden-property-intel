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
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-end justify-around px-2 py-2">
          {tabs.map((tab) => {
            if (tab.center) {
              return (
                <button
                  key={tab.label}
                  onClick={tab.action}
                  className="flex flex-col items-center gap-1"
                  aria-label={tab.label}
                >
                  <span className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-black text-white shadow-lg">
                    <tab.icon className="h-5 w-5" />
                  </span>
                  <span className="-mt-2 text-[9px] font-medium uppercase tracking-wider text-black">{tab.label}</span>
                </button>
              );
            }
            if (tab.action === "install") {
              return (
                <div key={tab.label} className="flex flex-col items-center gap-1">
                  <PWAInstall variant="mobiletab" />
                  <span className="text-[9px] font-medium uppercase tracking-wider text-black/50">{tab.label}</span>
                </div>
              );
            }
            const active = isActive(tab.to);
            return (
              <Link
                key={tab.label}
                to={tab.to}
                className="flex flex-col items-center gap-1"
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${active ? "bg-black/5 text-black" : "text-black/40"}`}>
                  <tab.icon className="h-5 w-5" />
                </span>
                <span className={`text-[9px] font-medium uppercase tracking-wider ${active ? "text-black" : "text-black/40"}`}>{tab.label}</span>
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