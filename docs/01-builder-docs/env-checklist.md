# HPI Vercel-native environment checklist

## Browser-safe
- VITE_SUPABASE_URL=https://fwtchbsebygwifmmqhur.supabase.co
- VITE_SUPABASE_PUBLISHABLE_KEY=Supabase publishable key

The frontend contains safe fallbacks for these public values so preview auth code can build before Vercel env wiring.

## Protected server values
- CRON_SECRET or VERCEL_CRON_SECRET
- HPI_SUPABASE_URL
- HPI_SUPABASE_SERVICE_ROLE_KEY or approved bridge credential
- BASE44_SYNC_TOKEN while Base44 sync remains in service
- RAILWAY_SCRAPER_URL
- RAILWAY_TOKEN when required
- GOOGLE_WORKSPACE_CLIENT_ID
- GOOGLE_WORKSPACE_CLIENT_SECRET
- GOOGLE_WORKSPACE_REDIRECT_URI
- GOOGLE_WORKSPACE_STATE_SECRET

Never expose protected values through VITE_ variables.
