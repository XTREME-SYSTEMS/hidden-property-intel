import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import {
  buildReceipt, resolveSourceSha, fetchCheckRuns, findCheckRun,
  SCHEDULER_INVENTORY,
  type ValidatorReceipt, type GithubSecrets,
} from '../../shared/validatorContract.ts';
import { RELEASE_CONSTITUTION } from '../../shared/releaseConstitution.ts';
import {
  validateAuthEvidence,
  validateRlsEvidence,
  validateAiGatewayEvidence,
  validatePaymentEvidence,
} from '../../shared/externalGateValidators.ts';

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

    // FRONTEND deterministic CI. These checks are exact-SHA evidence only; absence or
    // non-success must remain UNKNOWN/FAIL through validateCheckRunGate rather than
    // being inferred from unrelated build success.
    receipts.push(validateCheckRunGate('frontend.render', checkRuns, sourceSha, 'frontend-render', 'Playwright primary-route render validation'));
    receipts.push(validateCheckRunGate('frontend.no_console_errors', checkRuns, sourceSha, 'frontend-no-console-errors', 'Playwright uncaught console/page error validation'));


    // BACKEND deploy gate is intentionally two-layered: current-SHA source boot audit
    // plus an independently produced exact-SHA production deployment receipt. Source
    // compilation alone can never satisfy a deployment gate.
    const backendDeployReceipts = await base44.asServiceRole.entities.BackendDeployReceipt.list('-timestamp', 20).catch(() => []);
    receipts.push(validateBackendFunctionsDeploy(checkRuns, backendDeployReceipts, sourceSha));

    // AUTH, RLS, AI GATEWAY, and PAYMENTS are evidence-consumer gates. These validators
    // never perform login mutations, policy changes, AI spend, or payment actions. They
    // only consume fresh exact-SHA receipts produced independently in sandbox/test scope.
    const authValidationReceipts = await base44.asServiceRole.entities.AuthValidationReceipt.list('-tested_at', 50).catch(() => []);
    receipts.push(...validateAuthEvidence(authValidationReceipts, sourceSha));

    const rlsValidationReceipts = await base44.asServiceRole.entities.RlsValidationReceipt.list('-tested_at', 50).catch(() => []);
    receipts.push(...validateRlsEvidence(rlsValidationReceipts, sourceSha));

    const aiGatewayValidationReceipts = await base44.asServiceRole.entities.AiGatewayValidationReceipt.list('-tested_at', 50).catch(() => []);
    receipts.push(...validateAiGatewayEvidence(aiGatewayValidationReceipts, sourceSha));

    const paymentValidationReceipts = await base44.asServiceRole.entities.PaymentValidationReceipt.list('-tested_at', 50).catch(() => []);
    receipts.push(...validatePaymentEvidence(paymentValidationReceipts, sourceSha));

    // SECURITY + DATABASE static deterministic CI
    receipts.push(validateCheckRunGate('security.dependency_scan', checkRuns, sourceSha, 'dependency-scan', 'npm audit --audit-level=critical'));
    receipts.push(validateCheckRunGate('security.secret_scan', checkRuns, sourceSha, 'secret-scan', 'repository secret scan'));
    receipts.push(validateCheckRunGate('security.input_validation', checkRuns, sourceSha, 'input-validation', 'static function-input validation audit'));
    receipts.push(validateCheckRunGate('db.schema_valid', checkRuns, sourceSha, 'schema-valid', 'entity schema JSONC audit'));
    receipts.push(validateCheckRunGate('db.no_oversized_fields', checkRuns, sourceSha, 'oversized-fields', 'entity oversized-field audit'));
    receipts.push(validateCheckRunGate('contracts.deploy_safety', checkRuns, sourceSha, 'contract-safety', 'live-chain mutation primitive audit'));
    receipts.push(validateCheckRunGate('resil.fallback_chain', checkRuns, sourceSha, 'resilience-fallback-audit', 'static critical-path fallback and SPOF audit'));

    // WORKFLOWS
    const heartbeats = await base44.asServiceRole.entities.HeartbeatReceipt.list('-timestamp', 10).catch(() => []);
    receipts.push(validateHeartbeatActive(heartbeats, sourceSha));

    // OBSERVABILITY. The durable runtime log stream is source-SHA stamped and must
    // demonstrate advancing exact-SHA records. Missing or foreign logs remain UNKNOWN.
    const runtimeLogs = await base44.asServiceRole.entities.RuntimeLogReceipt.list('-timestamp', 20).catch(() => []);
    receipts.push(validateObservabilityLogs(runtimeLogs, sourceSha));
    receipts.push(validateNoDuplicateCron(sourceSha));

    // RUNTIME + GOVERNANCE validators. Runtime probes must first prove that the live
    // runtime is stamping the exact canonical source SHA; foreign/stale runtime state
    // can never be promoted to PASS for current source truth.
    receipts.push(await validateBackendApiSmoke(base44, sourceSha, heartbeats));
    receipts.push(await validateScrapeSuccess(base44, sourceSha, heartbeats));
    receipts.push(await validateFloridaOnly(base44, sourceSha, heartbeats));
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
    // Existing findings only suppress a new finding when they belong to this exact SHA.
    for (const r of receipts.filter((x) => x.status === 'FAIL')) {
      const existing = await base44.asServiceRole.entities.Finding.filter({
        category: r.gate_id,
        source_sha: r.source_sha,
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

    // Emit a durable application-level runtime log receipt for the NEXT validator cycle.
    // The current cycle never counts the record it is about to write, preventing self-proof.
    if (sourceSha) {
      await base44.asServiceRole.entities.RuntimeLogReceipt.create({
        log_id: uid('rlog'),
        timestamp: now,
        source_sha: sourceSha,
        subsystem: 'runValidators',
        level: 'info',
        event: 'validator_cycle',
        detail: 'implemented=' + receipts.length + '; unimplemented_mandatory=' + unimplementedMandatory.length,
      }).catch(() => {});
    }

    const results = Object.fromEntries(receipts.map((r) => [r.gate_id, r.status]));
    return Response.json({
      source_sha: sourceSha,
      source_branch: shaResult.branch,
      source_sha_error: shaResult.error || null,
      source_configuration_statuses: shaResult.statuses || [],
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

function validateBackendFunctionsDeploy(checkRuns: any[], deployReceipts: any[], sourceSha: string | null): ValidatorReceipt {
  const threshold = 'backend-functions-source-audit success + exact-SHA production deploy receipt + function_count>0 + boot_failures=0';
  const probe = 'GitHub backend-functions-source-audit + BackendDeployReceipt exact source_sha production evidence';
  if (!sourceSha) {
    return buildReceipt({
      gate_id: 'backend.functions_deploy', validator_id: 'backend_deploy_evidence_probe', status: 'BLOCKED',
      source_sha: null, metric_value: 0, threshold, command_or_probe: probe,
      reason: 'Canonical source SHA is unavailable; backend deployment evidence cannot be bound to source truth.',
    });
  }

  const sourceCheck = findCheckRun(checkRuns, 'backend-functions-source-audit');
  if (!sourceCheck) {
    return buildReceipt({
      gate_id: 'backend.functions_deploy', validator_id: 'backend_deploy_evidence_probe', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold, command_or_probe: probe,
      reason: 'No backend-functions-source-audit check exists for current SHA ' + sourceSha.slice(0, 8) + '.',
    });
  }
  if (sourceCheck.status !== 'completed') {
    return buildReceipt({
      gate_id: 'backend.functions_deploy', validator_id: 'backend_deploy_evidence_probe', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: sourceCheck.status, threshold, command_or_probe: probe,
      evidence_refs: [sourceCheck.url || sourceCheck.name],
      reason: 'Backend source audit is not complete for current SHA (status=' + sourceCheck.status + ').',
    });
  }
  if (sourceCheck.conclusion !== 'success') {
    return buildReceipt({
      gate_id: 'backend.functions_deploy', validator_id: 'backend_deploy_evidence_probe', status: 'FAIL',
      source_sha: sourceSha, metric_value: sourceCheck.conclusion, threshold, command_or_probe: probe,
      exit_code: 1, evidence_refs: [sourceCheck.url || sourceCheck.name],
      reason: 'Backend source boot audit failed for current SHA with conclusion ' + sourceCheck.conclusion + '.',
    });
  }

  const exactProduction = (deployReceipts || []).filter((row: any) =>
    row?.source_sha === sourceSha && row?.environment === 'production' && row?.timestamp
  ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (exactProduction.length === 0) {
    return buildReceipt({
      gate_id: 'backend.functions_deploy', validator_id: 'backend_deploy_evidence_probe', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold, command_or_probe: probe,
      evidence_refs: [sourceCheck.url || sourceCheck.name],
      reason: 'Source-level boot audit passed, but no exact-SHA production BackendDeployReceipt exists. Deployment is not inferred from compilation.',
    });
  }

  const latest = exactProduction[0];
  const functionCount = Number(latest.function_count);
  const bootFailures = Number(latest.boot_failures);
  if (!Number.isInteger(functionCount) || functionCount <= 0 || !Number.isInteger(bootFailures) || bootFailures < 0) {
    return buildReceipt({
      gate_id: 'backend.functions_deploy', validator_id: 'backend_deploy_evidence_probe', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: latest.receipt_id || 'malformed', threshold, command_or_probe: probe,
      evidence_refs: [sourceCheck.url || sourceCheck.name, latest.receipt_id, latest.deployment_id, latest.artifact_ref].filter(Boolean),
      reason: 'Exact-SHA production deployment receipt is malformed or lacks a positive function_count / non-negative boot_failures value.',
    });
  }

  const pass = bootFailures === 0;
  return buildReceipt({
    gate_id: 'backend.functions_deploy', validator_id: 'backend_deploy_evidence_probe', status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha, metric_value: bootFailures, threshold, command_or_probe: probe,
    exit_code: pass ? 0 : 1,
    evidence_refs: [sourceCheck.url || sourceCheck.name, latest.receipt_id, latest.deployment_id, latest.artifact_ref].filter(Boolean),
    stdout_summary: 'function_count=' + functionCount + '; boot_failures=' + bootFailures + '; producer=' + (latest.producer || 'unknown'),
    stderr_summary: bootFailures > 0 ? (latest.boot_failure_functions || []).join(', ') : '',
    reason: pass
      ? 'Exact-SHA production deploy receipt proves ' + functionCount + ' function(s) deployed with zero boot failures.'
      : 'Exact-SHA production deploy receipt reports ' + bootFailures + ' boot failure(s) across ' + functionCount + ' deployed function(s).',
  });
}

function validateHeartbeatActive(heartbeats: any[], sourceSha: string | null): ValidatorReceipt {
  if (!sourceSha) {
    return buildReceipt({
      gate_id: 'workflows.heartbeat_active', validator_id: 'heartbeat_history_probe', status: 'BLOCKED',
      source_sha: null, metric_value: 0,
      threshold: '>=3 exact-SHA advancing receipts in 20m; max gap <=15m',
      command_or_probe: 'HeartbeatReceipt.list(-timestamp,10)',
      reason: 'Canonical source SHA is unavailable; heartbeat lineage cannot be verified.',
    });
  }

  const now = Date.now();
  const withinWindow = heartbeats.filter((h) => now - new Date(h.timestamp).getTime() < 20 * 60 * 1000);
  const recent = withinWindow.filter((h) => h.source_sha === sourceSha);
  const foreignRecent = withinWindow.filter((h) => h.source_sha && h.source_sha !== sourceSha);
  if (recent.length < 3) {
    const foreignShas = Array.from(new Set(foreignRecent.map((h: any) => h.source_sha))).filter(Boolean);
    return buildReceipt({
      gate_id: 'workflows.heartbeat_active', validator_id: 'heartbeat_history_probe', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: recent.length,
      threshold: '>=3 exact-SHA advancing receipts in 20m; max gap <=15m',
      command_or_probe: 'HeartbeatReceipt.list(-timestamp,10) exact source_sha filter',
      evidence_refs: recent.map((r) => r.heartbeat_id).filter(Boolean),
      stderr_summary: foreignShas.length ? `foreign recent heartbeat SHA(s): ${foreignShas.join(', ')}` : '',
      reason: `Only ${recent.length} recent heartbeat receipt(s) stamp canonical SHA ${sourceSha.slice(0, 8)}; ${foreignRecent.length} recent receipt(s) are foreign/stale and cannot count as evidence.`,
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
    threshold: '>=3 exact-SHA advancing receipts in 20m; max gap <=15m',
    command_or_probe: 'HeartbeatReceipt.list(-timestamp,10) exact source_sha filter',
    evidence_refs: recent.map((r) => r.heartbeat_id).filter(Boolean),
    reason: pass
      ? `${recent.length} exact-SHA advancing heartbeats; max gap ${maxGapMin.toFixed(1)}m.`
      : `Exact-SHA heartbeat cadence invalid: advancing=${advancing}, max gap=${maxGapMin.toFixed(1)}m.`,
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

function validateObservabilityLogs(runtimeLogs: any[], sourceSha: string | null): ValidatorReceipt {
  const threshold = '>=2 exact-SHA advancing runtime log receipts in 20m; max gap <=15m';
  const probe = 'RuntimeLogReceipt.list(-timestamp,20) exact source_sha stream audit';
  if (!sourceSha) {
    return buildReceipt({
      gate_id: 'obs.logs_available', validator_id: 'runtime_log_stream_probe', status: 'BLOCKED',
      source_sha: null, metric_value: 0, threshold, command_or_probe: probe,
      reason: 'Canonical source SHA is unavailable; runtime log lineage cannot be verified.',
    });
  }

  const cutoff = Date.now() - 20 * 60 * 1000;
  const exact = runtimeLogs.filter((row: any) => {
    if (row?.source_sha !== sourceSha || !row?.timestamp) return false;
    const ts = new Date(row.timestamp).getTime();
    return Number.isFinite(ts) && ts >= cutoff;
  });
  const foreign = runtimeLogs.filter((row: any) => row?.source_sha && row.source_sha !== sourceSha);

  if (exact.length < 2) {
    return buildReceipt({
      gate_id: 'obs.logs_available', validator_id: 'runtime_log_stream_probe', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: exact.length, threshold, command_or_probe: probe,
      evidence_refs: exact.map((row: any) => row.log_id).filter(Boolean),
      stderr_summary: foreign.length ? String(foreign.length) + ' foreign/stale runtime log receipt(s) ignored' : '',
      reason: 'Only ' + exact.length + ' recent runtime log receipt(s) stamp canonical SHA ' + sourceSha.slice(0, 8) + '; at least 2 are required to prove an advancing stream.',
    });
  }

  const sorted = [...exact].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  let advancing = true;
  let maxGapMs = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = new Date(sorted[i].timestamp).getTime() - new Date(sorted[i - 1].timestamp).getTime();
    if (gap <= 0) advancing = false;
    maxGapMs = Math.max(maxGapMs, gap);
  }
  const maxGapMin = maxGapMs / 60000;
  const malformed = sorted.filter((row: any) => !row.log_id || !row.event || !row.subsystem);
  const pass = advancing && maxGapMin <= 15 && malformed.length === 0;
  return buildReceipt({
    gate_id: 'obs.logs_available', validator_id: 'runtime_log_stream_probe', status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha, metric_value: sorted.length, threshold, command_or_probe: probe,
    exit_code: pass ? 0 : 1,
    evidence_refs: sorted.map((row: any) => row.log_id).filter(Boolean),
    stdout_summary: 'exact_sha_logs=' + sorted.length + '; max_gap_min=' + maxGapMin.toFixed(1) + '; malformed=' + malformed.length,
    reason: pass
      ? String(sorted.length) + ' source-stamped runtime log receipts are advancing for SHA ' + sourceSha.slice(0, 8) + ' with max gap ' + maxGapMin.toFixed(1) + 'm.'
      : 'Runtime log stream failed exact-SHA continuity: advancing=' + advancing + ', max gap=' + maxGapMin.toFixed(1) + 'm, malformed=' + malformed.length + '.',
  });
}

function latestExactShaHeartbeat(heartbeats: any[], sourceSha: string | null): any | null {
  if (!sourceSha) return null;
  const cutoff = Date.now() - 20 * 60 * 1000;
  return heartbeats.find((h) =>
    h?.source_sha === sourceSha &&
    h?.timestamp &&
    new Date(h.timestamp).getTime() >= cutoff
  ) || null;
}

async function validateBackendApiSmoke(base44: any, sourceSha: string | null, heartbeats: any[]): Promise<ValidatorReceipt> {
  const runtimeLineage = latestExactShaHeartbeat(heartbeats, sourceSha);
  if (!sourceSha || !runtimeLineage) {
    return buildReceipt({
      gate_id: 'backend.api_smoke', validator_id: 'critical_function_smoke', status: sourceSha ? 'UNKNOWN' : 'BLOCKED',
      source_sha: sourceSha, metric_value: 0, threshold: 'exact-SHA live runtime + critical read-only function returns structured response',
      command_or_probe: 'HeartbeatReceipt exact source_sha proof -> functions.invoke(systemPreflight)',
      reason: sourceSha
        ? `Live runtime has not produced a recent heartbeat stamped with canonical SHA ${sourceSha.slice(0, 8)}; backend smoke is withheld rather than using stale runtime evidence.`
        : 'Canonical source SHA is unavailable; backend runtime lineage cannot be proven.',
    });
  }

  try {
    const result = await base44.asServiceRole.functions.invoke('systemPreflight', {});
    const data = result?.data ?? result;
    const ok = data && !data.error;
    return buildReceipt({
      gate_id: 'backend.api_smoke', validator_id: 'critical_function_smoke', status: ok ? 'PASS' : 'FAIL',
      source_sha: sourceSha, metric_value: ok ? 1 : 0, threshold: 'exact-SHA live runtime + critical read-only function returns structured response',
      command_or_probe: 'functions.invoke(systemPreflight)',
      exit_code: ok ? 0 : 1,
      evidence_refs: ok ? [runtimeLineage.heartbeat_id, 'systemPreflight'].filter(Boolean) : [runtimeLineage.heartbeat_id].filter(Boolean),
      reason: ok ? 'Exact-SHA live runtime was proven and critical backend function invocation returned a structured response.' : 'systemPreflight returned an error/empty response on an exact-SHA live runtime.',
    });
  } catch (e) {
    return buildReceipt({
      gate_id: 'backend.api_smoke', validator_id: 'critical_function_smoke', status: 'FAIL',
      source_sha: sourceSha, metric_value: 0, threshold: 'exact-SHA live runtime + critical read-only function returns structured response',
      command_or_probe: 'functions.invoke(systemPreflight)',
      exit_code: 1, evidence_refs: [runtimeLineage.heartbeat_id].filter(Boolean), stderr_summary: e.message,
      reason: `Critical backend function invocation failed on exact-SHA runtime: ${e.message}`,
    });
  }
}

async function validateScrapeSuccess(base44: any, sourceSha: string | null, heartbeats: any[]): Promise<ValidatorReceipt> {
  const runtimeLineage = latestExactShaHeartbeat(heartbeats, sourceSha);
  const threshold = '>=90% completed scrape jobs over trailing 7d';
  const probe = 'ScrapeJob.list(-created_date,500) trailing 7d exact-SHA runtime audit';
  if (!sourceSha || !runtimeLineage) {
    return buildReceipt({
      gate_id: 'ingest.scrape_success', validator_id: 'scrape_job_7d_audit', status: sourceSha ? 'UNKNOWN' : 'BLOCKED',
      source_sha: sourceSha, metric_value: 0, threshold, command_or_probe: probe,
      reason: sourceSha
        ? `Live runtime has not produced a recent heartbeat stamped with canonical SHA ${sourceSha.slice(0, 8)}; scrape evidence is withheld rather than using stale runtime state.`
        : 'Canonical source SHA is unavailable; scrape-job lineage cannot be proven.',
    });
  }

  let rows: any[];
  try {
    rows = await base44.asServiceRole.entities.ScrapeJob.list('-created_date', 500);
  } catch (e) {
    return buildReceipt({
      gate_id: 'ingest.scrape_success', validator_id: 'scrape_job_7d_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold, command_or_probe: probe,
      evidence_refs: [runtimeLineage.heartbeat_id].filter(Boolean), stderr_summary: e.message,
      reason: `Could not read scrape-job history from the exact-SHA runtime: ${e.message}`,
    });
  }

  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const rowTime = (row: any) => {
    const value = row?.created_date || row?.started_at || row?.completed_at;
    const parsed = value ? new Date(value).getTime() : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  };
  const missingTimestamp = rows.filter((row: any) => rowTime(row) === null);
  if (missingTimestamp.length > 0) {
    return buildReceipt({
      gate_id: 'ingest.scrape_success', validator_id: 'scrape_job_7d_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: missingTimestamp.length, threshold, command_or_probe: probe,
      evidence_refs: [runtimeLineage.heartbeat_id].filter(Boolean),
      reason: `${missingTimestamp.length} inspected scrape job(s) have no usable timestamp, so the trailing-7d population cannot be proven.`,
    });
  }

  const recent = rows.filter((row: any) => (rowTime(row) as number) >= cutoff);
  const oldestInspected = rows.length ? rowTime(rows[rows.length - 1]) : null;
  if (rows.length >= 500 && oldestInspected !== null && oldestInspected >= cutoff) {
    return buildReceipt({
      gate_id: 'ingest.scrape_success', validator_id: 'scrape_job_7d_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: recent.length, threshold, command_or_probe: probe,
      evidence_refs: [runtimeLineage.heartbeat_id].filter(Boolean),
      reason: 'The 500-row read cap was exhausted inside the 7-day window; the full denominator cannot be proven, so success is not inferred.',
    });
  }
  if (recent.length === 0) {
    return buildReceipt({
      gate_id: 'ingest.scrape_success', validator_id: 'scrape_job_7d_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold, command_or_probe: probe,
      evidence_refs: [runtimeLineage.heartbeat_id].filter(Boolean),
      reason: 'No scrape jobs with provable timestamps exist in the trailing 7-day window; a success rate cannot be established.',
    });
  }

  const complete = recent.filter((row: any) => row.status === 'complete').length;
  const successRate = (complete / recent.length) * 100;
  const pass = successRate >= 90;
  return buildReceipt({
    gate_id: 'ingest.scrape_success', validator_id: 'scrape_job_7d_audit', status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha, metric_value: Number(successRate.toFixed(2)), threshold, command_or_probe: probe,
    exit_code: pass ? 0 : 1,
    evidence_refs: [runtimeLineage.heartbeat_id, ...recent.slice(0, 24).map((row: any) => row.id)].filter(Boolean),
    stdout_summary: `trailing_7d_jobs=${recent.length}; complete=${complete}; success_rate=${successRate.toFixed(2)}%`,
    reason: pass
      ? `Scrape success is ${successRate.toFixed(2)}% across ${recent.length} job(s) in the trailing 7 days.`
      : `Scrape success is ${successRate.toFixed(2)}% across ${recent.length} job(s), below the 90% trailing-7d threshold.`,
  });
}

async function validateFloridaOnly(base44: any, sourceSha: string | null, heartbeats: any[]): Promise<ValidatorReceipt> {
  const runtimeLineage = latestExactShaHeartbeat(heartbeats, sourceSha);
  const threshold = '0 out-of-state scraped Property records';
  const probe = 'Property.filter({source:"scraped"},-created_date,500) exhaustive-below-cap geo audit';
  if (!sourceSha || !runtimeLineage) {
    return buildReceipt({
      gate_id: 'ingest.florida_only', validator_id: 'scraped_property_geo_audit', status: sourceSha ? 'UNKNOWN' : 'BLOCKED',
      source_sha: sourceSha, metric_value: 0, threshold, command_or_probe: probe,
      reason: sourceSha
        ? `Live runtime has not produced a recent heartbeat stamped with canonical SHA ${sourceSha.slice(0, 8)}; geo evidence is withheld rather than using stale runtime state.`
        : 'Canonical source SHA is unavailable; scraped-property lineage cannot be proven.',
    });
  }

  let rows: any[];
  try {
    rows = await base44.asServiceRole.entities.Property.filter({ source: 'scraped' }, '-created_date', 500);
  } catch (e) {
    return buildReceipt({
      gate_id: 'ingest.florida_only', validator_id: 'scraped_property_geo_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold, command_or_probe: probe,
      evidence_refs: [runtimeLineage.heartbeat_id].filter(Boolean), stderr_summary: e.message,
      reason: `Could not read scraped Property records from the exact-SHA runtime: ${e.message}`,
    });
  }

  if (rows.length === 0) {
    return buildReceipt({
      gate_id: 'ingest.florida_only', validator_id: 'scraped_property_geo_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold, command_or_probe: probe,
      evidence_refs: [runtimeLineage.heartbeat_id].filter(Boolean),
      reason: 'No scraped Property records exist; Florida-only behavior cannot be proven vacuously.',
    });
  }
  if (rows.length >= 500) {
    return buildReceipt({
      gate_id: 'ingest.florida_only', validator_id: 'scraped_property_geo_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: rows.length, threshold, command_or_probe: probe,
      evidence_refs: [runtimeLineage.heartbeat_id, ...rows.slice(0, 24).map((row: any) => row.id)].filter(Boolean),
      reason: 'The 500-row read cap was exhausted; the validator cannot prove all scraped records are in Florida, so PASS is withheld.',
    });
  }

  const violations = rows.filter((row: any) => {
    const state = String(row?.state || '').trim().toUpperCase();
    return state !== 'FL' && state !== 'FLORIDA';
  });
  const pass = violations.length === 0;
  return buildReceipt({
    gate_id: 'ingest.florida_only', validator_id: 'scraped_property_geo_audit', status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha, metric_value: violations.length, threshold, command_or_probe: probe,
    exit_code: pass ? 0 : 1,
    evidence_refs: [runtimeLineage.heartbeat_id, ...rows.slice(0, 24).map((row: any) => row.id)].filter(Boolean),
    stderr_summary: violations.slice(0, 10).map((row: any) => `id=${row.id || 'unknown'} state=${String(row.state || '<missing>')}`).join('; '),
    reason: pass
      ? `All ${rows.length} scraped Property record(s) in the exhaustive below-cap audit are Florida records.`
      : `${violations.length}/${rows.length} scraped Property record(s) are out-of-state or missing a valid Florida state value.`,
  });
}

async function validateAgentGovernance(base44: any, sourceSha: string | null): Promise<ValidatorReceipt> {
  if (!sourceSha) {
    return buildReceipt({
      gate_id: 'agents.governance_loop', validator_id: 'repair_task_governance_audit', status: 'BLOCKED',
      source_sha: null, threshold: '0 consequential/irreversible auto-approved repair tasks',
      command_or_probe: 'RepairTask.list(-created_at,500)',
      reason: 'Canonical source SHA is unavailable; governance task lineage cannot be verified.',
    });
  }

  const tasks = await base44.asServiceRole.entities.RepairTask.list('-created_at', 500).catch(() => []);
  const exactTasks = tasks.filter((t: any) => t.source_sha_before === sourceSha || t.source_sha_after === sourceSha);
  if (exactTasks.length === 0) {
    return buildReceipt({
      gate_id: 'agents.governance_loop', validator_id: 'repair_task_governance_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold: '0 consequential/irreversible auto-approved repair tasks',
      command_or_probe: 'RepairTask.list(-created_at,500) exact source SHA filter',
      reason: `No repair tasks among the inspected rows are stamped with canonical SHA ${sourceSha.slice(0, 8)}; stale or unstamped tasks cannot prove governance compliance.`,
    });
  }

  const violations = exactTasks.filter((t: any) =>
    (t.risk_class === 'consequential' || t.risk_class === 'irreversible') &&
    (t.approval_state === 'auto_approved' || t.approval_state === 'not_required')
  );
  return buildReceipt({
    gate_id: 'agents.governance_loop', validator_id: 'repair_task_governance_audit',
    status: violations.length === 0 ? 'PASS' : 'FAIL',
    source_sha: sourceSha, metric_value: violations.length, threshold: '0 consequential/irreversible auto-approved repair tasks',
    command_or_probe: 'RepairTask.list(-created_at,500) exact source SHA filter',
    evidence_refs: exactTasks.slice(0, 25).map((t: any) => t.task_id).filter(Boolean),
    reason: violations.length === 0
      ? `No approval-bypass violations found across ${exactTasks.length} exact-SHA repair task(s).`
      : `${violations.length} consequential/irreversible exact-SHA repair task(s) bypassed required approval.`,
  });
}

async function validateRollbackMethods(base44: any, sourceSha: string | null): Promise<ValidatorReceipt> {
  if (!sourceSha) {
    return buildReceipt({
      gate_id: 'rollback.method_recorded', validator_id: 'repair_receipt_rollback_audit', status: 'BLOCKED',
      source_sha: null, metric_value: 0, threshold: '0 exact-SHA repair receipts missing rollback_method',
      command_or_probe: 'RepairReceipt.list(-timestamp,500)',
      reason: 'Canonical source SHA is unavailable; rollback receipt lineage cannot be verified.',
    });
  }

  const rows = await base44.asServiceRole.entities.RepairReceipt.list('-timestamp', 500).catch(() => []);
  const exactRows = rows.filter((r: any) => r.source_sha_before === sourceSha || r.source_sha_after === sourceSha);
  if (exactRows.length === 0) {
    return buildReceipt({
      gate_id: 'rollback.method_recorded', validator_id: 'repair_receipt_rollback_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold: '0 exact-SHA repair receipts missing rollback_method',
      command_or_probe: 'RepairReceipt.list(-timestamp,500) exact source SHA filter',
      reason: `No repair receipts stamp canonical SHA ${sourceSha.slice(0, 8)}; stale receipts cannot prove rollback-method coverage.`,
    });
  }
  const missing = exactRows.filter((r: any) => !r.rollback_method || !String(r.rollback_method).trim());
  return buildReceipt({
    gate_id: 'rollback.method_recorded', validator_id: 'repair_receipt_rollback_audit', status: missing.length === 0 ? 'PASS' : 'FAIL',
    source_sha: sourceSha, metric_value: missing.length, threshold: '0 exact-SHA repair receipts missing rollback_method',
    command_or_probe: 'RepairReceipt.list(-timestamp,500) exact source SHA filter',
    evidence_refs: exactRows.slice(0, 25).map((r: any) => r.repair_id).filter(Boolean),
    reason: missing.length === 0
      ? `All ${exactRows.length} exact-SHA repair receipt(s) include rollback_method.`
      : `${missing.length}/${exactRows.length} exact-SHA repair receipt(s) are missing rollback_method.`,
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
    // Terminal evidence is only terminal for the exact same source SHA. A new canonical
    // source must reopen the task rather than inheriting stale PASS/FAIL state.
    if ((e.status === 'PASS' || e.status === 'FAIL') && e.source_sha === args.source_sha) return;
    await base44.asServiceRole.entities.ValidationTask.update(e.id, {
      status: args.status, validator_id: args.validator_id, source_sha: args.source_sha,
      reason: args.reason, blocker: args.blocker, wave: args.wave,
      attempt_count: (e.attempt_count || 0) + 1,
      last_attempt_at: args.now, next_attempt_at: nextAttempt, updated_at: args.now,
      evidence_refs: [],
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
