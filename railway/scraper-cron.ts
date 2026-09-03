/**
 * Hidden Property Intel — Railway Scraper
 * Scrapes FL distressed properties via self-hosted CloudBrowser-Control engine.
 * Writes raw rows to Supabase via upsert (dedup_key unique index).
 * Triggers Base44 sync webhook after each batch.
 *
 * Scoring, ownership chains, images, and title risks are handled by Base44 —
 * this scraper ONLY harvests and stores raw property data.
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const log = (level: string, msg: string, data?: any) => {
  console.log(`[${new Date().toISOString()}] [${level}] ${msg}`, data ?? '');
};

// --- Env ---
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const browserEngineUrl = (process.env.BROWSER_ENGINE_URL || '').replace(/\/$/, '');
const browserEngineApiKey = process.env.BROWSER_ENGINE_API_KEY!;
const base44SyncUrl = process.env.BASE44_SYNC_URL!;
const syncToken = process.env.BASE44_SYNC_TOKEN || '';
const dailyTarget = parseInt(process.env.DAILY_TARGET || '500', 10);

if (!supabaseUrl || !supabaseServiceKey || !browserEngineUrl || !browserEngineApiKey || !base44SyncUrl) {
  log('error', 'Missing required env vars. Exiting.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Types ---
interface RawProperty {
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  distress_type?: string;
  estimated_value?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_footage?: number;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  source_url?: string;
  listing_notes?: string;
}

// --- Sources ---
const SCRAPE_SOURCES = [
  { name: 'Zillow Foreclosures - FL', url: 'https://www.zillow.com/homes/for_sale/foreclosed/', distress_type: 'foreclosure' },
  { name: 'Auction.com - FL', url: 'https://www.auction.com/real-estate/florida', distress_type: 'auction' },
  { name: 'HUD Home Store - FL', url: 'https://www.hudhomestore.com/search/FL', distress_type: 'bank_owned' },
  { name: 'FL Foreclosures', url: 'https://www.realforeclose.com', distress_type: 'foreclosure' },
];

const PROPERTY_SCHEMA = {
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
    owner_email: { type: 'string' },
    owner_phone: { type: 'string' },
    source_url: { type: 'string' },
    listing_notes: { type: 'string' },
  },
};

// --- Helpers ---
function normalizeAddress(addr: string): string {
  return (addr || '')
    .toLowerCase()
    .replace(/\b(st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ln|lane|ct|court|pl|place|way)\b/g, m => m)
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupKey(address: string, zip: string): string {
  return Buffer.from(`${normalizeAddress(address)}|${(zip || '').trim()}`).toString('base64');
}

// --- CloudBrowser-Control engine ---
async function createSession(): Promise<string> {
  const res = await axios.post(`${browserEngineUrl}/sessions`, {
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    timezone: 'America/New_York',
  }, {
    headers: { 'x-api-key': browserEngineApiKey, 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  const data = res.data;
  const id = data.sessionId || data.id;
  if (!id) throw new Error(`Engine did not return session id: ${JSON.stringify(data).slice(0, 200)}`);
  return id;
}

async function closeSession(sessionId: string): Promise<void> {
  try {
    await axios.delete(`${browserEngineUrl}/sessions/${sessionId}`, {
      headers: { 'x-api-key': browserEngineApiKey },
      timeout: 5000,
    });
  } catch { /* best effort */ }
}

