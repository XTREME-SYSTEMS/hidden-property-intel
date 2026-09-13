import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => {
  const full = path.join(root, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, s);
};

function replaceOnce(text, needle, replacement, label) {
  const first = text.indexOf(needle);
  if (first < 0) throw new Error(`installer precondition missing: ${label}`);
  if (text.indexOf(needle, first + needle.length) >= 0) throw new Error(`installer precondition ambiguous: ${label}`);
  return text.slice(0, first) + replacement + text.slice(first + needle.length);
}

const entityPath = 'base44/entities/BackendDeployReceipt.jsonc';
if (!fs.existsSync(path.join(root, entityPath))) {
  write(entityPath, `{
  "name": "BackendDeployReceipt",
  "type": "object",
  "properties": {
    "receipt_id": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "source_sha": { "type": "string" },
    "environment": { "type": "string", "enum": ["production", "preview", "sandbox"] },
    "deployment_id": { "type": "string" },
    "function_count": { "type": "integer", "minimum": 0 },
    "boot_failures": { "type": "integer", "minimum": 0 },
    "boot_failure_functions": { "type": "array", "items": { "type": "string" } },
    "artifact_ref": { "type": "string" },
    "producer": { "type": "string" }
  },
  "required": ["receipt_id", "timestamp", "source_sha", "environment", "function_count", "boot_failures", "producer"],
  "rls": {
    "read": { "user_condition": { "role": "admin" } },
    "create": { "user_condition": { "role": "admin" } },
    "update": { "user_condition": { "role": "admin" } },
    "delete": { "user_condition": { "role": "admin" } }
  }
}
`);
}

const auditPath = 'scripts/alpha-prime/static-audit.mjs';
let audit = read(auditPath);
if (!audit.includes("mode === 'backend-functions-source'")) {
  const marker = "\nfail(`Unknown static audit mode: ${mode || '(none)'}`);\n";
  const block = `
if (mode === 'backend-functions-source') {
  const ts = await import('typescript');
  const issues = [];
  const files = walk(functionDir).filter((f) => f.endsWith('entry.ts') || f.endsWith('entry.js'));
  if (files.length === 0) issues.push('base44/functions: no function entrypoints found');

  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    const kind = f.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS;
    const sf = ts.createSourceFile(rel(f), text, ts.ScriptTarget.Latest, true, kind);
    for (const d of sf.parseDiagnostics || []) {
      const pos = typeof d.start === 'number' ? sf.getLineAndCharacterOfPosition(d.start) : null;
      const where = pos ? ':' + (pos.line + 1) + ':' + (pos.character + 1) : '';
      const msg = ts.flattenDiagnosticMessageText(d.messageText, ' ');
      issues.push(rel(f) + where + ': syntax parse error: ' + msg);
    }
    if (!/export\\s+default\\s+/.test(text)) {
      issues.push(rel(f) + ': missing default export entrypoint');
    }
    if (/^\\s*(throw\\s+new\\s+Error|throw\\s+[^;]+);/m.test(text)) {
      issues.push(rel(f) + ': top-level throw detected; function cannot boot safely');
    }
  }

  if (issues.length) fail('backend-functions-source FAIL: ' + issues.length + ' source boot issue(s)', issues);
  pass('backend-functions-source PASS: ' + files.length + ' function entrypoints parse and expose default handlers');
}
`;
  audit = replaceOnce(audit, marker, block + marker, 'static audit final marker');
  write(auditPath, audit);
}

const workflowPath = '.github/workflows/alpha-prime-validation.yml';
let workflow = read(workflowPath);
if (!workflow.includes('backend-functions-source-audit:')) {
  workflow += `

  backend-functions-source-audit:
    name: backend-functions-source-audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci --ignore-scripts
      - name: Audit all Base44 function entrypoints for source-level boot readiness
        run: |
          set +e
          node scripts/alpha-prime/static-audit.mjs backend-functions-source 2>&1 | tee backend-functions-source.log
          ec=\${PIPESTATUS[0]}
          echo "$ec" > backend-functions-source.exit
          exit "$ec"
      - name: Upload backend source-boot evidence
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: alpha-prime-backend-functions-source-evidence
          path: |
            backend-functions-source.log
            backend-functions-source.exit
          if-no-files-found: error
          retention-days: 7
`;
  write(workflowPath, workflow);
}

