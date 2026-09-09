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
  // Perplexity — real-time web-grounded research
  "perplexity/sonar-pro": { provider: "perplexity", label: "Perplexity Sonar Pro", tier: "research" },
  "perplexity/sonar": { provider: "perplexity", label: "Perplexity Sonar", tier: "research" },
  "perplexity/sonar-reasoning-pro": { provider: "perplexity", label: "Perplexity Reasoning Pro", tier: "research" },
  "perplexity/sonar-deep-research": { provider: "perplexity", label: "Perplexity Deep Research", tier: "research" },
  // xAI Grok — real-time + reasoning
  "xai/grok-4": { provider: "xai", label: "Grok 4", tier: "premium" },
  "xai/grok-4-fast": { provider: "xai", label: "Grok 4 Fast", tier: "fast" },
  // DeepSeek — reasoning + code
  "deepseek/deepseek-chat": { provider: "deepseek", label: "DeepSeek Chat", tier: "standard" },
  "deepseek/deepseek-reasoner": { provider: "deepseek", label: "DeepSeek Reasoner", tier: "premium" },
  // Meta Llama — open-weight
  "meta-llama/llama-3.3-70b-instruct": { provider: "meta", label: "Llama 3.3 70B", tier: "standard" },
  // Mistral
  "mistralai/mistral-large": { provider: "mistral", label: "Mistral Large", tier: "standard" },
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