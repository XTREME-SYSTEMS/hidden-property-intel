import React, { useState } from "react";
import {
  CheckCircle2, AlertCircle, XCircle, Copy, Check, ChevronDown,
  Database, Brain, Scale, Blocks, Mail, Smartphone, Shield, Zap,
  BarChart3, DollarSign, ShieldCheck, Sparkles, Search
} from "lucide-react";
import { CURRENT_CAPABILITIES } from "@/lib/currentCapabilities";
import { FUTURE_CAPABILITIES } from "@/lib/futureCapabilities";
import { UNIQUE_CAPABILITIES } from "@/lib/uniqueCapabilities";
import { PROMPT_LIBRARY } from "@/lib/promptLibrary";

const ICONS = { Database, Brain, Scale, Blocks, Mail, Smartphone, Shield, Zap, BarChart3, DollarSign, ShieldCheck, Sparkles };

export default function AdminCapabilities() {
  const [tab, setTab] = useState("current");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(null);

  const copyPrompt = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredCurrent = CURRENT_CAPABILITIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );
  const filteredFuture = FUTURE_CAPABILITIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const avgTech = (CURRENT_CAPABILITIES.reduce((s, c) => s + c.techScore, 0) / CURRENT_CAPABILITIES.length).toFixed(1);
  const avgOp = (CURRENT_CAPABILITIES.reduce((s, c) => s + c.opScore, 0) / CURRENT_CAPABILITIES.length).toFixed(1);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">System Capabilities</p>
        <h1 className="mt-1 font-display text-2xl font-light">Platform Capability Map</h1>
        <p className="mt-1 text-xs text-black/50">Every capability the system has, should have, and could have to dominate the market</p>
      </div>

      {/* Summary stats */}
      <div className="mb-5 grid grid-cols-5 gap-2">
        <div className="rounded-lg border border-black/10 bg-white p-3"><p className="text-[10px] uppercase tracking-[0.15em] text-black/40">Current</p><p className="mt-1 font-display text-xl font-light">{CURRENT_CAPABILITIES.length}</p></div>
        <div className="rounded-lg border border-black/10 bg-white p-3"><p className="text-[10px] uppercase tracking-[0.15em] text-black/40">Future</p><p className="mt-1 font-display text-xl font-light">{FUTURE_CAPABILITIES.length}</p></div>
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-3"><p className="text-[10px] uppercase tracking-[0.15em] text-violet-600">Unique</p><p className="mt-1 font-display text-xl font-light text-violet-700">{UNIQUE_CAPABILITIES.length}</p></div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3"><p className="text-[10px] uppercase tracking-[0.15em] text-emerald-600">Avg Tech</p><p className="mt-1 font-display text-xl font-light text-emerald-700">{avgTech}/10</p></div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3"><p className="text-[10px] uppercase tracking-[0.15em] text-blue-600">Avg Ops</p><p className="mt-1 font-display text-xl font-light text-blue-700">{avgOp}/10</p></div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-black/10">
        {[
          { id: "current", label: "Current Capabilities", count: CURRENT_CAPABILITIES.length },
          { id: "future", label: "Future Capabilities", count: FUTURE_CAPABILITIES.length },
          { id: "unique", label: "Unique Differentiators", count: UNIQUE_CAPABILITIES.length },
          { id: "prompts", label: "Prompt Library", count: PROMPT_LIBRARY.reduce((s, c) => s + c.prompts.length, 0) },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs ${tab === t.id ? "border-black text-black" : "border-transparent text-black/40 hover:text-black"}`}>
            {t.label} <span className="text-[10px] text-black/30">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      {tab !== "unique" && tab !== "prompts" && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2">
          <Search className="h-4 w-4 text-black/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search capabilities..." className="flex-1 text-sm outline-none" />
        </div>
      )}

      {/* Current Capabilities */}
      {tab === "current" && (
        <div className="space-y-3">
          {filteredCurrent.map(cap => (
            <div key={cap.name} className="rounded-lg border border-black/10 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{cap.name}</p>
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-black/50">{cap.category}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-black/60">{cap.description}</p>
                  <div className="mt-3 space-y-1">
                    {cap.examples.map((ex, i) => (
                      <p key={i} className="flex gap-2 text-[11px] text-black/50"><span className="text-emerald-500">▸</span> {ex}</p>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 space-y-2">
                  <ScoreBar label="Tech" score={cap.techScore} />
                  <ScoreBar label="Ops" score={cap.opScore} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Future Capabilities */}
      {tab === "future" && (
        <div className="space-y-3">
          {filteredFuture.map(cap => (
            <div key={cap.name} className="rounded-lg border border-black/10 bg-white p-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{cap.name}</p>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-amber-600">{cap.category}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-black/60">{cap.description}</p>
              <div className="mt-3 space-y-1">
                {cap.examples.map((ex, i) => (
                  <p key={i} className="flex gap-2 text-[11px] text-black/50"><span className="text-amber-500">▸</span> {ex}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unique Differentiators */}
      {tab === "unique" && (
        <div className="space-y-3">
          <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
            <p className="text-sm font-medium text-violet-800">Why these matter</p>
            <p className="mt-1 text-xs text-violet-600">These are capabilities nearly no competitor has. Building even a few of these would make PropertyIntel irreplaceable — the platform investors, sellers, and agents can't live without.</p>
          </div>
          {UNIQUE_CAPABILITIES.map(cap => (
            <div key={cap.name} className="rounded-lg border border-violet-100 bg-white p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <p className="text-sm font-medium">{cap.name}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-black/60">{cap.description}</p>
              <div className="mt-3 rounded-md bg-violet-50/50 p-3">
                <p className="text-[10px] uppercase tracking-[0.15em] text-violet-500">Why this makes us stand out</p>
                <p className="mt-1 text-xs leading-relaxed text-violet-700">{cap.why}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prompt Library */}
      {tab === "prompts" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-black/10 bg-white p-4">
            <p className="text-sm font-medium">How to use this library</p>
            <p className="mt-1 text-xs text-black/50">Copy any prompt below and paste it into the chat. Each prompt is designed to invoke a full implementation of that capability. Run them in any order — they're independent unless noted.</p>
          </div>
          {PROMPT_LIBRARY.map(group => {
            const Icon = ICONS[group.icon] || Zap;
            return (
              <div key={group.category} className="rounded-lg border border-black/10 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-black/5">
                    <Icon className="h-3.5 w-3.5 text-black/50" />
                  </div>
                  <p className="text-sm font-medium">{group.category}</p>
                  <span className="text-[10px] text-black/30">{group.prompts.length} prompts</span>
                </div>
                <div className="space-y-2">
                  {group.prompts.map((p, i) => {
                    const id = `${group.category}-${i}`;
                    return (
                      <div key={i} className="rounded-lg border border-black/5 bg-gray-50/50 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium">{p.title}</p>
                          <button onClick={() => copyPrompt(p.prompt, id)} className="shrink-0 rounded-md border border-black/15 p-1.5 hover:bg-black hover:text-white">
                            {copied === id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-black/50">{p.prompt}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, score }) {
  const color = score >= 8 ? "emerald" : score >= 6 ? "amber" : score >= 4 ? "orange" : "red";
  const colorMap = {
    emerald: "bg-emerald-500 text-emerald-700",
    amber: "bg-amber-500 text-amber-700",
    orange: "bg-orange-500 text-orange-700",
    red: "bg-red-500 text-red-700",
  };
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] uppercase tracking-[0.15em] text-black/40 w-8">{label}</span>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-black/10">
        <div className={`h-full ${colorMap[color].split(" ")[0]}`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className={`text-xs font-medium ${colorMap[color].split(" ")[1]}`}>{score}</span>
    </div>
  );
}