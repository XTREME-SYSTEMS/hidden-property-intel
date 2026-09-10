import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { gatewayChat } from "../../shared/aiGateway.ts";
import { securitySystemPrompt, fenceExternalContent } from "../../shared/security.ts";

/**
 * planInvestigation — Information-Gain Planner (Phase 9).
 * One of the highest-value components. The investigation engine must
 * stop treating every unknown equally.
 *
 * For every investigation, identifies:
 *   KNOWN / UNKNOWN / UNCERTAIN / CONTRADICTORY / STALE
 * Then estimates:
 *   EXPECTED INFORMATION GAIN + DECISION IMPACT + CONFIDENCE IMPROVEMENT
 *   + ACQUISITION COST + TIME + RISK
 * Then determines:
 *   INVESTIGATE / DEFER / IGNORE / MONITOR
 *
 * This is the beginning of autonomous investigative reasoning.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const db = base44.asServiceRole;

  const { question, target_ref, known_facts, current_confidence, decision_threshold } = body;
  if (!question) return Response.json({ error: 'question required' }, { status: 400 });

  // Gather existing evidence for this target
  let existingEvidence: any[] = [];
  if (target_ref) {
    existingEvidence = await db.entities.Evidence.filter({ entity_ref: target_ref }, "-last_verified", 50).catch(() => []);
  }

  // Ask the LLM to classify what we know vs don't know, and rank by information gain
  const planSchema = {
    type: 'object',
    properties: {
      knowledge_state: {
        type: 'object',
        properties: {
          known: { type: 'array', items: { type: 'string' } },
          unknown: { type: 'array', items: { type: 'string' } },
          uncertain: { type: 'array', items: { type: 'string' } },
          contradictory: { type: 'array', items: { type: 'string' } },
          stale: { type: 'array', items: { type: 'string' } },
        },
      },
      acquisition_plan: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            unknown: { type: 'string' },
            action: { type: 'string', description: 'web_search, lookup_property, resolve_entity, verify, score' },
            query: { type: 'string' },
            expected_information_gain: { type: 'number', description: '0-100' },
            decision_impact: { type: 'number', description: '0-100 how much this affects a real estate decision' },
            confidence_improvement: { type: 'number', description: '0-100 expected confidence delta' },
            acquisition_cost: { type: 'number', description: '0-100 relative cost' },
            time_estimate_seconds: { type: 'number' },
            risk: { type: 'string', enum: ['low', 'medium', 'high'] },
            recommendation: { type: 'string', enum: ['investigate', 'defer', 'ignore', 'monitor'] },
            rationale: { type: 'string' },
          },
        },
      },
      overall_strategy: { type: 'string' },
      stop_conditions: { type: 'array', items: { type: 'string' } },
    },
    required: ['knowledge_state', 'acquisition_plan', 'overall_strategy'],
  };

  const evidenceContext = existingEvidence.length > 0
    ? fenceExternalContent('existing_evidence', existingEvidence.map((e: any) => `[${e.classification} conf=${e.confidence}] ${e.claim}`).join('\n'))
    : 'No existing evidence.';

  const res = await gatewayChat({
    system: securitySystemPrompt('information-gain planner'),
    prompt: `You are planning an investigation for real estate intelligence.

QUESTION: ${question}
TARGET: ${target_ref || 'unspecified'}
CURRENT CONFIDENCE: ${current_confidence || 'unknown'}%
DECISION THRESHOLD: ${decision_threshold || 75}% (confidence needed to make a decision)

EXISTING EVIDENCE:
${evidenceContext}

KNOWN FACTS PROVIDED:
${(known_facts || []).map((f: string) => `- ${f}`).join('\n') || 'None provided'}

Your task:
1. Classify the current knowledge state into: known, unknown, uncertain, contradictory, stale.
2. For each unknown/uncertain item, estimate the expected information gain, decision impact, confidence improvement, acquisition cost, time, and risk.
3. Recommend: investigate (high value), defer (wait for more context), ignore (low value), or monitor (watch for changes).
4. Rank the acquisition plan by (expected_information_gain × decision_impact) / (acquisition_cost + 1).
5. Define stop conditions (when to stop investigating).

Prioritize unknowns that have HIGH DECISION IMPACT — e.g., if a property has a high opportunity score but ownership is uncertain, ownership investigation has the highest information value because without it, no deal can proceed.`,
    model: 'anthropic/claude-opus-4.8',
    max_tokens: 4000,
    response_json_schema: planSchema,
  });

  const plan = res.json;

  if (!plan) {
    return Response.json({ error: 'Failed to generate plan', raw: res.text.slice(0, 500) }, { status: 500 });
  }

  // Sort acquisition plan by value score (gain × impact) / (cost + 1)
  if (plan.acquisition_plan) {
    plan.acquisition_plan.sort((a: any, b: any) => {
      const scoreA = (a.expected_information_gain * a.decision_impact) / ((a.acquisition_cost || 1) + 1);
      const scoreB = (b.expected_information_gain * b.decision_impact) / ((b.acquisition_cost || 1) + 1);
      return scoreB - scoreA;
    });
  }

  return Response.json({
    source: 'information_gain_planner',
    question,
    target_ref,
    existing_evidence_count: existingEvidence.length,
    plan,
  });
}