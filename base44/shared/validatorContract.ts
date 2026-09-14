/**
 * VALIDATOR CONTRACT — Universal deterministic validator interface.
 *
 * Every validator returns a ValidatorReceipt. Allowed statuses: PASS, FAIL, UNKNOWN, BLOCKED.
 *
 * RULES:
 *   - Missing execution = UNKNOWN.
 *   - Missing required evidence = UNKNOWN.
 *   - Tool unavailable = BLOCKED or UNKNOWN depending on cause.
 *   - Non-zero deterministic test exit = FAIL.
 *   - PASS requires evidence. Never infer PASS.
 *   - Never use an unrelated systemPreflight dimension score as replacement for a gate-specific validator.
 *   - Never average several gates into a synthetic release score.
 *
 * Source SHA lineage is mandatory evidence. Every receipt stamps source_sha.
 */

export type ValidatorStatus = 'PASS' | 'FAIL' | 'UNKNOWN' | 'BLOCKED';

export interface ValidatorReceipt {
  gate_id: string;
  status: ValidatorStatus;
  validator_id: string;
  validator_version: string;
  source_sha: string | null;
  metric_value: number | string | null;
  threshold: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  evidence_refs: string[];
  artifact_refs: string[];
  command_or_probe: string;
  exit_code: number | null;
  stdout_summary: string;
  stderr_summary: string;
  reason: string;
}

export interface GithubSecrets {
  GITHUB_REPO: string;
  GITHUB_TOKEN: string;
  GITHUB_BASE_BRANCH?: string;
}

export const CANONICAL_GITHUB_REPO = 'XTREME-SYSTEMS/hidden-property-intel';
export const CANONICAL_GITHUB_BRANCH = 'main';

export function nowIso(): string { return new Date().toISOString(); }

export function buildReceipt(
  partial: Partial<ValidatorReceipt> & { gate_id: string; validator_id: string },
): ValidatorReceipt {
  const started_at = partial.started_at || nowIso();
  const completed_at = partial.completed_at || nowIso();
  return {
    gate_id: partial.gate_id,
    status: partial.status || 'UNKNOWN',
    validator_id: partial.validator_id,
    validator_version: partial.validator_version || '1.0.0',
    source_sha: partial.source_sha ?? null,
    metric_value: partial.metric_value ?? null,
    threshold: partial.threshold || '',
    started_at,
    completed_at,
    duration_ms: partial.duration_ms ?? Math.max(0, new Date(completed_at).getTime() - new Date(started_at).getTime()),
    evidence_refs: partial.evidence_refs || [],
    artifact_refs: partial.artifact_refs || [],
    command_or_probe: partial.command_or_probe || '',
    exit_code: partial.exit_code ?? null,
    stdout_summary: partial.stdout_summary || '',
    stderr_summary: partial.stderr_summary || '',
    reason: partial.reason || '',
  };
}

function githubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'PropertyIntel-AlphaPrime-Validator',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * SOURCE SHA RESOLVER — canonical repo + main are immutable release authority.
 * Runtime values may supply authentication, but they may not redirect evidence lineage.
 * This function also rewrites the in-memory secret object so downstream probes in the same
 * validator run use the same canonical repo/branch authority.
 */
export async function resolveSourceSha(
  secrets: GithubSecrets,
): Promise<{ sha: string | null; branch: string; error?: string; statuses?: string[] }> {
  const configuredRepo = (secrets.GITHUB_REPO || '').trim();
  const configuredBranch = (secrets.GITHUB_BASE_BRANCH || '').trim();
  const token = secrets.GITHUB_TOKEN;
  const statuses: string[] = [];

  if (configuredRepo && configuredRepo !== CANONICAL_GITHUB_REPO) {
    statuses.push(`runtime_repo_mismatch:${configuredRepo}!=${CANONICAL_GITHUB_REPO}`);
  }
  if (configuredBranch && configuredBranch.toLowerCase() !== CANONICAL_GITHUB_BRANCH) {
    statuses.push(`runtime_branch_mismatch:${configuredBranch}!=${CANONICAL_GITHUB_BRANCH}`);
  }

  // Normalize the shared object for all downstream probes in this validator execution.
  secrets.GITHUB_REPO = CANONICAL_GITHUB_REPO;
  secrets.GITHUB_BASE_BRANCH = CANONICAL_GITHUB_BRANCH;

  const headers = githubHeaders(token);
  try {
    const r = await fetch(
      `https://api.github.com/repos/${CANONICAL_GITHUB_REPO}/branches/${CANONICAL_GITHUB_BRANCH}`,
      { headers },
    );
    if (r.ok) {
      const d = await r.json();
      if (d?.commit?.sha) {
        return { sha: d.commit.sha as string, branch: CANONICAL_GITHUB_BRANCH, statuses };
      }
    }
    statuses.push(`main:${r.status}`);
  } catch (e) {
    statuses.push(`main:ERR:${e.message}`);
  }

  return {
    sha: null,
    branch: CANONICAL_GITHUB_BRANCH,
    error: `could not resolve canonical HEAD for ${CANONICAL_GITHUB_REPO}@${CANONICAL_GITHUB_BRANCH}`,
    statuses,
  };
}

