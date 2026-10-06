import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { secrets } from 'base44:runtime';
import { hasRealImages } from '../../shared/propertyImages.ts';

function pct(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total)) * 10000) / 100;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    const syncToken = secrets.get('BASE44_SYNC_TOKEN') || '';
    const hasToken = Boolean(syncToken) && authHeader === `Bearer ${syncToken}`;

    if (!hasToken) {
      const user = await base44.auth.me().catch(() => null);
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [
      properties,
      sources,
      scrapeJobs,
      scores,
      titleRisks,
      owners,
      investorLeads,
      deals,
      bids,
      subscriptions,
      campaigns,
      conversations,
      contracts,
      healthRows,
    ] = await Promise.all([
      base44.asServiceRole.entities.Property.list('-created_date', 2000),
      base44.asServiceRole.entities.DataSource.list('-created_date', 1000),
      base44.asServiceRole.entities.ScrapeJob.list('-created_date', 500),
      base44.asServiceRole.entities.PropertyScore.list('-created_date', 2000),
      base44.asServiceRole.entities.TitleRisk.list('-created_date', 2000),
      base44.asServiceRole.entities.Owner.list('-created_date', 2000),
      base44.asServiceRole.entities.InvestorLead.list('-created_date', 2000),
      base44.asServiceRole.entities.Deal.list('-created_date', 1000),
      base44.asServiceRole.entities.Bid.list('-created_date', 1000),
      base44.asServiceRole.entities.Subscription.list('-created_date', 1000),
      base44.asServiceRole.entities.Campaign.list('-created_date', 1000),
      base44.asServiceRole.entities.Conversation.list('-created_date', 1000),
      base44.asServiceRole.entities.SmartContract.list('-created_date', 1000),
      base44.asServiceRole.entities.SystemHealth.list('-run_at', 1),
    ]);

    const propertyCount = properties.length;
    const activeProperties = properties.filter((p) => p.status === 'active').length;
    const propertiesWithRealImages = properties.filter((p) => hasRealImages(p)).length;
    const productiveSources = sources.filter((s) => Number(s.properties_yielded || 0) > 0).length;
    const recentJobs = scrapeJobs.slice(0, 100);
    const latestHealth = healthRows[0] || null;

    const metrics = {
      properties: propertyCount,
      active_properties: activeProperties,
      draft_properties: properties.filter((p) => p.status === 'draft').length,
      data_sources: sources.length,
      active_sources: sources.filter((s) => s.status === 'active').length,
      productive_sources: productiveSources,
      zero_yield_sources: sources.length - productiveSources,
      recent_scrape_jobs: recentJobs.length,
      scrape_jobs_failed: recentJobs.filter((j) => j.status === 'failed').length,
      property_scores: scores.length,
      title_risks: titleRisks.length,
      owners: owners.length,
      properties_with_real_images: propertiesWithRealImages,
      title_risk_coverage_pct: pct(titleRisks.length, propertyCount),
      image_coverage_pct: pct(propertiesWithRealImages, propertyCount),
      owner_coverage_pct: pct(owners.length, propertyCount),
      investor_leads: investorLeads.length,
      investor_leads_new: investorLeads.filter((l) => l.outreach_status === 'new').length,
      investor_leads_contacted: investorLeads.filter((l) => l.outreach_status === 'contacted').length,
      investor_leads_responded: investorLeads.filter((l) => l.outreach_status === 'responded').length,
      deals: deals.length,
      bids: bids.length,
      subscriptions: subscriptions.length,
      campaigns: campaigns.length,
      conversations: conversations.length,
      smart_contracts: contracts.length,
    };

    return Response.json({
      generated_at: new Date().toISOString(),
      metrics,
      latest_health: latestHealth ? {
        id: latestHealth.id,
        run_at: latestHealth.run_at,
        overall_status: latestHealth.overall_status,
      } : null,
      p0_open: null,
      p1_open: null,
      p0_p1_status: 'UNKNOWN_UNTIL_CANONICAL_DEFECT_REGISTRY_IS_WIRED',
    });
  } catch (error) {
    console.error('convergenceSnapshot error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
