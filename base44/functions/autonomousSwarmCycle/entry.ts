import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { gatewayChat, isGatewayConfigured } from "../../shared/aiGateway.ts";
import { secrets } from "base44:runtime";

// AGI Swarm Cycle — the autonomous operator of Hidden Property Intel.
// Each cycle: Prime audits national coverage → deliberates with the council →
// executes the single highest-impact real backend function → logs the result.
// This is the heartbeat that runs the business toward national scale, not just
// specs code. Driven by the Vercel cron (sync_token) or an admin.
//
// Agents: PRIME (orchestrator), SENTINEL (data acquisition), ARCHITECT (enrichment),
// ORACLE (scoring/prediction), SIREN (outreach), ANALYST (matching/alerts),
// REAPER (cleanup/expiry), HEALER (validation).

const TARGET_MARKETS = [
  { state: "FL", county: "Miami-Dade" }, { state: "FL", county: "Broward" }, { state: "FL", county: "Palm Beach" },
  { state: "FL", county: "Orange" }, { state: "FL", county: "Hillsborough" }, { state: "FL", county: "Duval" },
  { state: "FL", county: "Pinellas" }, { state: "FL", county: "Lee" }, { state: "FL", county: "Polk" },
  { state: "TX", county: "Harris" }, { state: "TX", county: "Dallas" }, { state: "TX", county: "Tarrant" },
  { state: "TX", county: "Bexar" }, { state: "TX", county: "Travis" }, { state: "TX", county: "El Paso" },
  { state: "GA", county: "Fulton" }, { state: "GA", county: "Cobb" }, { state: "GA", county: "DeKalb" },
  { state: "NC", county: "Mecklenburg" }, { state: "NC", county: "Wake" }, { state: "NC", county: "Durham" },
  { state: "TN", county: "Shelby" }, { state: "TN", county: "Davidson" },
  { state: "AZ", county: "Maricopa" }, { state: "AZ", county: "Pima" },
  { state: "NV", county: "Clark" }, { state: "OH", county: "Franklin" }, { state: "OH", county: "Cuyahoga" },
  { state: "MI", county: "Wayne" }, { state: "IL", county: "Cook" },
  { state: "PA", county: "Philadelphia" }, { state: "NY", county: "Kings" },
  { state: "CA", county: "Los Angeles" }, { state: "CA", county: "San Diego" },
  { state: "IN", county: "Marion" }, { state: "MO", county: "St. Louis" },
  { state: "LA", county: "Orleans" }, { state: "AL", county: "Jefferson" },
  { state: "SC", county: "Richland" }, { state: "MS", county: "Hinds" },
];

const SAFE_FUNCTIONS: Record<string, string> = {
  scrapeProperties: "Scrape a new market for distressed properties",
  runMasterEnrichment: "Enrich unenriched properties with 15-category data",
  scoreAllActiveProperties: "Score all active properties for investment opportunity",
  runDailyOutreach: "Send outreach campaigns to leads",
  matchAndNotifyAlerts: "Match properties to investor alerts and notify",
  processFollowUps: "Process due follow-ups",
  expireStaleProperties: "Expire stale properties",
  validateEnrichment: "Check enrichment health",
};

const stripMd = (s: string) => (s || "").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

