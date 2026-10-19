import { mirrorToSupabase } from '../lib/tasks.js';

export default async function handler(req, res) {
  const result = await mirrorToSupabase();
  return res.status(result.ok ? 200 : result.status === 'BLOCKED' ? 503 : 502).json({ ...result, timestamp: new Date().toISOString() });
}
