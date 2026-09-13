import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import {
  buildReceipt, resolveSourceSha, fetchCheckRuns, findCheckRun,
  SCHEDULER_INVENTORY,
  type ValidatorReceipt, type GithubSecrets,
} from '../../shared/validatorContract.ts';
import { RELEASE_CONSTITUTION } from '../../shared/releaseConstitution.ts';

/**
 * ALPHA PRIME VALIDATOR FACTORY — Autonomous Mega-Wave Worker
 *
 * The five-minute governor calls this function every heartbeat.
 * Deterministic validator receipts are authoritative release evidence.
 * UNKNOWN creates validation work. FAIL creates repair work. BLOCKED creates escalation.
 * PASS requires evidence and current source SHA lineage.
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
      GITHUB_REPO: runtimeSecrets.get ? runtimeSecrets.get('GITHUB_REPO') : (runtimeSecrets.GITHUB_REPO || ''),
      GITHUB_TOKEN: runtimeSecrets.get ? runtimeSecrets.get('GITHUB_TOKEN') : (runtimeSecrets.GITHUB_TOKEN || ''),
      GITHUB_BASE_BRANCH: (runtimeSecrets.get ? runtimeSecrets.get('GITHUB_BASE_BRANCH') : runtimeSecrets.GITHUB_BASE_BRANCH) || 'main',
    };

    // 1. Resolve exact canonical source SHA.
    const shaResult = await resolveSourceSha(secrets);
    const sourceSha = shaResult.sha;

    // 2. Pull deterministic GitHub check-run evidence for this SHA.
    const checkRuns = await fetchCheckRuns(secrets, sourceSha || '');
    const receipts: ValidatorReceipt[] = [];

    // CODE + CI
    receipts.push(validateCheckRunGate('code.build', checkRuns, sourceSha, 'build', 'npm run build'));
    receipts.push(validateCheckRunGate('code.lint', checkRuns, sourceSha, 'lint', 'npm run lint'));
    receipts.push(validateCheckRunGate('code.typecheck', checkRuns, sourceSha, 'typecheck', 'npm run typecheck'));

    // SECURITY + DATABASE static deterministic CI
    receipts.push(validateCheckRunGate('security.dependency_scan', checkRuns, sourceSha, 'dependency-scan', 'npm audit --audit-level=critical'));
    receipts.push(validateCheckRunGate('security.secret_scan', checkRuns, sourceSha, 'secret-scan', 'repository secret scan'));
    receipts.push(validateCheckRunGate('security.input_validation', checkRuns, sourceSha, 'input-validation', 'static function-input validation audit'));
    receipts.push(validateCheckRunGate('db.schema_valid', checkRuns, sourceSha, 'schema-valid', 'entity schema JSONC audit'));
    receipts.push(validateCheckRunGate('db.no_oversized_fields', checkRuns, sourceSha, 'oversized-fields', 'entity oversized-field audit'));
    receipts.push(validateCheckRunGate('contracts.deploy_safety', checkRuns, sourceSha, 'contract-safety', 'live-chain mutation primitive audit'));

    // WORKFLOWS
    const heartbeats = await base44.asServiceRole.entities.HeartbeatReceipt.list('-timestamp', 10).catch(() => []);
    receipts.push(validateHeartbeatActive(heartbeats, sourceSha));
    receipts.push(validateNoDuplicateCron(sourceSha));

    // RUNTIME + GOVERNANCE validators
    receipts.push(await validateBackendApiSmoke(base44, sourceSha));
    receipts.push(await validateAgentGovernance(base44, sourceSha));
    receipts.push(await validateRollbackMethods(base44, sourceSha));
    receipts.push(await validateRequiredChecks(secrets, sourceSha, shaResult.branch || secrets.GITHUB_BASE_BRANCH || 'main'));

    // SHA lineage is computed last against every implemented receipt above.
    receipts.push(validateShaStamped(receipts, sourceSha));

    // 3. Persist current gate evidence.
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
      await syncValidationTask(base44, r, now);
    }

    // 4. FAIL -> Finding. Alpha Prime handles risk classification + safe repair routing.
    for (const r of receipts.filter((x) => x.status === 'FAIL')) {
      const existing = await base44.asServiceRole.entities.Finding.filter({
        category: r.gate_id,
        status: { $in: ['discovered', 'diagnosed', 'repair_planned', 'repair_implemented', 'tested', 'failed', 'blocked'] },
      }, '-discovered_at', 1).catch(() => []);
      if (existing[0]) continue;
      await base44.asServiceRole.entities.Finding.create({
        finding_id: uid('fnd'),
        subsystem: (gateMap.get(r.gate_id)?.category || 'CODE').toLowerCase(),
        category: r.gate_id,
        severity: 'high',
        priority: 'p0',
        title: `Validator FAIL: ${r.gate_id}`,
        description: `${r.reason}\nValidator: ${r.validator_id}\nProbe: ${r.command_or_probe}\nExit: ${r.exit_code}\nSHA: ${r.source_sha || 'none'}`,
        status: 'discovered',
        source_sha: r.source_sha || null,
        discovered_at: now,
      }).catch(() => {});
    }

    // 5. Any mandatory gate with no implemented receipt remains actionable UNKNOWN.
    const implemented = new Set(receipts.map((r) => r.gate_id));
    const unimplementedMandatory = RELEASE_CONSTITUTION.filter((g) => g.mandatory && !implemented.has(g.gate_id));
    for (const g of unimplementedMandatory) {
      await upsertValidationTask(base44, {
        gate_id: g.gate_id,
        validator_id: 'unimplemented',
        status: 'VALIDATOR_REQUIRED',
        source_sha: sourceSha,
        reason: 'No deterministic gate-specific validator implemented yet. Autonomous completion watchdog must implement the next safe validator packet.',
        blocker: 'validator not implemented',
        wave: 'autonomous_completion',
        now,
      });
    }

    const results = Object.fromEntries(receipts.map((r) => [r.gate_id, r.status]));
    return Response.json({
      source_sha: sourceSha,
      source_branch: shaResult.branch,
      source_sha_error: shaResult.error || null,
      check_runs_found: checkRuns.length,
      receipts,
      validator_results: results,
      wave1_results: results,
      implemented_validator_count: receipts.length,
      unimplemented_mandatory_count: unimplementedMandatory.length,
      unimplemented_mandatory_gates: unimplementedMandatory.map((g) => g.gate_id),
      duration_ms: Date.now() - startedAt,
      timestamp: now,
    });
  } catch (error) {
    console.error('runValidators error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function validateCheckRunGate(
  gate_id: string,
  checkRuns: any[],
  sourceSha: string | null,
  pattern: string,
  command: string,
): ValidatorReceipt {
  if (!sourceSha) {
    return buildReceipt({
      gate_id, validator_id: 'github_check_run_probe', status: 'BLOCKED',
      source_sha: null, threshold: 'check run conclusion = success',
      command_or_probe: `GitHub check-runs for '${pattern}'`,
      reason: 'Could not resolve source SHA; deterministic CI evidence cannot be attached to source.',
    });
  }
  const cr = findCheckRun(checkRuns, pattern);
  if (!cr) {
    return buildReceipt({
      gate_id, validator_id: 'github_check_run_probe', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold: 'check run conclusion = success',
      command_or_probe: `GitHub check-runs matching '${pattern}' for SHA ${sourceSha.slice(0, 8)}`,
      reason: `No completed check-run matching '${pattern}' exists for current SHA ${sourceSha.slice(0, 8)}.`,
      stderr_summary: `check run '${pattern}' absent`,
    });
  }
  if (cr.status !== 'completed') {
    return buildReceipt({
      gate_id, validator_id: 'github_check_run_probe', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: cr.status, threshold: 'completed + success',
      command_or_probe: `GitHub check-run '${cr.name}'`,
      reason: `Check-run '${cr.name}' is not complete (status=${cr.status}).`,
    });
  }
  const pass = cr.conclusion === 'success';
  return buildReceipt({
    gate_id, validator_id: 'github_check_run_probe', status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha, metric_value: cr.conclusion, threshold: 'check run conclusion = success',
    command_or_probe: `${command} -> '${cr.name}'`,
    exit_code: pass ? 0 : 1,
    evidence_refs: [cr.url || cr.name],
    stdout_summary: `check-run '${cr.name}' conclusion=${cr.conclusion}`,
    reason: pass
      ? `Deterministic check '${cr.name}' passed for SHA ${sourceSha.slice(0, 8)}.`
      : `Deterministic check '${cr.name}' failed with conclusion '${cr.conclusion}' for SHA ${sourceSha.slice(0, 8)}.`,
  });
}

function validateHeartbeatActive(heartbeats: any[], sourceSha: string | null): ValidatorReceipt {
  const now = Date.now();
  const recent = heartbeats.filter((h) => now - new Date(h.timestamp).getTime() < 20 * 60 * 1000);
  if (recent.length < 3) {
    return buildReceipt({
      gate_id: 'workflows.heartbeat_active', validator_id: 'heartbeat_history_probe', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: recent.length,
      threshold: '>=3 advancing receipts in 20m; max gap <=15m',
      command_or_probe: 'HeartbeatReceipt.list(-timestamp,10)',
      reason: `Only ${recent.length} recent heartbeat receipt(s); insufficient cadence proof.`,
    });
  }
  const sorted = [...recent].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  let advancing = true;
  let maxGap = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = new Date(sorted[i].timestamp).getTime() - new Date(sorted[i - 1].timestamp).getTime();
    if (gap <= 0) advancing = false;
    maxGap = Math.max(maxGap, gap);
  }
  const maxGapMin = maxGap / 60000;
  const pass = advancing && maxGapMin <= 15;
  return buildReceipt({
    gate_id: 'workflows.heartbeat_active', validator_id: 'heartbeat_history_probe', status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha, metric_value: recent.length,
    threshold: '>=3 advancing receipts in 20m; max gap <=15m',
    command_or_probe: 'HeartbeatReceipt.list(-timestamp,10)',
    evidence_refs: recent.map((r) => r.heartbeat_id).filter(Boolean),
    reason: pass
      ? `${recent.length} advancing heartbeats; max gap ${maxGapMin.toFixed(1)}m.`
      : `Heartbeat cadence invalid: advancing=${advancing}, max gap=${maxGapMin.toFixed(1)}m.`,
  });
}

function validateNoDuplicateCron(sourceSha: string | null): ValidatorReceipt {
  const conflicting = SCHEDULER_INVENTORY.filter((s) => s.conflicts_with_governor);
  const pass = conflicting.length === 0;
  return buildReceipt({
    gate_id: 'workflows.no_duplicate_cron', validator_id: 'scheduler_inventory_audit', status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha, metric_value: conflicting.length, threshold: '0 conflicting independent schedulers',
    command_or_probe: 'SCHEDULER_INVENTORY audit',
    evidence_refs: pass ? ['alpha_prime_heartbeat'] : conflicting.map((s) => s.config_reference),
    stdout_summary: conflicting.map((s) => `${s.id} (${s.authority}, ${s.schedule})`).join('; '),
    stderr_summary: conflicting.map((s) => `${s.id}: ${s.proposed_consolidation}`).join(' | '),
    reason: pass
      ? 'No conflicting independent scheduler remains.'
      : `${conflicting.length} conflicting scheduler(s) remain. Production scheduler removal is approval-gated; the rest of the mission must continue.`,
  });
}

async function validateBackendApiSmoke(base44: any, sourceSha: string | null): Promise<ValidatorReceipt> {
  try {
    const result = await base44.asServiceRole.functions.invoke('systemPreflight', {});
    const data = result?.data ?? result;
    const ok = data && !data.error;
    return buildReceipt({
      gate_id: 'backend.api_smoke', validator_id: 'critical_function_smoke', status: ok ? 'PASS' : 'FAIL',
      source_sha: sourceSha, metric_value: ok ? 1 : 0, threshold: 'critical read-only function returns structured response',
      command_or_probe: 'functions.invoke(systemPreflight)',
      exit_code: ok ? 0 : 1,
      evidence_refs: ok ? ['systemPreflight'] : [],
      reason: ok ? 'Critical backend function invocation returned a structured response.' : 'systemPreflight returned an error/empty response.',
    });
  } catch (e) {
    return buildReceipt({
      gate_id: 'backend.api_smoke', validator_id: 'critical_function_smoke', status: 'FAIL',
      source_sha: sourceSha, metric_value: 0, threshold: 'critical read-only function returns structured response',
      command_or_probe: 'functions.invoke(systemPreflight)',
      exit_code: 1, stderr_summary: e.message,
      reason: `Critical backend function invocation failed: ${e.message}`,
    });
  }
}

async function validateAgentGovernance(base44: any, sourceSha: string | null): Promise<ValidatorReceipt> {
  const tasks = await base44.asServiceRole.entities.RepairTask.list('-created_at', 500).catch(() => []);
  const violations = tasks.filter((t: any) =>
    (t.risk_class === 'consequential' || t.risk_class === 'irreversible') &&
    (t.approval_state === 'auto_approved' || t.approval_state === 'not_required')
  );
  return buildReceipt({
    gate_id: 'agents.governance_loop', validator_id: 'repair_task_governance_audit',
    status: violations.length === 0 ? 'PASS' : 'FAIL',
    source_sha: sourceSha, metric_value: violations.length, threshold: '0 consequential/irreversible auto-approved repair tasks',
    command_or_probe: 'RepairTask.list(-created_at,500)',
    evidence_refs: tasks.slice(0, 25).map((t: any) => t.task_id).filter(Boolean),
    reason: violations.length === 0
      ? `No approval-bypass violations found across ${tasks.length} recent repair task(s).`
      : `${violations.length} consequential/irreversible repair task(s) bypassed required approval.`,
  });
}

async function validateRollbackMethods(base44: any, sourceSha: string | null): Promise<ValidatorReceipt> {
  const rows = await base44.asServiceRole.entities.RepairReceipt.list('-timestamp', 500).catch(() => []);
  if (rows.length === 0) {
    return buildReceipt({
      gate_id: 'rollback.method_recorded', validator_id: 'repair_receipt_rollback_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold: '0 repair receipts missing rollback_method',
      command_or_probe: 'RepairReceipt.list(-timestamp,500)',
      reason: 'No repair receipts exist to prove rollback-method coverage.',
    });
  }
  const missing = rows.filter((r: any) => !r.rollback_method || !String(r.rollback_method).trim());
  return buildReceipt({
    gate_id: 'rollback.method_recorded', validator_id: 'repair_receipt_rollback_audit', status: missing.length === 0 ? 'PASS' : 'FAIL',
    source_sha: sourceSha, metric_value: missing.length, threshold: '0 repair receipts missing rollback_method',
    command_or_probe: 'RepairReceipt.list(-timestamp,500)',
    evidence_refs: rows.slice(0, 25).map((r: any) => r.repair_id).filter(Boolean),
    reason: missing.length === 0
      ? `All ${rows.length} inspected repair receipt(s) include rollback_method.`
      : `${missing.length}/${rows.length} repair receipt(s) are missing rollback_method.`,
  });
}

async function validateRequiredChecks(
  secrets: GithubSecrets,
  sourceSha: string | null,
  branch: string,
): Promise<ValidatorReceipt> {
  if (!secrets.GITHUB_REPO || !secrets.GITHUB_TOKEN || !sourceSha) {
    return buildReceipt({
      gate_id: 'ci.required_checks', validator_id: 'branch_protection_probe', status: 'BLOCKED',
      source_sha: sourceSha, threshold: 'build, lint, typecheck enforced as required checks',
      command_or_probe: 'GitHub branch protection required-status-checks API',
      reason: 'GitHub repository/token/SHA unavailable for branch-protection verification.',
    });
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secrets.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'PropertyIntel-AlphaPrime-Validator',
  };
  try {
    const r = await fetch(`https://api.github.com/repos/${secrets.GITHUB_REPO}/branches/${branch}/protection/required_status_checks`, { headers });
    if (r.status === 403) {
      return buildReceipt({
        gate_id: 'ci.required_checks', validator_id: 'branch_protection_probe', status: 'BLOCKED',
        source_sha: sourceSha, metric_value: 403, threshold: 'build, lint, typecheck enforced as required checks',
        command_or_probe: `branch/${branch}/protection/required_status_checks`,
        reason: 'GitHub token cannot read branch protection; admin-level verification is required.',
      });
    }
    if (r.status === 404) {
      return buildReceipt({
        gate_id: 'ci.required_checks', validator_id: 'branch_protection_probe', status: 'FAIL',
        source_sha: sourceSha, metric_value: 0, threshold: 'build, lint, typecheck enforced as required checks',
        command_or_probe: `branch/${branch}/protection/required_status_checks`,
        reason: `Required status checks are not configured on '${branch}'. Enabling branch protection is an operator-approved repository governance action.`,
      });
    }
    if (!r.ok) {
      return buildReceipt({
        gate_id: 'ci.required_checks', validator_id: 'branch_protection_probe', status: 'UNKNOWN',
        source_sha: sourceSha, metric_value: r.status, threshold: 'build, lint, typecheck enforced as required checks',
        command_or_probe: `branch/${branch}/protection/required_status_checks`,
        reason: `Branch protection probe returned HTTP ${r.status}.`,
      });
    }
    const data = await r.json();
    const names = new Set<string>([
      ...(data?.contexts || []),
      ...((data?.checks || []).map((x: any) => x.context).filter(Boolean)),
    ].map((x: string) => x.toLowerCase()));
    const required = ['build', 'lint', 'typecheck'];
    const missing = required.filter((x) => !names.has(x));
    return buildReceipt({
      gate_id: 'ci.required_checks', validator_id: 'branch_protection_probe', status: missing.length === 0 ? 'PASS' : 'FAIL',
      source_sha: sourceSha, metric_value: names.size, threshold: 'build, lint, typecheck enforced as required checks',
      command_or_probe: `branch/${branch}/protection/required_status_checks`,
      evidence_refs: Array.from(names),
      reason: missing.length === 0
        ? `Required checks are enforced on '${branch}': build, lint, typecheck.`
        : `Branch protection is missing required check(s): ${missing.join(', ')}.`,
    });
  } catch (e) {
    return buildReceipt({
      gate_id: 'ci.required_checks', validator_id: 'branch_protection_probe', status: 'UNKNOWN',
      source_sha: sourceSha, threshold: 'build, lint, typecheck enforced as required checks',
      command_or_probe: `branch/${branch}/protection/required_status_checks`,
      stderr_summary: e.message,
      reason: `Branch protection probe failed: ${e.message}`,
    });
  }
}

function validateShaStamped(otherReceipts: ValidatorReceipt[], resolvedSha: string | null): ValidatorReceipt {
  if (!resolvedSha) {
    return buildReceipt({
      gate_id: 'ci.sha_stamped', validator_id: 'sha_stamp_audit', status: 'BLOCKED',
      source_sha: null, threshold: 'all implemented receipts stamp matching source SHA',
      command_or_probe: 'resolveSourceSha + receipt audit',
      reason: 'Could not resolve source SHA.',
    });
  }
  const missing = otherReceipts.filter((r) => !r.source_sha || r.source_sha !== resolvedSha);
  const pass = otherReceipts.length > 0 && missing.length === 0;
  return buildReceipt({
    gate_id: 'ci.sha_stamped', validator_id: 'sha_stamp_audit', status: pass ? 'PASS' : (otherReceipts.length ? 'FAIL' : 'UNKNOWN'),
    source_sha: resolvedSha, metric_value: otherReceipts.length - missing.length,
    threshold: 'all implemented receipts stamp matching source SHA',
    command_or_probe: 'receipt audit',
    evidence_refs: otherReceipts.filter((r) => r.source_sha === resolvedSha).map((r) => r.gate_id),
    reason: pass
      ? `All ${otherReceipts.length} implemented validator receipt(s) stamp SHA ${resolvedSha.slice(0, 8)}.`
      : `${missing.length} validator receipt(s) omit or mismatch SHA ${resolvedSha.slice(0, 8)}.`,
  });
}

async function syncValidationTask(base44: any, r: ValidatorReceipt, now: string) {
  if (r.status === 'UNKNOWN') {
    return upsertValidationTask(base44, {
      gate_id: r.gate_id, validator_id: r.validator_id, status: 'VALIDATOR_REQUIRED',
      source_sha: r.source_sha, reason: r.reason, blocker: r.stderr_summary || r.reason,
      wave: 'autonomous_completion', now,
    });
  }
  const existing = await base44.asServiceRole.entities.ValidationTask.filter({ gate_id: r.gate_id }, '-updated_at', 1).catch(() => []);
  if (!existing[0]) return;
  const status = r.status === 'PASS' ? 'PASS' : r.status === 'FAIL' ? 'FAIL' : 'BLOCKED';
  await base44.asServiceRole.entities.ValidationTask.update(existing[0].id, {
    status,
    validator_id: r.validator_id,
    source_sha: r.source_sha,
    reason: r.reason,
    blocker: r.status === 'BLOCKED' ? (r.stderr_summary || r.reason) : '',
    evidence_refs: r.evidence_refs,
    last_attempt_at: now,
    updated_at: now,
  }).catch(() => {});
}

async function upsertValidationTask(base44: any, args: {
  gate_id: string; validator_id: string; status: string; source_sha: string | null;
  reason: string; blocker: string; wave: string; now: string;
}) {
  const existing = await base44.asServiceRole.entities.ValidationTask.filter({ gate_id: args.gate_id }, '-updated_at', 1).catch(() => []);
  const nextAttempt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  if (existing[0]) {
    const e = existing[0];
    if (e.status === 'PASS' || e.status === 'FAIL') return;
    await base44.asServiceRole.entities.ValidationTask.update(e.id, {
      status: args.status, validator_id: args.validator_id, source_sha: args.source_sha,
      reason: args.reason, blocker: args.blocker, wave: args.wave,
      attempt_count: (e.attempt_count || 0) + 1,
      last_attempt_at: args.now, next_attempt_at: nextAttempt, updated_at: args.now,
    }).catch(() => {});
  } else {
    await base44.asServiceRole.entities.ValidationTask.create({
      validation_task_id: uid('vt'), gate_id: args.gate_id, validator_id: args.validator_id,
      priority: 'p1', status: args.status, source_sha: args.source_sha, reason: args.reason,
      attempt_count: 1, last_attempt_at: args.now, next_attempt_at: nextAttempt,
      evidence_refs: [], blocker: args.blocker, wave: args.wave,
      created_at: args.now, updated_at: args.now,
    }).catch(() => {});
  }
}
