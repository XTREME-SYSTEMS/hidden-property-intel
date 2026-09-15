import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  TrendingUp, DollarSign, Target, Mail, Activity, BarChart3, PieChart, Award, RefreshCw, ArrowRight,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#0b0b0b", "#c38a1b", "#e4b653", "#247a45", "#a6640b", "#375a7f", "#b33a31"];

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [properties, setProperties] = useState([]);
  const [investorLeads, setInvestorLeads] = useState([]);
  const [owners, setOwners] = useState([]);
  const [scrapeJobs, setScrapeJobs] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [d, p, il, o, sj] = await Promise.all([
          base44.entities.Deal.list("-created_date", 200),
          base44.entities.Property.list("-created_date", 200),
          base44.entities.InvestorLead.list("-created_date", 200),
          base44.entities.Owner.list("-created_date", 200),
          base44.entities.ScrapeJob.list("-created_date", 50),
        ]);
        setDeals(d); setProperties(p); setInvestorLeads(il); setOwners(o); setScrapeJobs(sj);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const metrics = useMemo(() => {
    const wonDeals = deals.filter(d => d.status === 'won');
    const activeDeals = deals.filter(d => d.status === 'active');
    const totalProjectedProfit = activeDeals.reduce((s, d) => s + (d.projected_profit || 0), 0);
    const totalActualProfit = wonDeals.reduce((s, d) => s + (d.actual_profit || 0), 0);
    const avgROI = activeDeals.length > 0
      ? activeDeals.reduce((s, d) => s + ((d.projected_profit / (d.acquisition_price || 1)) * 100), 0) / activeDeals.length
      : 0;
    const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;

    const contactedLeads = investorLeads.filter(l => l.outreach_status === 'contacted');
    const respondedLeads = investorLeads.filter(l => l.outreach_status === 'responded');
    const responseRate = contactedLeads.length > 0 ? (respondedLeads.length / contactedLeads.length) * 100 : 0;

    const contactedOwners = owners.filter(o => o.outreach_status === 'contacted');
    const respondedOwners = owners.filter(o => o.outreach_status === 'responded');
    const ownerResponseRate = contactedOwners.length > 0 ? (respondedOwners.length / contactedOwners.length) * 100 : 0;

    return {
      totalDeals: deals.length,
      activeDeals: activeDeals.length,
      wonDeals: wonDeals.length,
      winRate: winRate.toFixed(1),
      totalProjectedProfit,
      totalActualProfit,
      avgROI: avgROI.toFixed(1),
      totalProperties: properties.length,
      activeProperties: properties.filter(p => p.status === 'active').length,
      totalInvestorLeads: investorLeads.length,
      contactedLeads: contactedLeads.length,
      respondedLeads: respondedLeads.length,
      responseRate: responseRate.toFixed(1),
      totalOwners: owners.length,
      contactedOwners: contactedOwners.length,
      respondedOwners: respondedOwners.length,
      ownerResponseRate: ownerResponseRate.toFixed(1),
    };
  }, [deals, properties, investorLeads, owners]);

  const stageData = useMemo(() => {
    const stages = ['lead', 'underwriting', 'offer', 'contract', 'closing', 'rehab', 'exit'];
    return stages.map(stage => ({
      stage: stage.charAt(0).toUpperCase() + stage.slice(1),
      count: deals.filter(d => d.stage === stage).length,
    }));
  }, [deals]);

  const exitStrategyData = useMemo(() => {
    const strategies = ['flip', 'brrrr', 'buy_hold', 'wholesale'];
    return strategies.map(s => ({
      name: s === 'buy_hold' ? 'Buy & Hold' : s.toUpperCase(),
      count: deals.filter(d => d.exit_strategy === s).length,
    })).filter(d => d.count > 0);
  }, [deals]);

  const distressData = useMemo(() => {
    const types = ['pre-foreclosure', 'foreclosure', 'probate_inherited', 'tax_delinquent', 'code_violation', 'divorce', 'bankruptcy', 'auction', 'short_sale', 'bank_owned'];
    return types.map(t => ({
      name: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      count: properties.filter(p => p.distress_type === t).length,
    })).filter(d => d.count > 0);
  }, [properties]);

  const outreachData = useMemo(() => [
    { name: 'New', investor: investorLeads.filter(l => l.outreach_status === 'new').length, owner: owners.filter(o => o.outreach_status === 'new').length },
    { name: 'Contacted', investor: investorLeads.filter(l => l.outreach_status === 'contacted').length, owner: owners.filter(o => o.outreach_status === 'contacted').length },
    { name: 'Responded', investor: investorLeads.filter(l => l.outreach_status === 'responded').length, owner: owners.filter(o => o.outreach_status === 'responded').length },
    { name: 'Opted Out', investor: investorLeads.filter(l => l.outreach_status === 'opted_out').length, owner: owners.filter(o => o.outreach_status === 'opted_out').length },
  ], [investorLeads, owners]);

  const scrapeData = useMemo(() => {
    return scrapeJobs.slice(0, 10).map(j => ({
      name: (j.source_name || 'Unknown').substring(0, 15),
      found: j.properties_found || 0,
      new: j.properties_new || 0,
    }));
  }, [scrapeJobs]);

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-black/10 border-t-black" /></div>;
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Admin · Advanced Analytics</p>
          <h1 className="mt-2 font-display text-3xl font-light tracking-tight sm:text-4xl">Platform performance & intelligence</h1>
        </div>
        <Link to="/admin" className="inline-flex items-center gap-2 rounded-sm border border-black/15 px-4 py-2.5 text-[11px] uppercase tracking-[0.3em] hover:bg-black hover:text-white">
          <ArrowRight className="h-4 w-4 rotate-180" /> Back to Admin
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 lg:grid-cols-4">
        <MetricCard icon={Target} label="Win Rate" value={`${metrics.winRate}%`} sub={`${metrics.wonDeals} won / ${metrics.totalDeals} total`} />
        <MetricCard icon={TrendingUp} label="Avg ROI" value={`${metrics.avgROI}%`} sub="on active deals" />
        <MetricCard icon={DollarSign} label="Projected Profit" value={`$${(metrics.totalProjectedProfit / 1000).toFixed(0)}K`} sub="active pipeline" />
        <MetricCard icon={DollarSign} label="Actual Profit" value={`$${(metrics.totalActualProfit / 1000).toFixed(0)}K`} sub="closed deals" />
        <MetricCard icon={BarChart3} label="Active Properties" value={metrics.activeProperties} sub={`${metrics.totalProperties} total`} />
        <MetricCard icon={Mail} label="Investor Response" value={`${metrics.responseRate}%`} sub={`${metrics.respondedLeads}/${metrics.contactedLeads}`} />
        <MetricCard icon={Mail} label="Owner Response" value={`${metrics.ownerResponseRate}%`} sub={`${metrics.respondedOwners}/${metrics.contactedOwners}`} />
        <MetricCard icon={Activity} label="Active Deals" value={metrics.activeDeals} sub="in pipeline" />
      </div>

      {/* Deal Pipeline by Stage */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Deal Pipeline by Stage" icon={BarChart3}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e1d6" />
              <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0b0b0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Exit Strategy Distribution */}
        <ChartCard title="Exit Strategy Distribution" icon={PieChart}>
          {exitStrategyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPie>
                <Pie data={exitStrategyData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {exitStrategyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RechartsPie>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Distress Type Distribution */}
        <ChartCard title="Property Distress Types" icon={BarChart3}>
          {distressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={distressData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e1d6" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#c38a1b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Outreach Funnel */}
        <ChartCard title="Outreach Funnel (Investors vs Owners)" icon={Mail}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={outreachData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e1d6" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="investor" fill="#0b0b0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="owner" fill="#c38a1b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Scrape Performance */}
      <div className="mt-4">
        <ChartCard title="Recent Scrape Performance" icon={Activity}>
          {scrapeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={scrapeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e1d6" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="found" fill="#0b0b0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="new" fill="#247a45" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* AI Tools Quick Access */}
      <div className="mt-8 rounded-sm bg-black p-6 text-white lg:p-8">
        <h2 className="font-display text-xl font-light">AI-Powered Intelligence Tools</h2>
        <p className="mt-2 text-sm text-white/60">Newly implemented — use these to maximize platform intelligence.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AIToolCard title="Property Description Generator" desc="AI writes 3 SEO-optimized listing descriptions" function_name="generatePropertyDescription" />
          <AIToolCard title="Rehab Cost Estimator" desc="AI estimates rehab costs by category with local rates" function_name="estimateRehabCosts" />
          <AIToolCard title="Predictive Distress Scoring" desc="AI predicts distress probability in next 90 days" function_name="predictDistress" />
          <AIToolCard title="Fair Housing Audit" desc="Scan outreach for discriminatory language" function_name="auditFairHousing" />
          <AIToolCard title="Portfolio Optimizer" desc="AI recommends properties for investor portfolios" function_name="optimizePortfolio" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white p-5">
      <Icon className="h-5 w-5 text-black/40" />
      <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-black/40">{label}</p>
      <p className="mt-1 font-display text-2xl font-light">{value}</p>
      <p className="mt-1 text-xs text-black/40">{sub}</p>
    </div>
  );
}

function ChartCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-sm border border-black/10 bg-white p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-black/50" />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function EmptyChart() {
  return <div className="flex h-[280px] items-center justify-center text-sm text-black/30">No data available</div>;
}

function AIToolCard({ title, desc, function_name }) {
  return (
    <div className="rounded-sm border border-white/15 p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-xs text-white/50">{desc}</p>
      <p className="mt-2 font-mono text-[10px] text-gold">{function_name}()</p>
    </div>
  );
}