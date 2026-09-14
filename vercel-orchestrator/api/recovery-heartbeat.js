const MAX_PRIMARY_HEARTBEAT_AGE_MS = 15 * 60 * 1000;
const CANONICAL_REPO = 'XTREME-SYSTEMS/hidden-property-intel';
const CANONICAL_BRANCH = 'main';
const DEFAULT_PROBE_URL = 'https://my-property-intel.base44.app/functions/recoveryHeartbeatProbe';

async function fetchJson(url, options = {}) {
  const started = Date.now();
  try {
    const response = await fetch(url, options);
    const body = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, body, duration_ms: Date.now() - started };
  } catch (error) {
    return { ok: false, status: 0, body: null, error: String(error?.message || error), duration_ms: Date.now() - started };
  }
}

export default async function handler(req, res) {
  const observedAt = new Date().toISOString();
  const probeUrl = process.env.BASE44_RECOVERY_PROBE_URL || DEFAULT_PROBE_URL;
  const syncToken = process.env.BASE44_SYNC_TOKEN || '';

  if (!syncToken) {
    return res.status(503).json({
      service: 'hpi-recovery-heartbeat',
      state: 'BLOCKED',
      mutation_performed: false,
      failover_armed: false,
      observed_at: observedAt,
      reason: 'BASE44_SYNC_TOKEN is not configured for the recovery probe.',
    });
  }

  const probe = await fetchJson(probeUrl, {
    headers: { Authorization: `Bearer ${syncToken}`, Accept: 'application/json' },
  });

  const githubHeaders = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'HPI-Recovery-Heartbeat',
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
  const github = await fetchJson(`https://api.github.com/repos/${CANONICAL_REPO}/branches/${CANONICAL_BRANCH}`, {
    headers: githubHeaders,
  });

  const heartbeat = probe.body?.heartbeat || null;
  const heartbeatAgeMs = heartbeat?.timestamp
    ? Math.max(0, Date.now() - new Date(heartbeat.timestamp).getTime())
    : null;
  const primaryHeartbeatStale = heartbeatAgeMs == null || heartbeatAgeMs > MAX_PRIMARY_HEARTBEAT_AGE_MS;
  const canonicalSha = github.body?.commit?.sha || null;
  const sourceDrift = Boolean(heartbeat?.source_sha && canonicalSha && heartbeat.source_sha !== canonicalSha);

  const issues = [];
  if (!probe.ok) issues.push(`base44_probe_http_${probe.status || 'error'}`);
  if (primaryHeartbeatStale) issues.push('primary_heartbeat_stale');
  if (!github.ok) issues.push(`github_probe_http_${github.status || 'error'}`);
  if (sourceDrift) issues.push('source_sha_drift');

  const state = issues.length === 0
    ? 'HEALTHY'
    : primaryHeartbeatStale
      ? 'PRIMARY_HEARTBEAT_STALE'
      : 'DEGRADED';

  return res.status(issues.length === 0 ? 200 : 503).json({
    service: 'hpi-recovery-heartbeat',
    state,
    mutation_performed: false,
    failover_armed: false,
    observed_at: observedAt,
    thresholds: { max_primary_heartbeat_age_ms: MAX_PRIMARY_HEARTBEAT_AGE_MS },
    primary: {
      probe_ok: probe.ok,
      probe_status: probe.status,
      probe_duration_ms: probe.duration_ms,
      heartbeat_id: heartbeat?.heartbeat_id || null,
      heartbeat_timestamp: heartbeat?.timestamp || null,
      heartbeat_age_ms: heartbeatAgeMs,
      source_sha: heartbeat?.source_sha || null,
    },
    source_truth: {
      repo: CANONICAL_REPO,
      branch: CANONICAL_BRANCH,
      github_ok: github.ok,
      github_status: github.status,
      canonical_sha: canonicalSha,
      source_drift: sourceDrift,
    },
    issues,
    next_action: issues.length === 0
      ? 'Continue monitoring. No failover action permitted.'
      : 'Record incident evidence and require governed recovery approval before any consequential failover write.',
  });
}
