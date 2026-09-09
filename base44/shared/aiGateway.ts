// Vercel AI Gateway — shared module for multi-model AI access.
// Supports OpenAI, Anthropic, Google, and other models through a single endpoint.
// Falls back to built-in InvokeLLM if the gateway key is not configured.

import { secrets } from "base44:runtime";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

export const GATEWAY_MODELS = {
  // OpenAI
  "gpt-5.6-sol": { provider: "openai", label: "GPT-5.6 Sol", tier: "fast" },
  "gpt-5.6-luna": { provider: "openai", label: "GPT-5.6 Luna", tier: "fast" },
  "gpt-5.4": { provider: "openai", label: "GPT-5.4", tier: "standard" },
  "gpt-5-mini": { provider: "openai", label: "GPT-5 Mini", tier: "economy" },
  // Anthropic
  "anthropic/claude-sonnet-5": { provider: "anthropic", label: "Claude Sonnet 5", tier: "standard" },
  "anthropic/claude-opus-5": { provider: "anthropic", label: "Claude Opus 5", tier: "premium" },
  // Google
  "google/gemini-3-flash": { provider: "google", label: "Gemini 3 Flash", tier: "fast" },
  "google/gemini-3.1-pro": { provider: "google", label: "Gemini 3.1 Pro", tier: "premium" },
};

/**
 * Call the Vercel AI Gateway with a chat completion request.
 * Returns { text, model, usage } or null if the gateway is not configured.
 */
export async function gatewayChat(opts: {
  prompt: string;
  system?: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  response_json_schema?: any;
}): Promise<{ text: string; model: string; usage: any } | null> {
  const apiKey = secrets.get("AI_GATEWAY_API_KEY");
  if (!apiKey) return null;

  const model = opts.model || "openai/gpt-5.6-sol";
  const maxTokens = Math.min(opts.max_tokens || 4096, 8192);
  const temperature = opts.temperature ?? 0.7;

  const messages = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: opts.prompt });

  const body: any = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
    stream: false,
  };

  // Some models support JSON mode via response_format
  if (opts.response_json_schema) {
    body.response_format = { type: "json_schema", json_schema: { name: "response", schema: opts.response_json_schema } };
  }

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI Gateway returned ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0]?.message?.content || "";
  const usage = data.usage || {};

  return {
    text: choice,
    model: data.model || model,
    usage: {
      prompt_tokens: usage.prompt_tokens || 0,
      completion_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || 0,
    },
  };
}

/**
 * Check if the AI Gateway is configured.
 */
export function isGatewayConfigured(): boolean {
  return !!secrets.get("AI_GATEWAY_API_KEY");
}