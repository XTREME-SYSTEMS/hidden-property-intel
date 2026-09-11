/**
 * Self-hosted cloudbrowser engine client — replaces Browserbase.
 *
 * The owner's browser-engine (Node.js + Playwright) exposes an authenticated
 * HTTP API: POST /sessions, POST /sessions/:id/execute, DELETE /sessions/:id.
 * Auth: x-api-key header. Requires BROWSER_ENGINE_URL + BROWSER_ENGINE_API_KEY secrets.
 *
 * `fetchRenderedHtml` is the drop-in replacement for Browserbase's /v1/fetch:
 * it spins up a headless Chromium session, navigates to the URL, and returns
 * the fully rendered document HTML.
 */

type FetchRenderedHtmlOpts = { timeout?: number };

export async function fetchRenderedHtml(url: string, opts: FetchRenderedHtmlOpts = {}): Promise<{ html: string; title: string; url: string }> {
  const runtime: any = await import('base44:runtime');
  const engineUrl = (runtime.secrets.get('BROWSER_ENGINE_URL') || '').replace(/\/$/, '');
  const apiKey = runtime.secrets.get('BROWSER_ENGINE_API_KEY');
  if (!engineUrl || !apiKey) {
    throw new Error('Cloudbrowser engine not configured — set BROWSER_ENGINE_URL and BROWSER_ENGINE_API_KEY');
  }
  const headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey };

  // 1. Create a browser session
  const sessRes = await fetch(`${engineUrl}/sessions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      viewport: { width: 1280, height: 800 },
      locale: 'en-US',
      timezone: 'America/New_York',
    }),
  });
  const sess = await sessRes.json().catch(() => ({}));
  if (!sessRes.ok || !(sess.sessionId || sess.id)) {
    throw new Error(sess.error?.message || sess.error || 'Failed to create cloudbrowser session');
  }
  const sessionId = sess.sessionId || sess.id;

  try {
    // 2. Navigate to the target URL
    const gotoRes = await fetch(`${engineUrl}/sessions/${sessionId}/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action_type: 'goto',
        value: url,
        options: { waitUntil: 'domcontentloaded', timeout: opts.timeout || 45000 },
      }),
    });
    if (!gotoRes.ok) {
      const e = await gotoRes.json().catch(() => ({}));
      throw new Error(e.error?.message || e.error || 'cloudbrowser goto failed');
    }
    const gotoJson = await gotoRes.json().catch(() => ({}));

    // 3. Extract the full rendered HTML
    const extractRes = await fetch(`${engineUrl}/sessions/${sessionId}/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action_type: 'evaluate',
        options: { fn: '() => document.documentElement.outerHTML' },
      }),
    });
    const extractJson = await extractRes.json().catch(() => ({}));
    if (!extractRes.ok) {
      throw new Error(extractJson.error?.message || 'cloudbrowser html extract failed');
    }
    const html = typeof extractJson.data === 'string' ? extractJson.data : '';
    return {
      html,
      title: gotoJson.title || '',
      url: gotoJson.url || url,
    };
  } finally {
    await fetch(`${engineUrl}/sessions/${sessionId}`, { method: 'DELETE', headers }).catch(() => {});
  }
}

/**
 * Browserbase Fetch API — cloud browser backup.
 * Simple REST: POST /v1/fetch with a URL, get page content back.
 * No Playwright/CDP needed. Uses BROWSERBASE_API_KEY secret.
 */
export async function fetchRenderedHtmlBrowserbase(url: string, opts: FetchRenderedHtmlOpts = {}): Promise<{ html: string; title: string; url: string }> {
  const runtime: any = await import('base44:runtime');
  const apiKey = runtime.secrets.get('BROWSERBASE_API_KEY');
  if (!apiKey) {
    throw new Error('Browserbase not configured — set BROWSERBASE_API_KEY');
  }

  const res = await fetch('https://api.browserbase.com/v1/fetch', {
    method: 'POST',
    headers: {
      'X-BB-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      format: 'raw',
      allowRedirects: true,
    }),
    signal: AbortSignal.timeout(opts.timeout || 45000),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || e.error || `Browserbase fetch failed: ${res.status}`);
  }

  const data = await res.json();
  const html = typeof data.content === 'string' ? data.content : '';
  return {
    html,
    title: '',
    url: url,
  };
}

/**
 * Fallback chain: try primary cloudbrowser engine, fall back to Browserbase.
 * Returns content + which engine succeeded.
 */
export async function fetchRenderedHtmlWithFallback(url: string, opts: FetchRenderedHtmlOpts = {}): Promise<{ html: string; title: string; url: string; engine: string }> {
  // Try primary engine first
  try {
    const result = await fetchRenderedHtml(url, opts);
    if (result.html && result.html.length > 200) {
      return { ...result, engine: 'cloudbrowser' };
    }
    throw new Error('Primary engine returned empty content');
  } catch (primaryError: any) {
    // Fall back to Browserbase
    try {
      const result = await fetchRenderedHtmlBrowserbase(url, opts);
      if (result.html && result.html.length > 100) {
        return { ...result, engine: 'browserbase' };
      }
      throw new Error('Browserbase returned empty content');
    } catch (backupError: any) {
      throw new Error(`Both engines failed. Primary: ${primaryError.message}. Backup: ${backupError.message}`);
    }
  }
}