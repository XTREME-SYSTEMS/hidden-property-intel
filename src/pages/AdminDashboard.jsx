import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, FunnelChart, Funnel, LabelList
} from "recharts";
import {
  LayoutDashboard, Database, Mail, FlaskConical, Search, Cpu, FileSignature,
  TrendingUp, DollarSign, Home, Target, ArrowRight, RefreshCw, Table,
  CheckCircle2, AlertCircle, Loader2
} from "lucide-react";

const STAGE_ORDER = ["lead", "underwriting", "offer", "contract", "closing", "rehab", "exit"];
const STAGE_COLORS = {
  lead: "#94a3b8", underwriting: "#3b82f6", offer: "#8b5cf6",
  contract: "#f59e0b", closing: "#f97316", rehab: "#ec4899", exit: "#10b981"
};
const EXIT_COLORS = { flip: "#3b82f6", brrrr: "#8b5cf6", buy_hold: "#10b981", wholesale: "#f59e0b" };

const ADMIN_LINKS = [
  { to: "/admin/sources", icon: Database, label: "Data Sources", desc: "Scrape pipeline & source health" },
  { to: "/admin/outreach", icon: Mail, label: "Outreach", desc: "Investor & seller email engines" },
  { to: "/admin/test-lab", icon: FlaskConical, label: "Test Lab", desc: "Function testing sandbox" },
  { to: "/admin/architecture", icon: Cpu, label: "Architecture", desc: "System DNA & roadmap" },
  { to: "/admin/search-console", icon: Search, label: "Search Console", desc: "SEO performance & indexing" },
  { to: "/system-dna", icon: Target, label: "System DNA", desc: "Competitive benchmark" },
];

