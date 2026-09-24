const BASE44_FUNCTION_URL = 'https://my-property-intel.base44.app/functions/syncToSupabase';
const BASE44_SNAPSHOT_URL = 'https://my-property-intel.base44.app/functions/convergenceSnapshot';

function safeError(error) {
  return error instanceof Error ? error.message : String(error);
}

export async function triggerScrape({ env = process.env, fetchImpl = fetch } = {}) {
  const scraperUrl = env.RAILWAY_SCRAPER_URL;
  const railwayToken = env.RAILWAY_TOKEN;
  if (!scraperUrl) return { ok: false, status: 'BLOCKED', error: 'RAILWAY_SCRAPER_URL env var not set' };
  try {
    const response = await fetchImpl(scraperUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${railwayToken || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trigger: 'scrape', source: 'vercel-reconcile' }),
    });
    const data = await response.json().catch(() => ({}));
    return {
      ok: response.ok,
      status: response.ok ? 'PASS' : 'FAIL',
      http_status: response.status,
      summary: data?.status || data?.message || null,
    };
  } catch (error) {
    return { ok: false, status: 'FAIL', error: safeError(error) };
  }
}

export async function mirrorToSupabase({ env = process.env, fetchImpl = fetch } = {}) {
  const syncToken = env.BASE44_SYNC_TOKEN;
  const url = env.BASE44_SYNC_URL || BASE44_FUNCTION_URL;
  if (!syncToken) return { ok: false, status: 'BLOCKED', error: 'BASE44_SYNC_TOKEN env var not set' };
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${syncToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trigger: 'reconcile' }),
    });
    const data = await response.json().catch(() => ({}));
    return {
      ok: response.ok && (!Array.isArray(data?.errors) || data.errors.length === 0),
      status: response.ok && (!Array.isArray(data?.errors) || data.errors.length === 0) ? 'PASS' : 'FAIL',
      http_status: response.status,
      synced: data?.synced || null,
      errors: Array.isArray(data?.errors) ? data.errors.slice(0, 10) : undefined,
    };
  } catch (error) {
    return { ok: false, status: 'FAIL', error: safeError(error) };
  }
}

export async function fetchConvergenceSnapshot({ env = process.env, fetchImpl = fetch } = {}) {
  const syncToken = env.BASE44_SYNC_TOKEN;
  const url = env.HPI_CONVERGENCE_SNAPSHOT_URL || BASE44_SNAPSHOT_URL;
  if (!syncToken) return { ok: false, status: 'BLOCKED', error: 'BASE44_SYNC_TOKEN env var not set' };
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${syncToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trigger: 'convergence-snapshot' }),
    });
    const data = await response.json().catch(() => ({}));
    return {
      ok: response.ok,
      status: response.ok ? 'PASS' : 'FAIL',
      http_status: response.status,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data?.error || `HTTP ${response.status}`,
    };
  } catch (error) {
    return { ok: false, status: 'FAIL', error: safeError(error) };
  }
}
