import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { RELEASE_CONSTITUTION, computeReleaseReady, mandatoryGates } from '../../shared/releaseConstitution.ts';
import { SPECIALIST_SWARM, specialistFor, classifyAction, CERTIFIER } from '../../shared/specialistSwarm.ts';

/**
 * ALPHA PRIME — Convergence Governor
 *
 * The single five-minute control plane. Called by the Convergence Heartbeat workflow.
 * Responsibilities:
 *   1. Acquire a durable lease (no overlapping heartbeats)
 *   2. Evaluate which jobs are due (last-run timestamps)
 *   3. Recompute release gates from existing validators (systemPreflight, systemAudit)
 *   4. Prioritize the repair queue (open findings by severity)
 *   5. Dispatch specialists for due SAFE/REVERSIBLE repair work
 *   6. Enforce the sensitive-action firewall (block consequential/irreversible pending approval)
 *   7. Collect receipts; invoke the Independent Release Validator
 *   8. Update subsystem states; evaluate mode transitions
 *   9. Emit a HeartbeatReceipt
 *
 * Prefers deterministic checks over LLM opinion. Never declares completion without
 * independent validation evidence.
 */

const LEASE_TTL_SECONDS = 240; // 4 min — under the 5-min cadence so a dead heartbeat self-releases
const SUBSYSTEMS = ['frontend', 'backend', 'rls', 'ingestion', 'data_quality', 'payments', 'seo', 'pwa', 'ai', 'observability', 'security', 'agents', 'workflows'];

function nowIso() { return new Date().toISOString(); }
function uid(prefix: string) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }

export default async function(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me().catch(() => null);
    // Heartbeat runs via workflow (service context) — allow if no user (workflow) or admin
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const startedAt = Date.now();
    const heartbeatId = uid('hb');
    const now = nowIso();

    // ── 1. Lease (durable lock via CacheEntry TTL) ──
    const leaseKey = 'convergence_heartbeat_lease';
    const existing = await base44.asServiceRole.entities.CacheEntry.filter({ cache_key: leaseKey }).catch(() => []);
    const active = existing[0];
    if (active && active.expires_at && new Date(active.expires_at).getTime() > Date.now()) {
      // Another heartbeat holds the lease — cheap exit
      return Response.json({ heartbeat_id: heartbeatId, lease_acquired: false, note: 'lease held by another beat', timestamp: now });
    }
    const expires = new Date(Date.now() + LEASE_TTL_SECONDS * 1000).toISOString();
    if (active) {
      await base44.asServiceRole.entities.CacheEntry.update(active.id, { expires_at: expires, status: 'fresh', cached_at: now, response: { owner: heartbeatId } });
    } else {
      await base44.asServiceRole.entities.CacheEntry.create({ cache_key: leaseKey, source: 'alpha_prime', query: 'lease', response: { owner: heartbeatId }, cached_at: now, expires_at: expires, ttl_seconds: LEASE_TTL_SECONDS, provenance: 'alpha_prime', status: 'fresh' });
    }

    // ── 2. Run Wave 1 validators (gate-specific deterministic evidence) ──
    let validatorResult: any = null;
    try {
      validatorResult = await base44.asServiceRole.functions.invoke('runValidators', {});
    } catch (e) { /* validator factory unavailable — gates stay UNKNOWN */ }
    const vr: any = validatorResult?.data ?? validatorResult;
    const sourceSha: string | null = vr?.source_sha ?? null;
    const receiptMap: Record<string, any> = {};
    for (const r of (vr?.receipts || [])) receiptMap[r.gate_id] = r;

    // Operational telemetry (systemPreflight) — kept as telemetry, NOT release evidence.
    let preflight: any = null;
    try {
      preflight = await base44.asServiceRole.functions.invoke('systemPreflight', {});
    } catch (e) { /* may fail */ }
    const pf: any = preflight?.data ?? preflight;
    const telemetryDims: Record<string, number> = {};
    if (Array.isArray(pf?.dimensions)) {
      for (const d of pf.dimensions) telemetryDims[d.dimension] = d.score;
    }

    // GATE RESOLUTION PRIORITY:
    //   1. Fresh deterministic gate validator receipt for the exact canonical source SHA → authoritative
    //   2. Otherwise UNKNOWN (never inferred from dimension scores or stale evidence)
    // Legacy dimension scores remain operational telemetry only — never release evidence.
    const gates = RELEASE_CONSTITUTION.map((g) => {
      const updated = { ...g };
      const receipt = receiptMap[g.gate_id];
      const receiptIsFresh = Boolean(sourceSha && receipt?.source_sha && receipt.source_sha === sourceSha);
      if (receiptIsFresh) {
        updated.current_status = receipt.status;
        updated.source_sha = receipt.source_sha;
        if (receipt.status === 'PASS') updated.last_passed_at = receipt.completed_at;
      } else {
        // No exact-SHA gate-specific validator → UNKNOWN. Never infer PASS from stale evidence or telemetry.
        updated.current_status = 'UNKNOWN';
        updated.source_sha = sourceSha || null;
      }
      return updated;
    });

    const readiness = computeReleaseReady(gates);

    // Persist gate results (fresh snapshot for UI + audit)
    for (const g of gates) {
      const receipt = receiptMap[g.gate_id];
      const receiptIsFresh = Boolean(sourceSha && receipt?.source_sha && receipt.source_sha === sourceSha);
      await base44.asServiceRole.entities.GateResult.create({
        gate_id: g.gate_id, category: g.category, mandatory: g.mandatory,
        status: g.current_status,
        evidence_refs: receiptIsFresh ? (receipt?.evidence_refs || []) : [],
        detail: receiptIsFresh ? `${receipt.validator_id} v${receipt.validator_version}: ${receipt.reason}` : `${g.test}; exact canonical SHA evidence missing or stale`,
        last_passed_at: g.last_passed_at, source_sha: g.source_sha || null,
        artifact_refs: receiptIsFresh ? (receipt?.artifact_refs || []) : [], evaluated_at: now,
      }).catch(() => {});
    }

    // ── 3. Open findings → repair queue ──
    const openFindings = await base44.asServiceRole.entities.Finding.filter({
      status: { $in: ['discovered', 'diagnosed', 'repair_planned', 'failed', 'blocked'] },
    }, '-discovered_at', 50).catch(() => []);

    const failingGates = gates.filter((g) => g.mandatory && (g.current_status === 'FAIL' || g.current_status === 'BLOCKED'));
    // Auto-create findings for failing mandatory gates that have no open finding for this exact source SHA.
    // A stale/foreign finding must never suppress a current-source failure.
    const existingCategories = new Set(
      openFindings
        .filter((f: any) => Boolean(sourceSha && f.source_sha && f.source_sha === sourceSha))
        .map((f: any) => f.category),
    );
    for (const g of failingGates) {
      if (existingCategories.has(g.gate_id)) continue;
      await base44.asServiceRole.entities.Finding.create({
        finding_id: uid('fnd'), subsystem: g.category.toLowerCase(), category: g.gate_id,
        severity: 'high', priority: 'p0', title: `Mandatory gate failing: ${g.gate_id}`,
        description: `${g.test} — threshold ${g.threshold}. Current: ${g.current_status}.`,
        status: 'discovered', source_sha: g.source_sha || null, discovered_at: now,
      }).catch(() => {});
    }

    // ── 4. Dispatch due repair work (safe lane only) ──
    let dispatched = 0;
    let receipts = 0;
    const pendingApprovals: any[] = [];
    const fresh = await base44.asServiceRole.entities.Finding.filter({
      status: { $in: ['discovered', 'diagnosed', 'repair_planned', 'failed', 'blocked'] },
    }, '-discovered_at', 20).catch(() => []);

    for (const finding of fresh) {
      // Never dispatch a repair from an unstamped or stale finding. Source lineage is mandatory.
      if (!sourceSha || !finding.source_sha || finding.source_sha !== sourceSha) {
        continue;
      }

      const specialist = specialistFor(finding.subsystem);
      const action = `diagnose_and_repair:${finding.category}`;
      const classification = classifyAction(action);
      if (classification === 'requires_approval') {
        pendingApprovals.push({ finding_id: finding.finding_id, action, specialist: specialist.id, reason: 'consequential action requires operator approval' });
        await base44.asServiceRole.entities.Finding.update(finding.id, { status: 'blocked', assigned_specialist: specialist.id }).catch(() => {});
        continue;
      }

      // Do not fan out the same logical repair every heartbeat while one is already active.
      const activeRepairTasks = await base44.asServiceRole.entities.RepairTask.filter({
        finding_id: finding.finding_id,
        action,
        status: { $in: ['queued', 'in_progress'] },
      }, '-created_at', 1).catch(() => []);
      if (activeRepairTasks.length > 0) continue;

      // Safe lane — dispatch via agentThink
      const taskId = uid('rt');
      const createdRepairTask = await base44.asServiceRole.entities.RepairTask.create({
        task_id: taskId, finding_id: finding.finding_id, subsystem: finding.subsystem,
        specialist: specialist.id, action, reason: finding.description,
        status: 'in_progress', approval_required: false, approval_state: 'auto_approved',
        risk_class: specialist.risk_class, source_sha_before: finding.source_sha,
        created_at: now, started_at: now,
      }).catch(() => null);
      if (!createdRepairTask?.id) continue;

      try {
        const think = await base44.asServiceRole.functions.invoke('agentThink', {
          agent_id: specialist.id, mission: specialist.mission, scope: specialist.scope,
          finding_id: finding.finding_id, context: { title: finding.title, description: finding.description, subsystem: finding.subsystem },
        }).catch(() => ({ status: 'error', message: 'agentThink unavailable' }));

        await base44.asServiceRole.entities.RepairTask.update(createdRepairTask.id, {
          status: think?.status === 'error' ? 'failed' : 'completed',
          completed_at: nowIso(), test_results: think || null,
        }).catch(() => {});

        if (think?.status !== 'error') {
          // ── 5. Independent validation ──
          const validation = await base44.asServiceRole.functions.invoke('independentValidate', {
            repair_id: taskId, finding_id: finding.finding_id, repair_agent: specialist.id,
            test_results: think || {}, source_sha: finding.source_sha,
          }).catch(() => ({ verdict: 'blocked', message: 'validator unavailable' }));

          const validationId = uid('val');
          await base44.asServiceRole.entities.ValidationReceipt.create({
            validation_id: validationId, repair_id: taskId, finding_id: finding.finding_id,
            validator_agent: CERTIFIER.id, independent: true,
            verdict: validation?.verdict || 'blocked',
            test_results: validation?.test_results || {}, regression_results: validation?.regression_results || null,
            evidence_refs: validation?.verdict === 'pass' ? [validationId] : [],
            source_sha: finding.source_sha, reasoning: validation?.reasoning || validation?.message || '',
            timestamp: nowIso(),
          }).catch(() => {});

          // ── RepairReceipt ──
          await base44.asServiceRole.entities.RepairReceipt.create({
            repair_id: uid('rr'), finding_id: finding.finding_id, task_id: taskId, subsystem: finding.subsystem,
            agent: specialist.id, source_sha_before: finding.source_sha, source_sha_after: finding.source_sha,
            files_changed: [], entities_changed: [], action, reason: finding.description,
            test_results: think || {}, validator: CERTIFIER.id, regression_results: validation?.regression_results || null,
            rollback_method: 'revert_branch_commit', approval_state: 'auto_approved', timestamp: nowIso(),
          }).catch(() => {});
          receipts++;

          // Advance finding lifecycle only on independent PASS
          if (validation?.verdict === 'pass') {
            await base44.asServiceRole.entities.Finding.update(finding.id, {
              status: 'independently_validated', assigned_specialist: specialist.id, validation_receipt_id: validationId,
            }).catch(() => {});
          } else {
            await base44.asServiceRole.entities.Finding.update(finding.id, {
              status: 'failed', assigned_specialist: specialist.id,
            }).catch(() => {});
          }
        }
        dispatched++;
      } catch (e) {
        await base44.asServiceRole.entities.RepairTask.update(createdRepairTask.id, { status: 'failed', completed_at: nowIso() }).catch(() => {});
      }
    }

    // ── 6. Mode transition logic ──
    // Count consecutive clean heartbeats only when every receipt belongs to this exact source SHA.
    // Foreign, stale, or unstamped receipts break the streak rather than contributing to release readiness.
    const recentBeats = await base44.asServiceRole.entities.HeartbeatReceipt.list('-timestamp', 6).catch(() => []);
    const cleanStreak = (() => {
      let n = 0;
      for (const b of recentBeats) {
        if (sourceSha && b.source_sha === sourceSha && b.release_ready && (b.gate_failures || []).length === 0) n++;
        else break;
      }
      return n;
    })();
    const sixClean = cleanStreak >= 6;
    const noCriticalOpen = !openFindings.some((f: any) => f.severity === 'critical' || f.severity === 'high');

    let mode: 'completion' | 'preservation' | 'incident' = 'completion';
    if (readiness.release_ready && sixClean && noCriticalOpen) mode = 'preservation';
    if (failingGates.some((g) => g.category === 'SECURITY' || g.category === 'RLS' || g.category === 'AUTH')) mode = 'incident';

    // ── 7. Update subsystem states ──
    for (const sub of SUBSYSTEMS) {
      const subFindings = openFindings.filter((f: any) => f.subsystem === sub);
      const subGates = gates.filter((g) => g.category.toLowerCase().includes(sub.slice(0, 4)));
      const health = subFindings.some((f: any) => f.severity === 'critical') ? 'critical'
        : subFindings.length > 0 ? 'degraded' : 'healthy';
      const existing = await base44.asServiceRole.entities.SubsystemState.filter({ subsystem: sub }).catch(() => []);
      const state = {
        subsystem: sub, current_mode: mode, health,
        last_heartbeat: now, open_findings: subFindings.length,
        failed_gates: subGates.filter((g) => g.current_status === 'FAIL').map((g) => g.gate_id),
        drift_detected: false, consecutive_clean_heartbeats: mode === 'preservation' ? cleanStreak : 0,
        updated_at: now,
      };
      if (existing[0]) {
        await base44.asServiceRole.entities.SubsystemState.update(existing[0].id, state).catch(() => {});
      } else {
        await base44.asServiceRole.entities.SubsystemState.create(state).catch(() => {});
      }
    }

    // ── 8. Emit HeartbeatReceipt ──
    const nextSmoke = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const nextOptimize = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const nextBenchmark = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await base44.asServiceRole.entities.HeartbeatReceipt.create({
      heartbeat_id: heartbeatId, timestamp: now, mode, lease_acquired: true, lease_owner: heartbeatId,
      jobs_due: fresh.length, jobs_dispatched: dispatched, receipts_collected: receipts,
      gate_failures: failingGates.map((g) => g.gate_id), open_findings: openFindings.length,
      release_ready: readiness.release_ready, duration_ms: Date.now() - startedAt,
      next_due_smoke: nextSmoke, next_due_optimize: nextOptimize, next_due_benchmark: nextBenchmark,
      source_sha: sourceSha,
      notes: pendingApprovals.length
        ? `${pendingApprovals.length} actions awaiting approval`
        : `source_sha=${sourceSha?.slice(0, 8) || 'none'}; telemetry=${Object.keys(telemetryDims).length} dims`,
    });

    return Response.json({
      heartbeat_id: heartbeatId, mode, release_ready: readiness.release_ready,
      mandatory_pass: readiness.mandatory_pass, mandatory_total: readiness.mandatory_total,
      mandatory_fail: readiness.failing.length, mandatory_unknown: readiness.unknown.length,
      source_sha: sourceSha,
      failing_gates: readiness.failing.map((g) => g.gate_id),
      unknown_gates: readiness.unknown.map((g) => g.gate_id),
      wave1_results: Object.fromEntries(Object.entries(receiptMap).map(([k, v]: [string, any]) => [k, v.status])),
      jobs_due: fresh.length, jobs_dispatched: dispatched, receipts_collected: receipts,
      pending_approvals: pendingApprovals, duration_ms: Date.now() - startedAt, timestamp: now,
    });
  } catch (error) {
    console.error('alphaPrime error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}