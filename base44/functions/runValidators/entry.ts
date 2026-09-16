import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import {
  buildReceipt, resolveSourceSha, fetchCheckRuns, findCheckRun,
  SCHEDULER_INVENTORY, WAVE1_VALIDATORS, VALIDATOR_VERSION,
  type ValidatorReceipt, type GithubSecrets,
} from '../../shared/validatorContract.ts';
import { RELEASE_CONSTITUTION } from '../../shared/releaseConstitution.ts';

/**
 * VALIDATOR FACTORY — Wave 1
 *
 * Runs deterministic gate-specific validators and persists evidence.
 *
 * Wave 1 gates:
 *   1. ci.sha_stamped         — all Wave 1 receipts stamp a matching source SHA
 *   2. code.build             — GitHub Actions check run "build" for the canonical SHA
 *   3. code.lint              — GitHub Actions check run "lint" for the canonical SHA
 *   4. code.typecheck         — GitHub Actions check run "typecheck" for the canonical SHA
 *   5. workflows.heartbeat_active — HeartbeatReceipt history probe (cadence + advancing)
 *   6. workflows.no_duplicate_cron — scheduler inventory audit (conflicting authorities)
 *
 * PASS requires evidence. UNKNOWN creates validation work. FAIL creates repair work.
 * Source SHA is resolved from GitHub and stamped on every receipt.
 */

function uid(prefix: string) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }

