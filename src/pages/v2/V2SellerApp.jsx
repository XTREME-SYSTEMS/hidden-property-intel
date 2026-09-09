import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Home, DollarSign, FileSignature, MessageSquare, Plus, TrendingUp, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function V2SellerApp() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Property.list("-created_date", 5)
      .then((p) => setProperties(Array.isArray(p) ? p : []))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <p className="v2-app-greeting">Seller dashboard</p>
      <h1 className="v2-app-title">Your listings</h1>

      <div className="v2-app-stats">
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}><Home size={18} /></div>
          <b>3</b><span>Active listings</span>
        </div>
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}><DollarSign size={18} /></div>
          <b>$842K</b><span>Offers received</span>
        </div>
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}><MessageSquare size={18} /></div>
          <b>9</b><span>Messages</span>
        </div>
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}><Clock size={18} /></div>
          <b>12 days</b><span>Avg time on market</span>
        </div>
      </div>

      <div className="v2-app-section">
        <div className="v2-app-section-head"><h3>Quick actions</h3></div>
        <div className="v2-app-actions">
          <Link to="/v2" className="v2-app-action"><div className="v2-app-action-icon" style={{ background: "#dcfce7", color: "#16a34a" }}><Plus size={20} /></div><span>List property</span></Link>
          <Link to="/v2" className="v2-app-action"><div className="v2-app-action-icon" style={{ background: "#dbeafe", color: "#2563eb" }}><TrendingUp size={20} /></div><span>Value estimate</span></Link>
          <Link to="/v2" className="v2-app-action"><div className="v2-app-action-icon" style={{ background: "#fef3c7", color: "#d97706" }}><FileSignature size={20} /></div><span>Sign docs</span></Link>
          <Link to="/v2" className="v2-app-action"><div className="v2-app-action-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}><MessageSquare size={20} /></div><span>Messages</span></Link>
        </div>
      </div>

      <div className="v2-app-section">
        <div className="v2-app-section-head"><h3>Your properties</h3><Link to="/v2">See all</Link></div>
        <div className="v2-app-list">
          {loading ? <div className="v2-loading"><div className="v2-spinner" /></div> : properties.length === 0 ? (
            <div className="v2-app-item"><div className="v2-app-item-main"><b>No listings yet</b><span>List your first property</span></div></div>
          ) : properties.map((p) => (
            <Link to={`/v2/properties/${p.id}`} key={p.id} className="v2-app-item">
              <img src={p.images?.[0]?.url || "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&q=80"} alt="" />
              <div className="v2-app-item-main">
                <b>{p.address || "Property"}</b>
                <span>{p.city}, {p.state} · {p.distress_type || "off-market"}</span>
              </div>
              <span className="v2-app-item-pill active">{p.status || "active"}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}