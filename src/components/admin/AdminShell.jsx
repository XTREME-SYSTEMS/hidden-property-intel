import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Database, Mail, FlaskConical, Search, Cpu, Target, Users, Home, Blocks, Calculator, Scale, TrendingUp, BarChart3,
  ArrowRight, X, ArrowLeft, Lightbulb, BookOpen, Globe, Building2, Handshake, Stamp, Radar, Sparkles, Key, Phone, Mic, Calendar, Rocket, ExternalLink,
  ChevronDown, Compass, Briefcase, FileSignature, Wrench, Network, Menu
} from "lucide-react";
import AdminOverview from "@/components/admin/AdminOverview";
import WorkflowCreator from "@/components/admin/WorkflowCreator";
import AdminCommandBar from "@/components/admin/AdminCommandBar";
import EdenBubble from "@/components/admin/EdenBubble";
import InvestorCommandCenter from "@/components/admin/InvestorCommandCenter";
import CompetitiveComparison from "@/components/admin/CompetitiveComparison";
import AdminDistressTracker from "@/pages/AdminDistressTracker";
import AdminSources from "@/pages/AdminSources";
import AdminOutreach from "@/pages/AdminOutreach";
import AdminTestLab from "@/pages/AdminTestLab";
import AdminArchitecture from "@/pages/AdminArchitecture";
import AdminSearchConsole from "@/pages/AdminSearchConsole";
import AdminInvestorList from "@/pages/AdminInvestorList";
import AdminOwnerList from "@/pages/AdminOwnerList";
import AdminSmartContracts from "@/pages/AdminSmartContracts";
import DealCalculator from "@/pages/DealCalculator";
import AgentDashboard from "@/pages/AgentDashboard";
import InvestorDashboard from "@/pages/InvestorDashboard";
import SellerDashboard from "@/pages/SellerDashboard";
import AdminCapabilities from "@/pages/AdminCapabilities";
import SystemDNA from "@/pages/SystemDNA";
import LegalCompliance from "@/pages/LegalCompliance";
import IndustryIntelligence from "@/pages/IndustryIntelligence";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminProbateDashboard from "@/pages/AdminProbateDashboard";
import AdminStrategy from "@/pages/AdminStrategy";
import AdminTricksOfTrade from "@/pages/AdminTricksOfTrade";
import AdminSourcesDirectory from "@/pages/AdminSourcesDirectory";
import AdminDistressEducation from "@/pages/AdminDistressEducation";
import ShadowCommandCenter from "@/pages/ShadowCommandCenter";
import EdenSkyeProfile from "@/pages/EdenSkyeProfile";
import EmailTemplateGallery from "@/pages/EmailTemplateGallery";
import TitleEscrowDashboard from "@/pages/TitleEscrowDashboard";
import WholesalerDashboard from "@/pages/WholesalerDashboard";
import NotaryDashboard from "@/pages/NotaryDashboard";
import PropertyManagerDashboard from "@/pages/PropertyManagerDashboard";
import AdminSystemTest from "@/pages/AdminSystemTest";
import AdminApiKeys from "@/pages/AdminApiKeys";
import AdminNumbers from "@/pages/AdminNumbers";
import AdminEdenVoice from "@/pages/AdminEdenVoice";
import AdminCalendar from "@/pages/AdminCalendar";
import AdminPreflight from "@/pages/AdminPreflight";

/**
 * Full-page, vertically-scrolling admin dashboard.
 * Desktop: sticky left sidebar (workflow categories) + scrolling main column.
 * Mobile: top bar + bottom tab navigation (PWA-style).
 */
