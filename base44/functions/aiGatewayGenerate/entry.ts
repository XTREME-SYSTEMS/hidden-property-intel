import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import {
  gatewayChat, gatewayEmbed, gatewayRerank, gatewayImage, gatewayTTS,
  gatewayTranscribe, listGatewayModels, isGatewayConfigured,
  GATEWAY_MODELS, DEFAULTS,
} from "../../shared/aiGateway.ts";

/**
 * aiGatewayGenerate — unified multi-modal AI Gateway endpoint.
 * Actions: models, generate, web_search, vision, embed, rerank, image, tts, transcribe.
 * Uses the Vercel AI Gateway directly (works without platform integration credits).
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'models';

    if (action === 'models') {
      const live = await listGatewayModels();
      return Response.json({
        configured: isGatewayConfigured(),
        defaults: DEFAULTS,
        curated: GATEWAY_MODELS,
        live_count: live.length,
        live_sample: live.slice(0, 50).map((m: any) => ({ id: m.id, name: m.name, type: m.type, owned_by: m.owned_by, tags: m.tags })),
      });
    }

    if (action === 'generate' || action === 'web_search' || action === 'vision') {
      const { prompt, system, model, max_tokens, temperature, response_json_schema, images, web_search } = body;
      if (!prompt) return Response.json({ error: 'prompt required' }, { status: 400 });
      const isWs = action === 'web_search' || web_search;
      const isVision = action === 'vision' || (Array.isArray(images) && images.length > 0);
      const result = await gatewayChat({
        prompt,
        system,
        model,
        max_tokens,
        temperature,
        response_json_schema,
        images: isVision ? images : undefined,
        web_search: isWs,
      });
      return Response.json({
        source: 'vercel_ai_gateway',
        text: result.text,
        result: result.json ?? result.text,
        model: result.model,
        usage: result.usage,
        mode: isWs ? 'web_search' : isVision ? 'vision' : 'chat',
      });
    }

    if (action === 'embed') {
      const { input, model } = body;
      if (!input) return Response.json({ error: 'input required' }, { status: 400 });
      const r = await gatewayEmbed({ input, model });
      return Response.json({ source: 'vercel_ai_gateway', embedding: r.embedding, model: r.model, dims: r.embedding.length });
    }

    if (action === 'rerank') {
      const { query, documents, model, top_n } = body;
      if (!query || !Array.isArray(documents)) return Response.json({ error: 'query and documents[] required' }, { status: 400 });
      const r = await gatewayRerank({ query, documents, model, top_n });
      if (!r) return Response.json({ error: 'Rerank endpoint unavailable on this gateway', source: 'vercel_ai_gateway' }, { status: 502 });
      return Response.json({ source: 'vercel_ai_gateway', results: r.results, model: r.model });
    }

    if (action === 'image') {
      const { prompt, model, size, n } = body;
      if (!prompt) return Response.json({ error: 'prompt required' }, { status: 400 });
      const r = await gatewayImage({ prompt, model, size, n });
      return Response.json({ source: 'vercel_ai_gateway', urls: r.urls, model: r.model });
    }

    if (action === 'tts') {
      const { text, model, voice } = body;
      if (!text) return Response.json({ error: 'text required' }, { status: 400 });
      if (text.length > 4000) return Response.json({ error: 'text too long (max 4000 chars)' }, { status: 400 });
      const r = await gatewayTTS({ text, model, voice });
      return Response.json({ source: 'vercel_ai_gateway', audio_base64: r.audio_base64, model: r.model, format: 'mp3' });
    }

    if (action === 'transcribe') {
      const { audio_url, model } = body;
      if (!audio_url) return Response.json({ error: 'audio_url required' }, { status: 400 });
      const r = await gatewayTranscribe({ audio_url, model });
      return Response.json({ source: 'vercel_ai_gateway', text: r.text, model: r.model });
    }

    return Response.json({ error: 'Unknown action. Use: models, generate, web_search, vision, embed, rerank, image, tts, transcribe' }, { status: 400 });
  } catch (error) {
    console.error('aiGatewayGenerate error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}