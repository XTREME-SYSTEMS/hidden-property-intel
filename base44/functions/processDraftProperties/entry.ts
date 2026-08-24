import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { scorePropertyRecord } from '../../shared/scoring.ts';
import { fetchPropertyImages, hasRealImages } from '../../shared/propertyImages.ts';

/**
 * Batch processor for draft properties (scraped but not yet image-verified/scored).
 *
 * 1. Fetches real listing images for draft properties via Browserbase
 * 2. If images found, promotes to 'active' and scores via LLM
 * 3. Properties that can't get real photos stay as 'draft' (hidden from listings)
 *
 * Decoupled from the scrape pipeline to avoid timeouts.
 * Runs nightly after the scrape pipeline.
 */

const BATCH_SIZE = 3;
const TIME_LIMIT_MS = 250000; // stop before the 300s serverless timeout

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch draft properties (scraped but no images yet), oldest first
    const drafts = await base44.asServiceRole.entities.Property.filter(
      { status: 'draft' },
      'scraped_at',
      BATCH_SIZE
    );

    const results = [];
    let promoted = 0;
    let scored = 0;
    let stillDraft = 0;
    const startedAt = Date.now();

    for (const p of drafts) {
      // Safety valve: stop if we're approaching the timeout
      if (Date.now() - startedAt > TIME_LIMIT_MS) {
        results.push({ id: p.id, address: p.address, action: 'skipped', note: 'time limit reached' });
        continue;
      }
      try {
        // Step 1: fetch real listing images
        const imgResult = await fetchPropertyImages(base44, p);

        if (imgResult.found > 0) {
          // Step 2: promote to active
          await base44.asServiceRole.entities.Property.update(p.id, { status: 'active' });
          promoted++;

          // Step 3: score the property (scoring also generates title risk)
          try {
            const refreshed = await base44.asServiceRole.entities.Property.get(p.id);
            await scorePropertyRecord(base44, refreshed);
            scored++;
          } catch (e) {
            console.error('scoring failed for', p.id, e?.message);
          }

          results.push({ id: p.id, address: p.address, action: 'promoted+scored', images: imgResult.found });
        } else {
          stillDraft++;
          results.push({ id: p.id, address: p.address, action: 'still_draft', note: imgResult.note || imgResult.error || 'no images found' });
        }
      } catch (e) {
        console.error('process draft failed for', p.id, e?.message);
        results.push({ id: p.id, address: p.address, action: 'error', error: e.message });
      }
    }

    return Response.json({
      processed: drafts.length,
      promoted,
      scored,
      still_draft: stillDraft,
      results
    });
  } catch (error) {
    console.error('processDraftProperties error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}