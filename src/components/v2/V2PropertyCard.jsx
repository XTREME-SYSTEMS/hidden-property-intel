import React from "react";
import { Link } from "react-router-dom";
import { Bed, Bath, Maximize, MapPin } from "lucide-react";

const DISTRESS_LABELS = {
  "pre-foreclosure": "Pre-Foreclosure",
  foreclosure: "Foreclosure",
  "probate_inherited": "Probate",
  "tax_delinquent": "Tax Delinquent",
  "code_violation": "Code Violation",
  divorce: "Divorce",
  bankruptcy: "Bankruptcy",
  auction: "Auction",
  short_sale: "Short Sale",
  bank_owned: "Bank Owned",
};

const DISTRESS_CLASS = {
  "pre-foreclosure": "pre-foreclosure",
  foreclosure: "pre-foreclosure",
  "probate_inherited": "probate",
  "tax_delinquent": "tax",
};

export default function V2PropertyCard({ property }) {
  const p = property || {};
  const img = p.images?.[0]?.url || "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80";
  const price = p.proposed_asking_price || p.estimated_value || p.arv;
  const score = p.property_score ?? p.investment_opportunity_score ?? p.predictive_distress_score;
  const scoreClass = score && score >= 75 ? "high" : "";
  const distress = p.distress_type ? DISTRESS_LABELS[p.distress_type] || p.distress_type : "Off-Market";
  const distressClass = p.distress_type ? DISTRESS_CLASS[p.distress_type] || "" : "";

  return (
    <Link to={`/v2/properties/${p.id}`} className="v2-card">
      <div className="v2-card-media">
        <img src={img} alt={p.address || "Property"} loading="lazy" />
        <span className={`v2-card-badge ${distressClass}`}>{distress}</span>
        {score != null && <span className={`v2-card-score ${scoreClass}`}>{Math.round(score)}</span>}
      </div>
      <div className="v2-card-body">
        {price != null && <div className="v2-card-price">${Number(price).toLocaleString()}</div>}
        <div className="v2-card-addr">
          <MapPin />
          <span>{p.address ? `${p.address}, ${p.city || ""}, ${p.state || ""} ${p.zip_code || ""}` : "Address on request"}</span>
        </div>
        <div className="v2-card-facts">
          {p.bedrooms != null && <span><Bed size={14} /> {p.bedrooms} bd</span>}
          {p.bathrooms != null && <span><Bath size={14} /> {p.bathrooms} ba</span>}
          {p.square_footage != null && <span><Maximize size={14} /> {Number(p.square_footage).toLocaleString()} sqft</span>}
        </div>
        <div className="v2-card-meta">
          <small>{p.days_on_market != null ? `${p.days_on_market} days` : "New"}</small>
          <small className="v2-link" style={{ fontSize: 12 }}>View →</small>
        </div>
      </div>
    </Link>
  );
}