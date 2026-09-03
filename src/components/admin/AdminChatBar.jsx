import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AgentMessageBubble from "@/components/admin/AgentMessageBubble";

const AGENT_NAME = "admin_assistant";

export default function AdminChatBar() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  // Create or load conversation on mount
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
          setMessages([]);
        }
      } catch (e) {
        console.error("Failed to init conversation", e);
      }
      setLoading(false);
    })();
  }, []);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setSending(false);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  // Auto-scroll
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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-black/10 px-4 py-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5">
          <Sparkles className="h-3.5 w-3.5 text-black/40" />
        </div>
        <div>
          <p className="text-xs font-medium">Admin Assistant</p>
          <p className="text-[9px] text-black/40">Full system access · Read · Write · Execute</p>
        </div>
        {sending && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-black/30" />}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-black/30" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5">
              <Sparkles className="h-5 w-5 text-black/30" />
            </div>
            <p className="mt-3 text-sm font-medium text-black/50">Admin Assistant Ready</p>
            <p className="mt-1 text-xs text-black/30">Ask me to run scrapes, score properties, check system health, generate disclosures, deploy contracts, or anything else.</p>
            <div className="mt-4 space-y-1 text-left">
              <p className="text-[10px] uppercase tracking-[0.15em] text-black/30">Try:</p>
              <p className="text-[11px] text-black/40">"Run the daily scrape pipeline"</p>
              <p className="text-[11px] text-black/40">"Score all active properties"</p>
              <p className="text-[11px] text-black/40">"Show me the deal pipeline"</p>
              <p className="text-[11px] text-black/40">"Generate FL disclosure forms"</p>
              <p className="text-[11px] text-black/40">"Check system health"</p>
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
        <div className="flex items-end gap-2 rounded-2xl border border-black/15 bg-[#f7f5f0] px-4 py-2.5">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message Admin Assistant…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-black/30"
          />
          <button
            onClick={send}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-white transition hover:bg-black/80 disabled:opacity-30"
            disabled={!input.trim() || sending || !conversation}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}