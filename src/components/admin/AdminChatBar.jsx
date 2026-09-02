import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";

export default function AdminChatBar() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    // Placeholder response — AI wiring is a separate request
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", text: "This chat is ready for AI wiring. Ask me to connect it to InvokeLLM or an agent." }]);
    }, 600);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5">
              <Sparkles className="h-5 w-5 text-black/30" />
            </div>
            <p className="mt-3 text-sm font-medium text-black/50">Admin Assistant</p>
            <p className="mt-1 text-xs text-black/30">Ask about properties, deals, or run a command.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user" ? "bg-black text-white" : "bg-black/5 text-black/80"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Input bubble */}
      <div className="border-t border-black/10 p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-black/15 bg-[#f7f5f0] px-4 py-2.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message Admin Assistant…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-black/30"
          />
          <button
            onClick={send}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-white transition hover:bg-black/80 disabled:opacity-30"
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}