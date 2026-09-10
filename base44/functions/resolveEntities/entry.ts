import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { scoreEntityPair, mergeEntities, ResolutionResult } from "../../shared/entityResolution.ts";

/**
 * resolveEntities — Entity Resolution Engine (Phase 4).
 * Compares EntityRecord pairs, scores similarity with explainable signals,
 * and optionally merges high-confidence matches while preserving merge history.
 * Never auto-merges conflicted or low-confidence entities.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const db = base44.asServiceRole;

  const { entity_a_id, entity_b_id, auto_merge, find_duplicates } = body;

  // Mode 1: Score a specific pair
  if (entity_a_id && entity_b_id) {
    const a = await db.entities.EntityRecord.get(entity_a_id);
    const b = await db.entities.EntityRecord.get(entity_b_id);
    const result = scoreEntityPair(a, b);

    let merged = null;
    if (auto_merge && result.recommendation === 'merge' && result.decision !== 'CONFLICTED') {
      // Merge lower-confidence into higher-confidence
      const survivor = (a.confidence || 0) >= (b.confidence || 0) ? a : b;
      const absorbed = survivor === a ? b : a;
      merged = await mergeEntities(db, survivor.id, absorbed.id, result.explanation);
    }

    return Response.json({ source: 'entity_resolution_engine', result, merged });
  }

  // Mode 2: Find potential duplicates across all entities
  if (find_duplicates) {
    const entities = await db.entities.EntityRecord.list("-created_date", 200);
    const pairs: any[] = [];

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const result = scoreEntityPair(entities[i], entities[j]);
        if (result.overall_score >= 55) {
          pairs.push({
            entity_a: { id: entities[i].id, name: entities[i].canonical_name, type: entities[i].type },
            entity_b: { id: entities[j].id, name: entities[j].canonical_name, type: entities[j].type },
            decision: result.decision,
            score: result.overall_score,
            recommendation: result.recommendation,
            explanation: result.explanation,
          });
        }
      }
    }

    pairs.sort((a, b) => b.score - a.score);

    return Response.json({
      source: 'entity_resolution_engine',
      mode: 'find_duplicates',
      total_entities: entities.length,
      candidate_pairs: pairs.length,
      pairs: pairs.slice(0, 20),
    });
  }

  return Response.json({ error: 'Provide entity_a_id + entity_b_id, or find_duplicates: true' }, { status: 400 });
}