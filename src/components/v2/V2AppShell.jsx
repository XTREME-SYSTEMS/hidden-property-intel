import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Search, FileSignature, MessageSquare, User, Bell, LayoutDashboard, ArrowLeft } from "lucide-react";

const NAV = [
  { to: "/v2/app", icon: Home, label: "Home" },
  { to: "/v2/app/search", icon: Search, label: "Search" },
  { to: "/v2/app/deals", icon: FileSignature, label: "Deals" },
  { to: "/v2/app/messages", icon: MessageSquare, label: "Messages", badge: 3 },
  { to: "/v2/app/profile", icon: User, label: "Profile" },
];

export default function V2AppShell({ persona = "PropertyIntel", initials = "PI" }) {
  const loc = useLocation();
  return (
    <div className="hpi-v2">
      <div className="v2-app">
        <div className="v2-app-layout">
          {/* Desktop sidebar */}
          <aside className="v2-app-sidebar">
            <div className="v2-app-sidebar-brand">
              <div className="v2-app-avatar">{initials}</div>
              <div>
                <b>{persona} Portal</b>
                <span>Premium access</span>
              </div>
            </div>
            <nav className="v2-app-sidebar-nav">
              {NAV.map((n) => {
                const active = loc.pathname === n.to;
                return (
                  <Link key={n.to} to={n.to} className={active ? "active" : ""}>
                    <n.icon /> <span>{n.label}</span>
                    {n.badge && <span className="v2-nav-badge">{n.badge}</span>}
                  </Link>
                );
              })}
            </nav>
            <div className="v2-app-sidebar-foot">
              <Link to="/v2"><ArrowLeft size={16} /> Back to site</Link>
              <Link to="/admin"><LayoutDashboard size={16} /> Admin</Link>
            </div>
          </aside>

          {/* Main content */}
          <div className="v2-app-content">
            <header className="v2-app-header">
              <div className="v2-app-avatar" style={{ display: "none" }} />
              <div className="v2-app-header-titles">
                <b>{persona} Portal</b>
                <span className="hidden lg:block">Premium access</span>
              </div>
              <button className="v2-app-icon-btn ml-auto"><Bell size={18} /><span className="dot" /></button>
            </header>

            <div className="v2-app-body">
              <Outlet />
            </div>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav className="v2-bottom-nav">
          {NAV.map((n) => {
            const active = loc.pathname === n.to;
            return (
              <Link key={n.to} to={n.to} className={active ? "active" : ""}>
                <n.icon />
                <span>{n.label}</span>
                {n.badge && <span className="v2-nav-badge">{n.badge}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}