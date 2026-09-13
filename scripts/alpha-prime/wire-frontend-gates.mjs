import fs from 'node:fs';

const path = 'base44/functions/runValidators/entry.ts';
const source = fs.readFileSync(path, 'utf8');

const marker = "    receipts.push(validateCheckRunGate('frontend.render', checkRuns, sourceSha, 'frontend-render'";
if (source.includes(marker)) {
  console.log('Frontend gate wiring already present; no change required.');
  process.exit(0);
}

const anchor = "    receipts.push(validateCheckRunGate('code.typecheck', checkRuns, sourceSha, 'typecheck', 'npm run typecheck'));\n";
const occurrences = source.split(anchor).length - 1;
if (occurrences !== 1) {
  throw new Error(`Expected exactly one typecheck anchor, found ${occurrences}. Refusing ambiguous mutation.`);
}

const insertion = `${anchor}\n    // FRONTEND deterministic CI. These checks are exact-SHA evidence only; absence or\n    // non-success must remain UNKNOWN/FAIL through validateCheckRunGate rather than\n    // being inferred from unrelated build success.\n    receipts.push(validateCheckRunGate('frontend.render', checkRuns, sourceSha, 'frontend-render', 'Playwright primary-route render validation'));\n    receipts.push(validateCheckRunGate('frontend.no_console_errors', checkRuns, sourceSha, 'frontend-no-console-errors', 'Playwright uncaught console/page error validation'));\n`;

const next = source.replace(anchor, insertion);
if (next === source) throw new Error('Deterministic insertion produced no diff.');

for (const required of [
  "'frontend.render'",
  "'frontend.no_console_errors'",
  "'frontend-render'",
  "'frontend-no-console-errors'",
]) {
  if (!next.includes(required)) throw new Error(`Postcondition failed: missing ${required}`);
}

fs.writeFileSync(path, next);
console.log('Wired frontend.render and frontend.no_console_errors to exact-SHA GitHub check-run evidence.');
