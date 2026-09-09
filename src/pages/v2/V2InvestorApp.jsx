import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Wallet, FileSignature, Search, Calculator, MapPin, ArrowRight, Building2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import V2PropertyCard from "@/components/v2/V2PropertyCard";

export default function V2InvestorApp() {
  const [properties, setProperties] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [props, bidList] = await Promise.all([
          base44.entities.Property.list("-property_score", 4),
          base44.entities.Bid.list("-created_date", 4).catch(() => []),
        ]);
        setProperties(Array.isArray(props) ? props : []);
        setBids(Array.isArray(bidList) ? bidList : []);
      } catch (e) { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <p className="v2-app-greeting">Investor dashboard</p>
      <h1 className="v2-app-title">Your deals at a glance</h1>

      <div className="v2-app-stats">
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}><TrendingUp size={18} /></div>
          <b>24</b><span>Active bids</span><div className="up">+3 this week</div>
        </div>
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}><Wallet size={18} /></div>
          <b>$1.2M</b><span>Capital deployed</span>
        </div>
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}><FileSignature size={18} /></div>
          <b>7</b><span>Won deals</span>
        </div>
        <div className="v2-app-stat">
          <div className="v2-app-stat-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}><Building2 size={18} /></div>
          <b>18%</b><span>Avg ROI</span>
        </div>
      </div>

      <div className="v2-app-section">
        <div className="v2-app-section-head"><h3>Quick actions</h3></div>
        <div className="v2-app-actions">
          <Link to="/v2" className="v2-app-action"><div className="v2-app-action-icon" style={{ background: "#dcfce7", color: "#16a34a" }}><Search size={20} /></div><span>Find deals</span></Link>
          <Link to="/deal-calculator" className="v2-app-action"><div className="v2-app-action-icon" style={{ background: "#dbeafe", color: "#2563eb" }}><Calculator size={20} /></div><span>Calculator</span></Link>
          <Link to="/v2" className="v2-app-action"><div className="v2-app-action-icon" style={{ background: "#fef3c7", color: "#d97706" }}><MapPin size={20} /></div><span>Map</span></Link>
          <Link to="/v2" className="v2-app-action"><div className="v2-app-action-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}><FileSignature size={20} /></div><span>Contracts</span></Link>
        </div>
      </div>

      <div className="v2-app-section">
        <div className="v2-app-section-head"><h3>Top opportunities</h3><Link to="/v2">See all</Link></div>
        {loading ? (
          <div className="v2-loading"><div className="v2-spinner" /></div>
        ) : (
          <div className="v2-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {properties.map((p) => <V2PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </div>

      <div className="v2-app-section">
        <div className="v2-app-section-head"><h3>Your recent bids</h3></div>
        <div className="v2-app-list">
          {bids.length === 0 && !loading ? (
            <div className="v2-app-item"><div className="v2-app-item-main"><b>No bids yet</b><span>Start bidding on properties</span></div></div>
          ) : bids.map((b) => (
            <div key={b.id} className="v2-app-item">
              <div className="v2-app-item-main">
                <b>${Number(b.bid_amount || 0).toLocaleString()}</b>
                <span>{b.bid_type || "initial"} bid</span>
              </div>
              <span className={`v2-app-item-pill ${b.status === "accepted" ? "won" : b.status === "active" ? "active" : "pending"}`}>{b.status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}