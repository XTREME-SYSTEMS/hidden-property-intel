import fs from 'node:fs';

const target = 'base44/functions/runValidators/entry.ts';
const source = fs.readFileSync(target, 'utf8');

const scrapeCall = "    receipts.push(await validateScrapeSuccess(base44, sourceSha, heartbeats));";
const floridaCall = "    receipts.push(await validateFloridaOnly(base44, sourceSha, heartbeats));";
const scrapeDef = 'async function validateScrapeSuccess(';
const floridaDef = 'async function validateFloridaOnly(';

const fullyInstalled = [scrapeCall, floridaCall, scrapeDef, floridaDef].every((marker) => source.includes(marker));
if (fullyInstalled) {
  console.log('Ingestion validators already installed; no change required.');
  process.exit(0);
}

const partiallyInstalled = [scrapeCall, floridaCall, scrapeDef, floridaDef].some((marker) => source.includes(marker));
if (partiallyInstalled) {
  throw new Error('Refusing partial installation: ingestion validator markers are inconsistent.');
}

const callAnchor = "    receipts.push(await validateBackendApiSmoke(base44, sourceSha, heartbeats));\n";
const functionAnchor = 'async function validateAgentGovernance(base44: any, sourceSha: string | null): Promise<ValidatorReceipt> {';

if (source.split(callAnchor).length !== 2) {
  throw new Error('Expected exactly one backend smoke call anchor; source drift detected.');
}
if (source.split(functionAnchor).length !== 2) {
  throw new Error('Expected exactly one agent governance function anchor; source drift detected.');
}

