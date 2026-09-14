import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { buildReceipt, resolveSourceSha, type GithubSecrets, type ValidatorReceipt } from '../../shared/validatorContract.ts';

const MAX_RECEIPT_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

function unknownReceipt(sourceSha: string | null, reason: string): ValidatorReceipt {
  return buildReceipt({
    gate_id: 'ai.gateway_available',
    validator_id: 'ai_gateway_no_spend_receipt_probe',
    validator_version: '1.0.0',
    status: sourceSha ? 'UNKNOWN' : 'BLOCKED',
    source_sha: sourceSha,
    threshold: 'status=200 + schema_valid=true + spend_usd=0 + exact SHA + sandbox/test + no live side effects',
    command_or_probe: 'AiGatewayValidationReceipt exact source_sha from independent no-spend producer',
    reason,
  });
}

function isEligibleReceipt(row: any, sourceSha: string, nowMs: number): boolean {
  const testedMs = Date.parse(row?.tested_at || '');
  if (!Number.isFinite(testedMs)) return false;
  if (row?.source_sha !== sourceSha) return false;
  if (!['sandbox', 'test'].includes(row?.environment)) return false;
  if (row?.producer !== 'ai-gateway-no-spend-validator') return false;
  if (row?.live_side_effects !== false) return false;
  if (typeof row?.receipt_id !== 'string' || row.receipt_id.trim().length === 0) return false;
  if (typeof row?.artifact_ref !== 'string' || row.artifact_ref.trim().length === 0) return false;
  if (typeof row?.request_id !== 'string' || row.request_id.trim().length === 0) return false;
  if (!Number.isInteger(row?.http_status)) return false;
  if (typeof row?.schema_valid !== 'boolean') return false;
  if (typeof row?.spend_usd !== 'number' || row.spend_usd < 0) return false;
  if (!Number.isInteger(row?.error_count) || row.error_count < 0) return false;
  if (testedMs > nowMs + MAX_FUTURE_SKEW_MS) return false;
  if (nowMs - testedMs > MAX_RECEIPT_AGE_MS) return false;
  return true;
}

function evaluate(row: any, sourceSha: string): ValidatorReceipt {
  const pass = row.http_status === 200
    && row.schema_valid === true
    && row.spend_usd === 0
    && row.error_count === 0;
  return buildReceipt({
    gate_id: 'ai.gateway_available',
    validator_id: 'ai_gateway_no_spend_receipt_probe',
    validator_version: '1.0.0',
    status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha,
    metric_value: row.http_status,
    threshold: 'status=200 + schema_valid=true + spend_usd=0 + exact SHA + sandbox/test + no live side effects',
    command_or_probe: 'AiGatewayValidationReceipt availability/schema evidence',
    exit_code: pass ? 0 : 1,
    evidence_refs: [row.artifact_ref],
    stdout_summary: `receipt=${row.receipt_id}; env=${row.environment}; status=${row.http_status}; schema_valid=${row.schema_valid}; spend_usd=${row.spend_usd}; errors=${row.error_count}`,
    reason: pass
      ? `Independent no-spend AI Gateway receipt passed for exact SHA ${sourceSha.slice(0, 8)}.`
      : `Independent AI Gateway receipt failed status/schema/no-spend requirements for exact SHA ${sourceSha.slice(0, 8)}.`,
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
      const receipt = unknownReceipt(null, 'Canonical source SHA could not be resolved.');
      return Response.json({ source_sha: null, receipts: [receipt], source_sha_error: shaResult.error || null });
    }

    const nowMs = Date.now();
    const rows = await base44.asServiceRole.entities.AiGatewayValidationReceipt.list('-tested_at', 50).catch(() => []);
    const exactRows = (rows || [])
      .filter((row: any) => isEligibleReceipt(row, sourceSha, nowMs))
      .sort((a: any, b: any) => Date.parse(b.tested_at) - Date.parse(a.tested_at));

    const receipt = exactRows.length === 0
      ? unknownReceipt(sourceSha, 'No fresh, well-formed, exact-SHA sandbox/test AiGatewayValidationReceipt from the independent no-spend producer exists.')
      : evaluate(exactRows[0], sourceSha);

    await base44.asServiceRole.entities.GateResult.create({
      gate_id: receipt.gate_id,
      category: 'AI',
      mandatory: true,
      status: receipt.status,
      evidence_refs: receipt.evidence_refs,
      detail: `${receipt.validator_id} v${receipt.validator_version}: ${receipt.reason}`,
      last_passed_at: receipt.status === 'PASS' ? receipt.completed_at : null,
      source_sha: receipt.source_sha,
      artifact_refs: receipt.artifact_refs,
      evaluated_at: receipt.completed_at,
    }).catch(() => {});

    return Response.json({
      source_sha: sourceSha,
      source_branch: shaResult.branch,
      eligible_receipt_count: exactRows.length,
      receipts: [receipt],
    });
  } catch (error) {
    console.error('validateAiGatewayGate error', error);
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
