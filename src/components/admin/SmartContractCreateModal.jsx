import React, { useState, useEffect } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SmartContractCreateModal({ onClose, onCreated }) {
  const [properties, setProperties] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    property_id: "", investor_id: "", seller_id: "", deal_id: "",
    contract_type: "escrow",
    price: "", earnest_money: "", closing_date: "",
    contingencies: "Inspection, Financing, Title",
    buyer_address: "", seller_address: "",
  });

  useEffect(() => {
    Promise.all([
      base44.entities.Property.list("-created_date", 50).catch(() => []),
      base44.entities.Investor.list("-created_date", 50).catch(() => []),
      base44.entities.Seller.list("-created_date", 50).catch(() => []),
      base44.entities.Deal.list("-created_date", 50).catch(() => []),
    ]).then(([p, i, s, d]) => {
      setProperties(p); setInvestors(i); setSellers(s); setDeals(d);
      setLoading(false);
    });
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.property_id || !form.investor_id || !form.seller_id) {
      setError("Property, investor, and seller are required.");
      return;
    }
    setCreating(true); setError(null);
    try {
      await base44.functions.invoke("generateSmartContract", {
        property_id: form.property_id,
        investor_id: form.investor_id,
        seller_id: form.seller_id,
        deal_id: form.deal_id || undefined,
        contract_type: form.contract_type,
        terms: {
          price: form.price ? Number(form.price) : undefined,
          earnest_money: form.earnest_money ? Number(form.earnest_money) : undefined,
          closing_date: form.closing_date || undefined,
          contingencies: form.contingencies.split(",").map((c) => c.trim()).filter(Boolean),
          buyer_address: form.buyer_address || undefined,
          seller_address: form.seller_address || undefined,
        },
      });
      onCreated();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-3">
          <h2 className="text-sm font-medium">Create Smart Contract</h2>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-black/5"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 p-5">
          {loading ? (
            <div className="py-8 text-center text-sm text-black/40"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Property">
                  <select value={form.property_id} onChange={(e) => set("property_id", e.target.value)} className="w-full rounded-md border border-black/15 px-3 py-2 text-xs">
                    <option value="">Select property…</option>
                    {properties.map((p) => <option key={p.id} value={p.id}>{p.address}, {p.city}</option>)}
                  </select>
                </Field>
                <Field label="Deal (optional)">
                  <select value={form.deal_id} onChange={(e) => set("deal_id", e.target.value)} className="w-full rounded-md border border-black/15 px-3 py-2 text-xs">
                    <option value="">None</option>
                    {deals.map((d) => <option key={d.id} value={d.id}>Deal: {d.stage} — {d.id.slice(0, 8)}</option>)}
                  </select>
                </Field>
                <Field label="Investor (Buyer)">
                  <select value={form.investor_id} onChange={(e) => set("investor_id", e.target.value)} className="w-full rounded-md border border-black/15 px-3 py-2 text-xs">
                    <option value="">Select investor…</option>
                    {investors.map((i) => <option key={i.id} value={i.user_id}>{i.name}</option>)}
                  </select>
                </Field>
                <Field label="Seller">
                  <select value={form.seller_id} onChange={(e) => set("seller_id", e.target.value)} className="w-full rounded-md border border-black/15 px-3 py-2 text-xs">
                    <option value="">Select seller…</option>
                    {sellers.map((s) => <option key={s.id} value={s.user_id}>{s.name}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Contract Type">
                <select value={form.contract_type} onChange={(e) => set("contract_type", e.target.value)} className="w-full rounded-md border border-black/15 px-3 py-2 text-xs">
                  <option value="escrow">Escrow</option>
                  <option value="purchase_agreement">Purchase Agreement</option>
                  <option value="deed_transfer">Deed Transfer</option>
                </select>
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Purchase Price ($)">
                  <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} className="w-full rounded-md border border-black/15 px-3 py-2 text-xs" placeholder="250000" />
                </Field>
                <Field label="Earnest Money ($)">
                  <input type="number" value={form.earnest_money} onChange={(e) => set("earnest_money", e.target.value)} className="w-full rounded-md border border-black/15 px-3 py-2 text-xs" placeholder="7500" />
                </Field>
                <Field label="Closing Date">
                  <input type="date" value={form.closing_date} onChange={(e) => set("closing_date", e.target.value)} className="w-full rounded-md border border-black/15 px-3 py-2 text-xs" />
                </Field>
              </div>

              <Field label="Contingencies (comma-separated)">
                <input value={form.contingencies} onChange={(e) => set("contingencies", e.target.value)} className="w-full rounded-md border border-black/15 px-3 py-2 text-xs" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Buyer Wallet Address (0x…)">
                  <input value={form.buyer_address} onChange={(e) => set("buyer_address", e.target.value)} className="w-full rounded-md border border-black/15 px-3 py-2 text-xs font-mono" placeholder="0x…" />
                </Field>
                <Field label="Seller Wallet Address (0x…)">
                  <input value={form.seller_address} onChange={(e) => set("seller_address", e.target.value)} className="w-full rounded-md border border-black/15 px-3 py-2 text-xs font-mono" placeholder="0x…" />
                </Field>
              </div>

              {error && <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-black/10 px-5 py-3">
          <button onClick={onClose} className="rounded-md border border-black/15 px-4 py-2 text-xs hover:bg-black/5">Cancel</button>
          <button onClick={submit} disabled={creating || loading} className="inline-flex items-center gap-1.5 rounded-md bg-black px-4 py-2 text-xs text-white disabled:opacity-50">
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} {creating ? "Generating with AI…" : "Generate Contract"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-black/40">{label}</label>
      {children}
    </div>
  );
}