const callBlock = `${callAnchor}${scrapeCall}\n${floridaCall}\n`;
const validatorBlock = `async function validateScrapeSuccess(base44: any, sourceSha: string | null, heartbeats: any[]): Promise<ValidatorReceipt> {
  const runtimeLineage = latestExactShaHeartbeat(heartbeats, sourceSha);
  const threshold = '>=90% completed scrape jobs over trailing 7d';
  const probe = 'ScrapeJob.list(-created_date,500) trailing 7d exact-SHA runtime audit';
  if (!sourceSha || !runtimeLineage) {
    return buildReceipt({
      gate_id: 'ingest.scrape_success', validator_id: 'scrape_job_7d_audit', status: sourceSha ? 'UNKNOWN' : 'BLOCKED',
      source_sha: sourceSha, metric_value: 0, threshold, command_or_probe: probe,
      reason: sourceSha
        ? \`Live runtime has not produced a recent heartbeat stamped with canonical SHA \${sourceSha.slice(0, 8)}; scrape evidence is withheld rather than using stale runtime state.\`
        : 'Canonical source SHA is unavailable; scrape-job lineage cannot be proven.',
    });
  }

  let rows: any[];
  try {
    rows = await base44.asServiceRole.entities.ScrapeJob.list('-created_date', 500);
  } catch (e) {
    return buildReceipt({
      gate_id: 'ingest.scrape_success', validator_id: 'scrape_job_7d_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold, command_or_probe: probe,
      evidence_refs: [runtimeLineage.heartbeat_id].filter(Boolean), stderr_summary: e.message,
      reason: \`Could not read scrape-job history from the exact-SHA runtime: \${e.message}\`,
    });
  }

  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const rowTime = (row: any) => {
    const value = row?.created_date || row?.started_at || row?.completed_at;
    const parsed = value ? new Date(value).getTime() : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  };
  const missingTimestamp = rows.filter((row: any) => rowTime(row) === null);
  if (missingTimestamp.length > 0) {
    return buildReceipt({
      gate_id: 'ingest.scrape_success', validator_id: 'scrape_job_7d_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: missingTimestamp.length, threshold, command_or_probe: probe,
      evidence_refs: [runtimeLineage.heartbeat_id].filter(Boolean),
      reason: \`\${missingTimestamp.length} inspected scrape job(s) have no usable timestamp, so the trailing-7d population cannot be proven.\`,
    });
  }

  const recent = rows.filter((row: any) => (rowTime(row) as number) >= cutoff);
  const oldestInspected = rows.length ? rowTime(rows[rows.length - 1]) : null;
  if (rows.length >= 500 && oldestInspected !== null && oldestInspected >= cutoff) {
    return buildReceipt({
      gate_id: 'ingest.scrape_success', validator_id: 'scrape_job_7d_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: recent.length, threshold, command_or_probe: probe,
      evidence_refs: [runtimeLineage.heartbeat_id].filter(Boolean),
      reason: 'The 500-row read cap was exhausted inside the 7-day window; the full denominator cannot be proven, so success is not inferred.',
    });
  }
  if (recent.length === 0) {
    return buildReceipt({
      gate_id: 'ingest.scrape_success', validator_id: 'scrape_job_7d_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold, command_or_probe: probe,
      evidence_refs: [runtimeLineage.heartbeat_id].filter(Boolean),
      reason: 'No scrape jobs with provable timestamps exist in the trailing 7-day window; a success rate cannot be established.',
    });
  }

  const complete = recent.filter((row: any) => row.status === 'complete').length;
  const successRate = (complete / recent.length) * 100;
  const pass = successRate >= 90;
  return buildReceipt({
    gate_id: 'ingest.scrape_success', validator_id: 'scrape_job_7d_audit', status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha, metric_value: Number(successRate.toFixed(2)), threshold, command_or_probe: probe,
    exit_code: pass ? 0 : 1,
    evidence_refs: [runtimeLineage.heartbeat_id, ...recent.slice(0, 24).map((row: any) => row.id)].filter(Boolean),
    stdout_summary: \`trailing_7d_jobs=\${recent.length}; complete=\${complete}; success_rate=\${successRate.toFixed(2)}%\`,
    reason: pass
      ? \`Scrape success is \${successRate.toFixed(2)}% across \${recent.length} job(s) in the trailing 7 days.\`
      : \`Scrape success is \${successRate.toFixed(2)}% across \${recent.length} job(s), below the 90% trailing-7d threshold.\`,
  });
}

async function validateFloridaOnly(base44: any, sourceSha: string | null, heartbeats: any[]): Promise<ValidatorReceipt> {
  const runtimeLineage = latestExactShaHeartbeat(heartbeats, sourceSha);
  const threshold = '0 out-of-state scraped Property records';
  const probe = 'Property.filter({source:"scraped"},-created_date,500) exhaustive-below-cap geo audit';
  if (!sourceSha || !runtimeLineage) {
    return buildReceipt({
      gate_id: 'ingest.florida_only', validator_id: 'scraped_property_geo_audit', status: sourceSha ? 'UNKNOWN' : 'BLOCKED',
      source_sha: sourceSha, metric_value: 0, threshold, command_or_probe: probe,
      reason: sourceSha
        ? \`Live runtime has not produced a recent heartbeat stamped with canonical SHA \${sourceSha.slice(0, 8)}; geo evidence is withheld rather than using stale runtime state.\`
        : 'Canonical source SHA is unavailable; scraped-property lineage cannot be proven.',
    });
  }

  let rows: any[];
  try {
    rows = await base44.asServiceRole.entities.Property.filter({ source: 'scraped' }, '-created_date', 500);
  } catch (e) {
    return buildReceipt({
      gate_id: 'ingest.florida_only', validator_id: 'scraped_property_geo_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold, command_or_probe: probe,
      evidence_refs: [runtimeLineage.heartbeat_id].filter(Boolean), stderr_summary: e.message,
      reason: \`Could not read scraped Property records from the exact-SHA runtime: \${e.message}\`,
    });
  }

  if (rows.length === 0) {
    return buildReceipt({
      gate_id: 'ingest.florida_only', validator_id: 'scraped_property_geo_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold, command_or_probe: probe,
      evidence_refs: [runtimeLineage.heartbeat_id].filter(Boolean),
      reason: 'No scraped Property records exist; Florida-only behavior cannot be proven vacuously.',
    });
  }
  if (rows.length >= 500) {
    return buildReceipt({
      gate_id: 'ingest.florida_only', validator_id: 'scraped_property_geo_audit', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: rows.length, threshold, command_or_probe: probe,
      evidence_refs: [runtimeLineage.heartbeat_id, ...rows.slice(0, 24).map((row: any) => row.id)].filter(Boolean),
      reason: 'The 500-row read cap was exhausted; the validator cannot prove all scraped records are in Florida, so PASS is withheld.',
    });
  }

  const violations = rows.filter((row: any) => {
    const state = String(row?.state || '').trim().toUpperCase();
    return state !== 'FL' && state !== 'FLORIDA';
  });
  const pass = violations.length === 0;
  return buildReceipt({
    gate_id: 'ingest.florida_only', validator_id: 'scraped_property_geo_audit', status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha, metric_value: violations.length, threshold, command_or_probe: probe,
    exit_code: pass ? 0 : 1,
    evidence_refs: [runtimeLineage.heartbeat_id, ...rows.slice(0, 24).map((row: any) => row.id)].filter(Boolean),
    stderr_summary: violations.slice(0, 10).map((row: any) => \`id=\${row.id || 'unknown'} state=\${String(row.state || '<missing>')}\`).join('; '),
    reason: pass
      ? \`All \${rows.length} scraped Property record(s) in the exhaustive below-cap audit are Florida records.\`
      : \`\${violations.length}/\${rows.length} scraped Property record(s) are out-of-state or missing a valid Florida state value.\`,
  });
}

`;

let next = source.replace(callAnchor, callBlock);
next = next.replace(functionAnchor, `${validatorBlock}${functionAnchor}`);

if (next === source) {
  throw new Error('Installer made no changes; refusing ambiguous success.');
}

fs.writeFileSync(target, next);
console.log('Installed ingest.scrape_success and ingest.florida_only validators with exact-SHA runtime lineage guards.');
