import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * Generates a dynamic XML sitemap that includes every active property page.
 * Served at /functions/dynamicSitemap — can be submitted to Google Search Console
 * as an additional sitemap alongside the static /sitemap.xml.
 *
 * No auth required — this is a public sitemap intended for search engine crawlers.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const SITE_URL = 'https://hiddenpropertyintel.com';
    const now = new Date().toISOString().slice(0, 10);

    // Fetch all active properties (up to 500)
    let properties: any[] = [];
    try {
      properties = await base44.entities.Property.filter({ status: 'active' }, '-property_score', 500);
    } catch (e) {
      // If DB fails, still return the static URLs
    }

    const staticUrls = [
      { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily', lastmod: now },
      { loc: `${SITE_URL}/listings`, priority: '0.9', changefreq: 'daily', lastmod: now },
      { loc: `${SITE_URL}/calculators`, priority: '0.7', changefreq: 'monthly', lastmod: now },
      { loc: `${SITE_URL}/about`, priority: '0.6', changefreq: 'monthly', lastmod: now },
      { loc: `${SITE_URL}/contact`, priority: '0.6', changefreq: 'monthly', lastmod: now },
    ];

    const propertyUrls = properties.map((p: any) => ({
      loc: `${SITE_URL}/properties/${p.id}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: p.updated_date ? String(p.updated_date).slice(0, 10) : now,
    }));

    const urls = [...staticUrls, ...propertyUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>`, {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}