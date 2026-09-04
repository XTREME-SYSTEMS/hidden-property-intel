import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Users, DollarSign, Brain, Loader2, Target, TrendingUp,
  FileText, ArrowRight, Zap, Handshake,
} from "lucide-react";

export default function WholesalerDashboard() {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [newDeal, setNewDeal] = useState({ address: "", arv: "", contractPrice: "", repairCost: "" });

  useEffect(() => {
    (async () => {
      try {
        const dealList = await base44.entities.Deal.filter({ exit_strategy: "wholesale" }, "-created_date", 20);
        setDeals(dealList);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const analyzeDeal = async () => {
    if (!newDeal.address || !newDeal.arv || !newDeal.contractPrice) return;
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI wholesale deal analyzer. Analyze this wholesale deal and provide:
1. Maximum allowable offer (MAO) using the 70% rule
2. Estimated assignment fee range
3. Deal quality score (1-10)
4. Recommended exit strategy
5. Buyer matching criteria (what type of buyer would want this)
6. Risk factors

Deal details:
- Address: ${newDeal.address}
- After Repair Value (ARV): $${newDeal.arv}
- Contract Price: $${newDeal.contractPrice}
- Estimated Repair Cost: ${newDeal.repairCost || "not provided"}

Provide a structured response for a wholesaler deciding whether to assign this contract.`,
        response_json_schema: {
          type: "object",
          properties: {
            mao: { type: "number" },
            assignment_fee_range: { type: "object", properties: { min: { type: "number" }, max: { type: "number" } } },
            deal_score: { type: "number" },
            deal_quality: { type: "string" },
            recommended_exit: { type: "string" },
            buyer_criteria: { type: "array", items: { type: "string" } },
            risk_factors: { type: "array", items: { type: "string" } },
            summary: { type: "string" }
          }
        }
      });
      setAiAnalysis(res);
    } catch (e) { setAiAnalysis({ error: e.message }); }
    setAiLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-sm text-black/40">Loading wholesaler dashboard…</div>;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="flex items-center gap-2">
        <Handshake className="h-5 w-5 text-[#c38a1b]" />
        <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Wholesaler Dashboard</p>
      </div>
      <h1 className="mt-2 font-display text-3xl font-light tracking-tight">Deal Assignment & Buyer Matching</h1>
      <p className="mt-2 max-w-3xl text-sm text-black/50">
        Analyze wholesale deals, calculate assignment fees, and match contracts to your buyer list with AI.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 lg:grid-cols-4">
        <Stat icon={FileText} label="Wholesale Deals" value={deals.length} />
        <Stat icon={TrendingUp} label="Active Deals" value={deals.filter(d => d.status === "active").length} />
        <Stat icon={DollarSign} label="Total Projected Profit" value={`$${deals.reduce((s, d) => s + (d.projected_profit || 0), 0).toLocaleString()}`} />
        <Stat icon={Target} label="Avg ARV" value={deals.length > 0 ? `$${(deals.reduce((s, d) => s + (d.arv || 0), 0) / deals.length / 1000).toFixed(0)}K` : "—"} />
      </div>

      {/* AI Deal Analyzer */}
      <div className="mt-8 rounded-sm border border-[#c38a1b]/30 bg-amber-50 p-6">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#c38a1b]" />
          <h2 className="font-display text-lg font-light">AI Wholesale Deal Analyzer</h2>
        </div>
        <p className="mt-1 text-xs text-black/50">Enter a potential deal to get instant MAO, assignment fee, and buyer matching analysis.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input placeholder="Property Address" value={newDeal.address} onChange={(e) => setNewDeal({ ...newDeal, address: e.target.value })} className="rounded-sm border border-black/15 px-3 py-2 text-sm" />
          <input placeholder="ARV ($)" type="number" value={newDeal.arv} onChange={(e) => setNewDeal({ ...newDeal, arv: e.target.value })} className="rounded-sm border border-black/15 px-3 py-2 text-sm" />
          <input placeholder="Contract Price ($)" type="number" value={newDeal.contractPrice} onChange={(e) => setNewDeal({ ...newDeal, contractPrice: e.target.value })} className="rounded-sm border border-black/15 px-3 py-2 text-sm" />
          <input placeholder="Repair Cost ($)" type="number" value={newDeal.repairCost} onChange={(e) => setNewDeal({ ...newDeal, repairCost: e.target.value })} className="rounded-sm border border-black/15 px-3 py-2 text-sm" />
        </div>
        <button onClick={analyzeDeal} disabled={aiLoading} className="mt-3 inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {aiLoading ? "Analyzing…" : "Analyze Deal"}
        </button>

        {aiAnalysis && !aiAnalysis.error && (
          <div className="mt-4 space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-sm border border-amber-200 bg-white p-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">Max Allowable Offer</p>
                <p className="mt-1 font-display text-xl text-amber-900">${aiAnalysis.mao?.toLocaleString()}</p>
              </div>
              <div className="rounded-sm border border-amber-200 bg-white p-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">Assignment Fee Range</p>
                <p className="mt-1 font-display text-xl text-amber-900">${aiAnalysis.assignment_fee_range?.min?.toLocaleString()} – ${aiAnalysis.assignment_fee_range?.max?.toLocaleString()}</p>
              </div>
              <div className="rounded-sm border border-amber-200 bg-white p-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">Deal Score</p>
                <p className="mt-1 font-display text-xl text-amber-900">{aiAnalysis.deal_score}/10</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">Summary</p>
              <p className="mt-1 text-amber-900">{aiAnalysis.summary}</p>
            </div>
            {aiAnalysis.buyer_criteria?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">Buyer Matching Criteria</p>
                <ul className="mt-1 space-y-1 text-amber-900">
                  {aiAnalysis.buyer_criteria.map((c, i) => <li key={i}>• {c}</li>)}
                </ul>
              </div>
            )}
            {aiAnalysis.risk_factors?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-red-700">Risk Factors</p>
                <ul className="mt-1 space-y-1 text-red-900">
                  {aiAnalysis.risk_factors.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        {aiAnalysis?.error && <p className="mt-2 text-sm text-red-600">Error: {aiAnalysis.error}</p>}
      </div>

      {/* Wholesale Deals */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-light">Your Wholesale Deals</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/15 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                <th className="pb-3 pr-4">Property</th>
                <th className="pb-3 pr-4">Stage</th>
                <th className="pb-3 pr-4">Acquisition</th>
                <th className="pb-3 pr-4">ARV</th>
                <th className="pb-3 pr-4">Projected Profit</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {deals.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-black/40">No wholesale deals yet</td></tr>
              ) : deals.map((d) => (
                <tr key={d.id} className="align-top">
                  <td className="py-3 pr-4 font-medium">{d.property_id?.slice(0, 8)}…</td>
                  <td className="py-3 pr-4">{d.stage}</td>
                  <td className="py-3 pr-4">${d.acquisition_price?.toLocaleString() || "—"}</td>
                  <td className="py-3 pr-4">${d.arv?.toLocaleString() || "—"}</td>
                  <td className="py-3 pr-4 font-medium text-emerald-600">${d.projected_profit?.toLocaleString() || "—"}</td>
                  <td className="py-3"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-emerald-700">{d.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-white p-5">
      <Icon className="h-5 w-5 text-black/40" />
      <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-black/40">{label}</p>
      <p className="mt-1 font-display text-2xl font-light">{value}</p>
    </div>
  );
}