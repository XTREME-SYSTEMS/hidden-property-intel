export default function handler(req, res) {
  const persistence = Boolean((process.env.HPI_SUPABASE_URL || process.env.SUPABASE_URL) && (process.env.HPI_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
  const schedulerAuth = Boolean(process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET);
  const safeDispatchDependencies = Boolean(process.env.RAILWAY_SCRAPER_URL && process.env.BASE44_SYNC_TOKEN);
  return res.status(200).json({
    status: persistence && schedulerAuth ? 'ready' : 'degraded',
    service: 'property-intel-orchestrator',
    convergence_version: '1.0.0',
    persistence_configured: persistence,
    scheduler_auth_configured: schedulerAuth,
    dispatch_dependencies_configured: safeDispatchDependencies,
    dispatch_enabled: process.env.ALLOW_RECONCILE_DISPATCH === 'true',
    single_heartbeat_declared: process.env.CONVERGENCE_HEARTBEAT_ACTIVE === 'true',
    legacy_schedulers_disabled: process.env.LEGACY_SCHEDULERS_DISABLED === 'true',
    timestamp: new Date().toISOString(),
  });
}
