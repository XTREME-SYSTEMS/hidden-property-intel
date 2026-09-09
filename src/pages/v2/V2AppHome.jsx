import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Wallet, Building2, FileSignature, Search, Calculator, MapPin, Sparkles, Handshake, Home, Briefcase, User, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PERSONAS = [
  { to: "/v2/app/investor", icon: TrendingUp, label: "Investor", desc: "Find & bid on deals", color: "#16a34a", bg: "#dcfce7", initials: "IN" },
  { to: "/v2/app/agent", icon: Briefcase, label: "Agent", desc: "Manage clients & deals", color: "#2563eb", bg: "#dbeafe", initials: "AG" },
  { to: "/v2/app/seller", icon: Home, label: "Seller", desc: "List & sell property", color: "#d97706", bg: "#fef3c7", initials: "SE" },
  { to: "/v2/app/broker", icon: Handshake, label: "Broker", desc: "Market analytics & deals", color: "#7c3aed", bg: "#ede9fe", initials: "BR" },
  { to: "/v2/app/wholesaler", icon: Sparkles, label: "Wholesaler", desc: "Assign contracts", color: "#0891b2", bg: "#cffafe", initials: "WH" },
  { to: "/v2/app/manager", icon: Building2, label: "Property Mgr", desc: "Portfolio & maintenance", color: "#db2777", bg: "#fce7f3", initials: "PM" },
];

export default function V2AppHome() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);
  const name = user?.full_name?.split(" ")[0] || "there";

  return (
    <>
      <p className="v2-app-greeting">Welcome back, <b>{name}</b> 👋</p>
      <h1 className="v2-app-title">Choose your portal</h1>

      <div className="v2-persona-grid">
        {PERSONAS.map((p) => (
          <Link key={p.to} to={p.to} className="v2-persona-card">
            <div className="v2-persona-icon" style={{ background: p.bg, color: p.color }}>
              <p.icon size={26} />
            </div>
            <b>{p.label}</b>
            <span>{p.desc}</span>
          </Link>
        ))}
      </div>

      <div className="v2-app-section">
        <div className="v2-app-section-head">
          <h3>Quick actions</h3>
        </div>
        <div className="v2-app-actions">
          <Link to="/v2" className="v2-app-action">
            <div className="v2-app-action-icon" style={{ background: "#dcfce7", color: "#16a34a" }}><Search size={20} /></div>
            <span>Find deals</span>
          </Link>
          <Link to="/v2/app/investor" className="v2-app-action">
            <div className="v2-app-action-icon" style={{ background: "#dbeafe", color: "#2563eb" }}><Calculator size={20} /></div>
            <span>Calculator</span>
          </Link>
          <Link to="/v2/app/investor" className="v2-app-action">
            <div className="v2-app-action-icon" style={{ background: "#fef3c7", color: "#d97706" }}><FileSignature size={20} /></div>
            <span>Contracts</span>
          </Link>
          <Link to="/v2/app/investor" className="v2-app-action">
            <div className="v2-app-action-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}><MapPin size={20} /></div>
            <span>Map search</span>
          </Link>
        </div>
      </div>
    </>
  );
}