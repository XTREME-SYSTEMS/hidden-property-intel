import React from "react";
import {
  LayoutDashboard, BarChart3, Database, Mail, Users, Home, Target, Lightbulb,
  Globe, BookOpen, Blocks, Calculator, TrendingUp, Scale, Radar, Sparkles,
  Key, Phone, Mic, Calendar, Rocket, Cpu, Search, FlaskConical, Building2,
  Handshake, Stamp,
} from "lucide-react";

// Grouped by workflow stage — mirrors the sidebar categories in AdminShell.
const GROUPS = [
  {
    label: "Command",
    items: [
      { icon: Rocket, label: "Pre-Flight", nav: "preflight" },
      { icon: BarChart3, label: "Analytics", nav: "analytics" },
      { icon: TrendingUp, label: "Comparison", nav: "comparison" },
    ],
  },
  {
    label: "Sourcing",
    items: [
      { icon: Database, label: "Data Sources", nav: "sources" },
      { icon: Globe, label: "FL Sources", nav: "sources-directory" },
      { icon: Radar, label: "Distress Tracker", nav: "distress-tracker" },
      { icon: Radar, label: "Shadow Cmd", nav: "shadow" },
      { icon: Home, label: "Probate", nav: "probate" },
      { icon: Home, label: "Owners", nav: "owner-list" },
      { icon: BookOpen, label: "Distress Edu", nav: "distress-edu" },
    ],
  },
  {
    label: "Analysis",
    items: [
      { icon: Calculator, label: "Calculator", nav: "deal-calculator" },
      { icon: Target, label: "Strategy", nav: "strategy" },
      { icon: Lightbulb, label: "Tricks", nav: "tricks" },
      { icon: TrendingUp, label: "Industry", nav: "industry-intel" },
    ],
  },
  {
    label: "Investors",
    items: [
      { icon: Users, label: "Investor Cmd", nav: "investor-command" },
      { icon: Users, label: "Investor List", nav: "investor-list" },
      { icon: TrendingUp, label: "Investor Mirror", nav: "mirror-investor" },
      { icon: Handshake, label: "Wholesaler", nav: "wholesaler" },
    ],
  },
  {
    label: "Outreach",
    items: [
      { icon: Mail, label: "Outreach", nav: "outreach" },
      { icon: Mail, label: "Email Gallery", nav: "email-gallery" },
      { icon: Mic, label: "Voice", nav: "eden-voice" },
      { icon: Phone, label: "Numbers", nav: "numbers" },
      { icon: Calendar, label: "Calendar", nav: "calendar" },
    ],
  },
  {
    label: "Closing",
    items: [
      { icon: Blocks, label: "Contracts", nav: "smart-contracts" },
      { icon: Building2, label: "Title/Escrow", nav: "title-escrow" },
      { icon: Stamp, label: "Notary", nav: "notary" },
      { icon: Scale, label: "Legal", nav: "legal-compliance" },
      { icon: Users, label: "Agent", nav: "agent-portal" },
      { icon: Home, label: "Seller", nav: "mirror-seller" },
    ],
  },
  {
    label: "System",
    items: [
      { icon: Cpu, label: "Architecture", nav: "architecture" },
      { icon: Search, label: "Search Console", nav: "search-console" },
      { icon: FlaskConical, label: "Test Lab", nav: "test-lab" },
      { icon: Key, label: "API Keys", nav: "api-keys" },
      { icon: Sparkles, label: "Eden Skye", nav: "eden-skye" },
    ],
  },
];

export default function DashboardStrip({ onNavigate, activeId }) {
  return (
    <div className="border-b border-white/10 bg-[#0c0d0e] px-4 py-2.5">
      <div className="flex items-center gap-2 pb-2">
        <LayoutDashboard className="h-3.5 w-3.5 text-[#e4b653]" />
        <p className="text-[9px] uppercase tracking-[0.3em] text-white">Quick Access</p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {GROUPS.map((group) => (
          <div key={group.label} className="flex shrink-0 items-stretch gap-2">
            <span className="flex items-center pr-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/80">
              {group.label}
            </span>
            <div className="flex gap-1.5">
              {group.items.map(({ icon: Icon, label, nav }) => {
                const isActive = activeId === nav;
                return (
                  <button
                    key={label}
                    onClick={() => onNavigate && onNavigate(nav)}
                    className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] font-medium transition whitespace-nowrap ${
                      isActive
                        ? "border-[#e4b653] bg-[#e4b653]/10 text-[#e4b653]"
                        : "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-3 w-3 shrink-0" />
                    {label}
                  </button>
                );
              })}
            </div>
            <span className="ml-1 w-px self-stretch bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}