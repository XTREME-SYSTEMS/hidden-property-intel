/**
 * Hidden Property Intel — Railway Scraper (Aggressive)
 * Scrapes distressed properties across multiple states via self-hosted
 * CloudBrowser-Control engine. Paginates through result pages, retries
 * failed sources, rotates browser sessions to avoid detection.
 *
 * Writes raw rows to Supabase via upsert (dedup_key unique index).
 * Triggers Base44 sync webhook after each source batch.
 *
 * Scoring, ownership chains, images, and title risks are handled by Base44 —
 * this scraper ONLY harvests and stores raw property data.
 *
 * Railway has no function timeout — this process can run for 10+ minutes.
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
const dailyTarget = parseInt(process.env.DAILY_TARGET || '5000', 10);
const maxPagesPerSource = parseInt(process.env.MAX_PAGES || '8', 10);
const requestDelayMs = parseInt(process.env.REQUEST_DELAY_MS || '2000', 10);
const sessionRotateEvery = parseInt(process.env.SESSION_ROTATE_EVERY || '10', 10);
const maxRetries = parseInt(process.env.MAX_RETRIES || '2', 10);

if (!supabaseUrl || !supabaseServiceKey || !browserEngineUrl || !browserEngineApiKey || !base44SyncUrl) {
  log('error', 'Missing required env vars. Exiting.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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

interface ScrapeSource {
  name: string;
  url: string;
  distress_type: string;
  state: string;
  paginated?: boolean;
  page_param?: string;
  max_pages?: number;
}

// --- Sources (multi-state, high-volume) ---
const SCRAPE_SOURCES: ScrapeSource[] = [
  // FL
  { name: 'Zillow Foreclosures - FL', url: 'https://www.zillow.com/homes/foreclosures/', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 8 },
  { name: 'Auction.com - FL', url: 'https://www.auction.com/real-estate/florida/', distress_type: 'auction', state: 'FL', paginated: true, page_param: 'page', max_pages: 6 },
  { name: 'HUD Home Store - FL', url: 'https://www.hudhomestore.com/PropertySearch?state=FL', distress_type: 'bank_owned', state: 'FL', paginated: false, max_pages: 1 },
  { name: 'FL Foreclosures - Miami-Dade', url: 'https://www.miamidadeclerk.gov/public-records/search/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'FL Foreclosures - Broward', url: 'https://www.browardclerk.org/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  // GA
  { name: 'Zillow Foreclosures - GA', url: 'https://www.zillow.com/ga/foreclosures/', distress_type: 'foreclosure', state: 'GA', paginated: true, page_param: 'page', max_pages: 6 },
  { name: 'Auction.com - GA', url: 'https://www.auction.com/real-estate/georgia/', distress_type: 'auction', state: 'GA', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'HUD Home Store - GA', url: 'https://www.hudhomestore.com/PropertySearch?state=GA', distress_type: 'bank_owned', state: 'GA', paginated: false, max_pages: 1 },
  // TX
  { name: 'Zillow Foreclosures - TX', url: 'https://www.zillow.com/tx/foreclosures/', distress_type: 'foreclosure', state: 'TX', paginated: true, page_param: 'page', max_pages: 8 },
  { name: 'Auction.com - TX', url: 'https://www.auction.com/real-estate/texas/', distress_type: 'auction', state: 'TX', paginated: true, page_param: 'page', max_pages: 6 },
  { name: 'HUD Home Store - TX', url: 'https://www.hudhomestore.com/PropertySearch?state=TX', distress_type: 'bank_owned', state: 'TX', paginated: false, max_pages: 1 },
  // OH
  { name: 'Zillow Foreclosures - OH', url: 'https://www.zillow.com/oh/foreclosures/', distress_type: 'foreclosure', state: 'OH', paginated: true, page_param: 'page', max_pages: 6 },
  { name: 'Auction.com - OH', url: 'https://www.auction.com/real-estate/ohio/', distress_type: 'auction', state: 'OH', paginated: true, page_param: 'page', max_pages: 5 },
  // MI
  { name: 'Zillow Foreclosures - MI', url: 'https://www.zillow.com/mi/foreclosures/', distress_type: 'foreclosure', state: 'MI', paginated: true, page_param: 'page', max_pages: 6 },
  { name: 'Auction.com - MI', url: 'https://www.auction.com/real-estate/michigan/', distress_type: 'auction', state: 'MI', paginated: true, page_param: 'page', max_pages: 5 },
  // NV
  { name: 'Zillow Foreclosures - NV', url: 'https://www.zillow.com/nv/foreclosures/', distress_type: 'foreclosure', state: 'NV', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'Auction.com - NV', url: 'https://www.auction.com/real-estate/nevada/', distress_type: 'auction', state: 'NV', paginated: true, page_param: 'page', max_pages: 4 },
  // AZ
  { name: 'Zillow Foreclosures - AZ', url: 'https://www.zillow.com/az/foreclosures/', distress_type: 'foreclosure', state: 'AZ', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'Auction.com - AZ', url: 'https://www.auction.com/real-estate/arizona/', distress_type: 'auction', state: 'AZ', paginated: true, page_param: 'page', max_pages: 4 },
  // IN
  { name: 'Zillow Foreclosures - IN', url: 'https://www.zillow.com/in/foreclosures/', distress_type: 'foreclosure', state: 'IN', paginated: true, page_param: 'page', max_pages: 5 },
  // AL
  { name: 'Zillow Foreclosures - AL', url: 'https://www.zillow.com/al/foreclosures/', distress_type: 'foreclosure', state: 'AL', paginated: true, page_param: 'page', max_pages: 5 },
  // NC
  { name: 'Zillow Foreclosures - NC', url: 'https://www.zillow.com/nc/foreclosures/', distress_type: 'foreclosure', state: 'NC', paginated: true, page_param: 'page', max_pages: 5 },
  // SC
  { name: 'Zillow Foreclosures - SC', url: 'https://www.zillow.com/sc/foreclosures/', distress_type: 'foreclosure', state: 'SC', paginated: true, page_param: 'page', max_pages: 5 },
  // IL
  { name: 'Zillow Foreclosures - IL', url: 'https://www.zillow.com/il/foreclosures/', distress_type: 'foreclosure', state: 'IL', paginated: true, page_param: 'page', max_pages: 5 },
  // TN
  { name: 'Zillow Foreclosures - TN', url: 'https://www.zillow.com/tn/foreclosures/', distress_type: 'foreclosure', state: 'TN', paginated: true, page_param: 'page', max_pages: 5 },
  // PA
  { name: 'Zillow Foreclosures - PA', url: 'https://www.zillow.com/pa/foreclosures/', distress_type: 'foreclosure', state: 'PA', paginated: true, page_param: 'page', max_pages: 5 },
  // National aggregators
  { name: 'RealtyTrac Foreclosures', url: 'https://www.realtytrac.com/foreclosures/', distress_type: 'foreclosure', state: 'US', paginated: true, page_param: 'page', max_pages: 6 },
  { name: 'HomePath Fannie Mae', url: 'https://www.homepath.com/search.html', distress_type: 'bank_owned', state: 'US', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'HUD Home Store - US', url: 'https://www.hudhomestore.com/PropertySearch', distress_type: 'bank_owned', state: 'US', paginated: false, max_pages: 1 },
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

function buildPageUrl(source: ScrapeSource, page: number): string {
  if (!source.paginated || page <= 1) return source.url;
  const sep = source.url.includes('?') ? '&' : '?';
  return `${source.url}${sep}${source.page_param}=${page}`;
}

// --- CloudBrowser-Control engine ---
async function createSession(): Promise<string> {
  const res = await axios.post(`${browserEngineUrl}/sessions`, {
    viewport: { width: 1366, height: 900 },
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

async function scrapePage(sessionId: string, url: string, distressType: string, defaultState: string): Promise<RawProperty[]> {
  // 1. Navigate
  await axios.post(`${browserEngineUrl}/sessions/${sessionId}/execute`,
    { action_type: 'goto', value: url },
    { headers: { 'x-api-key': browserEngineApiKey, 'Content-Type': 'application/json' }, timeout: 60000 }
  );

  // Small delay to let JS render
  await sleep(1500);

  // 2. Extract structured data
  const res = await axios.post(`${browserEngineUrl}/sessions/${sessionId}/execute`,
    {
      action_type: 'extract_table',
      selector: 'body',
      options: { output_schema: PROPERTY_SCHEMA },
    },
    { headers: { 'x-api-key': browserEngineApiKey, 'Content-Type': 'application/json' }, timeout: 60000 }
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
      state: p.state || defaultState,
      distress_type: p.distress_type || distressType,
      source_url: p.source_url || url,
    }));
}

async function scrapeSourceWithRetries(sessionId: string, source: ScrapeSource): Promise<{ props: RawProperty[]; pages: number }> {
  const maxPages = source.max_pages || maxPagesPerSource;
  const allProps: RawProperty[] = [];
  let pagesScraped = 0;

  for (let page = 1; page <= maxPages; page++) {
    const pageUrl = buildPageUrl(source, page);
    let pageProps: RawProperty[] = [];
    let succeeded = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        log('info', `  [${source.name}] page ${page} (attempt ${attempt})`);
        pageProps = await scrapePage(sessionId, pageUrl, source.distress_type, source.state);
        succeeded = true;
        break;
      } catch (e: any) {
        log('warn', `  [${source.name}] page ${page} attempt ${attempt} failed: ${e.message}`);
        if (attempt < maxRetries) await sleep(3000 * attempt);
      }
    }

    if (!succeeded) {
      log('error', `  [${source.name}] page ${page} failed after ${maxRetries} retries, skipping source`);
      break;
    }

    if (pageProps.length === 0) {
      log('info', `  [${source.name}] page ${page} returned 0 properties — end of results`);
      break;
    }

    allProps.push(...pageProps);
    pagesScraped++;
    log('info', `  [${source.name}] page ${page}: ${pageProps.length} properties (total: ${allProps.length})`);

    // Stop if we've hit the per-source cap or daily target
    if (!source.paginated) break;
    if (page < maxPages) await sleep(requestDelayMs);
  }

  return { props: allProps, pages: pagesScraped };
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
  log('info', `=== Aggressive Scrape Cycle Starting (target: ${dailyTarget}, sources: ${SCRAPE_SOURCES.length}) ===`);
  let totalUpserted = 0;
  let totalErrors = 0;
  let sessionId: string | null = null;
  let sourcesProcessed = 0;

  try {
    sessionId = await createSession();
    log('info', `Browser session created: ${sessionId}`);

    for (const source of SCRAPE_SOURCES) {
      if (totalUpserted >= dailyTarget) {
        log('info', `Daily target ${dailyTarget} reached, stopping.`);
        break;
      }

      log('info', `Scraping ${source.name}...`);

      // Rotate session periodically to avoid detection
      if (sourcesProcessed > 0 && sourcesProcessed % sessionRotateEvery === 0) {
        log('info', `Rotating browser session (every ${sessionRotateEvery} sources)...`);
        if (sessionId) await closeSession(sessionId);
        await sleep(2000);
        sessionId = await createSession();
        log('info', `New session: ${sessionId}`);
      }

      const { props, pages } = await scrapeSourceWithRetries(sessionId!, source);
      log('info', `  ${source.name}: ${props.length} properties from ${pages} pages`);

      if (props.length > 0) {
        const { upserted, errors } = await storeProperties(props, source.name);
        totalUpserted += upserted;
        totalErrors += errors;
        log('info', `  Upserted ${upserted} (errors: ${errors}) — running total: ${totalUpserted}`);

        // Sync to Base44 after each source so data appears incrementally
        if (upserted > 0) {
          await triggerBase44Sync();
        }
      }

      sourcesProcessed++;
      await sleep(requestDelayMs);
    }

    log('info', `=== Done: ${totalUpserted} upserted, ${totalErrors} errors, ${sourcesProcessed} sources processed ===`);
  } catch (e: any) {
    log('error', `Fatal: ${e.message}`);
    process.exitCode = 1;
  } finally {
    if (sessionId) await closeSession(sessionId);
  }
}

main();