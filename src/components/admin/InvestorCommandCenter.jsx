import React, { useState, useEffect, useCallback } from "react";
import {
  Mail, Phone, MessageSquare, Mic, Search, RefreshCw, Loader2, X,
  Globe, MapPin, Building2, Sparkles, Send, NotebookPen, Brain, TrendingUp, Copy, Check
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import FollowUpControls from "@/components/admin/FollowUpControls";

const STATUS_OPTS = ["new", "contacted", "responded", "opted_out"];

export default function InvestorCommandCenter() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const records = await base44.entities.InvestorLead.list("-created_date", 300);
      setInvestors(records);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = investors.filter(inv => {
    if (statusFilter !== "all" && inv.outreach_status !== statusFilter) return false;
    const s = q.toLowerCase();
    if (!s) return true;
    return [inv.name, inv.company, inv.email, inv.phone, inv.region, inv.source]
      .filter(Boolean).some(v => v.toLowerCase().includes(s));
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header + filters */}
      <div className="border-b border-black/10 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Investor Command Center</h2>
            <p className="text-xs text-black/40">
              {filtered.length} of {investors.length} leads · multi-channel comms, follow-up, AI intel & scoring
            </p>
          </div>
          <button onClick={load} disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-black/15 px-3 py-1.5 text-xs hover:bg-black/5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/30" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, company, email, region…"
              className="w-full rounded-md border border-black/15 bg-[#f7f5f0] py-1.5 pl-9 pr-3 text-sm outline-none focus:border-[#c38a1b]" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-md border border-black/15 bg-white py-1.5 px-3 text-xs">
            <option value="all">All statuses</option>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-black/40" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-black/40">No investor leads match. Use Sourcing → Data Sources to find investors.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-black/10 bg-white">
              <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-black/40">
                <th className="px-4 py-2.5">Investor / Company</th>
                <th className="px-4 py-2.5">Contact</th>
                <th className="px-4 py-2.5">Markets / Types</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Follow-up</th>
                <th className="px-4 py-2.5 text-right">Quick Comms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.map(inv => (
                <tr key={inv.id} className="cursor-pointer hover:bg-black/[0.02]" onClick={() => setSelected(inv)}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{inv.name}</p>
                    {inv.company && <p className="text-xs text-black/50">{inv.company}</p>}
                    <p className="mt-0.5 text-[10px] text-black/30">{inv.source || "—"} · {inv.contact_count || 0} contacts</p>
                  </td>
                  <td className="px-4 py-3">
                    {inv.email && <p className="flex items-center gap-1.5 text-xs"><Mail className="h-3 w-3 text-black/40" />{inv.email}</p>}
                    {inv.phone && <p className="flex items-center gap-1.5 text-xs text-black/60"><Phone className="h-3 w-3 text-black/40" />{inv.phone}</p>}
                    {inv.website && <p className="flex items-center gap-1.5 text-xs text-black/60"><Globe className="h-3 w-3 text-black/40" />{inv.website}</p>}
                    {!inv.email && !inv.phone && <span className="text-xs text-black/30">No contact info</span>}
                  </td>
                  <td className="px-4 py-3">
                    {(inv.target_markets || []).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {inv.target_markets.slice(0, 2).map((m, i) => <span key={i} className="rounded-full bg-black/5 px-2 py-0.5 text-[10px]">{m}</span>)}
                        {inv.target_markets.length > 2 && <span className="text-[10px] text-black/40">+{inv.target_markets.length - 2}</span>}
                      </div>
                    ) : <span className="text-xs text-black/30">—</span>}
                    {(inv.investment_types || []).length > 0 && <p className="mt-1 text-[10px] text-black/40">{inv.investment_types.join(", ")}</p>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={inv.outreach_status} /></td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <FollowUpControls targetType="investor" record={inv} onUpdate={load} />
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="inline-flex gap-1">
                      <IconBtn title="Email" onClick={() => setSelected({ ...inv, _tab: "email" })}><Mail className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn title="SMS / MMS" onClick={() => setSelected({ ...inv, _tab: "sms" })}><MessageSquare className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn title="AI voice script" onClick={() => setSelected({ ...inv, _tab: "voice" })}><Mic className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn title="AI intel" onClick={() => setSelected({ ...inv, _tab: "intel" })}><Brain className="h-3.5 w-3.5" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && !selected._tab && <InvestorDrawer investor={selected} onClose={() => setSelected(null)} onUpdate={load} />}
      {selected && selected._tab && <InvestorDrawer investor={selected} initialTab={selected._tab} onClose={() => setSelected(null)} onUpdate={load} />}
    </div>
  );
}

function IconBtn({ children, title, onClick }) {
  return (
    <button title={title} onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-black/10 text-black/60 transition hover:border-[#c38a1b] hover:bg-amber-50 hover:text-[#8f6110]">
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const styles = {
    new: "bg-blue-50 text-blue-700", contacted: "bg-amber-50 text-amber-700",
    responded: "bg-emerald-50 text-emerald-700", opted_out: "bg-red-50 text-red-700",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${styles[status] || styles.new}`}>{status || "new"}</span>;
}

/* ---------- Detail drawer with tabs ---------- */
function InvestorDrawer({ investor, initialTab = "overview", onClose, onUpdate }) {
  const [tab, setTab] = useState(initialTab);
  const tabs = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "email", label: "Email", icon: Mail },
    { id: "sms", label: "SMS / MMS", icon: MessageSquare },
    { id: "voice", label: "Voice Script", icon: Mic },
    { id: "intel", label: "AI Intel", icon: Brain },
    { id: "pitch", label: "Pitch", icon: TrendingUp },
    { id: "followup", label: "Follow-up", icon: NotebookPen },
    { id: "notes", label: "Notes", icon: NotebookPen },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-black/10 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200">
            <Building2 className="h-5 w-5 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{investor.name}</p>
            <p className="text-xs text-black/50">{investor.company || "—"} · {investor.email || investor.phone || "no contact"}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-black/40 hover:bg-black/5"><X className="h-4 w-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-black/10 px-3">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition ${
                tab === t.id ? "border-[#c38a1b] text-[#8f6110]" : "border-transparent text-black/50 hover:text-black"}`}>
              <t.icon className="h-3.5 w-3.5" />{t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "overview" && <OverviewTab investor={investor} />}
          {tab === "email" && <EmailTab investor={investor} onUpdate={onUpdate} />}
          {tab === "sms" && <SmsTab investor={investor} />}
          {tab === "voice" && <VoiceTab investor={investor} />}
          {tab === "intel" && <IntelTab investor={investor} />}
          {tab === "pitch" && <PitchTab investor={investor} />}
          {tab === "followup" && <div className="space-y-4"><FollowUpControls targetType="investor" record={investor} onUpdate={onUpdate} expanded /></div>}
          {tab === "notes" && <NotesTab investor={investor} onUpdate={onUpdate} />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ investor }) {
  const fields = [
    ["Company", investor.company], ["Email", investor.email], ["Phone", investor.phone],
    ["Website", investor.website], ["Region", investor.region], ["Source", investor.source],
    ["Contact count", investor.contact_count], ["Last contacted", investor.last_contacted ? new Date(investor.last_contacted).toLocaleDateString() : "—"],
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {fields.map(([k, v]) => (
          <div key={k} className="rounded-md border border-black/10 bg-[#f7f5f0] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-black/40">{k}</p>
            <p className="mt-0.5 text-sm">{v || "—"}</p>
          </div>
        ))}
      </div>
      {(investor.target_markets || []).length > 0 && (
        <div><p className="mb-1.5 text-[10px] uppercase tracking-[0.15em] text-black/40">Target markets</p>
          <div className="flex flex-wrap gap-1.5">{investor.target_markets.map((m, i) => <span key={i} className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-xs"><MapPin className="h-3 w-3" />{m}</span>)}</div>
        </div>
      )}
      {(investor.investment_types || []).length > 0 && (
        <div><p className="mb-1.5 text-[10px] uppercase tracking-[0.15em] text-black/40">Investment types</p>
          <div className="flex flex-wrap gap-1.5">{investor.investment_types.map((t, i) => <span key={i} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-[#8f6110]">{t}</span>)}</div>
        </div>
      )}
    </div>
  );
}

/* ---------- AI generators ---------- */
function useGenerator() {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const generate = async (prompt) => {
    setLoading(true); setOutput("");
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: null });
      setOutput(typeof res === "string" ? res : res.content || JSON.stringify(res));
    } catch (e) { setOutput(`Error: ${e.message}`); }
    setLoading(false);
  };
  const copy = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return { output, loading, generate, copy, copied };
}

function GenPanel({ title, onGenerate, output, loading, copy, copied, placeholder }) {
  return (
    <div className="space-y-3">
      <button onClick={onGenerate} disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-gradient-to-br from-[#e4b653] to-[#c38a1b] px-4 py-2 text-xs font-medium text-[#120e07] disabled:opacity-50">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {loading ? "Generating…" : `Generate ${title}`}
      </button>
      {output && (
        <div className="relative">
          <textarea readOnly value={output}
            className="h-64 w-full resize-none rounded-md border border-black/15 bg-[#f7f5f0] p-3 text-sm outline-none" />
          <button onClick={copy} className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[10px] border border-black/10 hover:bg-black/5">
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}{copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      {!output && !loading && <p className="text-xs text-black/30">{placeholder}</p>}
    </div>
  );
}

function EmailTab({ investor, onUpdate }) {
  const g = useGenerator();
  const prompt = `Write a personalized, professional outreach email to a real estate investor prospect.
Name: ${investor.name || "there"}
Company: ${investor.company || "N/A"}
Markets: ${(investor.target_markets || []).join(", ") || "Florida"}
Investment types: ${(investor.investment_types || []).join(", ") || "distressed/off-market"}

Position HPI (Hidden Property Intel) as the AI-powered platform for off-market distressed Florida properties — automated sourcing from 30+ distress sources, 15-category AI valuation, multi-channel Xtreme Comms outreach, and Polygon smart-contract escrow (3% fee, closes in days not weeks).
Offer: waive their first month of membership AND 50% off their first smart-contract escrow fee.
Tone: confident, concise, relationship-first. End with a clear call to action to book a 15-min demo.`;
  return <GenPanel title="Email" onGenerate={() => g.generate(prompt)} output={g.output} loading={g.loading} copy={g.copy} copied={g.copied}
    placeholder="Generate a personalized investor outreach email with the launch offer." />;
}

function SmsTab({ investor }) {
  const g = useGenerator();
  const prompt = `Write two short messages for a real estate investor prospect — one SMS (under 160 chars) and one MMS (under 300 chars, can include a link placeholder).
Investor: ${investor.name || "there"}${investor.company ? `, ${investor.company}` : ""}.
Goal: introduce HPI (AI-powered off-market distressed FL property platform + smart-contract escrow), mention first month waived + 50% off first escrow, and invite a quick call. Friendly, direct, compliant (no spam language). Label them "SMS:" and "MMS:".`;
  return <GenPanel title="SMS / MMS" onGenerate={() => g.generate(prompt)} output={g.output} loading={g.loading} copy={g.copy} copied={g.copied}
    placeholder="Generate SMS and MMS messages with the launch offer." />;
}

function VoiceTab({ investor }) {
  const g = useGenerator();
  const prompt = `Write an AI voice call script (for an AI voice agent calling a real estate investor prospect).
Investor: ${investor.name || "there"}${investor.company ? `, ${investor.company}` : ""}.
Markets: ${(investor.target_markets || []).join(", ") || "Florida"}.
Structure: greeting → value prop (HPI: AI-sourced off-market distressed FL properties, 15-category valuation, Xtreme Comms, smart-contract escrow) → offer (first month waived + 50% off first escrow) → qualify (are they actively buying distressed FL property?) → book a 15-min demo → handle 2 common objections.
Format as [Agent]: lines. Keep each turn under 25 words. Conversational, warm, professional.`;
  return <GenPanel title="Voice Script" onGenerate={() => g.generate(prompt)} output={g.output} loading={g.loading} copy={g.copy} copied={g.copied}
    placeholder="Generate an AI voice call script with objection handling." />;
}

function IntelTab({ investor }) {
  const g = useGenerator();
  const prompt = `Research this real estate investor prospect and return a structured intelligence brief.
Name: ${investor.name || "—"}
Company: ${investor.company || "—"}
Website: ${investor.website || "—"}
Markets: ${(investor.target_markets || []).join(", ") || "—"}
Investment types: ${(investor.investment_types || []).join(", ") || "—"}

Find (using web search):
1. Company overview & years in business (estimate if not found)
2. Google reviews summary & rating (if available)
3. Social media presence (LinkedIn, Facebook, Instagram)
4. Known associates, partners, or closest business relationships
5. Recent activity or news
6. Sales hooks — 3 tailored recommendations on how HPI can help them, with incentives/promotions to establish a helpful relationship
7. Adjacent business relationships worth exploring

Be concise and factual. If info is unavailable, say so rather than guessing.`;
  return <GenPanel title="AI Intel" onGenerate={() => g.generate(prompt)} output={g.output} loading={g.loading} copy={g.copy} copied={g.copied}
    placeholder="Research the investor's company, reviews, socials, associates, and sales hooks via web search." />;
}

function PitchTab({ investor }) {
  const g = useGenerator();
  const prompt = `Create a personalized pitch deck-style summary (text) for a real estate investor prospect explaining HPI's benefits.
Investor: ${investor.name || "—"}${investor.company ? `, ${investor.company}` : ""}.
Sections:
1. Why HPI is different (AI sourcing from 30+ FL distress sources, 15-category valuation, Xtreme Comms multi-channel outreach, Polygon smart-contract escrow closing in days)
2. How quickly we're gaining attention (fast-growing FL-focused platform)
3. What we waive (first month of membership + 50% off first smart-contract escrow fee)
4. Why now (Florida distressed inventory is peaking)
5. Next step (15-min demo)
Tone: confident, data-driven, relationship-first. Keep it under 400 words.`;
  return <GenPanel title="Pitch" onGenerate={() => g.generate(prompt)} output={g.output} loading={g.loading} copy={g.copy} copied={g.copied}
    placeholder="Generate a personalized pitch emphasizing benefits, differentiation, and the launch offer." />;
}

function NotesTab({ investor, onUpdate }) {
  const [notes, setNotes] = useState(investor.notes || "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { await base44.entities.InvestorLead.update(investor.id, { notes }); onUpdate(); } catch (e) { console.error(e); }
    setSaving(false);
  };
  return (
    <div className="space-y-3">
      <textarea value={notes} onChange={e => setNotes(e.target.value)}
        className="h-64 w-full resize-none rounded-md border border-black/15 bg-[#f7f5f0] p-3 text-sm outline-none focus:border-[#c38a1b]"
        placeholder="Call notes, relationship history, AI tone-scoring of responses…" />
      <button onClick={save} disabled={saving}
        className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-xs text-white disabled:opacity-50">
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}Save notes
      </button>
    </div>
  );
}