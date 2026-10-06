import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.resolve(here, '..', 'vercel.json'), 'utf8'));

test('Vercel declares exactly one five-minute reconcile cron', () => {
  assert.equal(config.crons.length, 1);
  assert.deepEqual(config.crons[0], { path: '/api/reconcile', schedule: '*/5 * * * *' });
});
