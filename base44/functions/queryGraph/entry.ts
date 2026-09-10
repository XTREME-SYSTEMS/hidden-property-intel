import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { traverseGraph, shortestPath, getNeighborhood } from "../../shared/graphEngine.ts";

/**
 * queryGraph — Graph Query Engine (Phase 5).
 * Traverses the Relationship entity as a knowledge graph.
 * Supports: neighborhood queries, multi-hop traversal, shortest paths,
 * filtering by relationship type, confidence, temporal window, and source.
 * Returns explainable relationship paths with evidence and confidence.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const db = base44.asServiceRole;

  const {
    start_entity_id,
    end_entity_id,
    mode, // "traverse" | "shortest_path" | "neighborhood"
    max_depth,
    relationship_types,
    min_confidence,
    since,
    source_filter,
    limit,
  } = body;

  if (!start_entity_id) return Response.json({ error: 'start_entity_id required' }, { status: 400 });

  const opts = { max_depth, relationship_types, min_confidence, since, source_filter, limit };

  if (mode === 'shortest_path' || end_entity_id) {
    if (!end_entity_id) return Response.json({ error: 'end_entity_id required for shortest_path' }, { status: 400 });
    const path = await shortestPath(db, start_entity_id, end_entity_id, opts);
    return Response.json({
      source: 'graph_query_engine',
      mode: 'shortest_path',
      path_found: !!path,
      path,
    });
  }

  if (mode === 'neighborhood') {
    const result = await getNeighborhood(db, start_entity_id, opts);
    return Response.json({
      source: 'graph_query_engine',
      mode: 'neighborhood',
      ...result,
    });
  }

  // Default: traverse
  const result = await traverseGraph(db, start_entity_id, opts);
  return Response.json({
    source: 'graph_query_engine',
    mode: 'traverse',
    ...result,
  });
}