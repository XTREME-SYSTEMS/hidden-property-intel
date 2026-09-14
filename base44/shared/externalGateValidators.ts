import { buildReceipt, type ValidatorReceipt } from './validatorContract.ts';

const MAX_RECEIPT_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

function freshTimestamp(value: unknown, nowMs: number): boolean {
  const testedMs = Date.parse(typeof value === 'string' ? value : '');
  if (!Number.isFinite(testedMs)) return false;
  if (testedMs > nowMs + MAX_FUTURE_SKEW_MS) return false;
  if (nowMs - testedMs > MAX_RECEIPT_AGE_MS) return false;
  return true;
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function unknown(gateId: string, validatorId: string, sourceSha: string | null, threshold: string, probe: string, reason: string): ValidatorReceipt {
  return buildReceipt({
    gate_id: gateId,
    validator_id: validatorId,
    validator_version: '1.0.0',
    status: sourceSha ? 'UNKNOWN' : 'BLOCKED',
    source_sha: sourceSha,
    threshold,
    command_or_probe: probe,
    reason,
  });
}

export function validateAuthEvidence(rows: any[], sourceSha: string | null, nowMs = Date.now()): ValidatorReceipt[] {
  const loginThreshold = 'login/register/reset succeeds; error_count=0; exact SHA; sandbox/test only; no live side effects';
  const sessionThreshold = 'session persists + restores; error_count=0; exact SHA; sandbox/test only; no live side effects';
  const probe = 'AuthValidationReceipt exact source_sha from independent Playwright sandbox/test producer';
  if (!sourceSha) {
    return [
      unknown('auth.login_flow', 'auth_sandbox_receipt_probe', null, loginThreshold, probe, 'Canonical source SHA is unavailable.'),
      unknown('auth.session', 'auth_sandbox_receipt_probe', null, sessionThreshold, probe, 'Canonical source SHA is unavailable.'),
    ];
  }

  const bools = ['login_ok', 'register_ok', 'reset_request_ok', 'reset_complete_ok', 'session_persist_ok', 'session_restore_ok'];
  const eligible = (rows || []).filter((row: any) =>
    row?.source_sha === sourceSha
    && ['sandbox', 'test'].includes(row?.environment)
    && row?.producer === 'playwright-auth-validator'
    && row?.live_side_effects === false
    && nonempty(row?.receipt_id)
    && nonempty(row?.artifact_ref)
    && Number.isInteger(row?.error_count)
    && row.error_count >= 0
    && bools.every((field) => typeof row?.[field] === 'boolean')
    && freshTimestamp(row?.tested_at, nowMs)
  ).sort((a: any, b: any) => Date.parse(b.tested_at) - Date.parse(a.tested_at));

  if (eligible.length === 0) {
    return [
      unknown('auth.login_flow', 'auth_sandbox_receipt_probe', sourceSha, loginThreshold, probe, 'No fresh, well-formed, exact-SHA sandbox/test auth receipt exists.'),
      unknown('auth.session', 'auth_sandbox_receipt_probe', sourceSha, sessionThreshold, probe, 'No fresh, well-formed, exact-SHA sandbox/test auth receipt exists.'),
    ];
  }

  const row = eligible[0];
  const loginPass = row.login_ok && row.register_ok && row.reset_request_ok && row.reset_complete_ok && row.error_count === 0;
  const sessionPass = row.session_persist_ok && row.session_restore_ok && row.error_count === 0;
  return [
    buildReceipt({
      gate_id: 'auth.login_flow', validator_id: 'auth_sandbox_receipt_probe', validator_version: '1.0.0',
      status: loginPass ? 'PASS' : 'FAIL', source_sha: sourceSha, metric_value: loginPass ? 1 : 0,
      threshold: loginThreshold, command_or_probe: probe, exit_code: loginPass ? 0 : 1,
      evidence_refs: [row.artifact_ref],
      stdout_summary: `receipt=${row.receipt_id}; env=${row.environment}; login=${row.login_ok}; register=${row.register_ok}; reset_request=${row.reset_request_ok}; reset_complete=${row.reset_complete_ok}; errors=${row.error_count}`,
      reason: loginPass ? `Independent auth-flow receipt passed for exact SHA ${sourceSha.slice(0, 8)}.` : `Independent auth-flow receipt failed one or more required steps for exact SHA ${sourceSha.slice(0, 8)}.`,
    }),
    buildReceipt({
      gate_id: 'auth.session', validator_id: 'auth_sandbox_receipt_probe', validator_version: '1.0.0',
      status: sessionPass ? 'PASS' : 'FAIL', source_sha: sourceSha, metric_value: sessionPass ? 1 : 0,
      threshold: sessionThreshold, command_or_probe: probe, exit_code: sessionPass ? 0 : 1,
      evidence_refs: [row.artifact_ref],
      stdout_summary: `receipt=${row.receipt_id}; env=${row.environment}; persist=${row.session_persist_ok}; restore=${row.session_restore_ok}; errors=${row.error_count}`,
      reason: sessionPass ? `Independent session receipt passed for exact SHA ${sourceSha.slice(0, 8)}.` : `Independent session receipt failed persistence or restoration for exact SHA ${sourceSha.slice(0, 8)}.`,
    }),
  ];
}

export function validateRlsEvidence(rows: any[], sourceSha: string | null, nowMs = Date.now()): ValidatorReceipt[] {
  const adminThreshold = 'unauthorized CRUD rejected on admin-only entities; cleanup_ok=true; error_count=0; exact SHA; sandbox/test only';
  const isolationThreshold = 'cross-user CRUD rejected; cleanup_ok=true; error_count=0; exact SHA; sandbox/test only';
  const probe = 'RlsValidationReceipt exact source_sha from independent sandbox/test matrix producer';
  if (!sourceSha) {
    return [
      unknown('rls.admin_only_entities', 'rls_matrix_receipt_probe', null, adminThreshold, probe, 'Canonical source SHA is unavailable.'),
      unknown('rls.user_isolation', 'rls_matrix_receipt_probe', null, isolationThreshold, probe, 'Canonical source SHA is unavailable.'),
    ];
  }

  const bools = [
    'admin_read_rejected', 'admin_create_rejected', 'admin_update_rejected', 'admin_delete_rejected',
    'cross_user_read_rejected', 'cross_user_create_rejected', 'cross_user_update_rejected', 'cross_user_delete_rejected', 'cleanup_ok',
  ];
  const eligible = (rows || []).filter((row: any) =>
    row?.source_sha === sourceSha
    && ['sandbox', 'test'].includes(row?.environment)
    && row?.producer === 'rls-matrix-validator'
    && row?.live_side_effects === false
    && nonempty(row?.receipt_id)
    && nonempty(row?.artifact_ref)
    && Number.isInteger(row?.error_count)
    && row.error_count >= 0
    && bools.every((field) => typeof row?.[field] === 'boolean')
    && freshTimestamp(row?.tested_at, nowMs)
  ).sort((a: any, b: any) => Date.parse(b.tested_at) - Date.parse(a.tested_at));

  if (eligible.length === 0) {
    return [
      unknown('rls.admin_only_entities', 'rls_matrix_receipt_probe', sourceSha, adminThreshold, probe, 'No fresh, well-formed, exact-SHA sandbox/test RLS matrix receipt exists.'),
      unknown('rls.user_isolation', 'rls_matrix_receipt_probe', sourceSha, isolationThreshold, probe, 'No fresh, well-formed, exact-SHA sandbox/test RLS matrix receipt exists.'),
    ];
  }

  const row = eligible[0];
  const adminPass = row.admin_read_rejected && row.admin_create_rejected && row.admin_update_rejected && row.admin_delete_rejected && row.cleanup_ok && row.error_count === 0;
  const isolationPass = row.cross_user_read_rejected && row.cross_user_create_rejected && row.cross_user_update_rejected && row.cross_user_delete_rejected && row.cleanup_ok && row.error_count === 0;
  return [
    buildReceipt({
      gate_id: 'rls.admin_only_entities', validator_id: 'rls_matrix_receipt_probe', validator_version: '1.0.0',
      status: adminPass ? 'PASS' : 'FAIL', source_sha: sourceSha, metric_value: adminPass ? 1 : 0,
      threshold: adminThreshold, command_or_probe: probe, exit_code: adminPass ? 0 : 1, evidence_refs: [row.artifact_ref],
      stdout_summary: `receipt=${row.receipt_id}; env=${row.environment}; read=${row.admin_read_rejected}; create=${row.admin_create_rejected}; update=${row.admin_update_rejected}; delete=${row.admin_delete_rejected}; cleanup=${row.cleanup_ok}; errors=${row.error_count}`,
      reason: adminPass ? `Independent admin-only RLS matrix passed for exact SHA ${sourceSha.slice(0, 8)}.` : `Independent admin-only RLS matrix failed one or more rejection/cleanup checks for exact SHA ${sourceSha.slice(0, 8)}.`,
    }),
    buildReceipt({
      gate_id: 'rls.user_isolation', validator_id: 'rls_matrix_receipt_probe', validator_version: '1.0.0',
      status: isolationPass ? 'PASS' : 'FAIL', source_sha: sourceSha, metric_value: isolationPass ? 1 : 0,
      threshold: isolationThreshold, command_or_probe: probe, exit_code: isolationPass ? 0 : 1, evidence_refs: [row.artifact_ref],
      stdout_summary: `receipt=${row.receipt_id}; env=${row.environment}; read=${row.cross_user_read_rejected}; create=${row.cross_user_create_rejected}; update=${row.cross_user_update_rejected}; delete=${row.cross_user_delete_rejected}; cleanup=${row.cleanup_ok}; errors=${row.error_count}`,
      reason: isolationPass ? `Independent user-isolation RLS matrix passed for exact SHA ${sourceSha.slice(0, 8)}.` : `Independent user-isolation RLS matrix failed one or more rejection/cleanup checks for exact SHA ${sourceSha.slice(0, 8)}.`,
    }),
  ];
}

export function validateAiGatewayEvidence(rows: any[], sourceSha: string | null, nowMs = Date.now()): ValidatorReceipt[] {
  const threshold = 'status=200 + schema_valid=true + spend_usd=0 + exact SHA + sandbox/test + no live side effects';
  const probe = 'AiGatewayValidationReceipt exact source_sha from independent no-spend producer';
  if (!sourceSha) return [unknown('ai.gateway_available', 'ai_gateway_no_spend_receipt_probe', null, threshold, probe, 'Canonical source SHA is unavailable.')];
  const eligible = (rows || []).filter((row: any) =>
    row?.source_sha === sourceSha
    && ['sandbox', 'test'].includes(row?.environment)
    && row?.producer === 'ai-gateway-no-spend-validator'
    && row?.live_side_effects === false
    && nonempty(row?.receipt_id)
    && nonempty(row?.artifact_ref)
    && nonempty(row?.request_id)
    && Number.isInteger(row?.http_status)
    && typeof row?.schema_valid === 'boolean'
    && typeof row?.spend_usd === 'number' && row.spend_usd >= 0
    && Number.isInteger(row?.error_count) && row.error_count >= 0
    && freshTimestamp(row?.tested_at, nowMs)
  ).sort((a: any, b: any) => Date.parse(b.tested_at) - Date.parse(a.tested_at));
  if (eligible.length === 0) return [unknown('ai.gateway_available', 'ai_gateway_no_spend_receipt_probe', sourceSha, threshold, probe, 'No fresh, well-formed, exact-SHA no-spend AI Gateway receipt exists.')];
  const row = eligible[0];
  const pass = row.http_status === 200 && row.schema_valid === true && row.spend_usd === 0 && row.error_count === 0;
  return [buildReceipt({
    gate_id: 'ai.gateway_available', validator_id: 'ai_gateway_no_spend_receipt_probe', validator_version: '1.0.0',
    status: pass ? 'PASS' : 'FAIL', source_sha: sourceSha, metric_value: row.http_status, threshold,
    command_or_probe: probe, exit_code: pass ? 0 : 1, evidence_refs: [row.artifact_ref],
    stdout_summary: `receipt=${row.receipt_id}; env=${row.environment}; status=${row.http_status}; schema_valid=${row.schema_valid}; spend_usd=${row.spend_usd}; errors=${row.error_count}`,
    reason: pass ? `Independent no-spend AI Gateway receipt passed for exact SHA ${sourceSha.slice(0, 8)}.` : `Independent AI Gateway receipt failed status/schema/no-spend requirements for exact SHA ${sourceSha.slice(0, 8)}.`,
  })];
}

export function validatePaymentEvidence(rows: any[], sourceSha: string | null, nowMs = Date.now()): ValidatorReceipt[] {
  const webhookThreshold = 'valid signature returns 2xx; invalid signature returns 4xx; exact SHA; sandbox/test only';
  const checkoutThreshold = 'sandbox checkout session created; no live charge; cleanup_ok=true; exact SHA';
  const probe = 'PaymentValidationReceipt exact source_sha from independent sandbox producer';
  if (!sourceSha) {
    return [
      unknown('payments.webhook_verified', 'payment_sandbox_receipt_probe', null, webhookThreshold, probe, 'Canonical source SHA is unavailable.'),
      unknown('payments.checkout_smoke', 'payment_sandbox_receipt_probe', null, checkoutThreshold, probe, 'Canonical source SHA is unavailable.'),
    ];
  }
  const eligible = (rows || []).filter((row: any) =>
    row?.source_sha === sourceSha
    && ['sandbox', 'test'].includes(row?.environment)
    && row?.producer === 'payment-sandbox-validator'
    && row?.live_side_effects === false
    && row?.live_charge_created === false
    && nonempty(row?.receipt_id)
    && nonempty(row?.artifact_ref)
    && typeof row?.checkout_session_id === 'string'
    && Number.isInteger(row?.valid_signature_status)
    && Number.isInteger(row?.invalid_signature_status)
    && typeof row?.checkout_session_created === 'boolean'
    && typeof row?.cleanup_ok === 'boolean'
    && Number.isInteger(row?.error_count) && row.error_count >= 0
    && freshTimestamp(row?.tested_at, nowMs)
  ).sort((a: any, b: any) => Date.parse(b.tested_at) - Date.parse(a.tested_at));
  if (eligible.length === 0) {
    return [
      unknown('payments.webhook_verified', 'payment_sandbox_receipt_probe', sourceSha, webhookThreshold, probe, 'No fresh, well-formed, exact-SHA sandbox payment receipt exists.'),
      unknown('payments.checkout_smoke', 'payment_sandbox_receipt_probe', sourceSha, checkoutThreshold, probe, 'No fresh, well-formed, exact-SHA sandbox payment receipt exists.'),
    ];
  }
  const row = eligible[0];
  const webhookPass = row.valid_signature_status >= 200 && row.valid_signature_status < 300 && row.invalid_signature_status >= 400 && row.invalid_signature_status < 500 && row.error_count === 0;
  const checkoutPass = row.checkout_session_created === true && row.checkout_session_id.trim().length > 0 && row.live_charge_created === false && row.cleanup_ok === true && row.error_count === 0;
  return [
    buildReceipt({
      gate_id: 'payments.webhook_verified', validator_id: 'payment_sandbox_receipt_probe', validator_version: '1.0.0',
      status: webhookPass ? 'PASS' : 'FAIL', source_sha: sourceSha, metric_value: `${row.valid_signature_status}/${row.invalid_signature_status}`,
      threshold: webhookThreshold, command_or_probe: probe, exit_code: webhookPass ? 0 : 1, evidence_refs: [row.artifact_ref],
      stdout_summary: `receipt=${row.receipt_id}; env=${row.environment}; valid_signature_status=${row.valid_signature_status}; invalid_signature_status=${row.invalid_signature_status}; errors=${row.error_count}`,
      reason: webhookPass ? `Independent sandbox webhook receipt passed for exact SHA ${sourceSha.slice(0, 8)}.` : `Independent sandbox webhook receipt failed required signature status behavior for exact SHA ${sourceSha.slice(0, 8)}.`,
    }),
    buildReceipt({
      gate_id: 'payments.checkout_smoke', validator_id: 'payment_sandbox_receipt_probe', validator_version: '1.0.0',
      status: checkoutPass ? 'PASS' : 'FAIL', source_sha: sourceSha, metric_value: checkoutPass ? 1 : 0,
      threshold: checkoutThreshold, command_or_probe: probe, exit_code: checkoutPass ? 0 : 1, evidence_refs: [row.artifact_ref],
      stdout_summary: `receipt=${row.receipt_id}; env=${row.environment}; session_created=${row.checkout_session_created}; session_id_present=${row.checkout_session_id.trim().length > 0}; live_charge=${row.live_charge_created}; cleanup=${row.cleanup_ok}; errors=${row.error_count}`,
      reason: checkoutPass ? `Independent sandbox checkout receipt passed for exact SHA ${sourceSha.slice(0, 8)} with no live charge.` : `Independent sandbox checkout receipt failed session/no-live-charge/cleanup requirements for exact SHA ${sourceSha.slice(0, 8)}.`,
    }),
  ];
}
