import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { buildReceipt, resolveSourceSha, type GithubSecrets, type ValidatorReceipt } from '../../shared/validatorContract.ts';

const MAX_RECEIPT_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

function isEligibleReceipt(row: any, sourceSha: string, nowMs: number): boolean {
  const testedMs = Date.parse(row?.tested_at || '');
  if (!Number.isFinite(testedMs)) return false;
  if (row?.source_sha !== sourceSha) return false;
  if (!['sandbox', 'test'].includes(row?.environment)) return false;
  if (row?.producer !== 'payment-sandbox-validator') return false;
  if (row?.live_side_effects !== false) return false;
  if (row?.live_charge_created !== false) return false;
  if (typeof row?.receipt_id !== 'string' || row.receipt_id.trim().length === 0) return false;
  if (typeof row?.artifact_ref !== 'string' || row.artifact_ref.trim().length === 0) return false;
  if (typeof row?.checkout_session_id !== 'string') return false;
  if (!Number.isInteger(row?.valid_signature_status)) return false;
  if (!Number.isInteger(row?.invalid_signature_status)) return false;
  if (typeof row?.checkout_session_created !== 'boolean') return false;
  if (typeof row?.cleanup_ok !== 'boolean') return false;
  if (!Number.isInteger(row?.error_count) || row.error_count < 0) return false;
  if (testedMs > nowMs + MAX_FUTURE_SKEW_MS) return false;
  if (nowMs - testedMs > MAX_RECEIPT_AGE_MS) return false;
  return true;
}

function unknownReceipt(gateId: string, sourceSha: string | null, reason: string): ValidatorReceipt {
  return buildReceipt({
    gate_id: gateId,
    validator_id: 'payment_sandbox_receipt_probe',
    validator_version: '1.0.0',
    status: sourceSha ? 'UNKNOWN' : 'BLOCKED',
    source_sha: sourceSha,
    threshold: gateId === 'payments.webhook_verified'
      ? 'valid signature returns 2xx; invalid signature returns 4xx; exact SHA; sandbox/test only'
      : 'sandbox checkout session created; no live charge; exact SHA; cleanup confirmed',
    command_or_probe: 'PaymentValidationReceipt exact source_sha from independent sandbox producer',
    reason,
  });
}

function validateWebhook(row: any, sourceSha: string): ValidatorReceipt {
  const valid2xx = row.valid_signature_status >= 200 && row.valid_signature_status < 300;
  const invalid4xx = row.invalid_signature_status >= 400 && row.invalid_signature_status < 500;
  const pass = valid2xx && invalid4xx && row.error_count === 0;
  return buildReceipt({
    gate_id: 'payments.webhook_verified',
    validator_id: 'payment_sandbox_receipt_probe',
    validator_version: '1.0.0',
    status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha,
    metric_value: `${row.valid_signature_status}/${row.invalid_signature_status}`,
    threshold: 'valid signature returns 2xx; invalid signature returns 4xx; error_count=0; exact SHA; sandbox/test only',
    command_or_probe: 'PaymentValidationReceipt webhook signature evidence',
    exit_code: pass ? 0 : 1,
    evidence_refs: [row.artifact_ref],
    stdout_summary: `receipt=${row.receipt_id}; env=${row.environment}; valid_signature_status=${row.valid_signature_status}; invalid_signature_status=${row.invalid_signature_status}; errors=${row.error_count}`,
    reason: pass
      ? `Independent sandbox webhook signature receipt passed for exact SHA ${sourceSha.slice(0, 8)}.`
      : `Independent sandbox webhook signature receipt failed required status-code behavior for exact SHA ${sourceSha.slice(0, 8)}.`,
  });
}

function validateCheckout(row: any, sourceSha: string): ValidatorReceipt {
  const pass = row.checkout_session_created === true
    && row.checkout_session_id.trim().length > 0
    && row.live_charge_created === false
    && row.cleanup_ok === true
    && row.error_count === 0;
  return buildReceipt({
    gate_id: 'payments.checkout_smoke',
    validator_id: 'payment_sandbox_receipt_probe',
    validator_version: '1.0.0',
    status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha,
    metric_value: pass ? 1 : 0,
    threshold: 'sandbox checkout session created; no live charge; cleanup_ok=true; error_count=0; exact SHA',
    command_or_probe: 'PaymentValidationReceipt sandbox checkout evidence',
    exit_code: pass ? 0 : 1,
    evidence_refs: [row.artifact_ref],
    stdout_summary: `receipt=${row.receipt_id}; env=${row.environment}; session_created=${row.checkout_session_created}; session_id_present=${row.checkout_session_id.trim().length > 0}; live_charge=${row.live_charge_created}; cleanup=${row.cleanup_ok}; errors=${row.error_count}`,
    reason: pass
      ? `Independent sandbox checkout receipt passed for exact SHA ${sourceSha.slice(0, 8)} with no live charge.`
      : `Independent sandbox checkout receipt failed session/no-live-charge/cleanup requirements for exact SHA ${sourceSha.slice(0, 8)}.`,
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
        unknownReceipt('payments.webhook_verified', null, 'Canonical source SHA could not be resolved.'),
        unknownReceipt('payments.checkout_smoke', null, 'Canonical source SHA could not be resolved.'),
      ];
      return Response.json({ source_sha: null, receipts: blocked, source_sha_error: shaResult.error || null });
    }

    const nowMs = Date.now();
    const rows = await base44.asServiceRole.entities.PaymentValidationReceipt.list('-tested_at', 50).catch(() => []);
    const exactRows = (rows || [])
      .filter((row: any) => isEligibleReceipt(row, sourceSha, nowMs))
      .sort((a: any, b: any) => Date.parse(b.tested_at) - Date.parse(a.tested_at));

    let receipts: ValidatorReceipt[];
    if (exactRows.length === 0) {
      receipts = [
        unknownReceipt('payments.webhook_verified', sourceSha, 'No fresh, well-formed, exact-SHA sandbox/test PaymentValidationReceipt from the independent producer exists.'),
        unknownReceipt('payments.checkout_smoke', sourceSha, 'No fresh, well-formed, exact-SHA sandbox/test PaymentValidationReceipt from the independent producer exists.'),
      ];
    } else {
      const latest = exactRows[0];
      receipts = [validateWebhook(latest, sourceSha), validateCheckout(latest, sourceSha)];
    }

    for (const receipt of receipts) {
      await base44.asServiceRole.entities.GateResult.create({
        gate_id: receipt.gate_id,
        category: 'PAYMENTS',
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
    console.error('validatePaymentGates error', error);
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
