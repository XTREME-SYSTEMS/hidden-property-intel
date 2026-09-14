import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

function latestByGate(rows: any[]) {
  const map = new Map<string, any>();
  for (const row of rows) {
    if (!row?.gate_id || map.has(row.gate_id)) continue;
    map.set(row.gate_id, row);
  }
  return map;
}

export default async function(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  const db = base44.asServiceRole;
  const [gateRows, findings, activeRepairs] = await Promise.all([
    db.entities.GateResult.list('-evaluated_at', 300).catch(() => []),
    db.entities.Finding.filter({ status: { $in: ['discovered', 'diagnosed', 'repair_planned', 'failed', 'blocked'] } }, '-discovered_at', 200).catch(() => []),
    db.entities.RepairTask.filter({ status: { $in: ['queued', 'in_progress'] } }, '-created_at', 300).catch(() => []),
  ]);

  const gates = latestByGate(gateRows);
  const findingById = new Map(findings.map((f: any) => [f.finding_id, f]));
  const grouped = new Map<string, any[]>();

  for (const task of activeRepairs) {
    const key = task.finding_id || 'missing-finding-id';
    const bucket = grouped.get(key) || [];
    bucket.push(task);
    grouped.set(key, bucket);
  }

  const duplicateActiveRepairs = [...grouped.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([finding_id, rows]) => ({ finding_id, count: rows.length, task_ids: rows.map((r: any) => r.task_id) }));

  const unknownGateRepairs: any[] = [];
  for (const task of activeRepairs) {
    const finding: any = findingById.get(task.finding_id);
    if (!finding?.category) continue;
    const gate = gates.get(finding.category);
    if (gate?.status === 'UNKNOWN') {
      unknownGateRepairs.push({ task_id: task.task_id, finding_id: task.finding_id, gate_id: finding.category });
    }
  }

  const pass = duplicateActiveRepairs.length === 0 && unknownGateRepairs.length === 0;

  return Response.json({
    validator_id: 'repair-loop-idempotency-regression',
    status: pass ? 'PASS' : 'FAIL',
    evaluated_at: new Date().toISOString(),
    active_repair_count: activeRepairs.length,
    duplicate_active_repairs: duplicateActiveRepairs,
    unknown_gate_repairs: unknownGateRepairs,
    invariants: {
      max_one_active_repair_per_finding: duplicateActiveRepairs.length === 0,
      unknown_gate_creates_no_active_repair: unknownGateRepairs.length === 0,
    },
    mutation_performed: false,
  });
}
