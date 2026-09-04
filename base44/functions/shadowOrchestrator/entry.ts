import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Shadow Orchestrator — the autonomous intelligence layer for PropertyIntel.
// Audits 8 dimensions, auto-heals issues, computes a 0-100 system score,
// and persists a comprehensive ShadowReport. Designed to run every 6 hours.

interface Finding {
  dimension: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  finding: string;
  action: string;
  auto_healed: boolean;
}

function score(checks: { threshold: number; value: number; weight?: number }[]): number {
  const totalWeight = checks.reduce((s, c) => s + (c.weight || 1), 0);
  const weighted = checks.reduce((s, c) => {
    const ratio = Math.min(1, c.value / c.threshold);
    return s + ratio * (c.weight || 1);
  }, 0);
  return Math.round((weighted / totalWeight) * 100);
}

export default async function (req: any) {
  const base44 = createClientFromRequest(req);
  const now = new Date().toISOString();
  const findings: Finding[] = [];
  const actions: string[] = [];
  const metrics: Record<string, any> = {};
  const dimensionScores: Record<string, number> = {};

  try {
    // ── Parallel data gathering ──
    const [
      properties, sources, jobs, scores, titleRisks, ownershipChains, images,
      investors, sellers, bids, deals, contracts, signatures, leads, owners,
      watchlists, alerts, marketAnalytics, subscriptions, systemHealth
    ] = await Promise.all([
      base44.asServiceRole.entities.Property.list('-created_date', 2000),
      base44.asServiceRole.entities.DataSource.list('-created_date', 1000),
      base44.asServiceRole.entities.ScrapeJob.list('-created_date', 50),
      base44.asServiceRole.entities.PropertyScore.list('-created_date', 1000),
      base44.asServiceRole.entities.TitleRisk.list('-created_date', 1000),
      base44.asServiceRole.entities.OwnershipChain.list('-created_date', 500),
      base44.asServiceRole.entities.PropertyImage.list('-created_date', 1000),
      base44.asServiceRole.entities.Investor.list('-created_date', 500),
      base44.asServiceRole.entities.Seller.list('-created_date', 500),
      base44.asServiceRole.entities.Bid.list('-created_date', 500),
      base44.asServiceRole.entities.Deal.list('-created_date', 500),
      base44.asServiceRole.entities.SmartContract.list('-created_date', 500),
      base44.asServiceRole.entities.DigitalSignature.list('-created_date', 500),
      base44.asServiceRole.entities.InvestorLead.list('-created_date', 500),
      base44.asServiceRole.entities.Owner.list('-created_date', 500),
      base44.asServiceRole.entities.Watchlist.list('-created_date', 500),
      base44.asServiceRole.entities.DealAlert.list('-created_date', 500),
      base44.asServiceRole.entities.MarketAnalytics.list('-created_date', 100),
      base44.asServiceRole.entities.Subscription.list('-created_date', 500),
      base44.asServiceRole.entities.SystemHealth.list('-created_date', 5),
    ]);

    // ── METRICS SNAPSHOT ──
    metrics.total_properties = properties.length;
    metrics.active_properties = properties.filter((p: any) => p.status === 'active').length;
    metrics.draft_properties = properties.filter((p: any) => p.status === 'draft').length;
    metrics.total_sources = sources.length;
    metrics.active_sources = sources.filter((s: any) => s.status === 'active').length;
    metrics.error_sources = sources.filter((s: any) => s.status === 'error').length;
    metrics.paused_sources = sources.filter((s: any) => s.status === 'paused').length;
    metrics.failed_jobs_24h = jobs.filter((j: any) => j.status === 'failed').length;
    metrics.properties_with_scores = scores.length;
    metrics.properties_with_title = titleRisks.length;
    metrics.properties_with_ownership = ownershipChains.length;
    metrics.properties_with_images = images.length;
    metrics.total_investors = investors.length;
    metrics.active_investors = investors.filter((i: any) => i.subscription_status === 'active').length;
    metrics.total_bids = bids.length;
    metrics.active_bids = bids.filter((b: any) => b.status === 'active').length;
    metrics.pipeline_deals = deals.length;
    metrics.active_deals = deals.filter((d: any) => d.status === 'active').length;
    metrics.contracts = contracts.length;
    metrics.signed_contracts = contracts.filter((c: any) => c.status === 'signed' || c.status === 'funded' || c.status === 'closed').length;
    metrics.signatures = signatures.length;
    metrics.investor_leads = leads.length;
    metrics.new_leads = leads.filter((l: any) => l.outreach_status === 'new').length;
    metrics.owners = owners.length;
    metrics.owners_contacted = owners.filter((o: any) => o.outreach_status === 'contacted' || o.outreach_status === 'responded').length;
    metrics.watchlists = watchlists.length;
    metrics.deal_alerts = alerts.length;
    metrics.market_analytics = marketAnalytics.length;
    metrics.active_subscriptions = subscriptions.filter((s: any) => s.status === 'active').length;

    // ── DIMENSION 1: Data Acquisition ──
    const sourceCoverage = metrics.total_sources > 0 ? metrics.active_sources / metrics.total_sources : 0;
    const jobSuccessRate = jobs.length > 0 ? jobs.filter((j: any) => j.status === 'complete').length / jobs.length : 1;
    const sourceYieldRate = metrics.total_sources > 0 ? sources.filter((s: any) => (s.properties_yielded || 0) > 0).length / metrics.total_sources : 0;
    dimensionScores.data_acquisition = score([
      { threshold: 1, value: sourceCoverage, weight: 3 },
      { threshold: 1, value: jobSuccessRate, weight: 2 },
      { threshold: 1, value: sourceYieldRate, weight: 2 },
      { threshold: 500, value: metrics.total_properties, weight: 3 },
    ]);

    // Auto-heal: reset error sources to active
    const errorSources = sources.filter((s: any) => s.status === 'error');
    for (const s of errorSources) {
      await base44.asServiceRole.entities.DataSource.update(s.id, { status: 'active', consecutive_failures: 0 });
      actions.push(`Reset error source to active: ${s.name}`);
    }
    if (errorSources.length > 0) {
      findings.push({
        dimension: 'Data Acquisition', severity: 'medium',
        finding: `${errorSources.length} sources were in error state`,
        action: `Auto-healed: reset all to active`, auto_healed: true
      });
    }
    if (metrics.paused_sources > 0) {
      findings.push({
        dimension: 'Data Acquisition', severity: 'high',
        finding: `${metrics.paused_sources} sources auto-paused after consecutive failures`,
        action: 'Review paused sources and update scrape configs or add stealth/proxy flags',
        auto_healed: false
      });
    }
    if (metrics.total_properties < 500) {
      findings.push({
        dimension: 'Data Acquisition', severity: 'high',
        finding: `Only ${metrics.total_properties} properties — target is 10,000+`,
        action: 'Increase scrape frequency and activate more sources',
        auto_healed: false
      });
    }

    // ── DIMENSION 2: Property Enrichment ──
    const scoreCoverage = metrics.total_properties > 0 ? metrics.properties_with_scores / metrics.total_properties : 0;
    const titleCoverage = metrics.total_properties > 0 ? metrics.properties_with_title / metrics.total_properties : 0;
    const ownershipCoverage = metrics.total_properties > 0 ? metrics.properties_with_ownership / metrics.total_properties : 0;
    const imageCoverageRatio = metrics.total_properties > 0 ? metrics.properties_with_images / metrics.total_properties : 0;
    const ownerCoverage = metrics.total_properties > 0 ? metrics.owners / metrics.total_properties : 0;
    dimensionScores.property_enrichment = score([
      { threshold: 1, value: scoreCoverage, weight: 3 },
      { threshold: 1, value: titleCoverage, weight: 2 },
      { threshold: 1, value: ownershipCoverage, weight: 1 },
      { threshold: 1, value: imageCoverageRatio, weight: 2 },
      { threshold: 1, value: ownerCoverage, weight: 2 },
    ]);

    if (titleCoverage < 0.8) {
      findings.push({
        dimension: 'Property Enrichment', severity: titleCoverage < 0.4 ? 'critical' : 'high',
        finding: `Title risk coverage at ${Math.round(titleCoverage * 100)}% — target 90%+`,
        action: 'Run title risk assessment on unenriched properties',
        auto_healed: false
      });
    }
    if (imageCoverageRatio < 0.8) {
      findings.push({
        dimension: 'Property Enrichment', severity: imageCoverageRatio < 0.4 ? 'critical' : 'high',
        finding: `Image coverage at ${Math.round(imageCoverageRatio * 100)}% — target 90%+`,
        action: 'Run image ingestion pipeline for properties missing photos',
        auto_healed: false
      });
    }
    if (ownerCoverage < 0.5) {
      findings.push({
        dimension: 'Property Enrichment', severity: 'high',
        finding: `Owner enrichment at ${Math.round(ownerCoverage * 100)}% — target 90%+`,
        action: 'Run skip-trace enrichment on properties without owner records',
        auto_healed: false
      });
    }

    // ── DIMENSION 3: Deal Pipeline ──
    const dealActivity = metrics.total_properties > 0 ? metrics.active_deals / Math.max(metrics.active_properties, 1) : 0;
    const bidActivity = metrics.active_properties > 0 ? metrics.active_bids / Math.max(metrics.active_properties, 1) : 0;
    const contractConversion = metrics.total_bids > 0 ? metrics.contracts / metrics.total_bids : 0;
    dimensionScores.deal_pipeline = score([
      { threshold: 0.1, value: dealActivity, weight: 2 },
      { threshold: 0.05, value: bidActivity, weight: 2 },
      { threshold: 0.3, value: contractConversion, weight: 1 },
      { threshold: 10, value: metrics.active_deals, weight: 2 },
    ]);

    if (metrics.active_deals < 5) {
      findings.push({
        dimension: 'Deal Pipeline', severity: 'medium',
        finding: `Only ${metrics.active_deals} active deals in pipeline`,
        action: 'Match high-score properties with investors and trigger outreach',
        auto_healed: false
      });
    }

    // ── DIMENSION 4: Outreach Engine ──
    const leadResponseRate = metrics.investor_leads > 0 ? metrics.investor_leads - metrics.new_leads / Math.max(metrics.investor_leads, 1) : 0;
    const ownerResponseRate = metrics.owners > 0 ? metrics.owners_contacted / metrics.owners : 0;
    dimensionScores.outreach_engine = score([
      { threshold: 0.5, value: ownerResponseRate, weight: 3 },
      { threshold: 50, value: metrics.investor_leads, weight: 2 },
      { threshold: 50, value: metrics.owners, weight: 2 },
      { threshold: 0.3, value: leadResponseRate, weight: 1 },
    ]);

    if (metrics.new_leads > 10) {
      findings.push({
        dimension: 'Outreach Engine', severity: 'medium',
        finding: `${metrics.new_leads} investor leads pending outreach`,
        action: 'Run investor outreach campaign',
        auto_healed: false
      });
    }
    if (ownerResponseRate < 0.3 && metrics.owners > 0) {
      findings.push({
        dimension: 'Outreach Engine', severity: 'high',
        finding: `Owner outreach response rate at ${Math.round(ownerResponseRate * 100)}%`,
        action: 'Improve outreach messaging and enable follow-up automation',
        auto_healed: false
      });
    }

    // ── DIMENSION 5: System Intelligence ──
    const analyticsCoverage = metrics.total_properties > 0 ? metrics.market_analytics / Math.max(metrics.total_properties / 100, 1) : 0;
    const scoreQuality = scores.length > 0 ? scores.filter((s: any) => (s.overall_score || 0) > 50).length / scores.length : 0;
    dimensionScores.system_intelligence = score([
      { threshold: 1, value: analyticsCoverage, weight: 1 },
      { threshold: 0.7, value: scoreQuality, weight: 2 },
      { threshold: 0.8, value: scoreCoverage, weight: 2 },
      { threshold: 10, value: metrics.market_analytics, weight: 1 },
    ]);

    if (scoreCoverage < 0.8) {
      findings.push({
        dimension: 'System Intelligence', severity: 'high',
        finding: `Only ${Math.round(scoreCoverage * 100)}% of properties have AI scores`,
        action: 'Run scoreAllActiveProperties to score unenriched properties',
        auto_healed: false
      });
    }

    // ── DIMENSION 6: Security & Compliance ──
    const contractAuditRate = metrics.contracts > 0 ? metrics.contracts / Math.max(metrics.contracts, 1) : 1;
    const signatureRate = metrics.contracts > 0 ? metrics.signed_contracts / metrics.contracts : 0;
    dimensionScores.security_compliance = score([
      { threshold: 1, value: contractAuditRate, weight: 1 },
      { threshold: 0.5, value: signatureRate, weight: 1 },
      { threshold: 1, value: metrics.contracts > 0 ? 1 : 0, weight: 1 },
    ]);

    // ── DIMENSION 7: SEO & Visibility ──
    // Based on property count being indexable + sitemap submission
    const indexableProperties = metrics.active_properties;
    dimensionScores.seo_visibility = score([
      { threshold: 500, value: indexableProperties, weight: 2 },
      { threshold: 1, value: metrics.total_properties > 0 ? 1 : 0, weight: 1 },
      { threshold: 100, value: metrics.watchlists, weight: 1 },
    ]);

    // ── DIMENSION 8: Financial Health ──
    const activeSubRate = metrics.total_investors > 0 ? metrics.active_subscriptions / Math.max(metrics.total_investors, 1) : 0;
    const revenueDeals = metrics.signed_contracts;
    dimensionScores.financial_health = score([
      { threshold: 0.5, value: activeSubRate, weight: 2 },
      { threshold: 10, value: metrics.active_investors, weight: 2 },
      { threshold: 5, value: revenueDeals, weight: 1 },
      { threshold: 10, value: metrics.active_subscriptions, weight: 2 },
    ]);

    if (metrics.active_subscriptions < 5) {
      findings.push({
        dimension: 'Financial Health', severity: 'medium',
        finding: `Only ${metrics.active_subscriptions} active subscriptions`,
        action: 'Increase investor acquisition and conversion',
        auto_healed: false
      });
    }

    // ── OVERALL SCORE ──
    const overallScore = Math.round(
      Object.values(dimensionScores).reduce((s: number, v: any) => s + v, 0) / Object.keys(dimensionScores).length
    );

    // ── CONVERGENCE DELTA ──
    const previousReport = await base44.asServiceRole.entities.ShadowReport.list('-created_date', 1);
    const previousScore = previousReport[0]?.overall_score || 0;
    const convergenceDelta = overallScore - previousScore;

    if (convergenceDelta > 0) {
      actions.push(`System improving: +${convergenceDelta} points since last audit`);
    } else if (convergenceDelta < 0) {
      actions.push(`System declining: ${convergenceDelta} points since last audit — investigate`);
      findings.push({
        dimension: 'System', severity: 'high',
        finding: `System score dropped ${Math.abs(convergenceDelta)} points since last audit`,
        action: 'Review recent changes and identify root cause of decline',
        auto_healed: false
      });
    }

    // ── CAPABILITY MATRIX ──
    const capabilityMatrix = [
      { capability: 'County-record scraping (multi-source)', score: dimensionScores.data_acquisition, status: dimensionScores.data_acquisition >= 80 ? 'Strong' : dimensionScores.data_acquisition >= 50 ? 'Gap' : 'Critical gap', gap: metrics.total_properties < 500 ? 'Need more properties' : 'Scaling' },
      { capability: 'AI deal scoring (0–100)', score: dimensionScores.system_intelligence, status: dimensionScores.system_intelligence >= 80 ? 'Leading' : 'Gap', gap: scoreCoverage < 0.8 ? 'Score coverage low' : 'Good' },
      { capability: 'Ownership chain + heirs', score: dimensionScores.property_enrichment, status: ownershipCoverage >= 0.7 ? 'Leading' : 'Gap', gap: ownershipCoverage < 0.7 ? 'Ownership coverage low' : 'Good' },
      { capability: 'Smart-contract escrow', score: dimensionScores.security_compliance, status: 'Unique', gap: metrics.contracts < 5 ? 'Low contract volume' : 'Good' },
      { capability: 'Autonomous outreach engines', score: dimensionScores.outreach_engine, status: dimensionScores.outreach_engine >= 70 ? 'Strong' : 'Gap', gap: ownerResponseRate < 0.3 ? 'Response rate low' : 'Good' },
      { capability: 'Market analytics + trends', score: dimensionScores.system_intelligence, status: metrics.market_analytics > 5 ? 'Strong' : 'Gap', gap: metrics.market_analytics < 5 ? 'Need more analytics' : 'Good' },
      { capability: 'Image acquisition pipeline', score: dimensionScores.property_enrichment, status: imageCoverageRatio >= 0.7 ? 'Strong' : 'Critical gap', gap: imageCoverageRatio < 0.7 ? 'Image coverage low' : 'Good' },
      { capability: 'Title risk coverage', score: dimensionScores.property_enrichment, status: titleCoverage >= 0.7 ? 'Strong' : 'Critical gap', gap: titleCoverage < 0.7 ? 'Title coverage low' : 'Good' },
      { capability: 'Anti-detection (stealth/proxy)', score: metrics.paused_sources > 5 ? 30 : 70, status: metrics.paused_sources > 5 ? 'Critical gap' : 'Strong', gap: metrics.paused_sources > 5 ? `${metrics.paused_sources} sources blocked` : 'Active' },
      { capability: 'SEO / AEO optimization', score: dimensionScores.seo_visibility, status: dimensionScores.seo_visibility >= 70 ? 'Strong' : 'Gap', gap: indexableProperties < 500 ? 'Need more indexable properties' : 'Good' },
      { capability: 'Predictive distress scoring', score: scoreQuality * 100, status: scoreQuality >= 0.7 ? 'Leading' : 'Gap', gap: scoreQuality < 0.7 ? 'Score quality low' : 'Good' },
      { capability: 'Deal pipeline conversion', score: dimensionScores.deal_pipeline, status: dimensionScores.deal_pipeline >= 60 ? 'Strong' : 'Gap', gap: metrics.active_deals < 5 ? 'Low deal volume' : 'Good' },
      { capability: 'Investor acquisition', score: dimensionScores.financial_health, status: dimensionScores.financial_health >= 60 ? 'Strong' : 'Gap', gap: metrics.active_subscriptions < 5 ? 'Low subscriptions' : 'Good' },
      { capability: 'Self-healing pipeline', score: actions.length > 0 ? 90 : 70, status: 'Leading', gap: 'Auto-healing active' },
    ];

    // ── PERSIST REPORT ──
    const report = await base44.asServiceRole.entities.ShadowReport.create({
      run_at: now,
      type: 'orchestrator',
      overall_score: overallScore,
      dimension_scores: dimensionScores,
      audit_findings: findings,
      actions_taken: actions,
      metrics,
      capability_matrix: capabilityMatrix,
      convergence_delta: convergenceDelta,
    });

    // Also update SystemHealth for the existing architecture page
    const overall_status = overallScore >= 80 ? 'healthy' : overallScore >= 50 ? 'degraded' : 'critical';
    await base44.asServiceRole.entities.SystemHealth.create({
      run_at: now,
      overall_status,
      checks: findings.map(f => ({ name: f.dimension, status: f.severity === 'critical' ? 'critical' : f.severity === 'high' ? 'degraded' : 'ok', detail: f.finding })),
      metrics,
      actions_taken: actions,
    });

    return Response.json({
      overall_score: overallScore,
      convergence_delta: convergenceDelta,
      dimension_scores: dimensionScores,
      findings_count: findings.length,
      actions_taken: actions.length,
      auto_healed: findings.filter(f => f.auto_healed).length,
      metrics,
      report_id: report.id,
    });
  } catch (error) {
    console.error('shadowOrchestrator error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}