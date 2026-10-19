/**
 * Hidden Property Intel — Railway Scraper (Aggressive, FL-only)
 * Scrapes distressed properties across Florida counties via self-hosted
 * CloudBrowser-Control engine. Paginates through result pages, retries
 * failed sources, uses isolated sessions and honors source access policies.
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
import { createHash } from 'crypto';

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
const dailyTarget = parseInt(process.env.DAILY_TARGET || '3000', 10);
const maxPagesPerSource = parseInt(process.env.MAX_PAGES || '8', 10);
const requestDelayMs = parseInt(process.env.REQUEST_DELAY_MS || '2000', 10);
const approvedSourceHosts = new Set((process.env.APPROVED_SOURCE_HOSTS || '').split(',').map(h => h.trim().toLowerCase()).filter(Boolean));
const SITE_KEY = 'hidden-property-intel';
const SOURCE_SYSTEM = 'hpi-scraper';
const ROBOTS_USER_AGENT = 'StrategicMindsAIResearchBot';
const robotsCache = new Map<string, { blocked: boolean; rules: { path: string; allow: boolean }[] }>();
const maxRetries = parseInt(process.env.MAX_RETRIES || '2', 10);

if (!supabaseUrl || !supabaseServiceKey || !browserEngineUrl || !browserEngineApiKey || !base44SyncUrl) {
  log('error', 'Missing required env vars. Exiting.');
  process.exit(1);
}

const runtimeNodeMajor = Number(process.versions.node.split('.')[0] || 0);
if (runtimeNodeMajor < 22) {
  log('error', `Node.js 22+ is required for Supabase Realtime WebSocket support. Detected ${process.versions.node}.`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const CANONICAL_UPI_PROJECT_REF = process.env.UPI_SUPABASE_PROJECT_REF || 'fwtchbsebygwifmmqhur';
const currentProjectRef = getSupabaseProjectRef(supabaseUrl);
const upiUrl = process.env.UPI_SUPABASE_URL || (currentProjectRef === CANONICAL_UPI_PROJECT_REF ? supabaseUrl : '');
const upiKey = process.env.UPI_SUPABASE_SERVICE_KEY || (currentProjectRef === CANONICAL_UPI_PROJECT_REF ? supabaseServiceKey : '');
const upiSupabase = upiUrl && upiKey && getSupabaseProjectRef(upiUrl) === CANONICAL_UPI_PROJECT_REF
  ? createClient(upiUrl, upiKey)
  : null;
let upiMirrorWarningLogged = false;

function getSupabaseProjectRef(value: string): string {
  try {
    return new URL(value).hostname.split('.')[0].toLowerCase();
  } catch {
    return '';
  }
}

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

// --- Sources (Florida-only, deep coverage across counties + distress types) ---
const SCRAPE_SOURCES: ScrapeSource[] = [
  // === FL Aggregators (deep pagination) ===
  { name: 'Zillow Foreclosures - FL', url: 'https://www.zillow.com/homes/fl/foreclosures/', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 10 },
  { name: 'Auction.com - FL', url: 'https://www.auction.com/real-estate/florida/', distress_type: 'auction', state: 'FL', paginated: true, page_param: 'page', max_pages: 8 },
  { name: 'HUD Home Store - FL', url: 'https://www.hudhomestore.com/PropertySearch?state=FL', distress_type: 'bank_owned', state: 'FL', paginated: false, max_pages: 1 },
  { name: 'HomePath Fannie Mae - FL', url: 'https://www.homepath.com/search.html?state=FL', distress_type: 'bank_owned', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'RealtyTrac - FL', url: 'https://www.realtytrac.com/foreclosures/fl/', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 6 },
  { name: 'RealForeclose - FL', url: 'https://www.realforeclose.com/', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },

  // === FL County Clerk Foreclosure Sites (South FL) ===
  { name: 'Miami-Dade Clerk Foreclosures', url: 'https://www.miamidadeclerk.gov/public-records/search/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 8 },
  { name: 'Broward Clerk Foreclosures', url: 'https://www.browardclerk.org/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 8 },
  { name: 'Palm Beach Clerk Foreclosures', url: 'https://www.mypalmbeachclerk.com/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 8 },
  { name: 'Monroe Clerk Foreclosures', url: 'https://www.clerk-of-the-court.monroe.fl.us/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 4 },

  // === FL County Clerk Foreclosure Sites (Central FL) ===
  { name: 'Orange Clerk Foreclosures', url: 'https://www.orangeclerk.org/records/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 6 },
  { name: 'Hillsborough Clerk Foreclosures', url: 'https://www.hillsboroughclerk.org/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 6 },
  { name: 'Pinellas Clerk Foreclosures', url: 'https://www.pinellasclerk.org/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 6 },
  { name: 'Seminole Clerk Foreclosures', url: 'https://www.seminoleclerk.org/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'Osceola Clerk Foreclosures', url: 'https://www.osceolaclerk.org/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'Polk Clerk Foreclosures', url: 'https://www.polkcountyclerk.net/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'Volusia Clerk Foreclosures', url: 'https://www.clerk.org/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'Brevard Clerk Foreclosures', url: 'https://www.brevardclerk.us/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'Lake Clerk Foreclosures', url: 'https://www.lakecountyclerk.org/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'Marion Clerk Foreclosures', url: 'https://www.marioncountyclerk.org/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'Pasco Clerk Foreclosures', url: 'https://www.pascoclerk.com/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'Citrus Clerk Foreclosures', url: 'https://www.citrusclerk.org/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 4 },

  // === FL County Clerk Foreclosure Sites (North FL) ===
  { name: 'Duval Clerk Foreclosures', url: 'https://www.duvalclerk.com/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 6 },
  { name: 'Escambia Clerk Foreclosures', url: 'https://www.escambiaclerk.com/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'St. Johns Clerk Foreclosures', url: 'https://www.stjohnsclerk.com/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'Leon Clerk Foreclosures', url: 'https://www.leoncountyclerk.gov/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 4 },
  { name: 'Alachua Clerk Foreclosures', url: 'https://www.alachuaclerk.org/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 4 },

  // === FL County Clerk Foreclosure Sites (SW FL) ===
  { name: 'Lee Clerk Foreclosures', url: 'https://www.leeclerk.org/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 6 },
  { name: 'Sarasota Clerk Foreclosures', url: 'https://www.sarasotaclerk.org/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'Collier Clerk Foreclosures', url: 'https://www.collierclerk.org/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'Manatee Clerk Foreclosures', url: 'https://www.manateeclerk.org/foreclosures', distress_type: 'foreclosure', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },

  // === FL Tax Deed Sales ===
  { name: 'FL Tax Deed Sales - Miami-Dade', url: 'https://www.miamidade.gov/taxcollector/tax-deed-sales', distress_type: 'tax_delinquent', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'FL Tax Deed Sales - Broward', url: 'https://www.broward.org/treasury/taxdeedsales', distress_type: 'tax_delinquent', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'FL Tax Deed Sales - Hillsborough', url: 'https://www.hillsboroughtaxcollector.com/tax-deed-sales', distress_type: 'tax_delinquent', state: 'FL', paginated: true, page_param: 'page', max_pages: 4 },
  { name: 'FL Tax Deed Sales - Orange', url: 'https://www.orangetaxcollector.com/tax-deed-sales', distress_type: 'tax_delinquent', state: 'FL', paginated: true, page_param: 'page', max_pages: 4 },
  { name: 'FL Tax Deed Sales - Pinellas', url: 'https://www.pinellascounty.org/tax-deed-sales', distress_type: 'tax_delinquent', state: 'FL', paginated: true, page_param: 'page', max_pages: 4 },

  // === FL Probate / Inherited ===
  { name: 'FL Probate - Miami-Dade', url: 'https://www.miamidadeclerk.gov/public-records/search/probate', distress_type: 'probate_inherited', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'FL Probate - Broward', url: 'https://www.browardclerk.org/probate', distress_type: 'probate_inherited', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'FL Probate - Palm Beach', url: 'https://www.mypalmbeachclerk.com/probate', distress_type: 'probate_inherited', state: 'FL', paginated: true, page_param: 'page', max_pages: 5 },
  { name: 'FL Probate - Hillsborough', url: 'https://www.hillsboroughclerk.org/probate', distress_type: 'probate_inherited', state: 'FL', paginated: true, page_param: 'page', max_pages: 4 },
  { name: 'FL Probate - Orange', url: 'https://www.orangeclerk.org/records/probate', distress_type: 'probate_inherited', state: 'FL', paginated: true, page_param: 'page', max_pages: 4 },
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

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function isAccessPolicyFailure(message: string): boolean {
  return /\b(401|403|407|429)\b|captcha|access denied|forbidden|rate limit|too many requests|robot check|blocked by robots|challenge page/i.test(message);
}

function isApprovedSource(source: ScrapeSource): boolean {
  try {
    const host = new URL(source.url).hostname.toLowerCase();
    // Public government domains are the conservative default. Other providers
    // require an explicit host allowlist after terms/access review.
    return host.endsWith('.gov') || approvedSourceHosts.has(host);
  } catch {
    return false;
  }
}

function parseRobots(text: string): { blocked: boolean; rules: { path: string; allow: boolean }[] } {
  const groups: { agents: string[]; rules: { path: string; allow: boolean }[] }[] = [];
  let agents: string[] = [];
  let rules: { path: string; allow: boolean }[] = [];
  let sawRule = false;
  const flush = () => {
    if (agents.length) groups.push({ agents, rules });
    agents = [];
    rules = [];
    sawRule = false;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split('#')[0].trim();
    if (!line) continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === 'user-agent') {
      if (sawRule) flush();
      agents.push(value.toLowerCase());
    } else if ((key === 'allow' || key === 'disallow') && agents.length && value) {
      rules.push({ path: value, allow: key === 'allow' });
      sawRule = true;
    }
  }
  flush();

  const relevant = groups.filter(group => group.agents.includes('*') || group.agents.includes(ROBOTS_USER_AGENT.toLowerCase()));
  return { blocked: false, rules: relevant.flatMap(group => group.rules) };
}

async function isAllowedByRobots(targetUrl: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(targetUrl);
    if (url.protocol !== 'https:') return false;
  } catch {
    return false;
  }

  let policy = robotsCache.get(url.origin);
  if (!policy) {
    try {
      const response = await axios.get(`${url.origin}/robots.txt`, {
        timeout: 10000,
        maxRedirects: 0,
        validateStatus: () => true,
        headers: { 'User-Agent': `${ROBOTS_USER_AGENT}/1.0` },
      });
      if (response.status === 404) {
        policy = { blocked: false, rules: [] };
      } else if (response.status < 200 || response.status >= 300) {
        // Fail closed on redirects, authorization failures, throttling, and server errors.
        policy = { blocked: true, rules: [] };
      } else {
        policy = parseRobots(String(response.data || ''));
      }
    } catch {
      policy = { blocked: true, rules: [] };
    }
    robotsCache.set(url.origin, policy);
  }

  if (policy.blocked) return false;
  const requestPath = url.pathname + url.search;
  const matches = policy.rules
    .filter(rule => requestPath.startsWith(rule.path.split('*')[0].replace(/\$/, '')))
    .sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
  return matches.length === 0 || matches[0].allow;
}

function normalizeSourceUrl(candidate: string | undefined, pageUrl: string): string {
  try {
    const page = new URL(pageUrl);
    if (!candidate) return page.toString();
    const target = new URL(candidate, pageUrl);
    // Do not attribute an extracted off-domain link as evidence for the page visited.
    if (target.protocol !== 'https:' || target.hostname.toLowerCase() !== page.hostname.toLowerCase()) {
      return page.toString();
    }
    return target.toString();
  } catch {
    return pageUrl;
  }
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
      source_url: normalizeSourceUrl(p.source_url, url),
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
        const message = String(e?.message || e || '');
        if (isAccessPolicyFailure(message)) {
          log('warn', `  [${source.name}] access restriction or rate limit detected; stopping retries without bypass.`);
          break;
        }
        log('warn', `  [${source.name}] page ${page} attempt ${attempt} failed: ${message.slice(0, 300)}`);
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

  const rows = props.map(p => {
    const capturedAt = new Date().toISOString();
    const sourceUrl = p.source_url || null;
    const extractedRecordHash = sha256(JSON.stringify(p));
    const rawData = {
      ...p,
      _source_capture: {
        source_url: sourceUrl,
        captured_at: capturedAt,
        capture_method: 'cloudbrowser_extract_table',
        extracted_record_sha256: extractedRecordHash,
        verification_level: 'source_observed_not_legal_ownership',
      },
    };
    return {
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
      source_url: sourceUrl,
      scraped_at: capturedAt,
      last_verified_at: capturedAt,
      raw_data: rawData,
      images: [],
    };
  });

  // Batch upsert — the existing dedup_key remains the canonical property identity.
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { data: storedRows, error } = await supabase
      .from('properties')
      .upsert(batch, { onConflict: 'dedup_key' })
      .select('id,dedup_key,source_url,created_date,updated_date,updated_at,address,normalized_address,city,state,zip_code,distress_type,estimated_value,source,source_name,scraped_at,last_verified_at,raw_data');

    if (error) {
      log('warn', `Property upsert batch ${i} failed: ${error.message}`);
      errors += batch.length;
      continue;
    }

    const saved = Array.isArray(storedRows) ? storedRows : [];
    upserted += saved.length;
    if (saved.length > 0) {
      try {
        await mirrorUniversalProperties(saved);
      } catch (e: any) {
        // Keep the canonical property upsert; retry the idempotent mirror on the next run.
        log('error', `Universal property evidence mirror failed: ${String(e?.message || 'unknown error').slice(0, 300)}`);
        errors += saved.length;
      }
    }
  }

  return { upserted, errors };
}

async function mirrorUniversalProperties(rows: any[]): Promise<void> {
  if (!rows.length) return;
  if (!upiSupabase) {
    if (!upiMirrorWarningLogged) {
      log('warn', 'UPI mirror disabled: configure UPI_SUPABASE_URL and UPI_SUPABASE_SERVICE_KEY, or point SUPABASE_URL at the canonical UPI project. No cross-project writes were attempted.');
      upiMirrorWarningLogged = true;
    }
    return;
  }

  const capturedAt = new Date().toISOString();
  const candidates = rows.map(row => ({
    id: row.id,
    dedup_key: row.dedup_key,
    address: row.address,
    normalized_address: row.normalized_address,
    city: row.city,
    state: row.state,
    zip_code: row.zip_code,
    distress_type: row.distress_type,
    estimated_value: row.estimated_value,
    source_name: row.source_name,
    source_url: row.source_url,
    scraped_at: row.scraped_at,
    last_verified_at: row.last_verified_at,
    raw_data: row.raw_data,
  }));
  const dedupKeys = [...new Set(candidates.map(row => row.dedup_key).filter(Boolean))];
  if (!dedupKeys.length) return;

  // Never overwrite an existing canonical property's user edits or Base44 IDs.
  const { data: existingCanonical, error: existingError } = await upiSupabase
    .from('properties')
    .select('id,dedup_key')
    .in('dedup_key', dedupKeys);
  if (existingError) throw new Error(`canonical property lookup failed: ${existingError.message}`);

  const existingKeys = new Set((existingCanonical || []).map((row: any) => String(row.dedup_key)));
  const missingCanonical = candidates
    .filter(row => !existingKeys.has(String(row.dedup_key)))
    .map(row => ({
      address: row.address,
      normalized_address: row.normalized_address,
      dedup_key: row.dedup_key,
      city: row.city,
      state: row.state,
      zip_code: row.zip_code,
      property_type: 'residential',
      distress_type: row.distress_type,
      estimated_value: row.estimated_value,
      status: 'active',
      source: SOURCE_SYSTEM,
      source_name: row.source_name,
      source_url: row.source_url,
      scraped_at: row.scraped_at,
      last_verified_at: row.last_verified_at,
      raw_data: row.raw_data,
      images: [],
    }));

  if (missingCanonical.length) {
    const { error: insertError } = await upiSupabase
      .from('properties')
      .upsert(missingCanonical, { onConflict: 'dedup_key', ignoreDuplicates: true });
    if (insertError) throw new Error(`canonical property insert failed: ${insertError.message}`);
  }

  const { data: canonicalRows, error: canonicalError } = await upiSupabase
    .from('properties')
    .select('id,dedup_key')
    .in('dedup_key', dedupKeys);
  if (canonicalError) throw new Error(`canonical property resolution failed: ${canonicalError.message}`);
  const canonicalByKey = new Map((canonicalRows || []).map((row: any) => [String(row.dedup_key), String(row.id)]));
  if (dedupKeys.some(key => !canonicalByKey.has(String(key)))) {
    throw new Error('One or more property observations could not be mapped to a canonical UPI property ID.');
  }

  const observations = candidates.map(row => {
    const canonicalPropertyId = canonicalByKey.get(String(row.dedup_key))!;
    const sourceId = sha256(`${SOURCE_SYSTEM}|${row.source_url || ''}|${row.dedup_key || ''}`);
    const record = {
      property_id: canonicalPropertyId,
      address: row.address,
      normalized_address: row.normalized_address,
      city: row.city,
      state: row.state,
      zip_code: row.zip_code,
      distress_type: row.distress_type,
      estimated_value: row.estimated_value,
      source_url: row.source_url,
      source_name: row.source_name,
      observed_at: row.scraped_at,
      source_capture: row.raw_data?._source_capture || null,
      raw_data: row.raw_data,
      verification_level: 'source_observed_not_legal_ownership',
    };
    return {
      source_system: SOURCE_SYSTEM,
      entity_type: 'PropertyObservation',
      source_id: sourceId,
      site_key: SITE_KEY,
      record,
      record_hash: sha256(JSON.stringify(record)),
      source_created_at: row.scraped_at || capturedAt,
      source_updated_at: capturedAt,
      migrated_at: capturedAt,
      property_id: canonicalPropertyId,
      dedup_key: row.dedup_key || '',
    };
  });

  const sourceRecords = observations.map(({ property_id, dedup_key, ...record }) => record);
  const { error: sourceError } = await upiSupabase
    .from('universal_source_records')
    .upsert(sourceRecords, { onConflict: 'source_system,entity_type,source_id' });
  if (sourceError) throw new Error(`source-record upsert failed: ${sourceError.message}`);

  const sourceLinks = observations.map(row => ({
    source_system: SOURCE_SYSTEM,
    entity_type: 'PropertyObservation',
    source_id: row.source_id,
    property_id: row.property_id,
    dedup_key: row.dedup_key,
    is_canonical: false,
    linked_at: capturedAt,
  }));
  const { error: linkError } = await upiSupabase
    .from('universal_property_source_links')
    .upsert(sourceLinks, { onConflict: 'source_system,entity_type,source_id' });
  if (linkError) throw new Error(`source-link upsert failed: ${linkError.message}`);

  const canonicalIds = [...new Set(observations.map(row => row.property_id))];
  const { data: existingSiteLinks, error: siteReadError } = await upiSupabase
    .from('universal_site_properties')
    .select('property_id')
    .eq('site_key', SITE_KEY)
    .in('property_id', canonicalIds);
  if (siteReadError) throw new Error(`site-link lookup failed: ${siteReadError.message}`);

  const existingIds = new Set((existingSiteLinks || []).map((row: any) => String(row.property_id)));
  const missingSiteLinks = canonicalIds
    .filter(id => !existingIds.has(String(id)))
    .map(id => ({
      site_key: SITE_KEY,
      property_id: id,
      listing_status: 'visible',
      display_overrides: {},
    }));
  if (missingSiteLinks.length) {
    const { error: siteWriteError } = await upiSupabase
      .from('universal_site_properties')
      .upsert(missingSiteLinks, { onConflict: 'site_key,property_id', ignoreDuplicates: true });
    if (siteWriteError) throw new Error(`site-link upsert failed: ${siteWriteError.message}`);
  }

  const { data: existingCatalog, error: catalogReadError } = await upiSupabase
    .from('universal_entity_catalog')
    .select('first_source_created_at')
    .eq('source_system', SOURCE_SYSTEM)
    .eq('entity_type', 'PropertyObservation')
    .eq('site_key', SITE_KEY)
    .maybeSingle();
  if (catalogReadError) throw new Error(`entity-catalog lookup failed: ${catalogReadError.message}`);

  const { count, error: countError } = await upiSupabase
    .from('universal_source_records')
    .select('source_id', { count: 'exact', head: true })
    .eq('source_system', SOURCE_SYSTEM)
    .eq('entity_type', 'PropertyObservation')
    .eq('site_key', SITE_KEY);
  if (countError) throw new Error(`source-record count failed: ${countError.message}`);

  const { error: catalogError } = await upiSupabase
    .from('universal_entity_catalog')
    .upsert({
      source_system: SOURCE_SYSTEM,
      entity_type: 'PropertyObservation',
      site_key: SITE_KEY,
      record_count: count || 0,
      first_source_created_at: existingCatalog?.first_source_created_at || capturedAt,
      latest_source_updated_at: capturedAt,
      last_migrated_at: capturedAt,
    }, { onConflict: 'source_system,entity_type,site_key' });
  if (catalogError) throw new Error(`entity-catalog upsert failed: ${catalogError.message}`);
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
  const approvedSources = SCRAPE_SOURCES.filter(isApprovedSource);
  const blockedByAllowlist = SCRAPE_SOURCES.length - approvedSources.length;
  log('info', `=== Source-observation cycle starting (target: ${dailyTarget}, configured sources: ${SCRAPE_SOURCES.length}, approved hosts: ${approvedSources.length}) ===`);
  if (approvedSources.length === 0) {
    log('warn', 'No sources are approved. Set APPROVED_SOURCE_HOSTS for reviewed non-.gov providers; no pages were visited.');
    return;
  }

  let totalUpserted = 0;
  let totalErrors = 0;
  let sourcesProcessed = 0;
  let sourcesSkipped = blockedByAllowlist;

  for (const source of SCRAPE_SOURCES) {
    if (totalUpserted >= dailyTarget) {
      log('info', `Daily target ${dailyTarget} reached, stopping.`);
      break;
    }
    if (!isApprovedSource(source)) {
      log('warn', `Skipping unapproved source host for ${source.name}`);
      continue;
    }
    if (!(await isAllowedByRobots(source.url))) {
      log('warn', `Skipping source blocked by robots/access policy: ${source.name}`);
      sourcesSkipped++;
      continue;
    }

    let sourceSessionId: string | null = null;
    try {
      // Use a fresh isolated session per source; never rotate sessions to evade detection.
      sourceSessionId = await createSession();
      log('info', `Researching approved source ${source.name} in an isolated session.`);
      const { props, pages } = await scrapeSourceWithRetries(sourceSessionId, source);
      log('info', `${source.name}: ${props.length} source observations from ${pages} pages`);

      if (props.length > 0) {
        const { upserted, errors } = await storeProperties(props, source.name);
        totalUpserted += upserted;
        totalErrors += errors;
        log('info', `Upserted ${upserted} property observations (errors: ${errors}) — running total: ${totalUpserted}`);

        // Sync through the existing Base44 bridge after each source so the UI remains incremental.
        if (upserted > 0) await triggerBase44Sync();
      }
      sourcesProcessed++;
    } catch (e: any) {
      totalErrors++;
      log('warn', `Source failed without bypass or evasion: ${source.name}; ${String(e?.message || 'unknown error').slice(0, 300)}`);
    } finally {
      if (sourceSessionId) await closeSession(sourceSessionId);
    }

    await sleep(requestDelayMs);
  }

  log('info', `=== Cycle complete: ${totalUpserted} upserted, ${totalErrors} errors, ${sourcesProcessed} sources processed, ${sourcesSkipped} sources skipped ===`);
}

main();