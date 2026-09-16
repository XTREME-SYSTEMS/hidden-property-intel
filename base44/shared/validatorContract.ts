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

/**
 * SOURCE SHA RESOLVER — obtains the exact current canonical Git SHA for the validated code.
 * Uses the GitHub branches API. Normalizes the base-branch secret (case-insensitive).
 * Never forges a SHA — returns null if resolution fails.
 */
export async function resolveSourceSha(
  secrets: GithubSecrets,
): Promise<{ sha: string | null; branch: string; error?: string }> {
  const { GITHUB_REPO, GITHUB_TOKEN, GITHUB_BASE_BRANCH } = secrets;
  if (!GITHUB_REPO || !GITHUB_TOKEN) {
    return { sha: null, branch: '', error: 'missing GITHUB_REPO or GITHUB_TOKEN' };
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'PropertyIntel-AlphaPrime-Validator',
  };
  const raw = (GITHUB_BASE_BRANCH || 'main').trim();
  const candidates = Array.from(new Set([raw, raw.toLowerCase(), 'main', 'master']));
  const statuses: string[] = [];
  for (const candidate of candidates) {
    try {
      const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/branches/${candidate}`, { headers });
      if (r.ok) {
        const d = await r.json();
        if (d?.commit?.sha) return { sha: d.commit.sha as string, branch: candidate, statuses };
      } else {
        const body = await r.text().catch(() => '');
        statuses.push(`${candidate}:${r.status}:${body.slice(0, 300)}`);
      }
    } catch (e) {
      statuses.push(`${candidate}:ERR:${e.message}`);
    }
  }
  // Fallback: repo default branch
  try {
    const rr = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, { headers });
    if (rr.ok) {
      const rd = await rr.json();
      const db = rd?.default_branch;
      if (db) {
        const r2 = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/branches/${db}`, { headers });
        if (r2.ok) {
          const d2 = await r2.json();
          if (d2?.commit?.sha) return { sha: d2.commit.sha as string, branch: db as string };
        }
      }
    }
  } catch { /* fallthrough */ }
  return { sha: null, branch: raw, error: 'could not resolve branch HEAD', statuses };
}

export interface CheckRun {
  name: string;
  status: string;
  conclusion: string | null;
  app: string;
  url: string;
}

/**
 * Fetch GitHub Actions check runs for a commit SHA.
 * Used by code.build / code.lint / code.typecheck validators to obtain deterministic CI evidence.
 * Returns [] if the API is unavailable or no check runs exist.
 */
