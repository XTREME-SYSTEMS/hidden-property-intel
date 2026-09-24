import { loadConfig } from './config.js';
import { fetchCanonicalSha, buildSnapshotBenchmarks } from './evidence.js';
import { createStoreFromEnv } from './store.js';
import { TASKS, isDue, idempotencyKey } from './schedule.js';
import { diagnosticScore, mandatoryEvidencePasses, isVerified100 } from './score.js';
import { triggerScrape, mirrorToSupabase, fetchConvergenceSnapshot } from '../tasks.js';

const dispatchMap = { mirror_to_supabase: mirrorToSupabase, trigger_scrape: triggerScrape };

function runIdFor(now) {
  return `HPI-RECON-${now.toISOString().replace(/[-:.TZ]/g, '')}`;
}

function benchmark(id, category, status, detail = null, extra = {}) {
  return { benchmark_id: id, category, mandatory: true, status, detail, ...extra };
}

function protectedWorkFromSnapshot(snapshot, config) {
  const metrics = snapshot?.data?.metrics || {};
  const properties = Number(metrics.properties || 0);
  if (!properties) return [];
  const titlePct = Number(metrics.title_risk_coverage_pct || 0);
  const imagePct = Number(metrics.image_coverage_pct || 0);
  const ownerPct = Number(metrics.owner_coverage_pct || 0);
  const work = [];
  if (titlePct < config.titleRiskTargetPct) work.push({ task: 'repair_title_risk', reason: `coverage ${titlePct}% < ${config.titleRiskTargetPct}%`, operator_gate: true });
  if (imagePct < config.imageCoverageTargetPct) work.push({ task: 'repair_property_images', reason: `coverage ${imagePct}% < ${config.imageCoverageTargetPct}%`, operator_gate: true });
  if (ownerPct < config.ownerCoverageTargetPct) work.push({ task: 'repair_owner_enrichment', reason: `coverage ${ownerPct}% < ${config.ownerCoverageTargetPct}%`, operator_gate: true });
  if (Number(metrics.investor_leads_new || 0) > 0) work.push({ task: 'investor_outreach', reason: `${metrics.investor_leads_new} new investor leads pending`, operator_gate: true });
  return work;
}

