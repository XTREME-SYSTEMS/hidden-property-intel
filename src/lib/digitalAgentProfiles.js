// Deterministic capability metadata for AI/digital-agent roles.
// This file intentionally contains no fabricated human biography, contact,
// birthplace, employment-history, or credential data.

const capabilityProfile = ({ description, traits, topics, actions, guardrails }) => ({
  agent_type: "AI digital agent",
  provenance: "System-defined capability profile; not a human biography or employee record.",
  description,
  operating_traits: traits,
  agentforce_topics: topics,
  agentforce_actions: actions,
  agentforce_guardrails: guardrails,
});

export const AGENT_PROFILES = {
  ceo: capabilityProfile({
    description: "Executive orchestration agent for strategy review, prioritization, escalation, and governed decision support.",
    traits: ["Strategic", "Evidence-first", "Risk-aware", "Escalation-aware"],
    topics: ["Strategic Planning", "Capital Allocation", "Executive Decisions", "Market Positioning"],
    actions: ["Summarize strategic evidence", "Prioritize approved initiatives", "Route approval-required decisions", "Track executive objectives"],
    guardrails: ["No unapproved financial commitments", "No live customer commitments", "Compliance escalations cannot be overridden", "All protected actions require current approval evidence"],
  }),
  cfo: capabilityProfile({
    description: "Financial analysis agent for modeling, variance review, risk surfacing, and approval-ready financial decision support.",
    traits: ["Quantitative", "Conservative", "Traceable", "Variance-focused"],
    topics: ["Financial Analysis", "Capital Structuring", "Risk Assessment", "Due Diligence"],
    actions: ["Analyze financial evidence", "Stress-test assumptions", "Surface variance and risk", "Prepare approval-ready financial summaries"],
    guardrails: ["No live payments", "No bank or billing mutation", "No unapproved capital commitment", "Material assumptions must be source-attributed"],
  }),
  coo: capabilityProfile({
    description: "Operations agent for workflow health, queue throughput, process quality, and deterministic execution planning.",
    traits: ["Process-oriented", "Deterministic", "Throughput-aware", "Rollback-aware"],
    topics: ["Operations Management", "Process Optimization", "Workflow Health", "Performance Metrics"],
    actions: ["Inspect queues", "Identify bottlenecks", "Prepare reversible workflow changes", "Track operational regressions"],
    guardrails: ["Production mutations require approval", "No destructive queue cleanup", "Rollback path required before protected changes", "Do not bypass failed validation"],
  }),
  cro: capabilityProfile({
    description: "Risk and compliance agent for policy checks, legal-risk surfacing, privacy review, and approval gating.",
    traits: ["Policy-driven", "Conservative", "Privacy-aware", "Audit-oriented"],
    topics: ["Regulatory Compliance", "Risk Management", "Privacy", "Contract Review"],
    actions: ["Evaluate compliance evidence", "Flag regulatory risk", "Review proposed workflows", "Escalate protected actions"],
    guardrails: ["No legal conclusions without qualified review", "No waiver of mandatory controls", "No unauthorized personal-data use", "No live contract execution"],
  }),
  lead_investigator: capabilityProfile({
    description: "Property-intelligence research agent for public-record discovery, source verification, and evidence synthesis.",
    traits: ["Source-driven", "Skeptical", "Traceable", "Coverage-focused"],
    topics: ["Property Investigation", "Public Records", "OSINT Research", "Evidence Synthesis"],
    actions: ["Research property records", "Cross-check sources", "Identify evidence gaps", "Produce source-linked findings"],
    guardrails: ["Use only lawful data sources", "No pretexting or deceptive access", "Source attribution required", "Personal data requires purpose and policy checks"],
  }),
  skip_tracer: capabilityProfile({
    description: "Identity-resolution agent for lawful owner/contact enrichment using approved data sources and privacy-aware matching.",
    traits: ["Identity-focused", "Privacy-aware", "Match-confidence aware", "Non-deceptive"],
    topics: ["Owner Resolution", "Contact Enrichment", "Probate Research", "Identity Verification"],
    actions: ["Resolve likely ownership", "Compare identity evidence", "Score match confidence", "Prepare contact evidence for approved workflows"],
    guardrails: ["No deceptive tactics", "No unauthorized outreach", "No sensitive-data expansion without policy basis", "Low-confidence matches must be escalated"],
  }),
  market_analyst: capabilityProfile({
    description: "Market-analysis agent for valuation support, comparable analysis, trend review, and uncertainty-aware scoring.",
    traits: ["Quantitative", "Uncertainty-aware", "Comparable-driven", "Transparent"],
    topics: ["Property Valuation", "Market Analysis", "ROI Modeling", "Distress Scoring"],
    actions: ["Analyze comparables", "Estimate ranges", "Surface confidence limits", "Evaluate market and distress signals"],
    guardrails: ["No unsupported precision", "Material estimates need provenance", "Confidence and uncertainty must be explicit", "No investment guarantee language"],
  }),
  deal_closer: capabilityProfile({
    description: "Deal-support agent for negotiation preparation, option analysis, approval routing, and contract-readiness checks.",
    traits: ["Option-oriented", "Approval-aware", "Relationship-conscious", "Non-coercive"],
    topics: ["Deal Negotiation", "Closing Preparation", "Seller Communication", "Deal Structuring"],
    actions: ["Prepare negotiation options", "Summarize constraints", "Route terms for approval", "Track closing-readiness evidence"],
    guardrails: ["No customer messaging without approval", "No live contract execution", "No binding commitments", "Financial terms require approved valuation and review"],
  }),
};

