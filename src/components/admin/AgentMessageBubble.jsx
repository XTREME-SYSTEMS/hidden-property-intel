import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronUp, Check, X, Loader2, AlertCircle } from "lucide-react";

export default function AgentMessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
        isUser ? "bg-black text-white" : "bg-black/5 text-black/80"
      }`}>
        {message.content && (
          isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{message.content}</ReactMarkdown>
          )
        )}
        {message.tool_calls?.map((tc, i) => <ToolCallDisplay key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}

function ToolCallDisplay({ toolCall: tc }) {
  const [expanded, setExpanded] = useState(false);

  const status = tc.status || "pending";
  const isFailed = ["failed", "error"].includes(status) ||
    (typeof tc.results === "string" && /error|failed/i.test(tc.results)) ||
    (typeof tc.results === "object" && tc.results?.success === false);

  const statusConfig = {
    pending: { icon: Loader2, text: "Pending…", color: "text-black/40", spin: true },
    running: { icon: Loader2, text: "Running…", color: "text-blue-500", spin: true },
    in_progress: { icon: Loader2, text: "Running…", color: "text-blue-500", spin: true },
    completed: { icon: Check, text: "Done", color: "text-emerald-500", spin: false },
    success: { icon: Check, text: "Success", color: "text-emerald-500", spin: false },
    failed: { icon: X, text: "Failed", color: "text-red-500", spin: false },
    error: { icon: AlertCircle, text: "Error", color: "text-red-500", spin: false },
  };

  const cfg = statusConfig[status] || statusConfig.pending;
  const Icon = cfg.icon;

  // Honor display_projection hide mode
  const hideDetails = tc.display_projection?.hide_details && tc.display_projection?.details_redacted;
  const label = isFailed
    ? (tc.display_projection?.error_label || cfg.text)
    : (["pending", "running", "in_progress"].includes(status)
      ? (tc.display_projection?.active_label || cfg.text)
      : (tc.display_projection?.label || cfg.text));

  let parsedArgs = tc.arguments_string;
  try { parsedArgs = JSON.parse(tc.arguments_string); } catch { /* keep raw */ }
  let parsedResults = tc.results;
  try { if (typeof tc.results === "string") parsedResults = JSON.parse(tc.results); } catch { /* keep raw */ }

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => !hideDetails && setExpanded(!expanded)}
        className={`flex items-center gap-1.5 rounded-md bg-black/5 px-2 py-1 ${hideDetails ? "cursor-default" : "hover:bg-black/10"}`}
      >
        <Icon className={`h-3 w-3 ${cfg.color} ${cfg.spin ? "animate-spin" : ""}`} />
        <span className="font-medium text-black/70">{tc.name}</span>
        <span className={`text-[10px] ${cfg.color}`}>{label}</span>
        {!hideDetails && (expanded ? <ChevronUp className="h-3 w-3 text-black/30" /> : <ChevronDown className="h-3 w-3 text-black/30" />)}
      </button>
      {expanded && !hideDetails && (
        <div className="mt-1.5 space-y-1.5 rounded-md bg-black/5 p-2">
          {parsedArgs && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-black/40">Parameters</p>
              <pre className="mt-0.5 overflow-auto text-[10px] text-black/60">{typeof parsedArgs === "string" ? parsedArgs : JSON.stringify(parsedArgs, null, 2)}</pre>
            </div>
          )}
          {parsedResults !== undefined && parsedResults !== null && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-black/40">Result</p>
              <pre className={`mt-0.5 max-h-40 overflow-auto text-[10px] ${isFailed ? "text-red-500" : "text-black/60"}`}>{typeof parsedResults === "string" ? parsedResults : JSON.stringify(parsedResults, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}