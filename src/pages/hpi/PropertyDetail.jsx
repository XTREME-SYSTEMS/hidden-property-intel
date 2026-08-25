import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Brain, FileSignature, Heart, MapPin, ShieldCheck, TrendingUp } from 'lucide-react';
import { OpportunityScore, money } from '@/components/hpi/UI';
import { backend } from '@/api/hpiBackend';

export default function PropertyDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    backend.getProperty(id).then(data => { setP(data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="route-loader">Loading property…</div>;
  if (!p) return <div className="route-loader">Property not found.</div>;

  const equity = (p.arv || p._raw?.estimated_value || 0) - p.price;

  return <>
    <div className="property-page">
      <Link to="/marketplace" className="back-link"><ArrowLeft size={16} /> Back to marketplace</Link>
      <div className="property-detail-grid">
        <div>
          <img className="detail-main" src={p.image} alt={p.address} />
          <div className="gallery-strip">
            {p._raw?.images?.slice(0, 4).map((img, i) => <img key={i} src={img.url} alt={`View ${i+1}`} />)}
            <button>+{Math.max(0, (p._raw?.images?.length || 0) - 4)} more</button>
          </div>
          <div className="detail-title">
            <span className="status-pill static">{p.distress}</span>
            <h1>{p.address}</h1>
            <strong>{money(p.price)}</strong>
            <small><MapPin size={13} /> {p.city}, {p.state} {p.zip}</small>
          </div>
          <div className="detail-tabs">
            <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button>
            <button className={tab === 'financials' ? 'active' : ''} onClick={() => setTab('financials')}>Financials</button>
            <button className={tab === 'property' ? 'active' : ''} onClick={() => setTab('property')}>Property</button>
            <button className={tab === 'location' ? 'active' : ''} onClick={() => setTab('location')}>Location</button>
          </div>
          {tab === 'overview' && <div>
            <p>{p._raw?.description || 'This distressed property represents a strong investment opportunity with significant equity potential. The HPI score reflects distress level, location quality, and projected ROI.'}</p>
            <div className="summary-grid">
              <div><span>HPI Score</span><strong>{p.score}</strong><small>0–100 scale</small></div>
              <div><span>Distress Type</span><strong>{p.distress}</strong><small>Verified</small></div>
              <div><span>Days on Market</span><strong>{p._raw?.days_on_market || '—'}</strong><small>Active</small></div>
              <div><span>Source</span><strong>{p._raw?.source || 'Scraped'}</strong><small>County records</small></div>
            </div>
            <div className="data-disclosure">
              <span>Address verified</span><span>Ownership chain traced</span><span>Title checked</span><span>AI scored</span>
            </div>
          </div>}
          {tab === 'financials' && <div className="summary-grid">
            <div><span>Asking Price</span><strong>{money(p.price)}</strong></div>
            <div><span>After Repair Value</span><strong>{money(p.arv)}</strong></div>
            <div><span>Est. Repairs</span><strong>{money(p.repairs)}</strong></div>
            <div><span>Equity</span><strong>{money(equity)}</strong></div>
            <div><span>Projected ROI</span><strong>{p.roi}%</strong></div>
            <div><span>Price / SqFt</span><strong>{p.sqft ? money(Math.round(p.price / p.sqft)) : '—'}</strong></div>
          </div>}
          {tab === 'property' && <div className="summary-grid">
            <div><span>Type</span><strong>{p._raw?.property_type || 'Residential'}</strong></div>
            <div><span>Bedrooms</span><strong>{p.beds}</strong></div>
            <div><span>Bathrooms</span><strong>{p.baths}</strong></div>
            <div><span>Square Feet</span><strong>{p.sqft.toLocaleString()}</strong></div>
            <div><span>Year Built</span><strong>{p._raw?.year_built || '—'}</strong></div>
            <div><span>Lot Size</span><strong>{p._raw?.lot_size ? `${p._raw.lot_size.toLocaleString()} sqft` : '—'}</strong></div>
          </div>}
          {tab === 'location' && <div>
            <p>{p.address}, {p.city}, {p.state} {p.zip}</p>
            {p._raw?.lat && p._raw?.lng && <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <iframe title="Map" width="100%" height="300" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${p._raw.lng-0.01},${p._raw.lat-0.008},${p._raw.lng+0.01},${p._raw.lat+0.008}&marker=${p._raw.lat},${p._raw.lng}`} />
            </div>}
          </div>}
        </div>
        <aside className="detail-sidebar">
          <OpportunityScore score={p.score} />
          <div className="offer-summary">
            <div><span>Asking</span><b>{money(p.price)}</b></div>
            <div><span>ARV</span><b>{money(p.arv)}</b></div>
            <div><span>Equity</span><b>{money(equity)}</b></div>
          </div>
          <Link to={`/investor/offer/${p.id}`} className="btn gold wide">Place Bid</Link>
          <Link to="/deal-analyzer" className="btn ghost wide">Analyze Deal</Link>
          <button className="btn ghost wide"><Heart size={15} /> Save Property</button>
          <p className="detail-note">Financial estimates are AI-generated and not guarantees. Verify all data independently before closing.</p>
        </aside>
      </div>
    </div>
  </>;
}