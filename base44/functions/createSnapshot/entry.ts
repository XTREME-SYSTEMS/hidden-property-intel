import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { createSnapshotSummary } from "../../shared/portability.ts";

/**
 * createSnapshot — Creates a lightweight intelligence snapshot (record counts
 * + content checksum per section). Snapshots enable state comparison over time.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const db = base44.asServiceRole;

  const label = body.label || `Snapshot ${new Date().toISOString().slice(0, 10)}`;
  const type = body.type || "full";

  const startedAt = Date.now();
  const snapshot = await createSnapshotSummary(db, label, type);
  const durationMs = Date.now() - startedAt;

  // Record in IntelligenceArchive
  await db.entities.IntelligenceArchive.create({
    archive_id: snapshot.snapshot_id,
    operation_type: "snapshot",
    label,
    status: "completed",
    scope: "full",
    record_counts: snapshot.record_counts,
    total_records: Object.values(snapshot.record_counts).reduce((a: number, b: any) => a + (b as number), 0),
    checksum: snapshot.checksum,
    started_at: new Date(startedAt).toISOString(),
    completed_at: new Date().toISOString(),
    duration_ms: durationMs,
    initiated_by: user.id,
  }).catch(() => {});

  return Response.json({ ...snapshot, duration_ms: durationMs });
}