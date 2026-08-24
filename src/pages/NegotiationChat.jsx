import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Send, ArrowLeft } from "lucide-react";

export default function NegotiationChat() {
  const { propertyId } = useParams();
  const [thread, setThread] = useState(null);
  const [property, setProperty] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const endRef = useRef(null);

  const load = async () => {
    try {
      const p = await base44.entities.Property.get(propertyId);
      setProperty(p);
      const t = await base44.entities.NegotiationThread.filter({ property_id: propertyId });
      setThread(t[0] || null);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { load(); }, [propertyId]);

  const send = async () => {
    if (!msg.trim()) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke("sendNegotiationMessage", { property_id: propertyId, content: msg });
      if (res.data?.error) { alert(res.data.error); }
      else { setAnalysis(res.data?.analysis || null); setMsg(""); load(); }
    } catch (e) { alert(e.response?.data?.error || e.message); }
    setBusy(false);
  };

  return (
    <div className="mx-auto flex h-[82vh] max-w-3xl flex-col px-6 py-10 lg:px-12">
      <Link to={property ? `/properties/${propertyId}` : "/listings"} className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.3em] text-black/50 hover:text-black">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to property
      </Link>
      <p className="mt-4 text-[11px] uppercase tracking-[0.4em] text-black/40">In-platform negotiation</p>
      <h1 className="mt-2 font-display text-3xl font-light">{property ? `${property.city}, ${property.state}` : "Negotiation"}</h1>
      <p className="mt-1 text-xs text-black/50">All communication stays on PropertyIntel — no contact info is exchanged until a deal closes.</p>

      <div className="mt-6 flex-1 overflow-y-auto rounded-sm border border-black/10 p-5">
        {(!thread?.messages || thread.messages.length === 0) ? (
          <p className="text-sm text-black/50">Start the conversation. Describe an offer or ask for negotiation guidance — the AI coach analyzes every message.</p>
        ) : (
          <div className="space-y-4">
            {thread.messages.map((m, i) => (
              <div key={i} className={`max-w-[80%] rounded-sm p-3 text-sm ${m.sender === "ai" ? "bg-black/5" : m.role === "seller" ? "bg-white border border-black/15" : "bg-black text-white ml-auto"}`}>
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">{m.sender === "ai" ? "AI coach" : m.role}</p>
                <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
                {m.suggestions?.length > 0 && (
                  <ul className="mt-2 list-disc pl-4 text-xs opacity-70">
                    {m.suggestions.map((s, j) => <li key={j}>{s}</li>)}
                  </ul>
                )}
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
        <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message the other party — the AI coach will advise…" className="flex-1 rounded-sm border border-black/15 px-4 py-3 text-sm outline-none focus:border-black" />
        <button onClick={send} disabled={busy} className="rounded-sm bg-black p-3 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
      </div>
    </div>
  );
}