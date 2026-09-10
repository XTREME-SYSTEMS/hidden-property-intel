import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Home, Search, User, Calculator, Bell, FileText, Sparkles, Menu, X,
  TrendingUp, MapPin, Shield, ChevronRight, Mic, Eye, Database,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import Seo from "@/components/Seo";

const NAV = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/listings", icon: Search, label: "Listings" },
  { to: "/admin/owner-identify", icon: User, label: "Owner ID" },
  { to: "/deal-calculator", icon: Calculator, label: "Calculator" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
];

export default function PwaMobile() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState({ properties: 0, deals: 0, alerts: 0 });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    Promise.all([
      base44.entities.Property.list("-created_date", 1).catch(() => []),
      base44.entities.Deal.list("-created_date", 1).catch(() => []),
      base44.entities.DealAlert.filter({ read: false }).catch(() => []),
    ]).then(([p, d, a]) => setStats({ properties: p.length, deals: d.length, alerts: a.length }));
  }, []);

  const tools = [
    { to: "/admin/owner-identify", icon: User, label: "Owner Identification Engine", desc: "Exhaustive skip-trace & owner ID", color: "bg-blue-50 text-blue-600" },
    { to: "/listings", icon: Search, label: "Property Search", desc: "Distressed & off-market deals", color: "bg-emerald-50 text-emerald-600" },
    { to: "/deal-calculator", icon: Calculator, label: "Deal Calculator", desc: "Profit split & ROI analysis", color: "bg-amber-50 text-amber-600" },
    { to: "/admin", icon: TrendingUp, label: "Admin Dashboard", desc: "Full system control center", color: "bg-purple-50 text-purple-600" },
    { to: "/alerts", icon: Bell, label: "Deal Alerts", desc: "New matches & price drops", color: "bg-rose-50 text-rose-600" },
    { to: "/investor/dashboard", icon: Home, label: "Investor Dashboard", desc: "Your portfolio & bids", color: "bg-cyan-50 text-cyan-600" },
  ];

  const aiTools = [
    { to: "/admin", icon: Search, label: "AI Web Search", desc: "Perplexity Sonar Pro" },
    { to: "/admin", icon: Eye, label: "Vision Analysis", desc: "Gemini 3.1 Pro" },
    { to: "/admin", icon: Mic, label: "AI Voice", desc: "OpenAI TTS HD" },
    { to: "/admin", icon: Database, label: "RAG Engine", desc: "Embeddings + rerank" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5f0] pb-20">
      <Seo title="Mobile App" description="Hidden Property Intel mobile — owner ID, deal search, and AI tools on the go." path="/mobile" />
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-black/10 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-black text-[#e4b653]"><Sparkles className="h-4 w-4" /></div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-black/40">HPI Mobile</p>
            <p className="text-sm font-semibold leading-none">Hidden Property Intel</p>
          </div>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="grid h-9 w-9 place-items-center rounded-md border border-black/10">
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </header>

      {/* Slide-down menu */}
      {menuOpen && (
        <div className="fixed inset-x-0 top-[57px] z-30 border-b border-black/10 bg-white p-4 shadow-lg">
          <div className="flex items-center gap-3 rounded-lg bg-black/5 p-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-black text-white text-sm font-semibold">
              {user?.full_name?.[0] || "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.full_name || "Guest"}</p>
              <p className="truncate text-xs text-black/50">{user?.email || "Not signed in"}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-md border border-black/10 px-3 py-2.5 text-xs">
                <n.icon className="h-4 w-4 text-black/50" /> {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="px-4 pt-5">
        <div className="rounded-2xl bg-black p-5 text-white">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#e4b653]">AI-Powered Real Estate Intelligence</p>
          <h1 className="mt-2 font-display text-2xl font-light leading-tight">Find what others miss.</h1>
          <p className="mt-1.5 text-xs text-white/60">Off-market distressed properties, owner identification, and smart-contract deals — in your pocket.</p>
          <div className="mt-4 flex gap-2">
            <Link to="/listings" className="flex-1 rounded-lg bg-[#e4b653] px-3 py-2.5 text-center text-xs font-semibold text-black">Browse Deals</Link>
            <Link to="/admin/owner-identify" className="flex-1 rounded-lg border border-white/20 px-3 py-2.5 text-center text-xs font-semibold text-white">Find Owner</Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2 px-4">
        <StatCard value={stats.properties} label="Properties" icon={Home} />
        <StatCard value={stats.deals} label="Active Deals" icon={TrendingUp} />
        <StatCard value={stats.alerts} label="Alerts" icon={Bell} />
      </div>

      {/* Tools */}
      <div className="mt-6 px-4">
        <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-black/40">Tools</p>
        <div className="grid grid-cols-2 gap-3">
          {tools.map((t) => (
            <Link key={t.label} to={t.to} className="group rounded-xl border border-black/10 bg-white p-4 transition hover:border-black/30">
              <div className={`grid h-10 w-10 place-items-center rounded-lg ${t.color}`}><t.icon className="h-5 w-5" /></div>
              <p className="mt-2.5 text-sm font-semibold leading-tight">{t.label}</p>
              <p className="mt-0.5 text-[10px] text-black/45">{t.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* AI Engine */}
      <div className="mt-6 px-4">
        <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-black/40">AI Gateway Engine</p>
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#c38a1b]" />
            <p className="text-xs font-semibold">372 models · one key</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {aiTools.map((t) => (
              <Link key={t.label} to={t.to} className="flex items-center gap-2 rounded-lg bg-black/[0.03] p-2.5">
                <t.icon className="h-4 w-4 text-black/50" />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium">{t.label}</p>
                  <p className="truncate text-[9px] text-black/40">{t.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Feature */}
      <div className="mt-6 px-4">
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-semibold">Smart-Contract Escrow</p>
          </div>
          <p className="mt-1.5 text-[11px] text-black/50">Close in 7 days, not 30. Blockchain-secured, wire-fraud-proof.</p>
          <Link to="/smart-contracts" className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-black">
            Learn more <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-black/10 bg-white/95 backdrop-blur">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className="flex flex-col items-center gap-0.5 py-2.5 text-black/50">
            <n.icon className="h-5 w-5" />
            <span className="text-[9px] font-medium">{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function StatCard({ value, label, icon: Icon }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-black/40" />
      <p className="mt-1 font-display text-xl font-light">{value}</p>
      <p className="text-[9px] uppercase tracking-[0.15em] text-black/40">{label}</p>
    </div>
  );
}