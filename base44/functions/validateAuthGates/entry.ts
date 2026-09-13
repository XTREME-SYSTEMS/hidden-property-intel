import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { buildReceipt, resolveSourceSha, type GithubSecrets, type ValidatorReceipt } from '../../shared/validatorContract.ts';

const MAX_RECEIPT_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

function isEligibleReceipt(row: any, sourceSha: string, nowMs: number): boolean {
  const testedMs = Date.parse(row?.tested_at || '');
  if (!Number.isFinite(testedMs)) return false;
  if (row?.source_sha !== sourceSha) return false;
  if (!['sandbox', 'test'].includes(row?.environment)) return false;
  if (row?.producer !== 'playwright-auth-validator') return false;
  if (row?.live_side_effects !== false) return false;
  if (typeof row?.artifact_ref !== 'string' || row.artifact_ref.trim().length === 0) return false;
  if (testedMs > nowMs + MAX_FUTURE_SKEW_MS) return false;
  if (nowMs - testedMs > MAX_RECEIPT_AGE_MS) return false;
  return true;
}

function unknownReceipt(gateId: string, sourceSha: string | null, reason: string): ValidatorReceipt {
  return buildReceipt({
    gate_id: gateId,
    validator_id: 'auth_sandbox_receipt_probe',
    validator_version: '1.0.0',
    status: sourceSha ? 'UNKNOWN' : 'BLOCKED',
    source_sha: sourceSha,
    threshold: gateId === 'auth.login_flow'
      ? 'exact-SHA nonproduction login + register + password reset succeeds with zero validator errors'
      : 'exact-SHA nonproduction authenticated session persists + restores with zero validator errors',
    command_or_probe: 'AuthValidationReceipt exact source_sha, sandbox/test environment, independent Playwright producer',
    reason,
  });
}

function validateLoginFlow(row: any, sourceSha: string): ValidatorReceipt {
  const checks = {
    login_ok: row.login_ok === true,
    register_ok: row.register_ok === true,
    reset_request_ok: row.reset_request_ok === true,
    reset_complete_ok: row.reset_complete_ok === true,
  };
  const errorCount = Number(row.error_count);
  const malformed = !Number.isInteger(errorCount) || errorCount < 0 || Object.values(checks).some((v) => typeof v !== 'boolean');
  if (malformed) {
    return unknownReceipt('auth.login_flow', sourceSha, 'Latest eligible auth receipt is malformed; PASS cannot be inferred.');
  }
  const pass = Object.values(checks).every(Boolean) && errorCount === 0;
  return buildReceipt({
    gate_id: 'auth.login_flow',
    validator_id: 'auth_sandbox_receipt_probe',
    validator_version: '1.0.0',
    status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha,
    metric_value: pass ? 1 : 0,
    threshold: 'login/register/reset succeeds; error_count=0; exact SHA; sandbox/test only; no live side effects',
    command_or_probe: 'AuthValidationReceipt login/register/reset evidence',
    exit_code: pass ? 0 : 1,
    evidence_refs: [row.artifact_ref],
    stdout_summary: `receipt=${row.receipt_id}; env=${row.environment}; login=${checks.login_ok}; register=${checks.register_ok}; reset_request=${checks.reset_request_ok}; reset_complete=${checks.reset_complete_ok}; errors=${errorCount}`,
    reason: pass
      ? `Independent nonproduction auth-flow receipt passed for exact SHA ${sourceSha.slice(0, 8)}.`
      : `Independent nonproduction auth-flow receipt contains one or more failed steps for exact SHA ${sourceSha.slice(0, 8)}.`,
  });
}

