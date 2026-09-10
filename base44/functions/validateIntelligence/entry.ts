import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { validateIntegrity } from "../../shared/portability.ts";

/**
 * validateIntelligence — Runs a full integrity check across the intelligence
 * layer: orphan edges, missing provenance, broken references, duplicates,
 * temporal gaps. Returns an integrity score + detailed failures.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  const db = base44.asServiceRole;
  const startedAt = Date.now();
  const result = await validateIntegrity(db);
  const durationMs = Date.now() - startedAt;

  // Record in IntelligenceArchive
  const archiveId = `int-${crypto.randomUUID().slice(0, 12)}`;
  await db.entities.IntelligenceArchive.create({
    archive_id: archiveId,
    operation_type: "integrity_check",
    label: "Intelligence Integrity Check",
    status: result.integrity_score >= 70 ? "completed" : "partial",
    scope: "full",
    total_records: Object.values(result.data_counts).reduce((a: number, b: any) => a + (b as number), 0),
    validation_result: result,
    integrity_score: result.integrity_score,
    started_at: new Date(startedAt).toISOString(),
    completed_at: new Date().toISOString(),
    duration_ms: durationMs,
    initiated_by: user.id,
    warnings: result.failures,
  }).catch(() => {});

  return Response.json({ archive_id: archiveId, ...result, duration_ms: durationMs });
}