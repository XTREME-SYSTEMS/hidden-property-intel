#!/bin/bash
set -e

echo "Installing scraper dependencies..."
npm install --save @supabase/supabase-js @anthropic-ai/sdk axios typescript

echo "Building scraper..."
mkdir -p dist
npx tsc --project tsconfig.scraper.json

echo "Scraper build complete!"
ls -lh dist/scraper-cron.js

