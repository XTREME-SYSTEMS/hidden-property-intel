// Main scrape orchestration — runs the pipeline for all due sources.
// Called by index.js on a cron, or directly via `npm run scrape-once`.

import * as cheerio from "cheerio";
import { select, insert, update } from "./supabase.js";
import { scrapeUrl, extractPageText, extractLinks } from "./browser.js";
import { normalizeAddress, dedupKey, encodeGeohash, extractAddresses, extractCityStateZip } from "./dedup.js";

const MAX_SOURCES = parseInt(process.env.MAX_SOURCES_PER_RUN || "0", 10);

// Get sources that are due for scraping (active, not paused, due by frequency)
async function getDueSources() {
  const now = new Date();
  const sources = await select("data_sources", {
    select: "*",
    filter: { column: "status", value: "active" },
    limit: 200,
  });

  return sources.filter((s) => {
    // Skip if paused
    if (s.paused_until && new Date(s.paused_until) > now) return false;
    // Check frequency
    if (!s.last_run_at) return true;
    const last = new Date(s.last_run_at);
    const hoursSince = (now - last) / 3600000;
    if (s.scrape_frequency === "daily") return hoursSince >= 20;
    if (s.scrape_frequency === "weekly") return hoursSince >= 144;
    if (s.scrape_frequency === "monthly") return hoursSince >= 600;
    return hoursSince >= 20;
  });
}

// Scrape a single source and upsert properties
async function scrapeSource(source) {
  console.log(`[scraper] ${source.name} — ${source.url}`);
  const job = await insert("scrape_jobs", {
    source_id: source.id,
    source_name: source.name,
    status: "running",
    started_at: new Date().toISOString(),
    scrape_config: source.scrape_config || {},
  }, { returnRepresentation: true });

  const jobRow = Array.isArray(job) ? job[0] : job;
  const jobId = jobRow?.id;

  try {
    const config = source.scrape_config || {};
    const method = config.method || "browser";
    let rawText = "";

    if (method === "browser") {
      // Use cloudbrowser engine
      if (config.extract_selector) {
        const tableData = await scrapeUrl(source.url, { selector: config.extract_selector });
        rawText = typeof tableData === "string" ? tableData : JSON.stringify(tableData);
      } else {
        rawText = await extractPageText(source.url);
      }
    } else {
      // Direct HTTP
      const res = await fetch(source.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PropertyIntelBot/1.0)" },
      });
      const html = await res.text();
      const $ = cheerio.load(html);
      rawText = $("body").text();
    }

    // Parse addresses from extracted text
    const addresses = extractAddresses(rawText);
    const cityStateZips = extractCityStateZip(rawText);

    if (addresses.length === 0) {
      console.log(`[scraper] ${source.name} — no addresses found in page`);
      await update("scrape_jobs", { id: `eq.${jobId}` }, {
        status: "complete",
        properties_found: 0,
        properties_new: 0,
        completed_at: new Date().toISOString(),
      });
      await update("data_sources", { id: `eq.${source.id}` }, {
        last_run_at: new Date().toISOString(),
        consecutive_failures: 0,
      });
      return { found: 0, new: 0 };
    }

    // Build property records
    const properties = addresses.map((addr, i) => {
      const loc = cityStateZips[i] || cityStateZips[0] || {};
      const na = normalizeAddress(addr);
      const zip = loc.zip || "";
      return {
        address: addr,
        normalized_address: na,
        dedup_key: dedupKey(addr, zip),
        city: loc.city || source.county || "",
        state: loc.state || source.state || "FL",
        zip_code: zip,
        distress_type: config.distress_type || source.type,
        source: "scraped",
        source_url: source.url,
        source_id: source.id,
        source_name: source.name,
        scraped_at: new Date().toISOString(),
        status: "active",
        raw_data: { address_text: addr },
      };
    });

    // Dedup: query existing properties by dedup_key
    const dedupKeys = properties.map((p) => p.dedup_key).filter(Boolean);
    let existing = [];
    if (dedupKeys.length > 0) {
      // PostgREST `in` filter
      const inFilter = `(${dedupKeys.map((k) => `"${k}"`).join(",")})`;
      existing = await select("properties", {
        select: "id,dedup_key,updated_at",
        filter: { column: "dedup_key", op: "in", value: inFilter },
        limit: 500,
      });
    }
    const existingMap = new Map(existing.map((p) => [p.dedup_key, p]));

    // Separate new vs existing
    const newProps = [];
    const updateProps = [];
    for (const p of properties) {
      if (p.dedup_key && existingMap.has(p.dedup_key)) {
        updateProps.push({ id: existingMap.get(p.dedup_key).id, ...p });
      } else {
        newProps.push(p);
      }
    }

    // Insert new properties
    let inserted = [];
    if (newProps.length > 0) {
      inserted = await insert("properties", newProps, { returnRepresentation: true });
    }

    // Update existing properties (re-verify)
    for (const p of updateProps) {
      await update("properties", { id: `eq.${p.id}` }, {
        last_verified_at: new Date().toISOString(),
        status: "active",
      });
    }

    const foundCount = properties.length;
    const newCount = newProps.length;

    // Update scrape job
    await update("scrape_jobs", { id: `eq.${jobId}` }, {
      status: "complete",
      properties_found: foundCount,
      properties_new: newCount,
      properties_updated: updateProps.length,
      completed_at: new Date().toISOString(),
    });

    // Update source
    await update("data_sources", { id: `eq.${source.id}` }, {
      last_run_at: new Date().toISOString(),
      properties_yielded: (source.properties_yielded || 0) + newCount,
      consecutive_failures: 0,
      last_error: null,
    });

    console.log(`[scraper] ${source.name} — found ${foundCount}, new ${newCount}, updated ${updateProps.length}`);
    return { found: foundCount, new: newCount, updated: updateProps.length };
  } catch (err) {
    console.error(`[scraper] ${source.name} FAILED: ${err.message}`);
    const failures = (source.consecutive_failures || 0) + 1;
    const shouldPause = failures >= 3;
    await update("scrape_jobs", { id: `eq.${jobId}` }, {
      status: "failed",
      error: err.message,
      completed_at: new Date().toISOString(),
    });
    await update("data_sources", { id: `eq.${source.id}` }, {
      last_run_at: new Date().toISOString(),
      consecutive_failures: failures,
      last_error: err.message,
      ...(shouldPause ? { status: "paused", paused_until: new Date(Date.now() + 86400000).toISOString() } : {}),
    });
    return { found: 0, new: 0, error: err.message };
  }
}

