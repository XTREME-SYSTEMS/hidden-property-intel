import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Loader2, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, X } from "lucide-react";

export default function DealRiskPanel({ propertyId }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const assess = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await base44.functions.invoke("assessDealRisk", { property_id: propertyId });
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  const riskColor = (level) => {
    if (!level) return "bg-gray-100 text-gray-600";
    const l = level.toLowerCase();
    if (l === "critical") return "bg-red-100 text-red-700";
    if (l === "high") return "bg-orange-100 text-orange-700";
    if (l === "medium") return "bg-amber-100 text-amber-700";
    if (l === "low") return "bg-emerald-100 text-emerald-700";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-[#E5EDEA] sm:p-8">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-[#c38a1b]" />
        <h2 className="font-display text-xl font-semibold tracking-tight">Deal Risk Intelligence</h2>
      </div>
      <p className="mt-1 text-sm text-[#6B7B72]">AI-powered risk assessment across 5 dimensions before you make an offer.</p>

      <div className="mt-4">
        <button
          onClick={assess}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-[#0F2A1D] px-5 py-2.5 text-sm text-white hover:bg-[#1A2B22] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4 text-[#c38a1b]" />}
          {loading ? "Analyzing Risk…" : "Assess Deal Risk"}
        </button>
      </div>

      {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {result && (
        <div className="mt-5 space-y-4">
          {/* Overall Score */}
          <div className="flex items-center gap-4 rounded-xl bg-[#F8FAF9] p-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: `conic-gradient(${result.overall_risk_score > 60 ? '#dc2626' : result.overall_risk_score > 30 ? '#f59e0b' : '#10b981'} ${result.overall_risk_score * 3.6}deg, #E5EDEA 0)` }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <span className="font-display text-lg">{result.overall_risk_score}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#6B7B72]">Overall Risk</p>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${riskColor(result.risk_level)}`}>{result.risk_level} risk</span>
              <p className="mt-1 text-sm text-[#1A2B22]">{result.deal_viability}</p>
            </div>
          </div>

          {/* 5 Dimensions */}
          <div className="space-y-2">
            {result.dimensions?.map((d, i) => (
              <div key={i} className="rounded-xl border border-[#E5EDEA] p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {d.score > 60 ? <AlertTriangle className="h-4 w-4 text-red-500" /> : d.score > 30 ? <TrendingDown className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    <span className="text-sm font-medium">{d.dimension}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm tabular-nums">{d.score}/100</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${riskColor(d.level)}`}>{d.level}</span>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-[#6B7B72]">{d.analysis}</p>
                <p className="mt-1 text-xs text-emerald-700"><span className="font-medium">Mitigation:</span> {d.mitigation}</p>
              </div>
            ))}
          </div>

          {result.recommendation && (
            <div className="rounded-xl bg-[#0F2A1D] p-4 text-white">
              <p className="text-[10px] uppercase tracking-widest text-white/60">AI Recommendation</p>
              <p className="mt-1 text-sm leading-relaxed">{result.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}