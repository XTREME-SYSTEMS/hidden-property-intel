import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { money } from "@/lib/format";
import LuxuryListingCard from "@/components/luxury/LuxuryListingCard";
import { Trash2, Plus } from "lucide-react";
import { DISTRESS_TYPES as DISTRESS } from "@/lib/constants";

export default function InvestorDashboard() {
  const [investor, setInvestor] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidProperties, setBidProperties] = useState({});
  const [savedSearches, setSavedSearches] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSearch, setNewSearch] = useState({ name: "", state: "", distress_type: "" });

  const load = async () => {
    try {
      const u = await base44.auth.me();
      const inv = await base44.entities.Investor.filter({ user_id: u.id });
      const investor = inv[0] || null;
      setInvestor(investor);
      const [b, ss, props] = await Promise.all([
        base44.entities.Bid.filter({ investor_id: u.id }),
        base44.entities.SavedSearch.filter({ user_id: u.id }),
        base44.entities.Property.filter({ status: "active" }, "-property_score", 60)
      ]);
      setBids(b);
      setSavedSearches(ss);
      // Bulk-fetch property details for bids (single API call instead of N)
      const propIds = [...new Set(b.map(bid => bid.property_id).filter(Boolean))];
      const propMap = {};
      if (propIds.length) {
        const allProps = await base44.entities.Property.list('-created_date', 500);
        const idSet = new Set(propIds);
        allProps.forEach(p => { if (idSet.has(p.id)) propMap[p.id] = p; });
      }
      setBidProperties(propMap);
      const markets = (investor?.target_markets || []).map((m) => (m || "").toLowerCase());
      let rec = props;
      if (markets.length) {
        const matched = props.filter((p) => markets.some((m) => (p.city || "").toLowerCase().includes(m) || (p.state || "").toLowerCase() === m || (p.state || "").toLowerCase().includes(m)));
        rec = matched.length >= 3 ? matched : props;
      }
      setRecommended(rec.slice(0, 3));
    } catch (e) { /* not logged in */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveSearch = async () => {
    if (!newSearch.name) return;
    try {
      const u = await base44.auth.me();
      if (!u) return;
      await base44.entities.SavedSearch.create({ user_id: u.id, name: newSearch.name, filters: { state: newSearch.state, distress_type: newSearch.distress_type } });
      setNewSearch({ name: "", state: "", distress_type: "" });
      load();
    } catch (e) { /* ignore */ }
  };
  const deleteSearch = async (id) => { await base44.entities.SavedSearch.delete(id); load(); };

  if (loading) return <div className="px-6 py-32 text-center text-sm text-black/50">Loading…</div>;

  if (!investor) {
    return (
      <div className="mx-auto max-w-md px-6 py-32 text-center">
        <h1 className="font-display text-3xl font-light">No investor profile</h1>
        <p className="mt-3 text-sm text-black/60">Subscribe to a plan to access the investor portal.</p>
        <Link to="/investor/signup" className="mt-8 inline-flex rounded-sm bg-black px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-white">Subscribe</Link>
      </div>
    );
  }

  const activeBids = bids.filter((b) => b.status === "active");

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12">
      <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Investor dashboard</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight">Welcome, {investor.name}.</h1>

      <div className="mt-10 grid gap-4 sm:grid-cols-4">
        {[["Plan", investor.subscription_plan || "—"], ["Status", investor.subscription_status || "—"], ["Active bids", activeBids.length], ["Properties won", investor.properties_won || 0]].map(([l, v]) => (
          <div key={l} className="rounded-sm border border-black/10 p-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">{l}</p>
            <p className="mt-2 font-display text-2xl font-light tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <h2 className="font-display text-2xl font-light">Active bids</h2>
          <Link to="/listings" className="text-[11px] uppercase tracking-[0.3em] hover:text-black/60">Browse properties</Link>
        </div>
        {activeBids.length === 0 ? (
          <p className="mt-6 text-sm text-black/50">No active bids. Browse distressed inventory to place your first bid.</p>
        ) : (
          <div className="mt-6 divide-y divide-black/10">
            {activeBids.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-4">
                <div>
                  <Link to={`/properties/${b.property_id}`} className="font-display text-base hover:underline">
                    {bidProperties[b.property_id] ? `${bidProperties[b.property_id].address}, ${bidProperties[b.property_id].city}` : b.property_id}
                  </Link>
                  <p className="text-xs text-black/50">{b.is_proxy_bid ? "Proxy bid" : "Standard bid"}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg tabular-nums">{money(b.bid_amount)}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-black/40">{b.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl font-light">Recommended for you</h2>
        <p className="mt-1 text-sm text-black/50">Top-scored properties matching your target markets: {(investor.target_markets || []).join(", ") || "all markets"}</p>
        <div className="mt-6 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((p) => <LuxuryListingCard key={p.id} property={p} />)}
          {!recommended.length && <p className="text-sm text-black/50">No properties available yet.</p>}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl font-light">Saved searches</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <input value={newSearch.name} onChange={(e) => setNewSearch({ ...newSearch, name: e.target.value })} placeholder="Search name" className="flex-1 min-w-[160px] rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
          <input value={newSearch.state} onChange={(e) => setNewSearch({ ...newSearch, state: e.target.value })} placeholder="State (e.g. FL)" className="w-40 rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
          <select value={newSearch.distress_type} onChange={(e) => setNewSearch({ ...newSearch, distress_type: e.target.value })} className="rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none">
            <option value="">Any distress</option>
            {DISTRESS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={saveSearch} className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2.5 text-[11px] uppercase tracking-[0.3em] text-white"><Plus className="h-3.5 w-3.5" /> Save</button>
        </div>
        <div className="mt-5 divide-y divide-black/10 border-y border-black/10">
          {savedSearches.length === 0 && <p className="py-6 text-sm text-black/50">No saved searches yet.</p>}
          {savedSearches.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-4">
              <div>
                <p className="font-display text-base">{s.name}</p>
                <p className="text-xs text-black/50">{[s.filters?.state, s.filters?.distress_type].filter(Boolean).join(" · ") || "All properties"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/listings" className="text-[11px] uppercase tracking-[0.3em] hover:text-black/60">Run</Link>
                <button onClick={() => deleteSearch(s.id)} className="rounded-sm border border-black/15 p-2 text-red-600" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}