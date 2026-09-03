import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Trophy, TrendingUp, DollarSign, Target, Award, ArrowRight } from "lucide-react";

export default function InvestorLeaderboard() {
  const [loading, setLoading] = useState(true);
  const [investors, setInvestors] = useState([]);
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [inv, dls] = await Promise.all([
          base44.entities.Investor.list("-created_date", 100),
          base44.entities.Deal.list("-created_date", 500),
        ]);
        setInvestors(inv); setDeals(dls);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const leaderboard = useMemo(() => {
    return investors.map(inv => {
      const investorDeals = deals.filter(d => d.user_id === inv.user_id);
      const wonDeals = investorDeals.filter(d => d.status === 'won');
      const totalProfit = wonDeals.reduce((s, d) => s + (d.actual_profit || 0), 0);
      const avgROI = wonDeals.length > 0
        ? wonDeals.reduce((s, d) => s + ((d.actual_profit || 0) / (d.acquisition_price || 1) * 100), 0) / wonDeals.length
        : 0;
      return {
        ...inv,
        deals_closed: wonDeals.length,
        total_profit: totalProfit,
        avg_roi: avgROI,
        active_deals: investorDeals.filter(d => d.status === 'active').length,
      };
    }).sort((a, b) => b.total_profit - a.total_profit).slice(0, 20);
  }, [investors, deals]);

  const dealOfMonth = useMemo(() => {
    const wonDeals = deals.filter(d => d.status === 'won' && d.actual_profit);
    if (wonDeals.length === 0) return null;
    return wonDeals.reduce((best, d) => {
      const roi = (d.actual_profit / (d.acquisition_price || 1)) * 100;
      const bestRoi = best ? (best.actual_profit / (best.acquisition_price || 1)) * 100 : -1;
      return roi > bestRoi ? d : best;
    }, null);
  }, [deals]);

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-black/10 border-t-black" /></div>;
  }

  const medalColor = (i) => i === 0 ? "bg-amber-400" : i === 1 ? "bg-gray-300" : i === 2 ? "bg-amber-700" : "bg-black/10";
  const medalText = (i) => i === 0 ? "text-black" : i === 1 ? "text-black" : i === 2 ? "text-white" : "text-black/50";

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 lg:px-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Investor Leaderboard</p>
          <h1 className="mt-2 font-display text-3xl font-light tracking-tight sm:text-4xl">Top performers</h1>
        </div>
        <Link to="/investor/dashboard" className="inline-flex items-center gap-2 rounded-sm border border-black/15 px-4 py-2.5 text-[11px] uppercase tracking-[0.3em] hover:bg-black hover:text-white">
          <ArrowRight className="h-4 w-4 rotate-180" /> Dashboard
        </Link>
      </div>

      {/* Deal of the Month */}
      {dealOfMonth && (
        <div className="mt-8 overflow-hidden rounded-sm border border-black/10 bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-5 py-3">
            <Award className="h-5 w-5 text-amber-600" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">Deal of the Month</p>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-xl">{dealOfMonth.exit_strategy?.toUpperCase() || 'Deal'}</p>
                <p className="text-sm text-black/50">Acquisition: ${dealOfMonth.acquisition_price?.toLocaleString()} → ARV: ${dealOfMonth.arv?.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Profit</p>
                <p className="font-display text-2xl text-emerald-600">${dealOfMonth.actual_profit?.toLocaleString()}</p>
                <p className="text-xs text-emerald-600">{((dealOfMonth.actual_profit / (dealOfMonth.acquisition_price || 1)) * 100).toFixed(0)}% ROI</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 0, 2].map((idx) => {
            const inv = leaderboard[idx];
            if (!inv) return <div key={idx} />;
            const place = idx + 1;
            return (
              <div key={idx} className={`rounded-sm border p-5 text-center ${idx === 0 ? 'border-amber-300 bg-amber-50 order-2' : 'border-black/10 bg-white order-first sm:order-none'}`}>
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${medalColor(idx)} ${medalText(idx)}`}>
                  <Trophy className="h-7 w-7" />
                </div>
                <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-black/40">#{place}</p>
                <p className="mt-1 font-display text-lg">{inv.name}</p>
                <p className="text-sm text-emerald-600">${inv.total_profit.toLocaleString()}</p>
                <p className="text-xs text-black/40">{inv.deals_closed} deals · {inv.avg_roi.toFixed(0)}% avg ROI</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="mt-8 overflow-x-auto rounded-sm border border-black/10">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/15 bg-black/5 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Investor</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3 text-right">Deals Closed</th>
              <th className="px-4 py-3 text-right">Total Profit</th>
              <th className="px-4 py-3 text-right">Avg ROI</th>
              <th className="px-4 py-3 text-right">Active Deals</th>
              <th className="px-4 py-3">Plan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {leaderboard.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-black/40">No investor data yet. Deals will appear here once investors start closing deals.</td></tr>
            ) : leaderboard.map((inv, i) => (
              <tr key={inv.id || i} className="hover:bg-black/5">
                <td className="px-4 py-3">
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${medalColor(i)} ${medalText(i)}`}>{i + 1}</span>
                </td>
                <td className="px-4 py-3 font-medium">{inv.name}</td>
                <td className="px-4 py-3 text-black/60">{inv.company || '—'}</td>
                <td className="px-4 py-3 text-right">{inv.deals_closed}</td>
                <td className="px-4 py-3 text-right font-medium text-emerald-600">${inv.total_profit.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{inv.avg_roi.toFixed(0)}%</td>
                <td className="px-4 py-3 text-right text-black/60">{inv.active_deals}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em]">{inv.subscription_plan || '—'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}