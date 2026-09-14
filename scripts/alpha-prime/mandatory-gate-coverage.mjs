import fs from 'node:fs';

const constitutionPath = 'base44/shared/releaseConstitution.ts';
const governorPath = 'base44/functions/runValidators/entry.ts';
const externalValidatorsPath = 'base44/shared/externalGateValidators.ts';

const constitution = fs.readFileSync(constitutionPath, 'utf8');
const governor = fs.readFileSync(governorPath, 'utf8');
const externalValidators = fs.readFileSync(externalValidatorsPath, 'utf8');
const implementation = `${governor}\n${externalValidators}`;

const mandatory = [];
const gatePattern = /mk\(\s*['"]([^'"]+)['"]\s*,\s*['"][^'"]+['"]\s*,\s*(true|false)\s*,/g;
for (const match of constitution.matchAll(gatePattern)) {
  if (match[2] === 'true') mandatory.push(match[1]);
}

if (mandatory.length === 0) {
  console.error('No mandatory gates parsed from canonical release constitution. Refusing false-green coverage.');
  process.exit(1);
}

const duplicates = mandatory.filter((gate, index) => mandatory.indexOf(gate) !== index);
if (duplicates.length > 0) {
  console.error(`Duplicate mandatory gate IDs in constitution: ${[...new Set(duplicates)].join(', ')}`);
  process.exit(1);
}

const missing = mandatory.filter((gate) => {
  const singleQuoted = implementation.includes(`'${gate}'`);
  const doubleQuoted = implementation.includes(`"${gate}"`);
  return !singleQuoted && !doubleQuoted;
});

const wiringRequirements = [
  'validateAuthEvidence(authValidationReceipts, sourceSha)',
  'validateRlsEvidence(rlsValidationReceipts, sourceSha)',
  'validateAiGatewayEvidence(aiGatewayValidationReceipts, sourceSha)',
  'validatePaymentEvidence(paymentValidationReceipts, sourceSha)',
];
const missingWiring = wiringRequirements.filter((fragment) => !governor.includes(fragment));

console.log(`Mandatory gates parsed: ${mandatory.length}`);
console.log(`Mandatory gates with implementation references: ${mandatory.length - missing.length}`);

if (missing.length > 0) {
  console.error(`Mandatory gates without implementation reference: ${missing.join(', ')}`);
}
if (missingWiring.length > 0) {
  console.error(`Required external validator wiring missing: ${missingWiring.join(' | ')}`);
}

if (missing.length > 0 || missingWiring.length > 0) process.exit(1);

console.log('PASS: every mandatory gate has a central governor implementation reference; external receipt-backed validators are wired.');
