import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PortalSidebar from "@/components/portal/PortalSidebar";
import { Menu } from "lucide-react";

export default function PortalLayout() {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const role = user?.portal_role || "investor";
  const firstName = user?.full_name ? user.full_name.split(" ")[0] : "";

  return (
    <div className="flex min-h-screen" style={{ background: "#f7f5f0" }}>
      <PortalSidebar role={role} user={user} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-20 md:top-28 z-30 flex h-[72px] items-center gap-3 border-b px-5"
          style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)" }}
        >
          <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" style={{ color: "var(--ink)" }} />
          </button>
          <div className="flex-1">
            <p className="eyebrow">PropertyIntel Portal</p>
            <h1 className="font-heading text-lg font-bold" style={{ color: "var(--ink)" }}>
              Welcome back{firstName ? `, ${firstName}` : ""}
            </h1>
          </div>
          {!user?.portal_onboarding_complete && (
            <a href="/portal/onboarding" className="btn gold hidden sm:inline-flex" style={{ fontSize: 11 }}>
              Finish setup
            </a>
          )}
        </header>
        <main className="flex-1 p-5 lg:p-8">
          <Outlet context={{ user, role }} />
        </main>
      </div>
    </div>
  );
}