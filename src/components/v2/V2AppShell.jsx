import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Search, FileSignature, MessageSquare, User, Bell } from "lucide-react";

const NAV = [
  { to: "/v2/app", icon: Home, label: "Home" },
  { to: "/v2/app/search", icon: Search, label: "Search" },
  { to: "/v2/app/deals", icon: FileSignature, label: "Deals" },
  { to: "/v2/app/messages", icon: MessageSquare, label: "Messages", badge: 3 },
  { to: "/v2/app/profile", icon: User, label: "Profile" },
];

export default function V2AppShell({ persona = "Investor", initials = "IN" }) {
  const loc = useLocation();
  return (
    <div className="hpi-v2">
      <div className="v2-app">
        <header className="v2-app-header">
          <div className="v2-app-avatar">{initials}</div>
          <div className="v2-app-header-titles">
            <b>{persona} Portal</b>
            <span>Premium access</span>
          </div>
          <button className="v2-app-icon-btn"><Bell size={18} /><span className="dot" /></button>
        </header>

        <div className="v2-app-body">
          <Outlet />
        </div>

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