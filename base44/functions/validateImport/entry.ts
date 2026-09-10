import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { validateImportPackage } from "../../shared/portability.ts";

/**
 * validateImport — Dry-run validation of an import package.
 * Verifies manifest, checksums, schema, and detects conflicts.
 * NO data is modified.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const db = base44.asServiceRole;

  if (!body.package) return Response.json({ error: 'Missing package' }, { status: 400 });

  const startedAt = Date.now();
  const result = await validateImportPackage(db, body.package);
  const durationMs = Date.now() - startedAt;

  // Record in IntelligenceArchive
  const archiveId = `val-${crypto.randomUUID().slice(0, 12)}`;
  await db.entities.IntelligenceArchive.create({
    archive_id: archiveId,
    operation_type: "import",
    label: body.label || "dry-run validation",
    status: "completed",
    scope: "full",
    total_records: result.record_analysis.total,
    validation_result: result,
    started_at: new Date(startedAt).toISOString(),
    completed_at: new Date().toISOString(),
    duration_ms: durationMs,
    initiated_by: user.id,
    warnings: result.missing_dependencies,
    errors: result.errors,
  }).catch(() => {});

  return Response.json({
    archive_id: archiveId,
    ...result,
    duration_ms: durationMs,
  });
}