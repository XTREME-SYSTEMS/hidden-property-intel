import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const findings = [];

const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => exists(p) ? fs.readFileSync(path.join(root, p), 'utf8') : '';
const fail = (id, evidence) => findings.push({ id, status: 'FAIL', evidence });
const pass = (id, evidence) => findings.push({ id, status: 'PASS', evidence });

function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function requireFile(file) {
  if (!exists(file)) {
    fail(`required:${file}`, 'missing');
    return false;
  }
  return true;
}

const homePath = 'src/pages/LuxuryHome.jsx';
const portalPath = 'src/components/luxury/PortalShowcase.jsx';
const contractPath = 'src/components/luxury/SmartContractShowcase.jsx';
const profilesPath = 'src/lib/digitalAgentProfiles.js';
const profilePagePath = 'src/pages/DigitalAgentProfile.jsx';

for (const file of [homePath, portalPath, contractPath, profilesPath, profilePagePath]) requireFile(file);

const home = read(homePath);
const portal = read(portalPath);
const contract = read(contractPath);
const profiles = read(profilesPath);
const profilePage = read(profilePagePath);

const homeRendersMockSurfaces = /<PortalShowcase\s*\/>/.test(home) || /<SmartContractShowcase\s*\/>/.test(home);
const mockImplementationPresent = /\bMockPortal\b|\bInvestorMock\b|\bSellerMock\b/.test(portal) || /Mock contract card/.test(contract);
const publicMockFiles = stripComments(`${portal}\n${contract}`);
const hasVisibleDemoDisclosure = /Illustrative\s+(demo|example)|Demo\s+data|Example\s+data|Illustration\s+only/i.test(publicMockFiles);
const hasPublicProvenanceMarker = /data-content-provenance\s*=\s*["']ILLUSTRATIVE_DEMO["']/.test(publicMockFiles);
if (homeRendersMockSurfaces && mockImplementationPresent && !(hasVisibleDemoDisclosure && hasPublicProvenanceMarker)) {
  fail('content:public_mock_provenance', {
    homeRendersMockSurfaces,
    mockImplementationPresent,
    hasVisibleDemoDisclosure,
    hasPublicProvenanceMarker,
    requirement: 'Public mock/demo deal or contract UI requires both a visible illustrative-demo disclosure and data-content-provenance="ILLUSTRATIVE_DEMO".'
  });
} else {
  pass('content:public_mock_provenance', { homeRendersMockSurfaces, mockImplementationPresent, hasVisibleDemoDisclosure, hasPublicProvenanceMarker });
}

const hardCodedScaleClaims = [
  '12,847', '$340M', '1,200+', '1,400+', '12,800+', '27 states'
].filter((token) => home.includes(token));
const hasMetricProvenance = /METRIC_PROVENANCE|data-metric-source|verified_snapshot/i.test(stripComments(home));
if (hardCodedScaleClaims.length > 0 && !hasMetricProvenance) {
  fail('content:public_metric_provenance', {
    hardCodedScaleClaims,
    requirement: 'Hard-coded operating-scale claims require a machine-readable verified-snapshot/source marker and refresh policy, or must be removed/reworded.'
  });
} else {
  pass('content:public_metric_provenance', { hardCodedScaleClaims, hasMetricProvenance });
}

const nationalClaimPresent = /27 states|across\s+\d+\s+states|nationwide/i.test(stripComments(home));
const floridaScopeMarker = /Florida-only|Florida only|state\s*===?\s*["']FL["']/i.test(stripComments(home));
if (nationalClaimPresent && !hasMetricProvenance) {
  fail('content:geography_claim_provenance', {
    nationalClaimPresent,
    floridaScopeMarker,
    requirement: 'Nationwide/multi-state operating claims must be independently sourced and explicitly reconciled with the governed Florida-only ingestion boundary.'
  });
} else {
  pass('content:geography_claim_provenance', { nationalClaimPresent, floridaScopeMarker, hasMetricProvenance });
}

const syntheticLookingPhones = [...profiles.matchAll(/\+1\s*\([^)]*\)\s*555-\d{4}/g)].map((m) => m[0]);
const humanBiographyFields = /place_of_birth|birth_date|life_experiences|linkedin/i.test(profiles);
const profileRendersHumanFields = /profile\.contact\?\.phone|profile\.place_of_birth|profile\.birth_date|life_experiences/i.test(profilePage);
const syntheticDeclaration = /synthetic_agent\s*:\s*true|content_provenance\s*:\s*["']SYNTHETIC_AGENT["']/i.test(profiles);
const visibleAiDisclosure = /AI[- ]generated|synthetic\s+(AI\s+)?agent|fictional\s+AI\s+agent|digital\s+AI\s+agent/i.test(stripComments(profilePage));
if ((syntheticLookingPhones.length > 0 || humanBiographyFields) && profileRendersHumanFields && !(syntheticDeclaration && visibleAiDisclosure)) {
  fail('content:synthetic_agent_identity_disclosure', {
    syntheticLookingPhoneCount: syntheticLookingPhones.length,
    humanBiographyFields,
    profileRendersHumanFields,
    syntheticDeclaration,
    visibleAiDisclosure,
    requirement: 'Synthetic digital-agent identities must be machine-marked and visibly disclosed as synthetic/AI; fabricated human contact/history must not appear as real staff identity.'
  });
} else {
  pass('content:synthetic_agent_identity_disclosure', {
    syntheticLookingPhoneCount: syntheticLookingPhones.length,
    humanBiographyFields,
    profileRendersHumanFields,
    syntheticDeclaration,
    visibleAiDisclosure
  });
}

const counts = findings.reduce((acc, item) => {
  acc[item.status] = (acc[item.status] || 0) + 1;
  return acc;
}, {});

const receipt = {
  validator: 'alpha-prime/content-integrity-audit',
  version: 1,
  source_sha: process.env.SOURCE_SHA || process.env.GITHUB_SHA || null,
  branch: process.env.SOURCE_BRANCH || process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || null,
  generated_at: new Date().toISOString(),
  counts,
  findings
};

console.log(JSON.stringify(receipt, null, 2));
if ((counts.FAIL || 0) > 0) process.exitCode = 1;
