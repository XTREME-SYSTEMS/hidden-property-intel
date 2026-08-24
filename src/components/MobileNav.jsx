import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Building2, Bookmark, MessageSquare, User } from "lucide-react";
import MobileSearch from "@/components/MobileSearch";

export default function MobileNav() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = () => setSearchOpen(true);
    window.addEventListener("open-mobile-search", handler);
    return () => window.removeEventListener("open-mobile-search", handler);
  }, []);

  const tabs = [
    { icon: Home, label: "Home", to: "/" },
    { icon: Building2, label: "Market", to: "/listings" },
    { icon: Bookmark, label: "Saved", to: "/saved" },
    { icon: MessageSquare, label: "Messages", to: "/alerts" },
    { icon: User, label: "Account", to: "/investor/dashboard" },
  ];

  const isActive = (to) => {
    if (!to) return false;
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-[#e0e0e0]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5 h-[58px]">
          {tabs.map((tab) => {
            const active = isActive(tab.to);
            const className = `flex items-center justify-center transition-colors duration-200 ${active ? "text-[#c5a059]" : "text-[#707070]"}`;
            return (
              <Link key={tab.label} to={tab.to} className={className}>
                <span className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-colors duration-200 ${active ? "bg-[#c5a059]/10" : ""}`}>
                  <tab.icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.25 : 1.6} />
                  <span className="font-brand text-[9.5px] uppercase tracking-[0.14em] leading-none">{tab.label}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      <MobileSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}