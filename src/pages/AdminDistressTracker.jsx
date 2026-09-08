import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Radar, Zap, Loader2, RefreshCw, TrendingUp, AlertTriangle, CheckCircle2, Activity } from "lucide-react";

const DISTRESS_CATEGORIES = [
  { key: "pre_foreclosure", label: "Pre-Foreclosure", icon: "🏠", fn: "scrapeProperties", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { key: "foreclosure", label: "Foreclosure", icon: "⚖️", fn: "scrapeProperties", color: "text-red-600 bg-red-50 border-red-200" },
  { key: "probate_inherited", label: "Probate / Inherited", icon: "📜", fn: "scrapeProbateRecords", color: "text-purple-600 bg-purple-50 border-purple-200" },
  { key: "tax_delinquent", label: "Tax Delinquent", icon: "💰", fn: "scrapeProperties", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { key: "code_violation", label: "Code Violations", icon: "⚠️", fn: "scrapeProperties", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { key: "divorce", label: "Divorce", icon: "💔", fn: "scrapeProperties", color: "text-pink-600 bg-pink-50 border-pink-200" },
  { key: "bankruptcy", label: "Bankruptcy", icon: "📉", fn: "scrapeProperties", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { key: "auction", label: "Auction", icon: "🔨", fn: "scrapeProperties", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { key: "short_sale", label: "Short Sale", icon: "🏷️", fn: "scrapeProperties", color: "text-teal-600 bg-teal-50 border-teal-200" },
  { key: "bank_owned", label: "Bank Owned (REO)", icon: "🏦", fn: "scrapeProperties", color: "text-slate-600 bg-slate-50 border-slate-200" },
];

export default function AdminDistressTracker() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await base44.entities.Property.filter({ status: "active" }, "-created_date", 500);
      setProperties(all);
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Count properties per distress type
  const counts = DISTRESS_CATEGORIES.map(cat => {
    const count = properties.filter(p => p.distress_type === cat.key).length;
    return { ...cat, count };
  });

  const totalTracked = properties.length;
  const totalWithDistress = properties.filter(p => p.distress_type).length;

  const runScrape = async (cat) => {
    setBusy(prev => ({ ...prev, [cat.key]: true }));
    setMsg("");
    try {
      const res = await base44.functions.invoke(cat.fn, { distress_type: cat.key, max_results: 50 });
      if (res.data?.error) setMsg(`Error: ${res.data.error}`);
      else setMsg(`Scraped ${cat.label}: found ${res.data.found || 0}, +${res.data.new || 0} new properties.`);
      await load();
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    setBusy(prev => ({ ...prev, [cat.key]: false }));
  };

  const runAllScrapes = async () => {
    setBusy(prev => ({ ...prev, all: true }));
    setMsg("Running all distress category scrapes…");
    let totalNew = 0;
    for (const cat of DISTRESS_CATEGORIES) {
      try {
        const res = await base44.functions.invoke(cat.fn, { distress_type: cat.key, max_results: 30 });
        totalNew += res.data?.new || 0;
      } catch (e) { /* skip */ }
    }
    setMsg(`All scrapes complete: ${totalNew} new properties found across ${DISTRESS_CATEGORIES.length} categories.`);
    await load();
    setBusy(prev => ({ ...prev, all: false }));
  };

  const runEnrichment = async () => {
    setBusy(prev => ({ ...prev, enrich: true }));
    setMsg("Running master enrichment on all tracked properties…");
    try {
      const res = await base44.functions.invoke("runMasterEnrichment", {});
      setMsg(res.data?.error ? `Error: ${res.data.error}` : `Enrichment complete: ${res.data.enriched || 0} properties processed.`);
      await load();
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    setBusy(prev => ({ ...prev, enrich: false }));
  };

  const runScoring = async () => {
    setBusy(prev => ({ ...prev, score: true }));
    setMsg("Scoring all active properties…");
    try {
      const res = await base44.functions.invoke("scoreAllActiveProperties", {});
      setMsg(res.data?.error ? `Error: ${res.data.error}` : `Scored ${res.data.scored || 0} properties.`);
      await load();
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    setBusy(prev => ({ ...prev, score: false }));
  };

  if (loading) return <div className="px-6 py-32 text-center text-sm text-black/50">Loading distress tracker…</div>;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="flex items-center gap-2">
        <Radar className="h-5 w-5 text-[#c38a1b]" />
        <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Distress Tracker</p>
      </div>
      <h1 className="mt-2 font-display text-3xl font-light tracking-tight">Automated Distress Tracking System</h1>
      <p className="mt-2 max-w-3xl text-sm text-black/50">
        Automatically scrapes and tracks distressed properties across all 10 distress categories.
        Each category links to its scraping engine — run individual categories or all at once,
        then enrich and score the results.
      </p>

      {/* Top metrics */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Tracked", value: totalTracked, icon: Activity, color: "text-black" },
          { label: "With Distress Type", value: totalWithDistress, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Categories Active", value: counts.filter(c => c.count > 0).length, icon: TrendingUp, color: "text-blue-600" },
          { label: "Need Attention", value: counts.filter(c => c.count === 0).length, icon: AlertTriangle, color: "text-amber-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-sm border border-black/10 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="mt-2 font-display text-2xl font-light tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Global actions */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={runAllScrapes}
          disabled={busy.all}
          className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-2.5 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50"
        >
          {busy.all ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {busy.all ? "Scraping all…" : "Scrape All Categories"}
        </button>
        <button
          onClick={runEnrichment}
          disabled={busy.enrich}
          className="inline-flex items-center gap-2 rounded-sm border border-black/15 px-5 py-2.5 text-[11px] uppercase tracking-[0.3em] text-black/70 hover:bg-black hover:text-white disabled:opacity-50"
        >
          {busy.enrich ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {busy.enrich ? "Enriching…" : "Enrich All"}
        </button>
        <button
          onClick={runScoring}
          disabled={busy.score}
          className="inline-flex items-center gap-2 rounded-sm border border-black/15 px-5 py-2.5 text-[11px] uppercase tracking-[0.3em] text-black/70 hover:bg-black hover:text-white disabled:opacity-50"
        >
          {busy.score ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
          {busy.score ? "Scoring…" : "Score All"}
        </button>
      </div>

      {msg && <p className="mt-4 rounded-sm bg-black/5 px-4 py-3 text-sm text-black/70">{msg}</p>}

      {/* Category tracking grid */}
      <div className="mt-8">
        <h2 className="font-display text-xl font-light">Distress Category Tracking</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {counts.map(cat => (
            <div key={cat.key} className={`rounded-sm border p-5 ${cat.color}`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl">{cat.icon}</span>
                <span className="font-display text-3xl font-light tabular-nums">{cat.count}</span>
              </div>
              <p className="mt-2 text-sm font-medium">{cat.label}</p>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${totalTracked > 0 ? (cat.count / totalTracked) * 100 : 0}%` }}
                />
              </div>
              <button
                onClick={() => runScrape(cat)}
                disabled={busy[cat.key]}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-sm bg-black/80 px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-white transition hover:bg-black disabled:opacity-50"
              >
                {busy[cat.key] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Radar className="h-3 w-3" />}
                {busy[cat.key] ? "Scraping…" : "Scrape Now"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent properties by distress type */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-light">Recently Tracked Properties</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                <th className="pb-3">Address</th><th className="pb-3">City</th><th className="pb-3">Distress Type</th><th className="pb-3">Score</th><th className="pb-3">Value</th><th className="pb-3">Tracked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {properties.filter(p => p.distress_type).slice(0, 30).map(p => (
                <tr key={p.id}>
                  <td className="py-3 font-medium">{p.address}</td>
                  <td className="py-3 text-black/60">{p.city}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-black/60">
                      {p.distress_type?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3">
                    {p.property_score ? (
                      <span className="font-medium tabular-nums">{Math.round(p.property_score)}</span>
                    ) : <span className="text-black/30">—</span>}
                  </td>
                  <td className="py-3 text-black/60 tabular-nums">
                    {p.estimated_value ? `$${(p.estimated_value / 1000).toFixed(0)}K` : "—"}
                  </td>
                  <td className="py-3 text-black/50">{new Date(p.created_date).toLocaleDateString()}</td>
                </tr>
              ))}
              {properties.filter(p => p.distress_type).length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-black/40">No distressed properties tracked yet. Run a scrape to start tracking.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}