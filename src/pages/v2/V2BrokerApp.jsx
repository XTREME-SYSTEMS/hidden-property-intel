import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Handshake, TrendingUp, Building2, DollarSign, BarChart3, Users, FileSignature, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function V2BrokerApp() {
  const [dealCount, setDealCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Deal.list("-created_date", 50)
      .then((d) => setDealCount(Array.isArray(d) ? d.length : 0))
      .catch(() => setDealCount(0))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <p className="v2-app-greeting">Broker dashboard</p>
      <h1 className="v2-app-title">Market overview</h1>

      <div className="v2-app-stats">
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}><Building2 size={18} /></div>
          <b>{loading ? "—" : dealCount}</b><span>Active deals</span>
        </div>
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}><DollarSign size={18} /></div>
          <b>$4.2M</b><span>Volume (30d)</span>
        </div>
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}><Users size={18} /></div>
          <b>28</b><span>Agents managed</span>
        </div>
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}><TrendingUp size={18} /></div>
          <b>+12%</b><span>Market growth</span>
        </div>
      </div>

      <div className="v2-app-section">
        <div className="v2-app-section-head"><h3>Quick actions</h3></div>
        <div className="v2-app-actions">
          <Link to="/v2" className="v2-app-action"><div className="v2-app-action-icon" style={{ background: "#dcfce7", color: "#16a34a" }}><BarChart3 size={20} /></div><span>Analytics</span></Link>
          <Link to="/v2" className="v2-app-action"><div className="v2-app-action-icon" style={{ background: "#dbeafe", color: "#2563eb" }}><Handshake size={20} /></div><span>Deals</span></Link>
          <Link to="/v2" className="v2-app-action"><div className="v2-app-action-icon" style={{ background: "#fef3c7", color: "#d97706" }}><FileSignature size={20} /></div><span>Contracts</span></Link>
          <Link to="/v2" className="v2-app-action"><div className="v2-app-action-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}><MapPin size={20} /></div><span>Map intel</span></Link>
        </div>
      </div>

      <div className="v2-app-section">
        <div className="v2-app-section-head"><h3>Market analytics</h3><Link to="/v2">Details</Link></div>
        <div className="v2-sc-card">
          <div className="v2-sc-row"><span>Avg distressed price (FL)</span><b>$187,400</b></div>
          <div className="v2-sc-row"><span>Median days on market</span><b>34</b></div>
          <div className="v2-sc-row"><span>Foreclosure filings (30d)</span><b>1,240</b></div>
          <div className="v2-sc-row"><span>Probate filings (30d)</span><b>312</b></div>
          <div className="v2-sc-row"><span>Top county</span><b>Miami-Dade</b></div>
        </div>
      </div>
    </>
  );
}