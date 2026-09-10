// Graph Query Engine — Phase 5.
// Traverses the Relationship entity as a real knowledge graph.
// Supports: direct relationships, multi-hop traversal, shortest paths,
// neighborhood queries, filtering by type/confidence/temporal/source.

export interface GraphNode {
  id: string;
  type: string;
  name: string;
  confidence: number;
  status: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  confidence: number;
  source_name: string;
  evidence_ids: string[];
  recorded_at: string;
}

export interface GraphPath {
  nodes: GraphNode[];
  edges: GraphEdge[];
  path_confidence: number;
  length: number;
  explanation: string;
}

export interface GraphQueryOpts {
  max_depth?: number;
  relationship_types?: string[];
  min_confidence?: number;
  since?: string;       // ISO date — temporal filter
  source_filter?: string;
  limit?: number;
}

/**
 * BFS traversal from a start entity, returning all reachable nodes + edges
 * within max_depth hops, filtered by opts.
 */
export async function traverseGraph(db: any, startEntityId: string, opts: GraphQueryOpts = {}): Promise<{
  start: GraphNode;
  nodes: GraphNode[];
  edges: GraphEdge[];
  max_depth: number;
  total_reachable: number;
}> {
  const maxDepth = opts.max_depth || 3;
  const minConf = opts.min_confidence || 0;
  const limit = opts.limit || 100;

  const visited = new Set<string>([startEntityId]);
  const allEdges: GraphEdge[] = [];
  const allNodeIds = new Set<string>([startEntityId]);

  // BFS
  let frontier = [startEntityId];
  for (let depth = 0; depth < maxDepth; depth++) {
    if (frontier.length === 0) break;

    // Fetch all relationships involving the frontier nodes
    const relFilter = { $or: frontier.flatMap((id) => [{ source_entity_id: id }, { target_entity_id: id }]) };
    const rels = await db.entities.Relationship.filter(relFilter, "recorded_at", 200).catch(() => []);

    const nextFrontier: string[] = [];
    for (const rel of rels) {
      // Apply filters
      if (opts.relationship_types && opts.relationship_types.length > 0 && !opts.relationship_types.includes(rel.type)) continue;
      if (rel.confidence !== undefined && rel.confidence < minConf) continue;
      if (opts.since && rel.recorded_at && rel.recorded_at < opts.since) continue;
      if (opts.source_filter && rel.source !== opts.source_filter) continue;

      const neighborId = rel.source_entity_id === frontier[0] ? rel.target_entity_id : rel.source_entity_id;
      // Find which frontier node this rel belongs to
      const frontierNode = frontier.find((id) => rel.source_entity_id === id || rel.target_entity_id === id);
      if (!frontierNode) continue;
      const other = rel.source_entity_id === frontierNode ? rel.target_entity_id : rel.source_entity_id;

      allEdges.push({
        id: rel.id,
        source: rel.source_entity_id,
        target: rel.target_entity_id,
        type: rel.type,
        confidence: rel.confidence || 0,
        source_name: rel.source || "",
        evidence_ids: rel.evidence_ids || [],
        recorded_at: rel.recorded_at || "",
      });

      allNodeIds.add(rel.source_entity_id);
      allNodeIds.add(rel.target_entity_id);

      if (!visited.has(other)) {
        visited.add(other);
        nextFrontier.push(other);
      }
    }

    frontier = nextFrontier;
    if (allEdges.length >= limit) break;
  }

  // Fetch all node records
  const nodeIds = Array.from(allNodeIds).slice(0, limit);
  const nodes: GraphNode[] = [];
  for (const id of nodeIds) {
    try {
      const rec = await db.entities.EntityRecord.get(id);
      nodes.push({
        id: rec.id,
        type: rec.type,
        name: rec.canonical_name,
        confidence: rec.confidence || 0,
        status: rec.status || "unknown",
      });
    } catch {}
  }

  const startRec = nodes.find((n) => n.id === startEntityId);

  return {
    start: startRec || { id: startEntityId, type: "unknown", name: "", confidence: 0, status: "unknown" },
    nodes,
    edges: allEdges,
    max_depth: maxDepth,
    total_reachable: nodes.length,
  };
}

/**
 * Find shortest path between two entities using BFS.
 * Returns the path with nodes, edges, and aggregate confidence.
 */
export async function shortestPath(db: any, startId: string, endId: string, opts: GraphQueryOpts = {}): Promise<GraphPath | null> {
  const maxDepth = opts.max_depth || 5;
  const minConf = opts.min_confidence || 0;

  // BFS with path tracking
  const queue: { id: string; path: string[]; edges: any[] }[] = [{ id: startId, path: [startId], edges: [] }];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.path.length - 1 >= maxDepth) continue;

    const rels = await db.entities.Relationship.filter({
      $or: [{ source_entity_id: current.id }, { target_entity_id: current.id }]
    }, "recorded_at", 50).catch(() => []);

    for (const rel of rels) {
      if (opts.relationship_types && opts.relationship_types.length > 0 && !opts.relationship_types.includes(rel.type)) continue;
      if (rel.confidence !== undefined && rel.confidence < minConf) continue;

      const neighbor = rel.source_entity_id === current.id ? rel.target_entity_id : rel.source_entity_id;

      if (neighbor === endId) {
        // Found path — build it
        const fullPath = [...current.path, endId];
        const allEdges = [...current.edges, rel];
        const nodes: GraphNode[] = [];
        for (const id of fullPath) {
          try {
            const rec = await db.entities.EntityRecord.get(id);
            nodes.push({ id: rec.id, type: rec.type, name: rec.canonical_name, confidence: rec.confidence || 0, status: rec.status || "unknown" });
          } catch {
            nodes.push({ id, type: "unknown", name: "", confidence: 0, status: "unknown" });
          }
        }
        const pathConf = allEdges.length > 0
          ? Math.round(allEdges.reduce((s, e) => s + (e.confidence || 0), 0) / allEdges.length)
          : 100;
        const explanation = nodes.map((n, i) => i === 0 ? n.name : `→ [${allEdges[i - 1].type}] → ${n.name}`).join(" ");
        return { nodes, edges: allEdges, path_confidence: pathConf, length: allEdges.length, explanation };
      }

      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, path: [...current.path, neighbor], edges: [...current.edges, rel] });
      }
    }
  }

  return null; // No path found within max_depth
}

/**
 * Get the neighborhood (1-hop) of an entity — all directly connected nodes.
 */
export async function getNeighborhood(db: any, entityId: string, opts: GraphQueryOpts = {}): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const result = await traverseGraph(db, entityId, { ...opts, max_depth: 1 });
  return { nodes: result.nodes, edges: result.edges };
}