import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * Submits a sitemap to Google Search Console for a verified site.
 * Idempotent: skips submission if the sitemap is already registered.
 *
 * Args:
 *   site_url     — optional site URL (defaults to the first sc-domain: site)
 *   sitemap_path — optional sitemap URL (defaults to <site origin>/sitemap.xml)
 *
 * Uses the SHARED google_search_console connector (webmasters write scope).
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    if (!accessToken) return Response.json({ error: 'Google Search Console not connected' }, { status: 502 });

    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // 1. Resolve target site
    let siteUrl = body.site_url;
    if (!siteUrl) {
      const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers });
      if (!sitesRes.ok) {
        const e = await sitesRes.json().catch(() => ({}));
        return Response.json({ error: e.error?.message || 'Failed to list Search Console sites' }, { status: 502 });
      }
      const sitesJson = await sitesRes.json();
      const sites = (sitesJson.siteEntry || []).map((s) => s.siteUrl);
      // Prefer the property-intel domain, else the first sc-domain
      siteUrl = sites.find((s) => s.includes('hiddenpropertyintel.com')) || sites.find((s) => s.startsWith('sc-domain:')) || sites[0];
      if (!siteUrl) return Response.json({ error: 'No verified sites found in this Google account' }, { status: 404 });
    }

    // 2. Resolve sitemap path
    let sitemapPath = body.sitemap_path;
    if (!sitemapPath) {
      const origin = siteUrl.startsWith('sc-domain:') ? `https://${siteUrl.replace('sc-domain:', '')}` : siteUrl.replace(/\/$/, '');
      sitemapPath = `${origin}/sitemap.xml`;
    }

    const encodedSite = encodeURIComponent(siteUrl);
    const feedpath = encodeURIComponent(sitemapPath);

    // 3. Check existing sitemaps — skip if already submitted
    const listRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`, { headers });
    if (listRes.ok) {
      const listJson = await listRes.json();
      const existing = (listJson.sitemap || []).find((s) => s.path === sitemapPath);
      if (existing) {
        return Response.json({
          status: 'already_submitted',
          site_url: siteUrl,
          sitemap_path: sitemapPath,
          last_submitted: existing.lastSubmitted,
          errors: existing.errors || 0,
          warnings: existing.warnings || 0,
          submitted: existing.contents?.submitted || 0,
          indexed: existing.contents?.indexed || 0
        });
      }
    }

    // 4. Submit (PUT) the sitemap
    const submitRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${feedpath}`, {
      method: 'PUT',
      headers
    });
    if (!submitRes.ok) {
      const e = await submitRes.json().catch(() => ({}));
      return Response.json({ error: e.error?.message || 'Failed to submit sitemap' }, { status: 502 });
    }

    const result = await submitRes.json().catch(() => ({}));
    return Response.json({
      status: 'submitted',
      site_url: siteUrl,
      sitemap_path: sitemapPath,
      last_submitted: result.lastSubmitted,
      errors: result.errors || 0,
      warnings: result.warnings || 0,
      submitted: result.contents?.submitted || 0,
      indexed: result.contents?.indexed || 0
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}