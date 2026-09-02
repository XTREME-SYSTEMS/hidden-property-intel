import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * Pulls Google Search Console data for the connected account:
 *  - list of verified sites
 *  - search performance (clicks, impressions, ctr, position) for the last 28 days per site
 *  - sitemap submission status per site
 * Uses the SHARED google_search_console connector (read-only webmasters scope).
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    if (!accessToken) return Response.json({ error: 'Google Search Console not connected' }, { status: 502 });

    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // 1. List verified sites
    const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers });
    if (!sitesRes.ok) {
      const e = await sitesRes.json().catch(() => ({}));
      return Response.json({ error: e.error?.message || 'Failed to list Search Console sites' }, { status: 502 });
    }
    const sitesJson = await sitesRes.json();
    const sites = (sitesJson.siteEntry || []).map((s) => s.siteUrl);

    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    const start = new Date(today.getTime() - 27 * 86400000).toISOString().slice(0, 10);

    const report = [];
    for (const siteUrl of sites) {
      const encoded = encodeURIComponent(siteUrl);

      // 2. Search analytics for last 28 days
      let performance = { clicks: 0, impressions: 0, ctr: 0, position: 0, topQueries: [] };
      try {
        const saRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encoded}/searchAnalytics/query`, {
          method: 'POST', headers,
          body: JSON.stringify({
            startDate: start,
            endDate: end,
            dimensions: ['query'],
            rowLimit: 25
          })
        });
        if (saRes.ok) {
          const sa = await saRes.json();
          const rows = sa.rows || [];
          let clicks = 0, impressions = 0;
          for (const r of rows) { clicks += r.clicks; impressions += r.impressions; }
          performance = {
            clicks,
            impressions,
            ctr: impressions ? (clicks / impressions) * 100 : 0,
            position: rows.length ? rows.reduce((a, r) => a + r.position, 0) / rows.length : 0,
            topQueries: rows.slice(0, 10).map((r) => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }))
          };
        }
      } catch (e) { /* ignore per-site errors */ }

      // 3. Sitemaps
      let sitemaps = [];
      try {
        const smRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encoded}/sitemaps`, { headers });
        if (smRes.ok) {
          const sm = await smRes.json();
          sitemaps = (sm.sitemap || []).map((s) => ({
            path: s.path,
            lastSubmitted: s.lastSubmitted,
            status: s.errors ? 'errors' : s.isPending ? 'pending' : 'processed',
            errors: s.errors || 0,
            warnings: s.warnings || 0,
            submitted: s.contents?.submitted || 0,
            indexed: s.contents?.indexed || 0
          }));
        }
      } catch (e) { /* ignore */ }

      report.push({ siteUrl, performance, sitemaps });
    }

    return Response.json({ startDate: start, endDate: end, sites, report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}