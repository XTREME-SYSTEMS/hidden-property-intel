import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fetchPropertyImages, hasRealImages } from '../../shared/propertyImages.ts';

/**
 * Autonomous image ingestion system.
 *
 * Systematically scans ALL properties (active + draft) that are missing real
 * photos, fetches real listing images from the web using the property address,
 * validates they are real reachable images (not AI, not broken), and stores
 * them in the correct property.images field.
 *
 * - Uses LLM web-search to find the real listing page (Redfin, Homes.com, etc.)
 * - Uses Browserbase to extract real <img> URLs from the page
 * - Validates each URL is reachable and is an image (HEAD/GET check)
 * - No AI-generated images — only real scraped photos
 *
 * Runs every 30 minutes via the Property Image Ingestion workflow.
 * Processes 6 properties per run (time-safety valve prevents timeouts).
 */

const BATCH_SIZE = 6;
const SCAN_SIZE = 100;
const TIME_LIMIT_MS = 250000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Scan a batch of properties (oldest scraped first), filter for missing real images
    const candidates = await base44.asServiceRole.entities.Property.list('scraped_at', SCAN_SIZE);

    const needingImages = candidates.filter(p =>
      (p.status === 'active' || p.status === 'draft') && !hasRealImages(p)
    );

    const toProcess = needingImages.slice(0, BATCH_SIZE);
    const results = [];
    let ingested = 0;
    let failed = 0;
    const startedAt = Date.now();

    for (const p of toProcess) {
      if (Date.now() - startedAt > TIME_LIMIT_MS) {
        results.push({ id: p.id, address: p.address, action: 'skipped', note: 'time limit reached' });
        continue;
      }
      try {
        const r = await fetchPropertyImages(base44, p);
        if (r.found > 0) {
          ingested++;
          results.push({
            id: p.id,
            address: `${p.address}, ${p.city}, ${p.state}`,
            action: 'ingested',
            images: r.found,
            source: r.source,
            listing_url: r.listing_url
          });
        } else {
          failed++;
          results.push({
            id: p.id,
            address: `${p.address}, ${p.city}, ${p.state}`,
            action: 'no_images',
            note: r.note || r.error || 'no images found'
          });
        }
      } catch (e) {
        console.error('ingest failed for', p.id, e?.message);
        failed++;
        results.push({
          id: p.id,
          address: `${p.address}, ${p.city}, ${p.state}`,
          action: 'error',
          error: e.message
        });
      }
    }

    return Response.json({
      scanned: candidates.length,
      needing_images: needingImages.length,
      processed: toProcess.length,
      ingested,
      failed,
      results
    });
  } catch (error) {
    console.error('ingestPropertyImages error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}