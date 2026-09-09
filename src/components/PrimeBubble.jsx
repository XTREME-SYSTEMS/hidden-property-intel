import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Bot, X, Send, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function PrimeBubble() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!conversation) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setBusy(false);
    });
    return () => unsubscribe();
  }, [conversation]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const openPanel = async () => {
    setOpen(true);
    if (!conversation) {
      try {
        setError("");
        const conv = await base44.agents.createConversation({
          agent_name: "prime",
          metadata: { name: "Prime — System Orchestrator" },
        });
        setConversation(conv);
        setMessages(conv.messages || []);
      } catch (e) {
        setError(e.message || "Could not start Prime. You may need to sign in.");
      }
    }
  };

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !conversation || busy) return;
    setInput("");
    setBusy(true);
    try {
      await base44.agents.addMessage(conversation, { role: "user", content: text });
    } catch (e) {
      setError(e.message || "Message failed.");
      setBusy(false);
    }
  };

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={openPanel}
          aria-label="Open Prime"
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9998,
            width: 60, height: 60, borderRadius: "50%",
            background: "linear-gradient(135deg,#006aff,#0058d4)", color: "#fff",
            border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(0,106,255,.4)",
            display: "grid", placeItems: "center", transition: "transform .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Bot size={26} />
          <span style={{ position: "absolute", top: -2, right: -2, width: 14, height: 14, borderRadius: "50%", background: "#16a34a", border: "2px solid #fff" }} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          width: "min(390px, calc(100vw - 32px))", height: "min(580px, calc(100vh - 48px))",
          background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,.25)",
          border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "linear-gradient(135deg,#006aff,#0058d4)", color: "#fff" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.18)", display: "grid", placeItems: "center" }}><Sparkles size={18} /></div>
            <div style={{ flex: 1 }}>
              <b style={{ display: "block", fontSize: 15 }}>Prime</b>
              <span style={{ fontSize: 11, opacity: .85 }}>Autonomous System Orchestrator</span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}><X size={20} /></button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12, background: "#f8fafc" }}>
            {messages.length === 0 && !error && (
              <div style={{ textAlign: "center", color: "#64748b", fontSize: 13, padding: "40px 16px" }}>
                <Bot size={32} style={{ margin: "0 auto 12px", color: "#006aff" }} />
                <p style={{ fontWeight: 600, color: "#0f172a", margin: "0 0 6px" }}>Prime is online</p>
                <p style={{ fontSize: 12, lineHeight: 1.5 }}>Tell me what to do — trigger a scrape, run the swarm, score properties, generate an architecture doc, or build a feature.</p>
              </div>
            )}
            {error && (
              <div style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 10, padding: 12, fontSize: 13 }}>{error}</div>
            )}
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "85%", padding: "10px 13px", borderRadius: 12, fontSize: 14, lineHeight: 1.5,
                    background: isUser ? "#006aff" : "#fff", color: isUser ? "#fff" : "#0f172a",
                    border: isUser ? "none" : "1px solid #e2e8f0",
                  }}>
                    {m.content && (isUser
                      ? <span>{m.content}</span>
                      : <div className="prose prose-sm" style={{ fontSize: 13, maxWidth: "none" }}><ReactMarkdown>{m.content}</ReactMarkdown></div>
                    )}
                    {m.tool_calls?.map((tc, j) => (
                      <div key={j} style={{ marginTop: 8, fontSize: 11, display: "flex", alignItems: "center", gap: 6, color: isUser ? "rgba(255,255,255,.85)" : "#64748b", background: isUser ? "rgba(255,255,255,.12)" : "#f1f5f9", borderRadius: 6, padding: "4px 8px" }}>
                        {tc.status === "completed" || tc.status === "success" ? "✓" : tc.status === "failed" || tc.status === "error" ? "✕" : "⏳"}
                        <span>{tc.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {busy && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 13px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b" }}>
                  <Loader2 size={14} className="spin" style={{ animation: "z-spin 0.8s linear infinite" }} /> Prime is working…
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={send} style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #e2e8f0", background: "#fff" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Direct Prime…"
              style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: "inherit" }}
              onFocus={(e) => (e.target.style.borderColor = "#006aff")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
            <button type="submit" disabled={!input.trim() || busy} style={{ width: 40, height: 40, borderRadius: 8, border: "none", background: "#006aff", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", opacity: !input.trim() || busy ? 0.5 : 1 }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}