export interface CheckRun {
  name: string;
  status: string;
  conclusion: string | null;
  app: string;
  url: string;
}

/** Fetch GitHub Actions check runs for the canonical repository and exact source SHA. */
export async function fetchCheckRuns(secrets: GithubSecrets, sha: string): Promise<CheckRun[]> {
  if (!sha) return [];
  const headers = githubHeaders(secrets.GITHUB_TOKEN);
  try {
    const r = await fetch(`https://api.github.com/repos/${CANONICAL_GITHUB_REPO}/commits/${sha}/check-runs?per_page=100`, { headers });
    if (!r.ok) return [];
    const d = await r.json();
    return (d?.check_runs || []).map((c: any) => ({
      name: c.name,
      status: c.status,
      conclusion: c.conclusion,
      app: c.app?.slug || '',
      url: c.html_url || '',
    }));
  } catch {
    return [];
  }
}

/** Match a check run by name (case-insensitive substring). */
export function findCheckRun(checkRuns: CheckRun[], pattern: string): CheckRun | null {
  const p = pattern.toLowerCase();
  return checkRuns.find((c) => c.name.toLowerCase().includes(p)) || null;
}

export interface SchedulerEntry {
  id: string;
  authority: string;
  schedule: string;
  consequential: boolean;
  conflicts_with_governor: boolean;
  config_reference: string;
  proposed_consolidation: string;
}

/**
 * Deterministic recurring-scheduler inventory.
 *
 * This list is intentionally exhaustive for the scheduler surfaces discovered by
 * scripts/alpha-prime/scheduler-surface-audit.mjs. The Convergence Heartbeat is the
 * sole allowed recurring governor. Every other recurring operational authority stays
 * FAIL evidence until it is actually consolidated/disabled under the approved release
 * procedure with rollback receipts. Do not delete rows merely to make the gate green.
 */
