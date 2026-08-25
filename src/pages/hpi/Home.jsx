import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, FileSignature, MapPin, Radar, ShieldCheck, Users } from 'lucide-react';
import { PropertyCard, TrustStrip } from '@/components/hpi/UI';
import { backend } from '@/api/hpiBackend';

export default function Home() {
  const [props, setProps] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { backend.listProperties().then(p => { setProps(p.slice(0, 8)); setLoading(false); }).catch(() => setLoading(false)); }, []);

  return <>
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">Hidden Property Intel</span>
        <h1>Find what <em>others miss</em>.</h1>
        <p>Off-market, distressed, and inherited properties — AI-scored and ready to close before they ever reach the MLS. Built for serious investors and motivated sellers.</p>
        <div className="button-row">
          <Link to="/marketplace" className="btn gold">Browse Marketplace <ArrowRight size={16} /></Link>
          <Link to="/sellers" className="btn ghost">List a Property — Free</Link>
        </div>
        <div className="hero-proof">
          <span><ShieldCheck size={16} /> 12,800+ properties tracked</span>
          <span><ShieldCheck size={16} /> 1,200+ verified investors</span>
          <span><ShieldCheck size={16} /> 27 states covered</span>
        </div>
      </div>
      <div className="hero-visual">
        <img src="https://images.unsplash.com/photo-1564013799929-abd0e2e2f5a8?w=900" alt="Distressed property" />
        <div className="hero-float">
          <span>Avg. HPI Score</span>
          <strong>84</strong>
          <small>High opportunity</small>
        </div>
      </div>
    </section>

    <section className="stats-strip">
      <div><b>12,847</b><span>Active Properties</span></div>
      <div><b>1,200+</b><span>Verified Investors</span></div>
      <div><b>1,400+</b><span>Deals Closed</span></div>
      <div><b>$340M</b><span>Total Value</span></div>
    </section>

    <section className="content-section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Featured Opportunities</span>
          <h2>Fresh distressed deals.</h2>
          <p>AI-scored properties scraped daily from county records — pre-foreclosures, probate, tax-delinquent, and more.</p>
        </div>
        <Link to="/marketplace" className="text-link">All properties <ArrowRight size={15} /></Link>
      </div>
      <div className="property-grid">
        {loading && <p className="route-loader">Loading inventory…</p>}
        {!loading && props.map(p => <PropertyCard key={p.id} p={p} onSave={() => {}} />)}
        {!loading && !props.length && <p className="route-loader">No properties found.</p>}
      </div>
    </section>

    <section className="content-section">
      <div className="feature-band dark-band">
        <div>
          <Radar size={26} />
          <h3>Autonomous county-record scraping</h3>
          <p>Our cloud browser scans assessor, tax, probate, foreclosure, and obituary records daily to surface inherited and under-stress properties before anyone else.</p>
        </div>
        <div>
          <Users size={26} />
          <h3>Full ownership chain + heirs</h3>
          <p>We trace current owners, previous owners, and potential heirs identified through probate — so you reach the right party, with context.</p>
        </div>
        <div>
          <Brain size={26} />
          <h3>AI negotiation assistant</h3>
          <p>Sellers get a coach that analyzes every offer against market data and scripts the counter — no agent required.</p>
        </div>
      </div>
    </section>

    <section className="content-section">
      <div className="two-sided">
        <div className="split-card investor-card">
          <span className="eyebrow" style={{ color: 'var(--gold-2)' }}>For Investors</span>
          <h2>An off-market pipeline, underwritten for you.</h2>
          <p>Every property carries a 0–100 HPI score, repair estimate, after-repair value, ownership chain, and comparable sales. Place bids with proxy bidding, then close with smart-contract escrow on Polygon.</p>
          <Link to="/register" className="btn gold">Start Investing <ArrowRight size={16} /></Link>
        </div>
        <div className="split-card">
          <span className="eyebrow">For Sellers</span>
          <h2>List free. Sell on your terms.</h2>
          <p>Whether you're dealing with a probate inheritance, a pre-foreclosure, or a property that's become a burden — get a fair cash offer from a verified investor, with an AI assistant in your corner. No commissions. No fees.</p>
          <Link to="/sellers" className="btn black">List Your Property <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>

    <section className="content-section">
      <TrustStrip />
    </section>
  </>;
}