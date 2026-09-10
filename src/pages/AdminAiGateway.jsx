import React, { useState, useEffect } from "react";
import {
  Sparkles, Loader2, Search, Eye, Mic, Image as ImageIcon, FileAudio,
  Database, Layers, CheckCircle2, AlertTriangle, Zap, Cpu, Globe, Volume2,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const ACTIONS = [
  { id: "web_search", label: "Web Search Intelligence", icon: Search, desc: "Perplexity Sonar Pro — live web search for skip tracing, owner ID, market intel", model: "perplexity/sonar-pro", color: "text-blue-600" },
  { id: "vision", label: "Vision Analysis", icon: Eye, desc: "Gemini 3.1 Pro / Claude Opus — analyze property photos, detect distress from imagery", model: "google/gemini-3.1-pro-preview", color: "text-purple-600" },
  { id: "generate", label: "Reasoning / Chat", icon: Cpu, desc: "Claude Opus 4.8 / GPT-5 — deep analysis, enrichment, document generation", model: "anthropic/claude-opus-4.8", color: "text-emerald-600" },
  { id: "image", label: "Image Generation", icon: ImageIcon, desc: "FLUX.2 Max / GPT Image 2.5 — generate property renders, marketing visuals", model: "bfl/flux-2-max", color: "text-amber-600" },
  { id: "tts", label: "Voice (TTS)", icon: Mic, desc: "OpenAI TTS HD / Grok TTS — best-in-class AI voice generation", model: "openai/tts-1-hd", color: "text-rose-600" },
  { id: "transcribe", label: "Transcription", icon: FileAudio, desc: "Whisper / GPT-4o Transcribe — audio-to-text", model: "openai/whisper-1", color: "text-cyan-600" },
  { id: "embed", label: "Embeddings (RAG)", icon: Database, desc: "Text Embedding 3 Large — vectorize for retrieval-augmented generation", model: "openai/text-embedding-3-large", color: "text-indigo-600" },
  { id: "rerank", label: "Reranking (RAG)", icon: Layers, desc: "Cohere Rerank 4 Pro — boost retrieval relevance", model: "cohere/rerank-v4-pro", color: "text-teal-600" },
];

export default function AdminAiGateway() {
  const [active, setActive] = useState("web_search");
  const [models, setModels] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ prompt: "", model: "", image_url: "", audio_url: "", voice: "alloy" });

  useEffect(() => {
    base44.functions.invoke("aiGatewayGenerate", { action: "models" })
      .then((r) => setModels(r.data)).catch(() => {});
  }, []);

  const cfg = ACTIONS.find((a) => a.id === active);
  const configured = models?.configured;

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const payload = { action: active, model: form.model || cfg.model };
      if (active === "web_search" || active === "generate" || active === "vision") {
        payload.prompt = form.prompt;
        if (active === "vision") payload.images = [form.image_url].filter(Boolean);
      } else if (active === "image") {
        payload.prompt = form.prompt;
      } else if (active === "tts") {
        payload.text = form.prompt;
        payload.voice = form.voice;
      } else if (active === "transcribe") {
        payload.audio_url = form.audio_url;
      } else if (active === "embed") {
        payload.input = form.prompt;
      } else if (active === "rerank") {
        payload.query = form.prompt;
        payload.documents = (form.prompt || "").split("\n").filter(Boolean);
      }
      const r = await base44.functions.invoke("aiGatewayGenerate", payload);
      setResult(r.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-black text-[#e4b653]">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-light tracking-tight">AI Gateway Command Center</h1>
          <p className="text-xs text-black/50">
            Vercel AI Gateway — 372 models, one key. Best-in-class web search, vision, reasoning, image gen, voice & RAG.
            Runs on your own gateway key — unaffected by platform credit limits.
          </p>
        </div>
      </div>

      {/* Status */}
      <div className={`mt-4 flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${configured ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
        {configured ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        {configured ? `Gateway live — ${models?.live_count || 0} models available` : "Gateway key not configured"}
      </div>

      {/* Action tabs */}
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => { setActive(a.id); setResult(null); setError(null); setForm({ ...form, model: a.model }); }}
            className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition ${active === a.id ? "border-black bg-black text-white" : "border-black/10 bg-white hover:border-black/30"}`}
          >
            <a.icon className={`mt-0.5 h-4 w-4 shrink-0 ${active === a.id ? "text-[#e4b653]" : a.color}`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold">{a.label}</p>
              <p className={`mt-0.5 text-[10px] leading-snug ${active === a.id ? "text-white/60" : "text-black/40"}`}>{a.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Input panel */}
      <div className="mt-5 rounded-lg border border-black/10 bg-white p-5">
        <div className="flex items-center gap-2">
          <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em]">{cfg.label}</h3>
          <span className="ml-auto rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-mono text-black/60">{form.model || cfg.model}</span>
        </div>

        <div className="mt-4 space-y-3">
          {(active === "web_search" || active === "generate" || active === "image" || active === "embed" || active === "rerank") && (
            <textarea
              className="w-full rounded-md border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black"
              rows={4}
              placeholder={active === "image" ? "Describe the image to generate (e.g. 'a renovated craftsman home exterior, golden hour, professional real estate photography')…" : "Enter your prompt or query…"}
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
            />
          )}
          {active === "vision" && (
            <>
              <input
                className="w-full rounded-md border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black"
                placeholder="Image URL to analyze…"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
              <textarea
                className="w-full rounded-md border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black"
                rows={3}
                placeholder="What do you want to know about this image? (e.g. 'Assess the roof condition and estimate repair costs')"
                value={form.prompt}
                onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              />
            </>
          )}
          {active === "tts" && (
            <>
              <textarea
                className="w-full rounded-md border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black"
                rows={3}
                placeholder="Text to convert to speech…"
                value={form.prompt}
                onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              />
              <select
                className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
                value={form.voice}
                onChange={(e) => setForm({ ...form, voice: e.target.value })}
              >
                <option value="alloy">Alloy</option>
                <option value="echo">Echo</option>
                <option value="fable">Fable</option>
                <option value="onyx">Onyx</option>
                <option value="nova">Nova</option>
                <option value="shimmer">Shimmer</option>
              </select>
            </>
          )}
          {active === "transcribe" && (
            <input
              className="w-full rounded-md border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black"
              placeholder="Audio file URL to transcribe…"
              value={form.audio_url}
              onChange={(e) => setForm({ ...form, audio_url: e.target.value })}
            />
          )}

          {/* Model override */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">Model</span>
            <input
              className="flex-1 rounded-md border border-black/15 px-3 py-2 text-xs font-mono outline-none focus:border-black"
              placeholder={cfg.model}
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>

          <button
            onClick={run}
            disabled={loading || (active !== "transcribe" && !form.prompt && !form.audio_url)}
            className="inline-flex items-center gap-2 rounded-md bg-black px-5 py-2.5 text-xs font-medium text-white transition hover:bg-black/80 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Running…" : `Run ${cfg.label}`}
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}
      </div>

      {/* Result */}
      {result && !loading && <ResultPanel result={result} active={active} />}
    </div>
  );
}

