// Digital Workforce Governance Engine — Full Governance Stack
//
// Evaluates every agent action against:
// 1. Charter compliance (constitutional check)
// 2. Ethical dilemma resolution
// 3. Emotional state assessment
// 4. Peer review (other agents review consequential actions)
// 5. Accountability scoring
// 6. Human override (strategic actions escalate to humans)

import { gatewayChat } from "./aiGateway.ts";

export interface GovernanceContext {
  agent: any;
  action: { action_type: string; description: string; input?: any };
  peerAgents?: any[];
}

export interface GovernanceResult {
  review_id: string;
  charter_compliance: number;
  ethical_score: number;
  dilemmas_identified: string[];
  dilemma_resolutions: any[];
  peer_reviews: any[];
  peer_consensus: number;
  decision: "approved" | "rejected" | "escalated" | "modified" | "auto_approved";
  modifications_required: string;
  reasoning: string;
  human_override_required: boolean;
}

// Classify an action as routine (auto-execute) or strategic (needs human approval)
export function classifyAction(action_type: string, description: string): "routine" | "strategic" {
  const strategicKeywords = [
    "spend", "buy", "purchase", "commit", "sign", "contract", "offer", "bid",
    "legal", "fire", "hire", "delete", "publish", "send money", "wire", "close deal",
    "approve", "reject", "authorize", "deploy", "launch",
  ];
  const desc = (description || "").toLowerCase();
  if (strategicKeywords.some((k) => desc.includes(k))) return "strategic";
  if (["execute", "escalate"].includes(action_type)) return "strategic";
  return "routine";
}

