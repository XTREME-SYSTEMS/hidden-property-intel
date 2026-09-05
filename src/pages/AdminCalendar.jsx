import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Plus, Loader2, Clock, MapPin, Users, Video, AlertCircle } from "lucide-react";

export default function AdminCalendar() {
  const [tab, setTab] = useState("upcoming");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [slots, setSlots] = useState([]);

  // Create form
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState("30");
  const [attendees, setAttendees] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [created, setCreated] = useState(null);

  const loadEvents = useCallback(async (which) => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("syncGoogleCalendar", { action: which === "today" ? "today" : "list", days: 14 });
      setEvents(res.data.events || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadEvents(tab === "today" ? "today" : "upcoming"); }, [tab, loadEvents]);

  const findSlots = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("syncGoogleCalendar", { action: "find_slots", days: 5, duration_min: parseInt(duration) });
      setSlots(res.data.slots || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const createEvent = async () => {
    if (!title.trim() || !date || !time) return;
    setBusy(true);
    setError(null);
    setCreated(null);
    try {
      const start = new Date(`${date}T${time}:00`).toISOString();
      const end = new Date(new Date(start).getTime() + parseInt(duration) * 60 * 1000).toISOString();
      const res = await base44.functions.invoke("syncGoogleCalendar", {
        action: "create",
        title: title.trim(),
        start_time: start,
        end_time: end,
        attendees: attendees.split(",").map(a => a.trim()).filter(Boolean),
        description: description.trim(),
        location: location.trim(),
      });
      setCreated(res.data);
      setTitle(""); setAttendees(""); setDescription(""); setLocation("");
      loadEvents(tab === "today" ? "today" : "upcoming");
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const fmtTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-black/60" />
            <h2 className="font-display text-xl">Google Calendar Sync</h2>
          </div>
          <p className="mt-1 text-xs text-black/50">
            Eden Skye's scheduling — synced with the info@hiddenpropertyintel.com calendar.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-sm border border-black/10 p-1">
          <button onClick={() => setTab("upcoming")} className={`rounded-sm px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] ${tab === "upcoming" ? "bg-black text-white" : "text-black/50"}`}>Upcoming</button>
          <button onClick={() => setTab("today")} className={`rounded-sm px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] ${tab === "today" ? "bg-black text-white" : "text-black/50"}`}>Today</button>
          <button onClick={() => setTab("schedule")} className={`rounded-sm px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] ${tab === "schedule" ? "bg-black text-white" : "text-black/50"}`}>Schedule</button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {created && (
        <div className="mt-4 flex items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
          <Calendar className="h-4 w-4 shrink-0" /> Event created: <strong>{created.summary}</strong> — {fmtTime(created.start)}
        </div>
      )}

      {/* Events list */}
      {(tab === "upcoming" || tab === "today") && (
        <div className="mt-5">
          {loading ? (
            <div className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-black/30" /></div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-sm text-black/40">
              <Calendar className="mx-auto mb-3 h-8 w-8 text-black/20" />
              No {tab === "today" ? "events today" : "upcoming events"}.
            </div>
          ) : (
            <div className="space-y-2">
              {events.map(e => (
                <div key={e.id} className="flex items-start gap-3 rounded-sm border border-black/10 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-black/[0.03]">
                    <Clock className="h-4 w-4 text-black/50" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{e.summary}</p>
                    <p className="mt-0.5 text-xs text-black/50">{fmtTime(e.start)} — {fmtTime(e.end)}</p>
                    {e.location && <p className="mt-1 flex items-center gap-1 text-[11px] text-black/50"><MapPin className="h-3 w-3" /> {e.location}</p>}
                    {e.hangoutLink && <p className="mt-1 flex items-center gap-1 text-[11px] text-blue-600"><Video className="h-3 w-3" /> Google Meet</p>}
                    {e.attendees?.length > 0 && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-black/50"><Users className="h-3 w-3" /> {e.attendees.map(a => a.email).join(", ")}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule new event */}
      {tab === "schedule" && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Event Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Investor call — John Smith" className="mt-1.5 w-full rounded-sm border border-black/15 px-3 py-2 text-sm outline-none focus:border-black" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5 w-full rounded-sm border border-black/15 px-3 py-2 text-sm outline-none focus:border-black" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1.5 w-full rounded-sm border border-black/15 px-3 py-2 text-sm outline-none focus:border-black" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Duration (min)</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1.5 w-full rounded-sm border border-black/15 px-3 py-2 text-sm outline-none focus:border-black">
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                  <option value="60">60</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Attendees (comma-separated emails)</label>
              <input value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="john@example.com, jane@example.com" className="mt-1.5 w-full rounded-sm border border-black/15 px-3 py-2 text-sm outline-none focus:border-black" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Location (optional)</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Google Meet / 123 Main St" className="mt-1.5 w-full rounded-sm border border-black/15 px-3 py-2 text-sm outline-none focus:border-black" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Call agenda, context, notes..." className="mt-1.5 h-20 w-full resize-none rounded-sm border border-black/15 p-3 text-sm outline-none focus:border-black" />
            </div>
            <button
              onClick={createEvent}
              disabled={busy || !title.trim() || !date || !time}
              className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Create Event
            </button>
          </div>

          {/* Available slots */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Available Slots</label>
              <button onClick={findSlots} disabled={busy} className="text-[10px] uppercase tracking-[0.15em] text-black/50 hover:text-black">
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Find"}
              </button>
            </div>
            <div className="mt-2 space-y-1.5">
              {slots.length === 0 ? (
                <p className="text-[11px] text-black/40">Click "Find" to see available time slots in the next 5 business days.</p>
              ) : slots.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const d = new Date(s.start);
                    setDate(d.toISOString().slice(0, 10));
                    setTime(d.toTimeString().slice(0, 5));
                  }}
                  className="block w-full rounded-sm border border-black/10 px-3 py-2 text-left text-xs text-black/60 hover:border-black/30 hover:bg-black/[0.02]"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}