import test from 'node:test';
import assert from 'node:assert/strict';
import { isVerified100, diagnosticScore } from '../lib/convergence/score.js';
import { isDue, idempotencyKey } from '../lib/convergence/schedule.js';
import { runReconcile } from '../lib/convergence/reconcile.js';

const PASS = [{ benchmark_id: 'x', mandatory: true, status: 'PASS' }];

test('VERIFIED_100 is fail-closed', () => {
  assert.equal(isVerified100({ benchmarks: PASS, cleanCycles: 3, requiredCleanCycles: 3 }), true);
  for (const status of ['FAIL', 'UNKNOWN', 'BLOCKED', 'SKIPPED', 'STALE']) {
    assert.equal(isVerified100({ benchmarks: [{ benchmark_id: 'x', mandatory: true, status }], cleanCycles: 3, requiredCleanCycles: 3 }), false);
  }
  assert.equal(isVerified100({ benchmarks: PASS, p0Open: 1, cleanCycles: 3, requiredCleanCycles: 3 }), false);
  assert.equal(isVerified100({ benchmarks: PASS, p1Open: 1, cleanCycles: 3, requiredCleanCycles: 3 }), false);
  assert.equal(diagnosticScore([]), 0);
});

test('scheduler due and idempotency are deterministic', () => {
  const now = new Date('2026-09-24T12:00:00Z');
  assert.equal(isDue(null, 60000, now), true);
  assert.equal(isDue('2026-09-24T11:59:30Z', 60000, now), false);
  assert.equal(isDue('2026-09-24T11:58:59Z', 60000, now), true);
  assert.equal(idempotencyKey('mirror_to_supabase', 1800000, now), idempotencyKey('mirror_to_supabase', 1800000, new Date('2026-09-24T12:20:00Z')));
});

test('reconcile without persistence cannot dispatch and cannot certify', async () => {
  const store = { available: false };
  let calls = 0;
  const receipt = await runReconcile({
    store,
    env: { CRON_SECRET: 'x', ALLOW_RECONCILE_DISPATCH: 'true' },
    dispatchers: { trigger_scrape: async () => { calls++; return { ok: true }; } },
    now: new Date('2026-09-24T12:00:00Z'),
  });
  assert.equal(receipt.verified_100, false);
  assert.equal(receipt.status, 'BLOCKED');
  assert.equal(calls, 0);
});

test('legacy scheduler gate blocks certification even with otherwise healthy evidence', async () => {
  const state = new Map([['clean_cycle_count', { count: 2 }]]);
  const receipts = [];
  const store = {
    available: true,
    async acquireLease() { return true; },
    async releaseLease() { return true; },
    async getState(key) { return state.get(key) || null; },
    async setState(key, value) { state.set(key, value); return true; },
    async claimJob() { return { claimed: false, jobId: null }; },
    async completeJob() { return true; },
    async insertReceipt(r) { receipts.push(r); return true; },
  };
  const fetchImpl = async (url) => {
    if (String(url).includes('api.github.com')) return { ok: true, status: 200, async json() { return { sha: 'abc1234' }; } };
    return { ok: true, status: 200, async json() { return { metrics: { properties: 100, title_risk_coverage_pct: 100, image_coverage_pct: 100, owner_coverage_pct: 100, investor_leads_new: 0 }, p0_open: 0, p1_open: 0 }; } };
  };
  const receipt = await runReconcile({
    store,
    fetchImpl,
    env: {
      CRON_SECRET: 'x',
      GITHUB_REPO: 'XTREME-SYSTEMS/hidden-property-intel',
      GITHUB_BASE_BRANCH: 'main',
      VERCEL_GIT_COMMIT_SHA: 'abc1234',
      BASE44_SYNC_TOKEN: 'redacted',
      CONVERGENCE_HEARTBEAT_ACTIVE: 'true',
      ALLOW_RECONCILE_DISPATCH: 'true',
      LEGACY_SCHEDULERS_DISABLED: 'false',
      REQUIRED_CLEAN_CYCLES: '3',
    },
    now: new Date('2026-09-24T12:00:00Z'),
  });
  assert.equal(receipt.verified_100, false);
  assert.ok(receipt.benchmarks.some((b) => b.benchmark_id === 'scheduler.legacy_schedulers_disabled' && b.status === 'BLOCKED'));
});