function ResultPanel({ result, active }) {
  return (
    <div className="mt-4 rounded-lg border border-black/10 bg-white p-5">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-black/40">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Result · {result.model} · {result.mode || active}
      </div>
      <div className="mt-3">
        {active === "tts" && result.audio_base64 ? (
          <div className="flex items-center gap-3 rounded-md bg-black/5 p-4">
            <Volume2 className="h-5 w-5 text-black/50" />
            <audio controls src={`data:audio/mp3;base64,${result.audio_base64}`} className="w-full" />
          </div>
        ) : active === "image" && result.urls?.length ? (
          <div className="grid gap-3">
            {result.urls.map((u, i) => (
              <img key={i} src={u} alt="generated" className="w-full rounded-lg border border-black/10" />
            ))}
          </div>
        ) : active === "embed" ? (
          <div>
            <p className="text-xs text-black/60">Generated embedding — {result.dims} dimensions</p>
            <p className="mt-2 font-mono text-[10px] text-black/40 break-all">{(result.embedding || []).slice(0, 12).map((n) => n.toFixed(4)).join(", ")}…</p>
          </div>
        ) : active === "rerank" ? (
          <pre className="overflow-auto rounded-md bg-black/5 p-3 text-[11px]">{JSON.stringify(result.results, null, 2)}</pre>
        ) : (
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-[#0c0d0e] p-4 text-[11px] leading-relaxed text-white/85">
            {typeof result.result === "string" ? result.result : JSON.stringify(result.result || result.text || result, null, 2)}
          </pre>
        )}
        {result.usage && (
          <p className="mt-3 text-[10px] text-black/30">
            Tokens: {result.usage.prompt_tokens || 0} in · {result.usage.completion_tokens || 0} out
          </p>
        )}
      </div>
    </div>
  );
}