// Run the full pipeline
export async function runPipeline() {
  console.log(`[pipeline] Starting scrape at ${new Date().toISOString()}`);
  const sources = await getDueSources();
  console.log(`[pipeline] ${sources.length} sources due`);

  if (MAX_SOURCES > 0) sources.slice(0, MAX_SOURCES);

  let totalFound = 0, totalNew = 0, totalErrors = 0;
  for (const source of sources) {
    try {
      const r = await scrapeSource(source);
      totalFound += r.found || 0;
      totalNew += r.new || 0;
      if (r.error) totalErrors++;
    } catch (err) {
      console.error(`[pipeline] Source ${source.name} crashed: ${err.message}`);
      totalErrors++;
    }
    // Delay between sources to be polite
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`[pipeline] Done — found ${totalFound}, new ${totalNew}, errors ${totalErrors}`);

  // Optionally trigger Base44 sync
  if (process.env.BASE44_SYNC_URL && totalNew > 0) {
    try {
      const syncRes = await fetch(process.env.BASE44_SYNC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.BASE44_SYNC_TOKEN ? { Authorization: `Bearer ${process.env.BASE44_SYNC_TOKEN}` } : {}),
        },
        body: JSON.stringify({ trigger: "post-scrape" }),
      });
      console.log(`[pipeline] Base44 sync triggered: ${syncRes.status}`);
    } catch (e) {
      console.error(`[pipeline] Base44 sync failed: ${e.message}`);
    }
  }

  return { sources: sources.length, found: totalFound, new: totalNew, errors: totalErrors };
}

// Direct CLI invocation
if (process.argv.includes("--once")) {
  runPipeline().then((r) => {
    console.log(JSON.stringify(r));
    process.exit(0);
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}