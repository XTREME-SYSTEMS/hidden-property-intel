import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { money } from "@/lib/format";

export default function Bidding() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [bids, setBids] = useState([]);
  const [amount, setAmount] = useState("");
  const [proxy, setProxy] = useState(false);
  const [maxProxy, setMaxProxy] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const p = await base44.entities.Property.get(id);
      setProperty(p);
      const b = await base44.entities.Bid.filter({ property_id: id });
      setBids(b.sort((a, b) => b.bid_amount - a.bid_amount));
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { load(); }, [id]);

  const highest = bids.filter((b) => b.status === "active").reduce((m, b) => (b.bid_amount > m ? b.bid_amount : m), 0);

  const place = async () => {
    setMsg("");
    setBusy(true);
    try {
      const res = await base44.functions.invoke("placeBid", {
        property_id: id,
        bid_amount: Number(amount),
        is_proxy_bid: proxy,
        max_proxy_amount: proxy ? Number(maxProxy) : undefined
      });
      if (res.data?.error) setMsg(res.data.error);
      else { setAmount(""); setMaxProxy(""); setProxy(false); load(); }
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    setBusy(false);
  };

  if (!property) return <div className="px-6 py-32 text-center text-sm text-black/50">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-12">
      <Link to={`/properties/${id}`} className="text-[11px] uppercase tracking-[0.3em] text-black/50 hover:text-black">← Back to property</Link>
      <h1 className="mt-4 font-display text-4xl font-light tracking-tight">{property.address}</h1>
      <p className="mt-1 text-sm text-black/50">{property.city}, {property.state}</p>

      <div className="mt-10 rounded-sm border border-black/10 p-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Current highest bid</p>
        <p className="mt-2 font-display text-4xl font-light tabular-nums">{money(highest)}</p>
      </div>

      <div className="mt-6 rounded-sm border border-black/10 p-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Place a bid</p>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={highest ? `Min $${(highest + 1000).toLocaleString()}` : "Bid amount"}
          className="mt-3 w-full rounded-sm border border-black/15 px-4 py-3 text-sm outline-none focus:border-black"
        />
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={proxy} onChange={(e) => setProxy(e.target.checked)} /> Enable proxy (auto) bidding — Elite plan required
        </label>
        {proxy && (
          <input
            type="number"
            value={maxProxy}
            onChange={(e) => setMaxProxy(e.target.value)}
            placeholder="Max auto-bid amount"
            className="mt-3 w-full rounded-sm border border-black/15 px-4 py-3 text-sm outline-none focus:border-black"
          />
        )}
        <button onClick={place} disabled={busy} className="mt-4 w-full rounded-sm bg-black py-3.5 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">Place bid</button>
        {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
      </div>

      <div className="mt-10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Bid history</p>
        <div className="mt-4 divide-y divide-black/10">
          {bids.length === 0 ? (
            <p className="text-sm text-black/50">No bids yet.</p>
          ) : bids.map((b) => (
            <div key={b.id} className="flex items-center justify-between py-3 text-sm">
              <span className="text-black/60">{b.investor_name || "Anonymous"}</span>
              <span className="font-display tabular-nums">{money(b.bid_amount)}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">{b.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}