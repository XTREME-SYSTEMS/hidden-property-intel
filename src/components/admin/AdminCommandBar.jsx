import React, { useState, useMemo, useEffect } from "react";
import { Search, Calendar, ChevronDown, Hash, ArrowRight } from "lucide-react";

/**
 * Top command bar: Table of Contents (jump to category), intelligence search
 * with autofill, and a mini calendar widget.
 * `categories` = [{ id, label }] — the workflow categories to jump to.
 * `items` = [{ id, label, desc }] — all nav items for search.
 * `onNavigate(id)` — activate a tool by nav id.
 * `onJumpCategory(catId)` — scroll sidebar to a category.
 */
export default function AdminCommandBar({ categories, items, onNavigate, onJumpCategory }) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [today] = useState(new Date());

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items
      .filter(i => i.label.toLowerCase().includes(q) || (i.desc || "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [query]);

  const pick = (id) => {
    onNavigate(id);
    setQuery("");
    setShowResults(false);
  };

  return (
    <div className="flex items-center gap-3 border-b border-black/10 bg-white px-4 py-2.5">
      {/* Table of Contents */}
      <div className="relative shrink-0">
        <select
          onChange={(e) => { if (e.target.value) onJumpCategory(e.target.value); e.target.value = ""; }}
          className="appearance-none rounded-md border border-black/15 bg-[#f7f5f0] py-1.5 pl-8 pr-8 text-[11px] font-medium uppercase tracking-[0.15em] text-black/70 outline-none hover:bg-black/5"
          defaultValue=""
        >
          <option value="" disabled>Table of Contents</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <Hash className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/40" />
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-black/40" />
      </div>

      {/* Intelligence search */}
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          onKeyDown={e => { if (e.key === "Enter" && results[0]) pick(results[0].id); }}
          placeholder="Intelligence search — tools, investors, properties…"
          className="w-full rounded-md border border-black/15 bg-[#f7f5f0] py-2 pl-10 pr-3 text-sm outline-none placeholder:text-black/30 focus:border-[#c38a1b]"
        />
        {showResults && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-md border border-black/10 bg-white shadow-lg">
            {results.map(r => (
              <button
                key={r.id}
                onMouseDown={() => pick(r.id)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-black/5"
              >
                <Search className="h-3.5 w-3.5 text-black/30" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.label}</p>
                  <p className="truncate text-[10px] text-black/40">{r.desc}</p>
                </div>
                <ArrowRight className="ml-auto h-3 w-3 text-black/30" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mini calendar */}
      <div className="ml-auto flex items-center gap-2.5 rounded-md border border-black/10 bg-[#f7f5f0] px-3 py-1.5">
        <Calendar className="h-4 w-4 text-[#c38a1b]" />
        <div className="leading-tight">
          <p className="text-[10px] uppercase tracking-[0.15em] text-black/40">
            {today.toLocaleDateString("en-US", { weekday: "short" })}
          </p>
          <p className="text-sm font-medium">
            {today.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}