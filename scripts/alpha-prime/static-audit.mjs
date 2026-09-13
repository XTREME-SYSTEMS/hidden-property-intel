import fs from 'node:fs';
import path from 'node:path';

const mode = process.argv[2];
const root = process.cwd();

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
function rel(p) { return path.relative(root, p).replaceAll('\\', '/'); }
function fail(msg, rows = []) { console.error(msg); for (const r of rows.slice(0, 100)) console.error(r); process.exit(1); }
function pass(msg) { console.log(msg); process.exit(0); }
function stripJsonc(s) { return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1').replace(/,\s*([}\]])/g, '$1'); }

const entityDir = path.join(root, 'base44', 'entities');
const functionDir = path.join(root, 'base44', 'functions');

if (mode === 'schema-valid') {
  const errors = [];
  const files = walk(entityDir).filter((f) => f.endsWith('.jsonc') || f.endsWith('.json'));
  for (const f of files) {
    try {
      const obj = JSON.parse(stripJsonc(fs.readFileSync(f, 'utf8')));
      if (!obj || obj.type !== 'object' || !obj.name || !obj.properties || typeof obj.properties !== 'object') errors.push(`${rel(f)}: invalid entity schema shape`);
      if (obj.required && !Array.isArray(obj.required)) errors.push(`${rel(f)}: required must be an array`);
      for (const k of obj.required || []) if (!(k in (obj.properties || {}))) errors.push(`${rel(f)}: required field '${k}' missing from properties`);
    } catch (e) { errors.push(`${rel(f)}: JSONC parse failed: ${e.message}`); }
  }
  if (errors.length) fail(`schema-valid FAIL: ${errors.length} issue(s)`, errors);
  pass(`schema-valid PASS: parsed ${files.length} entity schemas`);
}

if (mode === 'oversized-fields') {
  const hits = [];
  const suspicious = /(base64|blob|binary|file_content|image_data|screenshot_data|raw_html|html_snapshot)/i;
  for (const f of walk(entityDir).filter((x) => x.endsWith('.jsonc') || x.endsWith('.json'))) {
    const text = fs.readFileSync(f, 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*"([^"]+)"\s*:/);
      if (m && suspicious.test(m[1])) hits.push(`${rel(f)}: suspicious field '${m[1]}'`);
    }
  }
  if (hits.length) fail(`oversized-fields FAIL: ${hits.length} suspicious entity field(s)`, hits);
  pass('oversized-fields PASS: no base64/blob/binary-style entity fields detected');
}

