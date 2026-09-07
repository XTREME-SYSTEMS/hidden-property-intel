import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fetchPropertyImages, hasRealImages } from '../../shared/propertyImages.ts';

/**
 * Batch image scraper for active properties that have no real listing photos.
 *
 * Two-stage approach:
 *  1. Primary: existing fetchPropertyImages (LLM web-search → cloudbrowser render → regex parse)
 *  2. Fallback: enhanced LLM-direct image search (asks the LLM to return direct photo URLs
 *     from web search results, then validates each URL is a real reachable image)
 *
 * The fallback was added because the cloudbrowser engine frequently finds the listing
 * page but can't extract images from the rendered HTML (JS-rendered images, lazy loading,
 * CDN URLs in non-standard attributes). The LLM with web search can often find direct
 * image URLs that the HTML parser misses.
 *
 * Runs every 4 hours via the Property Image Scraper workflow.
 */

const BATCH_SIZE = 20;
const TIME_LIMIT_MS = 200000;

const LLM_IMAGE_SCHEMA = {
  type: 'object',
  properties: {
    image_urls: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

function buildImageSearchPrompt(p: any) {
  return `Find real estate property photos for this exact address. Search the live web for listing photos, property photos, or street photos.

Address: ${p.address}, ${p.city}, ${p.state} ${p.zip_code}

Look on: Redfin.com, Homes.com, Trulia.com, Zillow.com, Realtor.com, Apartments.com, LoopNet.com, county property appraiser sites, and Google Images.

Return a JSON object with an "image_urls" array of DIRECT image URLs. Each URL must:
- Start with http:// or https://
- Be a direct link to an image file (ending in .jpg, .jpeg, .png, .webp) OR be from a known real estate CDN (cdn.redfin.com, images.homes.com, photos.trulia.com, photos.zillowcdn.com, photos.realtorcdn.com, etc.)
- NOT be a page URL (no HTML pages, no search results pages)

Include 3-10 direct property photo URLs. If you cannot find direct image URLs, return an empty array. Do NOT fabricate URLs.`;
}

async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return false;
    const cl = parseInt(res.headers.get('content-length') || '0', 10);
    if (cl > 0 && cl < 2000) return false;
    return true;
  } catch {
    try {
      const res = await fetch(url, { headers: { Range: 'bytes=0-0' }, signal: AbortSignal.timeout(8000) });
      if (!res.ok && res.status !== 206) return false;
      const ct = res.headers.get('content-type') || '';
      return ct.startsWith('image/');
    } catch {
      return false;
    }
  }
}

async function findImagesViaLLM(base44: any, p: any) {
  const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: buildImageSearchPrompt(p),
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: LLM_IMAGE_SCHEMA
  });

  const urls = Array.isArray(r?.image_urls) ? r.image_urls.filter((u: string) => /^https?:\/\//.test(u)) : [];
  if (urls.length === 0) return [];

  // Validate each URL is a real, reachable image
  const valid: { url: string }[] = [];
  for (const url of urls.slice(0, 10)) {
    if (await validateImageUrl(url)) valid.push({ url });
  }
  return valid;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch active properties, newest first (prioritize fresh Railway data)
    const candidates = await base44.asServiceRole.entities.Property.filter(
      { status: 'active' },
      '-created_date',
      BATCH_SIZE * 2
    );

    // Filter to only those without real images
    const needsImages = candidates.filter(p => !hasRealImages(p)).slice(0, BATCH_SIZE);

    const results = [];
    let fetched = 0;
    let failed = 0;
    const startedAt = Date.now();

    for (const p of needsImages) {
      if (Date.now() - startedAt > TIME_LIMIT_MS) {
        results.push({ id: p.id, address: p.address, action: 'skipped', note: 'time limit' });
        continue;
      }
      try {
        // Stage 1: primary approach (LLM + cloudbrowser)
        const result = await fetchPropertyImages(base44, p);

        if (result.found > 0) {
          fetched++;
          results.push({ id: p.id, address: p.address, action: 'images_found', count: result.found, method: 'primary' });
          continue;
        }

        // Stage 2: fallback — enhanced LLM-direct image search
        const llmImages = await findImagesViaLLM(base44, p);
        if (llmImages.length > 0) {
          const imageRecords = llmImages.map(i => ({
            url: i.url,
            type: 'scraped',
            caption: 'Property photo via web search',
            source: 'LLM direct search'
          }));
          await base44.asServiceRole.entities.Property.update(p.id, {
            images: imageRecords,
            image_fetch_attempts: 0
          });
          fetched++;
          results.push({ id: p.id, address: p.address, action: 'images_found', count: llmImages.length, method: 'llm_fallback' });
          continue;
        }

        // Both stages failed
        failed++;
        await base44.asServiceRole.entities.Property.update(p.id, {
          image_fetch_attempts: (p.image_fetch_attempts || 0) + 1
        });
        results.push({ id: p.id, address: p.address, action: 'no_images', note: result.note || 'both methods failed' });
      } catch (e) {
        failed++;
        results.push({ id: p.id, address: p.address, action: 'error', error: e.message });
      }
    }

    return Response.json({
      processed: needsImages.length,
      images_fetched: fetched,
      failed,
      results
    });
  } catch (error) {
    console.error('scrapePropertyImages error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}