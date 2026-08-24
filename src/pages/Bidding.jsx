import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { money } from "@/lib/format";
import { FileSignature, Check } from "lucide-react";

export default function Bidding() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [bids, setBids] = useState([]);
  const [user, setUser] = useState(null);
  const [amount, setAmount] = useState("");
  const [proxy, setProxy] = useState(false);
  const [maxProxy, setMaxProxy] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [genBusy, setGenBusy] = useState(false);
  const [genMsg, setGenMsg] = useState("");
  const [acceptBusy, setAcceptBusy] = useState(false);

  const load = async () => {
    try {
      const [p, u] = await Promise.all([
        base44.entities.Property.get(id),
        base44.auth.me().catch(() => null)
      ]);
      setProperty(p); setUser(u);
      const b = await base44.entities.Bid.filter({ property_id: id });
      setBids(b.sort((a, b) => b.bid_amount - a.bid_amount));
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { load(); }, [id]);

  const isSellerOrAdmin = user && (user.role === "admin" || (property?.seller_id && property.seller_id === user.id));
  const activeBids = bids.filter((b) => b.status === "active");
  const acceptedBid = bids.find((b) => b.status === "accepted");
  const topBid = acceptedBid || activeBids.sort((a, b) => b.bid_amount - a.bid_amount)[0];
  const highest = activeBids.reduce((m, b) => (b.bid_amount > m ? b.bid_amount : m), 0);

  const place = async () => {
    setMsg(""); setBusy(true);
    try {
      const res = await base44.functions.invoke("placeBid", {
        property_id: id, bid_amount: Number(amount),
        is_proxy_bid: proxy, max_proxy_amount: proxy ? Number(maxProxy) : undefined
      });
      if (res.data?.error) setMsg(res.data.error);
      else { setAmount(""); setMaxProxy(""); setProxy(false); load(); }
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    setBusy(false);
  };

  const accept = async (bidId) => {
    setMsg(""); setAcceptBusy(true);
    try {
      const res = await base44.functions.invoke("acceptBid", { property_id: id, bid_id: bidId });
      if (res.data?.error) setMsg(res.data.error);
      else { setMsg("Bid accepted — property is now under contract."); load(); }
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    setAcceptBusy(false);
  };

  const generateContract = async () => {
    if (!topBid) { setGenMsg("No bid to generate a contract for."); return; }
    setGenBusy(true); setGenMsg("");
    try {
      const res = await base44.functions.invoke("generateSmartContract", {
        property_id: id,
        investor_id: topBid.investor_id,
        seller_id: property.seller_id || topBid.investor_id,
        contract_type: "escrow",
        terms: {
          price: topBid.bid_amount,
          earnest_money: Math.round(topBid.bid_amount * 0.03),
          closing_date: "",
          contingencies: ["inspection", "financing", "clear_title"]
        }
      });
      if (res.data?.smart_contract_id) navigate(`/contracts/${res.data.smart_contract_id}`);
      else setGenMsg(res.data?.error || "Contract generation failed.");
    } catch (e) { setGenMsg(e.response?.data?.error || e.message); }
    setGenBusy(false);
  };

  if (!property) return <div className="px-6 py-32 text-center text-sm text-black/50">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-12">
      <Link to={`/properties/${id}`} className="text-[11px] uppercase tracking-[0.3em] text-black/50 hover:text-black">← Back to property</Link>
      <h1 className="mt-4 font-display text-4xl font-light tracking-tight">{property.city}, {property.state}</h1>
      <p className="mt-1 text-sm text-black/50">{property.distress_type} · Score {Math.round(property.property_score || 0)} · <span className={property.status === "under_contract" ? "text-emerald-700" : ""}>{property.status}</span></p>

      {acceptedBid ? (
        <div className="mt-10 rounded-sm border border-emerald-600/30 bg-emerald-50 p-6">
          <div className="flex items-center gap-2"><Check className="h-5 w-5 text-emerald-700" /><p className="font-display text-lg text-emerald-800">Bid accepted — under contract</p></div>
          <p className="mt-2 text-sm text-emerald-700">Accepted bid: {money(acceptedBid.bid_amount)} from {acceptedBid.investor_name || "Investor"}.</p>
        </div>
      ) : (
        <div className="mt-10 rounded-sm border border-black/10 p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">{highest > 0 ? "Current highest bid" : "Starting bid"}</p>
          <p className="mt-2 font-display text-4xl font-light tabular-nums">{money(highest > 0 ? highest : property.proposed_asking_price || 0)}</p>
          {highest === 0 && <p className="mt-2 text-xs text-black/40">Place a bid to start the auction</p>}
        </div>
      )}

      {!acceptedBid && (
        <div className="mt-6 rounded-sm border border-black/10 p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Place a bid</p>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={highest ? `Min $${(highest + 1000).toLocaleString()}` : "Bid amount"} className="mt-3 w-full rounded-sm border border-black/15 px-4 py-3 text-sm outline-none focus:border-black" />
          <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={proxy} onChange={(e) => setProxy(e.target.checked)} /> Enable proxy (auto) bidding — Elite plan required</label>
          {proxy && <input type="number" value={maxProxy} onChange={(e) => setMaxProxy(e.target.value)} placeholder="Max auto-bid amount" className="mt-3 w-full rounded-sm border border-black/15 px-4 py-3 text-sm outline-none focus:border-black" />}
          <button onClick={place} disabled={busy} className="mt-4 w-full rounded-sm bg-black py-3.5 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">Place bid</button>
          {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
        </div>
      )}

      {isSellerOrAdmin && !acceptedBid && topBid && (
        <div className="mt-6 rounded-sm border border-black/10 p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Seller action</p>
          <p className="mt-2 text-sm text-black/60">Accept the top bid of {money(topBid.bid_amount)} from {topBid.investor_name || "Investor"} to move the property under contract.</p>
          <button onClick={() => accept(topBid.id)} disabled={acceptBusy} className="mt-4 rounded-sm bg-emerald-700 px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">{acceptBusy ? "Accepting…" : "Accept top bid"}</button>
        </div>
      )}

      <div className="mt-6 rounded-sm border border-black/10 p-6">
        <div className="flex items-center gap-2"><FileSignature className="h-4 w-4 text-black/60" /><p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Smart contract</p></div>
        <p className="mt-2 text-sm text-black/60">{acceptedBid ? "Generate the Polygon escrow contract from the accepted bid." : "Auto-generate a Polygon escrow contract from the top bid's terms — Solidity code, ABI, and on-platform signing."}</p>
        <button onClick={generateContract} disabled={genBusy} className="mt-4 rounded-sm bg-black px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">{genBusy ? "Generating…" : "Generate escrow contract"}</button>
        {genMsg && <p className="mt-3 text-sm text-black/70">{genMsg}</p>}
      </div>

      <div className="mt-10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Bid history</p>
        <div className="mt-4 divide-y divide-black/10">
          {bids.length === 0 ? <p className="text-sm text-black/50">No bids yet.</p> : bids.map((b) => (
            <div key={b.id} className="flex items-center justify-between py-3 text-sm">
              <span className="text-black/60">{b.investor_name || "Anonymous"}</span>
              <span className="font-display tabular-nums">{money(b.bid_amount)}</span>
              <span className={`text-[10px] uppercase tracking-[0.2em] ${b.status === "accepted" ? "text-emerald-700" : "text-black/40"}`}>{b.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}