import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { money } from "@/lib/format";
import { Plus, ChevronLeft, ChevronRight, Trash2, TrendingUp } from "lucide-react";

const STAGES = [
  { id: "lead", label: "Lead" },
  { id: "underwriting", label: "Underwriting" },
  { id: "offer", label: "Offer" },
  { id: "contract", label: "Contract" },
  { id: "closing", label: "Closing" },
  { id: "rehab", label: "Rehab" },
  { id: "exit", label: "Exit" },
];
const ORDER = STAGES.map((s) => s.id);

export default function InvestorPipeline() {
  const [deals, setDeals] = useState([]);
  const [props, setProps] = useState({});
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const prefillId = params.get("propertyId");

  const [form, setForm] = useState({ property_id: "", exit_strategy: "flip", acquisition_price: "" });

  const load = useCallback(async () => {
    try {
      const d = await base44.entities.Deal.list("-created_date", 200);
      setDeals(d);
      const ids = [...new Set(d.map((x) => x.property_id).filter(Boolean))];
      const map = {};
      if (ids.length) {
        const allProps = await base44.entities.Property.list('-created_date', 500);
        const idSet = new Set(ids);
        allProps.forEach(p => { if (idSet.has(p.id)) map[p.id] = p; });
      }
      setProps(map);
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (prefillId) setForm((f) => ({ ...f, property_id: prefillId }));
    load();
  }, [load, prefillId]);

  const create = async () => {
    const u = await base44.auth.me();
    if (!u || !form.property_id) return;
    await base44.entities.Deal.create({
      user_id: u.id,
      property_id: form.property_id,
      stage: "lead",
      exit_strategy: form.exit_strategy,
      acquisition_price: Number(form.acquisition_price) || null,
    });
    setForm({ property_id: "", exit_strategy: "flip", acquisition_price: "" });
    load();
  };

  const move = async (deal, dir) => {
    const i = ORDER.indexOf(deal.stage);
    const next = ORDER[Math.max(0, Math.min(ORDER.length - 1, i + dir))];
    await base44.entities.Deal.update(deal.id, { stage: next });
    load();
  };

  const remove = async (id) => {
    await base44.entities.Deal.delete(id);
    load();
  };

  const active = deals.filter((d) => d.status === "active");
  const totalProjected = active.reduce((s, d) => s + (d.projected_profit || 0), 0);
  const totalAcq = active.reduce((s, d) => s + (d.acquisition_price || 0), 0);

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Deal pipeline</h1>
          <p className="mt-1 text-sm text-[#6B7B72]">Track every deal from lead to exit.</p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-2xl bg-[#F8FAF9] px-5 py-3 ring-1 ring-[#E5EDEA]">
            <p className="text-[10px] uppercase tracking-widest text-[#6B7B72]">Active deals</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums">{active.length}</p>
          </div>
          <div className="rounded-2xl bg-[#F8FAF9] px-5 py-3 ring-1 ring-[#E5EDEA]">
            <p className="text-[10px] uppercase tracking-widest text-[#6B7B72]">Capital deployed</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums">{money(totalAcq)}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-5 py-3 ring-1 ring-emerald-200">
            <p className="text-[10px] uppercase tracking-widest text-emerald-700">Projected profit</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums text-emerald-700">{money(totalProjected)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#E5EDEA]">
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-[#6B7B72]">Property ID</span>
          <input value={form.property_id} onChange={(e) => setForm((f) => ({ ...f, property_id: e.target.value }))} placeholder="property id" className="mt-1 w-56 rounded-lg bg-[#F8FAF9] px-3 py-2 text-sm ring-1 ring-[#E5EDEA] outline-none focus:ring-emerald-500" />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-[#6B7B72]">Strategy</span>
          <select value={form.exit_strategy} onChange={(e) => setForm((f) => ({ ...f, exit_strategy: e.target.value }))} className="mt-1 rounded-lg bg-[#F8FAF9] px-3 py-2 text-sm ring-1 ring-[#E5EDEA] outline-none focus:ring-emerald-500">
            <option value="flip">Flip</option>
            <option value="brrrr">BRRRR</option>
            <option value="buy_hold">Buy & Hold</option>
            <option value="wholesale">Wholesale</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-[#6B7B72]">Acquisition price</span>
          <input type="number" value={form.acquisition_price} onChange={(e) => setForm((f) => ({ ...f, acquisition_price: e.target.value }))} placeholder="$" className="mt-1 w-40 rounded-lg bg-[#F8FAF9] px-3 py-2 text-sm ring-1 ring-[#E5EDEA] outline-none focus:ring-emerald-500" />
        </label>
        <button onClick={create} className="inline-flex items-center gap-2 rounded-full bg-[#0F2A1D] px-5 py-2.5 text-sm text-white hover:bg-[#1A2B22]">
          <Plus className="h-4 w-4" /> Add to pipeline
        </button>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-7">
        {STAGES.map((stage) => {
          const items = active.filter((d) => d.stage === stage.id);
          return (
            <div key={stage.id} className="rounded-2xl bg-[#F8FAF9] p-3 ring-1 ring-[#E5EDEA]">
              <div className="flex items-center justify-between px-1 pb-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#1A2B22]">{stage.label}</p>
                <span className="text-xs text-[#6B7B72]">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((d) => {
                  const p = props[d.property_id];
                  return (
                    <div key={d.id} className="rounded-xl bg-white p-3 ring-1 ring-[#E5EDEA]">
                      <Link to={`/properties/${d.property_id}`} className="block text-sm font-medium hover:text-emerald-700">
                        {p ? `${p.city}, ${p.state}` : "Property"}
                      </Link>
                      <p className="mt-0.5 text-xs capitalize text-[#6B7B72]">{d.exit_strategy?.replace("_", " ")} · {money(d.acquisition_price || 0)}</p>
                      {d.projected_profit != null && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600">
                          <TrendingUp className="h-3 w-3" /> {money(d.projected_profit)}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <button onClick={() => move(d, -1)} className="rounded p-1 text-[#6B7B72] hover:bg-[#F8FAF9]"><ChevronLeft className="h-3.5 w-3.5" /></button>
                        <button onClick={() => remove(d.id)} className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => move(d, 1)} className="rounded p-1 text-[#6B7B72] hover:bg-[#F8FAF9]"><ChevronRight className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
                {!items.length && <p className="px-1 py-4 text-center text-xs text-[#6B7B72]">—</p>}
              </div>
            </div>
          );
        })}
      </div>
      {loading && <p className="mt-6 text-sm text-[#6B7B72]">Loading pipeline…</p>}
    </div>
  );
}