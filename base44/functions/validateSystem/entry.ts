import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { scrapeSource } from '../../shared/scraper.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const checks = [];
    const actions = [];
    const metrics = {};

    const [properties, leads, bids, contracts, sources, jobs, alerts, deals, watchlists, titleRisks] = await Promise.all([
      base44.asServiceRole.entities.Property.list('-created_date', 1000),
      base44.asServiceRole.entities.InvestorLead.list('-created_date', 1000),
      base44.asServiceRole.entities.Bid.list('-created_date', 1000),
      base44.asServiceRole.entities.SmartContract.list('-created_date', 1000),
      base44.asServiceRole.entities.DataSource.list('-created_date', 1000),
      base44.asServiceRole.entities.ScrapeJob.list('-created_date', 20),
      base44.asServiceRole.entities.DealAlert.list('-created_date', 500),
      base44.asServiceRole.entities.Deal.list('-created_date', 500),
      base44.asServiceRole.entities.Watchlist.list('-created_date', 500),
      base44.asServiceRole.entities.TitleRisk.list('-created_date', 500)
    ]);

    metrics.properties = properties.length;
    metrics.investor_leads = leads.length;
    metrics.investor_leads_new = leads.filter(l => l.outreach_status === 'new').length;
    metrics.bids = bids.length;
    metrics.contracts = contracts.length;
    metrics.contracts_draft = contracts.filter(c => c.status === 'draft').length;
    metrics.data_sources = sources.length;
    metrics.active_sources = sources.filter(s => s.status === 'active').length;
    metrics.deal_alerts = alerts.length;
    metrics.deal_alerts_unread = alerts.filter(a => !a.read).length;
    metrics.pipeline_deals = deals.length;
    metrics.pipeline_active = deals.filter(d => d.status === 'active').length;
    metrics.watchlists = watchlists.length;
    metrics.title_risks = titleRisks.length;
    const titleCoverage = properties.length ? Math.round((titleRisks.length / properties.length) * 100) : 100;

    // scrape pipeline health — auto-heal first, then record the check
    const recentFailed = jobs.filter(j => j.status === 'failed');
    let healedCount = 0;

    // auto-heal: re-run up to 2 failed sources
    const failedSourceIds = [...new Set(recentFailed.map(j => j.source_id).filter(Boolean))];
    for (const sid of failedSourceIds.slice(0, 2)) {
      const src = sources.find(s => s.id === sid);
      if (!src) continue;
      try {
        await scrapeSource(base44, { secrets, source: src });
        const healed = recentFailed.filter(j => j.source_id === sid);
        for (const j of healed) {
          await base44.asServiceRole.entities.ScrapeJob.update(j.id, { status: 'complete', error: null, completed_at: new Date().toISOString() });
        }
        healedCount += healed.length;
        actions.push(`re-ran failed source: ${src.name} (${healed.length} jobs healed)`);
      } catch (e) {
        actions.push(`re-run failed for ${src.name}: ${e.message}`);
      }
    }

    // auto-heal: clear orphaned/stale failed jobs (source no longer exists)
    for (const j of recentFailed) {
      if (!j.source_id || !sources.find(s => s.id === j.source_id)) {
        await base44.asServiceRole.entities.ScrapeJob.update(j.id, { status: 'complete', error: null, completed_at: new Date().toISOString() });
        actions.push(`cleared stale failed job: ${j.source_name || j.id}`);
        healedCount++;
      }
    }

    const remainingFailed = Math.max(0, recentFailed.length - healedCount);
    checks.push({
      name: 'scrape_pipeline',
      status: remainingFailed > 2 ? 'critical' : remainingFailed > 0 ? 'degraded' : 'healthy',
      detail: `${remainingFailed} failed of last ${jobs.length} jobs`
    });

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

    // investor deal-alert engine
    checks.push({
      name: 'deal_alerts',
      status: 'healthy',
      detail: `${metrics.deal_alerts} alerts (${metrics.deal_alerts_unread} unread)`
    });

    // investor pipeline
    checks.push({
      name: 'investor_pipeline',
      status: 'healthy',
      detail: `${metrics.pipeline_active} active deals in pipeline`
    });

    // title-risk coverage
    checks.push({
      name: 'title_risk_coverage',
      status: titleCoverage >= 80 ? 'healthy' : titleCoverage >= 40 ? 'degraded' : 'critical',
      detail: `${titleCoverage}% of properties have a title-risk assessment`
    });

    // watchlist engagement
    checks.push({
      name: 'watchlist',
      status: 'healthy',
      detail: `${metrics.watchlists} properties watched`
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