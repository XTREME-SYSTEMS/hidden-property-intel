import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { buildReceipt, resolveSourceSha, type GithubSecrets, type ValidatorReceipt } from '../../shared/validatorContract.ts';

const MAX_RECEIPT_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const BOOLEAN_FIELDS = [
  'admin_read_rejected',
  'admin_create_rejected',
  'admin_update_rejected',
  'admin_delete_rejected',
  'cross_user_read_rejected',
  'cross_user_create_rejected',
  'cross_user_update_rejected',
  'cross_user_delete_rejected',
  'cleanup_ok',
] as const;

function isEligibleReceipt(row: any, sourceSha: string, nowMs: number): boolean {
  const testedMs = Date.parse(row?.tested_at || '');
  if (!Number.isFinite(testedMs)) return false;
  if (row?.source_sha !== sourceSha) return false;
  if (!['sandbox', 'test'].includes(row?.environment)) return false;
  if (row?.producer !== 'rls-matrix-validator') return false;
  if (row?.live_side_effects !== false) return false;
  if (typeof row?.receipt_id !== 'string' || row.receipt_id.trim().length === 0) return false;
  if (typeof row?.artifact_ref !== 'string' || row.artifact_ref.trim().length === 0) return false;
  if (!Number.isInteger(row?.error_count) || row.error_count < 0) return false;
  if (BOOLEAN_FIELDS.some((field) => typeof row?.[field] !== 'boolean')) return false;
  if (testedMs > nowMs + MAX_FUTURE_SKEW_MS) return false;
  if (nowMs - testedMs > MAX_RECEIPT_AGE_MS) return false;
  return true;
}

function unknownReceipt(gateId: string, sourceSha: string | null, reason: string): ValidatorReceipt {
  return buildReceipt({
    gate_id: gateId,
    validator_id: 'rls_matrix_receipt_probe',
    validator_version: '1.0.0',
    status: sourceSha ? 'UNKNOWN' : 'BLOCKED',
    source_sha: sourceSha,
    threshold: gateId === 'rls.admin_only_entities'
      ? 'unauthorized read/create/update/delete rejected on admin-only entities'
      : 'cross-user read/create/update/delete rejected with sandbox cleanup confirmed',
    command_or_probe: 'RlsValidationReceipt exact source_sha, sandbox/test matrix, independent producer',
    reason,
  });
}

function validateAdminOnly(row: any, sourceSha: string): ValidatorReceipt {
  const pass = row.admin_read_rejected
    && row.admin_create_rejected
    && row.admin_update_rejected
    && row.admin_delete_rejected
    && row.cleanup_ok
    && row.error_count === 0;
  return buildReceipt({
    gate_id: 'rls.admin_only_entities',
    validator_id: 'rls_matrix_receipt_probe',
    validator_version: '1.0.0',
    status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha,
    metric_value: pass ? 1 : 0,
    threshold: 'unauthorized CRUD rejected on admin-only entities; cleanup_ok=true; error_count=0; exact SHA; sandbox/test only',
    command_or_probe: 'RlsValidationReceipt admin-only CRUD rejection matrix',
    exit_code: pass ? 0 : 1,
    evidence_refs: [row.artifact_ref],
    stdout_summary: `receipt=${row.receipt_id}; env=${row.environment}; read=${row.admin_read_rejected}; create=${row.admin_create_rejected}; update=${row.admin_update_rejected}; delete=${row.admin_delete_rejected}; cleanup=${row.cleanup_ok}; errors=${row.error_count}`,
    reason: pass
      ? `Independent admin-only RLS matrix passed for exact SHA ${sourceSha.slice(0, 8)}.`
      : `Independent admin-only RLS matrix contains one or more failed rejection/cleanup checks for exact SHA ${sourceSha.slice(0, 8)}.`,
  });
}

function validateUserIsolation(row: any, sourceSha: string): ValidatorReceipt {
  const pass = row.cross_user_read_rejected
    && row.cross_user_create_rejected
    && row.cross_user_update_rejected
    && row.cross_user_delete_rejected
    && row.cleanup_ok
    && row.error_count === 0;
  return buildReceipt({
    gate_id: 'rls.user_isolation',
    validator_id: 'rls_matrix_receipt_probe',
    validator_version: '1.0.0',
    status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha,
    metric_value: pass ? 1 : 0,
    threshold: 'cross-user CRUD rejected; cleanup_ok=true; error_count=0; exact SHA; sandbox/test only',
    command_or_probe: 'RlsValidationReceipt cross-user isolation matrix',
    exit_code: pass ? 0 : 1,
    evidence_refs: [row.artifact_ref],
    stdout_summary: `receipt=${row.receipt_id}; env=${row.environment}; read=${row.cross_user_read_rejected}; create=${row.cross_user_create_rejected}; update=${row.cross_user_update_rejected}; delete=${row.cross_user_delete_rejected}; cleanup=${row.cleanup_ok}; errors=${row.error_count}`,
    reason: pass
      ? `Independent cross-user RLS isolation matrix passed for exact SHA ${sourceSha.slice(0, 8)}.`
      : `Independent cross-user RLS isolation matrix contains one or more failed rejection/cleanup checks for exact SHA ${sourceSha.slice(0, 8)}.`,
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
        unknownReceipt('rls.admin_only_entities', null, 'Canonical source SHA could not be resolved.'),
        unknownReceipt('rls.user_isolation', null, 'Canonical source SHA could not be resolved.'),
      ];
      return Response.json({ source_sha: null, receipts: blocked, source_sha_error: shaResult.error || null });
    }

    const nowMs = Date.now();
    const rows = await base44.asServiceRole.entities.RlsValidationReceipt.list('-tested_at', 50).catch(() => []);
    const exactRows = (rows || [])
      .filter((row: any) => isEligibleReceipt(row, sourceSha, nowMs))
      .sort((a: any, b: any) => Date.parse(b.tested_at) - Date.parse(a.tested_at));

    let receipts: ValidatorReceipt[];
    if (exactRows.length === 0) {
      receipts = [
        unknownReceipt('rls.admin_only_entities', sourceSha, 'No fresh, well-formed, exact-SHA sandbox/test RlsValidationReceipt from the independent matrix producer exists.'),
        unknownReceipt('rls.user_isolation', sourceSha, 'No fresh, well-formed, exact-SHA sandbox/test RlsValidationReceipt from the independent matrix producer exists.'),
      ];
    } else {
      const latest = exactRows[0];
      receipts = [validateAdminOnly(latest, sourceSha), validateUserIsolation(latest, sourceSha)];
    }

    for (const receipt of receipts) {
      await base44.asServiceRole.entities.GateResult.create({
        gate_id: receipt.gate_id,
        category: 'DATABASE',
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
    console.error('validateRlsGates error', error);
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
