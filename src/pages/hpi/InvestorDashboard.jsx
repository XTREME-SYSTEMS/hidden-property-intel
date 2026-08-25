import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileSignature, Search, TrendingUp } from 'lucide-react';
import AppShell from '@/components/hpi/AppShell';
import { MetricCard, PropertyCard } from '@/components/hpi/UI';
import { backend } from '@/api/hpiBackend';

export default function InvestorDashboard() {
  const [offers, setOffers] = useState([]);
  const [saved, setSaved] = useState([]);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([backend.listOffers(), backend.listSaved(), backend.listProperties()]).then(([o, s, r]) => {
      setOffers(o); setSaved(s); setRecs(r.slice(0, 4)); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const activeBids = offers.filter(o => o.status === 'active').length;
  const won = offers.filter(o => o.status === 'accepted').length;
  const totalBid = offers.reduce((s, o) => s + (o.bid_amount || 0), 0);

  return <AppShell>
    <div className="dashboard-head">
      <div>
        <span className="eyebrow" style={{ color: 'var(--gold-2)' }}>Investor Dashboard</span>
        <h1>Welcome back.</h1>
        <p>Track your bids, saved properties, and deal pipeline.</p>
      </div>
      <Link to="/marketplace" className="btn gold">Browse Marketplace <ArrowRight size={15} /></Link>
    </div>
    <div className="metrics-grid">
      <MetricCard label="Active Bids" value={activeBids} icon={FileSignature} />
      <MetricCard label="Deals Won" value={won} icon={TrendingUp} />
      <MetricCard label="Total Bid Volume" value={`$${(totalBid/1000000).toFixed(1)}M`} icon={Search} />
      <MetricCard label="Saved Properties" value={saved.length} icon={FileSignature} />
    </div>
    <div className="dashboard-cols">
      <div className="dashboard-panel">
        <div className="panel-head"><h2>Recommended Opportunities</h2><Link to="/marketplace">View all</Link></div>
        {loading && <p className="route-loader">Loading…</p>}
        {!loading && <div className="property-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {recs.map(p => <PropertyCard key={p.id} p={p} onSave={() => {}} />)}
        </div>}
      </div>
      <div className="dashboard-panel">
        <div className="panel-head"><h2>Recent Activity</h2></div>
        {offers.length === 0 && <p style={{ color: '#888', fontSize: 12 }}>No bids placed yet. Browse the marketplace to find your first deal.</p>}
        {offers.slice(0, 5).map(o => <div key={o.id} className="activity-line">
          <div className="dot unread" />
          <div><b>Bid placed: ${(o.bid_amount || 0).toLocaleString()}</b><p>Status: {o.status}</p></div>
          <small>{new Date(o.created_date).toLocaleDateString()}</small>
        </div>)}
      </div>
    </div>
  </AppShell>;
}