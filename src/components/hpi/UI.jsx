import { ArrowRight, Heart, MapPin, ShieldCheck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

export function SectionHeader({ eyebrow, title, body, action }) {
  return <div className="section-head"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{body && <p>{body}</p>}</div>{action}</div>;
}

export function PropertyCard({ p, onSave }) {
  return <article className="property-card">
    <div className="property-media">
      <img src={p.image} alt={`${p.address} property`} loading="lazy" />
      <span className="status-pill">{p.distress}</span>
      <button className={`save-btn ${p.saved ? 'saved' : ''}`} onClick={() => onSave?.(p)} aria-label="Save property"><Heart size={17} /></button>
    </div>
    <div className="property-content">
      <div className="property-price-row"><strong>{money(p.price)}</strong><span className="score-mini">HPI {p.score}</span></div>
      <h3>{p.address}</h3>
      <p><MapPin size={13} />{p.city}, {p.state} {p.zip}</p>
      <div className="property-facts"><span>{p.beds} bd</span><span>{p.baths} ba</span><span>{p.sqft.toLocaleString()} sq ft</span></div>
      <div className="mini-metrics">
        <div><small>ARV</small><b>{money(p.arv)}</b></div>
        <div><small>Repairs</small><b>{money(p.repairs)}</b></div>
        <div><small>ROI</small><b>{p.roi}%</b></div>
      </div>
      <Link className="card-link" to={`/property/${p.id}`}>View opportunity <ArrowRight size={15} /></Link>
    </div>
  </article>;
}

export function OpportunityScore({ score = 78, label = 'High Opportunity' }) {
  return <div className="score-ring" style={{ '--score': score }}><div><strong>{score}</strong><span>HPI Score</span><small>{label}</small></div></div>;
}

export function MetricCard({ label, value, delta, icon: Icon = TrendingUp, tone = 'gold' }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={18} /></div><div><span>{label}</span><strong>{value}</strong>{delta && <small>{delta}</small>}</div></div>;
}

export function TrustStrip() {
  return <div className="trust-strip">
    <div><ShieldCheck size={18} /><span>Identity & seller verification states</span></div>
    <div><ShieldCheck size={18} /><span>Secure document workflow</span></div>
    <div><ShieldCheck size={18} /><span>Transparent milestone tracking</span></div>
  </div>;
}

export function EmptyState({ title = 'Nothing here yet', body = 'Your activity will appear here as soon as it is available.', action }) {
  return <div className="empty-state"><div className="empty-icon"><ShieldCheck /></div><h3>{title}</h3><p>{body}</p>{action}</div>;
}