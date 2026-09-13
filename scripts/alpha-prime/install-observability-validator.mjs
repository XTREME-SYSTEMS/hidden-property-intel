import fs from 'node:fs';

const validatorPath = 'base44/functions/runValidators/entry.ts';
const entityPath = 'base44/entities/RuntimeLogReceipt.jsonc';

function replaceOnce(source, needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first < 0) throw new Error(`Missing deterministic anchor: ${label}`);
  if (source.indexOf(needle, first + needle.length) >= 0) throw new Error(`Ambiguous deterministic anchor: ${label}`);
  return source.slice(0, first) + replacement + source.slice(first + needle.length);
}

let source = fs.readFileSync(validatorPath, 'utf8');

if (!source.includes("gate_id: 'obs.logs_available'")) {
  const heartbeatAnchor = "    const heartbeats = await base44.asServiceRole.entities.HeartbeatReceipt.list('-timestamp', 10).catch(() => []);\n    receipts.push(validateHeartbeatActive(heartbeats, sourceSha));";
  const heartbeatReplacement = `${heartbeatAnchor}\n\n    // OBSERVABILITY. The durable runtime log stream is source-SHA stamped and must\n    // demonstrate advancing exact-SHA records. Missing or foreign logs remain UNKNOWN.\n    const runtimeLogs = await base44.asServiceRole.entities.RuntimeLogReceipt.list('-timestamp', 20).catch(() => []);\n    receipts.push(validateObservabilityLogs(runtimeLogs, sourceSha));`;
  source = replaceOnce(source, heartbeatAnchor, heartbeatReplacement, 'heartbeat -> observability receipt insertion');

  const functionAnchor = 'function latestExactShaHeartbeat(heartbeats: any[], sourceSha: string | null): any | null {';
  const observabilityFunction = `function validateObservabilityLogs(runtimeLogs: any[], sourceSha: string | null): ValidatorReceipt {\n  const threshold = '>=2 exact-SHA advancing runtime log receipts in 20m; max gap <=15m';\n  const probe = 'RuntimeLogReceipt.list(-timestamp,20) exact source_sha stream audit';\n  if (!sourceSha) {\n    return buildReceipt({\n      gate_id: 'obs.logs_available', validator_id: 'runtime_log_stream_probe', status: 'BLOCKED',\n      source_sha: null, metric_value: 0, threshold, command_or_probe: probe,\n      reason: 'Canonical source SHA is unavailable; runtime log lineage cannot be verified.',\n    });\n  }\n\n  const cutoff = Date.now() - 20 * 60 * 1000;\n  const exact = runtimeLogs.filter((row: any) => {\n    if (row?.source_sha !== sourceSha || !row?.timestamp) return false;\n    const ts = new Date(row.timestamp).getTime();\n    return Number.isFinite(ts) && ts >= cutoff;\n  });\n  const foreign = runtimeLogs.filter((row: any) => row?.source_sha && row.source_sha !== sourceSha);\n\n  if (exact.length < 2) {\n    return buildReceipt({\n      gate_id: 'obs.logs_available', validator_id: 'runtime_log_stream_probe', status: 'UNKNOWN',\n      source_sha: sourceSha, metric_value: exact.length, threshold, command_or_probe: probe,\n      evidence_refs: exact.map((row: any) => row.log_id).filter(Boolean),\n      stderr_summary: foreign.length ? \\`${foreign.length} foreign/stale runtime log receipt(s) ignored\\` : '',\n      reason: \\`Only ${exact.length} recent runtime log receipt(s) stamp canonical SHA ${sourceSha.slice(0, 8)}; at least 2 are required to prove an advancing stream.\\`,\n    });\n  }\n\n  const sorted = [...exact].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());\n  let advancing = true;\n  let maxGapMs = 0;\n  for (let i = 1; i < sorted.length; i++) {\n    const gap = new Date(sorted[i].timestamp).getTime() - new Date(sorted[i - 1].timestamp).getTime();\n    if (gap <= 0) advancing = false;\n    maxGapMs = Math.max(maxGapMs, gap);\n  }\n  const maxGapMin = maxGapMs / 60000;\n  const malformed = sorted.filter((row: any) => !row.log_id || !row.event || !row.subsystem);\n  const pass = advancing && maxGapMin <= 15 && malformed.length === 0;\n  return buildReceipt({\n    gate_id: 'obs.logs_available', validator_id: 'runtime_log_stream_probe', status: pass ? 'PASS' : 'FAIL',\n    source_sha: sourceSha, metric_value: sorted.length, threshold, command_or_probe: probe,\n    exit_code: pass ? 0 : 1,\n    evidence_refs: sorted.map((row: any) => row.log_id).filter(Boolean),\n    stdout_summary: \\`exact_sha_logs=${sorted.length}; max_gap_min=${maxGapMin.toFixed(1)}; malformed=${malformed.length}\\`,\n    reason: pass\n      ? \\`${sorted.length} source-stamped runtime log receipts are advancing for SHA ${sourceSha.slice(0, 8)} with max gap ${maxGapMin.toFixed(1)}m.\\`\n      : \\`Runtime log stream failed exact-SHA continuity: advancing=${advancing}, max gap=${maxGapMin.toFixed(1)}m, malformed=${malformed.length}.\\`,\n  });\n}\n\n`;
  source = replaceOnce(source, functionAnchor, observabilityFunction + functionAnchor, 'observability validator function insertion');

  const resultsAnchor = '    const results = Object.fromEntries(receipts.map((r) => [r.gate_id, r.status]));';
  const resultsReplacement = `    // Emit a durable application-level runtime log receipt for the NEXT validator cycle.\n    // The current cycle never counts the record it is about to write, preventing self-proof.\n    if (sourceSha) {\n      await base44.asServiceRole.entities.RuntimeLogReceipt.create({\n        log_id: uid('rlog'),\n        timestamp: now,\n        source_sha: sourceSha,\n        subsystem: 'runValidators',\n        level: 'info',\n        event: 'validator_cycle',\n        detail: \\`implemented=${receipts.length}; unimplemented_mandatory=${unimplementedMandatory.length}\\`,\n      }).catch(() => {});\n    }\n\n${resultsAnchor}`;
  source = replaceOnce(source, resultsAnchor, resultsReplacement, 'runtime log emission insertion');

  fs.writeFileSync(validatorPath, source);
}

if (!fs.existsSync(entityPath)) {
  fs.writeFileSync(entityPath, `{
  "name": "RuntimeLogReceipt",
  "type": "object",
  "properties": {
    "log_id": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "source_sha": { "type": "string" },
    "subsystem": { "type": "string" },
    "level": { "type": "string", "enum": ["info", "warn", "error"] },
    "event": { "type": "string" },
    "detail": { "type": "string" }
  },
  "required": ["log_id", "timestamp", "source_sha", "subsystem", "level", "event"],
  "rls": {
    "read": { "user_condition": { "role": "admin" } },
    "create": { "user_condition": { "role": "admin" } },
    "update": { "user_condition": { "role": "admin" } },
    "delete": { "user_condition": { "role": "admin" } }
  }
}\n`);
}

console.log('Observability validator installation complete.');
