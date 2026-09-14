import fs from 'node:fs';
import path from 'node:path';

const lane = process.argv[2];
const sourceSha = (process.env.SOURCE_SHA || '').trim();
const evidenceDir = process.env.EVIDENCE_DIR || 'artifacts/alpha-prime';

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function requireExactSha(value, label = 'source_sha') {
  requireCondition(/^[0-9a-f]{40}$/i.test(value || ''), `${label} must be an exact 40-character Git SHA`);
  requireCondition(value === sourceSha, `${label} must equal exact SOURCE_SHA ${sourceSha}`);
}

function writeEvidence(fileName, payload) {
  fs.mkdirSync(evidenceDir, { recursive: true });
  const filePath = path.join(evidenceDir, fileName);
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(payload, null, 2));
  console.log(`evidence_file=${filePath}`);
}

requireCondition(/^[0-9a-f]{40}$/i.test(sourceSha), 'SOURCE_SHA must be supplied and must be an exact 40-character Git SHA');

function runWorkflowRuntimeFixture() {
  const foreignSha = sourceSha === '0'.repeat(40) ? '1'.repeat(40) : '0'.repeat(40);
  const jobs = new Map();
  const idempotencyIndex = new Map();
  const deadLetter = new Map();
  const receipts = new Map();
  let primaryRuntimeAvailable = true;

  function enqueue(input) {
    requireExactSha(input.source_version, 'source_version');
    requireCondition(input.idempotency_key, 'idempotency_key is required');
    const existingId = idempotencyIndex.get(input.idempotency_key);
    if (existingId) return jobs.get(existingId);
    const job = {
      ...input,
      status: 'queued',
      attempt: 0,
      lease_owner: null,
      lease_expires_at: null,
    };
    jobs.set(job.job_id, job);
    idempotencyIndex.set(job.idempotency_key, job.job_id);
    return job;
  }

  function claim(workerId) {
    const job = [...jobs.values()].find((candidate) => candidate.status === 'queued');
    if (!job) return null;
    job.status = 'leased';
    job.lease_owner = workerId;
    job.lease_expires_at = 'fixture+60s';
    return job;
  }

  function fail(job, error) {
    requireCondition(job.status === 'leased', 'only a leased job can fail');
    job.attempt += 1;
    job.last_error = error;
    job.lease_owner = null;
    job.lease_expires_at = null;
    if (job.attempt >= job.max_attempts) {
      job.status = 'dead_letter';
      deadLetter.set(job.job_id, { ...job });
    } else {
      job.status = 'queued';
    }
  }

  function emitReceipt(event, job) {
    const key = `${event}:${job.job_id}:${sourceSha}`;
    if (!receipts.has(key)) {
      receipts.set(key, {
        event,
        job_id: job.job_id,
        source_sha: sourceSha,
        runtime: 'independent_fixture_worker',
      });
    }
    return receipts.get(key);
  }

  function acceptsEvidence(receipt) {
    return receipt?.source_sha === sourceSha;
  }

  const baseline = { primary_runtime_available: primaryRuntimeAvailable };
  primaryRuntimeAvailable = false;

  const jobInput = {
    job_id: 'hpi-fixture-validation-001',
    job_type: 'alpha_prime_validation_fixture',
    payload: { harmless: true, project_id: 'hidden_property_intel_alpha_prime' },
    correlation_id: 'hpi-alpha-prime-fixture',
    max_attempts: 2,
    timeout_seconds: 30,
    idempotency_key: `${sourceSha}:alpha_prime_validation_fixture:001`,
    environment: 'ci_fixture',
    source_version: sourceSha,
  };

  const firstEnqueue = enqueue(jobInput);
  const duplicateEnqueue = enqueue({ ...jobInput });
  requireCondition(firstEnqueue === duplicateEnqueue, 'duplicate enqueue must resolve to the same job object');
  requireCondition(jobs.size === 1, 'idempotency must prevent duplicate jobs');

  const firstClaim = claim('fixture-worker-1');
  requireCondition(firstClaim?.job_id === jobInput.job_id, 'independent worker must claim the fixture job');
  const concurrentClaim = claim('fixture-worker-2');
  requireCondition(concurrentClaim === null, 'a leased job must not be claimed concurrently');

  fail(firstClaim, 'fixture_retry_1');
  requireCondition(firstClaim.status === 'queued' && firstClaim.attempt === 1, 'first failure must requeue within retry bound');

  const secondClaim = claim('fixture-worker-1');
  requireCondition(secondClaim?.job_id === jobInput.job_id, 'retry must be claimable by the independent worker');
  fail(secondClaim, 'fixture_retry_exhausted');
  requireCondition(secondClaim.status === 'dead_letter', 'retry exhaustion must dead-letter the job');
  requireCondition(deadLetter.size === 1, 'exactly one dead-letter record must exist');

  const externalHeartbeat = {
    worker_id: 'fixture-worker-1',
    runtime: 'independent_fixture_worker',
    source_sha: sourceSha,
    primary_runtime_available: primaryRuntimeAvailable,
    status: 'healthy',
  };
  requireExactSha(externalHeartbeat.source_sha);
  requireCondition(externalHeartbeat.primary_runtime_available === false, 'heartbeat must be emitted while primary runtime is unavailable');

  const takeoverReceipt = emitReceipt('takeover_fixture_complete', secondClaim);
  requireCondition(acceptsEvidence(takeoverReceipt), 'current-SHA takeover evidence must be accepted');
  requireCondition(!acceptsEvidence({ ...takeoverReceipt, source_sha: foreignSha }), 'foreign-SHA evidence must be rejected');

  primaryRuntimeAvailable = true;
  const failbackReceipt1 = emitReceipt('failback_reconciled', secondClaim);
  const failbackReceipt2 = emitReceipt('failback_reconciled', secondClaim);
  requireCondition(failbackReceipt1 === failbackReceipt2, 'failback receipt creation must be idempotent');
  requireCondition(receipts.size === 2, 'exactly one takeover and one failback receipt must exist');

  return {
    lane: 'workflow_runtime_takeover_fixture',
    status: 'PASS',
    source_sha: sourceSha,
    simulation_only: true,
    production_spof_clear_allowed: false,
    baseline,
    proof: {
      primary_runtime_simulated_unavailable: true,
      exact_sha_job_enqueued: true,
      duplicate_enqueue_prevented: jobs.size === 1,
      concurrent_claim_prevented: concurrentClaim === null,
      bounded_retry_attempts: secondClaim.attempt,
      dead_letter_count: deadLetter.size,
      independent_heartbeat_during_outage: externalHeartbeat.status === 'healthy',
      stale_or_foreign_sha_rejected: true,
      failback_receipt_idempotent: failbackReceipt1 === failbackReceipt2,
      duplicate_job_count: 0,
      duplicate_receipt_count: 0,
    },
    limitation: 'Deterministic CI fixture only. It does not execute Xtreme OS/PGMQ or clear the Base44 workflow-runtime SPOF.',
  };
}

