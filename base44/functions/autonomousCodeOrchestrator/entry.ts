import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { gatewayChat, isGatewayConfigured } from "../../shared/aiGateway.ts";
import { secrets } from "base44:runtime";

// Autonomous Code Orchestrator — the Base44 side of the Vercel-driven coding loop.
// Runs Planner → Coder → Validator agents over the AI Gateway against a blueprint
// checklist of unbuilt features, then stores each generated spec + code as a
// SystemGap. The Vercel cron (autonomous-code-cycle.js) calls this, then commits
// the code to GitHub when repo sync is configured.
//
// Access: cron calls pass { sync_token } validated against BASE44_SYNC_TOKEN.
// Admin users may also call directly.

const BLUEPRINT_GAPS = [
  { id: "v2_listings", title: "Port Listings page to V2 design", category: "frontend", file_path: "src/pages/v2/V2Listings.jsx" },
  { id: "v2_property_detail", title: "Port PropertyDetail page to V2 design", category: "frontend", file_path: "src/pages/v2/V2PropertyDetail.jsx" },
  { id: "scrape_divorce", title: "Court-sourced divorce records scraper", category: "backend", file_path: "base44/functions/scrapeDivorceRecords/entry.ts" },
  { id: "scrape_eviction", title: "Court-sourced eviction records scraper", category: "backend", file_path: "base44/functions/scrapeEvictionRecords/entry.ts" },
  { id: "attom_enrich", title: "ATTOM 9000-attribute enrichment function", category: "backend", file_path: "base44/functions/attomEnrich/entry.ts" },
  { id: "auto_vision", title: "Auto-run vision analysis on all new scraped images", category: "backend", file_path: "base44/functions/autoVisionAnalysis/entry.ts" },
  { id: "plays_templates", title: "Plays campaign templates (divorce, probate, eviction, tired-landlord)", category: "data", file_path: "base44/shared/playsTemplates.ts" },
  { id: "multisignal_distress", title: "Upgrade predictive_distress_score to multi-signal OR/AND model", category: "backend", file_path: "base44/functions/predictDistress/entry.ts" },
  { id: "v2_seller_port", title: "Port Seller dashboard + post-property to V2", category: "frontend", file_path: "src/pages/v2/V2SellerApp.jsx" },
  { id: "v2_smart_contract_port", title: "Port SmartContract detail + marketing to V2", category: "frontend", file_path: "src/pages/v2/V2SmartContractDetail.jsx" },
];

const stripMd = (s: string) => (s || "").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

