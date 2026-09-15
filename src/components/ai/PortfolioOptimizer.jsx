import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, TrendingUp, Target } from "lucide-react";
import { money } from "@/lib/format";

export default function PortfolioOptimizer({ investor }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const optimize = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const u = await base44.auth.me();
      const res = await base44.functions.invoke("optimizePortfolio", { investor_id: u.id });
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  return (
    <div className="rounded-sm border border-black/10 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#c38a1b]" />
          <h2 className="font-display text-2xl font-light">AI Portfolio Optimizer</h2>
        </div>
        <button
          onClick={optimize}
          disabled={loading || !investor}
          className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2.5 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-[#c38a1b]" />}
          {loading ? "Analyzing…" : "Optimize My Portfolio"}
        </button>
      </div>

      {!investor && <p className="mt-3 text-sm text-black/50">Complete your investor profile to get AI-powered portfolio recommendations.</p>}

      {error && <div className="mt-4 rounded-sm bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {result && (
        <div className="mt-5 space-y-5">
          {/* Portfolio Analysis */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-sm bg-[#F8FAF9] p-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Diversification Score</p>
              <p className="mt-1 font-display text-2xl">{result.diversification_score}/100</p>
            </div>
            <div className="rounded-sm bg-[#F8FAF9] p-4 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Portfolio Analysis</p>
              <p className="mt-1 text-sm leading-relaxed text-black/60">{result.portfolio_analysis}</p>
            </div>
          </div>

          {result.risk_assessment && (
            <div className="rounded-sm bg-amber-50 p-3 text-sm text-amber-800">
              <span className="font-medium">Risk Assessment:</span> {result.risk_assessment}
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-sm font-medium"><Target className="h-4 w-4 text-[#c38a1b]" /> AI-Recommended Properties</p>
              <div className="space-y-3">
                {result.recommendations.map((r, i) => (
                  <div key={i} className="rounded-sm border border-black/10 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <Link to={`/properties/${r.address}`} className="font-display text-base hover:underline">{r.address}</Link>
                        <p className="mt-1 text-xs leading-relaxed text-black/60">{r.reasoning}</p>
                        <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-black/40">Gap filled: {r.portfolio_gap_filled}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Est. ROI</p>
                        <p className="font-display text-lg text-emerald-600">{r.projected_roi?.toFixed(0)}%</p>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] uppercase tracking-widest ${
                          r.risk_level === "low" ? "bg-emerald-100 text-emerald-700" :
                          r.risk_level === "medium" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>{r.risk_level} risk</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}