import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Database, Mail, FlaskConical, Search, Cpu, Target,
  ArrowRight, X, ArrowLeft
} from "lucide-react";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminChatBar from "@/components/admin/AdminChatBar";
import AdminSources from "@/pages/AdminSources";
import AdminOutreach from "@/pages/AdminOutreach";
import AdminTestLab from "@/pages/AdminTestLab";
import AdminArchitecture from "@/pages/AdminArchitecture";
import AdminSearchConsole from "@/pages/AdminSearchConsole";
import SystemDNA from "@/pages/SystemDNA";

const NAV_ITEMS = [
  { id: "overview", icon: LayoutDashboard, label: "Dashboard", desc: "Overview & metrics" },
  { id: "sources", icon: Database, label: "Data Sources", desc: "Scrape pipeline", component: AdminSources },
  { id: "outreach", icon: Mail, label: "Outreach", desc: "Email engines", component: AdminOutreach },
  { id: "test-lab", icon: FlaskConical, label: "Test Lab", desc: "Function sandbox", component: AdminTestLab },
  { id: "architecture", icon: Cpu, label: "Architecture", desc: "System DNA & roadmap", component: AdminArchitecture },
  { id: "search-console", icon: Search, label: "Search Console", desc: "SEO indexing", component: AdminSearchConsole },
  { id: "system-dna", icon: Target, label: "System DNA", desc: "Competitive benchmark", component: SystemDNA },
];

export default function AdminShell() {
  const [activeId, setActiveId] = useState("overview");
  const [history, setHistory] = useState([]);

  const activeItem = NAV_ITEMS.find((n) => n.id === activeId);
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

  const closeTool = () => {
    setHistory([]);
    setActiveId("overview");
  };

  return (
    <div className="flex h-[calc(100vh-112px)] overflow-hidden border border-black/10">
      {/* Left sidebar */}
      <aside className="flex w-60 shrink-0 flex-col bg-[#0c0d0e] text-white">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#6d5320]">
            <LayoutDashboard className="h-4 w-4 text-[#e4b653]" />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-white/40">Admin Portal</p>
            <p className="font-display text-sm font-light text-white">Hidden Property Intel</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => selectTool(item.id)}
              className={`group mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                activeId === item.id
                  ? "bg-white/10 text-[#e4b653]"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{item.label}</p>
                <p className="truncate text-[10px] text-white/25">{item.desc}</p>
              </div>
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            <ArrowRight className="h-3 w-3" /> View Site
          </Link>
        </div>
      </aside>

      {/* Right content area */}
      <div className="flex flex-1 flex-col gap-3 bg-[#f7f5f0] p-4">
        {/* Top 2/3 — content card */}
        <div className="flex min-h-0 flex-[2] flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
          {/* Card header */}
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-2.5">
            <button
              onClick={goBack}
              disabled={!canGoBack}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-black/50 transition hover:bg-black/5 hover:text-black disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-black/40">
              {activeItem?.label}
            </p>
            <button
              onClick={closeTool}
              disabled={!canClose}
              className="inline-flex items-center justify-center rounded-md p-1.5 text-black/40 transition hover:bg-black/5 hover:text-black disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Card content */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeId === "overview" ? (
              <AdminOverview />
            ) : ActiveComponent ? (
              <ActiveComponent />
            ) : null}
          </div>
        </div>

        {/* Bottom 1/3 — chat bar */}
        <div className="flex min-h-0 flex-[1] flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
          <AdminChatBar />
        </div>
      </div>
    </div>
  );
}