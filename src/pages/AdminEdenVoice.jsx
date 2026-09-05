import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, Play, Loader2, Phone, Sparkles, Volume2, Copy, Check } from "lucide-react";

const VOICE_OPTIONS = [
  { id: "honey", label: "Honey", desc: "Warm, soft — Eden's default", recommended: true },
  { id: "river", label: "River", desc: "Calm, neutral, steady" },
  { id: "sunny", label: "Sunny", desc: "Bright, upbeat, friendly" },
  { id: "storm", label: "Storm", desc: "Formal, authoritative" },
  { id: "spark", label: "Spark", desc: "Energetic, quick-witted" },
];

export default function AdminEdenVoice() {
  const [tab, setTab] = useState("test");
  const [voice, setVoice] = useState("honey");
  const [testText, setTestText] = useState("Hi, this is Eden Skye with Hidden Property Intel. I'm calling about a property in your area — is this a good time to talk for just a couple of minutes?");
  const [audioUrl, setAudioUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef(null);

  // Orchestration state
  const [orchContact, setOrchContact] = useState("");
  const [orchType, setOrchType] = useState("investor");
  const [orchPurpose, setOrchPurpose] = useState("follow-up call");
  const [orchContext, setOrchContext] = useState("");
  const [orchResult, setOrchResult] = useState(null);

  // Transcription state
  const [audioUrlInput, setAudioUrlInput] = useState("");
  const [transcript, setTranscript] = useState(null);

  const runTest = async () => {
    setBusy(true);
    setError(null);
    setAudioUrl(null);
    try {
      const res = await base44.functions.invoke("edenVoiceConfig", { action: "test", voice, text: testText });
      setAudioUrl(res.data.url);
      setTimeout(() => audioRef.current?.play(), 100);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const runOrchestrate = async () => {
    if (!orchContact.trim() || !orchPurpose.trim()) return;
    setBusy(true);
    setError(null);
    setOrchResult(null);
    try {
      const res = await base44.functions.invoke("edenVoiceConfig", {
        action: "orchestrate",
        contact_name: orchContact,
        contact_type: orchType,
        call_purpose: orchPurpose,
        context: orchContext,
        voice,
      });
      setOrchResult(res.data);
      setAudioUrl(res.data.audio_url);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const runTranscribe = async () => {
    if (!audioUrlInput.trim()) return;
    setBusy(true);
    setError(null);
    setTranscript(null);
    try {
      const res = await base44.functions.invoke("edenVoiceConfig", { action: "transcribe", audio_url: audioUrlInput });
      setTranscript(res.data.transcript);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-black/60" />
            <h2 className="font-display text-xl">Eden Skye Voice Configuration</h2>
          </div>
          <p className="mt-1 text-xs text-black/50">
            Autonomous AI voice — ultra-humanistic outbound calls, voicemail transcription, and call orchestration.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-sm border border-black/10 p-1">
          <button onClick={() => setTab("test")} className={`rounded-sm px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] ${tab === "test" ? "bg-black text-white" : "text-black/50"}`}>Voice Test</button>
          <button onClick={() => setTab("orchestrate")} className={`rounded-sm px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] ${tab === "orchestrate" ? "bg-black text-white" : "text-black/50"}`}>Orchestrate Call</button>
          <button onClick={() => setTab("transcribe")} className={`rounded-sm px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] ${tab === "transcribe" ? "bg-black text-white" : "text-black/50"}`}>Transcribe</button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* Left — config */}
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Voice Persona</label>
          <div className="mt-2 space-y-2">
            {VOICE_OPTIONS.map(v => (
              <button
                key={v.id}
                onClick={() => setVoice(v.id)}
                className={`flex w-full items-center justify-between rounded-sm border px-3 py-2.5 text-left transition ${
                  voice === v.id ? "border-black bg-black/[0.03]" : "border-black/10 hover:bg-black/[0.02]"
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{v.label} {v.recommended && <span className="ml-1 text-[9px] uppercase tracking-[0.15em] text-amber-600">Eden's default</span>}</p>
                  <p className="text-[11px] text-black/50">{v.desc}</p>
                </div>
                {voice === v.id && <Volume2 className="h-4 w-4 text-black/60" />}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-sm border border-black/10 bg-black/[0.02] p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-medium">Eden's Voice Profile</p>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-black/55">
              Sweet, calm, and intelligent. Eden speaks like a trusted advisor who happens to be an expert —
              never robotic, never scripted. Her voice is warm for owners in distress, peer-level for investors,
              and deeply gentle for probate heirs.
            </p>
          </div>
        </div>

        {/* Right — interactive panel */}
        <div>
          {tab === "test" && (
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Test Script</label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="mt-1.5 h-32 w-full resize-none rounded-sm border border-black/15 p-3 text-sm outline-none focus:border-black"
              />
              <button
                onClick={runTest}
                disabled={busy || !testText.trim()}
                className="mt-3 inline-flex items-center gap-2 rounded-sm bg-black px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Generate & Play
              </button>
            </div>
          )}

          {tab === "orchestrate" && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Contact Name</label>
                <input value={orchContact} onChange={(e) => setOrchContact(e.target.value)} placeholder="e.g. John Smith" className="mt-1.5 w-full rounded-sm border border-black/15 px-3 py-2 text-sm outline-none focus:border-black" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Contact Type</label>
                  <select value={orchType} onChange={(e) => setOrchType(e.target.value)} className="mt-1.5 w-full rounded-sm border border-black/15 px-3 py-2 text-sm outline-none focus:border-black">
                    <option value="investor">Investor</option>
                    <option value="owner">Property Owner</option>
                    <option value="heir">Probate Heir</option>
                    <option value="agent">Agent</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Call Purpose</label>
                  <input value={orchPurpose} onChange={(e) => setOrchPurpose(e.target.value)} placeholder="e.g. follow-up call" className="mt-1.5 w-full rounded-sm border border-black/15 px-3 py-2 text-sm outline-none focus:border-black" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Context (optional)</label>
                <textarea value={orchContext} onChange={(e) => setOrchContext(e.target.value)} placeholder="e.g. Investor interested in Miami-Dade pre-foreclosures, last contacted 2 weeks ago..." className="mt-1.5 h-20 w-full resize-none rounded-sm border border-black/15 p-3 text-sm outline-none focus:border-black" />
              </div>
              <button
                onClick={runOrchestrate}
                disabled={busy || !orchContact.trim() || !orchPurpose.trim()}
                className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Phone className="h-3.5 w-3.5" />} Orchestrate Call
              </button>
            </div>
          )}

          {tab === "transcribe" && (
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Audio URL (voicemail / inbound)</label>
              <input
                value={audioUrlInput}
                onChange={(e) => setAudioUrlInput(e.target.value)}
                placeholder="https://...mp3"
                className="mt-1.5 w-full rounded-sm border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
              />
              <button
                onClick={runTranscribe}
                disabled={busy || !audioUrlInput.trim()}
                className="mt-3 inline-flex items-center gap-2 rounded-sm bg-black px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />} Transcribe Audio
              </button>
              {transcript && (
                <div className="mt-4 rounded-sm border border-black/10 bg-black/[0.02] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Transcript</p>
                  <p className="mt-2 text-sm leading-relaxed text-black/70">{transcript}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audio player + script result */}
      {(audioUrl || orchResult) && (
        <div className="mt-5 rounded-sm border border-black/10 bg-white p-5">
          {orchResult && (
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Generated Call Script</p>
                <button onClick={() => copyText(orchResult.script)} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-black/50 hover:text-black">
                  {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                </button>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-black/70">{orchResult.script}</p>
            </div>
          )}
          {audioUrl && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Audio</p>
              <audio ref={audioRef} controls src={audioUrl} className="mt-2 w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}