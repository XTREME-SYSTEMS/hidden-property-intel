import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Loader2, ChevronRight, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AgentMessageBubble from "@/components/admin/AgentMessageBubble";

const AGENT_NAME = "admin_assistant";

export default function AdminCopilot({ open, onToggle }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const existing = await base44.agents.listConversations({ agent_name: AGENT_NAME });
        if (existing.length > 0) {
          setConversation(existing[0]);
          setMessages(existing[0].messages || []);
        } else {
          const conv = await base44.agents.createConversation({
            agent_name: AGENT_NAME,
            metadata: { name: "Admin Assistant", description: "Main admin conversation" },
          });
          setConversation(conv);
        }
      } catch (e) {
        console.error("Failed to init conversation", e);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setSending(false);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !conversation || sending) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    try {
      await base44.agents.addMessage(conversation, { role: "user", content: text });
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
      setSending(false);
    }
  }, [input, conversation, sending]);

  return (
    <>
      {/* Toggle button (always visible) */}
      <button
        onClick={onToggle}
        className="absolute right-0 top-1/2 z-30 flex h-12 w-7 -translate-y-1/2 items-center justify-center rounded-l-sm border border-r-0 border-black/15 bg-white shadow-sm transition hover:bg-black/5"
        title={open ? "Hide copilot" : "Show copilot"}
      >
        <ChevronRight className={`h-4 w-4 text-black/50 transition-transform ${open ? "" : "rotate-180"}`} />
      </button>

      {/* Copilot panel */}
      {open && (
        <aside className="flex w-80 shrink-0 flex-col border-l border-black/10 bg-white">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-black/10 px-4 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200">
              <Sparkles className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Eden Skye Copilot</p>
              <p className="text-[9px] text-black/40">Full system access · Read · Write · Execute</p>
            </div>
            {sending && <Loader2 className="h-3.5 w-3.5 animate-spin text-black/30" />}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-black/30" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200">
                  <Sparkles className="h-6 w-6 text-amber-500" />
                </div>
                <p className="mt-3 text-sm font-medium text-black/60">Copilot Ready</p>
                <p className="mt-1 text-xs text-black/40">Ask me to run scrapes, score properties, check health, generate disclosures, deploy contracts, or anything else.</p>
                <div className="mt-4 w-full space-y-1 text-left">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-black/30">Try:</p>
                  {["Run the daily scrape pipeline", "Score all active properties", "Show me the deal pipeline", "Generate FL disclosure forms", "Check system health"].map((t) => (
                    <button key={t} onClick={() => setInput(t)} className="block w-full rounded-sm px-2 py-1.5 text-left text-[11px] text-black/50 transition hover:bg-black/5 hover:text-black/80">
                      "{t}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m, i) => <AgentMessageBubble key={i} message={m} />)}
                {sending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-black/5 px-4 py-2.5">
                      <Loader2 className="h-4 w-4 animate-spin text-black/30" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-black/10 p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-black/15 bg-[#f7f5f0] px-3 py-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Message Copilot…"
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-black/30"
              />
              <button
                onClick={send}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black text-white transition hover:bg-black/80 disabled:opacity-30"
                disabled={!input.trim() || sending || !conversation}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}