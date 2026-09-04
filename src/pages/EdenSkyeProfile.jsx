import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Mail, Phone, Calendar, MessageSquare, Brain, Heart, Shield, Zap, Mic, ArrowRight } from "lucide-react";

const PROFILE_IMAGES = [
  { url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/87e41f08f_generated_image.png", label: "Professional — Blazer & Glasses" },
  { url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/b1209aa63_generated_image.png", label: "Executive — Skirt Suit" },
  { url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/0d11db576_generated_image.png", label: "Evening — Formal Gown" },
  { url: "https://media.base44.com/images/public/6a8ba268665196e93b7d57f7/9e7cd7535_generated_image.png", label: "Approachable — Office Desk" },
];

const CAPABILITIES = [
  { icon: Mail, title: "Email Communications", desc: "Drafts, sends, and responds to all outreach emails — investors, owners, heirs, agents — with human-quality personalization." },
  { icon: MessageSquare, title: "Social Media", desc: "Manages LinkedIn, Facebook, Instagram, and Twitter/X communications. Builds brand voice and community." },
  { icon: Phone, title: "Phone Assistant", desc: "Incoming and outgoing calls via Twilio. Ultra-lifelike voice — sweet, calm, intelligent. Handles scheduling and inquiries." },
  { icon: Calendar, title: "Scheduling & Calendar", desc: "Coordinates meetings, calls, closings, and deadlines. Full executive assistant calendar management." },
  { icon: Brain, title: "Industry Intelligence", desc: "Expert in Florida real estate — distressed properties, probate, wholesaling, fix-and-flip, smart contracts, compliance." },
  { icon: Shield, title: "Compliance Guardian", desc: "Fair Housing compliant, RESPA-aware, Florida statute knowledgeable. Every communication is audited for compliance." },
];

const VOICE_TRAITS = [
  { trait: "Sweet", desc: "Warm and genuinely caring in every interaction" },
  { trait: "Calm", desc: "Steady and composed, even in high-stress situations" },
  { trait: "Intelligent", desc: "Sharp, knowledgeable, and quick to understand" },
  { trait: "Humanistic", desc: "Indistinguishable from a human assistant — personality, warmth, wit" },
];

export default function EdenSkyeProfile() {
  const [activeImage, setActiveImage] = useState(0);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12">
      {/* Hero */}
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="relative overflow-hidden rounded-sm border border-black/10">
            <img src={PROFILE_IMAGES[activeImage].url} alt="Eden Skye" className="w-full object-cover" style={{ aspectRatio: "3/4" }} />
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
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Humanistic AI Agent</p>
          <h1 className="mt-3 font-display text-5xl font-light tracking-tight">Eden Skye</h1>
          <p className="mt-2 text-lg text-black/60">Executive Assistant & Communications Director</p>
          <p className="mt-1 text-sm text-black/50">Hidden Property Intel · Licensed Real Estate Support</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {["Email", "Phone (Twilio)", "Social Media", "Scheduling", "Deal Coordination", "Compliance"].map((tag) => (
              <span key={tag} className="rounded-full border border-black/15 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-black/60">{tag}</span>
            ))}
          </div>

          <p className="mt-6 max-w-xl text-sm leading-relaxed text-black/70">
            Eden Skye is Hidden Property Intel's ultra-humanistic AI agent — designed to be indistinguishable from a
            warm, intelligent, sophisticated human executive assistant. She handles every communication channel with
            genuine empathy, deep industry expertise, and a voice that makes people feel heard.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/eden-skye/chat" className="inline-flex items-center gap-2 rounded-sm bg-black px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-gold-warm">
              <MessageSquare className="h-4 w-4" /> Chat with Eden
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
          <h2 className="font-display text-2xl font-light">Voice & Personality Blueprint</h2>
        </div>
        <p className="mt-2 text-xs text-black/50">Eden's voice is modeled to be ultra-lifelike — sweet, calm, and intelligent. She speaks like a trusted advisor who happens to be an expert.</p>
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
          <h2 className="font-display text-2xl font-light">Capabilities</h2>
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
          Eden is an expert in Florida real estate investment. She understands distressed property types
          (pre-foreclosure, probate, tax-delinquent, code violations, divorce, bankruptcy), investment strategies
          (wholesaling, fix-and-flip, BRRRR, buy-and-hold), smart-contract escrow on Polygon, ownership chain
          tracing, skip-tracing, and all applicable regulations — Florida Chapter 475, Fair Housing Act, UETA,
          RESPA, and the Florida probate code.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Distress Types", value: "10+" },
            { label: "Investment Strategies", value: "6+" },
            { label: "FL Counties Covered", value: "67" },
            { label: "Data Sources Tracked", value: "317+" },
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
            { audience: "Investors", approach: "Peer-level and direct. Lead with value — specific properties, specific numbers. Never waste their time with fluff." },
            { audience: "Property Owners", approach: "Empathetic and respectful. These are often people in difficult situations. Never pushy. Position as a problem-solver." },
            { audience: "Probate Heirs", approach: "Deeply empathetic and patient. Lead with condolences, never business. Give them space and time." },
            { audience: "Agents & Professionals", approach: "Collaborative and professional. Focus on mutual benefit and respect their license and expertise." },
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
          Start a conversation with Eden <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}