export async function fetchCheckRuns(secrets: GithubSecrets, sha: string): Promise<CheckRun[]> {
  const { GITHUB_REPO, GITHUB_TOKEN } = secrets;
  if (!GITHUB_REPO || !GITHUB_TOKEN || !sha) return [];
  const headers: Record<string, string> = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'PropertyIntel-AlphaPrime-Validator',
  };
  try {
    const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits/${sha}/check-runs?per_page=100`, { headers });
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

/**
 * SCHEDULER INVENTORY — known scheduling authorities in the project.
 * Alpha Prime (Convergence Heartbeat) is the intended governor.
 * Conflicting schedulers are independent authorities capable of executing
 * consequential workflows concurrently outside the governor architecture.
 *
 * This inventory is deterministic evidence for the workflows.no_duplicate_cron gate.
 * When a conflicting scheduler is consolidated (removed/migrated under the governor),
 * update this inventory and the gate re-evaluates.
 */
export interface SchedulerEntry {
  id: string;
  authority: string;
  schedule: string;
  consequential: boolean;
  conflicts_with_governor: boolean;
  config_reference: string;
  proposed_consolidation: string;
}

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
    config_reference: 'trigger.config.cron_expression = 0 8 * * *',
    proposed_consolidation: 'Convert to Alpha Prime piggyback dispatch. Disabling recurrence remains protected and requires rollback receipt.',
  },
  {
    id: 'base44_daily_maintenance',
    authority: 'base44/workflows/Daily Maintenance.jsonc',
    schedule: '0 6 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'trigger.config.cron_expression = 0 6 * * *',
    proposed_consolidation: 'Convert to Alpha Prime piggyback dispatch. Disabling recurrence remains protected and requires rollback receipt.',
  },
  {
    id: 'base44_daily_outreach',
    authority: 'base44/workflows/Daily Outreach.jsonc',
    schedule: '0 3 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'trigger.config.cron_expression = 0 3 * * *',
    proposed_consolidation: 'Convert to Alpha Prime piggyback dispatch. Scheduler consolidation does not authorize customer messaging.',
  },
  {
    id: 'base44_daily_scrape_pipeline',
    authority: 'base44/workflows/Daily Scrape Pipeline.jsonc',
    schedule: '0 */3 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'trigger.config.cron_expression = 0 */3 * * *',
    proposed_consolidation: 'Convert to Alpha Prime due-job dispatch. Disabling recurrence remains protected and requires rollback receipt.',
  },
  {
    id: 'base44_draft_property_processor',
    authority: 'base44/workflows/Draft Property Processor.jsonc',
    schedule: '0 * * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'trigger.config.cron_expression = 0 * * * *',
    proposed_consolidation: 'Convert to Alpha Prime due-job dispatch. Disabling recurrence remains protected and requires rollback receipt.',
  },
  {
    id: 'base44_probate_pipeline',
    authority: 'base44/workflows/Probate Pipeline.jsonc',
    schedule: '0 6 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'trigger.config.cron_expression = 0 6 * * *',
    proposed_consolidation: 'Convert to Alpha Prime due-job dispatch. Disabling recurrence remains protected and requires rollback receipt.',
  },
  {
    id: 'base44_property_cross_reference',
    authority: 'base44/workflows/Property Cross-Reference.jsonc',
    schedule: '0 5 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'trigger.config.cron_expression = 0 5 * * *',
    proposed_consolidation: 'Convert to Alpha Prime due-job dispatch. Disabling recurrence remains protected and requires rollback receipt.',
  },
  {
    id: 'base44_property_enrichment_engine',
    authority: 'base44/workflows/Property Enrichment Engine.jsonc',
    schedule: '0 */6 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'trigger.config.cron_expression = 0 */6 * * *',
    proposed_consolidation: 'Convert to Alpha Prime piggyback dispatch. Disabling recurrence remains protected and requires rollback receipt.',
  },
  {
    id: 'base44_property_image_ingestion',
    authority: 'base44/workflows/Property Image Ingestion.jsonc',
    schedule: '*/30 * * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'trigger.config.cron_expression = */30 * * * *',
    proposed_consolidation: 'Convert to Alpha Prime piggyback dispatch. Disabling recurrence remains protected and requires rollback receipt.',
  },
  {
    id: 'base44_property_image_scraper',
    authority: 'base44/workflows/Property Image Scraper.jsonc',
    schedule: '0 */4 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'trigger.config.cron_expression = 0 */4 * * *',
    proposed_consolidation: 'Convert to Alpha Prime due-job dispatch. Disabling recurrence remains protected and requires rollback receipt.',
  },
  {
    id: 'base44_search_console_sync',
    authority: 'base44/workflows/Search Console Sync.jsonc',
    schedule: '0 6 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'trigger.config.cron_expression = 0 6 * * *',
    proposed_consolidation: 'Convert to Alpha Prime due-job dispatch. Disabling recurrence remains protected and requires rollback receipt.',
  },
  {
    id: 'base44_shadow_orchestrator',
    authority: 'base44/workflows/Shadow Orchestrator.jsonc',
    schedule: '0 */6 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'trigger.config.cron_expression = 0 */6 * * *',
    proposed_consolidation: 'Retire independent orchestration authority after equivalent Alpha Prime dispatch is proven and rollback is captured.',
  },
  {
    id: 'base44_smart_contract_chain_sync',
    authority: 'base44/workflows/Smart Contract Chain Sync.jsonc',
    schedule: '0 * * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'trigger.config.cron_expression = 0 * * * *',
    proposed_consolidation: 'Convert to Alpha Prime dispatch. Scheduler consolidation does not authorize live contract execution.',
  },
  {
    id: 'base44_system_validation',
    authority: 'base44/workflows/System Validation.jsonc',
    schedule: '0 4 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'trigger.config.cron_expression = 0 4 * * *',
    proposed_consolidation: 'Convert to Alpha Prime validation dispatch. Disabling recurrence remains protected and requires rollback receipt.',
  },
  {
    id: 'vercel_trigger_scrape',
    authority: 'vercel-orchestrator/vercel.json',
    schedule: '0 */6 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'crons[0] = { path: /api/trigger-scrape, schedule: 0 */6 * * * }',
    proposed_consolidation: 'Migrate scrape trigger into Alpha Prime piggyback. Remove Vercel cron only after protected-completion validation and rollback capture.',
  },
  {
    id: 'vercel_mirror_supabase',
    authority: 'vercel-orchestrator/vercel.json',
    schedule: '*/30 * * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'crons[1] = { path: /api/mirror-to-supabase, schedule: */30 * * * * }',
    proposed_consolidation: 'Migrate Supabase mirror into Alpha Prime piggyback. Remove Vercel cron only after protected-completion validation and rollback capture.',
  },
  {
    id: 'railway_scraper_cron',
    authority: 'railway.json',
    schedule: '0 6 * * *',
    consequential: true,
    conflicts_with_governor: true,
    config_reference: 'deploy.cronSchedule = 0 6 * * * (railway/scraper-cron.ts)',
    proposed_consolidation: 'Migrate Railway scraper into Alpha Prime due-job dispatch. Remove Railway cron only after protected-completion validation and rollback capture.',
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

export const VALIDATOR_VERSION = '1.0.0';
