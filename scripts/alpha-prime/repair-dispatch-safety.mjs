import fs from 'node:fs';

const target = 'base44/functions/alphaPrime/entry.ts';
if (!fs.existsSync(target)) {
  console.error(`${target}: missing Alpha Prime governor`);
  process.exit(1);
}

const text = fs.readFileSync(target, 'utf8');
const failures = [];

const sourceGuardNeedle = 'if (!sourceSha || !finding.source_sha || finding.source_sha !== sourceSha)';
const dedupQueryNeedle = 'const activeRepairTasks = await base44.asServiceRole.entities.RepairTask.filter({';
const dedupContinueNeedle = 'if (activeRepairTasks.length > 0) continue;';
const createTaskNeedle = 'const createdRepairTask = await base44.asServiceRole.entities.RepairTask.create({';
const agentInvokeNeedle = "functions.invoke('agentThink'";

const sourceGuard = text.indexOf(sourceGuardNeedle);
const dedupQuery = text.indexOf(dedupQueryNeedle);
const dedupContinue = text.indexOf(dedupContinueNeedle);
const createTask = text.indexOf(createTaskNeedle);
const agentInvoke = text.indexOf(agentInvokeNeedle);

if (sourceGuard < 0) failures.push('missing exact-source-SHA guard before repair dispatch');
if (dedupQuery < 0) failures.push('missing active RepairTask deduplication query');
if (dedupContinue < 0) failures.push('missing duplicate-active-repair early continue');
if (createTask < 0) failures.push('missing RepairTask creation path');
if (agentInvoke < 0) failures.push('missing agentThink dispatch path');

if ([sourceGuard, dedupQuery, dedupContinue, createTask, agentInvoke].every((v) => v >= 0)) {
  if (!(sourceGuard < dedupQuery && dedupQuery < dedupContinue && dedupContinue < createTask && createTask < agentInvoke)) {
    failures.push('repair safety ordering changed: SHA guard -> dedup query -> dedup continue -> task create -> agent dispatch is required');
  }
}

if (dedupQuery >= 0 && dedupContinue > dedupQuery) {
  const dedupBlock = text.slice(dedupQuery, dedupContinue);
  if (!/finding_id:\s*finding\.finding_id/.test(dedupBlock)) failures.push('repair dedup query is not bound to finding_id');
  if (!/\baction\s*,/.test(dedupBlock) && !/action:\s*action/.test(dedupBlock)) failures.push('repair dedup query is not bound to action');
  if (!/status:\s*\{\s*\$in:\s*\[['"]queued['"],\s*['"]in_progress['"]\]/s.test(dedupBlock)) failures.push('repair dedup query does not cover queued + in_progress tasks');
}

if (createTask >= 0 && agentInvoke > createTask) {
  const createBlock = text.slice(createTask, agentInvoke);
  if (!/source_sha_before:\s*finding\.source_sha/.test(createBlock)) failures.push('RepairTask creation is not stamped with finding.source_sha');
  if (!/createdRepairTask\?\.id/.test(createBlock)) failures.push('repair dispatch does not verify RepairTask persistence before agent execution');
}

const createCount = (text.match(/entities\.RepairTask\.create\s*\(/g) || []).length;
if (createCount !== 1) failures.push(`expected exactly 1 RepairTask.create path in Alpha Prime governor, found ${createCount}`);

// Current operational queues and health must be derived from exact-source Findings only.
if (!/const\s+currentSourceOpenFindings\s*=\s*openFindings\.filter\(\(f:\s*any\)\s*=>\s*\s*Boolean\(sourceSha\s*&&\s*f\.source_sha\s*&&\s*f\.source_sha\s*===\s*sourceSha\)/s.test(text)) {
  failures.push('current-source open Finding view is missing or not exact-SHA filtered');
}
if (!/const\s+existingCategories\s*=\s*new Set\(currentSourceOpenFindings\.map\(\(f:\s*any\)\s*=>\s*f\.category\)\)/.test(text)) {
  failures.push('mandatory-gate Finding deduplication does not use the exact-source Finding view');
}
if (!/const\s+currentSourceFresh\s*=\s*fresh\.filter\(\(f:\s*any\)\s*=>\s*\s*Boolean\(sourceSha\s*&&\s*f\.source_sha\s*&&\s*f\.source_sha\s*===\s*sourceSha\)/s.test(text)) {
  failures.push('repair queue due-view is missing exact-SHA filtering');
}
if (!/for\s*\(const\s+finding\s+of\s+currentSourceFresh\)/.test(text)) {
  failures.push('repair dispatcher is not iterating the exact-source due queue');
}
if (!/const\s+noCriticalOpen\s*=\s*!currentSourceOpenFindings\.some/.test(text)) {
  failures.push('preservation eligibility can still be poisoned by stale/foreign Findings');
}
if (!/const\s+subFindings\s*=\s*currentSourceOpenFindings\.filter/.test(text)) {
  failures.push('subsystem health can still be poisoned by stale/foreign Findings');
}
const sourceBoundDueCounts = (text.match(/jobs_due:\s*currentSourceFresh\.length/g) || []).length;
if (sourceBoundDueCounts < 2) failures.push(`expected source-bound jobs_due in heartbeat and response, found ${sourceBoundDueCounts}`);
if (!/open_findings:\s*currentSourceOpenFindings\.length/.test(text)) {
  failures.push('HeartbeatReceipt open_findings is not restricted to exact-source Findings');
}

// Historical heartbeats may only contribute to the preservation clean streak when they belong to the same exact source SHA.
const exactSourceCleanStreak = /if\s*\(sourceSha\s*&&\s*b\.source_sha\s*===\s*sourceSha\s*&&\s*b\.release_ready\s*&&\s*\(b\.gate_failures\s*\|\|\s*\[\]\)\.length\s*===\s*0\)/;
if (!exactSourceCleanStreak.test(text)) failures.push('preservation clean-streak calculation can consume stale, foreign, or unstamped HeartbeatReceipts');

// Evidence receipts emitted by the governor must preserve the same source lineage used for dispatch and validation.
if (!/entities\.ValidationReceipt\.create\([\s\S]*?source_sha:\s*finding\.source_sha/.test(text)) {
  failures.push('ValidationReceipt creation is not source-SHA stamped');
}
if (!/entities\.RepairReceipt\.create\([\s\S]*?source_sha_before:\s*finding\.source_sha[\s\S]*?source_sha_after:\s*finding\.source_sha/.test(text)) {
  failures.push('RepairReceipt creation does not preserve before/after source SHA lineage');
}
if (!/entities\.HeartbeatReceipt\.create\([\s\S]*?source_sha:\s*sourceSha/.test(text)) {
  failures.push('HeartbeatReceipt creation is not stamped with the validator source SHA');
}

if (failures.length) {
  console.error(`repair-dispatch-safety FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log('repair-dispatch-safety PASS: exact-SHA finding lifecycle, current-source queue/health telemetry, repair dispatch, receipt lineage, and heartbeat preservation streak are enforced.');