if (mode === 'input-validation') {
  const suspects = [];
  const files = walk(functionDir).filter((f) => f.endsWith('entry.ts') || f.endsWith('entry.js'));
  const validationSignals = /(z\.object|safeParse\s*\(|\.parse\s*\(|typeof\s+|Array\.isArray|\.includes\s*\(|allowed[A-Z_]|validate[A-Z_]|schema)/;
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    if (!/(req\.json\s*\(|request\.json\s*\()/i.test(text)) continue;
    if (!validationSignals.test(text)) suspects.push(`${rel(f)}: request body is parsed but no validation signal was detected`);
  }
  if (suspects.length) fail(`input-validation FAIL: ${suspects.length} function(s) need deterministic input validation review`, suspects);
  pass(`input-validation PASS: ${files.length} function entrypoints scanned; all body-parsing functions show validation signals`);
}

if (mode === 'contract-safety') {
  const hits = [];
  const files = walk(functionDir).filter((f) => /\.(ts|js)$/i.test(f));
  const liveMutation = /(\.deploy\s*\(|sendRawTransaction|wallet_sendTransaction|\.sendTransaction\s*\(|broadcastTransaction\s*\()/i;
  for (const f of files) {
    let text; try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
    if (!liveMutation.test(text)) continue;

    const hasApprovalReceipt = /GovernanceReview/.test(text);
    const hasApprovalId = /\bapproval_id\b|\bapprovalId\b/.test(text);
    const hasApprovedDecision = /decision\s*!==\s*['"]approved['"]|decision\s*===\s*['"]approved['"]/.test(text);
    const hasActionBinding = /action_id/.test(text) && /(expectedActionId|deployActionId|actionId)/.test(text);
    if (!(hasApprovalReceipt && hasApprovalId && hasApprovedDecision && hasActionBinding)) {
      hits.push(`${rel(f)}: live-chain mutation primitive is not protected by an exact approved GovernanceReview action`);
    }

    if (/Core\.SendEmail\s*\(/.test(text)) {
      const separateMessagingApproval = /message_approval_id/.test(text) && /contract\.notify:/.test(text);
      if (!separateMessagingApproval) hits.push(`${rel(f)}: contract workflow can message customers without a separate message approval`);
    }
  }
  if (hits.length) fail(`contract-safety FAIL: ${hits.length} unapproved live contract path(s)`, hits);
  pass(`contract-safety PASS: ${files.length} backend function files scanned; live-chain primitives are approval-bound and contract messaging is separately gated`);
}

if (mode === 'resilience-fallback') {
  const issues = [];
  const systemAuditPath = path.join(root, 'base44', 'functions', 'systemAudit', 'entry.ts');
  const browserEnginePath = path.join(root, 'base44', 'shared', 'browserEngine.ts');
  const jobEnginePath = path.join(root, 'base44', 'shared', 'jobEngine.ts');

  if (!fs.existsSync(systemAuditPath)) {
    issues.push('base44/functions/systemAudit/entry.ts: authoritative core-SPOF inventory is missing');
  } else {
    const auditText = fs.readFileSync(systemAuditPath, 'utf8');
    const inventory = auditText.match(/critical_spof\s*:\s*\[([\s\S]*?)\]/);
    if (!inventory) {
      issues.push('base44/functions/systemAudit/entry.ts: critical_spof inventory is absent; zero core SPOFs cannot be proven');
    } else {
      const entries = [...inventory[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map((m) => m[1].trim()).filter(Boolean);
      for (const entry of entries) issues.push(`declared core single point of failure: ${entry}`);
    }
  }

  if (!fs.existsSync(browserEnginePath)) {
    issues.push('base44/shared/browserEngine.ts: browser fallback implementation is missing');
  } else {
    const browserText = fs.readFileSync(browserEnginePath, 'utf8');
    if (!/fetchRenderedHtmlWithFallback/.test(browserText) || !/Browserbase/i.test(browserText)) {
      issues.push('base44/shared/browserEngine.ts: primary-to-secondary browser fallback cannot be proven');
    }
  }

  if (!fs.existsSync(jobEnginePath)) {
    issues.push('base44/shared/jobEngine.ts: durable retry/dead-letter job fallback is missing');
  } else {
    const jobText = fs.readFileSync(jobEnginePath, 'utf8');
    const hasRetry = /status:\s*["']retrying["']/.test(jobText) && /next_retry_at/.test(jobText) && /Math\.pow\s*\(\s*2\s*,\s*attempts\s*\)/.test(jobText);
    const hasDeadLetter = /status:\s*["']dead_letter["']/.test(jobText) && /getDeadLetterJobs/.test(jobText);
    const hasCheckpoint = /saveCheckpoint/.test(jobText) && /checkpoint/.test(jobText);
    if (!(hasRetry && hasDeadLetter && hasCheckpoint)) {
      issues.push('base44/shared/jobEngine.ts: retry, dead-letter, and resumability fallback contract is incomplete');
    }
  }

  if (issues.length) fail(`resilience-fallback FAIL: ${issues.length} core resilience issue(s); threshold is 0 single-points-of-failure on core`, issues);
  pass('resilience-fallback PASS: zero declared core SPOFs and required browser/job fallback contracts are present');
}

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
    if (!/export\s+default\s+/.test(text)) {
      issues.push(rel(f) + ': missing default export entrypoint');
    }
    if (/^\s*(throw\s+new\s+Error|throw\s+[^;]+);/m.test(text)) {
      issues.push(rel(f) + ': top-level throw detected; function cannot boot safely');
    }
  }

  if (issues.length) fail('backend-functions-source FAIL: ' + issues.length + ' source boot issue(s)', issues);
  pass('backend-functions-source PASS: ' + files.length + ' function entrypoints parse and expose default handlers');
}

fail(`Unknown static audit mode: ${mode || '(none)'}`);
