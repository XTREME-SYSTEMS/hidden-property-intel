import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { scrapeInvestorsForRegion, emailNewInvestorLeads, emailSellerLeads } from '../../shared/investorOutreach.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // derive target regions from active data sources
    const sources = await base44.asServiceRole.entities.DataSource.filter({ status: 'active' });
    const regions = [...new Set(
      sources
        .map((s) => (s.scrape_config?.county ? `${s.scrape_config.county}, ${s.scrape_config.state || 'FL'}` : s.scrape_config?.state || null))
        .filter(Boolean)
    )];
    const targetRegions = regions.length ? regions : ['Florida'];

    let scraped = 0;
    for (const region of targetRegions.slice(0, 8)) {
      try {
        const r = await scrapeInvestorsForRegion(base44, region, 15);
        scraped += r.saved;
      } catch (e) {
        console.error('investor scrape failed', region, e?.message);
      }
    }

    const inv = await emailNewInvestorLeads(base44, 50);
    const sel = await emailSellerLeads(base44, 50);

    return Response.json({
      regions_scraped: Math.min(targetRegions.length, 8),
      investor_leads_saved: scraped,
      investor_emails_sent: inv.sent,
      seller_emails_sent: sel.sent
    });
  } catch (error) {
    console.error('runDailyOutreach error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}