function validateSession(row: any, sourceSha: string): ValidatorReceipt {
  const persistOk = row.session_persist_ok === true;
  const restoreOk = row.session_restore_ok === true;
  const errorCount = Number(row.error_count);
  if (!Number.isInteger(errorCount) || errorCount < 0) {
    return unknownReceipt('auth.session', sourceSha, 'Latest eligible auth receipt has invalid error_count; PASS cannot be inferred.');
  }
  const pass = persistOk && restoreOk && errorCount === 0;
  return buildReceipt({
    gate_id: 'auth.session',
    validator_id: 'auth_sandbox_receipt_probe',
    validator_version: '1.0.0',
    status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha,
    metric_value: pass ? 1 : 0,
    threshold: 'session persists + restores; error_count=0; exact SHA; sandbox/test only; no live side effects',
    command_or_probe: 'AuthValidationReceipt session persistence/restore evidence',
    exit_code: pass ? 0 : 1,
    evidence_refs: [row.artifact_ref],
    stdout_summary: `receipt=${row.receipt_id}; env=${row.environment}; persist=${persistOk}; restore=${restoreOk}; errors=${errorCount}`,
    reason: pass
      ? `Independent nonproduction session receipt passed for exact SHA ${sourceSha.slice(0, 8)}.`
      : `Independent nonproduction session receipt failed persistence or restoration for exact SHA ${sourceSha.slice(0, 8)}.`,
  });
}

export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const runtimeSecrets: any = (await import('base44:runtime')).secrets;
    const secrets: GithubSecrets = {
      GITHUB_REPO: runtimeSecrets.get ? runtimeSecrets.get('GITHUB_REPO') : (runtimeSecrets.GITHUB_REPO || ''),
      GITHUB_TOKEN: runtimeSecrets.get ? runtimeSecrets.get('GITHUB_TOKEN') : (runtimeSecrets.GITHUB_TOKEN || ''),
      GITHUB_BASE_BRANCH: (runtimeSecrets.get ? runtimeSecrets.get('GITHUB_BASE_BRANCH') : runtimeSecrets.GITHUB_BASE_BRANCH) || 'main',
    };

    const shaResult = await resolveSourceSha(secrets);
    const sourceSha = shaResult.sha;
    if (!sourceSha) {
      const blocked = [
        unknownReceipt('auth.login_flow', null, 'Canonical source SHA could not be resolved.'),
        unknownReceipt('auth.session', null, 'Canonical source SHA could not be resolved.'),
      ];
      return Response.json({ source_sha: null, receipts: blocked, source_sha_error: shaResult.error || null });
    }

    const nowMs = Date.now();
    const rows = await base44.asServiceRole.entities.AuthValidationReceipt.list('-tested_at', 50).catch(() => []);
    const exactRows = (rows || [])
      .filter((row: any) => isEligibleReceipt(row, sourceSha, nowMs))
      .sort((a: any, b: any) => Date.parse(b.tested_at) - Date.parse(a.tested_at));

    let receipts: ValidatorReceipt[];
    if (exactRows.length === 0) {
      receipts = [
        unknownReceipt('auth.login_flow', sourceSha, 'No fresh exact-SHA sandbox/test AuthValidationReceipt from the independent Playwright producer exists.'),
        unknownReceipt('auth.session', sourceSha, 'No fresh exact-SHA sandbox/test AuthValidationReceipt from the independent Playwright producer exists.'),
      ];
    } else {
      const latest = exactRows[0];
      receipts = [validateLoginFlow(latest, sourceSha), validateSession(latest, sourceSha)];
    }

    for (const receipt of receipts) {
      await base44.asServiceRole.entities.GateResult.create({
        gate_id: receipt.gate_id,
        category: 'AUTH',
        mandatory: true,
        status: receipt.status,
        evidence_refs: receipt.evidence_refs,
        detail: `${receipt.validator_id} v${receipt.validator_version}: ${receipt.reason}`,
        last_passed_at: receipt.status === 'PASS' ? receipt.completed_at : null,
        source_sha: receipt.source_sha,
        artifact_refs: receipt.artifact_refs,
        evaluated_at: receipt.completed_at,
      }).catch(() => {});
    }

    return Response.json({
      source_sha: sourceSha,
      source_branch: shaResult.branch,
      eligible_receipt_count: exactRows.length,
      receipts,
    });
  } catch (error) {
    console.error('validateAuthGates error', error);
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