const validatorsPath = 'base44/functions/runValidators/entry.ts';
let validators = read(validatorsPath);
if (!validators.includes("gate_id: 'backend.functions_deploy'")) {
  const insertAfter = "    receipts.push(validateCheckRunGate('frontend.no_console_errors', checkRuns, sourceSha, 'frontend-no-console-errors', 'Playwright uncaught console/page error validation'));\n";
  const addition = `${insertAfter}

    // BACKEND deploy gate is intentionally two-layered: current-SHA source boot audit
    // plus an independently produced exact-SHA production deployment receipt. Source
    // compilation alone can never satisfy a deployment gate.
    const backendDeployReceipts = await base44.asServiceRole.entities.BackendDeployReceipt.list('-timestamp', 20).catch(() => []);
    receipts.push(validateBackendFunctionsDeploy(checkRuns, backendDeployReceipts, sourceSha));
`;
  validators = replaceOnce(validators, insertAfter, addition, 'frontend no-console receipt insertion point');

  const helperMarker = "\nfunction validateHeartbeatActive(heartbeats: any[], sourceSha: string | null): ValidatorReceipt {\n";
  const helper = `
function validateBackendFunctionsDeploy(checkRuns: any[], deployReceipts: any[], sourceSha: string | null): ValidatorReceipt {
  const threshold = 'backend-functions-source-audit success + exact-SHA production deploy receipt + function_count>0 + boot_failures=0';
  const probe = 'GitHub backend-functions-source-audit + BackendDeployReceipt exact source_sha production evidence';
  if (!sourceSha) {
    return buildReceipt({
      gate_id: 'backend.functions_deploy', validator_id: 'backend_deploy_evidence_probe', status: 'BLOCKED',
      source_sha: null, metric_value: 0, threshold, command_or_probe: probe,
      reason: 'Canonical source SHA is unavailable; backend deployment evidence cannot be bound to source truth.',
    });
  }

  const sourceCheck = findCheckRun(checkRuns, 'backend-functions-source-audit');
  if (!sourceCheck) {
    return buildReceipt({
      gate_id: 'backend.functions_deploy', validator_id: 'backend_deploy_evidence_probe', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold, command_or_probe: probe,
      reason: 'No backend-functions-source-audit check exists for current SHA ' + sourceSha.slice(0, 8) + '.',
    });
  }
  if (sourceCheck.status !== 'completed') {
    return buildReceipt({
      gate_id: 'backend.functions_deploy', validator_id: 'backend_deploy_evidence_probe', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: sourceCheck.status, threshold, command_or_probe: probe,
      evidence_refs: [sourceCheck.url || sourceCheck.name],
      reason: 'Backend source audit is not complete for current SHA (status=' + sourceCheck.status + ').',
    });
  }
  if (sourceCheck.conclusion !== 'success') {
    return buildReceipt({
      gate_id: 'backend.functions_deploy', validator_id: 'backend_deploy_evidence_probe', status: 'FAIL',
      source_sha: sourceSha, metric_value: sourceCheck.conclusion, threshold, command_or_probe: probe,
      exit_code: 1, evidence_refs: [sourceCheck.url || sourceCheck.name],
      reason: 'Backend source boot audit failed for current SHA with conclusion ' + sourceCheck.conclusion + '.',
    });
  }

  const exactProduction = (deployReceipts || []).filter((row: any) =>
    row?.source_sha === sourceSha && row?.environment === 'production' && row?.timestamp
  ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (exactProduction.length === 0) {
    return buildReceipt({
      gate_id: 'backend.functions_deploy', validator_id: 'backend_deploy_evidence_probe', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: 0, threshold, command_or_probe: probe,
      evidence_refs: [sourceCheck.url || sourceCheck.name],
      reason: 'Source-level boot audit passed, but no exact-SHA production BackendDeployReceipt exists. Deployment is not inferred from compilation.',
    });
  }

  const latest = exactProduction[0];
  const functionCount = Number(latest.function_count);
  const bootFailures = Number(latest.boot_failures);
  if (!Number.isInteger(functionCount) || functionCount <= 0 || !Number.isInteger(bootFailures) || bootFailures < 0) {
    return buildReceipt({
      gate_id: 'backend.functions_deploy', validator_id: 'backend_deploy_evidence_probe', status: 'UNKNOWN',
      source_sha: sourceSha, metric_value: latest.receipt_id || 'malformed', threshold, command_or_probe: probe,
      evidence_refs: [sourceCheck.url || sourceCheck.name, latest.receipt_id, latest.deployment_id, latest.artifact_ref].filter(Boolean),
      reason: 'Exact-SHA production deployment receipt is malformed or lacks a positive function_count / non-negative boot_failures value.',
    });
  }

  const pass = bootFailures === 0;
  return buildReceipt({
    gate_id: 'backend.functions_deploy', validator_id: 'backend_deploy_evidence_probe', status: pass ? 'PASS' : 'FAIL',
    source_sha: sourceSha, metric_value: bootFailures, threshold, command_or_probe: probe,
    exit_code: pass ? 0 : 1,
    evidence_refs: [sourceCheck.url || sourceCheck.name, latest.receipt_id, latest.deployment_id, latest.artifact_ref].filter(Boolean),
    stdout_summary: 'function_count=' + functionCount + '; boot_failures=' + bootFailures + '; producer=' + (latest.producer || 'unknown'),
    stderr_summary: bootFailures > 0 ? (latest.boot_failure_functions || []).join(', ') : '',
    reason: pass
      ? 'Exact-SHA production deploy receipt proves ' + functionCount + ' function(s) deployed with zero boot failures.'
      : 'Exact-SHA production deploy receipt reports ' + bootFailures + ' boot failure(s) across ' + functionCount + ' deployed function(s).',
  });
}
`;
  validators = replaceOnce(validators, helperMarker, helper + helperMarker, 'heartbeat helper marker');
  write(validatorsPath, validators);
}

const docPath = 'docs/alpha-prime/BACKEND_DEPLOY_EVIDENCE.md';
if (!fs.existsSync(path.join(root, docPath))) {
  write(docPath, `# Backend deployment evidence contract

The mandatory \`backend.functions_deploy\` gate is intentionally fail-closed and requires two independent evidence layers for the exact canonical source SHA:

1. GitHub check \`backend-functions-source-audit\` must complete successfully. It parses every Base44 function entrypoint and proves source-level handler readiness only.
2. An independently produced \`BackendDeployReceipt\` for \`environment=production\` must stamp the exact same source SHA, report a positive deployed function count, and report \`boot_failures=0\`.

A source audit never proves deployment. A preview/sandbox receipt never proves production. A foreign or stale SHA never counts. Missing deployment evidence remains UNKNOWN. Any exact-SHA production receipt with one or more boot failures is FAIL.

Deployment automation is the only intended producer of deployment receipts. The validator itself does not create a deploy receipt and cannot self-prove this gate.
`);
}

console.log('backend deploy validator installer complete');
