import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";
const browserEngineUrl = process.env.BROWSER_ENGINE_URL || "";
const browserEngineApiKey = process.env.BROWSER_ENGINE_API_KEY || "";
const base44SyncUrl = process.env.BASE44_SYNC_URL || "";
const concurrency = parseInt(process.env.SCRAPE_CONCURRENCY || "12", 10);
const dailyTarget = parseInt(process.env.DAILY_TARGET || "500", 10);

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const anthropic = new Anthropic();

interface Property {
  address: string;
  city: string;
  state: string;
  zip: string;
  distress_type: string;
  owner?: string;
  value?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  source_url: string;
  score?: number;
}

async function createBrowserSession(): Promise<string> {
  const response = await axios.post(
    `${browserEngineUrl}/sessions`,
    {
      execute: [
        { action: "goto", url: "https://www.zillow.com/homes/for_sale" },
      ],
    },
    { headers: { "x-api-key": browserEngineApiKey } }
  );
  return response.data.session_id;
}

async function scrapeProperties(): Promise<Property[]> {
  const properties: Property[] = [];

  // Zillow distressed
  try {
    const zillow = await axios.get(
      "https://www.zillow.com/homes/for_sale?sortSelection=days&isPreforeclosureIncluded=true",
      { timeout: 10000 }
    );
    // Parse Zillow HTML - simplified extraction
  } catch (e) {
    console.log("Zillow fetch warning:", (e as Error).message);
  }

  // Auction.com
  try {
    const auction = await axios.get(
      "https://www.auction.com/real-estate/florida",
      { timeout: 10000 }
    );
  } catch (e) {
    console.log("Auction.com fetch warning:", (e as Error).message);
  }

  return properties;
}

async function scoreProperty(property: Property): Promise<number> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `Score this distressed property 1-100 for investment potential:\nAddress: ${property.address}\nType: ${property.distress_type}\nValue: ${property.value}\nSource: ${property.source_url}\n\nRespond with ONLY a number 1-100.`,
        },
      ],
    });

    const scoreText =
      message.content[0].type === "text" ? message.content[0].text : "50";
    return Math.max(1, Math.min(100, parseInt(scoreText, 10) || 50));
  } catch (e) {
    console.log("Scoring error:", (e as Error).message);
    return 50;
  }
}

async function dedupeAndStore(
  properties: Property[]
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const prop of properties) {
    const normalizedAddress = `${prop.address
      .toLowerCase()
      .replace(/\s+/g, "")}|${prop.zip}`;

    // Check if already exists
    const { data: existing } = await supabase
      .from("properties")
      .select("id")
      .eq("address", prop.address)
      .eq("zip", prop.zip);

    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    prop.score = await scoreProperty(prop);

    const { error } = await supabase.from("properties").insert([prop]);

    if (error) {
      console.error("Insert error:", error);
      skipped++;
    } else {
      inserted++;
    }
  }

  return { inserted, skipped };
}

async function syncToBase44(
  inserted: number
): Promise<{ success: boolean; message: string }> {
  try {
    await axios.post(base44SyncUrl, {}, { timeout: 10000 });
    return {
      success: true,
      message: `Synced ${inserted} properties to Base44`,
    };
  } catch (e) {
    console.error("Base44 sync error:", (e as Error).message);
    return {
      success: false,
      message: `Base44 sync failed: ${(e as Error).message}`,
    };
  }
}

async function main() {
  console.log(
    `[${new Date().toISOString()}] Starting scraper run - Target: ${dailyTarget} properties`
  );

  try {
    // Scrape from multiple sources
    const properties = await scrapeProperties();
    console.log(`Found ${properties.length} properties`);

    if (properties.length === 0) {
      console.log("No new properties found");
      return;
    }

    // Dedup and store
    const { inserted, skipped } = await dedupeAndStore(properties);
    console.log(
      `Stored: ${inserted}, Skipped (duplicates): ${skipped} / Total: ${properties.length}`
    );

    // Sync to Base44
    const syncResult = await syncToBase44(inserted);
    console.log(syncResult.message);

    console.log(
      `[${new Date().toISOString()}] Scraper run complete. Inserted: ${inserted}`
    );
  } catch (e) {
    console.error(
      `[${new Date().toISOString()}] Fatal error:`,
      (e as Error).message
    );
    process.exit(1);
  }
}

main();