export default async function (req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole.entities;

    // Auth: sync token (cron) OR admin user
    const syncToken = secrets.get("BASE44_SYNC_TOKEN");
    if (!syncToken || body.sync_token !== syncToken) {
      const user = await base44.auth.me().catch(() => null);
      if (!user || user.role !== "admin") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const action = body.action || "cycle";

    if (action === "status") {
      const gaps = await sr.SystemGap.list("-created_date", 20).catch(() => []);
      const open = gaps.filter((g: any) => g.status !== "closed");
      return Response.json({
        total_specs: gaps.length,
        open_gaps: open.length,
        blueprint_remaining: BLUEPRINT_GAPS.length - new Set(gaps.map((g: any) => g.blueprint_id).filter(Boolean)).size,
        recent: gaps.slice(0, 10).map((g: any) => ({ title: g.title, status: g.status, file_path: g.file_path, blueprint_id: g.blueprint_id })),
      });
    }

    if (action === "cycle") {
      const cycleId = `CODE-${Date.now()}`;

      // Find next unbuilt blueprint gap
      const existing = await sr.SystemGap.list("-created_date", 100).catch(() => []);
      const doneIds = new Set(existing.map((g: any) => g.blueprint_id).filter(Boolean));
      const next = BLUEPRINT_GAPS.find((g) => !doneIds.has(g.id));
      if (!next) {
        return Response.json({ cycle_id: cycleId, complete: true, message: "All blueprint items speced" });
      }

      const gw = isGatewayConfigured();
      const model = "anthropic/claude-sonnet-5";

      // ── Planner ──
      const plannerPrompt = `You are the Planner agent for Hidden Property Intel's autonomous coding loop. The next gap to spec is: "${next.title}" (category: ${next.category}, target file: ${next.file_path}). Confirm priority and describe what it should do. Return JSON: { "confirmed": boolean, "priority_reason": string, "what_it_does": string }`;
      let planner: any;
      if (gw) {
        const r = await gatewayChat({ prompt: plannerPrompt, model, temperature: 0.3, response_json_schema: { type: "object", properties: { confirmed: { type: "boolean" }, priority_reason: { type: "string" }, what_it_does: { type: "string" } } } });
        try { planner = JSON.parse(stripMd(r.text)); } catch { planner = { confirmed: true, priority_reason: "Blueprint order", what_it_does: next.title }; }
      } else {
        planner = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: plannerPrompt, response_json_schema: { type: "object", properties: { confirmed: { type: "boolean" }, priority_reason: { type: "string" }, what_it_does: { type: "string" } } } });
      }

      // ── Coder ──
      const coderPrompt = `You are the Coder agent for a Base44 app (React + Tailwind frontend; base44/ backend functions run in Deno with ESM, npm: imports, Response objects, default exports). Generate a COMPLETE, production-ready implementation for: "${next.title}". Target file: ${next.file_path}. Follow Base44 conventions strictly. Return JSON: { "spec": "detailed implementation plan", "code": "the full file content, ready to write", "description": "one-line summary" }`;
      let coder: any;
      if (gw) {
        const r = await gatewayChat({ prompt: coderPrompt, model, temperature: 0.2, response_json_schema: { type: "object", properties: { spec: { type: "string" }, code: { type: "string" }, description: { type: "string" } } } });
        try { coder = JSON.parse(stripMd(r.text)); } catch { coder = { spec: r.text, code: "", description: next.title }; }
      } else {
        coder = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: coderPrompt, response_json_schema: { type: "object", properties: { spec: { type: "string" }, code: { type: "string" }, description: { type: "string" } } } });
      }

      // ── Validator ──
      const validatorPrompt = `You are the Validator agent. Review this implementation spec for "${next.title}" (target: ${next.file_path}):\n${coder.spec}\n\nCheck: correctness, security, completeness, Base44 conventions (ESM only — no require/module.exports; npm: specifiers for deps; Response.json for functions; default exports for React; @/ alias imports). Return JSON: { "approved": boolean, "issues": string[], "fixes_needed": string }`;
      let validator: any;
      if (gw) {
        const r = await gatewayChat({ prompt: validatorPrompt, model, temperature: 0.2, response_json_schema: { type: "object", properties: { approved: { type: "boolean" }, issues: { type: "array", items: { type: "string" } }, fixes_needed: { type: "string" } } } });
        try { validator = JSON.parse(stripMd(r.text)); } catch { validator = { approved: true, issues: [], fixes_needed: "" }; }
      } else {
        validator = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: validatorPrompt, response_json_schema: { type: "object", properties: { approved: { type: "boolean" }, issues: { type: "array", items: { type: "string" } }, fixes_needed: { type: "string" } } } });
      }

      // ── Store as SystemGap ──
      const gap = await sr.SystemGap.create({
        title: next.title,
        blueprint_id: next.id,
        category: next.category,
        severity: "high",
        description: planner.what_it_does || next.title,
        file_path: next.file_path,
        spec: coder.spec || "",
        code: coder.code || "",
        validation: JSON.stringify(validator),
        status: validator.approved ? "speced" : "failed",
        source: "autonomous_loop",
        cycle_id: cycleId,
      });

      return Response.json({
        cycle_id: cycleId,
        gap_id: gap.id,
        gap_title: next.title,
        blueprint_id: next.id,
        file_path: next.file_path,
        spec: coder.spec,
        code: coder.code,
        validation: validator,
        approved: validator.approved,
        ai_gateway: gw,
      });
    }

    return Response.json({ error: "Unknown action. Use: status, cycle" }, { status: 400 });
  } catch (error) {
    console.error("autonomousCodeOrchestrator error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}