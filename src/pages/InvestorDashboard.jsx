import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { money } from "@/lib/format";

export default function InvestorDashboard() {
  const [investor, setInvestor] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        const inv = await base44.entities.Investor.filter({ user_id: u.id });
        setInvestor(inv[0] || null);
        const b = await base44.entities.Bid.filter({ investor_id: u.id });
        setBids(b);
      } catch (e) { /* not logged in */ }
      setLoading(false);
    })();
  }, []);

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
                  <Link to={`/properties/${b.property_id}`} className="font-display text-base hover:underline">{b.property_id}</Link>
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
    </div>
  );
}