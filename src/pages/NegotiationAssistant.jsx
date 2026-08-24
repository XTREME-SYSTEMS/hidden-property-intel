import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Send } from "lucide-react";

export default function NegotiationAssistant() {
  const { propertyId } = useParams();
  const [thread, setThread] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const endRef = useRef(null);

  const load = async () => {
    try {
      const t = await base44.entities.NegotiationThread.filter({ property_id: propertyId });
      setThread(t[0] || null);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { load(); }, [propertyId]);

  const send = async () => {
    if (!msg.trim()) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke("aiNegotiationAssistant", { property_id: propertyId, message: msg });
      setAnalysis(res.data?.analysis);
      setMsg("");
      load();
    } catch (e) { alert(e.response?.data?.error || e.message); }
    setBusy(false);
  };

  return (
    <div className="mx-auto flex h-[80vh] max-w-3xl flex-col px-6 py-10 lg:px-12">
      <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">AI negotiation assistant</p>
      <h1 className="mt-2 font-display text-3xl font-light">Coach your counter-offers.</h1>

      <div className="mt-6 flex-1 overflow-y-auto rounded-sm border border-black/10 p-5">
        {(thread?.messages || []).length === 0 ? (
          <p className="text-sm text-black/50">Describe an offer you received, or ask for negotiation advice. The AI analyzes it against market data and recommends accept, counter, or reject.</p>
        ) : (
          <div className="space-y-4">
            {(thread.messages || []).map((m, i) => (
              <div key={i} className={`max-w-[80%] rounded-sm p-3 text-sm ${m.sender === "ai" ? "bg-black/5" : "bg-black text-white ml-auto"}`}>
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">{m.role}</p>
                <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {analysis && (
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-sm border border-black/10 p-3"><p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Assessment</p><p className="mt-1">{analysis.assessment}</p></div>
          <div className="rounded-sm border border-black/10 p-3"><p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Recommendation</p><p className="mt-1">{analysis.recommendation}</p></div>
          <div className="rounded-sm border border-black/10 p-3"><p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Counter</p><p className="mt-1">{analysis.counter_amount ? `$${Number(analysis.counter_amount).toLocaleString()}` : "—"}</p></div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Describe the offer or ask for advice…"
          className="flex-1 rounded-sm border border-black/15 px-4 py-3 text-sm outline-none focus:border-black"
        />
        <button onClick={send} disabled={busy} className="rounded-sm bg-black p-3 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
      </div>
    </div>
  );
}