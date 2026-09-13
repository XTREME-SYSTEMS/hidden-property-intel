import fs from 'node:fs';

const target = 'base44/functions/runValidators/entry.ts';
let source = fs.readFileSync(target, 'utf8');

const importAnchor = "import { RELEASE_CONSTITUTION } from '../../shared/releaseConstitution.ts';";
const importBlock = `${importAnchor}\nimport {\n  validateAuthEvidence,\n  validateRlsEvidence,\n  validateAiGatewayEvidence,\n  validatePaymentEvidence,\n} from '../../shared/externalGateValidators.ts';`;

const backendAnchor = `    const backendDeployReceipts = await base44.asServiceRole.entities.BackendDeployReceipt.list('-timestamp', 20).catch(() => []);\n    receipts.push(validateBackendFunctionsDeploy(checkRuns, backendDeployReceipts, sourceSha));`;
const externalBlock = `${backendAnchor}\n\n    // AUTH, RLS, AI GATEWAY, and PAYMENTS are evidence-consumer gates. These validators\n    // never perform login mutations, policy changes, AI spend, or payment actions. They\n    // only consume fresh exact-SHA receipts produced independently in sandbox/test scope.\n    const authValidationReceipts = await base44.asServiceRole.entities.AuthValidationReceipt.list('-tested_at', 50).catch(() => []);\n    receipts.push(...validateAuthEvidence(authValidationReceipts, sourceSha));\n\n    const rlsValidationReceipts = await base44.asServiceRole.entities.RlsValidationReceipt.list('-tested_at', 50).catch(() => []);\n    receipts.push(...validateRlsEvidence(rlsValidationReceipts, sourceSha));\n\n    const aiGatewayValidationReceipts = await base44.asServiceRole.entities.AiGatewayValidationReceipt.list('-tested_at', 50).catch(() => []);\n    receipts.push(...validateAiGatewayEvidence(aiGatewayValidationReceipts, sourceSha));\n\n    const paymentValidationReceipts = await base44.asServiceRole.entities.PaymentValidationReceipt.list('-tested_at', 50).catch(() => []);\n    receipts.push(...validatePaymentEvidence(paymentValidationReceipts, sourceSha));`;

if (source.includes("../../shared/externalGateValidators.ts")) {
  console.log('External gate validators already wired; no change required.');
  process.exit(0);
}

if ((source.match(new RegExp(importAnchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length !== 1) {
  throw new Error('Import anchor missing or ambiguous; refusing mutation.');
}
if ((source.match(new RegExp(backendAnchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length !== 1) {
  throw new Error('Backend anchor missing or ambiguous; refusing mutation.');
}

source = source.replace(importAnchor, importBlock);
source = source.replace(backendAnchor, externalBlock);

const requiredFragments = [
  "validateAuthEvidence(authValidationReceipts, sourceSha)",
  "validateRlsEvidence(rlsValidationReceipts, sourceSha)",
  "validateAiGatewayEvidence(aiGatewayValidationReceipts, sourceSha)",
  "validatePaymentEvidence(paymentValidationReceipts, sourceSha)",
];
for (const fragment of requiredFragments) {
  if (!source.includes(fragment)) throw new Error(`Postcondition failed: missing ${fragment}`);
}

fs.writeFileSync(target, source);
console.log('Wired seven remaining receipt-backed mandatory gates into runValidators.');
