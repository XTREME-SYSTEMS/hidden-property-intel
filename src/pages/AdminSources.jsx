import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Play, Trash2, Power, Pencil, X } from "lucide-react";

const TYPES = ["county_assessor", "tax_records", "probate_court", "foreclosure", "auction", "obituary", "mls"];
const DISTRESS = ["pre-foreclosure", "foreclosure", "probate_inherited", "tax_delinquent", "code_violation", "divorce", "bankruptcy", "auction", "short_sale", "bank_owned"];
const FREQ = ["daily", "weekly", "monthly"];

const empty = { name: "", type: "foreclosure", url: "", state: "FL", county: "", distress_type: "foreclosure", max_results: 20, scrape_frequency: "daily", method: "ai" };

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.3em] text-black/40">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls = "w-full rounded-sm border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-black";

export default function AdminSources() {
  const [user, setUser] = useState(null);
  const [sources, setSources] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      if (u.role !== "admin") { setLoading(false); return; }
      const [s, j] = await Promise.all([
        base44.entities.DataSource.list(),
        base44.entities.ScrapeJob.list("-created_date", 20)
      ]);
      setSources(s); setJobs(j);
    } catch (e) { setMsg(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setMsg(""); setBusy("save");
    try {
      const cfg = { method: form.method, state: form.state, county: form.county, distress_type: form.distress_type, max_results: Number(form.max_results) };
      const payload = {
        name: form.name,
        type: form.type,
        url: form.url || `https://${form.state.toLowerCase()}-${(form.county || "region").toLowerCase()}.gov`,
        scrape_frequency: form.scrape_frequency,
        scrape_config: cfg,
        status: "active",
        health_score: 80
      };
      if (editingId) await base44.entities.DataSource.update(editingId, payload);
      else await base44.entities.DataSource.create(payload);
      setForm(empty); setEditingId(null); setShowForm(false);
      await load();
    } catch (e) { setMsg(e.message); }
    setBusy("");
  };

  const edit = (s) => {
    const cfg = s.scrape_config || {};
    setForm({
      name: s.name, type: s.type, url: s.url, state: cfg.state || "FL", county: cfg.county || "",
      distress_type: cfg.distress_type || "foreclosure", max_results: cfg.max_results || 20,
      scrape_frequency: s.scrape_frequency || "daily", method: cfg.method || "ai"
    });
    setEditingId(s.id); setShowForm(true);
  };

  const toggle = async (s) => {
    await base44.entities.DataSource.update(s.id, { status: s.status === "active" ? "inactive" : "active" });
    load();
  };
  const remove = async (s) => {
    if (!confirm(`Delete source "${s.name}"?`)) return;
    await base44.entities.DataSource.delete(s.id);
    if (editingId === s.id) { setForm(empty); setEditingId(null); setShowForm(false); }
    load();
  };

  const run = async (s) => {
    setMsg(""); setBusy(s.id);
    try {
      const res = await base44.functions.invoke("scrapeProperties", { source_id: s.id });
      if (res.data?.error) setMsg(`${s.name}: ${res.data.error}`);
      else setMsg(`${s.name}: found ${res.data.found}, +${res.data.new} new, ${res.data.updated} updated`);
      await load();
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    setBusy("");
  };

  if (loading) return <div className="px-6 py-32 text-center text-sm text-black/50">Loading…</div>;
  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-6 py-32 text-center">
        <h1 className="font-display text-3xl font-light">Admin only</h1>
        <p className="mt-3 text-sm text-black/60">You need an admin account to manage scrape sources.</p>
      </div>
    );
  }

  const active = sources.filter((s) => s.status === "active").length;
  const totalYielded = sources.reduce((n, s) => n + (s.properties_yielded || 0), 0);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Admin</p>
          <h1 className="mt-3 font-display text-4xl font-light tracking-tight">Scrape Source Manager</h1>
        </div>
        <button
          onClick={() => { setForm(empty); setEditingId(null); setShowForm(!showForm); }}
          className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-white"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Close" : "Add source"}
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[["Total sources", sources.length], ["Active", active], ["Properties yielded", totalYielded], ["Recent jobs", jobs.length]].map(([l, v]) => (
          <div key={l} className="rounded-sm border border-black/10 p-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">{l}</p>
            <p className="mt-2 font-display text-2xl font-light tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="mt-8 rounded-sm border border-black/10 p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">{editingId ? "Edit source" : "New source"}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Miami-Dade Foreclosures" /></Field>
            <Field label="Type">
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Reference URL"><input className={inputCls} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></Field>
            <Field label="State"><input className={inputCls} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="FL" /></Field>
            <Field label="County / Region"><input className={inputCls} value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} placeholder="Miami-Dade" /></Field>
            <Field label="Distress type">
              <select className={inputCls} value={form.distress_type} onChange={(e) => setForm({ ...form, distress_type: e.target.value })}>
                {DISTRESS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Max results"><input type="number" className={inputCls} value={form.max_results} onChange={(e) => setForm({ ...form, max_results: e.target.value })} /></Field>
            <Field label="Frequency">
              <select className={inputCls} value={form.scrape_frequency} onChange={(e) => setForm({ ...form, scrape_frequency: e.target.value })}>
                {FREQ.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Method">
              <select className={inputCls} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option value="ai">ai (LLM web search)</option>
                <option value="browser">browser (Browserbase fetch)</option>
              </select>
            </Field>
          </div>
          <div className="mt-5 flex gap-3">
            <button onClick={save} disabled={busy === "save" || !form.name} className="rounded-sm bg-black px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
              {busy === "save" ? "Saving…" : editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button onClick={() => { setForm(empty); setEditingId(null); setShowForm(false); }} className="rounded-sm border border-black/15 px-6 py-3 text-[11px] uppercase tracking-[0.3em]">Cancel</button>
            )}
          </div>
        </div>
      )}

      {msg && <p className="mt-6 rounded-sm bg-black/5 px-4 py-3 text-sm text-black/70">{msg}</p>}

      <div className="mt-10">
        <h2 className="font-display text-2xl font-light">Sources</h2>
        <div className="mt-5 divide-y divide-black/10 border-y border-black/10">
          {sources.length === 0 && <p className="py-8 text-sm text-black/50">No sources yet. Add your first Florida region target.</p>}
          {sources.map((s) => {
            const cfg = s.scrape_config || {};
            return (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-base">{s.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${s.status === "active" ? "bg-black text-white" : "border border-black/15 text-black/50"}`}>{s.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-black/50">
                    {cfg.county ? `${cfg.county}, ${cfg.state || "FL"}` : cfg.state || "—"} · {cfg.distress_type || s.type} · {cfg.method || "ai"} · {s.scrape_frequency}
                  </p>
                  <p className="mt-1 text-xs text-black/40">
                    Yielded {s.properties_yielded || 0} · Last run {s.last_run_at ? new Date(s.last_run_at).toLocaleString() : "never"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => run(s)} disabled={busy === s.id} className="inline-flex items-center gap-1.5 rounded-sm bg-black px-3.5 py-2 text-[10px] uppercase tracking-[0.2em] text-white disabled:opacity-50">
                    <Play className="h-3.5 w-3.5" /> {busy === s.id ? "Running…" : "Run now"}
                  </button>
                  <button onClick={() => edit(s)} className="rounded-sm border border-black/15 p-2" aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => toggle(s)} className="rounded-sm border border-black/15 p-2" aria-label="Toggle"><Power className="h-3.5 w-3.5" /></button>
                  <button onClick={() => remove(s)} className="rounded-sm border border-black/15 p-2 text-red-600" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl font-light">Recent scrape jobs</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                <th className="pb-3">Source</th><th className="pb-3">Status</th><th className="pb-3">Found</th><th className="pb-3">New</th><th className="pb-3">Updated</th><th className="pb-3">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {jobs.length === 0 && <tr><td colSpan={6} className="py-4 text-black/50">No jobs yet.</td></tr>}
              {jobs.map((j) => (
                <tr key={j.id} className="tabular-nums">
                  <td className="py-3">{j.source_name || "—"}</td>
                  <td className="py-3">{j.status}</td>
                  <td className="py-3">{j.properties_found || 0}</td>
                  <td className="py-3">{j.properties_new || 0}</td>
                  <td className="py-3">{j.properties_updated || 0}</td>
                  <td className="py-3 text-black/50">{j.completed_at ? new Date(j.completed_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}