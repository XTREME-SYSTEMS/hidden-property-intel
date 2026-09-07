/**
 * Cron: triggers the Railway-hosted scraper every 6 hours.
 * Railway scraper runs the heavy scraping (Playwright + Groq AI scoring)
 * and pushes results into Base44 via the syncFromRailway endpoint.
 *
 * Env vars:
 *   RAILWAY_SCRAPER_URL — the Railway scraper trigger endpoint
 *   RAILWAY_TOKEN       — bearer token for Railway
 */
export default async function handler(req, res) {
  const scraperUrl = process.env.RAILWAY_SCRAPER_URL;
  const railwayToken = process.env.RAILWAY_TOKEN;

  if (!scraperUrl) {
    return res.status(500).json({ error: 'RAILWAY_SCRAPER_URL env var not set' });
  }

  try {
    const result = await fetch(scraperUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${railwayToken || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trigger: 'scrape', source: 'vercel-cron' }),
    });

    const data = await result.json().catch(() => ({}));
    return res.status(200).json({
      triggered: true,
      railway_status: result.status,
      railway_response: data,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('trigger-scrape error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}