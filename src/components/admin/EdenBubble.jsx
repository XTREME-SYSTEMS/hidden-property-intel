import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Loader2, X, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AgentMessageBubble from "@/components/admin/AgentMessageBubble";

const AGENT_NAME = "admin_assistant";

const SUGGESTIONS = [
  "Run the daily scrape pipeline",
  "Score all active properties",
  "Show me the deal pipeline",
  "Generate FL disclosure forms",
  "Research an investor prospect",
  "Check system health",
  "Deploy a smart contract escrow",
  "Find distressed properties in Miami-Dade",
];

/**
 * Floating Eden Skye AI bubble — bottom-right of the admin shell.
 * Click to open a chat drawer with full system access.
 */
export default function EdenBubble() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const existing = await base44.agents.listConversations({ agent_name: AGENT_NAME });
        if (cancelled) return;
        if (existing.length > 0) {
          setConversation(existing[0]);
          setMessages(existing[0].messages || []);
        } else {
          const conv = await base44.agents.createConversation({
            agent_name: AGENT_NAME,
            metadata: { name: "Admin Assistant", description: "Main admin conversation" },
          });
          if (cancelled) return;
          setConversation(conv);
        }
      } catch (e) {
        console.error("Failed to init conversation", e);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open]);

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
  }, [messages, open]);

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
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#e4b653] to-[#c38a1b] text-[#120e07] shadow-lg shadow-amber-900/30 transition hover:scale-105 hover:shadow-xl"
          title="Eden Skye — Full system access"
        >
          <Sparkles className="h-6 w-6" />
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
          </span>
        </button>
      )}

      {/* Chat drawer */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[560px] max-h-[80vh] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-black/10 bg-gradient-to-r from-[#0c0d0e] to-[#1a1a1a] px-4 py-3 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-300">
              <Sparkles className="h-4 w-4 text-amber-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Eden Skye</p>
              <p className="text-[9px] text-amber-200/70">Full system access · Read · Write · Execute</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md p-1 text-white/60 transition hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#f7f5f0] px-3 py-3">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-black/30" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200">
                  <Sparkles className="h-6 w-6 text-amber-500" />
                </div>
                <p className="mt-3 text-sm font-medium text-black/60">Eden Skye Ready</p>
                <p className="mt-1 text-xs text-black/40">Full access to every tool, account, and dataset. Ask me to run anything.</p>
                <div className="mt-4 w-full space-y-1 text-left">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-black/30">Try:</p>
                  {SUGGESTIONS.map((t) => (
                    <button key={t} onClick={() => setInput(t)} className="block w-full rounded-md px-2 py-1.5 text-left text-[11px] text-black/50 transition hover:bg-black/5 hover:text-black/80">
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
                    <div className="rounded-2xl bg-white px-4 py-2.5 shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-black/30" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-black/10 bg-white p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-black/15 bg-[#f7f5f0] px-3 py-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Message Eden Skye…"
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-black/30"
              />
              <button
                onClick={send}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#e4b653] to-[#c38a1b] text-[#120e07] transition hover:opacity-90 disabled:opacity-30"
                disabled={!input.trim() || sending || !conversation}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}