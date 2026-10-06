export function loadConfig(env = process.env) {
  return {
    systemId: env.HPI_SYSTEM_ID || 'hidden-property-intel',
    repo: env.GITHUB_REPO || 'XTREME-SYSTEMS/hidden-property-intel',
    branch: env.GITHUB_BASE_BRANCH || 'main',
    githubToken: env.GITHUB_TOKEN || '',
    deploymentSha: env.VERCEL_GIT_COMMIT_SHA || '',
    deploymentId: env.VERCEL_DEPLOYMENT_ID || env.VERCEL_URL || '',
    cronSecret: env.CRON_SECRET || env.VERCEL_CRON_SECRET || '',
    allowDispatch: env.ALLOW_RECONCILE_DISPATCH === 'true',
    legacySchedulersDisabled: env.LEGACY_SCHEDULERS_DISABLED === 'true',
    heartbeatActive: env.CONVERGENCE_HEARTBEAT_ACTIVE === 'true',
    requiredCleanCycles: Math.max(1, Number(env.REQUIRED_CLEAN_CYCLES || 3)),
    titleRiskTargetPct: Number(env.TITLE_RISK_TARGET_PCT || 90),
    imageCoverageTargetPct: Number(env.IMAGE_COVERAGE_TARGET_PCT || 90),
    ownerCoverageTargetPct: Number(env.OWNER_COVERAGE_TARGET_PCT || 90),
  };
}

export function authMatches(req, config) {
  if (!config.cronSecret) return false;
  const auth = req?.headers?.authorization || req?.headers?.Authorization || '';
  return auth === `Bearer ${config.cronSecret}`;
}
