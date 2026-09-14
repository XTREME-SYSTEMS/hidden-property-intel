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

if (failures.length) {
  console.error(`repair-dispatch-safety FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log('repair-dispatch-safety PASS: exact-SHA lineage, active-task deduplication, persistence guard, and dispatch ordering are enforced.');
