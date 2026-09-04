import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { EMAIL_TEMPLATES, getCategories } from "../../base44/shared/emailTemplates";
import {
  Mail, Send, Inbox, PenSquare, FileText, CheckCircle2, AlertTriangle,
  XCircle, Eye, RefreshCw, Search, Sparkles, ShieldCheck, Clock,
} from "lucide-react";

export default function EdenEmailCenter() {
  const [tab, setTab] = useState("sent");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);

  // Compose state
  const [compose, setCompose] = useState({
    to: "",
    to_name: "",
    subject: "",
    body: "",
    audience: "investor",
    contact_id: "",
    contact_type: "external",
    template_id: "",
    skip_qa: false,
  });
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [templateCategory, setTemplateCategory] = useState("all");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const records = await base44.entities.CommunicationLog.list("-sent_at", 100);
      setLogs(records);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = logs.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (l.subject || "").toLowerCase().includes(q) ||
        (l.to_email || "").toLowerCase().includes(q) ||
        (l.to_name || "").toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === "sent").length,
    qa_failed: logs.filter(l => l.status === "qa_failed").length,
    failed: logs.filter(l => l.status === "failed").length,
    avg_qa: logs.length > 0
      ? Math.round(logs.filter(l => l.qa_score).reduce((s, l) => s + l.qa_score, 0) / Math.max(logs.filter(l => l.qa_score).length, 1))
      : 0,
  };

  const applyTemplate = (tpl) => {
    let body = tpl.body;
    let subject = tpl.subject;
    // Replace common variables
    if (compose.to_name) {
      body = body.replace(/\{\{first_name\}\}/g, compose.to_name.split(" ")[0]);
      body = body.replace(/\{\{name\}\}/g, compose.to_name);
      subject = subject.replace(/\{\{first_name\}\}/g, compose.to_name.split(" ")[0]);
      subject = subject.replace(/\{\{name\}\}/g, compose.to_name);
    }
    setCompose({
      ...compose,
      subject,
      body,
      template_id: tpl.id,
      audience: tpl.audience === "seller" ? "owner" : tpl.audience,
    });
  };

  const sendEmail = async () => {
    if (!compose.to || !compose.subject || !compose.body) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await base44.functions.invoke("sendEdenEmail", {
        to: compose.to,
        to_name: compose.to_name,
        subject: compose.subject,
        body: compose.body,
        audience: compose.audience,
        contact_id: compose.contact_id || undefined,
        contact_type: compose.contact_type || undefined,
        template_id: compose.template_id || undefined,
        skip_qa: compose.skip_qa,
      });
      setSendResult(res.data);
      if (res.data?.sent) {
        setCompose({ to: "", to_name: "", subject: "", body: "", audience: "investor", contact_id: "", contact_type: "external", template_id: "", skip_qa: false });
        loadLogs();
      }
    } catch (e) {
      setSendResult({ status: "failed", message: e.message, sent: false });
    }
    setSending(false);
  };

  const categories = ["all", ...getCategories()];
  const templates = templateCategory === "all" ? EMAIL_TEMPLATES : EMAIL_TEMPLATES.filter(t => t.category === templateCategory);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 lg:px-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Eden Skye · Email Command Center</p>
          <h1 className="mt-2 font-display text-3xl font-light tracking-tight sm:text-4xl">Email System</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadLogs} disabled={loading} className="inline-flex items-center gap-2 rounded-sm border border-black/15 px-4 py-2.5 text-[11px] uppercase tracking-[0.3em] hover:bg-black hover:text-white disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 lg:grid-cols-5">
        <Stat icon={Mail} label="Total" value={stats.total} />
        <Stat icon={CheckCircle2} label="Sent" value={stats.sent} tone="emerald" />
        <Stat icon={AlertTriangle} label="QA Failed" value={stats.qa_failed} tone="amber" />
        <Stat icon={XCircle} label="Send Failed" value={stats.failed} tone="red" />
        <Stat icon={ShieldCheck} label="Avg QA Score" value={`${stats.avg_qa}/100`} />
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-black/10">
        {[
          { id: "sent", icon: Send, label: "Sent & Logs" },
          { id: "compose", icon: PenSquare, label: "Compose" },
          { id: "templates", icon: FileText, label: "Templates" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-medium transition ${
              tab === t.id ? "border-black text-black" : "border-transparent text-black/40 hover:text-black/70"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Sent & Logs tab */}
      {tab === "sent" && (
        <div className="mt-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-sm border border-black/15 px-3">
              <Search className="h-4 w-4 text-black/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject, recipient..."
                className="w-full border-0 py-2.5 text-sm outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none"
            >
              <option value="all">All statuses</option>
              <option value="sent">Sent</option>
              <option value="qa_failed">QA Failed</option>
              <option value="failed">Send Failed</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-black/40">Loading email logs…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-black/40">No emails found. Compose and send your first email from Eden.</div>
          ) : (
            <div className="mt-4 divide-y divide-black/10 border-y border-black/10">
              {filtered.map((log) => (
                <div key={log.id} className="flex items-center gap-4 py-4 hover:bg-black/[0.02]">
                  <div className="shrink-0">
                    {log.status === "sent" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> :
                     log.status === "qa_failed" ? <AlertTriangle className="h-5 w-5 text-amber-500" /> :
                     <XCircle className="h-5 w-5 text-red-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{log.subject || "(no subject)"}</p>
                      {log.qa_score != null && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] ${
                          log.qa_score >= 80 ? "bg-emerald-100 text-emerald-700" :
                          log.qa_score >= 70 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>QA {log.qa_score}</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-black/50">
                      To: {log.to_name ? `${log.to_name} <${log.to_email}>` : log.to_email}
                      {log.audience && <span className="ml-2 capitalize">· {log.audience}</span>}
                      {log.sent_at && <span className="ml-2">· {new Date(log.sent_at).toLocaleString()}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="shrink-0 rounded-sm border border-black/15 p-2 text-black/50 hover:bg-black hover:text-white"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compose tab */}
      {tab === "compose" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr 320px]">
          <div className="space-y-4">
            <div className="rounded-sm border border-black/10 p-5">
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-black/40">To</label>
                  <input value={compose.to} onChange={(e) => setCompose({ ...compose, to: e.target.value })} placeholder="recipient@example.com" className="rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-black/40">Recipient Name</label>
                  <input value={compose.to_name} onChange={(e) => setCompose({ ...compose, to_name: e.target.value })} placeholder="John Smith" className="rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <label className="text-[10px] uppercase tracking-[0.3em] text-black/40">Audience</label>
                    <select value={compose.audience} onChange={(e) => setCompose({ ...compose, audience: e.target.value })} className="rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none">
                      <option value="investor">Investor</option>
                      <option value="owner">Owner</option>
                      <option value="heir">Heir</option>
                      <option value="agent">Agent</option>
                      <option value="internal">Internal</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-[10px] uppercase tracking-[0.3em] text-black/40">Contact Type</label>
                    <select value={compose.contact_type} onChange={(e) => setCompose({ ...compose, contact_type: e.target.value })} className="rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none">
                      <option value="external">External</option>
                      <option value="InvestorLead">InvestorLead</option>
                      <option value="Owner">Owner</option>
                      <option value="Seller">Seller</option>
                      <option value="Deal">Deal</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-black/40">Subject</label>
                  <input value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })} placeholder="Email subject" className="rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-black/40">Body (HTML)</label>
                  <textarea value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} placeholder="<div>Your email content...</div>" rows={14} className="rounded-sm border border-black/15 px-3 py-2.5 font-mono text-xs outline-none focus:border-black" />
                </div>
                <label className="flex items-center gap-2 text-xs text-black/60">
                  <input type="checkbox" checked={compose.skip_qa} onChange={(e) => setCompose({ ...compose, skip_qa: e.target.checked })} className="h-4 w-4" />
                  Skip QA validation (send immediately without scoring)
                </label>
              </div>
            </div>

            {sendResult && (
              <div className={`rounded-sm border p-4 text-sm ${
                sendResult.sent ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                sendResult.status === "qa_failed" ? "border-amber-200 bg-amber-50 text-amber-700" :
                "border-red-200 bg-red-50 text-red-700"
              }`}>
                <div className="flex items-center gap-2">
                  {sendResult.sent ? <CheckCircle2 className="h-5 w-5" /> :
                   sendResult.status === "qa_failed" ? <AlertTriangle className="h-5 w-5" /> :
                   <XCircle className="h-5 w-5" />}
                  <p className="font-medium">{sendResult.message}</p>
                </div>
                {sendResult.qa_findings?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {sendResult.qa_findings.map((f, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-medium capitalize">{f.dimension}</span> ({f.severity}): {f.finding}
                        {f.recommendation && <span className="block text-black/50">→ {f.recommendation}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={sendEmail}
              disabled={sending || !compose.to || !compose.subject || !compose.body}
              className="inline-flex items-center gap-2 rounded-sm bg-black px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-30"
            >
              {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending…" : "Send via Eden"}
            </button>
          </div>

          {/* Template picker sidebar */}
          <div className="space-y-3">
            <div className="rounded-sm border border-black/10 p-4">
              <p className="flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-gold" /> Quick Templates</p>
              <p className="mt-1 text-xs text-black/40">Click to load into composer</p>
              <select
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
                className="mt-3 w-full rounded-sm border border-black/15 px-3 py-2 text-xs outline-none"
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="mt-3 max-h-[400px] space-y-2 overflow-y-auto">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl)}
                    className="block w-full rounded-sm border border-black/10 p-3 text-left hover:border-black/30 hover:bg-black/[0.02]"
                  >
                    <p className="text-xs font-medium">{tpl.name}</p>
                    <p className="mt-0.5 text-[10px] text-black/40">{tpl.subject}</p>
                    <span className="mt-1 inline-block rounded-full bg-black/5 px-2 py-0.5 text-[8px] uppercase tracking-[0.2em] text-black/50">{tpl.audience}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates tab */}
      {tab === "templates" && (
        <div className="mt-6">
          <p className="text-sm text-black/50">Browse the full template gallery with QA validation at the <a href="/admin/email-gallery" className="underline">Email Gallery page</a>.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EMAIL_TEMPLATES.slice(0, 12).map((tpl) => (
              <div key={tpl.id} className="rounded-sm border border-black/10 p-4">
                <p className="text-sm font-medium">{tpl.name}</p>
                <p className="mt-1 text-xs text-black/50">{tpl.description}</p>
                <p className="mt-2 text-[10px] text-black/40">Subject: {tpl.subject}</p>
                <div className="mt-2 flex gap-2">
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[8px] uppercase tracking-[0.2em] text-black/50">{tpl.audience}</span>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[8px] uppercase tracking-[0.2em] text-black/50">{tpl.tone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email detail modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedLog(null)}>
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-sm border border-black/10 bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-light">{selectedLog.subject}</h3>
              <button onClick={() => setSelectedLog(null)} className="text-black/40 hover:text-black"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-2 text-xs text-black/50">
              <p><strong>From:</strong> {selectedLog.from_name} (Eden Skye)</p>
              <p><strong>To:</strong> {selectedLog.to_name ? `${selectedLog.to_name} <${selectedLog.to_email}>` : selectedLog.to_email}</p>
              <p><strong>Sent:</strong> {selectedLog.sent_at ? new Date(selectedLog.sent_at).toLocaleString() : "—"}</p>
              <p><strong>Status:</strong> {selectedLog.status}</p>
              {selectedLog.qa_score != null && <p><strong>QA Score:</strong> {selectedLog.qa_score}/100 ({selectedLog.qa_passed ? "passed" : "failed"})</p>}
              {selectedLog.audience && <p><strong>Audience:</strong> {selectedLog.audience}</p>}
              {selectedLog.template_id && <p><strong>Template:</strong> {selectedLog.template_id}</p>}
            </div>
            {selectedLog.qa_findings?.length > 0 && (
              <div className="mt-4 rounded-sm bg-amber-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">QA Findings</p>
                <div className="mt-2 space-y-2">
                  {selectedLog.qa_findings.map((f, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-medium capitalize">{f.dimension}</span> ({f.severity}): {f.finding}
                      {f.recommendation && <span className="block text-black/50">→ {f.recommendation}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 rounded-sm border border-black/10 p-4">
              <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-black/40">Email Body</p>
              <div dangerouslySetInnerHTML={{ __html: selectedLog.body }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  const toneCls = tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : tone === "red" ? "text-red-600" : "text-black";
  return (
    <div className="bg-white p-4">
      <Icon className="h-4 w-4 text-black/30" />
      <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-black/40">{label}</p>
      <p className={`mt-1 font-display text-2xl font-light ${toneCls}`}>{value}</p>
    </div>
  );
}