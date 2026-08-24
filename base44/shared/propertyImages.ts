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

const LISTING_AND_IMAGE_SCHEMA = {
  type: 'object',
  properties: {
    listing_url: { type: 'string' },
    source: { type: 'string' },
    image_urls: {
      type: 'array',
      items: { type: 'string' }
    }
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

PREFER these sites IN THIS ORDER: Redfin.com, Homes.com, Trulia.com, Auction.com, propertyonion.com, realforeclose.com, county property appraiser sites. Do NOT use Zillow.com or Realtor.com.

I need TWO things:
1. The single best listing page URL for this exact address (empty string if not found)
2. Any DIRECT image URLs of property photos you find on the listing page or in search results. These must be direct image URLs (ending in .jpg, .jpeg, .png, .webp or from a CDN like cdn.redfin.com, images.homes.com, photos.trulia.com, etc.) — NOT page URLs. Include as many as you find.

Return JSON: { listing_url: string, source: string, image_urls: string[] }`;
}

async function findListingAndImages(base44, p) {
  const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: findListingPrompt(p),
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: LISTING_AND_IMAGE_SCHEMA
  });
  const url = r?.listing_url || '';
  const rawImages = Array.isArray(r?.image_urls) ? r.image_urls.filter(u => typeof u === 'string' && /^https?:\/\//.test(u)) : [];
  const images = rawImages.map(u => ({ url: u, caption: '' }));
  return {
    url: url && /^https?:\/\//.test(url) ? url : '',
    source: r?.source || '',
    images
  };
}

function isPropertyImage(url) {
  if (!url || !/^https?:\/\//.test(url)) return false;
  if (url.startsWith('data:')) return false;
  const lower = url.toLowerCase();
  const exclude = [
    'logo', 'icon', 'avatar', 'sprite', 'placeholder', 'blank', 'badge',
    'button', 'arrow', 'spinner', 'loading', 'favicon', '.svg', '.gif',
    'tracking', 'pixel', 'beacon', 'ad-', 'ads/', 'social', 'share',
    'facebook', 'twitter', 'instagram', 'linkedin', 'agent-photo',
    'realtor-headshot', 'profile-photo', 'headshot', 'no-photo', 'no-image'
  ];
  for (const ex of exclude) {
    if (lower.includes(ex)) return false;
  }
  return true;
}

function resolveUrl(url, base) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('data:')) return null;
  try { return new URL(url, base).href; } catch { return null; }
}

async function fetchImagesFromPage(listingUrl) {
  const apiKey = secrets.get('BROWSERBASE_API_KEY');
  if (!apiKey) throw new Error('BROWSERBASE_API_KEY not set');

  // Fetch the raw rendered HTML (no format = raw content, cheapest option)
  const res = await fetch('https://api.browserbase.com/v1/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-bb-api-key': apiKey },
    body: JSON.stringify({ url: listingUrl })
  });
  const text = await res.text();
  let j = {};
  try { j = JSON.parse(text); } catch { j = { content: text }; }
  if (!res.ok) throw new Error(j.error?.message || 'Browserbase fetch failed');

  const html = typeof j === 'string' ? j : (j.content || j.html || '');
  if (!html || html.length < 100) return [];

  const images = [];
  const seen = new Set();
  const addImage = (rawUrl) => {
    const url = resolveUrl(rawUrl, listingUrl);
    if (!url || !isPropertyImage(url) || seen.has(url)) return;
    seen.add(url);
    images.push({ url, caption: '' });
  };

  // Extract from <img src="...">
  let match;
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  while ((match = imgRegex.exec(html)) !== null) addImage(match[1]);

  // Extract from srcset (responsive images — often higher quality)
  const srcsetRegex = /srcset=["']([^"']+)["']/gi;
  while ((match = srcsetRegex.exec(html)) !== null) {
    for (const entry of match[1].split(',')) {
      addImage(entry.trim().split(' ')[0]);
    }
  }

  // Extract from data-src / data-lazy-src (lazy-loaded images)
  const lazyRegex = /data-(?:lazy-)?src=["']([^"']+)["']/gi;
  while ((match = lazyRegex.exec(html)) !== null) addImage(match[1]);

  // Extract from JSON-LD structured data
  const ldRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = ldRegex.exec(html)) !== null) {
    try {
      const ld = JSON.parse(match[1]);
      const collect = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) { obj.forEach(collect); return; }
        const img = obj.image;
        if (typeof img === 'string') addImage(img);
        else if (Array.isArray(img)) img.forEach(i => typeof i === 'string' ? addImage(i) : (i?.url && addImage(i.url)));
        else if (img?.url) addImage(img.url);
        Object.values(obj).forEach(v => { if (typeof v === 'object') collect(v); });
      };
      collect(ld);
    } catch {}
  }

  return images;
}

/**
 * Validates that a URL points to a real, reachable image (not a broken link,
 * placeholder, or non-image resource). Tries HEAD first, falls back to GET
 * with Range header for servers that reject HEAD.
 */
async function validateImageUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return false;
    const cl = parseInt(res.headers.get('content-length') || '0', 10);
    if (cl > 0 && cl < 2000) return false; // filters tiny placeholders/broken icons
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

/**
 * Filters an image list to only valid, reachable real images.
 */
async function validateImages(images) {
  const valid = [];
  for (const img of images) {
    if (await validateImageUrl(img.url)) valid.push(img);
  }
  return valid;
}

/**
 * Fetch real listing images for a single property and persist them.
 * Returns { found, listing_url, source } or { found: 0, error }.
 * Does NOT generate AI images — only real scraped photos.
 * All images are validated (reachable + image content-type) before storing.
 */
export async function fetchPropertyImages(base44, property) {
  try {
    // Step 1: LLM finds listing URL + any direct image URLs from web search
    const { url: listingUrl, source, images: llmImages } = await findListingAndImages(base44, property);

    let images = llmImages;

    // Step 2: If LLM didn't find direct images, fall back to Browserbase HTML parsing
    if (images.length === 0 && listingUrl) {
      try {
        images = await fetchImagesFromPage(listingUrl);
      } catch (e) {
        // Browserbase failed — continue with whatever we have
      }
    }

    if (!listingUrl && images.length === 0) return { found: 0, note: 'No listing page or images found' };

    if (images.length > 0) {
      const validated = await validateImages(images.slice(0, 10));
      if (validated.length === 0) {
        return { found: 0, listing_url: listingUrl, note: 'Images found but none validated as real photos' };
      }
      const imageRecords = validated.map(i => ({
        url: i.url,
        type: 'scraped',
        caption: i.caption || `Real listing photo via ${source || 'web'}`,
        source: source || listingUrl
      }));
      await base44.asServiceRole.entities.Property.update(property.id, {
        images: imageRecords,
        source_url: listingUrl
      });
      return { found: validated.length, listing_url: listingUrl, source, validated: validated.length };
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