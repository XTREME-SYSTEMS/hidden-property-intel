/**
 * Vercel cron — the AGI swarm coordinator (property scoring + enrichment).
 * Every 5 min: reads coverage from Base44, decides the highest-impact action
 * (deterministic — zero LLM cost), executes it on Base44 via forced_function
 * (no LLM = zero Base44 credits), and logs the cycle to Supabase.
 *
 * This moves the orchestration brain to your PAID Vercel + Supabase, so Base44
 * integration credits are NOT consumed by the autonomous loop. Set USE_LLM=true
 * to add Vercel AI Gateway deliberation (paid Vercel) for edge cases.
 *
 * Env vars:
 *   BASE44_APP_URL, BASE44_SYNC_TOKEN — Base44 (status + forced execution)
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY — paid Supabase (cycle log)
 *   RAILWAY_SCRAPER_URL, RAILWAY_TOKEN  — paid Railway (scraping)
 *   AI_GATEWAY_API_KEY                 — optional Vercel AI Gateway (USE_LLM=true)
 */
const BASE44_URL = process.env.BASE44_APP_URL || "https://my-property-intel.base44.app";
const SYNC = process.env.BASE44_SYNC_TOKEN;
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const RAILWAY_URL = process.env.RAILWAY_SCRAPER_URL;
const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;
const GW_KEY = process.env.AI_GATEWAY_API_KEY;
const USE_LLM = process.env.USE_LLM === "true";

export default async function handler(req, res) {
  if (!SYNC) return res.status(500).json({ error: "BASE44_SYNC_TOKEN env var not set" });
  const cycleId = `VERCEL-SWARM-${Date.now()}`;
  const startedAt = new Date().toISOString();
  const report = { cycle_id: cycleId, actions: [], errors: [] };

  try {
    // 1. Read coverage from Base44 (free — no LLM)
    const statusRes = await fetch(`${BASE44_URL}/functions/autonomousSwarmCycle`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sync_token: SYNC, action: "status" }),
    });
    const status = await statusRes.json().catch(() => ({}));
    if (status.error) return res.status(500).json({ error: status.error });
    const cov = status.coverage || {};
    report.coverage = cov;

    // 2. Decide (deterministic — zero cost). Priority: enrich > score > scrape > alerts
    let decision = decide(cov);

    // Optional: Vercel AI Gateway deliberation for edge cases (paid Vercel)
    if (USE_LLM && GW_KEY) {
      try { decision = await llmDeliberate(cov, decision); }
      catch (e) { report.errors.push(`LLM deliberation failed: ${e.message}`); }
    }

    // 3. Execute
    let execution = {};
    if (decision.function_to_call === "scrapeProperties" && RAILWAY_URL) {
      // Scrape via Railway (paid Railway)
      const r = await fetch(RAILWAY_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${RAILWAY_TOKEN || ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "scrape", state: decision.params.state, county: decision.params.county, source: "vercel-swarm" }),
      });
      execution = await r.json().catch(() => ({ railway_status: r.status }));
      report.actions.push(`🚂 SENTINEL → Railway scrape ${decision.params.county}, ${decision.params.state}`);
    } else {
      // Execute on Base44 via forced_function (no LLM = zero Base44 credits)
      const execRes = await fetch(`${BASE44_URL}/functions/autonomousSwarmCycle`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sync_token: SYNC, action: "cycle",
          forced_function: decision.function_to_call,
          forced_action: decision.action, forced_agent: decision.specialist_agent,
          forced_params: decision.params, forced_rationale: decision.rationale,
        }),
      });
      execution = await execRes.json().catch(() => ({}));
      report.actions.push(`✅ ${decision.specialist_agent} → ${decision.function_to_call} (${decision.action})`);
    }

    // 4. Log to Supabase (paid Supabase)
    if (SB_URL && SB_KEY) {
      try {
        await fetch(`${SB_URL}/rest/v1/swarm_cycles`, {
          method: "POST",
          headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify({
            cycle_id: cycleId, status: "complete", trigger_source: "vercel-cron",
            coverage: cov, decision, execution,
            actions: report.actions, errors: report.errors,
            started_at: startedAt, completed_at: new Date().toISOString(),
          }),
        });
      } catch (e) { report.errors.push(`Supabase log failed: ${e.message}`); }
    }

    return res.status(200).json({ cycle_id: cycleId, coverage: cov, decision, execution, actions: report.actions, errors: report.errors });
  } catch (e) {
    console.error("swarm-cycle error:", e.message);
    return res.status(500).json({ cycle_id: cycleId, error: e.message, ...report });
  }
}

// Deterministic coordinator — prioritizes scoring + enrichment (the heavy lifting)
function decide(cov) {
  if ((cov.unenriched || 0) > 0) {
    return { action: `Enrich ${cov.unenriched} properties`, specialist_agent: "ARCHITECT", function_to_call: "runMasterEnrichment", params: {}, rationale: `${cov.unenriched} properties need enrichment` };
  }
  if ((cov.unscored || 0) > 0) {
    return { action: `Score ${cov.unscored} properties`, specialist_agent: "ORACLE", function_to_call: "scoreAllActiveProperties", params: {}, rationale: `${cov.unscored} properties need scoring` };
  }
  if ((cov.uncovered_markets || []).length > 0) {
    const [county, state] = cov.uncovered_markets[0].split(", ");
    return { action: `Scrape ${county}, ${state}`, specialist_agent: "SENTINEL", function_to_call: "scrapeProperties", params: { state, county }, rationale: "Expand national coverage" };
  }
  if ((cov.active_properties || cov.total_properties || 0) > 0) {
    return { action: "Match alerts & notify", specialist_agent: "ANALYST", function_to_call: "matchAndNotifyAlerts", params: {}, rationale: "Match scored properties to investor alerts" };
  }
  return { action: "Validate system", specialist_agent: "HEALER", function_to_call: "validateEnrichment", params: {}, rationale: "Health check" };
}

// Optional Vercel AI Gateway deliberation (paid Vercel, not Base44 credits)
async function llmDeliberate(cov, fallback) {
  const prompt = `You are the Hidden Property Intel swarm coordinator. Pick the highest-impact action.
COVERAGE: ${JSON.stringify(cov)}
Fallback decision: ${JSON.stringify(fallback)}
Return JSON {action, specialist_agent, function_to_call, params, rationale}. Only override the fallback if you see a clearly better action.`;
  const r = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GW_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  const data = await r.json();
  const text = data.choices?.[0]?.message?.content || "";
  return JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
}