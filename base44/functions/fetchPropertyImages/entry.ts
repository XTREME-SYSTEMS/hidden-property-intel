import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
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

Find the listing page URL on one of these sites (try in order): Auction.com, Zillow.com, Realtor.com, Redfin.com, Homes.com, Trulia.com, or a county property appraiser site.

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

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 25;

    let properties;
    if (body.property_id) {
      properties = [await base44.asServiceRole.entities.Property.get(body.property_id)];
    } else {
      properties = await base44.asServiceRole.entities.Property.list('-scraped_at', limit);
    }

    const results = [];
    for (const p of properties) {
      try {
        // Step 1: find the listing page URL via web search
        const { url: listingUrl, source } = await findListingUrl(base44, p);
        if (!listingUrl) {
          results.push({ id: p.id, address: `${p.address}, ${p.city}, ${p.state}`, found: 0, note: 'No listing page found' });
          continue;
        }

        // Step 2: fetch real images from the rendered listing page
        let images = [];
        try {
          images = await fetchImagesFromPage(listingUrl);
        } catch (e) {
          results.push({ id: p.id, address: `${p.address}, ${p.city}, ${p.state}`, found: 0, listing_url: listingUrl, error: e.message });
          continue;
        }

        if (images.length > 0) {
          const imageRecords = images.slice(0, 10).map(i => ({
            url: i.url,
            type: 'scraped',
            caption: i.caption || `Real listing photo via ${source || 'web'}`,
            source: source || listingUrl
          }));
          await base44.asServiceRole.entities.Property.update(p.id, {
            images: imageRecords,
            source_url: listingUrl
          });
          results.push({
            id: p.id,
            address: `${p.address}, ${p.city}, ${p.state}`,
            found: images.length,
            listing_url: listingUrl,
            source,
            sample: images[0]?.url?.slice(0, 70)
          });
        } else {
          results.push({
            id: p.id,
            address: `${p.address}, ${p.city}, ${p.state}`,
            found: 0,
            listing_url: listingUrl,
            note: 'Listing found but no images extracted'
          });
        }
      } catch (e) {
        results.push({ id: p.id, address: `${p.address}, ${p.city}, ${p.state}`, found: 0, error: e.message });
      }
    }

    const updated = results.filter(r => r.found > 0).length;
    return Response.json({ processed: results.length, updated, results });
  } catch (error) {
    console.error('fetchPropertyImages error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}