/**
 * Pure, evidence-oriented health scoring for Hidden Property Intel.
 * No provider calls, no changes to scrape/source history, no automatic outreach.
 * Every count is a sampled count until a paginated full-database census exists.
 */
const MS_DAY = 86_400_000;
const REAL_IMAGE_TYPES = new Set(['scraped', 'street_view', 'satellite', 'user_uploaded']);

function when(value) {
  const ms = value ? Date.parse(value) : NaN;
  return Number.isFinite(ms) ? ms : null;
}

function ratio(part, whole) {
  return whole ? Math.round((part / whole) * 100) : 0;
}

function check(name, status, detail) {
  return { name, status, detail };
}

/** @param {object} input sampled entity collections, and optional ISO now */
export function evaluateHealth(input = {}, nowInput = new Date().toISOString()) {
  const now = when(nowInput);
  if (now === null) throw new Error('Valid current timestamp required');

  const rows = (name) => Array.isArray(input[name]) ? input[name] : [];
  const properties = rows('properties');
  const leads = rows('leads');
  const bids = rows('bids');
  const contracts = rows('contracts');
  const sources = rows('sources');
  const jobs = rows('jobs');
  const alerts = rows('alerts');
  const deals = rows('deals');
  const watchlists = rows('watchlists');
  const titleRisks = rows('titleRisks');
  const subscriptions = rows('subscriptions');

  const days7 = now - 7 * MS_DAY;
  const hours72 = now - 72 * 3_600_000;
  const hours24 = now - 24 * 3_600_000;
  const validRun = (s) => when(s.last_run_at);
  const recent = (date, boundary) => date !== null && date >= boundary && date <= now;
  const activeSources = sources.filter((s) => s.status === 'active');
  const neverRunSources = sources.filter((s) => validRun(s) === null).length;
  const staleSources = sources.filter((s) => {
    const at = validRun(s);
    return at !== null && at < days7;
  }).length;
  const freshSources = sources.filter((s) => recent(validRun(s), days7)).length;
  const yieldingSources = sources.filter((s) => Number(s.properties_yielded) > 0).length;

  const jobEnd = (j) => when(j.completed_at) ?? when(j.updated_date) ?? when(j.started_at);
  const recentJobs = jobs.filter((j) => recent(jobEnd(j), hours72));
  const recent24Jobs = jobs.filter((j) => recent(jobEnd(j), hours24));
  const recentFailed = recentJobs.filter((j) => j.status === 'failed').length;
  const recentCompleted = recentJobs.filter((j) => j.status === 'complete');
  const positiveYieldJobs = recentCompleted.filter((j) =>
    Number(j.properties_found) > 0 || Number(j.properties_new) > 0 || Number(j.properties_updated) > 0
  ).length;
  const zeroYieldJobs = recentCompleted.length - positiveYieldJobs;
  const stuckJobs = jobs.filter((j) =>
    j.status === 'running' && (when(j.started_at) ?? now) < now - 30 * 60_000
  ).length;
  const lastScrape = jobs.reduce((max, j) => Math.max(max, jobEnd(j) ?? 0), 0);

  const titleIds = new Set(titleRisks.map((r) => r.property_id).filter(Boolean));
  const titleCount = properties.filter((p) => titleIds.has(p.id)).length;
  const imageCount = properties.filter((p) =>
    Array.isArray(p.images) && p.images.some((img) => REAL_IMAGE_TYPES.has(img?.type) && typeof img?.url === 'string' && img.url.length > 0)
  ).length;
  const titleCoverage = ratio(titleCount, properties.length);
  const imageCoverage = ratio(imageCount, properties.length);
  const activeDeals = deals.filter((d) => d.status === 'active').length;
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active').length;
  const pendingLeads = leads.filter((l) => l.outreach_status === 'new').length;

  const checks = [];
  const sourceStatus = sources.length === 0 || freshSources === 0 ? 'critical'
    : freshSources < sources.length / 2 ? 'degraded' : 'healthy';
  checks.push(check('data_sources', sourceStatus,
    `${sources.length} sampled; ${activeSources.length} labeled active, ${freshSources} run in 7 days, ${neverRunSources} never run, ${staleSources} stale`));

  const scrapeStatus = stuckJobs > 0 || recentCompleted.length === 0 || positiveYieldJobs === 0 ? 'critical'
    : recentFailed > 0 || zeroYieldJobs > positiveYieldJobs ? 'degraded' : 'healthy';
  checks.push(check('scrape_pipeline', scrapeStatus,
    `${recent24Jobs.length} jobs in 24h; ${recentCompleted.length} completed in 72h, ${positiveYieldJobs} with positive yield, ${zeroYieldJobs} zero-yield, ${recentFailed} failed, ${stuckJobs} stuck`));

  checks.push(check('title_risk_coverage', properties.length && titleCoverage >= 80 ? 'healthy' : titleCoverage >= 40 ? 'degraded' : 'critical',
    `${titleCoverage}% of ${properties.length} sampled properties have a linked title-risk record; not title verification`));
  checks.push(check('image_coverage', properties.length && imageCoverage >= 80 ? 'healthy' : imageCoverage >= 50 ? 'degraded' : 'critical',
    `${imageCoverage}% have a typed image URL; authenticity and licensing not independently verified`));
  checks.push(check('investor_pipeline', activeDeals > 0 ? 'healthy' : 'degraded',
    `${activeDeals} active deals; zero is not proof of working conversion`));
  checks.push(check('subscriptions', activeSubscriptions > 0 ? 'healthy' : 'degraded',
    `${activeSubscriptions} active subscription records; Stripe payment processing not verified`));
  checks.push(check('investor_outreach', pendingLeads > 0 ? 'degraded' : 'unknown',
    `${pendingLeads} uncontacted leads; outbound communication intentionally not triggered`));
  checks.push(check('smart_contracts', 'unknown',
    `${contracts.filter((c) => c.status === 'draft').length} draft contracts; chain deployment and settlement not verified`));

  const overall_status = checks.some((c) => c.status === 'critical') ? 'critical'
    : checks.every((c) => c.status === 'healthy') ? 'healthy' : 'degraded';
  const metrics = {
    property_records_sampled: properties.length,
    investor_leads_sampled: leads.length,
    investor_leads_new: pendingLeads,
    bids_sampled: bids.length,
    contracts_sampled: contracts.length,
    data_sources_sampled: sources.length,
    active_sources: activeSources.length,
    sources_never_run: neverRunSources,
    sources_stale_7d: staleSources,
    sources_fresh_7d: freshSources,
    sources_with_lifetime_yield: yieldingSources,
    scrape_jobs_sampled: jobs.length,
    jobs_last_24h: recent24Jobs.length,
    jobs_positive_yield_72h: positiveYieldJobs,
    jobs_zero_yield_72h: zeroYieldJobs,
    jobs_failed_72h: recentFailed,
    jobs_stuck_30m: stuckJobs,
    latest_recorded_scrape_at: lastScrape ? new Date(lastScrape).toISOString() : null,
    deal_alerts_sampled: alerts.length,
    pipeline_deals_sampled: deals.length,
    pipeline_active: activeDeals,
    watchlists_sampled: watchlists.length,
    title_risks_sampled: titleRisks.length,
    title_risk_coverage_pct: titleCoverage,
    image_coverage_pct: imageCoverage,
    draft_properties: properties.filter((p) => p.status === 'draft').length,
    subscription_records_sampled: subscriptions.length,
    active_subscriptions: activeSubscriptions,
    data_scope: 'sampled_entity_lists_not_database_census'
  };
  return { overall_status, checks, metrics, actions_taken: [], repairs_executed: false, evidence_scope: metrics.data_scope };
}
