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

    // ── 2. Recompute gates from existing validators ──
    let preflight: any = null;
    let audit: any = null;
    try {
      preflight = await base44.asServiceRole.functions.invoke('systemPreflight', {});
    } catch (e) { /* may fail — that itself is a finding */ }
    try {
      audit = await base44.asServiceRole.functions.invoke('systemAudit', {});
    } catch (e) { /* may fail */ }

    // Map validator outputs onto the constitution gates.
    // preflight.dimensions is an ARRAY of { dimension, score, status, findings }.
    // We map known dimension names to specific gate_ids; unmapped gates stay UNKNOWN (honest).
    const dimMap: Record<string, number> = {};
    if (Array.isArray(preflight?.dimensions)) {
      for (const d of preflight.dimensions) dimMap[d.dimension] = d.score;
    }
    const DIM_TO_GATE: Record<string, string[]> = {
      data_acquisition: ['ingest.scrape_success'],
      scraping_engine: ['browser.engine_reachable', 'ingest.scrape_success'],
      normalization: ['dq.ownership_coverage'],
      sources_seeds: ['ingest.florida_only'],
      enrichment: ['dq.title_risk_coverage', 'dq.image_coverage'],
      owner_identification: ['dq.ownership_coverage'],
      security_compliance: ['security.input_validation', 'rls.admin_only_entities'],
      system_intelligence: ['ai.gateway_available'],
      seo_visibility: ['seo.sitemap_valid', 'seo.indexability'],
      outreach_engine: ['agents.governance_loop'],
    };
    const gateScores: Record<string, number> = {};
    for (const [dim, gateIds] of Object.entries(DIM_TO_GATE)) {
      const score = dimMap[dim];
      if (score !== undefined) for (const gid of gateIds) gateScores[gid] = score;
    }

    const gates = RELEASE_CONSTITUTION.map((g) => {
      const updated = { ...g };
      const score = gateScores[g.gate_id];
      if (score !== undefined) {
        updated.current_status = score >= 80 ? 'PASS' : 'FAIL';
        if (score >= 80) updated.last_passed_at = now;
      }
      // Validators that failed to invoke are themselves failures
      if (g.gate_id === 'backend.functions_deploy' && !preflight) updated.current_status = 'FAIL';
      if (g.gate_id === 'obs.logs_available' && !audit) updated.current_status = 'FAIL';
      return updated;
    });

    const readiness = computeReleaseReady(gates);

    // Persist gate results
    for (const g of gates) {
      await base44.asServiceRole.entities.GateResult.create({
        gate_id: g.gate_id, category: g.category, mandatory: g.mandatory,
        status: g.current_status, evidence_refs: g.current_status === 'PASS' ? [g.validator] : [],
        detail: g.test, last_passed_at: g.last_passed_at, source_sha: g.source_sha || null,
        artifact_refs: g.artifact_refs, evaluated_at: now,
      }).catch(() => {});
    }

    // ── 3. Open findings → repair queue ──
    const openFindings = await base44.asServiceRole.entities.Finding.filter({
      status: { $in: ['discovered', 'diagnosed', 'repair_planned', 'failed', 'blocked'] },
    }, '-discovered_at', 50).catch(() => []);

    const failingGates = gates.filter((g) => g.mandatory && (g.current_status === 'FAIL' || g.current_status === 'BLOCKED'));
    // Auto-create findings for failing mandatory gates that have no open finding yet
    const existingCategories = new Set(openFindings.map((f: any) => f.category));
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
      const specialist = specialistFor(finding.subsystem);
      const action = `diagnose_and_repair:${finding.category}`;
      const classification = classifyAction(action);
      if (classification === 'requires_approval') {
        pendingApprovals.push({ finding_id: finding.finding_id, action, specialist: specialist.id, reason: 'consequential action requires operator approval' });
        await base44.asServiceRole.entities.Finding.update(finding.id, { status: 'blocked', assigned_specialist: specialist.id }).catch(() => {});
        continue;
      }
      // Safe lane — dispatch via agentThink
      const taskId = uid('rt');
      await base44.asServiceRole.entities.RepairTask.create({
        task_id: taskId, finding_id: finding.finding_id, subsystem: finding.subsystem,
        specialist: specialist.id, action, reason: finding.description,
        status: 'in_progress', approval_required: false, approval_state: 'auto_approved',
        risk_class: specialist.risk_class, source_sha_before: finding.source_sha || null,
        created_at: now, started_at: now,
      }).catch(() => {});

      try {
        const think = await base44.asServiceRole.functions.invoke('agentThink', {
          agent_id: specialist.id, mission: specialist.mission, scope: specialist.scope,
          finding_id: finding.finding_id, context: { title: finding.title, description: finding.description, subsystem: finding.subsystem },
        }).catch(() => ({ status: 'error', message: 'agentThink unavailable' }));

        await base44.asServiceRole.entities.RepairTask.update(taskId, {
          status: think?.status === 'error' ? 'failed' : 'completed',
          completed_at: nowIso(), test_results: think || null,
        }).catch(() => {});

        if (think?.status !== 'error') {
          // ── 5. Independent validation ──
          const validation = await base44.asServiceRole.functions.invoke('independentValidate', {
            repair_id: taskId, finding_id: finding.finding_id, repair_agent: specialist.id,
            test_results: think || {}, source_sha: finding.source_sha || null,
          }).catch(() => ({ verdict: 'blocked', message: 'validator unavailable' }));

          const validationId = uid('val');
          await base44.asServiceRole.entities.ValidationReceipt.create({
            validation_id: validationId, repair_id: taskId, finding_id: finding.finding_id,
            validator_agent: CERTIFIER.id, independent: true,
            verdict: validation?.verdict || 'blocked',
            test_results: validation?.test_results || {}, regression_results: validation?.regression_results || null,
            evidence_refs: validation?.verdict === 'pass' ? [validationId] : [],
            source_sha: finding.source_sha || null, reasoning: validation?.reasoning || validation?.message || '',
            timestamp: nowIso(),
          }).catch(() => {});

          // ── RepairReceipt ──
          await base44.asServiceRole.entities.RepairReceipt.create({
            repair_id: uid('rr'), finding_id: finding.finding_id, task_id: taskId, subsystem: finding.subsystem,
            agent: specialist.id, source_sha_before: finding.source_sha || '', source_sha_after: finding.source_sha || '',
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
        await base44.asServiceRole.entities.RepairTask.update(taskId, { status: 'failed', completed_at: nowIso() }).catch(() => {});
      }
    }

    // ── 6. Mode transition logic ──
    // Count consecutive clean heartbeats from the most recent receipts
    const recentBeats = await base44.asServiceRole.entities.HeartbeatReceipt.list('-timestamp', 6).catch(() => []);
    const cleanStreak = (() => {
      let n = 0;
      for (const b of recentBeats) {
        if (b.release_ready && (b.gate_failures || []).length === 0) n++;
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
      source_sha: null, notes: pendingApprovals.length ? `${pendingApprovals.length} actions awaiting approval` : '',
    });

    return Response.json({
      heartbeat_id: heartbeatId, mode, release_ready: readiness.release_ready,
      mandatory_pass: readiness.mandatory_pass, mandatory_total: readiness.mandatory_total,
      failing_gates: readiness.failing.map((g) => g.gate_id),
      unknown_gates: readiness.unknown.map((g) => g.gate_id),
      jobs_due: fresh.length, jobs_dispatched: dispatched, receipts_collected: receipts,
      pending_approvals: pendingApprovals, duration_ms: Date.now() - startedAt, timestamp: now,
    });
  } catch (error) {
    console.error('alphaPrime error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}