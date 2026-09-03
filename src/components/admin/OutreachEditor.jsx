import React, { useState } from "react";
import { X, Loader2, Send, Sparkles, Mail } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function OutreachEditor({
  targetType,
  record,
  nextOfKin,
  initialMode = "outreach",
  initialNextOfKinIndex = 0,
  recipientEmail: overrideEmail,
  onClose,
  onSent,
}) {
  const [subject, setSubject] = useState(record.last_outreach_subject || "");
  const [body, setBody] = useState(record.last_outreach_body || "");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState(initialMode);
  const [replyContent, setReplyContent] = useState("");
  const [nextOfKinIndex, setNextOfKinIndex] = useState(initialNextOfKinIndex);
  const [error, setError] = useState(null);

  const recipientEmail = overrideEmail || (targetType === "investor" ? record.email : record.contact_email);
  const hasEmail = !!recipientEmail;

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const fn = targetType === "investor" ? "generateInvestorOutreach" : "generateOwnerOutreach";
      const payload =
        targetType === "investor"
          ? { lead_id: record.id, mode: mode === "reply" ? "reply" : "outreach", reply_content: replyContent }
          : { owner_id: record.id, mode: mode === "next_of_kin" ? "next_of_kin" : "owner", next_of_kin_index: nextOfKinIndex };
      const res = await base44.functions.invoke(fn, payload);
      setSubject(res.data.subject);
      setBody(res.data.body);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setGenerating(false);
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      await base44.functions.invoke("sendOutreach", {
        entity_type: targetType,
        record_id: record.id,
        to_email: recipientEmail,
        subject,
        body,
      });
      onSent?.();
      onClose?.();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setSending(false);
  };

  const modes =
    targetType === "investor"
      ? [
          { id: "outreach", label: "Outreach" },
          { id: "reply", label: "Reply Generator" },
        ]
      : [
          { id: "outreach", label: "Owner Outreach" },
          ...(nextOfKin?.length ? [{ id: "next_of_kin", label: "Next of Kin" }] : []),
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#c38a1b]" />
            <h3 className="text-sm font-medium">
              {targetType === "investor" ? "Investor" : "Owner"} Outreach — {record.name}
            </h3>
          </div>
          <button onClick={onClose} className="text-black/40 hover:text-black">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-black/10 px-5 py-2">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mode === m.id ? "bg-black text-white" : "text-black/50 hover:bg-black/5"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {mode === "reply" && (
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-black/40">Their Reply</label>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Paste the investor's reply email here..."
                rows={4}
                className="w-full rounded-md border border-black/15 p-3 text-sm focus:outline-none focus:border-black/40"
              />
            </div>
          )}
          {mode === "next_of_kin" && nextOfKin?.length > 0 && (
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-black/40">Select Relative</label>
              <select
                value={nextOfKinIndex}
                onChange={(e) => setNextOfKinIndex(Number(e.target.value))}
                className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-black/40"
              >
                {nextOfKin.map((kin, i) => (
                  <option key={i} value={i}>
                    {kin.name} ({kin.relationship || "relative"})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-black/40">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-black/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-black/40">Email Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full rounded-md border border-black/15 p-3 text-sm focus:outline-none focus:border-black/40"
            />
          </div>
          {error && <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-700">{error}</div>}
        </div>

        <div className="flex items-center justify-between border-t border-black/10 px-5 py-3">
          <button
            onClick={handleGenerate}
            disabled={generating || (mode === "reply" && !replyContent)}
            className="inline-flex items-center gap-2 rounded-md border border-black/15 px-4 py-2 text-xs font-medium disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-[#c38a1b]" />}
            {generating ? "Generating…" : "Generate with AI"}
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !subject || !body || !hasEmail}
            className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {sending ? "Sending…" : "Ready to Send"}
          </button>
        </div>
        {!hasEmail && (
          <div className="px-5 pb-3 text-[10px] text-red-600">
            No email address on file for this recipient. Add an email to enable sending.
          </div>
        )}
      </div>
    </div>
  );
}