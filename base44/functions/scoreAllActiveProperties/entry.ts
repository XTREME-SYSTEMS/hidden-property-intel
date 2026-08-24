import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { scorePropertyRecord } from '../../shared/scoring.ts';

/**
 * Batch-scores all active properties that are missing AI scores.
 * Processes in small batches to stay within serverless time limits.
 * Runs daily via the Daily Maintenance workflow.
 */

const BATCH_SIZE = 3;
const TIME_LIMIT_MS = 250000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all active properties, filter for those without scores
    const all = await base44.asServiceRole.entities.Property.filter({ status: 'active' }, '-created_date', 500);
    const needingScore = all.filter(p => p.property_score == null);

    const toProcess = needingScore.slice(0, BATCH_SIZE);
    const results = [];
    let scored = 0;
    const startedAt = Date.now();

    for (const p of toProcess) {
      if (Date.now() - startedAt > TIME_LIMIT_MS) {
        results.push({ id: p.id, address: p.address, action: 'skipped', note: 'time limit reached' });
        continue;
      }
      try {
        await scorePropertyRecord(base44, p);
        scored++;
        results.push({ id: p.id, address: p.address, action: 'scored' });
      } catch (e) {
        console.error('score failed for', p.id, e?.message);
        results.push({ id: p.id, address: p.address, action: 'error', error: e.message });
      }
    }

    return Response.json({
      needing_score: needingScore.length,
      processed: toProcess.length,
      scored,
      results
    });
  } catch (error) {
    console.error('scoreAllActiveProperties error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}