export const SCHEDULER_INVENTORY: SchedulerEntry[] = [
  {
    id: 'alpha_prime_heartbeat',
    authority: 'base44/workflows/Convergence Heartbeat.jsonc',
    schedule: '*/5 * * * *',
    consequential: true,
    conflicts_with_governor: false,
    config_reference: 'trigger.config.cron_expression = */5 * * * *',
    proposed_consolidation: 'This IS the governor — no action.',
  },
  {
    id: 'base44_daily_followup',
    authority: 'base44/workflows/Daily Follow-Up Engine.jsonc',
    schedule: '0 8 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'Daily Follow-Up Engine trigger.config.cron_expression = 0 8 * * *',
    proposed_consolidation: 'Route the due follow-up queue through Alpha Prime; disable the standalone production schedule only under the approved consolidation with rollback receipt.',
  },
  {
    id: 'base44_daily_maintenance',
    authority: 'base44/workflows/Daily Maintenance.jsonc',
    schedule: '0 6 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'Daily Maintenance trigger.config.cron_expression = 0 6 * * *',
    proposed_consolidation: 'Route maintenance through the Alpha Prime due-job scheduler; disable the standalone schedule only with rollback receipt.',
  },
  {
    id: 'base44_daily_outreach',
    authority: 'base44/workflows/Daily Outreach.jsonc',
    schedule: '0 3 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'Daily Outreach trigger.config.cron_expression = 0 3 * * *',
    proposed_consolidation: 'Route outreach eligibility through Alpha Prime. Customer messaging remains separately approval-gated; disable only the duplicate scheduler under approved consolidation.',
  },
  {
    id: 'base44_daily_scrape_pipeline',
    authority: 'base44/workflows/Daily Scrape Pipeline.jsonc',
    schedule: '0 */3 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'Daily Scrape Pipeline trigger.config.cron_expression = 0 */3 * * *',
    proposed_consolidation: 'Route scrape work through Alpha Prime due-job slots; disable the standalone production schedule only with rollback receipt.',
  },
  {
    id: 'base44_draft_property_processor',
    authority: 'base44/workflows/Draft Property Processor.jsonc',
    schedule: '0 * * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'Draft Property Processor trigger.config.cron_expression = 0 * * * *',
    proposed_consolidation: 'Route draft processing through Alpha Prime hourly work; disable the standalone schedule only with rollback receipt.',
  },
  {
    id: 'base44_probate_pipeline',
    authority: 'base44/workflows/Probate Pipeline.jsonc',
    schedule: '0 6 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'Probate Pipeline trigger.config.cron_expression = 0 6 * * *',
    proposed_consolidation: 'Route probate ingestion through Alpha Prime daily work; disable the standalone schedule only with rollback receipt.',
  },
  {
    id: 'base44_property_cross_reference',
    authority: 'base44/workflows/Property Cross-Reference.jsonc',
    schedule: '0 5 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'Property Cross-Reference trigger.config.cron_expression = 0 5 * * *',
    proposed_consolidation: 'Route cross-reference work through Alpha Prime; disable the standalone schedule only with rollback receipt.',
  },
  {
    id: 'base44_property_enrichment_engine',
    authority: 'base44/workflows/Property Enrichment Engine.jsonc',
    schedule: '0 */6 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'Property Enrichment Engine trigger.config.cron_expression = 0 */6 * * *',
    proposed_consolidation: 'Route enrichment work through Alpha Prime due-job slots; disable the standalone schedule only with rollback receipt.',
  },
  {
    id: 'base44_property_image_ingestion',
    authority: 'base44/workflows/Property Image Ingestion.jsonc',
    schedule: '*/30 * * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'Property Image Ingestion trigger.config.cron_expression = */30 * * * *',
    proposed_consolidation: 'Route image ingestion through Alpha Prime smoke/due-job cadence; disable the standalone schedule only with rollback receipt.',
  },
  {
    id: 'base44_property_image_scraper',
    authority: 'base44/workflows/Property Image Scraper.jsonc',
    schedule: '0 */4 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'Property Image Scraper trigger.config.cron_expression = 0 */4 * * *',
    proposed_consolidation: 'Route image scraping through Alpha Prime; disable the standalone schedule only with rollback receipt.',
  },
  {
    id: 'base44_search_console_sync',
    authority: 'base44/workflows/Search Console Sync.jsonc',
    schedule: '0 6 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'Search Console Sync trigger.config.cron_expression = 0 6 * * *',
    proposed_consolidation: 'Route Search Console sync through Alpha Prime daily work; disable the standalone schedule only with rollback receipt.',
  },
  {
    id: 'base44_shadow_orchestrator',
    authority: 'base44/workflows/Shadow Orchestrator.jsonc',
    schedule: '0 */6 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'Shadow Orchestrator trigger.config.cron_expression = 0 */6 * * *',
    proposed_consolidation: 'Retire the duplicate orchestration authority after its responsibilities are explicitly mapped into Alpha Prime and rollback is captured.',
  },
  {
    id: 'base44_smart_contract_chain_sync',
    authority: 'base44/workflows/Smart Contract Chain Sync.jsonc',
    schedule: '0 * * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'Smart Contract Chain Sync trigger.config.cron_expression = 0 * * * *',
    proposed_consolidation: 'Route read-only chain sync through Alpha Prime; live contract execution remains separately prohibited without explicit approval.',
  },
  {
    id: 'base44_system_validation',
    authority: 'base44/workflows/System Validation.jsonc',
    schedule: '0 4 * * *',
    consequential: false,
    conflicts_with_governor: true,
    config_reference: 'System Validation trigger.config.cron_expression = 0 4 * * *',
    proposed_consolidation: 'Route validation through Alpha Prime benchmark/validation slots; disable the redundant schedule with rollback receipt.',
  },
  {
    id: 'vercel_trigger_scrape',
    authority: 'vercel-orchestrator/vercel.json',
    schedule: '0 */6 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'crons[0] = { path: /api/trigger-scrape, schedule: 0 */6 * * * }',
    proposed_consolidation: 'Migrate scrape trigger into Alpha Prime piggyback. Remove Vercel cron only under the approved production consolidation with rollback receipt.',
  },
  {
    id: 'vercel_mirror_supabase',
    authority: 'vercel-orchestrator/vercel.json',
    schedule: '*/30 * * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'crons[1] = { path: /api/mirror-to-supabase, schedule: */30 * * * * }',
    proposed_consolidation: 'Migrate Supabase mirror into Alpha Prime piggyback. Remove Vercel cron only under the approved production consolidation with rollback receipt.',
  },
  {
    id: 'railway_scraper_cron',
    authority: 'railway.json',
    schedule: '0 6 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'deploy.cronSchedule = 0 6 * * *',
    proposed_consolidation: 'Migrate Railway scraper dispatch into Alpha Prime. Remove Railway cron only under the approved production consolidation with rollback receipt.',
  },
];

export const WAVE1_VALIDATORS = [
  'ci.sha_stamped',
  'code.build',
  'code.lint',
  'code.typecheck',
  'workflows.heartbeat_active',
  'workflows.no_duplicate_cron',
];

export const VALIDATOR_VERSION = '1.3.0';
