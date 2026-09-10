import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { compareSnapshotSummaries, SnapshotSummary } from "../../shared/portability.ts";

/**
 * compareSnapshots — Compares two snapshots by archive_id.
 * Returns what changed: added, removed, changed sections, total delta.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const db = base44.asServiceRole;

  const { snapshot_a_id, snapshot_b_id } = body;
  if (!snapshot_a_id || !snapshot_b_id) {
    return Response.json({ error: 'Provide snapshot_a_id and snapshot_b_id' }, { status: 400 });
  }

  // Fetch both snapshots from IntelligenceArchive
  const [aEntries, bEntries] = await Promise.all([
    db.entities.IntelligenceArchive.filter({ archive_id: snapshot_a_id }).catch(() => []),
    db.entities.IntelligenceArchive.filter({ archive_id: snapshot_b_id }).catch(() => []),
  ]);

  if (aEntries.length === 0 || bEntries.length === 0) {
    return Response.json({ error: 'One or both snapshots not found' }, { status: 404 });
  }

  const a: SnapshotSummary = {
    snapshot_id: aEntries[0].archive_id,
    created_at: aEntries[0].started_at,
    record_counts: aEntries[0].record_counts || {},
    checksum: aEntries[0].checksum || "",
    type: aEntries[0].scope === "full" ? "full" : "incremental",
    label: aEntries[0].label,
  };
  const b: SnapshotSummary = {
    snapshot_id: bEntries[0].archive_id,
    created_at: bEntries[0].started_at,
    record_counts: bEntries[0].record_counts || {},
    checksum: bEntries[0].checksum || "",
    type: bEntries[0].scope === "full" ? "full" : "incremental",
    label: bEntries[0].label,
  };

  const comparison = compareSnapshotSummaries(a, b);

  // Record in IntelligenceArchive
  const archiveId = `cmp-${crypto.randomUUID().slice(0, 12)}`;
  await db.entities.IntelligenceArchive.create({
    archive_id: archiveId,
    operation_type: "snapshot",
    label: `Compare ${snapshot_a_id} vs ${snapshot_b_id}`,
    status: "completed",
    scope: "full",
    comparison_result: { snapshot_a: a, snapshot_b: b, comparison },
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    duration_ms: 0,
    initiated_by: user.id,
  }).catch(() => {});

  return Response.json({ archive_id: archiveId, snapshot_a: a, snapshot_b: b, comparison });
}