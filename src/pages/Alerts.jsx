import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Bell, CheckCheck, Mail, Smartphone, MessageSquare } from "lucide-react";
import { money } from "@/lib/format";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [pref, setPref] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [a, p] = await Promise.all([
        base44.entities.DealAlert.list("-created_date", 100),
        base44.entities.AlertPreference.filter({}).then((r) => r[0] || null),
      ]);
      setAlerts(a);
      setPref(p);
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    const unread = alerts.filter((a) => !a.read);
    await base44.entities.DealAlert.bulkUpdate(unread.map((a) => ({ id: a.id, read: true })));
    load();
  };

  const savePref = async (next) => {
    const u = await base44.auth.me();
    if (!u) return;
    if (pref?.id) {
      await base44.entities.AlertPreference.update(pref.id, next);
    } else {
      await base44.entities.AlertPreference.create({ user_id: u.id, ...next });
    }
    load();
  };

  const toggle = (key) => () => {
    const next = { ...pref, [key]: !(pref?.[key] !== false) };
    savePref({ [key]: next[key] });
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Deal alerts</h1>
          <p className="mt-1 text-sm text-[#6B7B72]">New matches, outbid notices, and price drops — the moment they happen.</p>
        </div>
        <button onClick={markAllRead} className="inline-flex items-center gap-2 rounded-full bg-[#F8FAF9] px-4 py-2.5 text-sm ring-1 ring-[#E5EDEA] hover:bg-[#E5EDEA]">
          <CheckCheck className="h-4 w-4" /> Mark all read
        </button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { key: "email_alerts", label: "Email alerts", icon: Mail, on: pref?.email_alerts !== false },
          { key: "push_alerts", label: "Push alerts", icon: Bell, on: pref?.push_alerts !== false },
          { key: "sms_alerts", label: "SMS alerts", icon: MessageSquare, on: pref?.sms_alerts === true },
        ].map((c) => (
          <button
            key={c.key}
            onClick={toggle(c.key)}
            className={`flex items-center gap-3 rounded-2xl p-4 ring-1 transition-colors ${
              c.on ? "bg-emerald-50 ring-emerald-200" : "bg-white ring-[#E5EDEA]"
            }`}
          >
            <c.icon className={`h-5 w-5 ${c.on ? "text-emerald-600" : "text-[#6B7B72]"}`} />
            <div className="text-left">
              <p className="text-sm font-medium">{c.label}</p>
              <p className="text-xs text-[#6B7B72]">{c.on ? "On" : "Off"}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {loading && <p className="text-sm text-[#6B7B72]">Loading…</p>}
        {!loading && !alerts.length && (
          <div className="rounded-2xl bg-[#F8FAF9] p-10 text-center ring-1 ring-[#E5EDEA]">
            <Bell className="mx-auto h-6 w-6 text-[#6B7B72]" />
            <p className="mt-3 font-medium">No alerts yet</p>
            <p className="mt-1 text-sm text-[#6B7B72]">Save a search and we'll alert you the moment a matching property lands.</p>
            <Link to="/listings" className="mt-5 inline-block rounded-full bg-[#0F2A1D] px-5 py-2.5 text-sm text-white">Browse inventory</Link>
          </div>
        )}
        {alerts.map((a) => (
          <Link
            key={a.id}
            to={a.property_id ? `/properties/${a.property_id}` : "/alerts"}
            className={`flex items-start gap-4 rounded-2xl p-5 ring-1 transition-colors ${
              a.read ? "bg-white ring-[#E5EDEA]" : "bg-emerald-50/50 ring-emerald-200"
            }`}
          >
            <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${a.read ? "bg-transparent" : "bg-emerald-500"}`} />
            <div className="flex-1">
              <p className="font-medium">{a.title}</p>
              <p className="mt-1 text-sm text-[#6B7B72]">{a.message}</p>
            </div>
            <span className="text-xs text-[#6B7B72]">{new Date(a.created_date).toLocaleDateString()}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}