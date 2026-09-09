import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import DistressBadge, { labelFor } from "@/components/DistressBadge";
import ScoreGauge from "@/components/ScoreGauge";
import OwnershipTimeline from "@/components/OwnershipTimeline";
import ROICalculator from "@/components/ROICalculator";
import ExitStrategyModel from "@/components/ExitStrategyModel";
import WatchButton from "@/components/WatchButton";
import { money, num, pct } from "@/lib/format";
import Seo from "@/components/Seo";
import { ArrowLeft, MapPin, Bed, Bath, Maximize, Lock, Phone, Mail, ShieldAlert, Check } from "lucide-react";

export default function V2PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [score, setScore] = useState(null);
  const [chain, setChain] = useState(null);
  const [owners, setOwners] = useState([]);
  const [bids, setBids] = useState([]);
  const [titleRisk, setTitleRisk] = useState(null);
  const [active, setActive] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let alive = true;
    setProperty(null);
    (async () => {
      const [p, u] = await Promise.all([
        base44.entities.Property.get(id),
        base44.auth.me().catch(() => null),
      ]);
      if (!alive) return;
      setProperty(p);
      setUser(u);
      const isAdmin = u?.role === "admin";
      let isPro = isAdmin;
      if (u && !isAdmin) {
        const inv = await base44.entities.Investor.filter({ user_id: u.id }).catch(() => []);
        const plan = inv[0]?.subscription_plan;
        const status = inv[0]?.subscription_status;
        isPro = (plan === "pro" || plan === "elite") && status === "active";
      }
      setUnlocked(isPro);
      const [sc, ch, ow, bd, tr] = await Promise.all([
        base44.entities.PropertyScore.filter({ property_id: id }),
        base44.entities.OwnershipChain.filter({ property_id: id }),
        isPro ? base44.entities.Owner.filter({ property_id: id }) : Promise.resolve([]),
        base44.entities.Bid.filter({ property_id: id }, "-bid_amount", 20),
        base44.entities.TitleRisk.filter({ property_id: id }),
      ]);
      if (!alive) return;
      setScore(sc[0] || null);
      setChain(ch[0] || null);
      setOwners(ow);
      setBids(bd);
      setTitleRisk(tr[0] || null);
    })();
    return () => { alive = false; };
  }, [id]);

  if (property === null) {
    return <div className="z-detail"><div className="v2-loading"><div className="v2-spinner" /> Loading property…</div></div>;
  }
  if (!property?.id) {
    return (
      <div className="z-detail z-empty">
        <h3>Property not found</h3>
        <Link to="/v2/listings" className="z-detail-back"><ArrowLeft size={16} /> Back to listings</Link>
      </div>
    );
  }

  const images = property.images || [];
  const price = property.proposed_asking_price || property.estimated_value;
  const comps = score?.comparable_sales || [];

  return (
    <div className="z-detail">
      <Seo
        title={`${property.city}, ${property.state} — ${labelFor(property.distress_type)} Property`}
        description={`${labelFor(property.distress_type)} property in ${property.city}, ${property.state}. AI score ${Math.round(property.property_score || 0)}/100.`}
        path={`/v2/properties/${property.id}`}
        image={images[0]?.url}
      />

      <Link to="/v2/listings" className="z-detail-back"><ArrowLeft size={16} /> Back to listings</Link>

      {/* Gallery */}
      <div className="z-detail-gallery">
        <div className="z-detail-main-img">
          {images[active]?.url ? (
            <Image src={images[active].url} alt={property.address} fittingType="fill" className="h-full w-full" />
          ) : (
            <img src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80" alt="Property" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="z-detail-thumbs">
          {(images.length > 1 ? images : images.concat([{ url: "https://images.unsplash.com/photo-1570129477496-7c5e17e0f9b5?w=400&q=80" }])).slice(0, 2).map((im, i) => (
            <button key={i} className={`z-detail-thumb ${i === active ? "active" : ""}`} onClick={() => setActive(i)}>
              <img src={im.url} alt={im.caption || ""} />
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="z-detail-head">
        <div>
          <div className="z-detail-badges">
            <DistressBadge type={property.distress_type} />
            <span className="z-detail-badge">{labelFor(property.property_type)}</span>
            <span className="z-detail-badge">{property.status}</span>
          </div>
          <h1>{unlocked ? property.address : `${property.city}, ${property.state} ${property.zip_code}`}</h1>
          <p className="z-detail-addr"><MapPin size={15} /> {unlocked ? `${property.city}, ${property.state} ${property.zip_code}` : "Full address revealed with Pro"}</p>
        </div>
        <div className="z-detail-head-right">
          <div className="z-detail-price">{money(price)}</div>
          <div className="z-detail-cta-inline">
            <Link to={`/properties/${id}/bid`} className="v2-btn v2-btn-primary v2-btn-sm">Place a bid</Link>
            <WatchButton propertyId={property.id} />
          </div>
        </div>
      </div>

      {/* Facts strip */}
      <div className="z-detail-facts">
        <div className="z-detail-fact"><b>{num(property.bedrooms) || "—"}</b><span>Beds</span></div>
        <div className="z-detail-fact"><b>{num(property.bathrooms) || "—"}</b><span>Baths</span></div>
        <div className="z-detail-fact"><b>{property.square_footage ? Number(property.square_footage).toLocaleString() : "—"}</b><span>Sq ft</span></div>
        <div className="z-detail-fact"><b>{property.year_built || "—"}</b><span>Year built</span></div>
        <div className="z-detail-fact"><b>{property.days_on_market != null ? property.days_on_market : "—"}</b><span>Days on market</span></div>
        <div className="z-detail-fact"><b>{Math.round(property.property_score || 0)}</b><span>AI score</span></div>
      </div>

      <div className="z-detail-layout">
        {/* Main column */}
        <div className="z-detail-main">
          <section className="z-detail-section">
            <h2>About this property</h2>
            <p>{property.description || `${labelFor(property.distress_type)} property in ${property.city}, ${property.state}. AI-scored ${Math.round(property.property_score || 0)}/100 for investment quality.`}</p>
            <dl className="z-detail-dl">
              {[["Bedrooms", num(property.bedrooms)], ["Bathrooms", num(property.bathrooms)], ["Square feet", property.square_footage ? Number(property.square_footage).toLocaleString() : "—"], ["Lot size", property.lot_size ? `${num(property.lot_size)} sqft` : "—"], ["Year built", property.year_built || "—"], ["Source", labelFor(property.source)]].map(([l, v]) => (
                <div key={l}><dt>{l}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </section>

          <section className="z-detail-section">
            <h2>AI investment score</h2>
            <div className="z-score-row">
              <ScoreGauge score={score?.overall_score || property.property_score || 0} size={96} label="Overall" />
              <div className="z-score-meta">
                <div><span>Distress severity</span><b className="capitalize">{score?.distress_severity || "—"}</b></div>
                <div><span>Est. ROI</span><b>{pct(score?.estimated_roi)}</b></div>
                <div><span>Repair estimate</span><b>{money(score?.repair_cost_estimate)}</b></div>
                <div><span>After-repair value</span><b>{money(score?.after_repair_value)}</b></div>
              </div>
            </div>
            {score?.score_factors && (
              <div className="z-score-factors">
                {Object.entries(score.score_factors).map(([k, v]) => (
                  <div key={k} className="z-factor">
                    <div className="z-factor-head"><span>{labelFor(k)}</span><b>{Math.round(v || 0)}</b></div>
                    <div className="z-factor-bar"><div style={{ width: `${Math.min(100, v || 0)}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
            {score?.ai_analysis && <p className="z-detail-note">{score.ai_analysis}</p>}
          </section>

          <section className="z-detail-section">
            <h2>Ownership chain</h2>
            {!unlocked ? (
              <div className="z-detail-locked">
                <Lock size={22} />
                <p>Ownership chain and owner contacts are a Pro feature.</p>
                <p>{owners.length} owner record(s) and {chain?.transfers?.length || 0} recorded transfers available.</p>
                <Link to="/investor/signup" className="v2-btn v2-btn-primary v2-btn-sm" style={{ marginTop: 12 }}>Upgrade to Pro</Link>
              </div>
            ) : (
              <div>
                <div className="z-owners-grid">
                  {owners.map((o) => (
                    <div key={o.id} className="z-owner-card">
                      <span className="z-owner-type">{labelFor(o.owner_type)}</span>
                      <b>{o.name}</b>
                      <span className="z-owner-rel">{o.relationship_to_property}</span>
                      {o.contact_phone && <p><Phone size={12} /> {o.contact_phone}</p>}
                      {o.contact_email && <p><Mail size={12} /> {o.contact_email}</p>}
                      {o.source && <small>Source: {o.source}</small>}
                    </div>
                  ))}
                  {!owners.length && <p className="z-detail-note">No owner records on file.</p>}
                </div>
                {chain?.transfers?.length > 0 && <OwnershipTimeline transfers={chain.transfers} />}
              </div>
            )}
          </section>

          <section className="z-detail-section">
            <h2>Comparable sales</h2>
            {comps.length ? (
              <table className="z-detail-table">
                <thead><tr><th>Address</th><th>Sale price</th><th>Date</th><th>Sqft</th><th>$/sqft</th></tr></thead>
                <tbody>
                  {comps.map((c, i) => (
                    <tr key={i}>
                      <td>{c.address}</td>
                      <td>{money(c.sale_price)}</td>
                      <td>{c.sale_date}</td>
                      <td>{num(c.sqft)}</td>
                      <td>{money(Math.round((c.sale_price || 0) / (c.sqft || 1)))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="z-detail-note">No comparable sales on file.</p>}
          </section>

          <section className="z-detail-section">
            <h2>Title & lien risk</h2>
            {titleRisk ? (
              <div>
                <div className="z-risk-row">
                  <span className={`z-risk-pill ${titleRisk.risk_level || "low"}`}>{titleRisk.risk_level || "unknown"} risk</span>
                  <span className="z-risk-amounts">Liens {money(titleRisk.lien_total)} · Mortgage {money(titleRisk.mortgage_balance)}</span>
                </div>
                <div className="z-risk-grid">
                  <p>Judgments: <b>{titleRisk.has_judgments ? "Yes" : "No"}</b></p>
                  <p>Tax delinquent: <b>{titleRisk.tax_delinquent ? "Yes" : "No"}</b></p>
                  <p>HOA delinquent: <b>{titleRisk.hoa_delinquent ? "Yes" : "No"}</b></p>
                  <p>Code liens: <b>{titleRisk.code_liens?.length || 0}</b></p>
                </div>
                {titleRisk.ai_analysis && <p className="z-detail-note">{titleRisk.ai_analysis}</p>}
              </div>
            ) : (
              <div className="z-detail-locked"><ShieldAlert size={20} /><p>No title-risk assessment yet — generated during nightly scoring.</p></div>
            )}
          </section>

          <section className="z-detail-section">
            <h2>Run the numbers</h2>
            <ROICalculator
              defaultPrice={property.proposed_asking_price || 250000}
              defaultRepairs={score?.repair_cost_estimate || 40000}
              defaultArv={score?.after_repair_value || property.estimated_value || 380000}
            />
          </section>

          <section className="z-detail-section">
            <h2>Exit-strategy model</h2>
            <ExitStrategyModel
              defaultPrice={property.proposed_asking_price || 250000}
              defaultRepairs={score?.repair_cost_estimate || 40000}
              defaultArv={score?.after_repair_value || property.estimated_value || 380000}
            />
          </section>
        </div>

        {/* Sidebar */}
        <aside className="z-detail-sidebar">
          <div className="z-detail-cta">
            <div className="z-cta-label">Asking price</div>
            <div className="z-cta-price">{money(price)}</div>
            <div className="z-cta-score">
              <ScoreGauge score={property.property_score || 0} size={56} label="" />
              <div><span>AI investment score</span><b>{Math.round(property.property_score || 0)}/100</b></div>
            </div>
            <Link to={`/properties/${id}/bid`} className="v2-btn v2-btn-primary">Place a bid</Link>
            <div className="z-btn-row">
              <WatchButton propertyId={property.id} />
              <Link to={`/investor/pipeline?propertyId=${property.id}`} className="v2-btn v2-btn-ghost v2-btn-sm">Add to pipeline</Link>
            </div>
          </div>

          <div className="z-detail-section">
            <h2>Bid history</h2>
            {bids.length ? (
              <ul className="z-bid-list">
                {bids.map((b) => (
                  <li key={b.id}>
                    <div><b>{money(b.bid_amount)}</b><span>{(b.investor_name || "Investor").split(" ")[0]} · {b.status}</span></div>
                    {b.is_proxy_bid && <em>Proxy</em>}
                  </li>
                ))}
              </ul>
            ) : <p className="z-detail-note">No bids yet — be the first.</p>}
          </div>

          <div className="z-detail-map">
            <iframe
              title="Property location"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${(property.lng || -82) - 0.01}%2C${(property.lat || 27) - 0.01}%2C${(property.lng || -82) + 0.01}%2C${(property.lat || 27) + 0.01}&layer=mapnik&marker=${property.lat || 27}%2C${property.lng || -82}`}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}