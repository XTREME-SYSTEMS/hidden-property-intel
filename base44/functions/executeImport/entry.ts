import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { executeImport, validateImportPackage } from "../../shared/portability.ts";

/**
 * executeImport — Executes an import with idempotency and conflict handling.
 * Supports force=true to overwrite conflicts, dry_run=true to preview only.
 * Validates before importing — fails on checksum mismatch.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const db = base44.asServiceRole;

  if (!body.package) return Response.json({ error: 'Missing package' }, { status: 400 });

  const force = body.force || false;
  const dryRun = body.dry_run || false;

  // Always validate first — never import corrupt data
  const validation = await validateImportPackage(db, body.package);
  if (!validation.valid && !force) {
    return Response.json({
      error: 'Validation failed — use force=true to override',
      validation,
    }, { status: 400 });
  }

  const startedAt = Date.now();
  const result = await executeImport(db, body.package, { force, dry_run: dryRun });
  const durationMs = Date.now() - startedAt;

  // Record in IntelligenceArchive
  const archiveId = `imp-${result.import_id}`;
  await db.entities.IntelligenceArchive.create({
    archive_id: archiveId,
    operation_type: "import",
    label: body.label || (dryRun ? "dry-run import" : "live import"),
    status: result.status,
    scope: "full",
    total_records: result.records_created + result.records_updated + result.records_skipped,
    import_result: result,
    started_at: new Date(startedAt).toISOString(),
    completed_at: new Date().toISOString(),
    duration_ms: durationMs,
    initiated_by: user.id,
    errors: result.errors,
  }).catch(() => {});

  return Response.json({
    archive_id: archiveId,
    ...result,
    validation_summary: validation.record_analysis,
    duration_ms: durationMs,
  });
}