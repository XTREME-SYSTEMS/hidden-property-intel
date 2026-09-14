import fs from 'node:fs';

const contractPath = 'scripts/alpha-prime/workflow-runtime-takeover-contract.json';
const jobEnginePath = 'base44/shared/jobEngine.ts';
const systemAuditPath = 'base44/functions/systemAudit/entry.ts';
const failures = [];

for (const path of [contractPath, jobEnginePath, systemAuditPath]) {
  if (!fs.existsSync(path)) failures.push(`missing required source: ${path}`);
}

if (failures.length) {
  console.error(`workflow-runtime-takeover-contract-audit FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const jobEngine = fs.readFileSync(jobEnginePath, 'utf8');
const systemAudit = fs.readFileSync(systemAuditPath, 'utf8');

const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

const includesAll = (actual, required, label) => {
  expect(Array.isArray(actual), `${label} must be an array`);
  if (!Array.isArray(actual)) return;
  for (const item of required) expect(actual.includes(item), `${label} missing ${item}`);
};

expect(contract.contract_version === 1, 'contract_version must be 1');
expect(contract.scope === 'branch-sandbox-validation-only', 'scope must remain branch/sandbox validation only');
expect(contract.primary_runtime === 'Base44 scheduled workflow runtime', 'primary runtime identity changed');
expect(contract.takeover_runtime === 'independent Xtreme OS / PGMQ worker plane', 'takeover runtime identity changed');
expect(contract.runtime_proof_required_before_spof_clear === true, 'runtime proof must remain mandatory before clearing the SPOF');
expect(typeof contract.pass_semantics === 'string' && contract.pass_semantics.includes('does not prove live takeover'), 'contract must state that contract PASS is not takeover PASS');

const requiredInterface = ['createJob', 'claimNextJob', 'completeJob', 'failJob'];
includesAll(contract.base44_job_interface, requiredInterface, 'base44_job_interface');
for (const fn of requiredInterface) {
  expect(new RegExp(`export\\s+async\\s+function\\s+${fn}\\b`).test(jobEngine), `jobEngine no longer exports ${fn}`);
}
expect(jobEngine.includes('This is NOT a distributed queue'), 'jobEngine distributed-runtime limitation is no longer explicit');

includesAll(contract.required_job_fields, [
  'job_id', 'job_type', 'payload', 'correlation_id', 'attempt', 'max_attempts',
  'timeout_seconds', 'idempotency_key', 'status', 'lease_expires_at', 'environment', 'source_version'
], 'required_job_fields');

includesAll(contract.required_attempt_fields, [
  'job_id', 'worker_id', 'pgmq_message_id', 'attempt', 'status', 'error', 'started_at', 'completed_at'
], 'required_attempt_fields');

includesAll(contract.required_worker_fields, [
  'worker_id', 'worker_type', 'capabilities', 'environment', 'status', 'current_job', 'last_heartbeat'
], 'required_worker_fields');

includesAll(contract.required_takeover_behaviors, [
  'exact_source_version_required',
  'deterministic_idempotency_key_required',
  'single_claim_or_lease_owner',
  'retry_with_bounded_attempts',
  'dead_letter_after_retry_exhaustion',
  'independent_heartbeat_or_lease_continuity',
  'evidence_receipt_source_stamped',
  'stale_or_foreign_source_evidence_rejected',
  'failback_reconciliation_is_idempotent',
  'no_duplicate_jobs_findings_repairs_or_receipts'
], 'required_takeover_behaviors');

includesAll(contract.proof_sequence, [
  'baseline_primary_available',
  'simulate_base44_workflow_runtime_unavailable',
  'enqueue_harmless_exact_sha_validation_job',
  'claim_once_on_independent_worker',
  'exercise_retry_and_dead_letter_fixture',
  'verify_external_heartbeat_or_lease_continuity',
  'restore_primary_runtime',
  'reconcile_without_duplicate_dispatch',
  'emit_exact_sha_takeover_and_failback_receipts',
  'rerun_nearby_regressions'
], 'proof_sequence');

includesAll(contract.forbidden_shortcuts, [
  'remove_or_weaken_critical_spof_declaration',
  'treat_control_plane_health_as_takeover_proof',
  'treat_contract_completeness_as_runtime_takeover_pass',
  'use_stale_or_foreign_sha_receipts',
  'write_to_production_xtreme_os_for_validation',
  'change_secrets_or_production_schema',
  'incur_spend'
], 'forbidden_shortcuts');

expect(/critical_spof:\s*\[\s*['"]Base44 entity DB['"]\s*,\s*['"]Base44 workflow runtime['"]\s*\]/s.test(systemAudit), 'critical SPOF declarations were removed, renamed, or weakened before runtime proof');
expect(!/[0-9a-f]{40}/i.test(JSON.stringify(contract)), 'contract must not hardcode a source SHA; runtime evidence must stamp the exact executing SHA');

if (failures.length) {
  console.error(`workflow-runtime-takeover-contract-audit FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

const sourceSha = process.env.GITHUB_SHA || 'local-unbound';
console.log(`workflow-runtime-takeover-contract-audit PASS on ${sourceSha}`);
console.log('Contract completeness is proven; workflow-runtime takeover is NOT proven and resilience-fallback must remain FAIL until independent runtime + failback evidence passes.');
