import fs from 'node:fs';

const contractPath = 'scripts/alpha-prime/entity-data-takeover-contract.json';
const syncToPath = 'base44/functions/syncToSupabase/entry.ts';
const syncFromPath = 'base44/functions/syncFromSupabase/entry.ts';
const systemAuditPath = 'base44/functions/systemAudit/entry.ts';
const failures = [];

const expect = (condition, message) => { if (!condition) failures.push(message); };
const includesAll = (actual, required, label) => {
  expect(Array.isArray(actual), `${label} must be an array`);
  if (!Array.isArray(actual)) return;
  for (const item of required) expect(actual.includes(item), `${label} missing ${item}`);
};

for (const path of [contractPath, syncToPath, syncFromPath, systemAuditPath]) {
  if (!fs.existsSync(path)) failures.push(`missing required source: ${path}`);
}
if (failures.length) {
  console.error(`entity-data-takeover-contract-audit FAIL: ${failures.length} issue(s)`);
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const syncTo = fs.readFileSync(syncToPath, 'utf8');
const syncFrom = fs.readFileSync(syncFromPath, 'utf8');
const systemAudit = fs.readFileSync(systemAuditPath, 'utf8');

expect(contract.contract_version === 1, 'contract_version must be 1');
expect(contract.scope === 'branch-sandbox-validation-only', 'scope must remain branch/sandbox validation only');
expect(contract.primary_store === 'Base44 entity DB', 'primary store identity changed');
expect(contract.runtime_proof_required_before_spof_clear === true, 'runtime proof must remain mandatory before clearing the entity DB SPOF');
expect(typeof contract.pass_semantics === 'string' && contract.pass_semantics.includes('does not prove datastore takeover'), 'contract must say contract PASS is not datastore takeover PASS');

const domain = ['Property','PropertyScore','Owner','InvestorLead','Deal'];
const governor = ['GateResult','HeartbeatReceipt','ValidationTask','Finding','RepairTask','ValidationReceipt','SubsystemState','GovernanceReview'];
includesAll(contract.minimum_domain_entities, domain, 'minimum_domain_entities');
includesAll(contract.minimum_governor_entities, governor, 'minimum_governor_entities');

for (const entity of [...domain, ...governor]) {
  const schemaPath = `base44/entities/${entity}.jsonc`;
  expect(fs.existsSync(schemaPath), `missing entity schema required by takeover contract: ${schemaPath}`);
}

includesAll(contract.required_takeover_behaviors, [
  'exact_source_sha_required','stable_entity_identity_required','idempotent_upsert_required',
  'outage_writes_buffered_or_committed_to_takeover_store','tombstone_or_delete_semantics_defined_without_destructive_test',
  'conflict_resolution_is_deterministic','ordering_or_version_rule_defined','stale_or_foreign_sha_evidence_rejected',
  'failback_reconciliation_is_idempotent','no_duplicate_domain_or_governor_records',
  'read_after_write_consistency_proven_for_validation_fixture','takeover_store_is_executable_without_base44_runtime'
], 'required_takeover_behaviors');

includesAll(contract.proof_sequence, [
  'baseline_primary_available','seed_harmless_exact_sha_fixture','simulate_base44_entity_db_unavailable',
  'write_fixture_to_takeover_store','read_fixture_from_takeover_store','exercise_idempotent_duplicate_write',
  'exercise_deterministic_conflict_fixture','restore_primary_store','reconcile_domain_and_governor_fixture',
  'verify_zero_duplicate_records','emit_exact_sha_takeover_and_failback_receipts','rerun_nearby_regressions'
], 'proof_sequence');

includesAll(contract.existing_mirror_limitations, [
  'current_sync_to_supabase_runs_inside_base44_runtime','current_sync_from_supabase_runs_inside_base44_runtime',
  'current_mirror_covers_only_minimum_domain_entities','current_mirror_does_not_prove_governor_state_takeover'
], 'existing_mirror_limitations');

includesAll(contract.forbidden_shortcuts, [
  'remove_or_weaken_critical_spof_declaration','treat_existing_mirror_as_takeover_proof',
  'treat_contract_completeness_as_datastore_takeover_pass','use_stale_or_foreign_sha_receipts',
  'mutate_or_delete_production_property_data_for_validation','change_production_rls_or_schema','change_secrets','incur_spend'
], 'forbidden_shortcuts');

expect(syncTo.includes("import { secrets } from 'base44:runtime'"), 'syncToSupabase is no longer demonstrably Base44-runtime coupled; review contract assumptions');
expect(syncFrom.includes("import { secrets } from 'base44:runtime'") || syncFrom.includes('base44'), 'syncFromSupabase Base44-runtime coupling assumption changed; review contract assumptions');
for (const entity of domain) expect(syncTo.includes(entity), `syncToSupabase no longer visibly includes mirrored domain entity ${entity}`);
expect(!governor.every((entity) => syncTo.includes(entity)), 'existing mirror appears to include the full governor set; re-evaluate mirror limitation instead of claiming a gap');
expect(/critical_spof:\s*\[\s*['"]Base44 entity DB['"]\s*,\s*['"]Base44 workflow runtime['"]\s*\]/s.test(systemAudit), 'critical SPOF declarations were removed, renamed, or weakened before runtime proof');
expect(!/[0-9a-f]{40}/i.test(JSON.stringify(contract)), 'contract must not hardcode a source SHA');

if (failures.length) {
  console.error(`entity-data-takeover-contract-audit FAIL: ${failures.length} issue(s)`);
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}

const sourceSha = process.env.GITHUB_SHA || 'local-unbound';
console.log(`entity-data-takeover-contract-audit PASS on ${sourceSha}`);
console.log('Contract completeness is proven; Base44-independent datastore takeover is NOT proven and the entity DB SPOF must remain active until outage + failback evidence passes.');
