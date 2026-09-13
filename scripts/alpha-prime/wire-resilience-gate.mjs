import fs from 'node:fs';

const target = 'base44/functions/runValidators/entry.ts';
const text = fs.readFileSync(target, 'utf8');
const gateLine = "    receipts.push(validateCheckRunGate('resil.fallback_chain', checkRuns, sourceSha, 'resilience-fallback-audit', 'static critical-path fallback and SPOF audit'));";

if (text.includes(gateLine)) {
  console.log('resil.fallback_chain is already wired; no change required.');
  process.exit(0);
}

const needle = "    receipts.push(validateCheckRunGate('contracts.deploy_safety', checkRuns, sourceSha, 'contract-safety', 'live-chain mutation primitive audit'));";
const occurrences = text.split(needle).length - 1;
if (occurrences !== 1) {
  throw new Error(`Refusing ambiguous repair: expected exactly one contract-safety anchor, found ${occurrences}.`);
}

const next = text.replace(needle, `${needle}\n    receipts.push(validateCheckRunGate('resil.fallback_chain', checkRuns, sourceSha, 'resilience-fallback-audit', 'static critical-path fallback and SPOF audit'));`);
fs.writeFileSync(target, next);
console.log('Wired resil.fallback_chain to the exact-SHA resilience-fallback-audit check.');
