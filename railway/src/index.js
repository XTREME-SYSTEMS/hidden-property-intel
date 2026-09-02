// Entry point — runs the scraper on a cron schedule.
// Railway deploys this as a long-running service.

import cron from "node-cron";
import { runPipeline } from "./scraper.js";

const SCHEDULE = process.env.CRON_SCHEDULE || "0 6 * * *"; // Daily at 6 AM UTC by default

console.log(`[index] PropertyIntel scraper starting — schedule: ${SCHEDULE}`);

// Run immediately on startup if requested
if (process.env.SCRAPE_ON_STARTUP === "true") {
  console.log("[index] Running initial scrape...");
  runPipeline().catch((e) => console.error("[index] Initial scrape failed:", e.message));
}

// Schedule recurring scrapes
cron.schedule(SCHEDULE, () => {
  console.log(`[index] Cron triggered at ${new Date().toISOString()}`);
  runPipeline().catch((e) => console.error("[index] Pipeline failed:", e.message));
});

// Keep the process alive
console.log("[index] Listening for cron triggers. Press Ctrl+C to stop.");