export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const startedAt = Date.now();
    const now = new Date().toISOString();
    const runtimeSecrets: any = (await import('base44:runtime')).secrets;
    const secrets: GithubSecrets = {
      // HPI validators must resolve the canonical repository deterministically.
      // Repository/branch identity is not allowed to drift via mutable runtime config.
      GITHUB_REPO: 'XTREME-SYSTEMS/hidden-property-intel',
      GITHUB_TOKEN: runtimeSecrets.get ? runtimeSecrets.get('GITHUB_TOKEN') : (runtimeSecrets.GITHUB_TOKEN || ''),
      GITHUB_BASE_BRANCH: 'main',
    };

    // ── 1. Resolve source SHA ──
    const shaResult = await resolveSourceSha(secrets);
    const sourceSha = shaResult.sha;

    // ── 2. Fetch GitHub Actions check runs for the SHA ──
    const checkRuns = await fetchCheckRuns(secrets, sourceSha || '');

    // ── 3. Run Wave 1 validators (ci.sha_stamped computed last from the others) ──
    const receipts: ValidatorReceipt[] = [];

    // code.build
    receipts.push(validateCodeGate('code.build', checkRuns, sourceSha, 'build', 'npm run build (vite build)'));
    // code.lint
    receipts.push(validateCodeGate('code.lint', checkRuns, sourceSha, 'lint', 'npm run lint (eslint . --quiet)'));
    // code.typecheck
    receipts.push(validateCodeGate('code.typecheck', checkRuns, sourceSha, 'typecheck', 'npm run typecheck (tsc -p ./jsconfig.json)'));

    // workflows.heartbeat_active
    const heartbeats = await base44.asServiceRole.entities.HeartbeatReceipt.list('-timestamp', 10).catch(() => []);
    receipts.push(validateHeartbeatActive(heartbeats, sourceSha));

    // workflows.no_duplicate_cron
    receipts.push(validateNoDuplicateCron(sourceSha));

    // ci.sha_stamped — computed from the other receipts
    receipts.push(validateShaStamped(receipts, sourceSha));

    // ── 4. Persist GateResults ──
    const gateMap = new Map(RELEASE_CONSTITUTION.map((g) => [g.gate_id, g]));
    for (const r of receipts) {
      const gate = gateMap.get(r.gate_id);
      await base44.asServiceRole.entities.GateResult.create({
        gate_id: r.gate_id,
        category: gate?.category || 'CODE',
        mandatory: gate?.mandatory ?? true,
        status: r.status,
        evidence_refs: r.evidence_refs,
        detail: `${r.validator_id} v${r.validator_version}: ${r.reason}`,
        last_passed_at: r.status === 'PASS' ? r.completed_at : null,
        source_sha: r.source_sha,
        artifact_refs: r.artifact_refs,
        evaluated_at: r.completed_at,
      }).catch(() => {});
    }

    // ── 5. FAIL → create/update Findings (repair work) ──
    const failing = receipts.filter((r) => r.status === 'FAIL');
    for (const r of failing) {
      const existing = await base44.asServiceRole.entities.Finding.filter({ category: r.gate_id, status: { $in: ['discovered', 'diagnosed', 'repair_planned', 'failed', 'blocked'] } }, '-discovered_at', 1).catch(() => []);
      if (existing[0]) continue;
      await base44.asServiceRole.entities.Finding.create({
        finding_id: uid('fnd'), subsystem: (gateMap.get(r.gate_id)?.category || 'CODE').toLowerCase(),
        category: r.gate_id, severity: 'high', priority: 'p0',
        title: `Validator FAIL: ${r.gate_id}`,
        description: `${r.reason}\nValidator: ${r.validator_id}\nCommand: ${r.command_or_probe}\nExit: ${r.exit_code}\nSHA: ${r.source_sha || 'none'}`,
        status: 'discovered', source_sha: r.source_sha || null, discovered_at: now,
      }).catch(() => {});
    }

    // ── 6. UNKNOWN → create/update ValidationTasks (validation work) ──
    const unknown = receipts.filter((r) => r.status === 'UNKNOWN');
    for (const r of unknown) {
      await upsertValidationTask(base44, {
        gate_id: r.gate_id, validator_id: r.validator_id, status: 'VALIDATOR_REQUIRED',
        source_sha: r.source_sha, reason: r.reason, blocker: r.stderr_summary || r.reason,
        wave: 'wave1', now,
      });
    }

    // Also create ValidationTasks for all other mandatory UNKNOWN gates without a Wave 1 validator
    const wave1Set = new Set(WAVE1_VALIDATORS);
    const otherMandatory = RELEASE_CONSTITUTION.filter((g) => g.mandatory && !wave1Set.has(g.gate_id));
    for (const g of otherMandatory) {
      await upsertValidationTask(base44, {
        gate_id: g.gate_id, validator_id: 'unimplemented', status: 'VALIDATOR_REQUIRED',
        source_sha: sourceSha, reason: 'No gate-specific validator implemented yet (Wave 2+).',
        blocker: 'validator not implemented', wave: 'unassigned', now,
      });
    }

    return Response.json({
      source_sha: sourceSha,
      source_branch: shaResult.branch,
      source_sha_error: shaResult.error || null,
      check_runs_found: checkRuns.length,
      receipts,
      wave1_results: Object.fromEntries(receipts.map((r) => [r.gate_id, r.status])),
      duration_ms: Date.now() - startedAt,
      timestamp: now,
    });
  } catch (error) {
    console.error('runValidators error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ── Validator implementations ──

function validateCodeGate(
  gate_id: string, checkRuns: any[], sourceSha: string | null, pattern: string, command: string,
): ValidatorReceipt {
  if (!sourceSha) {
    return buildReceipt({
      gate_id, validator_id: 'github_check_run_probe', status: 'BLOCKED',
      source_sha: null, threshold: 'check run conclusion = success',
      command_or_probe: `GitHub check-runs for '${pattern}'`,
      reason: 'Could not resolve source SHA — cannot evaluate CI evidence.',
    });
  }
  const cr = findCheckRun(checkRuns, pattern);
  if (!cr) {
    return buildReceipt({
      gate_id, validator_id: 'github_check_run_probe', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold: 'check run conclusion = success',
      command_or_probe: `GitHub check-runs matching '${pattern}' for SHA ${sourceSha.slice(0, 8)}`,
      reason: `No GitHub Actions check run matching '${pattern}' found for SHA ${sourceSha.slice(0, 8)}. CI not configured for this gate.`,
      stderr_summary: `check run '${pattern}' absent`,
    });
  }
  if (cr.status !== 'completed') {
    return buildReceipt({
      gate_id, validator_id: 'github_check_run_probe', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: cr.status, threshold: 'check run completed + conclusion = success',
      command_or_probe: `GitHub check-run '${cr.name}'`,
      reason: `Check run '${cr.name}' not completed (status: ${cr.status}).`,
    });
  }
  const pass = cr.conclusion === 'success';
  return buildReceipt({
    gate_id, validator_id: 'github_check_run_probe', status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha, metric_value: cr.conclusion, threshold: 'check run conclusion = success',
    command_or_probe: `${command} → GitHub check-run '${cr.name}'`,
    exit_code: pass ? 0 : 1,
    evidence_refs: pass ? [cr.url || cr.name] : [],
    stdout_summary: `check run '${cr.name}' conclusion=${cr.conclusion}`,
    reason: pass
      ? `GitHub Actions check run '${cr.name}' completed with conclusion 'success' for SHA ${sourceSha.slice(0, 8)}.`
      : `GitHub Actions check run '${cr.name}' completed with conclusion '${cr.conclusion}' for SHA ${sourceSha.slice(0, 8)}.`,
  });
}

function validateHeartbeatActive(heartbeats: any[], sourceSha: string | null): ValidatorReceipt {
  const now = Date.now();
  const windowMs = 20 * 60 * 1000; // 4 cadences at */5
  const recent = heartbeats.filter((h) => now - new Date(h.timestamp).getTime() < windowMs);
  if (recent.length < 3) {
    return buildReceipt({
      gate_id: 'workflows.heartbeat_active', validator_id: 'heartbeat_history_probe', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: recent.length, threshold: '>= 3 advancing receipts in 20 min, max gap <= 15 min',
      command_or_probe: 'HeartbeatReceipt.list(-timestamp, 10)',
      reason: `Insufficient heartbeat history: ${recent.length} receipt(s) in last 20 min. A single manually invoked heartbeat is not sufficient proof.`,
      stderr_summary: `${recent.length} recent receipts (need >= 3)`,
    });
  }
  const sorted = [...recent].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  let advancing = true;
  let maxGap = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = new Date(sorted[i].timestamp).getTime() - new Date(sorted[i - 1].timestamp).getTime();
    if (gap <= 0) advancing = false;
    if (gap > maxGap) maxGap = gap;
  }
  const maxGapMin = maxGap / 60000;
  if (advancing && maxGapMin <= 15) {
    return buildReceipt({
      gate_id: 'workflows.heartbeat_active', validator_id: 'heartbeat_history_probe', status: 'PASS',
      source_sha: sourceSha, metric_value: recent.length, threshold: '>= 3 advancing receipts, max gap <= 15 min',
      command_or_probe: 'HeartbeatReceipt.list(-timestamp, 10)',
      evidence_refs: recent.map((r) => r.heartbeat_id),
      reason: `${recent.length} advancing heartbeat receipts in last 20 min, max gap ${maxGapMin.toFixed(1)} min. Governor is alive.`,
    });
  }
  return buildReceipt({
    gate_id: 'workflows.heartbeat_active', validator_id: 'heartbeat_history_probe', status: 'FAIL',
    source_sha: sourceSha, metric_value: recent.length, threshold: 'advancing timestamps, max gap <= 15 min',
    command_or_probe: 'HeartbeatReceipt.list(-timestamp, 10)',
    reason: `Heartbeats not advancing properly or gap too large (max gap ${maxGapMin.toFixed(1)} min). Governor may be stalled.`,
    stderr_summary: `advancing=${advancing} maxGap=${maxGapMin.toFixed(1)}min`,
  });
}

function validateNoDuplicateCron(sourceSha: string | null): ValidatorReceipt {
  const conflicting = SCHEDULER_INVENTORY.filter((s) => s.conflicts_with_governor);
  if (conflicting.length === 0) {
    return buildReceipt({
      gate_id: 'workflows.no_duplicate_cron', validator_id: 'scheduler_inventory_audit', status: 'PASS',
      source_sha: sourceSha, metric_value: 0, threshold: '0 conflicting independent schedulers',
      command_or_probe: 'SCHEDULER_INVENTORY audit',
      evidence_refs: ['alpha_prime_heartbeat'],
      reason: 'No conflicting independent schedulers. Alpha Prime is the sole governing scheduler.',
    });
  }
  return buildReceipt({
    gate_id: 'workflows.no_duplicate_cron', validator_id: 'scheduler_inventory_audit', status: 'FAIL',
    source_sha: sourceSha, metric_value: conflicting.length, threshold: '0 conflicting independent schedulers',
    command_or_probe: 'SCHEDULER_INVENTORY audit',
    reason: `${conflicting.length} conflicting independent scheduler(s) found outside governor architecture. Consolidation requires operator approval — no scheduler disabled automatically.`,
    stdout_summary: conflicting.map((s) => `${s.id} (${s.authority}, ${s.schedule})`).join('; '),
    stderr_summary: conflicting.map((s) => `${s.id}: ${s.proposed_consolidation}`).join(' | '),
  });
}

function validateShaStamped(otherReceipts: ValidatorReceipt[], resolvedSha: string | null): ValidatorReceipt {
  if (!resolvedSha) {
    return buildReceipt({
      gate_id: 'ci.sha_stamped', validator_id: 'sha_stamp_audit', status: 'BLOCKED',
      source_sha: null, threshold: 'all receipts stamp matching source SHA',
      command_or_probe: 'resolveSourceSha + receipt audit',
      reason: 'Could not resolve source SHA — cannot evaluate SHA lineage.',
    });
  }
  if (otherReceipts.length === 0) {
    return buildReceipt({
      gate_id: 'ci.sha_stamped', validator_id: 'sha_stamp_audit', status: 'UNKNOWN',
      source_sha: resolvedSha, threshold: 'all receipts stamp matching source SHA',
      command_or_probe: 'receipt audit',
      reason: 'No validator receipts exist to evaluate SHA lineage.',
    });
  }
  const stamped = otherReceipts.filter((r) => r.source_sha && r.source_sha === resolvedSha);
  const missing = otherReceipts.filter((r) => !r.source_sha || r.source_sha !== resolvedSha);
  if (missing.length === 0 && stamped.length > 0) {
    return buildReceipt({
      gate_id: 'ci.sha_stamped', validator_id: 'sha_stamp_audit', status: 'PASS',
      source_sha: resolvedSha, metric_value: stamped.length, threshold: 'all receipts stamp matching source SHA',
      command_or_probe: 'receipt audit',
      evidence_refs: stamped.map((r) => r.gate_id),
      reason: `All ${stamped.length} Wave 1 validator receipts stamp matching source SHA ${resolvedSha.slice(0, 8)}.`,
    });
  }
  return buildReceipt({
    gate_id: 'ci.sha_stamped', validator_id: 'sha_stamp_audit', status: 'FAIL',
    source_sha: resolvedSha, metric_value: stamped.length, threshold: 'all receipts stamp matching source SHA',
    command_or_probe: 'receipt audit',
    reason: `${missing.length} receipt(s) omit or mismatch source SHA ${resolvedSha.slice(0, 8)}.`,
    stdout_summary: `stamped=${stamped.length}/${otherReceipts.length}`,
    stderr_summary: missing.map((r) => `${r.gate_id} (sha=${r.source_sha || 'null'})`).join(', '),
  });
}

// ── ValidationTask upsert (deduplicated per gate_id) ──
async function upsertValidationTask(base44: any, args: {
  gate_id: string; validator_id: string; status: string; source_sha: string | null;
  reason: string; blocker: string; wave: string; now: string;
}) {
  const existing = await base44.asServiceRole.entities.ValidationTask.filter({ gate_id: args.gate_id }, '-updated_at', 1).catch(() => []);
  const nextAttempt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  if (existing[0]) {
    // Only update if status/reason changed
    const e = existing[0];
    if (e.status === 'PASS' || e.status === 'FAIL') return; // don't reopen resolved tasks
    await base44.asServiceRole.entities.ValidationTask.update(e.id, {
      status: args.status, validator_id: args.validator_id, source_sha: args.source_sha,
      reason: args.reason, blocker: args.blocker, wave: args.wave,
      last_attempt_at: args.now, next_attempt_at: nextAttempt, updated_at: args.now,
    }).catch(() => {});
  } else {
    await base44.asServiceRole.entities.ValidationTask.create({
      validation_task_id: uid('vt'), gate_id: args.gate_id, validator_id: args.validator_id,
      priority: 'p1', status: args.status, source_sha: args.source_sha, reason: args.reason,
      attempt_count: 0, last_attempt_at: args.now, next_attempt_at: nextAttempt,
      evidence_refs: [], blocker: args.blocker, wave: args.wave,
      created_at: args.now, updated_at: args.now,
    }).catch(() => {});
  }
}