import React from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { PORTAL_NAV } from "@/lib/portalNav";

export default function PortalSidebar({ role, user, mobileOpen, onClose }) {
  const location = useLocation();
  const items = PORTAL_NAV.filter((n) => !n.roles || n.roles.includes(role || "investor"));
  const initial = (user?.full_name || user?.email || "?").charAt(0).toUpperCase();

  const content = (
    <>
      <nav className="flex flex-col gap-0.5 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
              style={
                active
                  ? { backgroundColor: "#fff8e9", color: "var(--gold-3)", fontWeight: 600, borderLeft: "2px solid var(--gold)" }
                  : { color: "var(--muted)" }
              }
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide text-white" style={{ background: "var(--gold)" }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t p-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white" style={{ background: "var(--gold)" }}>
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium" style={{ color: "var(--ink)" }}>{user?.full_name || "Member"}</p>
            <p className="truncate text-xs capitalize" style={{ color: "var(--muted)" }}>{role || "member"}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile drawer — fixed overlay, desktop hidden */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] shrink-0 flex-col border-r bg-white transition-transform lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-end border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" style={{ color: "var(--ink)" }} />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto">{content}</div>
      </aside>

      {/* Desktop sidebar — sticky in-flow, sits below the fixed nav */}
      <aside
        className="hidden w-[260px] shrink-0 border-r bg-white lg:flex lg:sticky lg:top-28 lg:h-[calc(100vh-7rem)] lg:flex-col"
        style={{ borderColor: "var(--border)" }}
      >
        {content}
      </aside>
    </>
  );
}