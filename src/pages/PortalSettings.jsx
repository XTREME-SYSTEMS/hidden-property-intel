import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Check, Loader2, AlertCircle, Save } from "lucide-react";

const inputStyle = { border: "1px solid var(--border)", borderRadius: 8, padding: "11px 12px", background: "#fff", width: "100%" };

export default function PortalSettings() {
  const { user, role } = useOutletContext();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    const p = user.portal_profile || {};
    setForm({
      name: p.name || user.full_name || "",
      company: p.company || "",
      phone: p.phone || "",
      city: p.city || "",
      state: p.state || "FL",
      bio: p.bio || "",
      role: user.portal_role || "investor",
      channels: (user.portal_communication?.channels) || ["email"],
      bestTime: user.portal_communication?.bestTime || "morning",
    });
  }, [user]);

  const update = (patch) => { setForm((f) => ({ ...f, ...patch })); setSaved(false); };

  const save = async () => {
    setSaving(true); setError(null); setSaved(false);
    try {
      await base44.auth.updateMe({
        portal_role: form.role,
        portal_profile: { name: form.name, company: form.company, phone: form.phone, city: form.city, state: form.state, bio: form.bio },
        portal_communication: { channels: form.channels, bestTime: form.bestTime, email: user.email, phone: form.phone },
      });
      setSaved(true);
    } catch (e) { setError(e.response?.data?.error || e.message || "Failed to save"); }
    setSaving(false);
  };

  if (!form) return <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow">Account</p>
      <h1 className="mb-6 font-heading text-3xl font-bold" style={{ color: "var(--ink)" }}>Settings</h1>

      <div className="grid gap-5 p-6" style={{ border: "1px solid var(--border)", borderRadius: 12, background: "#fff" }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--ink)" }}>Full name</span>
            <input style={inputStyle} value={form.name} onChange={(e) => update({ name: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--ink)" }}>Company</span>
            <input style={inputStyle} value={form.company} onChange={(e) => update({ company: e.target.value })} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--ink)" }}>Phone</span>
            <input style={inputStyle} value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--ink)" }}>Email</span>
            <input style={inputStyle} value={user?.email || ""} disabled />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--ink)" }}>City</span>
            <input style={inputStyle} value={form.city} onChange={(e) => update({ city: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--ink)" }}>State</span>
            <input style={inputStyle} value={form.state} onChange={(e) => update({ state: e.target.value })} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--ink)" }}>Bio</span>
          <textarea style={{ ...inputStyle, minHeight: 80 }} value={form.bio} onChange={(e) => update({ bio: e.target.value })} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--ink)" }}>Role</span>
          <select style={inputStyle} value={form.role} onChange={(e) => update({ role: e.target.value })}>
            <option value="investor">Investor</option>
            <option value="seller">Seller</option>
            <option value="agent">Agent / Broker</option>
            <option value="wholesaler">Wholesaler</option>
            <option value="manager">Property Manager</option>
            <option value="partner">Partner / Vendor</option>
          </select>
        </label>

        {error && (
          <div className="flex items-center gap-2 rounded-lg p-3 text-sm" style={{ background: "#fef2f2", color: "#b91c1c" }}>
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className="btn gold">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save changes</>}
          </button>
          {saved && <span className="flex items-center gap-1 text-sm" style={{ color: "var(--success)" }}><Check className="h-4 w-4" /> Saved</span>}
        </div>
      </div>
    </div>
  );
}