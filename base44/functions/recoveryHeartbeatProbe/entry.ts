import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

/**
 * Read-only recovery probe for the external HPI recovery heartbeat.
 * Auth: admin session OR existing BASE44_SYNC_TOKEN bearer credential.
 * Exposes convergence health only. No customer/user records and no mutation.
 */
export default async function(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const runtime = await import('base44:runtime');
  const syncToken = runtime.secrets.get('BASE44_SYNC_TOKEN') || '';
  const authHeader = req.headers.get('Authorization') || '';
  const hasToken = Boolean(syncToken) && authHeader === `Bearer ${syncToken}`;
  const user = await base44.auth.me().catch(() => null);

  if (!hasToken && !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasToken && user?.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  const db = base44.asServiceRole;
  const [beats, gateRows] = await Promise.all([
    db.entities.HeartbeatReceipt.list('-timestamp', 1).catch(() => []),
    db.entities.GateResult.list('-evaluated_at', 120).catch(() => []),
  ]);

  const heartbeat = beats[0] || null;
  const latestByGate = new Map<string, any>();
  for (const row of gateRows) {
    if (row?.gate_id && !latestByGate.has(row.gate_id)) latestByGate.set(row.gate_id, row);
  }

  const mandatory = [...latestByGate.values()].filter((g: any) => g.mandatory);
  const counts = mandatory.reduce((acc: Record<string, number>, g: any) => {
    acc[g.status || 'UNKNOWN'] = (acc[g.status || 'UNKNOWN'] || 0) + 1;
    return acc;
  }, {});

  const heartbeatAgeMs = heartbeat?.timestamp
    ? Math.max(0, Date.now() - new Date(heartbeat.timestamp).getTime())
    : null;

  return Response.json({
    service: 'hpi-recovery-probe',
    mutation_performed: false,
    observed_at: new Date().toISOString(),
    heartbeat: heartbeat ? {
      heartbeat_id: heartbeat.heartbeat_id,
      timestamp: heartbeat.timestamp,
      age_ms: heartbeatAgeMs,
      mode: heartbeat.mode,
      release_ready: Boolean(heartbeat.release_ready),
      source_sha: heartbeat.source_sha || null,
      gate_failures: heartbeat.gate_failures || [],
      open_findings: heartbeat.open_findings ?? null,
    } : null,
    mandatory_gate_counts: counts,
  });
}
