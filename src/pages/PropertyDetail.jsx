import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import DistressBadge, { labelFor } from "@/components/DistressBadge";
import ScoreGauge from "@/components/ScoreGauge";
import OwnershipTimeline from "@/components/OwnershipTimeline";
import DealAnalyzer from "@/components/DealAnalyzer";
import WatchButton from "@/components/WatchButton";
import { money, num, pct } from "@/lib/format";
import { Lock, MapPin, Phone, Mail, ArrowLeft, ShieldAlert, FileText } from "lucide-react";

const TABS = ["Summary", "Financials", "Comps", "Property Info", "Documents", "History"];

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [score, setScore] = useState(null);
  const [chain, setChain] = useState(null);
  const [owners, setOwners] = useState([]);
  const [bids, setBids] = useState([]);
  const [titleRisk, setTitleRisk] = useState(null);
  const [active, setActive] = useState(0);
  const [tab, setTab] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [user, setUser] = useState(null);

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
      const isPro = u?.role === 'admin';
      setUnlocked(isAdmin || isPro);
      const [sc, ch, ow, bd, tr] = await Promise.all([
        base44.entities.PropertyScore.filter({ property_id: id }),
        base44.entities.OwnershipChain.filter({ property_id: id }),
        isAdmin ? base44.entities.Owner.filter({ property_id: id }) : Promise.resolve([]),
        base44.entities.Bid.filter({ property_id: id }, "-bid_amount", 20),
        base44.entities.TitleRisk.filter({ property_id: id }),
      ]);
      if (!alive) return;
      setScore(sc[0] || null); setChain(ch[0] || null); setOwners(ow); setBids(bd); setTitleRisk(tr[0] || null);
    })();
    return () => { alive = false; };
  }, [id]);

  if (property === null) {
    return <div className="mx-auto max-w-7xl px-6 py-24 text-sm text-[#707070]">Loading property…</div>;
  }
  if (!property?.id) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24">
        <p className="font-display text-2xl font-bold">Property not found</p>
        <Link to="/listings" className="mt-4 inline-block text-sm text-[#c5a059]">← Back to search</Link>
      </div>
    );
  }

  const images = property.images || [];

  return (
    <div className="bg-white">
      {/* Back link */}
      <div className="mx-auto max-w-[1400px] px-6 pt-6 lg:px-12">
        <Link to="/listings" className="inline-flex items-center gap-1.5 text-sm text-[#707070] hover:text-[#0a0a0a]">
          <ArrowLeft className="h-4 w-4" /> Back to search
        </Link>
      </div>

      {/* Gallery + Score */}
      <section className="mx-auto max-w-[1400px] px-6 py-6 lg:px-12">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="aspect-[16/10] overflow-hidden rounded-xl bg-[#121212]">
              {images[active]?.url ? (
                <Image src={images[active].url} alt={property.address} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-[10px] uppercase tracking-[0.3em] text-white/40">No image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {images.slice(0, 6).map((im, i) => (
                  <button key={i} onClick={() => setActive(i)} className={`aspect-[4/3] overflow-hidden rounded-lg ring-2 transition-all ${i === active ? "ring-[#c5a059]" : "ring-transparent hover:ring-[#e0e0e0]"}`}>
                    <Image src={im.url} alt={im.caption || ""} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Score + actions */}
          <div className="rounded-xl border border-[#e0e0e0] p-5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#707070]">HPI Opportunity Score</p>
            <div className="mt-4 flex items-center gap-4">
              <ScoreGauge score={property.property_score || 0} size={88} />
              <div>
                <p className="text-2xl font-bold tabular-nums text-[#c5a059]">{Math.round(property.property_score || 0)}</p>
                <p className="text-xs text-[#707070]">{score?.distress_severity ? labelFor(score.distress_severity) + " distress" : "AI-scored"}</p>
              </div>
            </div>
            <div className="mt-5 space-y-2 border-t border-[#e0e0e0] pt-5 text-sm">
              <div className="flex justify-between"><span className="text-[#707070]">Asking</span><span className="font-medium tabular-nums">{money(property.proposed_asking_price)}</span></div>
              <div className="flex justify-between"><span className="text-[#707070]">Est. value</span><span className="tabular-nums">{money(property.estimated_value)}</span></div>
              <div className="flex justify-between"><span className="text-[#707070]">Est. ROI</span><span className="tabular-nums text-[#c5a059]">{pct(score?.estimated_roi)}</span></div>
            </div>
            <Link to={`/properties/${id}/bid`} className="mt-5 block rounded-lg bg-[#c5a059] py-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0a0a0a] hover:bg-[#c5a059]/90">
              Make Offer
            </Link>
            <Link to="/calculators" className="mt-2 block rounded-lg border border-[#e0e0e0] py-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0a0a0a] hover:border-[#c5a059]">
              Analyze Deal
            </Link>
            <div className="mt-2 flex justify-center"><WatchButton propertyId={property.id} /></div>
          </div>
        </div>

        {/* Title row */}
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <DistressBadge type={property.distress_type} />
              <span className="rounded-full bg-[#f5f5f5] px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-[#707070]">{labelFor(property.property_type)}</span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">{unlocked ? property.address : `${property.city}, ${property.state} ${property.zip_code}`}</h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#707070]">
              <MapPin className="h-4 w-4" />{unlocked ? `${property.city}, ${property.state} ${property.zip_code}` : "Full address revealed with Pro"}
            </p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="border-y border-[#e0e0e0] bg-white">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={`whitespace-nowrap border-b-2 px-4 py-4 text-[11px] uppercase tracking-[0.2em] transition-colors ${tab === i ? "border-[#c5a059] text-[#0a0a0a]" : "border-transparent text-[#707070] hover:text-[#0a0a0a]"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab content */}
      <section className="mx-auto max-w-[1400px] px-6 py-10 lg:px-12 lg:py-14">
        {tab === 0 && (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <div className="rounded-xl border border-[#e0e0e0] p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">About this property</h2>
                <p className="mt-4 leading-relaxed text-[#707070]">{property.description || "No description provided."}</p>
                {score?.ai_analysis && <p className="mt-4 border-t border-[#e0e0e0] pt-4 leading-relaxed text-[#707070]">{score.ai_analysis}</p>}
              </div>
              <div className="rounded-xl border border-[#e0e0e0] p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">AI Score Breakdown</h2>
                <div className="mt-4 space-y-3">
                  {Object.entries(score?.score_factors || {}).map(([k, v]) => (
                    <div key={k}>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#707070]">{labelFor(k)}</span>
                        <span className="tabular-nums">{Math.round(v || 0)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f5f5f5]">
                        <div className="h-full rounded-full bg-[#c5a059] transition-all duration-700" style={{ width: `${Math.min(100, v || 0)}%` }} />
                      </div>
                    </div>
                  ))}
                  {!score?.score_factors && <p className="text-sm text-[#707070]">No score breakdown available.</p>}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-xl border border-[#e0e0e0] p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">Bid History</h2>
                <ul className="mt-4 space-y-3">
                  {bids.map((b) => (
                    <li key={b.id} className="flex items-center justify-between rounded-lg bg-[#f5f5f5] px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium tabular-nums">{money(b.bid_amount)}</p>
                        <p className="text-xs text-[#707070]">{(b.investor_name || "Investor").split(" ")[0]} · {b.status}</p>
                      </div>
                      {b.is_proxy_bid && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] ring-1 ring-[#e0e0e0]">Proxy</span>}
                    </li>
                  ))}
                  {!bids.length && <li className="text-sm text-[#707070]">No bids yet — be the first.</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Estimated value", money(property.estimated_value)],
                ["Asking price", money(property.proposed_asking_price)],
                ["Repair estimate", money(score?.repair_cost_estimate)],
                ["After-repair value", money(score?.after_repair_value)],
                ["Est. ROI", pct(score?.estimated_roi)],
                ["Days on market", num(property.days_on_market)],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-[#e0e0e0] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#707070]">{l}</p>
                  <p className="mt-1.5 text-lg font-semibold tabular-nums">{v}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-[#0a0a0a] p-6 text-white">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[#c5a059]">Deal Analyzer</h2>
              <p className="mt-2 text-xs text-white/50">Run the numbers on this property.</p>
              <div className="mt-4">
                <DealAnalyzer
                  defaultPrice={property.proposed_asking_price || 250000}
                  defaultRepairs={score?.repair_cost_estimate || 40000}
                  defaultArv={score?.after_repair_value || property.estimated_value || 380000}
                />
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div className="rounded-xl border border-[#e0e0e0] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">Comparable Sales</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-[#707070]">
                    <th className="pb-3">Address</th><th className="pb-3">Sale price</th><th className="pb-3">Date</th><th className="pb-3">Sqft</th><th className="pb-3">$/sqft</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {(score?.comparable_sales || []).map((c, i) => (
                    <tr key={i} className="tabular-nums">
                      <td className="py-3">{c.address}</td>
                      <td className="py-3">{money(c.sale_price)}</td>
                      <td className="py-3 text-[#707070]">{c.sale_date}</td>
                      <td className="py-3">{num(c.sqft)}</td>
                      <td className="py-3">{money(Math.round((c.sale_price || 0) / (c.sqft || 1)))}</td>
                    </tr>
                  ))}
                  {!score?.comparable_sales?.length && <tr><td colSpan={5} className="py-4 text-[#707070]">No comparable sales on file.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#e0e0e0] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">Property Info</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                {[["Bedrooms", num(property.bedrooms)], ["Bathrooms", num(property.bathrooms)], ["Square feet", num(property.square_footage)], ["Lot size", `${num(property.lot_size)} sqft`], ["Year built", property.year_built || "—"], ["Property type", labelFor(property.property_type)], ["Source", labelFor(property.source)], ["Distress type", labelFor(property.distress_type)]].map(([l, v]) => (
                  <div key={l}>
                    <dt className="text-[10px] uppercase tracking-[0.2em] text-[#707070]">{l}</dt>
                    <dd className="mt-1 tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-xl border border-[#e0e0e0] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">Location</h2>
              <div className="mt-4 aspect-square overflow-hidden rounded-lg bg-[#f5f5f5]">
                <iframe
                  title="Property location"
                  className="h-full w-full border-0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${(property.lng || -118.4) - 0.01}%2C${(property.lat || 34) - 0.01}%2C${(property.lng || -118.4) + 0.01}%2C${(property.lat || 34) + 0.01}&layer=mapnik&marker=${property.lat || 34}%2C${property.lng || -118.4}`}
                />
              </div>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div className="rounded-xl border border-[#e0e0e0] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">Documents</h2>
            <div className="mt-4 space-y-3">
              {titleRisk ? (
                <div className="rounded-lg bg-[#f5f5f5] p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[#c5a059]" />
                    <div>
                      <p className="text-sm font-medium">Title & lien risk assessment</p>
                      <p className="text-xs text-[#707070]">Liens {money(titleRisk.lien_total)} · Mortgage {money(titleRisk.mortgage_balance)}</p>
                    </div>
                    <span className={`ml-auto rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] ${
                      titleRisk.risk_level === "critical" ? "bg-red-100 text-red-700" :
                      titleRisk.risk_level === "high" ? "bg-orange-100 text-orange-700" :
                      titleRisk.risk_level === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    }`}>{titleRisk.risk_level || "unknown"} risk</span>
                  </div>
                  {titleRisk.ai_analysis && <p className="mt-3 border-t border-[#e0e0e0] pt-3 text-sm leading-relaxed text-[#707070]">{titleRisk.ai_analysis}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg bg-[#f5f5f5] p-6">
                  <ShieldAlert className="h-5 w-5 text-[#707070]" />
                  <p className="text-sm text-[#707070]">No title-risk assessment yet — generated automatically during nightly scoring.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div className="rounded-xl border border-[#e0e0e0] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">Ownership History</h2>
            {!unlocked ? (
              <div className="mt-4 rounded-lg bg-[#f5f5f5] p-8 text-center">
                <Lock className="mx-auto h-5 w-5 text-[#707070]" />
                <p className="mt-3 font-medium">Ownership chain and owner contacts are Pro features</p>
                <p className="mt-1 text-sm text-[#707070]">{owners.length} owner record{owners.length === 1 ? "" : "s"} and {chain?.transfers?.length || 0} recorded transfers available.</p>
                <Link to="/investor/signup" className="mt-5 inline-flex rounded-lg bg-[#c5a059] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0a0a0a]">Upgrade to Pro</Link>
              </div>
            ) : (
              <div className="mt-4 space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {owners.map((o) => (
                    <div key={o.id} className="rounded-lg bg-[#f5f5f5] p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#c5a059]">{labelFor(o.owner_type)}</p>
                      <p className="mt-1 font-medium">{o.name}</p>
                      <p className="text-xs text-[#707070]">{o.relationship_to_property}</p>
                      <div className="mt-2 space-y-1 text-xs">
                        {o.contact_phone && <p className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" />{o.contact_phone}</p>}
                        {o.contact_email && <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{o.contact_email}</p>}
                      </div>
                    </div>
                  ))}
                  {!owners.length && <p className="text-sm text-[#707070]">No owner records available.</p>}
                </div>
                <OwnershipTimeline transfers={chain?.transfers || []} />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}