export async function runReconcile({ env = process.env, fetchImpl = fetch, store: providedStore = null, now = new Date(), dispatchers = dispatchMap } = {}) {
  const config = loadConfig(env);
  const runId = runIdFor(now);
  const store = providedStore || createStoreFromEnv(env, fetchImpl);
  const benchmarks = [];
  const actions = [];
  const blockers = [];
  let sourceSha = null;
  let leaseAcquired = false;
  let cleanCycles = 0;
  let p0Open = null;
  let p1Open = null;

  if (!store?.available) {
    benchmarks.push(benchmark('persistence.control_plane', 'database', 'UNKNOWN', 'Supabase convergence store is not configured'));
    blockers.push('Apply the convergence migration and configure HPI_SUPABASE_URL/HPI_SUPABASE_SERVICE_ROLE_KEY.');
    return finalize();
  }
  benchmarks.push(benchmark('persistence.control_plane', 'database', 'PASS'));

  try {
    leaseAcquired = await store.acquireLease('global-reconcile', runId, 240);
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error));
  }
  benchmarks.push(benchmark('scheduler.reconcile_lease', 'scheduler', leaseAcquired ? 'PASS' : 'BLOCKED', leaseAcquired ? runId : 'another run holds the lease or lease RPC failed'));
  if (!leaseAcquired) return finalize();

  try {
    const source = await fetchCanonicalSha({ repo: config.repo, branch: config.branch, githubToken: config.githubToken, fetchImpl });
    sourceSha = source.sha;
    benchmarks.push(benchmark('source.canonical_sha', 'source', source.status, source.detail, { actual: source.sha }));
    if (!config.deploymentSha) {
      benchmarks.push(benchmark('source.deployment_parity', 'deployment', 'UNKNOWN', 'VERCEL_GIT_COMMIT_SHA unavailable'));
    } else if (!source.sha) {
      benchmarks.push(benchmark('source.deployment_parity', 'deployment', 'UNKNOWN', 'canonical source SHA unavailable'));
    } else {
      benchmarks.push(benchmark('source.deployment_parity', 'deployment', config.deploymentSha === source.sha ? 'PASS' : 'FAIL', `${config.deploymentSha} vs ${source.sha}`));
    }

    benchmarks.push(benchmark('scheduler.single_heartbeat', 'scheduler', config.heartbeatActive ? 'PASS' : 'UNKNOWN', config.heartbeatActive ? 'CONVERGENCE_HEARTBEAT_ACTIVE=true' : 'runtime heartbeat activation not proven'));
    benchmarks.push(benchmark('scheduler.legacy_schedulers_disabled', 'scheduler', config.legacySchedulersDisabled ? 'PASS' : 'BLOCKED', config.legacySchedulersDisabled ? 'legacy schedulers confirmed disabled' : 'operator-gated legacy scheduler consolidation not proven'));
    benchmarks.push(benchmark('dispatch.safe_recurring_enabled', 'security', config.allowDispatch ? 'PASS' : 'BLOCKED', config.allowDispatch ? 'safe recurring dispatch enabled' : 'ALLOW_RECONCILE_DISPATCH is not true'));

    const snapshot = await fetchConvergenceSnapshot({ env, fetchImpl });
    benchmarks.push(...buildSnapshotBenchmarks(snapshot, config));
    const metrics = snapshot?.data?.metrics || {};
    p0Open = snapshot?.data?.p0_open == null ? null : Number(snapshot.data.p0_open);
    p1Open = snapshot?.data?.p1_open == null ? null : Number(snapshot.data.p1_open);
    if (snapshot?.ok && snapshot?.data?.p0_open == null) {
      benchmarks.push(benchmark('app.p0_p1_inventory', 'evidence', 'UNKNOWN', 'snapshot omitted p0_open/p1_open'));
    } else if (snapshot?.ok) {
      benchmarks.push(benchmark('app.p0_p1_inventory', 'evidence', p0Open === 0 && p1Open === 0 ? 'PASS' : 'FAIL', `P0=${p0Open}, P1=${p1Open}`));
    }

    const protectedWork = protectedWorkFromSnapshot(snapshot, config);
    if (protectedWork.length) blockers.push(...protectedWork.map((item) => `PROTECTED:${item.task}:${item.reason}`));

    for (const [taskName, task] of Object.entries(TASKS)) {
      if (task.protected || !dispatchers[taskName]) continue;
      const state = await store.getState(`task:${taskName}`).catch(() => null);
      const lastSuccessAt = state?.last_success_at || null;
      if (!isDue(lastSuccessAt, task.intervalMs, now)) continue;

      if (!config.allowDispatch) {
        actions.push({ task: taskName, action: 'skipped', reason: 'dispatch disabled' });
        continue;
      }

      const key = idempotencyKey(taskName, task.intervalMs, now);
      const jobId = `${runId}:${taskName}`;
      const claim = await store.claimJob({ jobId, jobType: taskName, idempotencyKey: key, sourceSha, payload: { scheduled_at: now.toISOString() } });
      if (!claim.claimed) {
        actions.push({ task: taskName, action: 'deduped', idempotency_key: key });
        continue;
      }

      const result = await dispatchers[taskName]({ env, fetchImpl });
      actions.push({ task: taskName, action: result.ok ? 'executed' : 'failed', result });
      await store.completeJob(claim.jobId || jobId, result.ok ? 'complete' : 'failed', result.ok ? result : null, result.ok ? null : result.error || result.status);
      if (result.ok) await store.setState(`task:${taskName}`, { last_success_at: now.toISOString(), last_run_id: runId, source_sha: sourceSha });
    }

    const basePass = mandatoryEvidencePasses(benchmarks) && p0Open === 0 && p1Open === 0;
    const prior = await store.getState('clean_cycle_count').catch(() => ({ count: 0 }));
    cleanCycles = basePass ? Number(prior?.count || 0) + 1 : 0;
    await store.setState('clean_cycle_count', { count: cleanCycles, updated_at: now.toISOString(), run_id: runId });
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error));
    benchmarks.push(benchmark('reconcile.execution', 'validation', 'FAIL', blockers.at(-1)));
    cleanCycles = 0;
    await store.setState('clean_cycle_count', { count: 0, updated_at: now.toISOString(), run_id: runId }).catch(() => {});
  } finally {
    await store.releaseLease('global-reconcile', runId).catch(() => {});
  }

  return finalize();

  async function finalize() {
    const score = diagnosticScore(benchmarks);
    const verified100 = isVerified100({ benchmarks, p0Open, p1Open, cleanCycles, requiredCleanCycles: config.requiredCleanCycles });
    const receipt = {
      receipt_id: runId,
      run_id: runId,
      system_id: config.systemId,
      created_at: now.toISOString(),
      source_sha: sourceSha,
      deployment_sha: config.deploymentSha || null,
      deployment_id: config.deploymentId || null,
      status: verified100 ? 'VERIFIED_100' : blockers.length ? 'BLOCKED' : 'DEGRADED',
      verified_100: verified100,
      diagnostic_score: score,
      clean_cycles: cleanCycles,
      required_clean_cycles: config.requiredCleanCycles,
      p0_open: p0Open,
      p1_open: p1Open,
      benchmarks,
      actions,
      blockers,
      rollback_reference: 'git revert branch commit / restore prior vercel.json',
    };
    if (store?.available) await store.insertReceipt(receipt).catch(() => {});
    return receipt;
  }
}
