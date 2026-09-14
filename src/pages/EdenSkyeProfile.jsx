import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Mail, Phone, Calendar, MessageSquare, Brain, Heart, Shield, Zap, Mic, ArrowRight } from "lucide-react";

const PROFILE_IMAGES = [
  { url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/87e41f08f_generated_image.png", label: "Generated AI avatar — professional" },
  { url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/b1209aa63_generated_image.png", label: "Generated AI avatar — executive" },
  { url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/0d11db576_generated_image.png", label: "Generated AI avatar — formal" },
  { url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/9e7cd7535_generated_image.png", label: "Generated AI avatar — office" },
];

const CAPABILITIES = [
  { icon: Mail, title: "Email Workflow Support", desc: "Drafts and organizes outreach content. External sending requires a connected provider, applicable permissions, and an approved workflow." },
  { icon: MessageSquare, title: "Social Workflow Support", desc: "Drafts social content and assists with campaign workflows. Publishing depends on connected tools, permissions, and approvals." },
  { icon: Phone, title: "Voice Workflow Support", desc: "Supports voice-workflow orchestration when an approved telephony provider is connected. Eden remains an AI assistant and does not represent a human caller." },
  { icon: Calendar, title: "Scheduling Support", desc: "Helps organize meetings, calls, closings, and deadlines when authorized calendar integrations are available." },
  { icon: Brain, title: "Industry Intelligence", desc: "Uses configured knowledge and available data to assist with Florida real-estate research and investment workflows; outputs require verification." },
  { icon: Shield, title: "Compliance Assistance", desc: "Applies configured compliance checks and guardrails. It is not legal advice and does not replace licensed legal or real-estate professionals." },
];

const VOICE_TRAITS = [
  { trait: "Warm", desc: "Designed for respectful, considerate conversation" },
  { trait: "Calm", desc: "Steady and composed in high-stress workflows" },
  { trait: "Knowledgeable", desc: "Uses configured domain context and available data while flagging uncertainty" },
  { trait: "Natural", desc: "Conversational and approachable while clearly identifying itself as AI" },
];

export default function EdenSkyeProfile() {
  const [activeImage, setActiveImage] = useState(0);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12">
      {/* Hero */}
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="relative overflow-hidden rounded-sm border border-black/10">
            <img src={PROFILE_IMAGES[activeImage].url} alt="Generated avatar for Eden Skye AI" className="w-full object-cover" style={{ aspectRatio: "3/4" }} />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">{PROFILE_IMAGES[activeImage].label}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {PROFILE_IMAGES.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`overflow-hidden rounded-sm border-2 transition ${activeImage === i ? "border-gold" : "border-transparent opacity-60 hover:opacity-100"}`}
              >
                <img src={img.url} alt={img.label} className="h-16 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">AI Virtual Assistant</p>
          <h1 className="mt-3 font-display text-5xl font-light tracking-tight">Eden Skye</h1>
          <p className="mt-2 text-lg text-black/60">Executive Assistant & Communications AI</p>
          <p className="mt-1 text-sm text-black/50">Hidden Property Intel · AI Real Estate Support</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {["Email Drafting", "Voice Workflows", "Social Drafting", "Scheduling Support", "Deal Coordination", "Compliance Checks"].map((tag) => (
              <span key={tag} className="rounded-full border border-black/15 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-black/60">{tag}</span>
            ))}
          </div>

          <div className="mt-6 rounded-sm border border-gold/30 bg-gold/5 p-4 text-xs leading-relaxed text-black/70">
            <strong>AI identity notice:</strong> Eden Skye is an AI system with generated avatar imagery, not a human employee, licensed broker, attorney, or other licensed professional. External actions are limited by connected tools, permissions, and approval policies.
          </div>

          <p className="mt-6 max-w-xl text-sm leading-relaxed text-black/70">
            Eden Skye is Hidden Property Intel's conversational AI assistant for research, drafting, coordination, and
            governed workflow support. The experience is designed to feel natural and helpful while remaining clearly
            disclosed as AI and subject to system permissions, validation, and operator controls.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/eden-skye/chat" className="inline-flex items-center gap-2 rounded-sm bg-black px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-gold-warm">
              <MessageSquare className="h-4 w-4" /> Chat with Eden AI
            </Link>
            <Link to="/admin/email-gallery" className="inline-flex items-center gap-2 rounded-sm border border-black/15 px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-black/70 hover:bg-black hover:text-white">
              <Mail className="h-4 w-4" /> Email Templates
            </Link>
          </div>
        </div>
      </div>

      {/* Voice Profile */}
      <section className="mt-16">
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl font-light">Voice & Interaction Blueprint</h2>
        </div>
        <p className="mt-2 text-xs text-black/50">Eden is configured for a warm, calm, natural conversational style while remaining explicitly identified as an AI assistant.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VOICE_TRAITS.map((v) => (
            <div key={v.trait} className="rounded-sm border border-black/10 p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" />
                <p className="font-display text-lg">{v.trait}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-black/55">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="mt-16">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl font-light">Governed Capabilities</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="rounded-sm border border-black/10 p-6 transition hover:border-black/30">
              <c.icon className="h-6 w-6 text-black/60" />
              <p className="mt-4 font-display text-base">{c.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-black/55">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Industry Intelligence */}
      <section className="mt-16 rounded-sm bg-black p-8 text-white lg:p-12">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl font-light">Industry Intelligence</h2>
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/70">
          Eden is configured to assist with Florida real-estate investment research, including distressed-property
          categories, investment strategies, ownership-chain research, skip-tracing workflows, and compliance-aware
          drafting. Legal, licensing, title, investment, and transaction conclusions require verification by the
          appropriate licensed professional or authoritative source.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Distress Categories", value: "10+" },
            { label: "Investment Strategies", value: "6+" },
            { label: "Florida Counties", value: "67" },
            { label: "Configured Data Sources", value: "317+" },
          ].map((s) => (
            <div key={s.label} className="border border-white/10 p-5">
              <p className="font-display text-3xl font-light text-gold">{s.value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/50">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Communication Philosophy */}
      <section className="mt-16">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl font-light">Communication Philosophy</h2>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {[
            { audience: "Investors", approach: "Peer-level and direct. Lead with relevant property and deal facts, and clearly separate verified data from estimates." },
            { audience: "Property Owners", approach: "Empathetic and respectful. Avoid pressure and present options clearly when an approved outreach workflow is used." },
            { audience: "Probate Heirs", approach: "Sensitive and patient. Avoid business pressure and use only approved, compliant outreach workflows." },
            { audience: "Agents & Professionals", approach: "Collaborative and professional. Respect licensing boundaries and verify facts before operational use." },
          ].map((p) => (
            <div key={p.audience} className="rounded-sm border border-black/10 p-6">
              <p className="font-display text-base text-gold">{p.audience}</p>
              <p className="mt-2 text-xs leading-relaxed text-black/60">{p.approach}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 text-center">
        <Link to="/eden-skye/chat" className="inline-flex items-center gap-2 rounded-sm bg-black px-8 py-4 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-gold-warm">
          Start a conversation with Eden AI <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
