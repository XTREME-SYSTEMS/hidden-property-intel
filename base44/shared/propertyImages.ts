/**
 * Shared real-property image acquisition engine.
 *
 * Two-step process:
 *  1. InvokeLLM web-search finds the real listing page URL for the address
 *     (prefers Redfin, Homes.com, Trulia, Auction.com, propertyonion.com —
 *      Zillow and Realtor.com block Browserbase extraction).
 *  2. Browserbase Fetch renders the page and extracts real <img> URLs.
 *
 * Used by:
 *  - fetchPropertyImages backend function (admin batch tool)
 *  - scoring.ts (replaces the old AI-generated image fallback)
 *  - scraper.ts (auto-fetch images for newly harvested properties)
 */

import { secrets } from 'base44:runtime';

const LISTING_SCHEMA = {
  type: 'object',
  properties: {
    listing_url: { type: 'string' },
    source: { type: 'string' }
  }
};

const IMAGE_SCHEMA = {
  type: 'object',
  properties: {
    images: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          caption: { type: 'string' }
        }
      }
    },
    address: { type: 'string' }
  }
};

function findListingPrompt(p) {
  return `Search the LIVE web for the real estate listing at this EXACT address:
${p.address}, ${p.city}, ${p.state} ${p.zip_code}

PREFER these sites IN THIS ORDER (they work best for image extraction): Redfin.com, Homes.com, Trulia.com, Auction.com, propertyonion.com, realforeclose.com, county property appraiser sites. Do NOT use Zillow.com or Realtor.com — they block image extraction.

Return the single best listing page URL you actually found for this exact address. If you cannot find one, return an empty string.

Return JSON: { listing_url: string, source: string }`;
}

async function findListingUrl(base44, p) {
  const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: findListingPrompt(p),
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: LISTING_SCHEMA
  });
  const url = r?.listing_url || '';
  if (!url || !/^https?:\/\//.test(url)) return { url: '', source: r?.source || '' };
  return { url, source: r?.source || '' };
}

async function fetchImagesFromPage(listingUrl) {
  const apiKey = secrets.get('BROWSERBASE_API_KEY');
  if (!apiKey) throw new Error('BROWSERBASE_API_KEY not set');
  const res = await fetch('https://api.browserbase.com/v1/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-bb-api-key': apiKey },
    body: JSON.stringify({
      url: listingUrl,
      format: 'json',
      schema: IMAGE_SCHEMA
    })
  });
  const text = await res.text();
  let j = {};
  try { j = JSON.parse(text); } catch (e) { j = { error: { message: text.slice(0, 200) } }; }
  if (!res.ok) throw new Error(j.error?.message || 'Browserbase fetch failed');
  let content = j.content;
  if (typeof content === 'string') { try { content = JSON.parse(content); } catch (e) {} }
  const images = Array.isArray(content?.images) ? content.images.filter(i => i.url && /^https?:\/\//.test(i.url)) : [];
  return images;
}

/**
 * Fetch real listing images for a single property and persist them.
 * Returns { found, listing_url, source } or { found: 0, error }.
 * Does NOT generate AI images — only real scraped photos.
 */
export async function fetchPropertyImages(base44, property) {
  try {
    const { url: listingUrl, source } = await findListingUrl(base44, property);
    if (!listingUrl) return { found: 0, note: 'No listing page found' };

    let images = [];
    try {
      images = await fetchImagesFromPage(listingUrl);
    } catch (e) {
      return { found: 0, listing_url: listingUrl, error: e.message };
    }

    if (images.length > 0) {
      const imageRecords = images.slice(0, 10).map(i => ({
        url: i.url,
        type: 'scraped',
        caption: i.caption || `Real listing photo via ${source || 'web'}`,
        source: source || listingUrl
      }));
      await base44.asServiceRole.entities.Property.update(property.id, {
        images: imageRecords,
        source_url: listingUrl
      });
      return { found: images.length, listing_url: listingUrl, source };
    }
    return { found: 0, listing_url: listingUrl, note: 'Listing found but no images extracted' };
  } catch (e) {
    return { found: 0, error: e.message };
  }
}

/**
 * Returns true if a property has at least one real (non-AI) image.
 */
export function hasRealImages(property) {
  return Array.isArray(property.images) && property.images.some(
    i => i.type === 'scraped' || i.type === 'street_view' || i.type === 'satellite' || i.type === 'user_uploaded'
  );
}