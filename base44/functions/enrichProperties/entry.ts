import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enrichProperty } from '../../shared/enrichment.ts';

/**
 * Batch data enrichment for active properties.
 *
 * Goes through active properties that haven't been enriched yet (enriched_at is null)
 * and fills in investor-relevant data: rental estimate, neighborhood/school ratings,
 * crime level, flood zone, zoning, tax assessed value, equity estimate, occupancy
 * status, and a full investor summary narrative.
 *
 * Runs on a schedule (every 6 hours) via the Property Enrichment Engine workflow.
 */

const BATCH_SIZE = 15;
const TIME_LIMIT_MS = 200000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch active properties, newest first (prioritize fresh Railway data)
    const candidates = await base44.asServiceRole.entities.Property.filter(
      { status: 'active' },
      '-created_date',
      BATCH_SIZE * 3
    );

    // Filter to only those that haven't been enriched yet
    const needsEnrichment = candidates.filter(p => !p.enriched_at).slice(0, BATCH_SIZE);

    const results = [];
    let enriched = 0;
    let failed = 0;
    const startedAt = Date.now();

    for (const p of needsEnrichment) {
      if (Date.now() - startedAt > TIME_LIMIT_MS) {
        results.push({ id: p.id, address: p.address, action: 'skipped', note: 'time limit' });
        continue;
      }
      try {
        const data = await enrichProperty(base44, p);
        enriched++;
        results.push({
          id: p.id,
          address: p.address,
          action: 'enriched',
          rental: data.rental_estimate,
          neighborhood: data.neighborhood_rating,
          schools: data.school_rating
        });
      } catch (e) {
        failed++;
        results.push({ id: p.id, address: p.address, action: 'error', error: e.message });
      }
    }

    return Response.json({
      processed: needsEnrichment.length,
      enriched,
      failed,
      results
    });
  } catch (error) {
    console.error('enrichProperties error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}