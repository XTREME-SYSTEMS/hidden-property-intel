import { createClientFromRequest } from "npm:@base44/sdk@0.8.46";
import { agentThink as runAgentThink, updateEmotionalState } from "../../shared/digitalAgent.ts";
import { evaluateAction, classifyAction, updateAccountabilityScore } from "../../shared/governance.ts";

/**
 * agentThink — the Digital Workforce execution engine.
 *
 * The full "think → govern → act → learn" loop:
 * 1. LOAD the agent (persona + charter + emotional state)
 * 2. THINK — agent reasons about the task (with shadow research if needed)
 * 3. LOG the think action
 * 4. GOVERN — evaluate the proposed action (charter + ethics + peer review)
 * 5. STORE the governance review
 * 6. DECIDE — auto-approve routine, escalate strategic to human
 * 7. LEARN — update emotional state + accountability score
 *
 * Strategic autonomy: routine actions auto-execute, strategic actions
 * escalate to human approval.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { agent_id, instruction, context, requires_research, research_queries } = body;
  if (!agent_id || !instruction) return Response.json({ error: "agent_id and instruction required" }, { status: 400 });

  const db = base44.asServiceRole;
  const started = Date.now();

  // 1. Load the agent
  const agents = await db.entities.DigitalAgent.filter({ agent_id }).catch(() => []);
  if (!agents.length) return Response.json({ error: "Agent not found — run seedDigitalWorkforce first" }, { status: 404 });
  const agent = agents[0];

  if (agent.status !== "active") return Response.json({ error: `Agent is ${agent.status}, not active` }, { status: 400 });

  // 2. THINK — agent reasons about the task
  const thinkResult = await runAgentThink(agent, {
    task_id: `task-${crypto.randomUUID()}`,
    agent_id,
    instruction,
    context,
    requires_research,
    research_queries,
  });

  // 3. Log the think action
  const thinkAction = await db.entities.AgentAction.create({
    action_id: `act-${crypto.randomUUID()}`,
    agent_id: agent.agent_id,
    agent_name: agent.name,
    agent_role: agent.role,
    action_type: thinkResult.proposed_action.action_type,
    description: thinkResult.proposed_action.description,
    reasoning: thinkResult.reasoning,
    input: thinkResult.proposed_action.input || {},
    output: {},
    governance_status: "pending",
    autonomy_level: agent.autonomy_level,
    emotional_context: `Mood: ${thinkResult.emotional_response?.mood}, Confidence: ${thinkResult.emotional_response?.confidence}`,
    ethical_considerations: thinkResult.emotional_response?.ethical_considerations || "",
    ai_model_used: agent.ai_model,
    sources: thinkResult.sources,
    timestamp: new Date().toISOString(),
  });

  // 4. GOVERN — evaluate the proposed action
  const peerAgents = (await db.entities.DigitalAgent.filter({ team: agent.team, status: "active" }).catch(() => []))
    .filter((a: any) => a.agent_id !== agent.agent_id)
    .slice(0, 3);

  const governance = await evaluateAction({ agent, action: thinkResult.proposed_action, peerAgents });

  // 5. Store the governance review
  const review = await db.entities.GovernanceReview.create({
    review_id: governance.review_id,
    agent_id: agent.agent_id,
    action_id: thinkAction.id,
    action_description: thinkResult.proposed_action.description,
    charter_compliance: governance.charter_compliance,
    ethical_score: governance.ethical_score,
    dilemmas_identified: governance.dilemmas_identified,
    dilemma_resolutions: governance.dilemma_resolutions,
    peer_reviews: governance.peer_reviews,
    peer_consensus: governance.peer_consensus,
    decision: governance.decision,
    modifications_required: governance.modifications_required,
    reasoning: governance.reasoning,
    human_override_required: governance.human_override_required,
    timestamp: new Date().toISOString(),
  });

  // 6. Update the action with governance result
  const actionClass = classifyAction(thinkResult.proposed_action.action_type, thinkResult.proposed_action.description);
  const governanceStatus = governance.decision === "approved" && actionClass === "routine" ? "auto_approved" : governance.decision;

  await db.entities.AgentAction.update(thinkAction.id, {
    governance_status: governanceStatus,
    governance_review_id: review.id,
    charter_compliance: governance.charter_compliance,
    duration_ms: Date.now() - started,
  });

  // 7. LEARN — update emotional state + accountability score
  const valence = governance.decision === "approved" || governance.decision === "auto_approved" ? "positive" : governance.decision === "rejected" ? "negative" : "neutral";
  const newEmotionalState = updateEmotionalState(agent, { type: governance.decision, valence, intensity: 5 });
  const newAccountability = updateAccountabilityScore(agent.accountability_score || 75, governance.decision as any);

  await db.entities.DigitalAgent.update(agent.id, {
    emotional_state: newEmotionalState,
    accountability_score: newAccountability,
    actions_taken: (agent.actions_taken || 0) + 1,
    actions_approved: (agent.actions_approved || 0) + (governance.decision === "approved" || governance.decision === "auto_approved" ? 1 : 0),
    actions_rejected: (agent.actions_rejected || 0) + (governance.decision === "rejected" ? 1 : 0),
    actions_escalated: (agent.actions_escalated || 0) + (governance.decision === "escalated" ? 1 : 0),
    last_active: new Date().toISOString(),
    performance: {
      ...(agent.performance || {}),
      tasks_completed: (agent.performance?.tasks_completed || 0) + 1,
      avg_decision_time_ms: Math.round(
        ((agent.performance?.avg_decision_time_ms || 0) * (agent.actions_taken || 0) + (Date.now() - started)) / ((agent.actions_taken || 0) + 1)
      ),
    },
  });

  return Response.json({
    source: "digital_workforce_engine",
    agent: { agent_id: agent.agent_id, name: agent.name, role: agent.role, team: agent.team },
    think: {
      reasoning: thinkResult.reasoning,
      proposed_action: thinkResult.proposed_action,
      emotional_response: thinkResult.emotional_response,
      sources: thinkResult.sources,
    },
    governance: {
      decision: governance.decision,
      charter_compliance: governance.charter_compliance,
      ethical_score: governance.ethical_score,
      peer_consensus: governance.peer_consensus,
      peer_reviews: governance.peer_reviews,
      dilemmas: governance.dilemmas_identified,
      dilemma_resolutions: governance.dilemma_resolutions,
      human_override_required: governance.human_override_required,
      modifications_required: governance.modifications_required,
      reasoning: governance.reasoning,
    },
    action_id: thinkAction.id,
    governance_review_id: review.id,
    autonomy: { action_class: actionClass, governance_status: governanceStatus },
    duration_ms: Date.now() - started,
  });
}