import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import DistressBadge, { labelFor } from "@/components/DistressBadge";
import ScoreGauge from "@/components/ScoreGauge";
import OwnershipTimeline from "@/components/OwnershipTimeline";
import ROICalculator from "@/components/ROICalculator";
import ExitStrategyModel from "@/components/ExitStrategyModel";
import PropertyBrief from "@/components/PropertyBrief";
import DistressStack from "@/components/DistressStack";
import WatchButton from "@/components/WatchButton";
import PropertyAITools from "@/components/ai/PropertyAITools";
import DealRiskPanel from "@/components/ai/DealRiskPanel";
import { money, num, pct } from "@/lib/format";
import Seo from "@/components/Seo";
import { Lock, MapPin, Phone, Mail, ArrowLeft, ShieldAlert } from "lucide-react";

function Card({ title, children, className = "" }) {
  return (
    <section className={`rounded-3xl bg-white p-6 ring-1 ring-[#E5EDEA] sm:p-8 ${className}`}>
      {title && <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>}
      <div className={title ? "mt-6" : ""}>{children}</div>
    </section>
  );
}

function Factor({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-[#6B7B72]">{labelFor(label)}</span>
        <span className="tabular-nums text-[#1A2B22]">{Math.round(value || 0)}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E5EDEA]">
        <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${Math.min(100, value || 0)}%` }} />
      </div>
    </div>
  );
}

export default function PropertyDetail() {
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
  const [skipTracing, setSkipTracing] = useState(null);

  useEffect(() => {
    let alive = true;
    setProperty(null);
    (async () => {
      const [p, u] = await Promise.all([
        base44.entities.Property.get(id),
        base44.auth.me().catch(() => null)
      ]);
      if (!alive) return;
      setProperty(p); setUser(u);
      const isAdmin = u?.role === 'admin';
      let isPro = isAdmin;
      if (u && !isAdmin) {
        const inv = await base44.entities.Investor.filter({ user_id: u.id }).catch(() => []);
        const plan = inv[0]?.subscription_plan;
        const status = inv[0]?.subscription_status;
        isPro = (plan === 'pro' || plan === 'elite') && status === 'active';
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
      setScore(sc[0] || null); setChain(ch[0] || null); setOwners(ow); setBids(bd); setTitleRisk(tr[0] || null);
    })();
    return () => { alive = false; };
  }, [id]);

  const handleSkipTrace = async (ownerId) => {
    setSkipTracing(ownerId);
    try {
      await base44.functions.invoke("skipTraceOwner", { owner_id: ownerId, property_id: id });
      const ow = await base44.entities.Owner.filter({ property_id: id });
      setOwners(ow);
    } catch (e) { console.error("skip trace failed", e); }
    setSkipTracing(null);
  };

  if (property === null) {
    return <div className="mx-auto max-w-7xl px-6 py-24 text-sm text-[#6B7B72]">Loading property…</div>;
  }
  if (!property?.id) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24">
        <p className="font-display text-2xl">Property not found</p>
        <Link to="/listings" className="mt-4 inline-block text-sm text-emerald-700">← Back to search</Link>
      </div>
    );
  }

  const images = property.images || [];
  const stats = [
    ["Estimated value", money(property.estimated_value)],
    ["Asking price", money(property.proposed_asking_price)],
    ["Estimated ROI", pct(score?.estimated_roi)],
    ["Repair estimate", money(score?.repair_cost_estimate)],
    ["After-repair value", money(score?.after_repair_value)],
    ["Days on market", num(property.days_on_market)],
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Seo
        title={`${property.city}, ${property.state} — ${labelFor(property.distress_type)} Property`}
        description={`${labelFor(property.distress_type)} property in ${property.city}, ${property.state} ${property.zip_code}. ${property.bedrooms || 0} bed, ${property.bathrooms || 0} bath, ${num(property.square_footage)} sqft. AI investment score ${Math.round(property.property_score || 0)}/100. Estimated value ${money(property.estimated_value)}.`}
        keywords={`${property.distress_type} property ${property.city} ${property.state}, off-market ${property.city} ${property.state}, distressed property ${property.zip_code}, ${property.property_type} ${property.city}, ${property.distress_type} ${property.state}, real estate investment ${property.city}, cash offer ${property.city} ${property.state}, ${property.zip_code} real estate, ${property.distress_type} homes ${property.state}, investment property ${property.city}, ${labelFor(property.distress_type).toLowerCase()} ${property.city}`}
        path={`/properties/${property.id}`}
        image={images[0]?.url}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": ["Product", "Place"],
            "name": unlocked ? property.address : `${property.city}, ${property.state} ${property.zip_code}`,
            "description": property.description || `${labelFor(property.distress_type)} property in ${property.city}, ${property.state}. AI-scored ${Math.round(property.property_score || 0)}/100 for investment quality with estimated value of ${money(property.estimated_value)}.`,
            "url": `https://hiddenpropertyintel.com/properties/${property.id}`,
            "image": images.map((im) => im.url).filter(Boolean),
            "sku": property.id,
            "category": labelFor(property.distress_type),
            "offers": {
              "@type": "Offer",
              "price": String(property.proposed_asking_price || property.estimated_value || 0),
              "priceCurrency": "USD",
              "availability": property.status === "active" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "url": `https://hiddenpropertyintel.com/properties/${property.id}/bid`
            },
            "address": {
              "@type": "PostalAddress",
              "streetAddress": unlocked ? property.address || "" : "",
              "addressLocality": property.city,
              "addressRegion": property.state,
              "postalCode": property.zip_code,
              "addressCountry": "US"
            },
            ...(property.square_footage ? { "floorSize": { "@type": "QuantitativeValue", "value": property.square_footage, "unitCode": "FTK" } } : {}),
            ...(property.bedrooms ? { "numberOfRooms": property.bedrooms } : {})
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://hiddenpropertyintel.com/" },
              { "@type": "ListItem", "position": 2, "name": "Distressed Property Listings", "item": "https://hiddenpropertyintel.com/listings" },
              { "@type": "ListItem", "position": 3, "name": `${property.city}, ${property.state}`, "item": `https://hiddenpropertyintel.com/properties/${property.id}` }
            ]
          }
        ]}
      />
      <Link to="/listings" className="inline-flex items-center gap-1.5 text-sm text-[#6B7B72] hover:text-[#1A2B22]">
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Link>

      <div className="mt-6 grid gap-3 sm:grid-cols-[2fr_1fr]">
        <div className="aspect-[16/10] overflow-hidden rounded-3xl bg-[#E5EDEA]">
          {images[active]?.url && <Image src={images[active].url} alt={property.address} className="h-full w-full object-cover" />}
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-1">
          {images.slice(0, 3).map((im, i) => (
            <button
              key={i} onClick={() => setActive(i)}
              className={`aspect-[16/10] overflow-hidden rounded-2xl ring-2 transition-all ${i === active ? "ring-emerald-500" : "ring-transparent hover:ring-[#E5EDEA]"}`}
            >
              <Image src={im.url} alt={im.caption || ""} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <DistressBadge type={property.distress_type} />
            <span className="rounded-full bg-[#E5EDEA] px-2.5 py-1 text-[11px]">{labelFor(property.property_type)}</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">{unlocked ? property.address : `${property.city}, ${property.state} ${property.zip_code}`}</h1>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#6B7B72]">
            <MapPin className="h-4 w-4" />{unlocked ? `${property.city}, ${property.state} ${property.zip_code}` : "Full address revealed with a Pro subscription"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ScoreGauge score={property.property_score || 0} size={72} label="AI score" />
          <Link to={`/properties/${id}/bid`} className="rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-medium text-white hover:bg-emerald-600">
            Place a bid
          </Link>
          <WatchButton propertyId={property.id} />
          <PropertyBrief property={property} score={score} owners={owners} chain={chain} bids={bids} titleRisk={titleRisk} />
          <Link to={`/investor/pipeline?propertyId=${property.id}`} className="rounded-full bg-[#0F2A1D] px-5 py-2.5 text-sm text-white hover:bg-[#1A2B22]">
            Add to pipeline
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-white p-4 ring-1 ring-[#E5EDEA]">
            <p className="text-[10px] uppercase tracking-widest text-[#6B7B72]">{l}</p>
            <p className="mt-1.5 text-lg font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title="About this property">
            <p className="leading-relaxed text-[#6B7B72]">{property.description || "No description provided."}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[#E5EDEA] pt-6 sm:grid-cols-3">
              {[["Bedrooms", num(property.bedrooms)], ["Bathrooms", num(property.bathrooms)], ["Square feet", num(property.square_footage)], ["Lot size", `${num(property.lot_size)} sqft`], ["Year built", property.year_built || "—"], ["Source", labelFor(property.source)]].map(([l, v]) => (
                <div key={l}>
                  <dt className="text-[10px] uppercase tracking-widest text-[#6B7B72]">{l}</dt>
                  <dd className="mt-1 tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card title="AI score breakdown">
            <div className="flex flex-wrap items-center gap-8">
              <ScoreGauge score={score?.overall_score || property.property_score || 0} size={96} label="Overall" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#6B7B72]">Distress severity</p>
                <p className="mt-1 text-lg font-semibold capitalize">{score?.distress_severity || "—"}</p>
              </div>
              <div className="min-w-[220px] flex-1 space-y-3">
                {Object.entries(score?.score_factors || {}).map(([k, v]) => <Factor key={k} label={k} value={v} />)}
              </div>
            </div>
            {score?.ai_analysis && <p className="mt-7 border-t border-[#E5EDEA] pt-6 leading-relaxed text-[#6B7B72]">{score.ai_analysis}</p>}
          </Card>

          <Card title="Stacked distress indicators">
            <DistressStack property={property} titleRisk={titleRisk} chain={chain} score={score} />
          </Card>

          <Card title="Ownership chain">
            {!unlocked ? (
              <div className="rounded-2xl bg-[#F8FAF9] p-8 text-center ring-1 ring-[#E5EDEA]">
                <Lock className="mx-auto h-5 w-5 text-[#6B7B72]" />
                <p className="mt-3 font-medium">Ownership chain and owner contacts are Pro features</p>
                <p className="mt-1 text-sm text-[#6B7B72]">
                  {owners.length} owner record{owners.length === 1 ? "" : "s"} and {chain?.transfers?.length || 0} recorded transfers available.
                </p>
                <Link to="/investor/signup" className="mt-5 inline-flex rounded-full bg-[#0F2A1D] px-5 py-2.5 text-sm text-white hover:bg-[#1A2B22]">
                  Upgrade to Pro
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid gap-3 sm:grid-cols-2">
                  {owners.map((o) => (
                    <div key={o.id} className="rounded-2xl bg-[#F8FAF9] p-4 ring-1 ring-[#E5EDEA]">
                      <p className="text-[10px] uppercase tracking-widest text-emerald-700">{labelFor(o.owner_type)}</p>
                      <p className="mt-1 font-medium">{o.name}</p>
                      <p className="text-xs text-[#6B7B72]">{o.relationship_to_property}</p>
                      <div className="mt-2 space-y-1 text-xs text-[#1A2B22]">
                        {o.contact_phone && <p className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" />{o.contact_phone}</p>}
                        {o.contact_email && <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{o.contact_email}</p>}
                      </div>
                      {o.source && <p className="mt-2 text-[11px] text-[#6B7B72]">Source: {o.source}</p>}
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleSkipTrace(o.id)}
                          disabled={skipTracing === o.id}
                          className="mt-2 rounded-full bg-[#0F2A1D] px-3 py-1.5 text-[10px] uppercase tracking-widest text-white hover:bg-[#1A2B22] disabled:opacity-50"
                        >
                          {skipTracing === o.id ? "Tracing…" : "Skip Trace"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <OwnershipTimeline transfers={chain?.transfers || []} />
              </div>
            )}
          </Card>

          <Card title="Comparable sales">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-[#6B7B72]">
                    <th className="pb-3">Address</th><th className="pb-3">Sale price</th><th className="pb-3">Date</th><th className="pb-3">Sqft</th><th className="pb-3">$/sqft</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EDEA]">
                  {(score?.comparable_sales || []).map((c, i) => (
                    <tr key={i} className="tabular-nums">
                      <td className="py-3">{c.address}</td>
                      <td className="py-3">{money(c.sale_price)}</td>
                      <td className="py-3 text-[#6B7B72]">{c.sale_date}</td>
                      <td className="py-3">{num(c.sqft)}</td>
                      <td className="py-3">{money(Math.round((c.sale_price || 0) / (c.sqft || 1)))}</td>
                    </tr>
                  ))}
                  {!score?.comparable_sales?.length && <tr><td colSpan={5} className="py-4 text-[#6B7B72]">No comparable sales on file.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Run the numbers">
            <ROICalculator
              defaultPrice={property.proposed_asking_price || 250000}
              defaultRepairs={score?.repair_cost_estimate || 40000}
              defaultArv={score?.after_repair_value || property.estimated_value || 380000}
            />
          </Card>

          <Card title="Exit-strategy model">
            <ExitStrategyModel
              defaultPrice={property.proposed_asking_price || 250000}
              defaultRepairs={score?.repair_cost_estimate || 40000}
              defaultArv={score?.after_repair_value || property.estimated_value || 380000}
            />
          </Card>

          <PropertyAITools property={property} isAdmin={user?.role === 'admin'} />

          <DealRiskPanel propertyId={property.id} />

          <Card title="Title & lien risk">
            {titleRisk ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                    titleRisk.risk_level === "critical" ? "bg-red-100 text-red-700" :
                    titleRisk.risk_level === "high" ? "bg-orange-100 text-orange-700" :
                    titleRisk.risk_level === "medium" ? "bg-amber-100 text-amber-700" :
                    "bg-emerald-100 text-emerald-700"
                  }`}>{titleRisk.risk_level || "unknown"} risk</span>
                  <span className="text-sm text-[#6B7B72]">Liens {money(titleRisk.lien_total)} · Mortgage {money(titleRisk.mortgage_balance)}</span>
                </div>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p>Judgments: <span className="font-medium">{titleRisk.has_judgments ? "Yes" : "No"}</span></p>
                  <p>Tax delinquent: <span className="font-medium">{titleRisk.tax_delinquent ? "Yes" : "No"}</span></p>
                  <p>HOA delinquent: <span className="font-medium">{titleRisk.hoa_delinquent ? "Yes" : "No"}</span></p>
                  <p>Code liens: <span className="font-medium">{titleRisk.code_liens?.length || 0}</span></p>
                </div>
                {titleRisk.ai_analysis && <p className="border-t border-[#E5EDEA] pt-4 leading-relaxed text-[#6B7B72]">{titleRisk.ai_analysis}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-[#F8FAF9] p-6 ring-1 ring-[#E5EDEA]">
                <ShieldAlert className="h-5 w-5 text-[#6B7B72]" />
                <p className="text-sm text-[#6B7B72]">No title-risk assessment yet — generated automatically during nightly scoring.</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Bid history">
            <ul className="space-y-3">
              {bids.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-xl bg-[#F8FAF9] px-4 py-3 text-sm ring-1 ring-[#E5EDEA]">
                  <div>
                    <p className="font-medium tabular-nums">{money(b.bid_amount)}</p>
                    <p className="text-xs text-[#6B7B72]">{(b.investor_name || "Investor").split(" ")[0]} · {b.status}</p>
                  </div>
                  {b.is_proxy_bid && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] ring-1 ring-[#E5EDEA]">Proxy</span>}
                </li>
              ))}
              {!bids.length && <li className="text-sm text-[#6B7B72]">No bids yet — be the first.</li>}
            </ul>
          </Card>

          <Card>
            <p className="text-[10px] uppercase tracking-widest text-[#6B7B72]">Location</p>
            <div className="mt-3 aspect-square overflow-hidden rounded-2xl bg-[#E5EDEA]">
              <iframe
                title="Property location"
                className="h-full w-full border-0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${(property.lng || -118.4) - 0.01}%2C${(property.lat || 34) - 0.01}%2C${(property.lng || -118.4) + 0.01}%2C${(property.lat || 34) + 0.01}&layer=mapnik&marker=${property.lat || 34}%2C${property.lng || -118.4}`}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}