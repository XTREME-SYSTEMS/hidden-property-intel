import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const conflicts = [];
const authorities = [];
const failures = [];

function rel(p) {
  return path.relative(root, p).replaceAll('\\', '/');
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

function cronFromText(text) {
  const m = text.match(/"cron_expression"\s*:\s*"([^"]+)"/);
  return m?.[1] || 'scheduled';
}

const workflowDir = path.join(root, 'base44', 'workflows');
for (const file of walk(workflowDir).filter((p) => p.endsWith('.jsonc') || p.endsWith('.json'))) {
  const text = fs.readFileSync(file, 'utf8');
  if (!/"trigger_type"\s*:\s*"scheduled"/.test(text)) continue;
  const entry = {
    type: 'base44_workflow',
    authority: rel(file),
    schedule: cronFromText(text),
  };
  authorities.push(entry);
  if (path.basename(file) !== 'Convergence Heartbeat.jsonc') conflicts.push(entry);
}

for (const file of walk(root).filter((p) => path.basename(p) === 'vercel.json')) {
  let cfg;
  try { cfg = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
  for (const cron of Array.isArray(cfg?.crons) ? cfg.crons : []) {
    const entry = {
      type: 'vercel_cron',
      authority: rel(file),
      schedule: cron?.schedule || 'unknown',
      path: cron?.path || 'unknown',
    };
    authorities.push(entry);
    conflicts.push(entry);
  }
}

for (const file of walk(root).filter((p) => path.basename(p) === 'railway.json')) {
  let cfg;
  try { cfg = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
  const schedule = cfg?.deploy?.cronSchedule;
  if (!schedule) continue;
  const entry = {
    type: 'railway_cron',
    authority: rel(file),
    schedule,
  };
  authorities.push(entry);
  conflicts.push(entry);
}

console.log(`scheduler-surface-audit: discovered ${authorities.length} recurring scheduler authority record(s)`);
for (const a of authorities) {
  console.log(`AUTHORITY ${a.type} ${a.authority} schedule=${a.schedule}${a.path ? ` path=${a.path}` : ''}`);
}

const contractPath = path.join(root, 'base44', 'shared', 'validatorContract.ts');
if (!fs.existsSync(contractPath)) {
  failures.push('base44/shared/validatorContract.ts is missing; scheduler inventory coverage cannot be proved');
} else {
  const contract = fs.readFileSync(contractPath, 'utf8');
  const expectedByAuthority = new Map();
  for (const a of authorities) {
    expectedByAuthority.set(a.authority, (expectedByAuthority.get(a.authority) || 0) + 1);
  }
  for (const [authority, expected] of expectedByAuthority) {
    const escaped = authority.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const actual = (contract.match(new RegExp(`authority:\\s*['\"]${escaped}['\"]`, 'g')) || []).length;
    if (actual < expected) {
      failures.push(`inventory drift: ${authority} discovered=${expected}, static_inventory=${actual}`);
    }
  }
  if (failures.length === 0) {
    console.log(`scheduler inventory coverage PASS: all ${authorities.length} discovered authority record(s) are represented in SCHEDULER_INVENTORY.`);
  }
}

if (conflicts.length) {
  console.error(`scheduler-surface-audit FAIL: ${conflicts.length} independent recurring scheduler(s) remain outside the Alpha Prime Convergence Heartbeat.`);
  for (const c of conflicts) {
    console.error(`CONFLICT ${c.type} ${c.authority} schedule=${c.schedule}${c.path ? ` path=${c.path}` : ''}`);
  }
}

if (failures.length) {
  console.error(`scheduler inventory coverage FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`INVENTORY_DRIFT ${failure}`);
}

if (conflicts.length || failures.length) process.exit(1);

console.log('scheduler-surface-audit PASS: Convergence Heartbeat is the only recurring operational scheduler authority discovered and static inventory coverage is complete.');
