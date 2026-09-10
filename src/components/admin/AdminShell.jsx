import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Database, Mail, FlaskConical, Search, Cpu, Target, Users, User, Home, Blocks, Calculator, Scale, TrendingUp, BarChart3,
  ArrowRight, X, ArrowLeft, Lightbulb, BookOpen, Globe, Building2, Handshake, Stamp, Radar, Sparkles, Key, Phone, Mic, Calendar, Rocket, ExternalLink,
  ChevronDown, Compass, Briefcase, FileSignature, Wrench, Network, Brain
} from "lucide-react";
import AdminOverview from "@/components/admin/AdminOverview";
import DashboardStrip from "@/components/admin/DashboardStrip";
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
import AdminOwnerIdentification from "@/pages/AdminOwnerIdentification";
import AdminAiGateway from "@/pages/AdminAiGateway";
import IntelligenceConsole from "@/pages/IntelligenceConsole";
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
 * Workflow-organized admin shell. Tools are grouped by the deal-workflow
 * stage where they're used, so everything needed for a given task lives
 * in one place.
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
      { id: "owner-identify", icon: User, label: "Owner Identification Engine", desc: "Exhaustive owner ID & skip-trace", component: AdminOwnerIdentification },
      { id: "ai-gateway", icon: Sparkles, label: "AI Gateway Engine", desc: "372 models: search, vision, voice, RAG", component: AdminAiGateway },
      { id: "intelligence", icon: Brain, label: "Intelligence Console", desc: "Autonomous investigation engine", component: IntelligenceConsole },
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

// Flatten for search
const ALL_ITEMS = CATEGORIES.flatMap(c => c.items.map(i => ({ ...i, catId: c.id })));

export default function AdminShell() {
  const [activeId, setActiveId] = useState("overview");
  const [history, setHistory] = useState([]);
  const [collapsed, setCollapsed] = useState({});
  const sidebarRef = useRef(null);

  const activeItem = ALL_ITEMS.find((n) => n.id === activeId);
  const ActiveComponent = activeItem?.component;
  const canGoBack = history.length > 0;
  const canClose = activeId !== "overview";

  const selectTool = (id) => {
    if (id === activeId) return;
    setHistory((prev) => [...prev, activeId]);
    setActiveId(id);
  };
  const goBack = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setActiveId(prev);
  };
  const closeTool = () => { setHistory([]); setActiveId("overview"); };

  const jumpCategory = (catId) => {
    setCollapsed(prev => ({ ...prev, [catId]: false }));
    const el = sidebarRef.current?.querySelector(`[data-cat="${catId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleCat = (catId) => setCollapsed(prev => ({ ...prev, [catId]: !prev[catId] }));

  return (
    <div className="relative flex h-[calc(100vh-112px)] overflow-hidden border border-black/10">
      {/* Left sidebar — workflow categories */}
      <aside className="flex w-64 shrink-0 flex-col bg-[#0c0d0e] text-white">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#6d5320]">
            <LayoutDashboard className="h-4 w-4 text-[#e4b653]" />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-white">Admin Portal</p>
            <p className="font-display text-sm font-light text-white">Hidden Property Intel</p>
          </div>
        </div>
        <nav ref={sidebarRef} className="flex-1 overflow-y-auto px-3 py-3">
          {CATEGORIES.map(cat => {
            const isCollapsed = collapsed[cat.id];
            const hasActive = cat.items.some(i => i.id === activeId);
            return (
              <div key={cat.id} data-cat={cat.id} className="mb-1">
                <button
                  onClick={() => toggleCat(cat.id)}
                  className={`group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition ${hasActive ? "text-[#e4b653]" : "text-white hover:text-white"}`}
                >
                  <cat.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 text-[10px] font-semibold uppercase tracking-[0.18em]">{cat.label}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                </button>
                {!isCollapsed && (
                  <div className="mb-1 ml-1 mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
                    {cat.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => selectTool(item.id)}
                        className={`group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition ${
                          activeId === item.id ? "bg-white/10 text-[#e4b653]" : "text-white hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">{item.label}</p>
                          <p className="truncate text-[10px] text-white">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white transition hover:bg-white/5 hover:text-white">
            <ArrowRight className="h-3 w-3" /> View Site
          </Link>
        </div>
      </aside>

      {/* Center content */}
      <div className="flex flex-1 flex-col bg-[#f7f5f0]">
        {/* Quick-access strip */}
        <DashboardStrip onNavigate={selectTool} activeId={activeId} />
        {/* Command bar: TOC + search + calendar */}
        <AdminCommandBar
          categories={CATEGORIES.map(c => ({ id: c.id, label: c.label }))}
          items={ALL_ITEMS}
          onNavigate={selectTool}
          onJumpCategory={jumpCategory}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-2.5">
            <button onClick={goBack} disabled={!canGoBack}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-black/50 transition hover:bg-black/5 hover:text-black disabled:cursor-default disabled:opacity-25">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <div className="flex items-center gap-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-black/40">{activeItem?.label}</p>
              <a
                href="https://my-property-intel.base44.app/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-2.5 py-1.5 text-xs font-medium text-black/60 transition hover:bg-black/5 hover:text-black"
                title="Open admin full screen in a new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open full screen
              </a>
            </div>
            <button onClick={closeTool} disabled={!canClose}
              className="inline-flex items-center justify-center rounded-md p-1.5 text-black/40 transition hover:bg-black/5 hover:text-black disabled:cursor-default disabled:opacity-25">
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Card content */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeId === "overview" ? (
              <div>
                <div className="p-6"><WorkflowCreator /></div>
                <AdminOverview />
              </div>
            ) : ActiveComponent ? (
              <ActiveComponent />
            ) : null}
          </div>
        </div>
      </div>

      {/* Floating Eden Skye bubble — replaces the old right copilot panel */}
      <EdenBubble />
    </div>
  );
}