import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Mail, Building2, ShieldCheck } from "lucide-react";

export default function AdminOutreach() {
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState("Florida");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      if (u.role !== "admin") { setLoading(false); return; }
      const l = await base44.entities.InvestorLead.list("-created_date", 100);
      setLeads(l);
      const h = await base44.entities.SystemHealth.list("-run_at", 1);
      setHealth(h[0] || null);
    } catch (e) { setMsg(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const scrape = async () => {
    setMsg(""); setBusy("scrape");
    try {
      const res = await base44.functions.invoke("scrapeInvestors", { region, max_results: 20 });
      setMsg(res.data?.error ? `Error: ${res.data.error}` : `Scraped ${res.data.region || region}: ${res.data.saved} new investor leads (of ${res.data.found} found).`);
      await load();
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    setBusy("");
  };

  const emailInvestors = async () => {
    setMsg(""); setBusy("emailInv");
    try {
      const res = await base44.functions.invoke("outreachInvestors", { limit: 50 });
      setMsg(res.data?.error ? `Error: ${res.data.error}` : `Sent ${res.data.sent} investor invitation emails.`);
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    setBusy("");
  };

  const emailSellers = async () => {
    setMsg(""); setBusy("emailSell");
    try {
      const res = await base44.functions.invoke("outreachSellers", { limit: 50 });
      setMsg(res.data?.error ? `Error: ${res.data.error}` : `Sent ${res.data.sent} seller outreach emails.`);
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    setBusy("");
  };

  const validate = async () => {
    setMsg(""); setBusy("validate");
    try {
      const res = await base44.functions.invoke("validateSystem", {});
      if (res.data?.error) setMsg(`Error: ${res.data.error}`);
      else { setMsg(`System ${res.data.overall_status.toUpperCase()} — ${res.data.actions_taken?.length || 0} auto-heal actions taken.`); await load(); }
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    setBusy("");
  };

  if (loading) return <div className="px-6 py-32 text-center text-sm text-black/50">Loading…</div>;
  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-6 py-32 text-center">
        <h1 className="font-display text-3xl font-light">Admin only</h1>
        <p className="mt-3 text-sm text-black/60">You need an admin account to manage outreach.</p>
      </div>
    );
  }

  const newCount = leads.filter((l) => l.outreach_status === "new").length;
  const contactedCount = leads.filter((l) => l.outreach_status === "contacted").length;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12">
      <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Admin</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight">Autonomous Outreach</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/60">
        The system auto-scrapes investor contacts, emails them invitations, and emails distressed-property owners
        inviting them to list. This runs nightly at 3 AM ET — trigger any stage manually below.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[["Total leads", leads.length], ["New", newCount], ["Contacted", contactedCount], ["Last run", "3 AM ET daily"]].map(([l, v]) => (
          <div key={l} className="rounded-sm border border-black/10 p-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">{l}</p>
            <p className="mt-2 font-display text-2xl font-light tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-sm border border-black/10 p-6">
          <Search className="h-5 w-5 text-black/60" />
          <p className="mt-4 font-display text-lg">Scrape investor leads</p>
          <p className="mt-1 text-xs text-black/50">AI web search finds active investors in a region.</p>
          <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Miami-Dade, FL" className="mt-4 w-full rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
          <button onClick={scrape} disabled={busy === "scrape"} className="mt-3 w-full rounded-sm bg-black py-3 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
            {busy === "scrape" ? "Scraping…" : "Scrape region"}
          </button>
        </div>
        <div className="rounded-sm border border-black/10 p-6">
          <Mail className="h-5 w-5 text-black/60" />
          <p className="mt-4 font-display text-lg">Email investors</p>
          <p className="mt-1 text-xs text-black/50">Send invitations to all new investor leads.</p>
          <button onClick={emailInvestors} disabled={busy === "emailInv"} className="mt-6 w-full rounded-sm bg-black py-3 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
            {busy === "emailInv" ? "Sending…" : "Email new investors"}
          </button>
        </div>
        <div className="rounded-sm border border-black/10 p-6">
          <Building2 className="h-5 w-5 text-black/60" />
          <p className="mt-4 font-display text-lg">Email sellers</p>
          <p className="mt-1 text-xs text-black/50">Email distressed-property owners a cash-offer pitch.</p>
          <button onClick={emailSellers} disabled={busy === "emailSell"} className="mt-6 w-full rounded-sm bg-black py-3 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
            {busy === "emailSell" ? "Sending…" : "Email sellers"}
          </button>
        </div>
      </div>

      {msg && <p className="mt-6 rounded-sm bg-black/5 px-4 py-3 text-sm text-black/70">{msg}</p>}

      <div className="mt-12 rounded-sm border border-black/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-black/60" />
              <h2 className="font-display text-2xl font-light">System validation & auto-heal</h2>
            </div>
            <p className="mt-1 text-sm text-black/50">Runs nightly at 4 AM ET. Inspects all subsystems, logs health, re-runs failed sources.</p>
          </div>
          <button onClick={validate} disabled={busy === "validate"} className="rounded-sm bg-black px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
            {busy === "validate" ? "Validating…" : "Run validation"}
          </button>
        </div>

        {health && (
          <div className="mt-6">
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${health.overall_status === "healthy" ? "bg-emerald-600 text-white" : health.overall_status === "degraded" ? "bg-amber-500 text-white" : "bg-red-600 text-white"}`}>{health.overall_status}</span>
              <span className="text-xs text-black/50">Last run {new Date(health.run_at).toLocaleString()}</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(health.metrics || {}).map(([k, v]) => (
                <div key={k} className="rounded-sm bg-black/5 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">{k.replace(/_/g, " ")}</p>
                  <p className="mt-1 font-display text-xl tabular-nums">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {(health.checks || []).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-black/60">{c.name.replace(/_/g, " ")}</span>
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${c.status === "healthy" ? "bg-emerald-500" : c.status === "degraded" ? "bg-amber-500" : "bg-red-500"}`} />
                    <span className="text-black/50">{c.detail}</span>
                  </span>
                </div>
              ))}
            </div>
            {(health.actions_taken || []).length > 0 && (
              <div className="mt-4 rounded-sm bg-black p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Auto-heal actions</p>
                <ul className="mt-2 space-y-1 text-xs text-white/80">
                  {health.actions_taken.map((a, i) => <li key={i}>· {a}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl font-light">Investor leads</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                <th className="pb-3">Name</th><th className="pb-3">Company</th><th className="pb-3">Region</th><th className="pb-3">Contact</th><th className="pb-3">Status</th><th className="pb-3">Last contacted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {leads.length === 0 && <tr><td colSpan={6} className="py-4 text-black/50">No leads yet. Scrape a region to start.</td></tr>}
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="py-3">{l.name}</td>
                  <td className="py-3 text-black/60">{l.company || "—"}</td>
                  <td className="py-3 text-black/60">{l.region || "—"}</td>
                  <td className="py-3 text-black/60">{l.email || l.phone || "—"}</td>
                  <td className="py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${l.outreach_status === "new" ? "border border-black/15 text-black/60" : "bg-black text-white"}`}>{l.outreach_status}</span></td>
                  <td className="py-3 text-black/50">{l.last_contacted ? new Date(l.last_contacted).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}