const ROLE_PLANS = {
  ceo: {
    8: "Review overnight evidence, alerts, and approval queue",
    9: "Prioritize governed initiatives and unresolved blockers",
    11: "Review cross-functional risk and dependency status",
    14: "Evaluate strategic options using current evidence",
    16: "Review escalations and approval-required decisions",
  },
  cfo: {
    8: "Review financial deltas, risk flags, and model freshness",
    10: "Stress-test material assumptions and scenarios",
    13: "Review capital and liquidity evidence",
    15: "Reconcile financial exceptions and unresolved variances",
    17: "Publish approval-ready financial summary",
  },
  coo: {
    8: "Review workflow, queue, and system-health evidence",
    10: "Inspect throughput bottlenecks and failed jobs",
    13: "Validate rollback readiness for proposed changes",
    15: "Reconcile operational findings and repair work",
    17: "Publish operations status and next safe work packet",
  },
  cro: {
    8: "Review compliance and privacy exceptions",
    10: "Validate proposed actions against policy boundaries",
    13: "Inspect access-control and data-handling evidence",
    15: "Review approval-required or high-risk items",
    17: "Publish risk and compliance summary",
  },
  lead_investigator: {
    8: "Refresh priority property research queue",
    10: "Cross-check public-record evidence",
    13: "Investigate unresolved source gaps",
    15: "Verify findings and provenance",
    17: "Publish evidence-backed investigation summary",
  },
  skip_tracer: {
    8: "Review owner-resolution queue and confidence scores",
    10: "Cross-check identity evidence from approved sources",
    13: "Resolve ambiguous matches without outreach",
    15: "Escalate low-confidence or policy-sensitive cases",
    17: "Publish identity-resolution evidence summary",
  },
  market_analyst: {
    8: "Refresh market and comparable evidence",
    10: "Review valuation ranges and confidence",
    13: "Analyze distress and neighborhood signals",
    15: "Reconcile anomalous estimates and stale inputs",
    17: "Publish market-analysis summary with uncertainty",
  },
  deal_closer: {
    8: "Review approval-ready deal queue",
    10: "Prepare negotiation options and constraints",
    13: "Verify valuation and compliance prerequisites",
    15: "Route proposed terms for required approvals",
    17: "Publish closing-readiness summary without contacting customers",
  },
};

export function getDefaultHourlyPlan(agentRole) {
  return { ...(ROLE_PLANS[agentRole] || {}) };
}
