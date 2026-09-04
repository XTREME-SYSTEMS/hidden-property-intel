import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { money } from "@/lib/format";
import {
  Gavel, TrendingUp, TrendingDown, Check, X, Clock, Loader2,
  ArrowUp, Users, RefreshCw, AlertCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  active: { icon: Clock, label: "Active", color: "text-amber-600", bg: "bg-amber-100", dot: "bg-amber-500" },
  outbid: { icon: TrendingDown, label: "Outbid", color: "text-red-600", bg: "bg-red-100", dot: "bg-red-500" },
  accepted: { icon: Check, label: "Accepted", color: "text-emerald-600", bg: "bg-emerald-100", dot: "bg-emerald-500" },
  rejected: { icon: X, label: "Rejected", color: "text-red-600", bg: "bg-red-100", dot: "bg-red-500" },
  withdrawn: { icon: X, label: "Withdrawn", color: "text-black/40", bg: "bg-black/5", dot: "bg-black/30" },
};

export default function InvestorBiddingPanel({ investor }) {
  const [myBids, setMyBids] = useState([]);
  const [properties, setProperties] = useState({});
  const [competingBids, setCompetingBids] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedBid, setExpandedBid] = useState(null);
  const [quickBidAmount, setQuickBidAmount] = useState("");
  const [quickBidBusy, setQuickBidBusy] = useState(false);
  const [quickBidMsg, setQuickBidMsg] = useState("");
  const [liveUpdate, setLiveUpdate] = useState(false);

  const load = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      const bids = await base44.entities.Bid.filter({ investor_id: u.id }, "-created_date", 100);
      setMyBids(bids);

      // Fetch property details for all bid properties
      const propIds = [...new Set(bids.map(b => b.property_id).filter(Boolean))];
      const propMap = {};
      if (propIds.length) {
        const allProps = await base44.entities.Property.list("-created_date", 500);
        const idSet = new Set(propIds);
        allProps.forEach(p => { if (idSet.has(p.id)) propMap[p.id] = p; });
      }
      setProperties(propMap);

      // Fetch competing bids for each property
      const compMap = {};
      await Promise.all(propIds.map(async (pid) => {
        try {
          const all = await base44.entities.Bid.filter({ property_id: pid }, "-bid_amount", 50);
          compMap[pid] = all;
        } catch (e) { compMap[pid] = []; }
      }));
      setCompetingBids(compMap);
    } catch (e) { /* not logged in */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    // Real-time subscription for bid updates
    const unsubscribe = base44.entities.Bid.subscribe((event) => {
      setLiveUpdate(true);
      setTimeout(() => setLiveUpdate(false), 2000);
      // Reload on any bid event (create, update, delete)
      if (event.type === "create" || event.type === "update" || event.type === "delete") {
        load();
      }
    });

    return unsubscribe;
  }, [load]);

  const placeQuickBid = async (propertyId, currentHighest) => {
    if (!quickBidAmount) return;
    setQuickBidBusy(true);
    setQuickBidMsg("");
    try {
      const res = await base44.functions.invoke("placeBid", {
        property_id: propertyId,
        bid_amount: Number(quickBidAmount),
      });
      if (res.data?.error) setQuickBidMsg(res.data.error);
      else {
        setQuickBidAmount("");
        setQuickBidMsg("Bid placed successfully!");
        load();
      }
    } catch (e) {
      setQuickBidMsg(e.response?.data?.error || e.message);
    }
    setQuickBidBusy(false);
  };

  if (loading) return <div className="py-8 text-center text-sm text-black/40">Loading your bids…</div>;

  // Group bids by property
  const bidsByProperty = {};
  myBids.forEach((b) => {
    if (!bidsByProperty[b.property_id]) bidsByProperty[b.property_id] = [];
    bidsByProperty[b.property_id].push(b);
  });

  const stats = {
    total: myBids.length,
    active: myBids.filter(b => b.status === "active").length,
    outbid: myBids.filter(b => b.status === "outbid").length,
    accepted: myBids.filter(b => b.status === "accepted").length,
  };

  return (
    <div>
      {/* Header with live indicator */}
      <div className="flex items-center justify-between border-b border-black/10 pb-4">
        <div className="flex items-center gap-3">
          <Gavel className="h-5 w-5 text-black/60" />
          <h2 className="font-display text-2xl font-light">My Bids</h2>
          {liveUpdate && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
            </span>
          )}
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.3em] text-black/50 hover:text-black">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 sm:grid-cols-4">
        <div className="bg-white p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Total Bids</p>
          <p className="mt-1 font-display text-2xl font-light">{stats.total}</p>
        </div>
        <div className="bg-white p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Active</p>
          <p className="mt-1 font-display text-2xl font-light text-amber-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Outbid</p>
          <p className="mt-1 font-display text-2xl font-light text-red-600">{stats.outbid}</p>
        </div>
        <div className="bg-white p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Accepted</p>
          <p className="mt-1 font-display text-2xl font-light text-emerald-600">{stats.accepted}</p>
        </div>
      </div>

      {myBids.length === 0 ? (
        <div className="mt-6 rounded-sm border border-dashed border-black/20 p-8 text-center">
          <Gavel className="mx-auto h-8 w-8 text-black/30" />
          <p className="mt-3 text-sm text-black/50">No bids placed yet.</p>
          <Link to="/listings" className="mt-4 inline-flex rounded-sm bg-black px-5 py-2.5 text-[11px] uppercase tracking-[0.3em] text-white">
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {Object.entries(bidsByProperty).map(([propId, bids]) => {
            const prop = properties[propId];
            const allBidsForProp = competingBids[propId] || [];
            const myBestBid = bids.sort((a, b) => b.bid_amount - a.bid_amount)[0];
            const competing = allBidsForProp.filter(b => b.investor_id !== myBestBid.investor_id);
            const highestAll = allBidsForProp.length > 0 ? Math.max(...allBidsForProp.map(b => b.bid_amount)) : 0;
            const isWinning = myBestBid.status === "active" && myBestBid.bid_amount >= highestAll;
            const isExpanded = expandedBid === propId;

            return (
              <div key={propId} className="rounded-sm border border-black/10 bg-white overflow-hidden">
                {/* Property header */}
                <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
                  <div>
                    <Link to={`/properties/${propId}`} className="font-display text-base font-medium hover:underline">
                      {prop ? `${prop.address}, ${prop.city}, ${prop.state}` : propId}
                    </Link>
                    <p className="mt-0.5 text-xs text-black/50">
                      {prop?.distress_type} · Score {Math.round(prop?.property_score || 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {isWinning && myBestBid.status === "active" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-emerald-700">
                        <TrendingUp className="h-3 w-3" /> Winning
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] ${STATUS_CONFIG[myBestBid.status]?.bg || "bg-black/5"} ${STATUS_CONFIG[myBestBid.status]?.color || "text-black/40"}`}>
                      {(() => { const Icon = STATUS_CONFIG[myBestBid.status]?.icon || Clock; return <Icon className="h-3 w-3" />; })()}
                      {STATUS_CONFIG[myBestBid.status]?.label || myBestBid.status}
                    </span>
                  </div>
                </div>

                {/* Bid summary */}
                <div className="px-5 py-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Your Best Bid</p>
                      <p className="mt-1 font-display text-xl tabular-nums">{money(myBestBid.bid_amount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Highest Bid</p>
                      <p className="mt-1 font-display text-xl tabular-nums">{money(highestAll)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Total Bidders</p>
                      <p className="mt-1 font-display text-xl tabular-nums">{new Set(allBidsForProp.map(b => b.investor_id)).size}</p>
                    </div>
                  </div>

                  {/* Outbid alert with quick re-bid */}
                  {myBestBid.status === "outbid" && (
                    <div className="mt-4 rounded-sm border border-red-200 bg-red-50 p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <p className="text-sm font-medium text-red-900">You've been outbid</p>
                      </div>
                      <p className="mt-1 text-xs text-red-700">Current highest: {money(highestAll)}. Place a new bid to take the lead.</p>
                      <div className="mt-3 flex gap-2">
                        <input
                          type="number"
                          value={quickBidAmount}
                          onChange={(e) => setQuickBidAmount(e.target.value)}
                          placeholder={`Min $${(highestAll + 1000).toLocaleString()}`}
                          className="flex-1 rounded-sm border border-red-200 px-3 py-2 text-sm outline-none focus:border-red-500"
                        />
                        <button
                          onClick={() => placeQuickBid(propId, highestAll)}
                          disabled={quickBidBusy}
                          className="inline-flex items-center gap-1.5 rounded-sm bg-red-600 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50"
                        >
                          {quickBidBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
                          {quickBidBusy ? "Placing…" : "Re-bid"}
                        </button>
                      </div>
                      {quickBidMsg && <p className="mt-2 text-xs text-red-600">{quickBidMsg}</p>}
                    </div>
                  )}

                  {/* Expand/collapse competing bids */}
                  <button
                    onClick={() => setExpandedBid(isExpanded ? null : propId)}
                    className="mt-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.3em] text-black/50 hover:text-black"
                  >
                    <Users className="h-3.5 w-3.5" />
                    {isExpanded ? "Hide" : "View"} competing bids ({competing.length})
                  </button>

                  {/* Competing bids list */}
                  {isExpanded && (
                    <div className="mt-3 border-t border-black/10 pt-3">
                      {competing.length === 0 ? (
                        <p className="text-sm text-black/40">No competing bids.</p>
                      ) : (
                        <div className="space-y-2">
                          {competing.sort((a, b) => b.bid_amount - a.bid_amount).map((b) => (
                            <div key={b.id} className="flex items-center justify-between rounded-sm border border-black/5 px-3 py-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[b.status]?.dot || "bg-black/30"}`} />
                                <span className="text-black/70">{b.investor_name || "Anonymous"}</span>
                                {b.is_proxy_bid && <span className="text-[9px] uppercase tracking-[0.2em] text-black/40">Proxy</span>}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-display tabular-nums">{money(b.bid_amount)}</span>
                                <span className={`text-[9px] uppercase tracking-[0.2em] ${STATUS_CONFIG[b.status]?.color || "text-black/40"}`}>
                                  {STATUS_CONFIG[b.status]?.label || b.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action link */}
                  <div className="mt-4 flex gap-3">
                    <Link
                      to={`/properties/${propId}/bid`}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-black/15 px-4 py-2 text-[11px] uppercase tracking-[0.3em] hover:bg-black hover:text-white"
                    >
                      <Gavel className="h-3.5 w-3.5" /> Full Bidding Page
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}