const CATEGORIES = [
  {
    id: "command", label: "Command Center", icon: Compass,
    items: [
      { id: "overview", icon: LayoutDashboard, label: "Dashboard", desc: "Metrics & pipeline", component: null },
      { id: "comparison", icon: TrendingUp, label: "Competitive Comparison", desc: "Traditional vs tech vs HPI", component: CompetitiveComparison },
      { id: "preflight", icon: Rocket, label: "Pre-Flight Audit", desc: "End-to-end system score", component: AdminPreflight },
    ],
  },
  {
    id: "sourcing", label: "Sourcing & Acquisition", icon: Radar,
    items: [
      { id: "sources", icon: Database, label: "Data Sources", desc: "Scrape pipeline", component: AdminSources },
      { id: "sources-directory", icon: Globe, label: "Sources Directory", desc: "Every data source online", component: AdminSourcesDirectory },
      { id: "distress-tracker", icon: Radar, label: "Distress Tracker", desc: "Automated tracking", component: AdminDistressTracker },
      { id: "distress-edu", icon: BookOpen, label: "Distress Education", desc: "Causes & warning signs", component: AdminDistressEducation },
      { id: "shadow", icon: Radar, label: "Shadow Command", desc: "Autonomous intelligence", component: ShadowCommandCenter },
      { id: "probate", icon: Home, label: "Probate Pipeline", desc: "Deceased owners & heirs", component: AdminProbateDashboard },
      { id: "owner-list", icon: Home, label: "Owner List", desc: "Owners & next of kin", component: AdminOwnerList },
    ],
  },
  {
    id: "analysis", label: "Analysis & Underwriting", icon: Target,
    items: [
      { id: "deal-calculator", icon: Calculator, label: "Deal Calculator", desc: "Profit split & fairness", component: DealCalculator },
      { id: "analytics", icon: BarChart3, label: "Analytics", desc: "Performance & intelligence", component: AdminAnalytics },
      { id: "industry-intel", icon: TrendingUp, label: "Industry Intel", desc: "Financial & market intel", component: IndustryIntelligence },
      { id: "strategy", icon: Target, label: "Strategy Playbook", desc: "Acquisition & exit strategies", component: AdminStrategy },
      { id: "tricks", icon: Lightbulb, label: "Tricks of the Trade", desc: "Insider secrets & niches", component: AdminTricksOfTrade },
    ],
  },
  {
    id: "investors", label: "Investors & Capital", icon: Briefcase,
    items: [
      { id: "investor-command", icon: Users, label: "Investor Command Center", desc: "Multi-channel comms + AI intel", component: InvestorCommandCenter },
      { id: "investor-list", icon: Users, label: "Investor List (legacy)", desc: "Basic leads & outreach", component: AdminInvestorList },
      { id: "mirror-investor", icon: TrendingUp, label: "Investor Mirror", desc: "View investor dashboard", component: InvestorDashboard },
      { id: "wholesaler", icon: Handshake, label: "Wholesaler Portal", desc: "Deal assignment & buyers", component: WholesalerDashboard },
    ],
  },
  {
    id: "outreach", label: "Outreach & Comms", icon: Mail,
    items: [
      { id: "outreach", icon: Mail, label: "Outreach", desc: "Email engines", component: AdminOutreach },
      { id: "email-gallery", icon: Mail, label: "Email Gallery", desc: "Template gallery & QA", component: EmailTemplateGallery },
      { id: "eden-voice", icon: Mic, label: "Eden Voice", desc: "AI voice config", component: AdminEdenVoice },
      { id: "numbers", icon: Phone, label: "Number Gateway", desc: "Import & provision numbers", component: AdminNumbers },
      { id: "calendar", icon: Calendar, label: "Calendar Sync", desc: "Google Calendar scheduling", component: AdminCalendar },
    ],
  },
  {
    id: "contracts", label: "Contracts & Closing", icon: FileSignature,
    items: [
      { id: "smart-contracts", icon: Blocks, label: "Smart Contracts", desc: "On-chain escrow", component: AdminSmartContracts },
      { id: "title-escrow", icon: Building2, label: "Title & Escrow", desc: "Closing & title risk", component: TitleEscrowDashboard },
      { id: "notary", icon: Stamp, label: "Notary Portal", desc: "Digital signature mgmt", component: NotaryDashboard },
      { id: "legal-compliance", icon: Scale, label: "Legal Compliance", desc: "FL & federal regulations", component: LegalCompliance },
      { id: "agent-portal", icon: Users, label: "Agent Portal", desc: "Licensed agent tools", component: AgentDashboard },
    ],
  },
  {
    id: "management", label: "Property Management", icon: Wrench,
    items: [
      { id: "property-mgr", icon: Home, label: "Property Manager", desc: "Portfolio & maintenance", component: PropertyManagerDashboard },
      { id: "mirror-seller", icon: Home, label: "Seller Mirror", desc: "View seller dashboard", component: SellerDashboard },
    ],
  },
  {
    id: "system", label: "System & Intelligence", icon: Network,
    items: [
      { id: "architecture", icon: Cpu, label: "Architecture", desc: "System DNA & roadmap", component: AdminArchitecture },
      { id: "system-dna", icon: Target, label: "System DNA", desc: "Competitive benchmark", component: SystemDNA },
      { id: "system-test", icon: Cpu, label: "System Test Engine", desc: "Autonomous test & score", component: AdminSystemTest },
      { id: "test-lab", icon: FlaskConical, label: "Test Lab", desc: "Full system test suite", component: AdminTestLab },
      { id: "search-console", icon: Search, label: "Search Console", desc: "SEO indexing", component: AdminSearchConsole },
      { id: "api-keys", icon: Key, label: "API Keys", desc: "Gateway auth tokens", component: AdminApiKeys },
      { id: "eden-skye", icon: Sparkles, label: "Eden Skye", desc: "AI agent profile & chat", component: EdenSkyeProfile },
      { id: "capabilities", icon: Target, label: "Capabilities", desc: "Capability map & prompts", component: AdminCapabilities },
    ],
  },
];

const ALL_ITEMS = CATEGORIES.flatMap(c => c.items.map(i => ({ ...i, catId: c.id })));

// Mobile bottom-nav shortcuts (5 keys + "More" opens drawer)
const MOBILE_NAV = [
  { id: "overview", icon: LayoutDashboard, label: "Home" },
  { id: "sources", icon: Database, label: "Source" },
  { id: "investor-command", icon: Users, label: "Invest" },
  { id: "smart-contracts", icon: Blocks, label: "Close" },
  { id: "analytics", icon: BarChart3, label: "Stats" },
];

