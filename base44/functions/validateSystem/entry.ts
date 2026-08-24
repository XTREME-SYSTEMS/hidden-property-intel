import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { scrapeSource } from '../../shared/scraper.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const checks = [];
    const actions = [];
    const metrics = {};

    const [properties, leads, bids, contracts, sources, jobs] = await Promise.all([
      base44.asServiceRole.entities.Property.list('-created_date', 1000),
      base44.asServiceRole.entities.InvestorLead.list('-created_date', 1000),
      base44.asServiceRole.entities.Bid.list('-created_date', 1000),
      base44.asServiceRole.entities.SmartContract.list('-created_date', 1000),
      base44.asServiceRole.entities.DataSource.list('-created_date', 1000),
      base44.asServiceRole.entities.ScrapeJob.list('-created_date', 20)
    ]);

    metrics.properties = properties.length;
    metrics.investor_leads = leads.length;
    metrics.investor_leads_new = leads.filter(l => l.outreach_status === 'new').length;
    metrics.bids = bids.length;
    metrics.contracts = contracts.length;
    metrics.contracts_draft = contracts.filter(c => c.status === 'draft').length;
    metrics.data_sources = sources.length;
    metrics.active_sources = sources.filter(s => s.status === 'active').length;

    // scrape pipeline health
    const recentFailed = jobs.filter(j => j.status === 'failed');
    checks.push({
      name: 'scrape_pipeline',
      status: recentFailed.length > 2 ? 'critical' : recentFailed.length > 0 ? 'degraded' : 'healthy',
      detail: `${recentFailed.length} failed of last ${jobs.length} jobs`
    });

    // auto-heal: re-run up to 2 failed sources
    const failedSourceIds = [...new Set(recentFailed.map(j => j.source_id).filter(Boolean))];
    for (const sid of failedSourceIds.slice(0, 2)) {
      const src = sources.find(s => s.id === sid);
      if (!src) continue;
      try {
        await scrapeSource(base44, { secrets, source: src });
        actions.push(`re-ran failed source: ${src.name}`);
      } catch (e) {
        actions.push(`re-run failed for ${src.name}: ${e.message}`);
      }
    }

    // auto-heal: reset error sources to active
    const errorSources = sources.filter(s => s.status === 'error');
    for (const s of errorSources) {
      await base44.asServiceRole.entities.DataSource.update(s.id, { status: 'active' });
      actions.push(`reset error source to active: ${s.name}`);
    }
    checks.push({
      name: 'data_sources',
      status: errorSources.length ? 'degraded' : 'healthy',
      detail: `${errorSources.length} sources in error state`
    });

    // outreach health
    checks.push({
      name: 'investor_outreach',
      status: metrics.investor_leads_new > 0 ? 'healthy' : 'degraded',
      detail: `${metrics.investor_leads_new} new leads pending outreach`
    });

    // contract pipeline
    checks.push({
      name: 'smart_contracts',
      status: 'healthy',
      detail: `${metrics.contracts_draft} draft contracts awaiting signature`
    });

    const overall = checks.some(c => c.status === 'critical') ? 'critical'
      : checks.some(c => c.status === 'degraded') ? 'degraded' : 'healthy';

    await base44.asServiceRole.entities.SystemHealth.create({
      run_at: new Date().toISOString(),
      overall_status: overall,
      checks,
      metrics,
      actions_taken: actions
    });

    return Response.json({ overall_status: overall, metrics, checks, actions_taken: actions });
  } catch (error) {
    console.error('validateSystem error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}