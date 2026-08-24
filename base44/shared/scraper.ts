/**
 * PropertyIntel self-contained data acquisition engine.
 *
 * Two acquisition methods, no external aggregator dependency:
 *  - "ai" (default): uses the built-in LLM web-search (Gemini + live web) to harvest
 *    REAL current distressed listings for a target region. Works for JS-rendered
 *    county portals and aggregator sites alike, because the LLM searches the live web.
 *  - "browser": uses Browserbase Fetch for sources that expose a direct static
 *    listing URL (structured-JSON extraction).
 *
 * Both paths upsert Property + Owner records with address+zip dedupe.
 */

import { fetchPropertyImages, hasRealImages } from './propertyImages.ts';

const VALID_DISTRESS = new Set([
  'pre-foreclosure', 'foreclosure', 'probate_inherited', 'tax_delinquent',
  'code_violation', 'divorce', 'bankruptcy', 'auction', 'short_sale', 'bank_owned'
]);

const DISTRESS_MAP = {
  'pre-foreclosure': 'pre-foreclosure', 'pre_foreclosure': 'pre-foreclosure', 'preforeclosure': 'pre-foreclosure',
  'foreclosure': 'foreclosure',
  'probate_inherited': 'probate_inherited', 'probate-inherited': 'probate_inherited',
  'probate': 'probate_inherited', 'inherited': 'probate_inherited',
  'tax_delinquent': 'tax_delinquent', 'tax-delinquent': 'tax_delinquent',
  'taxdelinquent': 'tax_delinquent', 'tax': 'tax_delinquent',
  'code_violation': 'code_violation', 'code-violation': 'code_violation', 'codeviolation': 'code_violation',
  'divorce': 'divorce',
  'bankruptcy': 'bankruptcy',
  'auction': 'auction',
  'short_sale': 'short_sale', 'short-sale': 'short_sale', 'shortsale': 'short_sale',
  'bank_owned': 'bank_owned', 'bank-owned': 'bank_owned', 'reo': 'bank_owned', 'bankowned': 'bank_owned'
};

function normDistress(d, fallback) {
  const key = (d || '').trim().toLowerCase().replace(/\s+/g, '_');
  return DISTRESS_MAP[key] || DISTRESS_MAP[key.replace(/-/g, '_')] || (VALID_DISTRESS.has(fallback) ? fallback : 'foreclosure');
}

const AI_SCHEMA = {
  type: 'object',
  properties: {
    properties: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zip_code: { type: 'string' },
          distress_type: { type: 'string' },
          estimated_value: { type: 'number' },
          bedrooms: { type: 'number' },
          bathrooms: { type: 'number' },
          square_footage: { type: 'number' },
          owner_name: { type: 'string' },
          source_url: { type: 'string' },
          listing_notes: { type: 'string' }
        }
      }
    }
  }
};

const BROWSER_SCHEMA = AI_SCHEMA;

function buildHarvestPrompt(source, cfg, overrides) {
  const state = cfg.state || overrides.state || 'FL';
  const region = cfg.county ? `${cfg.county} County, ${state}` : `the state of ${state}`;
  const distress = cfg.distress_type || overrides.distress_type || 'distressed, foreclosure, pre-foreclosure, tax-delinquent, probate, or auction';
  const max = cfg.max_results || 20;
  return `You are a distressed-property data harvester for a real estate investment platform. Search the LIVE web for CURRENT ${distress} properties available RIGHT NOW in ${region}, United States.

Use real public sources: realforeclose.com (FL foreclosure auctions), county tax collector tax-deed sale pages, county property appraiser / clerk sites, Zillow foreclosures, Auction.com, RealtyTrac, HUD Home Store, and local newspaper legal notices / lis pendens filings.

Return up to ${max} REAL, currently-available properties as JSON. For each property include:
- address: full street address
- city, state, zip_code
- distress_type: one of pre-foreclosure, foreclosure, probate_inherited, tax_delinquent, code_violation, divorce, bankruptcy, auction, short_sale, bank_owned
- estimated_value: estimated market value in USD (number)
- bedrooms, bathrooms, square_footage (numbers; use 0 if unknown)
- owner_name: current owner name from public records if findable, else empty string
- source_url: the exact URL where you found this listing
- listing_notes: one short note about the situation (e.g. "auction 2025-09-15", "tax deed sale", "lis pendens filed")

CRITICAL: Only return properties you actually found via web search. Do NOT invent, guess, or fabricate any property or address. If you cannot find real listings, return an empty properties array.`;
}

