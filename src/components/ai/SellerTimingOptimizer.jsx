import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Clock, Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { money } from "@/lib/format";

export default function SellerTimingOptimizer({ propertyId }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyze = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await base44.functions.invoke("optimizeSellerTiming", { property_id: propertyId });
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  if (!propertyId) return null;

  return (
    <div className="rounded-sm border border-black/10 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#c38a1b]" />
          <h2 className="font-display text-2xl font-light">AI Seller Timing Optimizer</h2>
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2.5 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5 text-[#c38a1b]" />}
          {loading ? "Analyzing…" : "When to Sell"}
        </button>
      </div>
      <p className="mt-2 text-sm text-black/50">AI analyzes market trends, seasonality, and your property's distress type to recommend the optimal selling time.</p>

      {error && <div className="mt-4 rounded-sm bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {result && (
        <div className="mt-5 space-y-4">
          {/* Market condition badge */}
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              result.market_condition?.toLowerCase().includes("seller") ? "bg-emerald-100 text-emerald-700" :
              result.market_condition?.toLowerCase().includes("buyer") ? "bg-amber-100 text-amber-700" :
              "bg-gray-100 text-gray-700"
            }`}>{result.market_condition}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              result.urgency_level === "high" ? "bg-red-100 text-red-700" :
              result.urgency_level === "medium" ? "bg-amber-100 text-amber-700" :
              "bg-emerald-100 text-emerald-700"
            }`}>Urgency: {result.urgency_level}</span>
          </div>

          {/* Price projections */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-sm border border-black/10 p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Sell Now</p>
              <p className="mt-1 font-display text-xl">{money(result.sell_now_price)}</p>
            </div>
            <div className="rounded-sm border border-amber-200 bg-amber-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">Wait 3 Months</p>
              <p className="mt-1 font-display text-xl text-amber-800">{money(result.wait_3_month_price)}</p>
              {result.wait_3_month_price > result.sell_now_price && (
                <p className="text-xs text-emerald-600 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +{((result.wait_3_month_price - result.sell_now_price) / result.sell_now_price * 100).toFixed(1)}%</p>
              )}
            </div>
            <div className="rounded-sm border border-black/10 p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Wait 6 Months</p>
              <p className="mt-1 font-display text-xl">{money(result.wait_6_month_price)}</p>
              {result.wait_6_month_price < result.wait_3_month_price && (
                <p className="text-xs text-red-600 flex items-center gap-1"><TrendingDown className="h-3 w-3" /> -{((result.wait_3_month_price - result.wait_6_month_price) / result.wait_3_month_price * 100).toFixed(1)}%</p>
              )}
            </div>
          </div>

          {/* Recommendation */}
          <div className="rounded-sm bg-[#0F2A1D] p-4 text-white">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">AI Recommendation</p>
            <p className="mt-1 font-display text-lg">{result.optimal_timing}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/80">{result.recommendation}</p>
          </div>

          {/* Key factors */}
          {result.key_factors?.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-black/40">Key Factors</p>
              <ul className="space-y-1.5">
                {result.key_factors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-black/60">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#c38a1b]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk of waiting */}
          {result.risk_of_waiting && (
            <div className="flex items-start gap-2 rounded-sm bg-amber-50 p-3 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p><span className="font-medium">Risk of waiting:</span> {result.risk_of_waiting}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}