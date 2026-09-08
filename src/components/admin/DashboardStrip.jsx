import React from "react";
import {
  LayoutDashboard, BarChart3, Database, Mail, Users, Home, Target, Lightbulb,
  Globe, BookOpen, Blocks, Calculator, TrendingUp, Scale, Radar, Sparkles,
  Key, Phone, Mic, Calendar, Rocket, Cpu, Search, FlaskConical, Building2,
  Handshake, Stamp, Zap,
} from "lucide-react";

const DASHBOARDS = [
  { icon: Rocket, label: "Pre-Flight", color: "text-rose-600 bg-rose-50 border-rose-200" },
  { icon: BarChart3, label: "Analytics", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { icon: Database, label: "Data Sources", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { icon: Mail, label: "Outreach", color: "text-purple-600 bg-purple-50 border-purple-200" },
  { icon: Users, label: "Investors", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { icon: Home, label: "Owners", color: "text-teal-600 bg-teal-50 border-teal-200" },
  { icon: Home, label: "Probate", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { icon: Radar, label: "Shadow Cmd", color: "text-slate-600 bg-slate-50 border-slate-200" },
  { icon: Target, label: "Strategy", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { icon: Lightbulb, label: "Tricks", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { icon: BookOpen, label: "Distress Edu", color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  { icon: Radar, label: "Distress Tracker", color: "text-rose-600 bg-rose-50 border-rose-200" },
  { icon: Globe, label: "FL Sources", color: "text-lime-600 bg-lime-50 border-lime-200" },
  { icon: Blocks, label: "Contracts", color: "text-violet-600 bg-violet-50 border-violet-200" },
  { icon: Calculator, label: "Calc", color: "text-pink-600 bg-pink-50 border-pink-200" },
  { icon: TrendingUp, label: "Investor", color: "text-green-600 bg-green-50 border-green-200" },
  { icon: Home, label: "Seller", color: "text-stone-600 bg-stone-50 border-stone-200" },
  { icon: Users, label: "Agent", color: "text-sky-600 bg-sky-50 border-sky-200" },
  { icon: Building2, label: "Title/Escrow", color: "text-red-600 bg-red-50 border-red-200" },
  { icon: Handshake, label: "Wholesaler", color: "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200" },
  { icon: Stamp, label: "Notary", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { icon: Scale, label: "Legal", color: "text-gray-600 bg-gray-50 border-gray-200" },
  { icon: TrendingUp, label: "Industry", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { icon: Sparkles, label: "Eden Skye", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { icon: Key, label: "API Keys", color: "text-slate-600 bg-slate-50 border-slate-200" },
  { icon: Phone, label: "Numbers", color: "text-teal-600 bg-teal-50 border-teal-200" },
  { icon: Mic, label: "Voice", color: "text-purple-600 bg-purple-50 border-purple-200" },
  { icon: Calendar, label: "Calendar", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { icon: Cpu, label: "Architecture", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { icon: Search, label: "Search Console", color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  { icon: FlaskConical, label: "Test Lab", color: "text-violet-600 bg-violet-50 border-violet-200" },
];

// Map dashboard label to NAV_ITEMS id in AdminShell
const DASHBOARD_TO_NAV = {
  "Pre-Flight": "preflight", "Analytics": "analytics", "Data Sources": "sources",
  "Outreach": "outreach", "Investors": "investor-list", "Owners": "owner-list",
  "Probate": "probate", "Shadow Cmd": "shadow", "Strategy": "strategy",
  "Tricks": "tricks", "Distress Edu": "distress-edu", "Distress Tracker": "distress-tracker", "FL Sources": "sources",
  "Contracts": "smart-contracts", "Calc": "deal-calculator",
  "Investor": "mirror-investor", "Seller": "mirror-seller", "Agent": "agent-portal",
  "Title/Escrow": "title-escrow", "Wholesaler": "wholesaler", "Notary": "notary",
  "Legal": "legal-compliance", "Industry": "industry-intel", "Eden Skye": "eden-skye",
  "API Keys": "api-keys", "Numbers": "numbers", "Voice": "eden-voice",
  "Calendar": "calendar", "Architecture": "architecture", "Search Console": "search-console",
  "Test Lab": "test-lab",
};

export default function DashboardStrip({ onNavigate, activeId }) {
  return (
    <div className="border-b border-black/10 bg-[#0c0d0e] px-4 py-3">
      <div className="flex items-center gap-2 pb-2">
        <LayoutDashboard className="h-3.5 w-3.5 text-[#e4b653]" />
        <p className="text-[9px] uppercase tracking-[0.3em] text-white/40">Dashboard Quick Access · All Portals</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {DASHBOARDS.map(({ icon: Icon, label, color }) => {
          const navId = DASHBOARD_TO_NAV[label];
          const isActive = activeId === navId;
          return (
            <button
              key={label}
              onClick={() => onNavigate && onNavigate(navId)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-medium transition ${
                isActive
                  ? "border-[#e4b653] bg-[#e4b653]/10 text-[#e4b653]"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}