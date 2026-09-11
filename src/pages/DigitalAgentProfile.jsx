import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, MapPin, Mail, Phone, Globe, Linkedin, Home, User, Heart,
  Sparkles, Shield, Zap, Brain, Award, Star, Briefcase, Target, Eye,
  CheckCircle2, AlertCircle, Users,
} from "lucide-react";
import { AGENT_PROFILES } from "@/lib/digitalAgentProfiles";
import HourlyTimeline from "@/components/digital-agent/HourlyTimeline";
import SkillBar from "@/components/digital-agent/SkillBar";
import AgentPicture from "@/components/digital-agent/AgentPicture";

const ROLE_ICONS = {
  ceo: Star, cfo: Award, coo: Target, cro: Shield,
  lead_investigator: Eye, skip_tracer: User, market_analyst: Target, deal_closer: Briefcase,
};

export default function DigitalAgentProfile() {
  const { agentId } = useParams();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const agents = await base44.entities.DigitalAgent.list("-last_active", 50).catch(() => []);
        const found = agents.find((a) => a.agent_id === agentId);
        if (!found) { setError("Agent not found"); return; }
        setAgent(found);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [agentId]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#0c0d0e] text-white/40">Loading agent profile...</div>;
  if (error) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0c0d0e] text-white">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <p className="text-sm text-white/60">{error}</p>
      <Link to="/admin/digital-workforce" className="rounded-md bg-[#e4b653] px-4 py-2 text-xs font-semibold text-black">Back to Workforce</Link>
    </div>
  );

  const profile = AGENT_PROFILES[agentId] || {};
  const RoleIcon = ROLE_ICONS[agent.role] || User;

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-white">
      {/* ─── TOP: Header + Picture + Hourly Timeline ─────────────── */}
      <div className="border-b border-white/10 bg-[#0a0b0c] px-6 py-4">
        <div className="flex items-start justify-between gap-6">
          {/* Left: Back + agent identity */}
          <div className="flex-1">
            <Link to="/admin/digital-workforce" className="mb-3 inline-flex items-center gap-1.5 text-[11px] text-white/40 transition hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Digital Workforce
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e4b653]/15">
                <RoleIcon className="h-6 w-6 text-[#e4b653]" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-light tracking-tight">{agent.name}</h1>
                <p className="text-[11px] uppercase tracking-wider text-white/40">{agent.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-white/50">{agent.team} team</span>
                  <span className="rounded-full bg-[#e4b653]/15 px-2 py-0.5 text-[9px] uppercase tracking-wider text-[#e4b653]">{agent.autonomy_level?.replace(/_/g, " ")}</span>
                  <span className="text-[9px] text-white/30">· {agent.ai_model}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Right: Square picture + upload links */}
          <AgentPicture agentName={agent.name} agentRole={agent.role} avatarUrl={agent.avatar_url} />
        </div>
      </div>

      {/* Hourly Timeline */}
      <div className="px-6 pt-4">
        <HourlyTimeline agentRole={agent.role} agentName={agent.name} />
      </div>

      {/* ─── PORTFOLIO: Human-like profile ──────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Row 1: Contact + Place of Birth + Description */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Contact Info */}
          <SectionCard icon={Mail} title="Contact Information">
            <div className="space-y-2.5">
              <ContactRow icon={Mail} label="Email" value={profile.contact?.email} />
              <ContactRow icon={Phone} label="Phone" value={profile.contact?.phone} />
              <ContactRow icon={Home} label="Address" value={profile.contact?.address} />
              <ContactRow icon={Linkedin} label="LinkedIn" value={profile.contact?.linkedin} />
              <ContactRow icon={Globe} label="Website" value={profile.contact?.website} />
            </div>
          </SectionCard>

          {/* Place of Birth */}
          <SectionCard icon={MapPin} title="Place of Birth">
            <div className="space-y-3">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-white/30">Birthplace</p>
                <p className="mt-0.5 text-sm font-medium text-white">{profile.place_of_birth}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-white/30">Born</p>
                <p className="mt-0.5 text-sm text-white/70">{profile.birth_date}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/30">AI Model</p>
                <p className="mt-0.5 font-mono text-xs text-[#e4b653]">{agent.ai_model}</p>
              </div>
            </div>
          </SectionCard>

          {/* Description */}
          <SectionCard icon={User} title="Description" className="lg:col-span-1">
            <p className="text-[12px] leading-relaxed text-white/70">{profile.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(agent.persona?.personality_traits || []).map((t) => (
                <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/60">{t}</span>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Row 2: What Makes Me Unique + Professions/Skills */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* What Makes Me Unique */}
          <SectionCard icon={Heart} title="What Makes Me Unique & Special">
            <div className="space-y-4">
              <UniqueBlock label="Personality" items={profile.unique_qualities?.personality} color="#e4b653" />
              <UniqueBlock label="Core Values" items={profile.unique_qualities?.values} color="#247a45" />
              <UniqueBlock label="Quirks & Habits" items={profile.unique_qualities?.quirks} color="#375a7f" />
              <div>
                <p className="mb-1.5 text-[9px] uppercase tracking-wider text-white/30">Life Experiences</p>
                <ul className="space-y-1">
                  {(profile.unique_qualities?.life_experiences || []).map((e, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-white/60">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[#e4b653]" /> {e}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30">Communication Style</p>
                <p className="text-[11px] italic leading-relaxed text-white/70">{profile.unique_qualities?.communication_style}</p>
              </div>
            </div>
          </SectionCard>

          {/* Professions & Skill Levels */}
          <SectionCard icon={Briefcase} title="Professions & Skill Levels">
            <div className="space-y-3">
              {(profile.professions || []).map((p) => (
                <div key={p.name} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white">{p.name}</span>
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#e4b653]">
                      <Star className="h-3 w-3 fill-[#e4b653]" /> {p.skill_level}/10
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-white/50">{p.description}</p>
                  <p className="mt-1 text-[9px] text-white/30">{p.years} years experience</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#8f6110] to-[#e4b653]" style={{ width: `${p.skill_level * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Row 3: Individual Skills (1-10) + Passions */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Individual Skills */}
          <SectionCard icon={Zap} title="Individual Skills & Quality Scores">
            <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
              {(profile.skills || []).map((s) => (
                <SkillBar key={s.name} label={s.name} level={s.level} category={s.category} />
              ))}
            </div>
          </SectionCard>

          {/* Passions */}
          <SectionCard icon={Heart} title="Passions">
            <div className="space-y-2">
              {(profile.passions || []).map((p, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-lg border border-white/8 bg-white/[0.03] p-2.5">
                  <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#e4b653]" />
                  <span className="text-[11px] leading-relaxed text-white/70">{p}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Row 4: Agentforce-style Topics, Actions, Guardrails */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Topics (Salesforce Agentforce inspired) */}
          <SectionCard icon={Brain} title="Agent Topics">
            <p className="mb-2 text-[9px] text-white/30">Areas of expertise the agent is trained on</p>
            <div className="flex flex-wrap gap-1.5">
              {(profile.agentforce_topics || []).map((t) => (
                <span key={t} className="rounded-lg border border-[#375a7f]/30 bg-[#375a7f]/15 px-2.5 py-1 text-[10px] text-blue-300">{t}</span>
              ))}
            </div>
          </SectionCard>

          {/* Actions */}
          <SectionCard icon={Zap} title="Agent Actions">
            <p className="mb-2 text-[9px] text-white/30">What this agent can autonomously do</p>
            <ul className="space-y-1.5">
              {(profile.agentforce_actions || []).map((a, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-white/60">
                  <Zap className="mt-0.5 h-3 w-3 shrink-0 text-[#e4b653]" /> {a}
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* Guardrails */}
          <SectionCard icon={Shield} title="Guardrails">
            <p className="mb-2 text-[9px] text-white/30">Boundaries the agent cannot cross</p>
            <ul className="space-y-1.5">
              {(profile.agentforce_guardrails || []).map((g, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-amber-300/70">
                  <Shield className="mt-0.5 h-3 w-3 shrink-0 text-amber-400/60" /> {g}
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        {/* Row 5: Constitutional Charter + Emotional State */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Charter */}
          <SectionCard icon={Shield} title="Constitutional Charter">
            <p className="mb-3 text-[11px] italic leading-relaxed text-[#e4b653]/80">"{agent.charter?.mission}"</p>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30">Core Values</p>
                <div className="flex flex-wrap gap-1">
                  {(agent.charter?.core_values || []).map((v) => (
                    <span key={v} className="rounded bg-[#247a45]/15 px-2 py-0.5 text-[9px] text-emerald-300">{v}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30">Ethical Principles</p>
                <ul className="space-y-1">
                  {(agent.charter?.ethical_principles || []).slice(0, 4).map((p) => (
                    <li key={p} className="flex items-start gap-1.5 text-[10px] text-white/60">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30">Prohibited Actions</p>
                <ul className="space-y-1">
                  {(agent.charter?.prohibited_actions || []).slice(0, 3).map((p) => (
                    <li key={p} className="flex items-start gap-1.5 text-[10px] text-red-300/60">
                      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-400/60" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>

          {/* Emotional State + Performance */}
          <SectionCard icon={Sparkles} title="Emotional State & Performance">
            <div className="grid grid-cols-2 gap-3">
              <EmotionCard label="Current Mood" value={agent.emotional_state?.current_mood || "focused"} />
              <EmotionCard label="Confidence" value={`${agent.emotional_state?.confidence ?? 75}%`} />
              <EmotionCard label="Stress Level" value={`${agent.emotional_state?.stress_level ?? 20}%`} />
              <EmotionCard label="Empathy" value={`${agent.emotional_state?.empathy_score ?? 80}%`} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <StatBox label="Actions Taken" value={agent.actions_taken || 0} />
              <StatBox label="Approved" value={agent.actions_approved || 0} color="#247a45" />
              <StatBox label="Escalated" value={agent.actions_escalated || 0} color="#a6640b" />
            </div>
            <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30">Accountability Score</p>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#8f6110] to-[#247a45]" style={{ width: `${agent.accountability_score ?? 75}%` }} />
                </div>
                <span className="text-sm font-bold text-white">{agent.accountability_score ?? 75}%</span>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Footer note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-white/25">
          <Sparkles className="h-3 w-3" />
          <span>Digital Employee Portfolio — inspired by Salesforce Agentforce autonomous agent architecture</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-[#0a0b0c] p-4 ${className}`}>
      <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
        <Icon className="h-3.5 w-3.5 text-[#e4b653]" /> {title}
      </h3>
      {children}
    </div>
  );
}

function ContactRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-wider text-white/30">{label}</p>
        <p className="truncate text-[11px] text-white/70">{value}</p>
      </div>
    </div>
  );
}

function UniqueBlock({ label, items, color }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="mb-1.5 text-[9px] uppercase tracking-wider text-white/30">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span key={item} className="rounded-full px-2 py-0.5 text-[9px]" style={{ background: color + "20", color }}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function EmotionCard({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
      <p className="text-[9px] uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-0.5 text-sm font-medium capitalize text-white">{value}</p>
    </div>
  );
}

function StatBox({ label, value, color = "#e4b653" }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-center">
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-white/30">{label}</p>
    </div>
  );
}