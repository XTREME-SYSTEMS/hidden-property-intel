import React, { useState, useRef, useEffect } from "react";
import { Clock, Plus, Save } from "lucide-react";

// Hourly planning timeline — 24 horizontal slots, each writable.
// Current hour is highlighted. Plans persist in local state.
export default function HourlyTimeline({ agentRole, agentName }) {
  const [plan, setPlan] = useState({});
  const [editingHour, setEditingHour] = useState(null);
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef(null);

  // Load default plan on mount or when agent changes
  useEffect(() => {
    const stored = localStorage.getItem(`hpi-plan-${agentRole}`);
    if (stored) {
      try { setPlan(JSON.parse(stored)); return; } catch {}
    }
    // Import default plan from profiles lib
    import("@/lib/digitalAgentProfiles").then(({ getDefaultHourlyPlan }) => {
      setPlan(getDefaultHourlyPlan(agentRole));
    });
  }, [agentRole]);

  const currentHour = new Date().getHours();

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const updateHour = (hour, value) => {
    setPlan(prev => {
      const next = { ...prev };
      if (value.trim()) next[hour] = value;
      else delete next[hour];
      return next;
    });
  };

  const savePlan = () => {
    localStorage.setItem(`hpi-plan-${agentRole}`, JSON.stringify(plan));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const scrollToCurrent = () => {
    if (scrollRef.current) {
      const cardWidth = 132; // approx width + gap
      scrollRef.current.scrollTo({ left: Math.max(0, currentHour * cardWidth - 200), behavior: "smooth" });
    }
  };

  useEffect(() => { scrollToCurrent(); }, []);

  const formatHour = (h) => {
    if (h === 0) return "12 AM";
    if (h < 12) return `${h} AM`;
    if (h === 12) return "12 PM";
    return `${h - 12} PM`;
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0b0c] p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#e4b653]" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Daily Hourly Plan</h3>
          <span className="text-[10px] text-white/30">— 24-hour action timeline for {agentName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={scrollToCurrent} className="rounded-md border border-white/10 px-2.5 py-1 text-[10px] text-white/50 transition hover:bg-white/5 hover:text-white">
            Jump to now
          </button>
          <button onClick={savePlan} className="inline-flex items-center gap-1.5 rounded-md bg-[#e4b653]/15 px-2.5 py-1 text-[10px] font-medium text-[#e4b653] transition hover:bg-[#e4b653]/25">
            {saved ? <Save className="h-3 w-3" /> : <Save className="h-3 w-3" />} {saved ? "Saved" : "Save Plan"}
          </button>
        </div>
      </div>

      {/* Horizontal scrollable timeline */}
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:thin]">
        {hours.map((h) => {
          const isCurrent = h === currentHour;
          const hasPlan = !!plan[h];
          const isEditing = editingHour === h;
          return (
            <div
              key={h}
              className={`flex w-[120px] shrink-0 flex-col rounded-lg border p-2.5 transition ${
                isCurrent
                  ? "border-[#e4b653] bg-[#e4b653]/8"
                  : hasPlan
                  ? "border-white/15 bg-white/5"
                  : "border-white/8 bg-white/[0.02]"
              }`}
            >
              {/* Hour label */}
              <div className="mb-1.5 flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? "text-[#e4b653]" : "text-white/40"}`}>
                  {formatHour(h)}
                </span>
                {isCurrent && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#e4b653]" />}
              </div>
              {/* Action slot */}
              {isEditing ? (
                <textarea
                  autoFocus
                  value={plan[h] || ""}
                  onChange={(e) => updateHour(h, e.target.value)}
                  onBlur={() => setEditingHour(null)}
                  placeholder="Write action..."
                  className="h-[70px] w-full resize-none rounded border border-white/15 bg-black/30 p-1.5 text-[10px] leading-tight text-white placeholder-white/20 focus:border-[#e4b653]/40 focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => setEditingHour(h)}
                  className={`h-[70px] w-full rounded border border-dashed p-1.5 text-left text-[10px] leading-tight transition ${
                    hasPlan
                      ? "border-transparent text-white/70 hover:border-white/20"
                      : "border-white/8 text-white/20 hover:border-white/20 hover:text-white/40"
                  }`}
                >
                  {hasPlan ? plan[h] : <span className="flex h-full items-center justify-center gap-1"><Plus className="h-3 w-3" /> Add action</span>}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-2 flex items-center gap-4 text-[10px] text-white/30">
        <span>{Object.keys(plan).length}/24 hours planned</span>
        <span>•</span>
        <span>Current time: {formatHour(currentHour)}</span>
        <span>•</span>
        <span className="text-white/20">Click any hour to write an action · Saved locally</span>
      </div>
    </div>
  );
}