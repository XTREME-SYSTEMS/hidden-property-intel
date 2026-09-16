import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const results = [];
const add = (id, ok, evidence) => results.push({ id, status: ok ? 'PASS' : 'FAIL', evidence });
const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => exists(p) ? fs.readFileSync(path.join(root, p), 'utf8') : '';

const requiredRuntime = [
  'base44/functions/alphaPrime/entry.ts',
  'base44/functions/runValidators/entry.ts',
  'base44/shared/releaseConstitution.ts',
  'base44/shared/validatorContract.ts',
  'base44/workflows/Convergence Heartbeat.jsonc'
];
for (const p of requiredRuntime) add(`required:${p}`, exists(p), exists(p) ? 'present' : 'missing');

const governanceEntities = [
  'GateResult',
  'HeartbeatReceipt',
  'ValidationTask',
  'ValidationReceipt',
  'Finding',
  'RepairTask',
  'RepairReceipt',
  'SubsystemState'
];
for (const name of governanceEntities) {
  const p = `base44/entities/${name}.jsonc`;
  add(`governance_entity:${name}`, exists(p), exists(p) ? 'present' : 'missing');
}

const app = read('src/App.jsx');
const adminComponentExists = exists('src/components/AdminRoute.jsx') || exists('src/components/AdminRoute.tsx');
const appUsesAdminGuard = /AdminRoute/.test(app) && /\/admin/.test(app);
add('security:admin_client_guard', adminComponentExists && appUsesAdminGuard, {
  adminComponentExists,
  appUsesAdminGuard
});

const apiKeys = read('base44/functions/manageApiKeys/entry.ts');
const block = (start, end) => {
  const s = apiKeys.indexOf(start);
  if (s < 0) return '';
  const e = end ? apiKeys.indexOf(end, s + start.length) : -1;
  return apiKeys.slice(s, e < 0 ? apiKeys.length : e);
};
const generateBlock = block("if (action === 'generate')", "if (action === 'update')");
const updateBlock = block("if (action === 'update')", "if (action === 'presets')");
const directAdminDeny = (text) => /if\s*\(\s*user\.role\s*!==\s*['\"]admin['\"]\s*\)\s*\{?[\s\S]{0,180}(?:403|Forbidden|return\s+Response)/.test(text);
add('security:api_key_generate_privilege_guard', Boolean(generateBlock) && directAdminDeny(generateBlock), 'Generate must reject non-admin requests before caller-controlled scopes/system_type are persisted.');
const updateTouchesScopes = /updates\.scopes\s*=|scopes\s*!==\s*undefined/.test(updateBlock);
add('security:api_key_scope_update_guard', Boolean(updateBlock) && (!updateTouchesScopes || directAdminDeny(updateBlock)), 'If scopes can be changed, non-admin scope mutation must be rejected regardless of key ownership.');

const apiKeyEntityText = read('base44/entities/ApiKey.jsonc');
let apiKeyWriteRlsOk = false;
let apiKeyWriteRlsEvidence = 'base44/entities/ApiKey.jsonc missing';
if (apiKeyEntityText) {
  try {
    const schema = JSON.parse(apiKeyEntityText);
    const writeOps = ['create', 'update', 'delete'];
    const operationResults = Object.fromEntries(writeOps.map((op) => {
      const rule = schema?.rls?.[op];
      const text = JSON.stringify(rule || {});
      const adminOnly = rule?.user_condition?.role === 'admin' && !text.includes('{{user.id}}') && !text.includes('tenant_id');
      return [op, adminOnly];
    }));
    apiKeyWriteRlsOk = Object.values(operationResults).every(Boolean);
    apiKeyWriteRlsEvidence = operationResults;
  } catch (error) {
    apiKeyWriteRlsEvidence = `invalid ApiKey schema: ${error.message}`;
  }
}
add('security:api_key_entity_write_rls_guard', apiKeyWriteRlsOk, apiKeyWriteRlsEvidence);

function walk(dir) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(rel) : [rel];
  });
}

const writers = walk('base44/functions').filter((p) => {
  if (!/\.(ts|js|tsx|jsx)$/.test(p)) return false;
  const text = read(p);
  return /entities\.Property\.(create|bulkCreate|upsert)|Property\.(create|bulkCreate|upsert)/.test(text);
});
const unguardedWriters = writers.filter((p) => {
  const text = read(p);
  const helperGuard = /floridaIngressGuard|assertFlorida|enforceFlorida|requireFlorida/i.test(text);
  const inlineGuard = /\bstate\b[\s\S]{0,160}(['\"]FL['\"]|Florida)|(['\"]FL['\"]|Florida)[\s\S]{0,160}\bstate\b/i.test(text);
  return !(helperGuard || inlineGuard);
});
add('data:florida_ingress_boundary', writers.length > 0 && unguardedWriters.length === 0, {
  propertyWriterCount: writers.length,
  unguardedWriters
});

const vercel = read('vercel.json');
let routingOk = false;
let routingEvidence = 'vercel.json missing';
if (vercel) {
  try {
    const cfg = JSON.parse(vercel);
    const rules = Array.isArray(cfg.rewrites) ? cfg.rewrites : [];
    const sitemapIndex = rules.findIndex((r) => typeof r?.source === 'string' && r.source.includes('functions/dynamicSitemap'));
    const catchallIndex = rules.findIndex((r) => typeof r?.destination === 'string' && r.destination.includes('index.html') && /\(\.\*\)|\*/.test(String(r.source || '')));
    routingOk = sitemapIndex >= 0 && catchallIndex >= 0 && sitemapIndex < catchallIndex;
    routingEvidence = { sitemapIndex, catchallIndex };
  } catch (error) {
    routingEvidence = `invalid vercel.json: ${error.message}`;
  }
}
add('routing:dynamic_sitemap_before_spa_catchall', routingOk, routingEvidence);

const sha = process.env.SOURCE_SHA || process.env.GITHUB_SHA || null;
const branch = process.env.SOURCE_BRANCH || process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || null;
const counts = results.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] || 0) + 1;
  return acc;
}, {});
const receipt = {
  validator: 'alpha-prime/source-truth-guard',
  version: 4,
  source_sha: sha,
  branch,
  generated_at: new Date().toISOString(),
  counts,
  results
};

console.log(JSON.stringify(receipt, null, 2));
if ((counts.FAIL || 0) > 0) process.exitCode = 1;
