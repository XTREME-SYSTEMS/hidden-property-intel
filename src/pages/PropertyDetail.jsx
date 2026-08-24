import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import DistressBadge, { labelFor } from "@/components/DistressBadge";
import ScoreGauge from "@/components/ScoreGauge";
import OwnershipTimeline from "@/components/OwnershipTimeline";
import ROICalculator from "@/components/ROICalculator";
import { money, num, pct } from "@/lib/format";
import { Lock, MapPin, Phone, Mail, ArrowLeft } from "lucide-react";

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
  const [active, setActive] = useState(0);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    let alive = true;
    setProperty(null);
    (async () => {
      const p = await base44.entities.Property.get(id);
      if (!alive) return;
      setProperty(p);
      const [sc, ch, ow, bd] = await Promise.all([
        base44.entities.PropertyScore.filter({ property_id: id }),
        base44.entities.OwnershipChain.filter({ property_id: id }),
        base44.entities.Owner.filter({ property_id: id }),
        base44.entities.Bid.filter({ property_id: id }, "-bid_amount", 20),
      ]);
      if (!alive) return;
      setScore(sc[0] || null); setChain(ch[0] || null); setOwners(ow); setBids(bd);
    })();
    return () => { alive = false; };
  }, [id]);

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
        <div className="flex items-center gap-5">
          <ScoreGauge score={property.property_score || 0} size={72} label="AI score" />
          <Link to="/listings" className="rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-medium text-white hover:bg-emerald-600">
            Place a bid
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

          <Card title="Ownership chain">
            {!unlocked ? (
              <div className="rounded-2xl bg-[#F8FAF9] p-8 text-center ring-1 ring-[#E5EDEA]">
                <Lock className="mx-auto h-5 w-5 text-[#6B7B72]" />
                <p className="mt-3 font-medium">Ownership chain and owner contacts are Pro features</p>
                <p className="mt-1 text-sm text-[#6B7B72]">
                  {owners.length} owner record{owners.length === 1 ? "" : "s"} and {chain?.transfers?.length || 0} recorded transfers available.
                </p>
                <button onClick={() => setUnlocked(true)} className="mt-5 rounded-full bg-[#0F2A1D] px-5 py-2.5 text-sm text-white hover:bg-[#1A2B22]">
                  Preview as Pro subscriber
                </button>
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