// Vercel AI Gateway — multi-modal shared engine.
// One key (VERCEL_AI_GATEWAY_KEY / AI_GATEWAY_API_KEY) → 372 models across
// language, vision, web-search, embeddings, image-gen, TTS, transcription, video.
// All calls go directly to Vercel, so they work even when platform integration
// credits are exhausted.

import { secrets } from "base44:runtime";

const BASE = "https://ai-gateway.vercel.sh/v1";

function getKey(): string {
  return secrets.get("VERCEL_AI_GATEWAY_KEY") || secrets.get("AI_GATEWAY_API_KEY") || "";
}

export function isGatewayConfigured(): boolean {
  return !!getKey();
}

// Best-in-class defaults per capability (curated from the live /models list).
export const DEFAULTS = {
  web_search: "perplexity/sonar-pro",        // native web search, 200k ctx, vision
  reasoning: "anthropic/claude-opus-4.8",    // top reasoning + vision + web
  vision: "google/gemini-3.1-pro-preview",   // 1M ctx, vision, web
  fast: "google/gemini-3-flash",             // fast + vision + web
  enrichment: "anthropic/claude-opus-4.8",    // deep enrichment
  embed: "openai/text-embedding-3-large",     // RAG embeddings
  rerank: "cohere/rerank-v4-pro",            // RAG reranking
  image: "bfl/flux-2-max",                    // best image generation
  tts: "openai/tts-1-hd",                     // best voice
  transcribe: "openai/whisper-1",            // best transcription
  video: "google/veo-3.0-generate-001",      // best video
};

export const GATEWAY_MODELS = {
  // Language / reasoning / search
  "perplexity/sonar-pro": { type: "language", label: "Perplexity Sonar Pro", best_for: ["web_search", "skip_trace", "owner_id"], context: 200000 },
  "perplexity/sonar-reasoning-pro": { type: "language", label: "Sonar Reasoning Pro", best_for: ["web_search", "reasoning"], context: 127000 },
  "anthropic/claude-opus-4.8": { type: "language", label: "Claude Opus 4.8", best_for: ["reasoning", "enrichment", "vision"], context: 1000000 },
  "anthropic/claude-sonnet-4.6": { type: "language", label: "Claude Sonnet 4.6", best_for: ["fast_reasoning"], context: 1000000 },
  "openai/gpt-5": { type: "language", label: "GPT-5", best_for: ["reasoning", "general"], context: 400000 },
  "openai/gpt-5-fast": { type: "language", label: "GPT-5 Fast", best_for: ["fast"], context: 400000 },
  "google/gemini-3.1-pro-preview": { type: "language", label: "Gemini 3.1 Pro", best_for: ["vision", "long_context"], context: 1000000 },
  "google/gemini-3-flash": { type: "language", label: "Gemini 3 Flash", best_for: ["fast", "vision"], context: 1000000 },
  "openai/gpt-4.1-fast": { type: "language", label: "GPT-4.1 Fast", best_for: ["fast"], context: 1047576 },
  // Embeddings
  "openai/text-embedding-3-large": { type: "embedding", label: "Text Embedding 3 Large", best_for: ["rag"] },
  "voyage/voyage-4": { type: "embedding", label: "Voyage 4", best_for: ["rag"] },
  "cohere/embed-v4.0": { type: "embedding", label: "Cohere Embed v4", best_for: ["rag"] },
  // Reranking
  "cohere/rerank-v4-pro": { type: "reranking", label: "Cohere Rerank 4 Pro", best_for: ["rag"] },
  "voyage/rerank-2.5": { type: "reranking", label: "Voyage Rerank 2.5", best_for: ["rag"] },
  // Image generation
  "bfl/flux-2-max": { type: "image", label: "FLUX.2 Max", best_for: ["image_gen"] },
  "openai/gpt-image-2.5-sunburst": { type: "image", label: "GPT Image 2.5 Sunburst", best_for: ["image_gen"] },
  "recraft/recraft-v4.1-pro": { type: "image", label: "Recraft V4.1 Pro", best_for: ["image_gen"] },
  "bytedance/seedream-5.0-pro": { type: "image", label: "Seedream 5.0 Pro", best_for: ["image_gen"] },
  // Voice (TTS)
  "openai/tts-1-hd": { type: "speech", label: "OpenAI TTS HD", best_for: ["voice"] },
  "spacexai/grok-tts": { type: "speech", label: "Grok TTS", best_for: ["voice"] },
  "fish-audio/s2.1-pro": { type: "speech", label: "Fish S2.1 Pro", best_for: ["voice"] },
  // Transcription
  "openai/whisper-1": { type: "transcription", label: "Whisper", best_for: ["transcribe"] },
  "openai/gpt-4o-transcribe": { type: "transcription", label: "GPT-4o Transcribe", best_for: ["transcribe"] },
  // Video
  "google/veo-3.0-generate-001": { type: "video", label: "Veo 3.0", best_for: ["video"] },
  "bytedance/seedance-2.5": { type: "video", label: "Seedance 2.5", best_for: ["video"] },
};

