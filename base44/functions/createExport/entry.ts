import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { buildExportPackage } from "../../shared/portability.ts";

/**
 * createExport — Exports the complete intelligence layer into a portable
 * package with manifest, per-section checksums, and all entity records.
 *
 * Supports scoped exports via `scope` param:
 *   full, intelligence, properties, entities, graph, evidence, investigations
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const db = base44.asServiceRole;
  const scope = body.scope || 'full';

  const scopeSections: Record<string, string[]> = {
    full: [],
    intelligence: ["entities", "relationships", "evidence", "investigations", "events", "snapshots", "cache_entries"],
    properties: ["properties", "owners", "ownership_chains", "scores"],
    entities: ["entities", "relationships"],
    graph: ["entities", "relationships"],
    evidence: ["evidence"],
    investigations: ["investigations", "evidence", "events"],
    timeline: ["events"],
    scoring: ["scores"],
  };

  const sections = scopeSections[scope] || [];
  const opts = sections.length > 0 ? { sections } : {};

  const startedAt = Date.now();
  const pkg = await buildExportPackage(db, opts);
  const durationMs = Date.now() - startedAt;

  // Record in IntelligenceArchive
  const archiveId = `exp-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}`;
  const totalRecords = Object.values(pkg.manifest.record_counts).reduce((a: number, b: any) => a + (b as number), 0);
  const sizeBytes = JSON.stringify(pkg).length;

  await db.entities.IntelligenceArchive.create({
    archive_id: archiveId,
    operation_type: "export",
    label: body.label || `${scope} export ${new Date().toISOString()}`,
    status: pkg.manifest.errors.length > 0 ? "partial" : "completed",
    scope,
    record_counts: pkg.manifest.record_counts,
    total_records: totalRecords,
    checksum: pkg.checksums[Object.keys(pkg.checksums)[0]] || "",
    size_bytes: sizeBytes,
    manifest: pkg.manifest,
    started_at: new Date(startedAt).toISOString(),
    completed_at: new Date().toISOString(),
    duration_ms: durationMs,
    initiated_by: user.id,
    warnings: pkg.manifest.warnings,
    errors: pkg.manifest.errors,
  }).catch(() => {});

  return Response.json({
    archive_id: archiveId,
    manifest: pkg.manifest,
    checksums: pkg.checksums,
    data: pkg.data,
    size_bytes: sizeBytes,
    duration_ms: durationMs,
  });
}