async function harvestViaAI(base44, source, cfg, overrides) {
  const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: buildHarvestPrompt(source, cfg, overrides),
    add_context_from_internet: true,
    model: cfg.model || 'gemini_3_flash',
    response_json_schema: AI_SCHEMA
  });
  if (Array.isArray(r?.properties)) return r.properties;
  if (Array.isArray(r)) return r;
  return [];
}

async function harvestViaBrowser(source, url, cfg) {
  const apiKey = (await import('base44:runtime')).secrets.get('BROWSERBASE_API_KEY');
  const targetUrl = url || source?.url;
  const fetchRes = await fetch('https://api.browserbase.com/v1/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-bb-api-key': apiKey },
    body: JSON.stringify({ url: targetUrl, format: 'json', schema: BROWSER_SCHEMA })
  });
  const text = await fetchRes.text();
  let fetchJson = {};
  try { fetchJson = JSON.parse(text); } catch (e) { fetchJson = { error: { message: text.slice(0, 200) } }; }
  if (!fetchRes.ok) throw new Error(fetchJson.error?.message || 'Browserbase fetch failed');
  let content = fetchJson.content;
  if (typeof content === 'string') { try { content = JSON.parse(content); } catch (e) {} }
  if (content && Array.isArray(content.properties)) return content.properties;
  if (Array.isArray(content)) return content;
  return [];
}

export async function scrapeSource(base44, { source, url, distress_type, state }) {
  const cfg = source?.scrape_config || {};
  const method = cfg.method || 'ai';
  const sourceName = source?.name || 'manual';
  const fallbackDistress = cfg.distress_type || distress_type || 'foreclosure';

  let props = [];
  let acquisitionError = null;
  try {
    if (method === 'browser') {
      props = await harvestViaBrowser(source, url, cfg);
    } else {
      props = await harvestViaAI(base44, source, cfg, { distress_type, state });
    }
  } catch (err) {
    acquisitionError = err.message;
  }

  if (acquisitionError) {
    return { found: 0, isNew: 0, updated: 0, error: acquisitionError };
  }

  let found = props.length;
  let isNew = 0;
  let updated = 0;
  const newRecords = [];
  for (const p of props) {
    if (!p.address) continue;
    const existing = await base44.asServiceRole.entities.Property.filter({
      address: p.address,
      zip_code: p.zip_code
    });
    const payload = {
      address: p.address,
      city: p.city || cfg.city,
      state: p.state || cfg.state || state,
      zip_code: p.zip_code,
      distress_type: normDistress(p.distress_type, fallbackDistress),
      estimated_value: p.estimated_value || null,
      bedrooms: p.bedrooms || null,
      bathrooms: p.bathrooms || null,
      square_footage: p.square_footage || null,
      description: p.listing_notes || null,
      source: 'scraped',
      source_url: p.source_url || url || source?.url,
      scraped_at: new Date().toISOString(),
      status: 'active'
    };
    if (existing[0]) {
      await base44.asServiceRole.entities.Property.update(existing[0].id, payload);
      updated++;
    } else {
      // mandate images: new properties start as 'draft' until real photos are fetched
      // Image fetching is decoupled from scraping (done in a separate batch) to avoid timeouts
      const created = await base44.asServiceRole.entities.Property.create({ ...payload, status: 'draft' });
      if (p.owner_name) {
        await base44.asServiceRole.entities.Owner.create({
          property_id: created.id,
          name: p.owner_name,
          owner_type: 'current',
          source: sourceName
        });
      }
      newRecords.push(created);
      isNew++;
    }
  }
  return { found, isNew, updated, newRecords, error: null };
}