async function gwFetch(path: string, body: any, method = "POST"): Promise<any> {
  const key = getKey();
  if (!key) throw new Error("AI Gateway key not configured");
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gateway ${res.status}: ${txt.slice(0, 400)}`);
  }
  return res;
}

function parseJsonLoose(text: string): any {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

/**
 * Chat / reasoning / web-search / vision in one call.
 * - web_search: true → uses Perplexity Sonar Pro (native live web search)
 * - images: string[] → vision input (image URLs) alongside the prompt
 * - response_json_schema → structured output (parsed to object)
 */
export async function gatewayChat(opts: {
  prompt: string;
  system?: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  response_json_schema?: any;
  images?: string[];
  web_search?: boolean;
}): Promise<{ text: string; json: any; model: string; usage: any }> {
  const model = opts.web_search && !opts.model ? DEFAULTS.web_search : (opts.model || DEFAULTS.reasoning);
  const maxTokens = Math.min(opts.max_tokens || 4096, 8192);
  const temperature = opts.temperature ?? 0.7;

  const userContent: any[] = [{ type: "text", text: opts.prompt }];
  if (Array.isArray(opts.images)) {
    for (const url of opts.images) userContent.push({ type: "image_url", image_url: { url } });
  }

  const messages: any[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: userContent.length > 1 ? userContent : opts.prompt });

  const body: any = { model, messages, max_tokens: maxTokens, temperature, stream: false };
  if (opts.response_json_schema) {
    body.response_format = { type: "json_schema", json_schema: { name: "response", schema: opts.response_json_schema } };
  }

  const res = await gwFetch("/chat/completions", body);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  return {
    text,
    json: opts.response_json_schema ? parseJsonLoose(text) : null,
    model: data.model || model,
    usage: data.usage || {},
  };
}

/** Embeddings for RAG. Returns vector array. */
export async function gatewayEmbed(opts: { input: string; model?: string }): Promise<{ embedding: number[]; model: string }> {
  const model = opts.model || DEFAULTS.embed;
  const res = await gwFetch("/embeddings", { model, input: opts.input });
  const data = await res.json();
  return { embedding: data.data?.[0]?.embedding || [], model: data.model || model };
}

/** Rerank documents against a query (RAG retrieval boost). */
export async function gatewayRerank(opts: { query: string; documents: string[]; model?: string; top_n?: number }): Promise<{ results: any[]; model: string } | null> {
  const model = opts.model || DEFAULTS.rerank;
  try {
    const res = await gwFetch("/rerank", { model, query: opts.query, documents: opts.documents, top_n: opts.top_n || opts.documents.length });
    const data = await res.json();
    return { results: data.results || data.data || [], model };
  } catch {
    return null; // endpoint not available — degrade gracefully
  }
}

/** Image generation. Returns image URL(s). */
export async function gatewayImage(opts: { prompt: string; model?: string; size?: string; n?: number }): Promise<{ urls: string[]; model: string }> {
  const model = opts.model || DEFAULTS.image;
  const body: any = { model, prompt, n: opts.n || 1 };
  if (opts.size) body.size = opts.size;
  const res = await gwFetch("/images/generations", body);
  const data = await res.json();
  const urls = (data.data || []).map((d: any) => d.url || d.b64_json ? `data:image/png;base64,${d.b64_json}` : null).filter(Boolean);
  return { urls, model };
}

/** Text-to-speech. Returns base64 audio (mp3). */
export async function gatewayTTS(opts: { text: string; model?: string; voice?: string }): Promise<{ audio_base64: string; model: string }> {
  const model = opts.model || DEFAULTS.tts;
  const res = await gwFetch("/audio/speech", { model, input: opts.text, voice: opts.voice || "alloy", response_format: "mp3" });
  const buf = await res.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return { audio_base64: base64, model };
}

/** Transcription. Takes an audio URL, returns text. */
export async function gatewayTranscribe(opts: { audio_url: string; model?: string }): Promise<{ text: string; model: string }> {
  const model = opts.model || DEFAULTS.transcribe;
  // Fetch the audio, then multipart-post to the gateway
  const audioRes = await fetch(opts.audio_url);
  const audioBuf = await audioRes.arrayBuffer();
  const form = new FormData();
  form.append("model", model);
  form.append("file", new Blob([audioBuf]), "audio.mp3");
  const key = getKey();
  const res = await fetch(`${BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Transcribe ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return { text: data.text || "", model };
}

/** List all available models from the gateway (live). */
export async function listGatewayModels(): Promise<any[]> {
  const key = getKey();
  if (!key) return [];
  const res = await fetch(`${BASE}/models`, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}