export default function AdminDashboard() {
  const [deals, setDeals] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [d, p] = await Promise.all([
          base44.entities.Deal.list("-updated_date", 500),
          base44.entities.Property.filter({ status: "active" }, "-created_date", 500)
        ]);
        setDeals(d);
        setProperties(p);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  // Deal stage distribution
  const stageData = useMemo(() => {
    const counts = STAGE_ORDER.map(stage => ({
      stage: stage.charAt(0).toUpperCase() + stage.slice(1),
      count: deals.filter(d => d.stage === stage).length,
      fill: STAGE_COLORS[stage]
    }));
    return counts;
  }, [deals]);

  // Projected ROI by exit strategy
  const roiByExit = useMemo(() => {
    const strategies = ["flip", "brrrr", "buy_hold", "wholesale"];
    return strategies.map(s => {
      const matching = deals.filter(d => d.exit_strategy === s);
      const totalProfit = matching.reduce((sum, d) => sum + (d.projected_profit || 0), 0);
      const totalAcq = matching.reduce((sum, d) => sum + (d.acquisition_price || 0), 0);
      const avgRoi = totalAcq > 0 ? (totalProfit / totalAcq) * 100 : 0;
      return {
        strategy: s.replace("_", " ").toUpperCase(),
        deals: matching.length,
        projectedProfit: totalProfit,
        avgRoi: Math.round(avgRoi),
        fill: EXIT_COLORS[s]
      };
    }).filter(d => d.deals > 0);
  }, [deals]);

  // Funnel data
  const funnelData = useMemo(() =>
    STAGE_ORDER.map(stage => ({
      name: stage.charAt(0).toUpperCase() + stage.slice(1),
      value: deals.filter(d => d.stage === stage).length,
      fill: STAGE_COLORS[stage]
    })).filter(d => d.value > 0),
  [deals]);

  // Key metrics
  const metrics = useMemo(() => {
    const activeDeals = deals.filter(d => d.status === "active");
    const totalProjected = activeDeals.reduce((s, d) => s + (d.projected_profit || 0), 0);
    const totalAcq = activeDeals.reduce((s, d) => s + (d.acquisition_price || 0), 0);
    const avgRoi = totalAcq > 0 ? (totalProjected / totalAcq) * 100 : 0;
    const wonDeals = deals.filter(d => d.status === "won");
    const actualProfit = wonDeals.reduce((s, d) => s + (d.actual_profit || 0), 0);
    return {
      totalProperties: properties.length,
      activeDeals: activeDeals.length,
      wonDeals: wonDeals.length,
      totalProjected,
      avgRoi: Math.round(avgRoi),
      actualProfit,
    };
  }, [deals, properties]);

  const handleSyncSheets = async () => {
    setSyncing(true); setSyncMsg(null);
    try {
      const res = await base44.functions.invoke("syncToGoogleSheets", {});
      if (res.data?.error) {
        setSyncMsg({ error: res.data.error });
      } else {
        setSyncMsg({
          ok: true,
          rows: res.data.rows_synced,
          url: res.data.spreadsheet_url,
          title: res.data.spreadsheet_title
        });
      }
    } catch (e) {
      setSyncMsg({ error: e.response?.data?.error || e.message });
    }
    setSyncing(false);
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-black/40">Loading admin dashboard…</div>;
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-gold" />
            <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Admin</p>
          </div>
          <h1 className="mt-2 font-display text-4xl font-light tracking-tight sm:text-5xl">Dashboard</h1>
          <p className="mt-2 text-sm text-black/50">Platform performance, deal pipeline, and data sync.</p>
        </div>
        <Link to="/" className="hidden items-center gap-2 rounded-sm border border-black/15 px-4 py-2.5 text-[11px] uppercase tracking-[0.3em] hover:bg-black hover:text-white sm:inline-flex">
          View site <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Metric cards */}
      <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Home} label="Active Properties" value={metrics.totalProperties.toLocaleString()} />
        <MetricCard icon={Target} label="Active Deals" value={metrics.activeDeals.toLocaleString()} sub={`${metrics.wonDeals} won`} />
        <MetricCard icon={DollarSign} label="Projected Profit" value={`$${(metrics.totalProjected / 1000).toFixed(0)}K`} sub={`$${(metrics.actualProfit / 1000).toFixed(0)}K realized`} />
        <MetricCard icon={TrendingUp} label="Avg Deal ROI" value={`${metrics.avgRoi}%`} />
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Deal pipeline by stage */}
        <div className="rounded-sm border border-black/10 bg-white p-6">
          <h2 className="font-display text-lg font-light">Deal pipeline by stage</h2>
          <p className="mt-1 text-xs text-black/40">Distribution of all deals across the pipeline</p>
          <div className="mt-6 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "#666" }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: "#666" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid #e5e5e5" }}
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stageData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projected ROI by exit strategy */}
        <div className="rounded-sm border border-black/10 bg-white p-6">
          <h2 className="font-display text-lg font-light">Projected ROI by exit strategy</h2>
          <p className="mt-1 text-xs text-black/40">Average projected return and total profit per strategy</p>
          {roiByExit.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-black/30">
              No deals with exit strategies yet
            </div>
          ) : (
            <div className="mt-6 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roiByExit} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="strategy" tick={{ fontSize: 10, fill: "#666" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#666" }} unit="%" />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid #e5e5e5" }}
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                    formatter={(value, name) => name === "avgRoi" ? [`${value}%`, "Avg ROI"] : [`$${value.toLocaleString()}`, name === "projectedProfit" ? "Total Profit" : name]}
                  />
                  <Bar dataKey="avgRoi" radius={[4, 4, 0, 0]}>
                    {roiByExit.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Funnel + Strategy breakdown */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Deal stage funnel */}
        <div className="rounded-sm border border-black/10 bg-white p-6 lg:col-span-1">
          <h2 className="font-display text-lg font-light">Pipeline funnel</h2>
          <p className="mt-1 text-xs text-black/40">Deal flow through stages</p>
          {funnelData.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-black/30">No deals yet</div>
          ) : (
            <div className="mt-6 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid #e5e5e5" }} />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList position="right" fill="#333" fontSize={11} stroke="none" dataKey="name" />
                    <LabelList position="center" fill="#fff" fontSize={12} stroke="none" dataKey="value" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Strategy summary table */}
        <div className="rounded-sm border border-black/10 bg-white p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-light">Strategy breakdown</h2>
          <p className="mt-1 text-xs text-black/40">Deal count, projected profit, and ROI by exit strategy</p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-black/15 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                  <th className="pb-3 pr-4">Strategy</th>
                  <th className="pb-3 pr-4 text-right">Deals</th>
                  <th className="pb-3 pr-4 text-right">Projected Profit</th>
                  <th className="pb-3 text-right">Avg ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {roiByExit.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-sm text-black/30">No deals with exit strategies assigned yet</td></tr>
                ) : roiByExit.map((s) => (
                  <tr key={s.strategy}>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-2 font-medium">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.fill }} />
                        {s.strategy}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right text-black/70">{s.deals}</td>
                    <td className="py-3 pr-4 text-right text-black/70">${s.projectedProfit.toLocaleString()}</td>
                    <td className="py-3 text-right font-medium text-emerald-600">{s.avgRoi}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Google Sheets sync */}
      <div className="mt-8 rounded-sm border border-black/10 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#0F4B3F]">
              <Table className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-lg font-light">Google Sheets sync</h2>
              <p className="mt-0.5 text-xs text-black/50">Export all active property listings to a Google Sheet for review and updates outside the admin panel.</p>
            </div>
          </div>
          <button
            onClick={handleSyncSheets}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-2.5 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-black/80 disabled:opacity-50"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? "Syncing…" : "Sync to Sheets"}
          </button>
        </div>

        {syncMsg?.error && (
          <div className="mt-4 flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Sync failed</p>
              <p className="mt-1">{syncMsg.error}</p>
            </div>
          </div>
        )}
        {syncMsg?.ok && (
          <div className="mt-4 flex items-start gap-2 rounded-sm border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{syncMsg.rows} properties synced to "{syncMsg.title}"</p>
              {syncMsg.url && (
                <a href={syncMsg.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-emerald-700 underline">
                  Open in Google Sheets <ArrowRight className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admin quick links */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-light">Admin tools</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group flex items-center gap-4 rounded-sm border border-black/10 bg-white p-5 hover:border-black/30 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-black/5">
                <link.icon className="h-5 w-5 text-black/70" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{link.label}</p>
                <p className="text-xs text-black/40">{link.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-black/30 transition group-hover:translate-x-1 group-hover:text-black/60" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white p-6">
      <Icon className="h-5 w-5 text-black/40" />
      <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-black/40">{label}</p>
      <p className="mt-1 font-display text-2xl font-light tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-black/40">{sub}</p>}
    </div>
  );
}