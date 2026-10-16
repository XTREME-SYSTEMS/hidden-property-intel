import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { evaluateHealth } from '../../shared/healthMetrics.js';

/**
 * Evidence-only system validation. NEVER runs a scraper or rewrites failed jobs.
 * Must be called as an admin; scheduled service identity must be tested in staging
 * before re-enabling the workflow. See docs/HPI_REPAIR_AND_LAUNCH.md.
 */
export default async function validateSystem(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const opts = await req.json().catch(() => ({}));
    const db = base44.asServiceRole.entities;
    const [properties, leads, bids, contracts, sources, jobs, alerts, deals, watchlists, titleRisks, subscriptions] = await Promise.all([
      db.Property.list('-created_date', 1000),
      db.InvestorLead.list('-created_date', 1000),
      db.Bid.list('-created_date', 1000),
      db.SmartContract.list('-created_date', 1000),
      db.DataSource.list('-created_date', 1000),
      db.ScrapeJob.list('-created_date', 1000),
      db.DealAlert.list('-created_date', 500),
      db.Deal.list('-created_date', 500),
      db.Watchlist.list('-created_date', 500),
      db.TitleRisk.list('-created_date', 1000),
      db.Subscription.list('-created_date', 500),
    ]);
    const result = evaluateHealth({
      properties, leads, bids, contracts, sources, jobs, alerts, deals,
      watchlists, titleRisks, subscriptions,
    });

    // Dry-run permits operator and CI inspection without even creating a health row.
    if (opts.dry_run === true) {
      return Response.json({ ...result, health_record_created: false, dry_run: true });
    }

    await db.SystemHealth.create({
      run_at: new Date().toISOString(),
      overall_status: result.overall_status,
      checks: result.checks,
      metrics: result.metrics,
      actions_taken: [],
    });
    return Response.json({ ...result, health_record_created: true, dry_run: false });
  } catch (error) {
    console.error('validateSystem diagnostic failed', error?.message || 'unknown');
    return Response.json({ error: 'System validation unavailable', code: 'VALIDATE_SYSTEM_FAILED' }, { status: 500 });
  }
}