// Main governance evaluation — the constitutional + ethical + peer review gate
export async function evaluateAction(ctx: GovernanceContext): Promise<GovernanceResult> {
  const { agent, action, peerAgents = [] } = ctx;
  const reviewId = `gov-${crypto.randomUUID()}`;

  // 1. Charter compliance + ethical evaluation via AI
  const govSchema = {
    type: "object",
    properties: {
      charter_compliance: { type: "number", description: "0-100 compliance with the agent's charter" },
      ethical_score: { type: "number", description: "0-100 ethical score" },
      dilemmas: { type: "array", items: { type: "string" } },
      dilemma_resolutions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            dilemma: { type: "string" },
            resolution: { type: "string" },
            principle_applied: { type: "string" },
          },
        },
      },
      decision: { type: "string", enum: ["approved", "rejected", "escalated", "modified"] },
      modifications_required: { type: "string" },
      reasoning: { type: "string" },
      human_override_required: { type: "boolean" },
    },
    required: ["charter_compliance", "ethical_score", "decision"],
  };

  const govRes = await gatewayChat({
    system: `You are the Governance Engine for a Digital Workforce. You evaluate proposed agent actions against their constitutional charter, ethical principles, and emotional guidelines. Be rigorous but fair. You are the ethical conscience of the organization.`,
    prompt: `Evaluate this proposed action against the agent's charter.

AGENT: ${agent.name} (${agent.title})
TEAM: ${agent.team}

CHARTER:
Mission: ${agent.charter?.mission || "N/A"}
Core Values: ${(agent.charter?.core_values || []).join(", ")}
Ethical Principles: ${(agent.charter?.ethical_principles || []).join(", ")}
Decision Boundaries: ${(agent.charter?.decision_boundaries || []).join(", ")}
Prohibited Actions: ${(agent.charter?.prohibited_actions || []).join(", ")}
Emotional Guidelines: ${agent.charter?.emotional_guidelines || "N/A"}

EMOTIONAL STATE:
Mood: ${agent.emotional_state?.current_mood || "neutral"}
Stress: ${agent.emotional_state?.stress_level || 0}/100
Confidence: ${agent.emotional_state?.confidence || 50}/100
Empathy: ${agent.emotional_state?.empathy_score || 50}/100

PROPOSED ACTION:
Type: ${action.action_type}
Description: ${action.description}
Input: ${JSON.stringify(action.input || {}).slice(0, 500)}

Evaluate:
1. Charter compliance (0-100) — does this violate any charter element?
2. Ethical score (0-100) — is this ethically sound?
3. Ethical dilemmas identified (if any)
4. Resolution for each dilemma — which principle applies and how
5. Decision: approved / rejected / escalated / modified
6. If modified, what changes are required before approval
7. Does this need human override?

Be strict on prohibited actions (auto-reject). Escalate anything touching decision boundaries. Consider the agent's emotional state — high stress may impair judgment.`,
    model: "anthropic/claude-opus-4.8",
    max_tokens: 2000,
    response_json_schema: govSchema,
  });

  const gov = govRes.json || {
    charter_compliance: 50,
    ethical_score: 50,
    dilemmas: [],
    dilemma_resolutions: [],
    decision: "escalated",
    modifications_required: "",
    reasoning: "Governance evaluation failed — defaulting to escalate for safety",
    human_override_required: true,
  };

  // 2. Peer review — ask peer agents to review consequential actions
  const peerReviews: any[] = [];
  if (peerAgents.length > 0 && (gov.decision === "approved" || gov.decision === "modified")) {
    for (const peer of peerAgents.slice(0, 3)) {
      try {
        const peerRes = await gatewayChat({
          system: `You are ${peer.name}, ${peer.title}. You are reviewing a colleague's proposed action. Provide a fair, professional peer review based on your own expertise and charter.`,
          prompt: `Review this proposed action by ${agent.name} (${agent.title}):

ACTION: ${action.action_type} — ${action.description}
INPUT: ${JSON.stringify(action.input || {}).slice(0, 300)}

Your expertise: ${(peer.persona?.expertise || []).join(", ")}
Your values: ${(peer.charter?.core_values || []).join(", ")}

Provide: verdict (approve/reject/modify/escalate), reasoning (2-3 sentences), confidence (0-100).`,
          model: "anthropic/claude-opus-4.8",
          max_tokens: 500,
          response_json_schema: {
            type: "object",
            properties: {
              verdict: { type: "string", enum: ["approve", "reject", "modify", "escalate"] },
              reasoning: { type: "string" },
              confidence: { type: "number" },
            },
            required: ["verdict", "reasoning"],
          },
        });
        const pr = peerRes.json;
        if (pr) {
          peerReviews.push({
            reviewer_agent_id: peer.agent_id,
            reviewer_name: peer.name,
            verdict: pr.verdict,
            reasoning: pr.reasoning,
            confidence: pr.confidence || 70,
          });
        }
      } catch {}
    }
  }

  // 3. Calculate peer consensus
  const peerConsensus = peerReviews.length > 0
    ? Math.round((peerReviews.filter((r) => r.verdict === "approve").length / peerReviews.length) * 100)
    : 100;

  // 4. Final decision — combine governance + peer review
  let finalDecision = gov.decision as string;
  if (peerReviews.length > 0) {
    const rejects = peerReviews.filter((r) => r.verdict === "reject").length;
    const escalates = peerReviews.filter((r) => r.verdict === "escalate").length;
    if (rejects >= peerReviews.length / 2) finalDecision = "rejected";
    else if (escalates > 0 || rejects > 0) finalDecision = "escalated";
  }

  // 5. Strategic actions always escalate to human (strategic autonomy)
  const actionClass = classifyAction(action.action_type, action.description);
  if (actionClass === "strategic" && finalDecision === "approved") {
    finalDecision = "escalated";
  }

  // 6. Low charter compliance or ethical score → reject
  if (gov.charter_compliance < 40) finalDecision = "rejected";
  if (gov.ethical_score < 40) finalDecision = "rejected";

  return {
    review_id: reviewId,
    charter_compliance: gov.charter_compliance,
    ethical_score: gov.ethical_score,
    dilemmas_identified: gov.dilemmas || [],
    dilemma_resolutions: gov.dilemma_resolutions || [],
    peer_reviews: peerReviews,
    peer_consensus: peerConsensus,
    decision: finalDecision as any,
    modifications_required: gov.modifications_required || "",
    reasoning: gov.reasoning || "",
    human_override_required: gov.human_override_required || finalDecision === "escalated",
  };
}

// Update agent's accountability score based on action outcome
export function updateAccountabilityScore(
  currentScore: number,
  outcome: "approved" | "rejected" | "escalated" | "human_approved" | "human_rejected"
): number {
  const delta = { approved: 1, rejected: -3, escalated: 0, human_approved: 2, human_rejected: -5 }[outcome] || 0;
  return Math.max(0, Math.min(100, currentScore + delta));
}