import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { gatewayChat, GATEWAY_MODELS, isGatewayConfigured } from "../../shared/aiGateway.ts";

// Vercel AI Gateway — multi-model AI generation endpoint.
// Supports OpenAI, Anthropic, and Google models through a single API.
// Falls back to built-in InvokeLLM if the gateway key is not configured.

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const action = body.action || "generate";

    // LIST MODELS — return available gateway models
    if (action === "models") {
      return Response.json({
        configured: isGatewayConfigured(),
        models: GATEWAY_MODELS,
      });
    }

    // GENERATE — call the AI Gateway
    if (action === "generate") {
      const { prompt, system, model, max_tokens, temperature, response_json_schema, fallback_to_invoke_llm } = body;

      if (!prompt || typeof prompt !== "string") {
        return Response.json({ error: 'Missing "prompt" field' }, { status: 400 });
      }
      if (prompt.length > 32000) {
        return Response.json({ error: "Prompt too long (max 32k chars)" }, { status: 400 });
      }

      // Try the AI Gateway first
      if (isGatewayConfigured()) {
        try {
          const result = await gatewayChat({
            prompt,
            system,
            model,
            max_tokens,
            temperature,
            response_json_schema,
          });

          let parsed = result.text;
          // If JSON schema was requested, parse the response
          if (response_json_schema) {
            try {
              const cleaned = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
              parsed = JSON.parse(cleaned);
            } catch {
              const match = result.text.match(/\{[\s\S]*\}/);
              if (match) parsed = JSON.parse(match[0]);
            }
          }

          return Response.json({
            source: "vercel_ai_gateway",
            result: parsed,
            model: result.model,
            usage: result.usage,
          });
        } catch (gwError) {
          // If gateway fails and fallback is enabled, use InvokeLLM
          if (!fallback_to_invoke_llm) {
            return Response.json({ error: gwError.message, source: "vercel_ai_gateway" }, { status: 502 });
          }
          // Fall through to InvokeLLM
        }
      }

      // Fallback to built-in InvokeLLM
      const invokeOpts: any = { prompt };
      if (model) invokeOpts.model = model;
      if (response_json_schema) invokeOpts.response_json_schema = response_json_schema;

      const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM(invokeOpts);

      return Response.json({
        source: "invoke_llm_fallback",
        result: llmResult,
        model: model || "automatic",
        usage: null,
        note: "AI Gateway not configured or failed — used built-in InvokeLLM",
      });
    }

    // BATCH — generate multiple completions in one call
    if (action === "batch") {
      const { prompts, system, model, max_tokens, temperature } = body;
      if (!Array.isArray(prompts) || prompts.length === 0) {
        return Response.json({ error: "prompts must be a non-empty array" }, { status: 400 });
      }
      if (prompts.length > 10) {
        return Response.json({ error: "Max 10 prompts per batch" }, { status: 400 });
      }

      const results = [];
      for (const p of prompts) {
        if (!isGatewayConfigured()) break;
        try {
          const result = await gatewayChat({ prompt: p, system, model, max_tokens, temperature });
          results.push({ text: result.text, model: result.model, usage: result.usage });
        } catch (e) {
          results.push({ error: e.message });
        }
      }

      return Response.json({ source: "vercel_ai_gateway", results, count: results.length });
    }

    return Response.json({ error: "Unknown action. Use: models, generate, batch" }, { status: 400 });
  } catch (error) {
    console.error("aiGatewayGenerate error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}