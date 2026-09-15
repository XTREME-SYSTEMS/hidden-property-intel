import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const AGENT_NAME = "eden_skye";
const AVATAR_URL = "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/87e41f08f_generated_image.png";

export default function EdenSkyeChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const existing = base44.agents.listConversations({ agent_name: AGENT_NAME });
        // listConversations is synchronous in the SDK
        const list = existing || [];
        if (list.length > 0) {
          const conv = base44.agents.getConversation(list[0].id);
          setConversation(conv);
          setMessages(conv.messages || []);
        } else {
          const conv = base44.agents.createConversation({
            agent_name: AGENT_NAME,
            metadata: { name: "Eden Skye Chat", description: "Direct conversation with Eden Skye" },
          });
          setConversation(conv);
          setMessages(conv.messages || []);
        }
      } catch (e) {
        console.error("Failed to init conversation:", e);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!conversation) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !conversation || sending) return;
    const msg = input.trim();
    setInput("");
    setSending(true);
    try {
      const updated = base44.agents.addMessage(conversation, { role: "user", content: msg });
      setConversation(updated);
    } catch (e) {
      console.error("Failed to send message:", e);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-sm text-black/50">Connecting to Eden…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-120px)] max-w-4xl flex-col px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-black/10 pb-4">
        <Link to="/eden-skye" className="rounded-sm p-1.5 text-black/40 hover:bg-black/5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <img src={AVATAR_URL} alt="Eden Skye" className="h-10 w-10 rounded-full object-cover" />
        <div className="flex-1">
          <p className="font-display text-base">Eden Skye</p>
          <p className="flex items-center gap-1.5 text-xs text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online · Executive Assistant
          </p>
        </div>
        <Sparkles className="h-5 w-5 text-gold" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-black/40">
              <p>Hi! I'm Eden Skye, your executive assistant at Hidden Property Intel.</p>
              <p className="mt-2">Ask me about properties, deals, outreach, scheduling, or anything else — I'm here to help.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <img src={AVATAR_URL} alt="Eden" className="mr-2 h-8 w-8 rounded-full object-cover" />
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-black text-white"
                    : "bg-black/5 text-black"
                }`}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown className="prose prose-sm max-w-none">{msg.content}</ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
                {msg.tool_calls?.map((tc, idx) => (
                  <div key={idx} className="mt-2 rounded bg-black/10 px-2 py-1 text-[10px] text-black/60">
                    ⚙ {tc.name || "tool"} — {tc.status}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <img src={AVATAR_URL} alt="Eden" className="mr-2 h-8 w-8 rounded-full object-cover" />
              <div className="rounded-2xl bg-black/5 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-black/30" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-black/30" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-black/30" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-black/10 pt-4">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Message Eden…"
            disabled={sending}
            className="flex-1 rounded-full border border-black/15 px-4 py-3 text-sm outline-none focus:border-black disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}