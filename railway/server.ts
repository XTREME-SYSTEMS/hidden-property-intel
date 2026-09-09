/**
 * Hidden Property Intel — Scraper HTTP Server
 *
 * Persistent wrapper around the scrape job. Exposes:
 *   POST /trigger  → run a scrape now (202 if already running)
 *   GET  /health   → liveness probe
 *   GET  /status   → last/next run info
 *
 * Also self-schedules a daily run at 06:00 UTC as a fallback for the
 * Vercel orchestrator's /api/trigger-scrape cron (every 6h).
 */

import http from 'http';
import { main as runScrape } from './scraper-cron';

const PORT = parseInt(process.env.PORT || '8080', 10);
const DAILY_UTC_HOUR = parseInt(process.env.DAILY_SCRAPE_HOUR || '6', 10);

let running = false;
let lastRunAt: string | null = null;
let lastRunResult: string | null = null;

async function startScrape(): Promise<void> {
  running = true;
  try {
    await runScrape();
    lastRunResult = 'ok';
  } catch (e: any) {
    lastRunResult = `error: ${e?.message || e}`;
  } finally {
    running = false;
    lastRunAt = new Date().toISOString();
  }
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => resolve(data));
    req.on('error', () => resolve(data));
  });
}

const server = http.createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0];

  if (url === '/health' || url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'hidden-property-intel-scraper', running, lastRunAt }));
    return;
  }

  if (url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ running, lastRunAt, lastRunResult, nextScheduledRunUTC: `${String(DAILY_UTC_HOUR).padStart(2, '0')}:00` }));
    return;
  }

  if (url === '/trigger' && (req.method === 'POST' || req.method === 'GET')) {
    await readBody(req);
    if (running) {
      res.writeHead(202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ triggered: false, reason: 'scrape already running', lastRunAt }));
      return;
    }
    // Fire and forget — Railway has no timeout; respond immediately.
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ triggered: true, startedAt: new Date().toISOString() }));
    startScrape().catch((e) => console.error('[server] scrape failed:', e?.message || e));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

// --- Daily fallback schedule (06:00 UTC) ---
let lastScheduledDay = -1;
setInterval(() => {
  const now = new Date();
  if (now.getUTCHours() === DAILY_UTC_HOUR && now.getUTCDate() !== lastScheduledDay && !running) {
    lastScheduledDay = now.getUTCDate();
    console.log(`[server] daily scheduled scrape starting (${DAILY_UTC_HOUR}:00 UTC)`);
    startScrape().catch((e) => console.error('[server] scheduled scrape failed:', e?.message || e));
  }
}, 60_000);

server.listen(PORT, () => {
  console.log(`[server] hidden-property-intel-scraper listening on :${PORT} (daily fallback @ ${DAILY_UTC_HOUR}:00 UTC)`);
});
