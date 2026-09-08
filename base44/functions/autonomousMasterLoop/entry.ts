import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { gatewayChat, isGatewayConfigured } from "../../shared/aiGateway.ts";

// Autonomous Master Loop — the unified self-reflection engine for Hidden Property Intel.
// Adapted from Vision Cortex to use the Vercel AI Gateway and this app's existing entities.
//
// 4 PHASES (simplified for production reliability):
// 1. FORENSIC AUDIT — scan properties, enrichment, campaigns, system health
// 2. SELF-REFLECTION — AI identifies top 3 priorities needing fixes
// 3. ARCHITECT — AI designs action plans for each priority
// 4. ACT — execute actions (trigger enrichment, heal gaps, log findings)

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Admin required" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || "run";
    const sr = base44.asServiceRole.entities;

    // ─── STATUS — check last cycle ───
    if (action === "status") {
      const cycles = await sr.AutonomousCycle.list("-started_at", 5);
      return Response.json({
        cycles: cycles.map((c: any) => ({
          cycle_id: c.cycle_id,
          status: c.status,
          phase: c.phase,
          started_at: c.started_at,
          completed_at: c.completed_at,
          items_identified: c.items_identified,
          health_after: c.health_after,
        })),
        ai_gateway: { configured: isGatewayConfigured() },
      });
    }

    // ─── RUN — execute a full autonomous cycle ───
    if (action === "run") {
      const cycleId = `CYCLE-${Date.now()}`;
      const startedAt = new Date().toISOString();

      // Guard: skip if a cycle is already running
      const recentCycles = await sr.AutonomousCycle.list("-started_at", 1).catch(() => []);
      const lastCycle = recentCycles?.[0];
      if (lastCycle?.status === "running") {
        return Response.json({ skipped: true, reason: "Cycle already running", last_cycle_id: lastCycle.cycle_id });
      }

      // Create cycle record
      const cycle = await sr.AutonomousCycle.create({
        cycle_id: cycleId,
        status: "running",
        phase: "forensic_audit",
        started_at: startedAt,
        trigger_source: body.trigger_source || "manual",
      });

      const report: any = {
        cycle_id: cycleId,
        timestamp: startedAt,
        phases: {},
        items_audited: 0,
        items_identified: 0,
        items_architected: 0,
        items_implemented: 0,
        health_before: 0,
        health_after: 0,
        errors: [],
      };

      try {
        // ── PHASE 1: FORENSIC AUDIT ──
        await sr.AutonomousCycle.update(cycle.id, { phase: "forensic_audit" });

        const [properties, enrichmentReport, campaigns, conversations, systemHealth] = await Promise.all([
          sr.Property.list("-updated_date", 200),
          base44.functions.invoke("validateEnrichment", {}).catch(() => ({ data: {} })),
          sr.Campaign.list("-created_date", 20).catch(() => []),
          sr.Conversation.list("-created_date", 20).catch(() => []),
          sr.SystemHealth.list("-run_at", 5).catch(() => []),
        ]);

        const enrichmentData = (enrichmentReport as any)?.data || {};
        const healthScore = enrichmentData.system_completeness || 0;
        report.health_before = healthScore;

        const auditData = {
          total_properties: properties.length,
          enrichment_completeness: healthScore,
          enrichment_categories: enrichmentData.category_scores || {},
          auto_heal_candidates: enrichmentData.auto_heal_candidates || 0,
          active_campaigns: campaigns.filter((c: any) => c.status === "running").length,
          active_conversations: conversations.filter((c: any) => c.status === "active" || c.status === "waiting_reply").length,
          system_health: systemHealth[0]?.overall_status || "unknown",
          weakest_categories: enrichmentData.weakest_categories || [],
        };

        report.items_audited = properties.length + campaigns.length + conversations.length;
        report.phases.forensic_audit = auditData;

        // ── PHASE 2: SELF-REFLECTION — AI identifies top 3 priorities ──
        await sr.AutonomousCycle.update(cycle.id, { phase: "self_reflection" });

        const reflectionPrompt = `You are the Hidden Property Intel Autonomous Self-Reflection Engine. Analyze this system audit and identify the top 3 priorities needing immediate action.

System Audit:
${JSON.stringify(auditData, null, 2)}

Return JSON with an array of 3 priorities:
{
  "priorities": [
    {
      "title": "short title",
      "severity": "critical|high|medium",
      "category": "enrichment|outreach|data_quality|system_health",
      "description": "what's wrong",
      "recommended_action": "what to do about it",
      "estimated_impact": "how much this will improve the system"
    }
  ],
  "overall_assessment": "brief summary of system state"
}`;

        let reflection;
        if (isGatewayConfigured()) {
          const gwResult = await gatewayChat({
            prompt: reflectionPrompt,
            model: "anthropic/claude-sonnet-5",
            temperature: 0.3,
            response_json_schema: {
              type: "object",
              properties: {
                priorities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      severity: { type: "string" },
                      category: { type: "string" },
                      description: { type: "string" },
                      recommended_action: { type: "string" },
                      estimated_impact: { type: "string" },
                    },
                  },
                },
                overall_assessment: { type: "string" },
              },
            },
          });
          try { reflection = JSON.parse(gwResult.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()); } catch { reflection = { priorities: [], overall_assessment: gwResult.text }; }
        } else {
          reflection = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: reflectionPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                priorities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      severity: { type: "string" },
                      category: { type: "string" },
                      description: { type: "string" },
                      recommended_action: { type: "string" },
                      estimated_impact: { type: "string" },
                    },
                  },
                },
                overall_assessment: { type: "string" },
              },
            },
          });
        }

        report.phases.self_reflection = reflection;
        report.items_identified = reflection?.priorities?.length || 0;

        // ── PHASE 3: ARCHITECT — design action plans ──
        await sr.AutonomousCycle.update(cycle.id, { phase: "architect" });

        const archPrompt = `You are the Hidden Property Intel Autonomous Architect. For each priority identified, design a concrete action plan.

Priorities:
${JSON.stringify(reflection?.priorities || [], null, 2)}

Return JSON:
{
  "action_plans": [
    {
      "priority_title": "matching title",
      "steps": ["step 1", "step 2", ...],
      "function_to_call": "which backend function to invoke (e.g. runMasterEnrichment, validateEnrichment, xtremeComms)",
      "function_params": { "key": "value" },
      "expected_outcome": "what should happen"
    }
  ]
}`;

        let archResult;
        if (isGatewayConfigured()) {
          const gwResult = await gatewayChat({
            prompt: archPrompt,
            model: "anthropic/claude-sonnet-5",
            temperature: 0.2,
            response_json_schema: {
              type: "object",
              properties: {
                action_plans: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      priority_title: { type: "string" },
                      steps: { type: "array", items: { type: "string" } },
                      function_to_call: { type: "string" },
                      function_params: { type: "object" },
                      expected_outcome: { type: "string" },
                    },
                  },
                },
              },
            },
          });
          try { archResult = JSON.parse(gwResult.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()); } catch { archResult = { action_plans: [] }; }
        } else {
          archResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: archPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                action_plans: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      priority_title: { type: "string" },
                      steps: { type: "array", items: { type: "string" } },
                      function_to_call: { type: "string" },
                      function_params: { type: "object" },
                      expected_outcome: { type: "string" },
                    },
                  },
                },
              },
            },
          });
        }

        report.phases.architect = archResult;
        report.items_architected = archResult?.action_plans?.length || 0;

        // ── PHASE 4: ACT — execute safe actions ──
        await sr.AutonomousCycle.update(cycle.id, { phase: "implement" });

        const actions: string[] = [];
        const safeFunctions = ["runMasterEnrichment", "validateEnrichment", "xtremeComms"];

        for (const plan of archResult?.action_plans || []) {
          const fnName = plan.function_to_call;
          if (!safeFunctions.includes(fnName)) {
            actions.push(`Skipped unsafe function: ${fnName}`);
            continue;
          }
          try {
            const fnResult = await base44.functions.invoke(fnName, plan.function_params || {});
            actions.push(`Executed ${fnName}: ${(fnResult as any)?.data ? "success" : "completed"}`);
            report.items_implemented++;
          } catch (e) {
            actions.push(`Failed ${fnName}: ${e.message}`);
            report.errors.push(`${fnName}: ${e.message}`);
          }
        }

        report.phases.act = { actions_taken: actions };

        // Re-check health after actions
        const postAudit = await base44.functions.invoke("validateEnrichment", {}).catch(() => ({ data: {} }));
        report.health_after = (postAudit as any)?.data?.system_completeness || report.health_before;

        // ── COMPLETE ──
        await sr.AutonomousCycle.update(cycle.id, {
          status: "complete",
          phase: "done",
          completed_at: new Date().toISOString(),
          items_audited: report.items_audited,
          items_identified: report.items_identified,
          items_architected: report.items_architected,
          items_implemented: report.items_implemented,
          health_before: report.health_before,
          health_after: report.health_after,
          report,
          errors: report.errors,
        });

        // Log to ShadowReport for the command center
        await sr.ShadowReport.create({
          run_at: new Date().toISOString(),
          type: "orchestrator",
          overall_score: report.health_after,
          dimension_scores: {
            data_acquisition: report.health_after,
            property_enrichment: report.health_after,
            deal_pipeline: 0,
            outreach_engine: 0,
            system_intelligence: 0,
            security_compliance: 0,
            seo_visibility: 0,
            financial_health: 0,
          },
          audit_findings: (reflection?.priorities || []).map((p: any) => ({
            dimension: p.category,
            severity: p.severity,
            finding: p.description,
            action: p.recommended_action,
            auto_healed: false,
          })),
          actions_taken: actions,
          morning_brief: reflection?.overall_assessment || "Autonomous cycle completed",
        });

        return Response.json({ cycle_id: cycleId, report });
      } catch (cycleError) {
        await sr.AutonomousCycle.update(cycle.id, {
          status: "failed",
          completed_at: new Date().toISOString(),
          errors: [cycleError.message],
        });
        report.errors.push(cycleError.message);
        return Response.json({ cycle_id: cycleId, error: cycleError.message, report }, { status: 500 });
      }
    }

    return Response.json({ error: "Unknown action. Use: status, run" }, { status: 400 });
  } catch (error) {
    console.error("autonomousMasterLoop error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}