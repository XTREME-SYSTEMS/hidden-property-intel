# Property Intel Orchestrator (Vercel Cron)

Standalone Vercel project that owns the scheduling layer for Hidden Property Intel.
Moves all cron orchestration off Base44 onto your own Vercel infrastructure.

## What it does

| Endpoint | Schedule | Purpose |
|---|---|---|
| `/api/trigger-scrape` | Every 6 hours | Triggers the Railway-hosted scraper to harvest distressed properties |
| `/api/mirror-to-supabase` | Every 30 min | Mirrors Base44 data (properties, scores, owners, leads, deals) into your Supabase |
| `/api/health` | On demand | Health check |

## Architecture

```
Vercel Cron ──> Railway Scraper ──> Base44 (syncFromRailway)
                                         │
Vercel Cron ──> Base44 (syncToSupabase) ──> Supabase (your data warehouse)
```

- **Scraping + AI scoring** runs on Railway (heavy compute, Groq LLM)
- **Scheduling** runs on Vercel (cron jobs)
- **Data storage** lives in Base44 (app database) + Supabase (your owned mirror)
- **Frontend** stays on Base44 (the published app)

## Deploy

1. Create a new Vercel project from this directory:
   ```bash
   npm i -g vercel
   vercel
   ```

2. Set these environment variables in Vercel (Project Settings → Environment Variables):
   ```
   RAILWAY_SCRAPER_URL  =  https://your-railway-app.up.railway.app/trigger
   RAILWAY_TOKEN        =  <your Railway token>
   BASE44_SYNC_TOKEN    =  <the BASE44_SYNC_TOKEN from Base44 Secrets>
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

4. Vercel automatically creates the cron jobs from `vercel.json`.

## Run the Supabase migration first

Before the mirror works, run this SQL in your Supabase SQL Editor:
```
base44/shared/supabaseDDL_migration_2.sql
```
This adds the `base44_id` columns, `property_scores` table, and `sync_state` table
needed for the incremental mirror.

## Verify

After deploy, test each endpoint:
```
curl https://your-project.vercel.app/api/health
curl -X POST https://your-project.vercel.app/api/mirror-to-supabase
curl -X POST https://your-project.vercel.app/api/trigger-scrape
```

Then check Supabase → Table Editor → `properties` to see mirrored data.