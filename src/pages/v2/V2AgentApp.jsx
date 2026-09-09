import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Users, FileSignature, DollarSign, Search, FileText, Calendar, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function V2AgentApp() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Deal.list("-created_date", 5)
      .then((d) => setDeals(Array.isArray(d) ? d : []))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <p className="v2-app-greeting">Agent dashboard</p>
      <h1 className="v2-app-title">Your pipeline</h1>

      <div className="v2-app-stats">
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}><Users size={18} /></div>
          <b>12</b><span>Active clients</span>
        </div>
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}><Briefcase size={18} /></div>
          <b>5</b><span>Deals in escrow</span>
        </div>
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}><DollarSign size={18} /></div>
          <b>$48K</b><span>YTD commissions</span>
        </div>
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}><FileSignature size={18} /></div>
          <b>3</b><span>Pending signatures</span>
        </div>
      </div>

      <div className="v2-app-section">
        <div className="v2-app-section-head"><h3>Quick actions</h3></div>
        <div className="v2-app-actions">
          <Link to="/v2" className="v2-app-action"><div className="v2-app-action-icon" style={{ background: "#dcfce7", color: "#16a34a" }}><Search size={20} /></div><span>Find for client</span></Link>
          <Link to="/v2" className="v2-app-action"><div className="v2-app-action-icon" style={{ background: "#dbeafe", color: "#2563eb" }}><FileText size={20} /></div><span>Documents</span></Link>
          <Link to="/v2" className="v2-app-action"><div className="v2-app-action-icon" style={{ background: "#fef3c7", color: "#d97706" }}><Calendar size={20} /></div><span>Schedule</span></Link>
          <Link to="/v2" className="v2-app-action"><div className="v2-app-action-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}><FileSignature size={20} /></div><span>Sign</span></Link>
        </div>
      </div>

      <div className="v2-app-section">
        <div className="v2-app-section-head"><h3>Active deals</h3><Link to="/v2">See all</Link></div>
        <div className="v2-app-list">
          {loading ? <div className="v2-loading"><div className="v2-spinner" /></div> : deals.length === 0 ? (
            <div className="v2-app-item"><div className="v2-app-item-main"><b>No deals yet</b><span>Deals will appear here</span></div></div>
          ) : deals.map((d) => (
            <div key={d.id} className="v2-app-item">
              <div className="v2-app-item-main">
                <b>{d.stage || "lead"}</b>
                <span>{d.exit_strategy ? `Exit: ${d.exit_strategy}` : "New lead"}</span>
              </div>
              <span className={`v2-app-item-pill ${d.status === "won" ? "won" : "active"}`}>{d.status || "active"}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}