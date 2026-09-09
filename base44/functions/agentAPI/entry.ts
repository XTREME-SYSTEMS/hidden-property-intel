import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { gatewayChat, isGatewayConfigured } from "../../shared/aiGateway.ts";
import { secrets } from "base44:runtime";

// Agent API — exposes the AGI swarm agents as API-based entities that can travel
// and communicate externally. Any external system (or the swarm itself) can:
//   - manifest:  discover the agents + capabilities (for external registration)
//   - status:    swarm + code-orchestrator state
//   - invoke:    chat with an agent (LLM persona over the Vercel AI Gateway)
//   - execute:   run a whitelisted backend function autonomously
//   - push_code: trigger an autonomous GitHub push
//
// Auth: BASE44_SYNC_TOKEN (swarm/external) OR admin user.

const AGENTS = [
  { name: "PRIME", role: "Orchestrator", skills: ["delegation", "strategy", "coordination"], description: "Master orchestrator — delegates to specialists and runs the swarm." },
  { name: "SENTINEL", role: "Data acquisition", skills: ["scraping", "cloud-browser", "market-expansion"], description: "Scrapes new markets via Cloud Browser." },
  { name: "ARCHITECT", role: "Enrichment", skills: ["enrichment", "data-modeling"], description: "Enriches properties with 15-category data." },
  { name: "ORACLE", role: "Scoring", skills: ["scoring", "prediction", "ml"], description: "Scores properties and predicts distress." },
  { name: "SIREN", role: "Outreach", skills: ["outreach", "email", "sms", "voice"], description: "Sends multi-channel outreach campaigns." },
  { name: "ANALYST", role: "Matching", skills: ["matching", "alerts", "analytics"], description: "Matches properties to investor alerts." },
  { name: "REAPER", role: "Cleanup", skills: ["cleanup", "expiry"], description: "Expires stale data." },
  { name: "HEALER", role: "Validation", skills: ["validation", "health"], description: "Validates system health." },
  { name: "CODER", role: "Engineering", skills: ["coding", "github", "validation"], description: "Writes and pushes code to the repo." },
];

const EXEC_WHITELIST = new Set([
  "scrapeProperties", "runMasterEnrichment", "scoreAllActiveProperties", "runDailyOutreach",
  "matchAndNotifyAlerts", "processFollowUps", "expireStaleProperties", "validateEnrichment",
  "autonomousSwarmCycle", "autonomousCodeOrchestrator", "autonomousCodePush",
]);

// Strip Axios circular refs so function results are JSON-serializable
function sanitize(obj: any): any {
  try {
    const raw = obj?.data ?? obj;
    return JSON.parse(JSON.stringify(raw, (k, v) =>
      ["_currentRequest", "_redirectable", "request", "response", "socket"].includes(k) || typeof v === "function" ? "[redacted]" : v
    ));
  } catch { return { ok: !obj?.error, note: "result too large to serialize" }; }
}

export default async function (req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);

    const syncToken = secrets.get("BASE44_SYNC_TOKEN");
    if (!syncToken || body.sync_token !== syncToken) {
      const user = await base44.auth.me().catch(() => null);
      if (!user || user.role !== "admin") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const action = body.action || "manifest";

    // ── MANIFEST (external registration) ──
    if (action === "manifest") {
      return Response.json({
        app: "Hidden Property Intel",
        endpoint: "agentAPI",
        agents: AGENTS,
        capabilities: ["invoke", "execute", "push_code", "manifest", "status"],
        auth: "sync_token (BASE44_SYNC_TOKEN) or admin session",
        usage: {
          invoke: { action: "invoke", agent: "PRIME", message: "Find me deals in Dallas" },
          execute: { action: "execute", function_name: "scrapeProperties", args: { state: "FL", county: "Miami-Dade" } },
          push_code: { action: "push_code", files: [{ path: "src/x.jsx", content: "..." }], message: "..." },
        },
      });
    }

    // ── STATUS ──
    if (action === "status") {
      const swarm = await base44.asServiceRole.functions.invoke("autonomousSwarmCycle", { action: "status" }).catch(() => ({}));
      const code = await base44.asServiceRole.functions.invoke("autonomousCodeOrchestrator", { action: "status" }).catch(() => ({}));
      return Response.json({ swarm, code, agents: AGENTS.length, ai_gateway: isGatewayConfigured() });
    }

    // ── INVOKE (chat with an agent) ──
    if (action === "invoke") {
      const agentName = (body.agent || "PRIME").toUpperCase();
      const agent = AGENTS.find((a) => a.name === agentName) || AGENTS[0];
      const prompt = `You are ${agent.name}, the ${agent.role} agent of the Hidden Property Intel AGI swarm. Skills: ${agent.skills.join(", ")}. ${agent.description}\n\nUser request: ${body.message}\n\nRespond concisely. If the request implies an action, name the function that should run.`;
      let reply: string;
      if (isGatewayConfigured()) {
        const r = await gatewayChat({ prompt, model: "anthropic/claude-sonnet-5", temperature: 0.4 });
        reply = r.text || "";
      } else {
        const r = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
        reply = typeof r === "string" ? r : JSON.stringify(r);
      }
      return Response.json({ agent: agent.name, reply });
    }

    // ── EXECUTE (run a whitelisted backend function) ──
    if (action === "execute") {
      const fn = body.function_name;
      if (!EXEC_WHITELIST.has(fn)) {
        return Response.json({ error: `Function '${fn}' not in the agent execute whitelist`, allowed: [...EXEC_WHITELIST] }, { status: 403 });
      }
      const result = await base44.asServiceRole.functions.invoke(fn, body.args || {});
      return Response.json({ executed: fn, result: sanitize(result) });
    }

    // ── PUSH CODE (agents push to GitHub autonomously) ──
    if (action === "push_code") {
      const result = await base44.asServiceRole.functions.invoke("autonomousCodePush", {
        action: "push",
        files: body.files,
        message: body.message || `agent: ${body.agent || "swarm"} push`,
        pr_body: body.pr_body,
      });
      return Response.json({ pushed: true, result: sanitize(result) });
    }

    return Response.json({ error: "Unknown action. Use: manifest, status, invoke, execute, push_code" }, { status: 400 });
  } catch (error) {
    console.error("agentAPI error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}