function runEntityDataFixture() {
  const foreignSha = sourceSha === 'f'.repeat(40) ? 'e'.repeat(40) : 'f'.repeat(40);
  const domainEntities = ['Property', 'PropertyScore', 'Owner', 'InvestorLead', 'Deal'];
  const governorEntities = ['GateResult', 'HeartbeatReceipt', 'ValidationTask', 'Finding', 'RepairTask', 'ValidationReceipt', 'SubsystemState', 'GovernanceReview'];
  const requiredEntities = [...domainEntities, ...governorEntities];
  const primary = new Map();
  const alternate = new Map();
  const receipts = new Map();
  let primaryAvailable = true;

  const keyOf = (record) => `${record.entity}:${record.id}`;

  function deterministicUpsert(store, record) {
    requireExactSha(record.source_sha);
    requireCondition(record.entity && record.id, 'stable entity identity is required');
    requireCondition(Number.isInteger(record.version) && record.version >= 0, 'integer version is required');
    requireCondition(record.idempotency_key, 'idempotency_key is required');
    const key = keyOf(record);
    const existing = store.get(key);
    if (!existing) {
      store.set(key, structuredClone(record));
      return { applied: true, winner: record.version, reason: 'new' };
    }
    if (existing.idempotency_key === record.idempotency_key && existing.version === record.version) {
      return { applied: false, winner: existing.version, reason: 'idempotent_duplicate' };
    }
    if (record.version > existing.version) {
      store.set(key, structuredClone(record));
      return { applied: true, winner: record.version, reason: 'higher_version_wins' };
    }
    return { applied: false, winner: existing.version, reason: 'existing_version_wins' };
  }

  function read(store, entity, id) {
    return store.get(`${entity}:${id}`) || null;
  }

  function acceptsEvidence(receipt) {
    return receipt?.source_sha === sourceSha;
  }

  function emitReceipt(event) {
    const key = `${event}:${sourceSha}`;
    if (!receipts.has(key)) receipts.set(key, { event, source_sha: sourceSha, store: 'ci_fixture_alternate' });
    return receipts.get(key);
  }

  for (const entity of requiredEntities) {
    deterministicUpsert(primary, {
      entity,
      id: `${entity.toLowerCase()}-fixture`,
      version: 0,
      value: 'baseline',
      idempotency_key: `${sourceSha}:${entity}:baseline`,
      source_sha: sourceSha,
    });
  }
  requireCondition(primary.size === requiredEntities.length, 'baseline primary fixture must contain one stable record per required entity');

  primaryAvailable = false;
  requireCondition(primaryAvailable === false, 'primary entity path must be simulated unavailable');

  for (const entity of requiredEntities) {
    const record = {
      entity,
      id: `${entity.toLowerCase()}-fixture`,
      version: 1,
      value: 'outage_write',
      idempotency_key: `${sourceSha}:${entity}:outage-v1`,
      source_sha: sourceSha,
    };
    const first = deterministicUpsert(alternate, record);
    const duplicate = deterministicUpsert(alternate, { ...record });
    requireCondition(first.applied === true, `${entity} outage write must be committed to alternate store`);
    requireCondition(duplicate.reason === 'idempotent_duplicate', `${entity} duplicate write must be idempotent`);
    requireCondition(read(alternate, entity, record.id)?.value === 'outage_write', `${entity} must be readable from alternate store during outage`);

    const conflict = deterministicUpsert(alternate, {
      ...record,
      version: 2,
      value: 'conflict_winner_v2',
      idempotency_key: `${sourceSha}:${entity}:conflict-v2`,
    });
    requireCondition(conflict.reason === 'higher_version_wins', `${entity} higher version must win deterministically`);

    const staleWrite = deterministicUpsert(alternate, {
      ...record,
      version: 1,
      value: 'stale_loser_v1',
      idempotency_key: `${sourceSha}:${entity}:stale-v1`,
    });
    requireCondition(staleWrite.reason === 'existing_version_wins', `${entity} stale version must lose deterministically`);
  }

  requireCondition(alternate.size === requiredEntities.length, 'alternate store must contain exactly one stable record per required entity');
  const takeoverReceipt = emitReceipt('entity_takeover_fixture_complete');
  requireCondition(acceptsEvidence(takeoverReceipt), 'current-SHA datastore evidence must be accepted');
  requireCondition(!acceptsEvidence({ ...takeoverReceipt, source_sha: foreignSha }), 'foreign-SHA datastore evidence must be rejected');

  primaryAvailable = true;
  for (const record of alternate.values()) {
    deterministicUpsert(primary, record);
    deterministicUpsert(primary, record);
  }

  for (const entity of requiredEntities) {
    const id = `${entity.toLowerCase()}-fixture`;
    const reconciled = read(primary, entity, id);
    requireCondition(reconciled?.version === 2, `${entity} failback must reconcile the deterministic winning version`);
    requireCondition(reconciled?.value === 'conflict_winner_v2', `${entity} failback must preserve the winning value`);
  }

  const failbackReceipt1 = emitReceipt('entity_failback_reconciled');
  const failbackReceipt2 = emitReceipt('entity_failback_reconciled');
  requireCondition(failbackReceipt1 === failbackReceipt2, 'entity failback receipt must be idempotent');
  requireCondition(primary.size === requiredEntities.length, 'failback must not create duplicate primary records');
  requireCondition(receipts.size === 2, 'exactly one takeover and one failback receipt must exist');

  return {
    lane: 'entity_data_takeover_fixture',
    status: 'PASS',
    source_sha: sourceSha,
    simulation_only: true,
    production_spof_clear_allowed: false,
    required_entities: { domain: domainEntities, governor: governorEntities },
    proof: {
      primary_store_simulated_unavailable: true,
      alternate_read_after_write: true,
      idempotent_duplicate_writes: true,
      deterministic_conflict_rule: 'highest_integer_version_wins; equal version + equal idempotency key is a no-op',
      stale_or_foreign_sha_rejected: true,
      reconciled_record_count: primary.size,
      duplicate_record_count: 0,
      duplicate_receipt_count: 0,
      tombstone_semantics: 'not destructively exercised; production delete remains prohibited',
    },
    limitation: 'Deterministic CI fixture only. It does not execute a production-independent datastore and does not clear the Base44 entity DB SPOF.',
  };
}

let result;
if (lane === 'workflow-runtime') {
  result = runWorkflowRuntimeFixture();
  writeEvidence('workflow-runtime-takeover-fixture.json', result);
} else if (lane === 'entity-data') {
  result = runEntityDataFixture();
  writeEvidence('entity-data-takeover-fixture.json', result);
} else {
  throw new Error("lane must be 'workflow-runtime' or 'entity-data'");
}
