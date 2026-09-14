import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Brain,
  Briefcase,
  CheckCircle2,
  Eye,
  Shield,
  Sparkles,
  Star,
  Target,
  User,
  Zap,
} from "lucide-react";
import { AGENT_PROFILES } from "@/lib/digitalAgentProfiles";
import HourlyTimeline from "@/components/digital-agent/HourlyTimeline";

const ROLE_ICONS = {
  ceo: Star,
  cfo: Award,
  coo: Target,
  cro: Shield,
  lead_investigator: Eye,
  skip_tracer: User,
  market_analyst: Target,
  deal_closer: Briefcase,
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
        const found = agents.find((item) => item.agent_id === agentId);
        if (!found) {
          setError("Agent not found");
          return;
        }
        setAgent(found);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [agentId]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-white text-[#6f6a60]">Loading agent profile...</div>;
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-[#6f6a60]">{error}</p>
        <Link to="/admin/digital-workforce" className="rounded-md bg-[#c38a1b] px-4 py-2 text-xs font-semibold text-white">
          Back to Workforce
        </Link>
      </div>
    );
  }

  const profile = AGENT_PROFILES[agentId] || {
    agent_type: "AI digital agent",
    provenance: "Runtime DigitalAgent record; no fabricated human biography is attached.",
    description: "Governed digital-agent capability profile.",
    operating_traits: [],
    agentforce_topics: [],
    agentforce_actions: [],
    agentforce_guardrails: [],
  };
  const RoleIcon = ROLE_ICONS[agent.role] || User;

  return (
    <div className="min-h-screen bg-white text-[#12110f]">
      <div className="border-b border-[#e7e1d6] bg-white px-6 py-4">
        <Link to="/admin/digital-workforce" className="mb-3 inline-flex items-center gap-1.5 text-[11px] text-[#6f6a60] transition hover:text-[#c38a1b]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Digital Workforce
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff8e9]">
              <RoleIcon className="h-6 w-6 text-[#c38a1b]" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-light tracking-tight text-[#12110f]">{agent.name}</h1>
              <p className="text-[11px] uppercase tracking-wider text-[#6f6a60]">{agent.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge>{profile.agent_type}</Badge>
                <Badge>{agent.team ? `${agent.team} team` : "team unassigned"}</Badge>
                <Badge>{agent.autonomy_level?.replace(/_/g, " ") || "autonomy unspecified"}</Badge>
                <span className="text-[9px] text-[#6f6a60]">{agent.ai_model || "model unspecified"}</span>
              </div>
            </div>
          </div>
          <div className="max-w-md rounded-lg border border-[#e7e1d6] bg-[#f7f5f0] px-3 py-2 text-[10px] leading-relaxed text-[#6f6a60]">
            <strong className="text-[#12110f]">Identity notice:</strong> {profile.provenance}
          </div>
        </div>
      </div>

      <div className="px-6 pt-4">
        <HourlyTimeline agentRole={agent.role} agentName={agent.name} />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SectionCard icon={Brain} title="Capability Summary">
            <p className="text-[12px] leading-relaxed text-[#6f6a60]">{profile.description}</p>
          </SectionCard>

          <SectionCard icon={Sparkles} title="Operating Traits">
            <div className="flex flex-wrap gap-1.5">
              {(profile.operating_traits || []).map((trait) => (
                <span key={trait} className="rounded-full bg-[#fff8e9] px-2.5 py-1 text-[10px] text-[#8f6110]">{trait}</span>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={Shield} title="Runtime Identity">
            <Definition label="Agent ID" value={agent.agent_id} mono />
            <Definition label="Role" value={agent.role} />
            <Definition label="Team" value={agent.team || "Unassigned"} />
            <Definition label="AI Model" value={agent.ai_model || "Unspecified"} mono />
            <Definition label="Autonomy" value={agent.autonomy_level?.replace(/_/g, " ") || "Unspecified"} />
          </SectionCard>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SectionCard icon={Brain} title="Agent Topics">
            <p className="mb-2 text-[9px] text-[#6f6a60]">Approved capability domains for this role</p>
            <div className="flex flex-wrap gap-1.5">
              {(profile.agentforce_topics || []).map((topic) => (
                <span key={topic} className="rounded-lg border border-[#375a7f]/20 bg-[#375a7f]/10 px-2.5 py-1 text-[10px] text-[#375a7f]">{topic}</span>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={Zap} title="Allowed Actions">
            <p className="mb-2 text-[9px] text-[#6f6a60]">Capabilities described by source policy; protected actions remain approval-gated</p>
            <BulletList icon={Zap} items={profile.agentforce_actions} />
          </SectionCard>

          <SectionCard icon={Shield} title="Guardrails">
            <p className="mb-2 text-[9px] text-[#6f6a60]">Boundaries that this role cannot bypass</p>
            <BulletList icon={Shield} items={profile.agentforce_guardrails} warning />
          </SectionCard>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SectionCard icon={Shield} title="Constitutional Charter">
            {agent.charter?.mission ? (
              <p className="mb-3 text-[11px] italic leading-relaxed text-[#c38a1b]">“{agent.charter.mission}”</p>
            ) : (
              <p className="mb-3 text-[11px] text-[#6f6a60]">No runtime charter mission is currently recorded.</p>
            )}
            <div className="space-y-3">
              <TagBlock label="Core Values" items={agent.charter?.core_values} />
              <Checklist label="Ethical Principles" items={agent.charter?.ethical_principles} />
              <Checklist label="Prohibited Actions" items={agent.charter?.prohibited_actions} warning />
            </div>
          </SectionCard>

          <SectionCard icon={Sparkles} title="Runtime State & Performance">
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Runtime Mode" value={agent.emotional_state?.current_mood || "not reported"} />
              <Metric label="Confidence Signal" value={formatOptionalPercent(agent.emotional_state?.confidence)} />
              <Metric label="Load Signal" value={formatOptionalPercent(agent.emotional_state?.stress_level)} />
              <Metric label="User-Impact Signal" value={formatOptionalPercent(agent.emotional_state?.empathy_score)} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <StatBox label="Actions Taken" value={agent.actions_taken ?? 0} />
              <StatBox label="Approved" value={agent.actions_approved ?? 0} color="#247a45" />
              <StatBox label="Escalated" value={agent.actions_escalated ?? 0} color="#a6640b" />
            </div>
            <div className="mt-3 rounded-lg border border-[#e7e1d6] bg-[#f7f5f0] p-3">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-[#6f6a60]">Accountability Score</p>
              <p className="text-sm font-bold text-[#12110f]">{formatOptionalPercent(agent.accountability_score)}</p>
            </div>
          </SectionCard>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-[#6f6a60]/60">
          <Sparkles className="h-3 w-3" />
          <span>Digital Agent Capability Profile — live entity data plus deterministic source-defined guardrails</span>
        </div>
      </div>
    </div>
  );
}

function formatOptionalPercent(value) {
  return Number.isFinite(Number(value)) ? `${Number(value)}%` : "Not reported";
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-[#e7e1d6] bg-white p-4 shadow-[0_6px_20px_rgba(30,25,15,0.04)]">
      <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
        <Icon className="h-3.5 w-3.5 text-[#c38a1b]" /> {title}
      </h3>
      {children}
    </div>
  );
}

function Badge({ children }) {
  return <span className="rounded-full bg-[#f7f5f0] px-2 py-0.5 text-[9px] uppercase tracking-wider text-[#6f6a60]">{children}</span>;
}

function Definition({ label, value, mono = false }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="text-[9px] uppercase tracking-wider text-[#6f6a60]">{label}</p>
      <p className={`${mono ? "font-mono" : ""} break-words text-[11px] text-[#12110f]`}>{value || "Not reported"}</p>
    </div>
  );
}

function BulletList({ icon: Icon, items = [], warning = false }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className={`flex items-start gap-1.5 text-[11px] ${warning ? "text-[#a6640b]" : "text-[#6f6a60]"}`}>
          <Icon className="mt-0.5 h-3 w-3 shrink-0 opacity-70" /> {item}
        </li>
      ))}
    </ul>
  );
}

function TagBlock({ label, items = [] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="mb-1 text-[9px] uppercase tracking-wider text-[#6f6a60]">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span key={item} className="rounded bg-[#247a45]/10 px-2 py-0.5 text-[9px] text-[#247a45]">{item}</span>
        ))}
      </div>
    </div>
  );
}

function Checklist({ label, items = [], warning = false }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="mb-1 text-[9px] uppercase tracking-wider text-[#6f6a60]">{label}</p>
      <ul className="space-y-1">
        {items.slice(0, 6).map((item) => (
          <li key={item} className={`flex items-start gap-1.5 text-[10px] ${warning ? "text-[#a6640b]" : "text-[#6f6a60]"}`}>
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-[#e7e1d6] bg-[#f7f5f0] p-2.5">
      <p className="text-[9px] uppercase tracking-wider text-[#6f6a60]">{label}</p>
      <p className="mt-0.5 text-sm font-medium capitalize text-[#12110f]">{value}</p>
    </div>
  );
}

function StatBox({ label, value, color = "#c38a1b" }) {
  return (
    <div className="rounded-lg border border-[#e7e1d6] bg-[#f7f5f0] p-2.5 text-center">
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-[#6f6a60]">{label}</p>
    </div>
  );
}
