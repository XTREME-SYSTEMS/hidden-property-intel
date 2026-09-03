import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, Copy, Check, TrendingUp, AlertTriangle, Wrench } from "lucide-react";
import { money, num } from "@/lib/format";

export default function PropertyAITools({ property, isAdmin }) {
  const [tab, setTab] = useState("description");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  if (!isAdmin) return null;

  const tabs = [
    { id: "description", label: "AI Description", icon: Sparkles },
    { id: "rehab", label: "Rehab Estimator", icon: Wrench },
    { id: "predictive", label: "Predictive Score", icon: TrendingUp },
  ];

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const fn = tab === "description" ? "generatePropertyDescription"
        : tab === "rehab" ? "estimateRehabCosts"
        : "predictDistress";
      const payload = tab === "predictive" ? { property_id: property.id } : { property_id: property.id };
      const res = await base44.functions.invoke(fn, payload);
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  const copy = (text, i) => {
    navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-[#E5EDEA] sm:p-8">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[#c38a1b]" />
        <h2 className="font-display text-xl font-semibold tracking-tight">AI-Powered Tools</h2>
        <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-amber-700">Admin</span>
      </div>

      <div className="mt-4 flex gap-1 rounded-xl bg-[#F8FAF9] p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setResult(null); setError(null); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
              tab === t.id ? "bg-white text-[#1A2B22] shadow-sm" : "text-[#6B7B72] hover:text-[#1A2B22]"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-[#0F2A1D] px-5 py-2.5 text-sm text-white hover:bg-[#1A2B22] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[#c38a1b]" />}
          {loading ? "Generating…" : `Generate ${tab === "description" ? "Descriptions" : tab === "rehab" ? "Estimate" : "Prediction"}`}
        </button>
      </div>

      {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {result && tab === "description" && (
        <div className="mt-5 space-y-4">
          {result.descriptions?.map((d, i) => (
            <div key={i} className="rounded-xl border border-[#E5EDEA] p-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#F8FAF9] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-[#6B7B72]">{d.tone}</span>
                <button onClick={() => copy(d.content, i)} className="text-[#6B7B72] hover:text-[#1A2B22]">
                  {copied === i ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#1A2B22]">{d.content}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {d.seo_keywords?.map((k, j) => (
                  <span key={j} className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">{k}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {result && tab === "rehab" && (
        <div className="mt-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[#F8FAF9] p-4">
              <p className="text-[10px] uppercase tracking-widest text-[#6B7B72]">Total Estimate</p>
              <p className="mt-1 font-display text-2xl">{money(result.total_estimate)}</p>
            </div>
            <div className="rounded-xl bg-[#F8FAF9] p-4">
              <p className="text-[10px] uppercase tracking-widest text-[#6B7B72]">Cost / Sqft</p>
              <p className="mt-1 font-display text-2xl">${num(result.cost_per_sqft)}</p>
            </div>
            <div className="rounded-xl bg-[#F8FAF9] p-4">
              <p className="text-[10px] uppercase tracking-widest text-[#6B7B72]">Range</p>
              <p className="mt-1 font-display text-lg">{money(result.total_low)} – {money(result.total_high)}</p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-[#6B7B72]">
                  <th className="pb-2">Category</th><th className="pb-2 text-right">Cost</th><th className="pb-2 text-right">$/sqft</th><th className="pb-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EDEA]">
                {result.breakdown?.map((b, i) => (
                  <tr key={i} className="tabular-nums">
                    <td className="py-2.5 font-medium">{b.category}</td>
                    <td className="py-2.5 text-right">{money(b.estimated_cost)}</td>
                    <td className="py-2.5 text-right text-[#6B7B72]">${num(b.cost_per_sqft)}</td>
                    <td className="py-2.5 text-xs text-[#6B7B72]">{b.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.market_adjustment_note && <p className="mt-3 text-xs text-[#6B7B72]">{result.market_adjustment_note}</p>}
        </div>
      )}

      {result && tab === "predictive" && (
        <div className="mt-5">
          <div className="flex items-center gap-6">
            <div className="relative h-32 w-32">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#E5EDEA" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" stroke={result.distress_probability > 60 ? "#dc2626" : result.distress_probability > 30 ? "#f59e0b" : "#10b981"} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${result.distress_probability * 3.27} 327`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl">{result.distress_probability}%</span>
                <span className="text-[10px] uppercase tracking-widest text-[#6B7B72]">probability</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest text-[#6B7B72]">Risk Level</p>
              <p className="mt-1 text-lg font-semibold capitalize">{result.risk_level}</p>
              <p className="mt-1 text-xs text-[#6B7B72]">Predicted distress within {result.predicted_timeframe_days} days</p>
              <p className="mt-3 text-sm leading-relaxed text-[#1A2B22]">{result.ai_analysis}</p>
            </div>
          </div>
          {result.key_risk_factors?.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-[#6B7B72]">Key Risk Factors</p>
              {result.key_risk_factors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl bg-[#F8FAF9] p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">{f.factor} <span className="text-[#6B7B72]">({f.weight}% weight)</span></p>
                    <p className="text-xs text-[#6B7B72]">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {result.recommendation && (
            <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{result.recommendation}</div>
          )}
        </div>
      )}
    </section>
  );
}