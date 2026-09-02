# PropertyIntel Scraper — Railway + Supabase

Autonomous distressed-property scraper that runs on **Railway**, writes to **Supabase**, and syncs to your **Base44** app so the existing UI keeps working — all sharing the same data.

## Architecture

```
Railway (scraper)  ──writes──►  Supabase (database)  ──syncs──►  Base44 (UI)
  │                               │
  │ uses cloudbrowser engine       │ source of truth
  │ normalizes + dedupes           │ dedup_key unique index
  │ runs on cron                   │ geohash proximity index
```

**Why this is better:**
- **Fast** — direct HTTP + browser scraping, no LLM-in-the-loop delays
- **Cheap** — Railway compute is a flat monthly rate; no per-scrape credit costs
- **Dedup** — address normalization + geohash proximity built in
- **Shared** — Supabase is the source of truth; Base44 reads from the same data

## Setup (15 minutes)

### 1. Create Supabase project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Once created, go to **SQL Editor** → New query
3. Paste the contents of `schema.sql` and run it
4. Go to **Project Settings → API**:
   - Copy the **Project URL** (e.g. `https://xyz.supabase.co`)
   - Copy the **service_role** secret key (keep this private!)

### 2. Deploy scraper to Railway
1. Push this `railway/` folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Railway auto-detects Node.js and uses `railway.json`
4. Go to **Variables** tab and add:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   BROWSER_ENGINE_URL=https://your-cloudbrowser-engine.com
   BROWSER_ENGINE_API_KEY=your-api-key
   CRON_SCHEDULE=0 6 * * *
   BASE44_SYNC_URL=https://my-property-intel.base44.app/functions/syncFromSupabase
   ```
5. Railway deploys and starts the cron scheduler

### 3. Base44 sync (already built)
The `syncFromSupabase` Base44 function is already in your app. It:
- Queries Supabase for properties updated since last sync
- Upserts them into Base44 `Property` entities
- Updates the `sync_state` table in Supabase

The Railway scraper automatically triggers this after each run (via `BASE44_SYNC_URL`).

You can also trigger it manually:
```
POST https://my-property-intel.base44.app/functions/syncFromSupabase
```

Or set up a Base44 workflow to run it on a schedule.

## How dedup works

1. **Address normalization** — `123 Main St` → `123 main street`
   - Lowercase, strip punctuation, expand abbreviations (St→Street, Ave→Avenue, etc.)
   - Strip unit/apt/suite indicators
2. **Dedup key** — `normalized_address|zip_code` stored in `properties.dedup_key`
   - Unique index in Supabase prevents duplicates
3. **Geohash** — precision 7 (~150m) computed from lat/lng
   - Stored in `properties.geohash` for proximity-based dedup

## Managing sources

Sources are in the `data_sources` table in Supabase. The schema seeds 13 South Florida county sources. To add more:

```sql
INSERT INTO data_sources (name, type, url, state, county, scrape_frequency, scrape_config, status)
VALUES ('New County Foreclosures', 'foreclosure', 'https://...', 'FL', 'New County', 'daily',
        '{"method":"browser","distress_type":"foreclosure","extract_selector":"table"}', 'active');
```

**scrape_config options:**
- `method`: `"browser"` (cloudbrowser engine) or `"http"` (direct fetch + cheerio)
- `distress_type`: `foreclosure`, `tax_delinquent`, `code_violation`, `probate_inherited`, etc.
- `extract_selector`: CSS selector for the data table (browser mode)

## Auto-pause on failure

If a source fails 3 consecutive times, it's auto-paused for 24 hours. The `consecutive_failures` counter resets on success.

## Files

```
railway/
├── schema.sql          ← Run in Supabase SQL Editor
├── package.json
├── railway.json        ← Railway deployment config
├── .env.example
├── src/
│   ├── index.js        ← Cron entry point (Railway runs this)
│   ├── scraper.js      ← Scrape orchestration + dedup + upsert
│   ├── supabase.js     ← Supabase REST client
│   ├── dedup.js        ← Address normalization + geohash
│   └── browser.js      ← Cloudbrowser engine client
└── README.md
```

## Running locally

```bash
cd railway
cp .env.example .env  # Fill in your values
npm install
npm run scrape-once   # Run one scrape cycle
npm start             # Start cron scheduler
``