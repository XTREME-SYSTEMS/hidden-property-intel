const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'scraper-cron.ts'), 'utf8');

test('scraper requires approved hosts and checks robots policy', () => {
  assert.ok(source.includes('APPROVED_SOURCE_HOSTS'));
  assert.ok(source.includes('function isApprovedSource'));
  assert.ok(source.includes('async function isAllowedByRobots'));
  assert.ok(source.includes('function isAccessPolicyFailure'));
  assert.ok(source.includes('stopping retries without bypass'));
  assert.ok(source.includes("response.status === 404"));
});

test('session isolation replaces anti-detection rotation', () => {
  assert.ok(source.includes('fresh isolated session per source'));
  assert.doesNotMatch(source, /sessionRotateEvery|Rotating browser session|avoid detection/i);
  assert.ok(source.includes('if (sourceSessionId) await closeSession(sourceSessionId)'));
  const createSessionBlock = source.slice(source.indexOf('async function createSession'), source.indexOf('async function closeSession'));
  assert.doesNotMatch(createSessionBlock, /captcha_solver|captchaSolver/);
});

test('scraped observations retain provenance and explicit non-legal verification status', () => {
  assert.ok(source.includes('_source_capture'));
  assert.ok(source.includes('extracted_record_sha256'));
  assert.ok(source.includes('source_observed_not_legal_ownership'));
  assert.ok(source.includes('last_verified_at: capturedAt'));
});

test('property observations are mirrored into the existing UPI source and property-link tables', () => {
  assert.ok(source.includes("from('universal_source_records')"));
  assert.ok(source.includes("from('universal_property_source_links')"));
  assert.ok(source.includes("from('universal_site_properties')"));
  assert.ok(source.includes("from('universal_entity_catalog')"));
  assert.ok(source.includes('UPI_SUPABASE_URL'));
  assert.ok(source.includes('CANONICAL_UPI_PROJECT_REF'));
  assert.ok(source.includes('Never overwrite an existing canonical property'));
});

test('off-domain extracted URLs cannot be attributed to the visited source page', () => {
  assert.ok(source.includes("target.protocol !== 'https:'"));
  assert.ok(source.includes("target.hostname.toLowerCase() !== page.hostname.toLowerCase()"));
});

test('scraper runtime pins, executes, and guards Node 22+ for Supabase Realtime WebSocket support', () => {
  const dockerfile = fs.readFileSync(path.join(__dirname, '..', 'Dockerfile'), 'utf8');
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  assert.match(dockerfile, /^FROM node:22-alpine/m);
  assert.equal(packageJson.engines.node, '>=22');
  assert.ok(nodeMajor >= 22, `test runtime must be Node 22+, received ${process.versions.node}`);
  assert.ok(source.includes('const runtimeNodeMajor = Number(process.versions.node.split(\'.\')[0] || 0)'));
  assert.ok(source.includes('if (runtimeNodeMajor < 22)'));
  assert.ok(source.includes('Node.js 22+ is required for Supabase Realtime WebSocket support'));
});