async function scrapeUrl(sessionId: string, url: string, distressType: string): Promise<RawProperty[]> {
  // 1. Navigate
  await axios.post(`${browserEngineUrl}/sessions/${sessionId}/execute`,
    { action_type: 'goto', value: url },
    { headers: { 'x-api-key': browserEngineApiKey, 'Content-Type': 'application/json' }, timeout: 45000 }
  );

  // 2. Extract structured data
  const res = await axios.post(`${browserEngineUrl}/sessions/${sessionId}/execute`,
    {
      action_type: 'extract_table',
      selector: 'body',
      options: { output_schema: PROPERTY_SCHEMA },
    },
    { headers: { 'x-api-key': browserEngineApiKey, 'Content-Type': 'application/json' }, timeout: 45000 }
  );

  const data = res.data?.data;
  let props: any[] = [];
  if (Array.isArray(data)) props = data;
  else if (data?.properties) props = data.properties;
  else if (typeof data === 'string') {
    try { const p = JSON.parse(data); props = Array.isArray(p) ? p : (p.properties || []); } catch {}
  }

  // Tag with distress type + source
  return props
    .filter(p => p.address)
    .map(p => ({
      ...p,
      state: p.state || 'FL',
      distress_type: p.distress_type || distressType,
      source_url: p.source_url || url,
    }));
}

// --- Supabase upsert (race-safe dedup via unique index on dedup_key) ---
async function storeProperties(props: RawProperty[], sourceName: string): Promise<{ upserted: number; errors: number }> {
  let upserted = 0;
  let errors = 0;

  const rows = props.map(p => ({
    address: p.address,
    normalized_address: normalizeAddress(p.address),
    dedup_key: dedupKey(p.address, p.zip_code || ''),
    city: p.city || null,
    state: p.state || 'FL',
    zip_code: p.zip_code || null,
    distress_type: p.distress_type || 'foreclosure',
    estimated_value: p.estimated_value || null,
    bedrooms: p.bedrooms || null,
    bathrooms: p.bathrooms || null,
    square_footage: p.square_footage || null,
    source: 'railway-scraper',
    source_name: sourceName,
    source_url: p.source_url || null,
    scraped_at: new Date().toISOString(),
    raw_data: p,
    images: [],
  }));

  // Batch upsert — 100 at a time
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await supabase
      .from('properties')
      .upsert(batch, { onConflict: 'dedup_key' });

    if (error) {
      log('warn', `Upsert batch ${i} failed: ${error.message}`);
      errors += batch.length;
    } else {
      upserted += batch.length;
    }
  }

  return { upserted, errors };
}

// --- Base44 sync trigger ---
async function triggerBase44Sync(): Promise<void> {
  try {
    await axios.post(base44SyncUrl,
      { trigger: true, source: 'railway-scraper' },
      {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${syncToken}` },
        timeout: 30000,
      }
    );
    log('info', 'Base44 sync triggered');
  } catch (e: any) {
    log('error', `Base44 sync failed: ${e.message}`);
  }
}

// --- Main ---
async function main() {
  log('info', '=== Daily Scrape Cycle Starting ===');
  let totalUpserted = 0;
  let totalErrors = 0;
  let sessionId: string | null = null;

  try {
    sessionId = await createSession();
    log('info', `Browser session created: ${sessionId}`);

    for (const source of SCRAPE_SOURCES) {
      if (totalUpserted >= dailyTarget) break;

      log('info', `Scraping ${source.name}...`);
      let props: RawProperty[] = [];
      try {
        props = await scrapeUrl(sessionId!, source.url, source.distress_type);
      } catch (e: any) {
        log('error', `Scrape failed for ${source.name}: ${e.message}`);
        continue;
      }

      log('info', `  Found ${props.length} properties from ${source.name}`);

      if (props.length > 0) {
        const { upserted, errors } = await storeProperties(props, source.name);
        totalUpserted += upserted;
        totalErrors += errors;
        log('info', `  Upserted ${upserted} (errors: ${errors})`);
      }
    }

    if (totalUpserted > 0) {
      await triggerBase44Sync();
    }

    log('info', `=== Done: ${totalUpserted} upserted, ${totalErrors} errors ===`);
  } catch (e: any) {
    log('error', `Fatal: ${e.message}`);
    process.exitCode = 1;
  } finally {
    if (sessionId) await closeSession(sessionId);
  }
}

main();