export default function AdminShell() {
  const [activeId, setActiveId] = useState("overview");
  const [history, setHistory] = useState([]);
  const [collapsed, setCollapsed] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sidebarRef = useRef(null);

  const activeItem = ALL_ITEMS.find((n) => n.id === activeId);
  const ActiveComponent = activeItem?.component;
  const canGoBack = history.length > 0;

  const selectTool = (id) => {
    if (id === activeId) { setDrawerOpen(false); return; }
    setHistory((prev) => [...prev, activeId]);
    setActiveId(id);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goBack = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setActiveId(prev);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleCat = (catId) => setCollapsed(prev => ({ ...prev, [catId]: !prev[catId] }));

  const SidebarContent = () => (
    <nav ref={sidebarRef} className="px-3 py-3">
      {CATEGORIES.map(cat => {
        const isCollapsed = collapsed[cat.id];
        const hasActive = cat.items.some(i => i.id === activeId);
        return (
          <div key={cat.id} className="mb-2">
            <button
              onClick={() => toggleCat(cat.id)}
              className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${hasActive ? "text-[#e4b653]" : "text-white hover:bg-white/5"}`}
            >
              <cat.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-xs font-semibold uppercase tracking-[0.14em]">{cat.label}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
            </button>
            {!isCollapsed && (
              <div className="mb-2 ml-2 mt-1 space-y-1 border-l border-white/10 pl-3">
                {cat.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => selectTool(item.id)}
                    className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition ${
                      activeId === item.id ? "bg-white/10 text-[#e4b653]" : "text-white/90 hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.label}</p>
                      <p className="truncate text-xs text-white/60">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      {/* ===== Sticky top bar ===== */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button onClick={() => setDrawerOpen(true)} className="lg:hidden rounded-md p-2 text-black/70 hover:bg-black/5">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#6d5320]">
              <LayoutDashboard className="h-4 w-4 text-[#e4b653]" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Admin Portal</p>
              <p className="font-display text-base font-light text-black">Hidden Property Intel</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a
              href="https://hiddenpropertyintel.com/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-2 text-xs font-medium text-black/70 transition hover:bg-black/5"
              title="Open admin full screen in a new tab"
            >
              <ExternalLink className="h-4 w-4" /> <span className="hidden sm:inline">Open full screen</span>
            </a>
            <Link to="/" className="inline-flex items-center gap-1.5 rounded-md bg-black px-3 py-2 text-xs font-medium text-white transition hover:bg-black/80">
              <ArrowRight className="h-4 w-4" /> <span className="hidden sm:inline">View Site</span>
            </Link>
          </div>
        </div>
        {/* Command bar: TOC + search + calendar */}
        <div className="border-t border-black/5 bg-[#fbfaf7]">
          <AdminCommandBar
            categories={CATEGORIES.map(c => ({ id: c.id, label: c.label }))}
            items={ALL_ITEMS}
            onNavigate={selectTool}
            onJumpCategory={() => {}}
          />
        </div>
      </header>

      {/* ===== Body: sidebar + main ===== */}
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-[140px] rounded-xl border border-black/10 bg-[#0c0d0e] text-white">
            <SidebarContent />
          </div>
        </aside>

        {/* Main content — natural document scroll */}
        <main className="min-w-0 flex-1 pb-24 lg:pb-6">
          {/* Tool header */}
          <div className="mb-4 flex items-center gap-3">
            {canGoBack && (
              <button onClick={goBack}
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-medium text-black/70 transition hover:bg-black/5">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
            <div className="flex items-center gap-2.5">
              {activeItem?.icon && <activeItem.icon className="h-5 w-5 text-[#8f6110]" />}
              <h1 className="font-display text-2xl font-light tracking-tight text-black">{activeItem?.label}</h1>
            </div>
          </div>

          {/* Tool content */}
          <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
            {activeId === "overview" ? (
              <div>
                <div className="p-6"><WorkflowCreator /></div>
                <AdminOverview />
              </div>
            ) : ActiveComponent ? (
              <ActiveComponent />
            ) : null}
          </div>
        </main>
      </div>

      {/* ===== Mobile slide-in drawer (full nav) ===== */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-[#0c0d0e] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <p className="font-display text-base font-light">Navigation</p>
              <button onClick={() => setDrawerOpen(false)} className="rounded-md p-1.5 text-white/70 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ===== Mobile bottom nav (PWA-style) ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-black/10 bg-white/95 backdrop-blur lg:hidden">
        {MOBILE_NAV.map(item => {
          const isActive = activeId === item.id;
          return (
            <button key={item.id} onClick={() => selectTool(item.id)}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition ${
                isActive ? "text-[#8f6110]" : "text-black/50"
              }`}>
              <item.icon className={`h-5 w-5 ${isActive ? "text-[#c38a1b]" : ""}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Floating Eden Skye bubble */}
      <EdenBubble />
    </div>
  );
}