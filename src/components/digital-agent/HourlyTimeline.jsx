import React, { useState, useRef, useEffect } from "react";
import { Clock, Plus, Save } from "lucide-react";

// Hourly planning timeline — 24 horizontal slots, each writable.
// Light theme matching the HPI luxury design system.
export default function HourlyTimeline({ agentRole, agentName }) {
  const [plan, setPlan] = useState({});
  const [editingHour, setEditingHour] = useState(null);
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem(`hpi-plan-${agentRole}`);
    if (stored) {
      try { setPlan(JSON.parse(stored)); return; } catch {}
    }
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
      const cardWidth = 132;
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
    <div className="rounded-xl border border-[#e7e1d6] bg-white p-4 shadow-[0_6px_20px_rgba(30,25,15,0.04)]">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#c38a1b]" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#12110f]">Daily Hourly Plan</h3>
          <span className="text-[10px] text-[#6f6a60]">— 24-hour action timeline for {agentName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={scrollToCurrent} className="rounded-md border border-[#e7e1d6] px-2.5 py-1 text-[10px] text-[#6f6a60] transition hover:bg-[#f7f5f0] hover:text-[#12110f]">
            Jump to now
          </button>
          <button onClick={savePlan} className="inline-flex items-center gap-1.5 rounded-md bg-[#fff8e9] px-2.5 py-1 text-[10px] font-medium text-[#8f6110] transition hover:bg-[#f5edd6]">
            <Save className="h-3 w-3" /> {saved ? "Saved" : "Save Plan"}
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
                  ? "border-[#e4b653] bg-[#fff8e9]"
                  : hasPlan
                  ? "border-[#e7e1d6] bg-[#f7f5f0]"
                  : "border-[#e7e1d6] bg-white"
              }`}
            >
              {/* Hour label */}
              <div className="mb-1.5 flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? "text-[#c38a1b]" : "text-[#6f6a60]"}`}>
                  {formatHour(h)}
                </span>
                {isCurrent && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c38a1b]" />}
              </div>
              {/* Action slot */}
              {isEditing ? (
                <textarea
                  autoFocus
                  value={plan[h] || ""}
                  onChange={(e) => updateHour(h, e.target.value)}
                  onBlur={() => setEditingHour(null)}
                  placeholder="Write action..."
                  className="h-[70px] w-full resize-none rounded border border-[#e7e1d6] bg-white p-1.5 text-[10px] leading-tight text-[#12110f] placeholder-[#6f6a60]/40 focus:border-[#c38a1b]/40 focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => setEditingHour(h)}
                  className={`h-[70px] w-full rounded border border-dashed p-1.5 text-left text-[10px] leading-tight transition ${
                    hasPlan
                      ? "border-transparent text-[#12110f] hover:border-[#e7e1d6]"
                      : "border-[#e7e1d6] text-[#6f6a60]/40 hover:border-[#c38a1b]/40 hover:text-[#6f6a60]"
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
      <div className="mt-2 flex items-center gap-4 text-[10px] text-[#6f6a60]">
        <span>{Object.keys(plan).length}/24 hours planned</span>
        <span>•</span>
        <span>Current time: {formatHour(currentHour)}</span>
        <span>•</span>
        <span className="text-[#6f6a60]/60">Click any hour to write an action · Saved locally</span>
      </div>
    </div>
  );
}