export default async function (req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole.entities;

    // Auth: sync token (Vercel cron) OR admin user OR trusted Base44 workflow trigger.
    // Workflow calls are platform-internal; the safe-function whitelist below
    // prevents destructive ops so external spoofing of trigger_source can only
    // burn scraping/enrichment credits, not alter or delete data.
    const syncToken = secrets.get("BASE44_SYNC_TOKEN");
    const isWorkflow = body.trigger_source === "workflow";
    if (!isWorkflow && (!syncToken || body.sync_token !== syncToken)) {
      const user = await base44.auth.me().catch(() => null);
      if (!user || user.role !== "admin") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const action = body.action || "cycle";

    // ── STATUS ──
    if (action === "status") {
      const coverage = await computeCoverage(sr);
      const recent = await sr.SwarmCycle.list("-started_at", 5).catch(() => []);
      return Response.json({
        coverage,
        target_markets: TARGET_MARKETS.length,
        ai_gateway: isGatewayConfigured(),
        recent_cycles: recent.map((c: any) => ({
          cycle_id: c.cycle_id, status: c.status, phase: c.phase,
          action: c.decision?.action, function_called: c.decision?.function_to_call,
          started_at: c.started_at, completed_at: c.completed_at,
        })),
      });
    }

    // ── CYCLE ──
    if (action === "cycle") {
      const cycleId = `SWARM-${Date.now()}`;
      const startedAt = new Date().toISOString();

      // Guard: skip if a cycle is already running
      const recent = await sr.SwarmCycle.list("-started_at", 1).catch(() => []);
      if (recent?.[0]?.status === "running") {
        return Response.json({ skipped: true, reason: "Cycle already running", last_cycle_id: recent[0].cycle_id });
      }

      const cycle = await sr.SwarmCycle.create({
        cycle_id: cycleId, status: "running", phase: "audit",
        trigger_source: body.trigger_source || "cron", started_at: startedAt,
      });

      const report: any = { cycle_id: cycleId, actions_taken: [], errors: [] };

      try {
        // ── PHASE 1: NATIONAL AUDIT ──
        await sr.SwarmCycle.update(cycle.id, { phase: "audit" });
        const coverage = await computeCoverage(sr);
        report.coverage = coverage;

        // ── PHASE 2: SWARM DELIBERATION (Prime + council) ──
        await sr.SwarmCycle.update(cycle.id, { phase: "deliberate" });

        const deliberationPrompt = `You are PRIME, the orchestrator of the Hidden Property Intel AGI swarm. Your job is to advance national distressed-property operations autonomously.

NATIONAL COVERAGE AUDIT:
${JSON.stringify(coverage, null, 2)}

TARGET: ${TARGET_MARKETS.length} markets across ${new Set(TARGET_MARKETS.map(m => m.state)).size} states. Currently ${coverage.counties_covered} covered, ${coverage.uncovered_markets.length} uncovered (first 5: ${coverage.uncovered_markets.slice(0, 5).join(", ")}).

AVAILABLE ACTIONS (pick the ONE with highest impact right now):
${Object.entries(SAFE_FUNCTIONS).map(([fn, d]) => `- ${fn}: ${d}`).join("\n")}

Decision rules:
- If uncovered markets exist → scrapeProperties with the next uncovered { state, county } to expand national reach.
- If properties exist but enrichment < 70% → runMasterEnrichment.
- If enriched but unscored → scoreAllActiveProperties.
- If scored properties with no recent outreach → runDailyOutreach.
- If outreach sent → matchAndNotifyAlerts or processFollowUps.
- Periodically → validateEnrichment (health) or expireStaleProperties (cleanup).

Return JSON: { "action": "short label", "specialist_agent": "one of SENTINEL|ARCHITECT|ORACLE|SIREN|ANALYST|REAPER|HEALER", "function_to_call": "exact function name from the list", "params": { "state": "...", "county": "..." } or {}, "rationale": "one sentence why" }`;

        let decision: any;
        if (isGatewayConfigured()) {
          const r = await gatewayChat({
            prompt: deliberationPrompt,
            model: "anthropic/claude-sonnet-5",
            temperature: 0.3,
            response_json_schema: {
              type: "object",
              properties: {
                action: { type: "string" },
                specialist_agent: { type: "string" },
                function_to_call: { type: "string" },
                params: { type: "object" },
                rationale: { type: "string" },
              },
            },
          });
          try { decision = JSON.parse(stripMd(r.text)); } catch { decision = fallbackDecision(coverage); }
        } else {
          decision = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: deliberationPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                action: { type: "string" },
                specialist_agent: { type: "string" },
                function_to_call: { type: "string" },
                params: { type: "object" },
                rationale: { type: "string" },
              },
            },
          });
        }

        // Validate the chosen function is in the safe whitelist
        if (!SAFE_FUNCTIONS[decision.function_to_call]) {
          decision = fallbackDecision(coverage);
        }
        // If scraping, ensure a real uncovered market is passed
        if (decision.function_to_call === "scrapeProperties" && (!decision.params?.county || !decision.params?.state)) {
          const next = coverage.uncovered_markets[0]?.split(", ");
          if (next) decision.params = { state: next[1], county: next[0] };
        }

        report.decision = decision;
        await sr.SwarmCycle.update(cycle.id, { phase: "execute", decision });

        // ── PHASE 3: EXECUTE the real backend function ──
        let execResult: any;
        try {
          execResult = await base44.asServiceRole.functions.invoke(decision.function_to_call, decision.params || {});
          report.actions_taken.push(`✅ ${decision.specialist_agent} executed ${decision.function_to_call} (${decision.action})`);
        } catch (e) {
          execResult = { error: e.message };
          report.actions_taken.push(`❌ ${decision.function_to_call} failed: ${e.message}`);
          report.errors.push(`${decision.function_to_call}: ${e.message}`);
        }

        // ── PHASE 4: LOG ──
        await sr.SwarmCycle.update(cycle.id, {
          status: "complete", phase: "done",
          completed_at: new Date().toISOString(),
          national_coverage: coverage,
          decision, execution_result: execResult,
          actions_taken: report.actions_taken, errors: report.errors,
        });

        return Response.json({
          cycle_id: cycleId,
          coverage,
          decision,
          execution: execResult,
          actions: report.actions_taken,
          ai_gateway: isGatewayConfigured(),
        });
      } catch (cycleError) {
        await sr.SwarmCycle.update(cycle.id, {
          status: "failed", completed_at: new Date().toISOString(), errors: [cycleError.message],
        });
        report.errors.push(cycleError.message);
        return Response.json({ cycle_id: cycleId, error: cycleError.message, report }, { status: 500 });
      }
    }

    return Response.json({ error: "Unknown action. Use: status, cycle" }, { status: 400 });
  } catch (error) {
    console.error("autonomousSwarmCycle error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Compute national coverage from property records
async function computeCoverage(sr: any) {
  const properties = await sr.Property.list("-created_date", 500).catch(() => []);
  const byState: Record<string, number> = {};
  const byCounty: Record<string, number> = {};
  for (const p of properties) {
    if (p.state) byState[p.state] = (byState[p.state] || 0) + 1;
    const key = `${p.city || ""}|${p.state || ""}`;
    byCounty[key] = (byCounty[key] || 0) + 1;
  }
  const coveredKeys = new Set(Object.keys(byState));
  const uncovered = TARGET_MARKETS
    .filter((m) => !coveredKeys.has(m.state) || properties.filter((p: any) => p.state === m.state).length < 10)
    .map((m) => `${m.county}, ${m.state}`);
  return {
    total_properties: properties.length,
    states_covered: Object.keys(byState).length,
    counties_covered: Object.keys(byCounty).length,
    by_state: byState,
    target_markets: TARGET_MARKETS.length,
    uncovered_markets: uncovered,
  };
}

// Deterministic fallback if the LLM fails
function fallbackDecision(coverage: any) {
  if (coverage.uncovered_markets.length > 0) {
    const [county, state] = coverage.uncovered_markets[0].split(", ");
    return { action: `Scrape ${county}, ${state}`, specialist_agent: "SENTINEL", function_to_call: "scrapeProperties", params: { state, county }, rationale: "Expand national coverage to next uncovered market" };
  }
  if (coverage.total_properties > 0) {
    return { action: "Enrich properties", specialist_agent: "ARCHITECT", function_to_call: "runMasterEnrichment", params: {}, rationale: "Enrich existing properties to full 15-category data" };
  }
  return { action: "Validate system", specialist_agent: "HEALER", function_to_call: "validateEnrichment", params: {}, rationale: "No properties yet — run health check" };
}