import { loadConfig, authMatches } from '../lib/convergence/config.js';
import { runReconcile } from '../lib/convergence/reconcile.js';

export default async function handler(req, res) {
  const config = loadConfig(process.env);
  if (!authMatches(req, config)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const receipt = await runReconcile();
  const status = receipt.status === 'VERIFIED_100' ? 200 : receipt.status === 'BLOCKED' ? 503 : 200;
  return res.status(status).json(receipt);
}
