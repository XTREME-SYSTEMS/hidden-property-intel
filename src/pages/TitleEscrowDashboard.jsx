import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Building2, FileText, ShieldCheck, DollarSign, Brain, Loader2,
  AlertTriangle, CheckCircle2, Clock, ArrowRight, Scale, Home,
} from "lucide-react";

export default function TitleEscrowDashboard() {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [titleRisks, setTitleRisks] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [dealList, contractList, riskList] = await Promise.all([
          base44.entities.Deal.filter({ stage: "closing" }, "-created_date", 20),
          base44.entities.SmartContract.filter({ status: "deployed" }, "-created_date", 20),
          base44.entities.TitleRisk.list("-created_date", 20),
        ]);
        setDeals(dealList);
        setContracts(contractList);
        setTitleRisks(riskList);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const runAiTitleReview = async () => {
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a title and escrow AI assistant for a real estate investment platform. Review the following closing pipeline data and provide:
1. A summary of closing readiness for each deal
2. Title risk assessment for properties with title issues
3. Escrow fund status verification
4. Recommended actions to expedite closings
5. Any legal or compliance flags

Closing deals: ${JSON.stringify(deals.map(d => ({ id: d.id, stage: d.stage, acquisition_price: d.acquisition_price, target_close: d.target_close_date })))}

Deployed contracts: ${JSON.stringify(contracts.map(c => ({ id: c.id, status: c.status, contract_type: c.contract_type, terms: c.terms })))}

Title risks: ${JSON.stringify(titleRisks.map(r => ({ id: r.id, property_id: r.property_id, risk_level: r.risk_level, issues: r.issues })))}

Provide a structured, actionable response for a title/escrow officer.`,
        response_json_schema: {
          type: "object",
          properties: {
            closing_readiness: { type: "array", items: { type: "object", properties: { deal_id: { type: "string" }, readiness: { type: "string" }, status: { type: "string" } } } },
            title_risks: { type: "array", items: { type: "object", properties: { property_id: { type: "string" }, risk_level: { type: "string" }, recommendation: { type: "string" } } } },
            escrow_status: { type: "string" },
            recommended_actions: { type: "array", items: { type: "string" } },
            compliance_flags: { type: "array", items: { type: "string" } },
            overall_summary: { type: "string" }
          }
        }
      });
      setAiAnalysis(res);
    } catch (e) { setAiAnalysis({ error: e.message }); }
    setAiLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-sm text-black/40">Loading title & escrow dashboard…</div>;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-[#c38a1b]" />
        <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Title & Escrow Dashboard</p>
      </div>
      <h1 className="mt-2 font-display text-3xl font-light tracking-tight">Closing Pipeline & Title Risk Management</h1>
      <p className="mt-2 max-w-3xl text-sm text-black/50">
        Manage closings, title searches, escrow funds, and deed recording. AI reviews your pipeline for readiness and risk.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 lg:grid-cols-4">
        <Stat icon={Clock} label="Closings in Progress" value={deals.length} />
        <Stat icon={ShieldCheck} label="Deployed Contracts" value={contracts.length} />
        <Stat icon={AlertTriangle} label="Title Risks" value={titleRisks.length} />
        <Stat icon={DollarSign} label="Total Escrow Value" value={`$${contracts.reduce((s, c) => s + (c.terms?.earnest_money || 0), 0).toLocaleString()}`} />
      </div>

      {/* AI Title Review */}
      <div className="mt-8 rounded-sm border border-[#c38a1b]/30 bg-amber-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#c38a1b]" />
            <h2 className="font-display text-lg font-light">AI Title & Closing Review</h2>
          </div>
          <button onClick={runAiTitleReview} disabled={aiLoading} className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            {aiLoading ? "Analyzing…" : "Run AI Review"}
          </button>
        </div>
        {aiAnalysis && !aiAnalysis.error && (
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">Overall Summary</p>
              <p className="mt-1 text-amber-900">{aiAnalysis.overall_summary}</p>
            </div>
            {aiAnalysis.escrow_status && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">Escrow Status</p>
                <p className="mt-1 text-amber-900">{aiAnalysis.escrow_status}</p>
              </div>
            )}
            {aiAnalysis.recommended_actions?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">Recommended Actions</p>
                <ul className="mt-1 space-y-1 text-amber-900">
                  {aiAnalysis.recommended_actions.map((a, i) => <li key={i}>• {a}</li>)}
                </ul>
              </div>
            )}
            {aiAnalysis.compliance_flags?.length > 0 && (
              <div className="rounded-sm border border-red-200 bg-red-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-red-700">Compliance Flags</p>
                <ul className="mt-1 space-y-1 text-red-900">
                  {aiAnalysis.compliance_flags.map((f, i) => <li key={i}>• {f}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        {aiAnalysis?.error && <p className="mt-2 text-sm text-red-600">Error: {aiAnalysis.error}</p>}
      </div>

      {/* Closing Pipeline */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-light">Closing Pipeline</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/15 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                <th className="pb-3 pr-4">Deal</th>
                <th className="pb-3 pr-4">Stage</th>
                <th className="pb-3 pr-4">Acquisition Price</th>
                <th className="pb-3 pr-4">Target Close</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {deals.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-black/40">No closings in progress</td></tr>
              ) : deals.map((d) => (
                <tr key={d.id} className="align-top">
                  <td className="py-3 pr-4 font-medium">{d.property_id?.slice(0, 8)}…</td>
                  <td className="py-3 pr-4"><span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-amber-700">{d.stage}</span></td>
                  <td className="py-3 pr-4">${d.acquisition_price?.toLocaleString() || "—"}</td>
                  <td className="py-3 pr-4">{d.target_close_date || "—"}</td>
                  <td className="py-3"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-emerald-700">{d.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Title Risks */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-light">Title Risks</h2>
        <div className="mt-4 space-y-2">
          {titleRisks.length === 0 ? (
            <div className="rounded-sm border border-black/10 p-6 text-center text-sm text-black/40">No title risks identified</div>
          ) : titleRisks.map((r) => (
            <div key={r.id} className="rounded-sm border border-black/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-black/60" />
                  <p className="font-medium">Property: {r.property_id?.slice(0, 8)}…</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-white ${r.risk_level === "high" ? "bg-red-600" : r.risk_level === "medium" ? "bg-amber-500" : "bg-emerald-600"}`}>{r.risk_level || "unknown"}</span>
              </div>
              {r.issues && <p className="mt-2 text-sm text-black/60">{JSON.stringify(r.issues)}</p>}
            </div>
          ))}
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