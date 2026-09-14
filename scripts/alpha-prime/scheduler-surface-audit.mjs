import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const conflicts = [];
const authorities = [];

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

// Base44 scheduled workflows. Alpha Prime Convergence Heartbeat is the single
// allowed governor; every other recurring Base44 workflow is an independent
// scheduler surface that must be explicitly consolidated or justified.
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

// Discover every Vercel cron declaration instead of relying on a hand-maintained
// list. This deliberately scans recursively because future subprojects can add a
// second vercel.json without updating the governor inventory.
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

// Discover every Railway cron declaration recursively.
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

if (conflicts.length) {
  console.error(`scheduler-surface-audit FAIL: ${conflicts.length} independent recurring scheduler(s) remain outside the Alpha Prime Convergence Heartbeat.`);
  for (const c of conflicts) {
    console.error(`CONFLICT ${c.type} ${c.authority} schedule=${c.schedule}${c.path ? ` path=${c.path}` : ''}`);
  }
  process.exit(1);
}

console.log('scheduler-surface-audit PASS: Convergence Heartbeat is the only recurring operational scheduler authority discovered.');
