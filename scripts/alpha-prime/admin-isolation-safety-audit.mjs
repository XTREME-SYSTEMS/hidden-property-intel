import fs from 'node:fs';

const path = 'base44/functions/adminIsolationRegression/entry.ts';
const source = fs.readFileSync(path, 'utf8');

const failures = [];
const checks = [];
const check = (name, ok, detail) => {
  checks.push({ name, ok, detail });
  if (!ok) failures.push(`${name}: ${detail}`);
};

const isPublicProbe = source.includes("callerRole: string = !user ? 'unauthenticated'") &&
  source.includes("callerRole !== 'unauthenticated'");
const hasServiceRoleGovernanceWrite = /base44\.asServiceRole\.entities\.(GateResult|Finding|CacheEntry)\.(create|update)/.test(source);
const hasAdminWriterGuard = /if\s*\(callerRole\s*===\s*['\"]admin['\"]\)[\s\S]{0,1200}asServiceRole\.entities\.(GateResult|Finding|CacheEntry)/.test(source);
const hasExplicitRateLimit = /(rate.?limit|throttle|cooldown|request.?quota)/i.test(source);
const hasEvidenceWriterAuthorization = /(assertEvidenceWriterAuthorized|evidenceWriterAuthorized|authorizedEvidenceWriter)/.test(source);

check('public-role probe is recognized', isPublicProbe, 'audit must understand whether the endpoint intentionally accepts unauthenticated/non-admin callers');
check(
  'public probe cannot directly persist privileged governance evidence',
  !(isPublicProbe && hasServiceRoleGovernanceWrite && !hasAdminWriterGuard && !hasEvidenceWriterAuthorization),
  'adminIsolationRegression accepts untrusted caller roles while service-role writing GateResult/Finding/CacheEntry without an explicit privileged evidence-writer boundary'
);
check(
  'public persistent probe has abuse control',
  !(isPublicProbe && hasServiceRoleGovernanceWrite) || hasExplicitRateLimit,
  'a publicly invocable probe that performs privileged durable writes must have deterministic rate limiting/throttling'
);

console.log(JSON.stringify({
  validator: 'admin-isolation-safety-audit',
  target: path,
  checks,
  failures,
  status: failures.length ? 'FAIL' : 'PASS'
}, null, 2));

if (failures.length) process.exit(1);
