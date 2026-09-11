import { createClientFromRequest } from "npm:@base44/sdk@0.8.46";
import { DIGITAL_WORKFORCE_ROSTER } from "../../shared/digitalWorkforceRoster.ts";

/**
 * seedDigitalWorkforce — seeds or updates the 8 digital team members.
 * Idempotent: if an agent already exists (by agent_id), it updates the
 * persona/charter while preserving emotional state, accountability, and stats.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

    const db = base44.asServiceRole;
    const results: any[] = [];

    for (const agentDef of DIGITAL_WORKFORCE_ROSTER) {
      const existing = await db.entities.DigitalAgent.filter({ agent_id: agentDef.agent_id }).catch(() => []);

    const baseData = {
      agent_id: agentDef.agent_id,
      name: agentDef.name,
      role: agentDef.role,
      team: agentDef.team,
      title: agentDef.title,
      persona: agentDef.persona,
      charter: agentDef.charter,
      autonomy_level: agentDef.autonomy_level,
      ai_model: agentDef.ai_model,
      capabilities: {
        web_browsing: true,
        shadow_scraping: true,
        ai_reasoning: true,
        graph_query: true,
        rag_search: true,
        can_escalate_to_human: true,
      },
      status: "active",
    };

    if (existing.length > 0) {
      const updated = await db.entities.DigitalAgent.update(existing[0].id, {
        ...baseData,
        emotional_state: existing[0].emotional_state || {
          current_mood: "focused",
          stress_level: 20,
          confidence: 75,
          empathy_score: 70,
          last_updated: new Date().toISOString(),
        },
      });
      results.push({ agent_id: agentDef.agent_id, name: agentDef.name, team: agentDef.team, status: "updated", id: updated.id });
    } else {
      const created = await db.entities.DigitalAgent.create({
        ...baseData,
        emotional_state: {
          current_mood: "focused",
          stress_level: 20,
          confidence: 75,
          empathy_score: 70,
          last_updated: new Date().toISOString(),
        },
        accountability_score: 75,
        actions_taken: 0,
        actions_approved: 0,
        actions_rejected: 0,
        actions_escalated: 0,
        performance: {
          tasks_completed: 0,
          avg_decision_time_ms: 0,
          success_rate: 0,
          peer_reviews_given: 0,
          peer_reviews_received: 0,
          human_overrides: 0,
        },
      });
      results.push({ agent_id: agentDef.agent_id, name: agentDef.name, team: agentDef.team, status: "created", id: created.id });
    }
  }

  return Response.json({
    source: "digital_workforce_seeder",
    total: results.length,
    created: results.filter((r) => r.status === "created").length,
    updated: results.filter((r) => r.status === "updated").length,
    agents: results,
  });
  } catch (error) {
    console.error("seedDigitalWorkforce error", error);
    return Response.json({ error: error.message, stack: error.stack?.slice(0, 500) }, { status: 500 });
  }
}