import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateHealth } from '../base44/shared/healthMetrics.js';

const NOW = '2026-10-16T00:00:00Z';
const snapshots = () => ({
  properties: [{ id: 'p1', status: 'active', images: [{ type: 'scraped', url: 'https://example.org/one.jpg' }] }],
  sources: [{ id: 's1', status: 'active', last_run_at: '2026-10-15T18:00:00Z', properties_yielded: 1 }],
  jobs: [{ status: 'complete', completed_at: '2026-10-15T18:00:00Z', properties_new: 1 }],
  titleRisks: [{ property_id: 'p1' }],
  subscriptions: [{ status: 'active' }],
  deals: [{ status: 'active' }]
});

test('fresh productive acquisition must be present before pipeline can pass', () => {
  const result = evaluateHealth(snapshots(), NOW);
  assert.equal(result.checks.find((c) => c.name === 'scrape_pipeline').status, 'healthy');
  assert.equal(result.metrics.jobs_positive_yield_72h, 1);
});

test('all-zero completions are not counted as productive acquisition', () => {
  const records = snapshots();
  records.jobs = [{ status: 'complete', completed_at: NOW, properties_found: 0, properties_new: 0, properties_updated: 0 }];
  const result = evaluateHealth(records, NOW);
  assert.equal(result.checks.find((c) => c.name === 'scrape_pipeline').status, 'critical');
});

test('stale or never-run sources must fail freshness regardless of active label', () => {
  const records = snapshots();
  records.sources = [
    { status: 'active', last_run_at: '2026-09-08T08:00:00Z' },
    { status: 'active' }
  ];
  records.jobs = [{ status: 'complete', completed_at: '2026-09-14T08:00:00Z', properties_new: 5 }];
  const result = evaluateHealth(records, NOW);
  assert.equal(result.overall_status, 'critical');
  assert.equal(result.metrics.sources_never_run, 1);
  assert.equal(result.metrics.sources_stale_7d, 1);
  assert.equal(result.metrics.jobs_last_24h, 0);
});

test('history remains unchanged, even for failed and orphaned jobs', () => {
  const records = snapshots();
  records.jobs = [{ id: 'j1', status: 'failed', error: 'browser unavailable', completed_at: NOW }];
  const original = structuredClone(records);
  const result = evaluateHealth(records, NOW);
  assert.deepEqual(records, original);
  assert.equal(result.repairs_executed, false);
  assert.equal(result.actions_taken.length, 0);
  assert.equal(records.jobs[0].status, 'failed');
});

test('duplicate title-risk records cannot inflate distinct property coverage', () => {
  const records = snapshots();
  records.properties.push({ id: 'p2', images: [] });
  records.titleRisks.push({ property_id: 'p1' });
  const result = evaluateHealth(records, NOW);
  assert.equal(result.metrics.title_risk_coverage_pct, 50);
  assert.equal(result.metrics.image_coverage_pct, 50);
});

test('null or missing data does not synthesize healthy operational checks', () => {
  const result = evaluateHealth({}, NOW);
  assert.equal(result.overall_status, 'critical');
  assert.equal(result.checks.find((c) => c.name === 'data_sources').status, 'critical');
  assert.equal(result.checks.find((c) => c.name === 'scrape_pipeline').status, 'critical');
});

test('timestamps in the future do not count as fresh evidence', () => {
  const records = snapshots();
  records.sources[0].last_run_at = '2026-11-01T00:00:00Z';
  records.jobs[0].completed_at = '2026-11-01T00:00:00Z';
  const result = evaluateHealth(records, NOW);
  assert.equal(result.metrics.sources_fresh_7d, 0);
  assert.equal(result.metrics.jobs_positive_yield_72h, 0);
});

test('never-run and stale counts capture the observed 480-source failure profile', () => {
  const records = snapshots();
  records.sources = [
    ...Array.from({ length: 303 }, () => ({ status: 'active' })),
    ...Array.from({ length: 177 }, () => ({ status: 'active', last_run_at: '2026-09-08T06:00:00Z' }))
  ];
  records.jobs = [{ status: 'complete', completed_at: '2026-09-14T08:03:57Z' }];
  const result = evaluateHealth(records, NOW);
  assert.equal(result.metrics.sources_never_run, 303);
  assert.equal(result.metrics.sources_stale_7d, 177);
  assert.equal(result.checks.find((c) => c.name === 'data_sources').status, 'critical');
});
