/**
 * RELEASE CONSTITUTION — Hidden Property Intel
 * Canonical machine-readable gate matrix.
 *
 * RELEASE_READY = TRUE only when EVERY mandatory gate is PASS.
 * UNKNOWN never counts as PASS. No averaging.
 *
 * A gate is PASS only when evidence_refs is non-empty and the validator returned PASS.
 */

export type GateStatus = 'PASS' | 'FAIL' | 'UNKNOWN' | 'BLOCKED' | 'NOT_APPLICABLE';

export interface Gate {
  gate_id: string;
  category: GateCategory;
  mandatory: boolean;
  validator: string;        // function or check name that evaluates this gate
  test: string;             // what test is run
  threshold: string;        // pass condition
  evidence_required: boolean;
  current_status: GateStatus;
  last_passed_at: string | null;
  source_sha: string | null;
  artifact_refs: string[];
}

export type GateCategory =
  | 'CODE' | 'FRONTEND' | 'BACKEND' | 'AUTH' | 'RLS' | 'DATABASE' | 'DATA_QUALITY'
  | 'INGESTION' | 'AI' | 'AGENTS' | 'WORKFLOWS' | 'BROWSER' | 'PAYMENTS'
  | 'SMART_CONTRACTS' | 'SECURITY' | 'PRIVACY' | 'SEO' | 'PWA' | 'ACCESSIBILITY'
  | 'PERFORMANCE' | 'OBSERVABILITY' | 'RESILIENCE' | 'BACKUP' | 'ROLLBACK' | 'CI_CD';

const mk = (
  gate_id: string, category: GateCategory, mandatory: boolean,
  validator: string, test: string, threshold: string,
): Gate => ({
  gate_id, category, mandatory, validator, test, threshold,
  evidence_required: true, current_status: 'UNKNOWN',
  last_passed_at: null, source_sha: null, artifact_refs: [],
});

export const RELEASE_CONSTITUTION: Gate[] = [
  // CODE
  mk('code.lint', 'CODE', true, 'eslint', 'npm run lint', '0 errors'),
  mk('code.typecheck', 'CODE', true, 'tsc', 'tsc --noEmit', '0 errors'),
  mk('code.build', 'CODE', true, 'vite_build', 'npm run build', 'exit 0'),

  // FRONTEND
  mk('frontend.render', 'FRONTEND', true, 'e2e', 'Playwright home/listings/detail render', 'all routes load'),
  mk('frontend.no_console_errors', 'FRONTEND', true, 'e2e', 'console error scan on primary routes', '0 uncaught errors'),

  // BACKEND
  mk('backend.functions_deploy', 'BACKEND', true, 'deploy_check', 'all functions deploy without boot errors', '0 boot failures'),
  mk('backend.api_smoke', 'BACKEND', true, 'api_smoke', 'critical function invoke', '200 on core endpoints'),

  // AUTH
  mk('auth.login_flow', 'AUTH', true, 'e2e', 'login + register + reset flows', 'all complete'),
  mk('auth.session', 'AUTH', true, 'auth_smoke', 'session persistence', 'token valid'),

  // RLS
  mk('rls.admin_only_entities', 'RLS', true, 'rls_matrix', 'admin-only entities reject non-admin CRUD', '0 unauthorized successes'),
  mk('rls.user_isolation', 'RLS', true, 'rls_matrix', 'user-scoped entities isolate records', '0 cross-user reads'),

  // DATABASE
  mk('db.schema_valid', 'DATABASE', true, 'schema_check', 'entity schemas valid', '0 invalid schemas'),
  mk('db.no_oversized_fields', 'DATABASE', true, 'field_audit', 'no base64/blobs in entity fields', '0 oversized fields'),

  // DATA_QUALITY
  mk('dq.title_risk_coverage', 'DATA_QUALITY', false, 'coverage_audit', 'title-risk coverage of eligible properties', '>= 80%'),
  mk('dq.image_coverage', 'DATA_QUALITY', false, 'coverage_audit', 'image coverage of active properties', '>= 70%'),
  mk('dq.ownership_coverage', 'DATA_QUALITY', false, 'coverage_audit', 'ownership identified on active properties', '>= 75%'),

  // INGESTION
  mk('ingest.scrape_success', 'INGESTION', true, 'scrape_audit', 'scrape pipeline success rate', '>= 90% over 7d'),
  mk('ingest.florida_only', 'INGESTION', true, 'geo_guard', 'all scraped records within Florida', '0 out-of-state'),

  // AI
  mk('ai.gateway_available', 'AI', true, 'ai_gateway_probe', 'AI gateway responds', '200'),
  mk('ai.model_routing', 'AI', false, 'model_audit', 'cost-routed model usage logged', 'routing table present'),

  // AGENTS
  mk('agents.governance_loop', 'AGENTS', true, 'governance_audit', 'agent actions pass charter compliance', '0 unapproved consequential actions'),

  // WORKFLOWS
  mk('workflows.heartbeat_active', 'WORKFLOWS', true, 'workflow_status', 'convergence heartbeat scheduled', 'active'),
  mk('workflows.no_duplicate_cron', 'WORKFLOWS', true, 'cron_audit', 'no independent cron outside heartbeat governor', '0 rogue crons'),

  // BROWSER
  mk('browser.engine_reachable', 'BROWSER', false, 'browser_probe', 'browser engine responds', '200 or graceful fallback'),

  // PAYMENTS
  mk('payments.webhook_verified', 'PAYMENTS', true, 'webhook_test', 'Stripe webhook signature validates', 'verified'),
  mk('payments.checkout_smoke', 'PAYMENTS', true, 'checkout_smoke', 'checkout session creatable (test mode)', 'session created'),

  // SMART_CONTRACTS
  mk('contracts.deploy_safety', 'SMART_CONTRACTS', true, 'contract_audit', 'no unapproved mainnet deploys', '0 unapproved'),

  // SECURITY
  mk('security.secret_scan', 'SECURITY', true, 'secret_scan', 'no secrets in source', '0 leaked secrets'),
  mk('security.dependency_scan', 'SECURITY', true, 'dep_scan', 'no critical CVEs unfixed', '0 critical'),
  mk('security.input_validation', 'SECURITY', true, 'input_audit', 'all function inputs validated', '0 unvalidated endpoints'),

  // PRIVACY
  mk('privacy.retention_enforced', 'PRIVACY', false, 'retention_audit', 'skip-trace retention within policy', '0 expired retained'),

  // SEO
  mk('seo.sitemap_valid', 'SEO', false, 'sitemap_check', 'sitemap reachable + valid', 'valid XML'),
  mk('seo.indexability', 'SEO', false, 'index_audit', 'primary routes indexable', 'no noindex on landing'),

  // PWA
  mk('pwa.manifest_valid', 'PWA', false, 'pwa_audit', 'manifest + service worker valid', 'installable'),

  // ACCESSIBILITY
  mk('a11y.critical_violations', 'ACCESSIBILITY', false, 'axe_scan', 'axe critical violations on primary routes', '0 critical'),

  // PERFORMANCE
  mk('perf.load_time', 'PERFORMANCE', false, 'lighthouse', 'Lighthouse load time on home', '<= 3s LCP'),

  // OBSERVABILITY
  mk('obs.logs_available', 'OBSERVABILITY', true, 'log_probe', 'runtime logs accessible', 'logs streaming'),

  // RESILIENCE
  mk('resil.fallback_chain', 'RESILIENCE', true, 'fallback_audit', 'critical paths have fallback', '0 single-points-of-failure on core'),

  // BACKUP
  mk('backup.export_proof', 'BACKUP', false, 'backup_audit', 'recent intelligence archive exists', 'archive <= 7d old'),

  // ROLLBACK
  mk('rollback.method_recorded', 'ROLLBACK', true, 'rollback_audit', 'every repair receipt has rollback_method', '0 missing methods'),

  // CI_CD
  mk('ci.required_checks', 'CI_CD', true, 'ci_config', 'GitHub required checks configured', 'checks enforced'),
  mk('ci.sha_stamped', 'CI_CD', true, 'sha_audit', 'validation receipts stamp source SHA', '0 missing SHAs'),
];

export const mandatoryGates = RELEASE_CONSTITUTION.filter((g) => g.mandatory);

export function computeReleaseReady(gates: Gate[]): {
  release_ready: boolean;
  mandatory_pass: number;
  mandatory_total: number;
  failing: Gate[];
  unknown: Gate[];
} {
  const mandatory = gates.filter((g) => g.mandatory);
  const passing = mandatory.filter((g) => g.current_status === 'PASS');
  const failing = mandatory.filter((g) => g.current_status === 'FAIL' || g.current_status === 'BLOCKED');
  const unknown = mandatory.filter((g) => g.current_status === 'UNKNOWN');
  return {
    release_ready: passing.length === mandatory.length && failing.length === 0 && unknown.length === 0,
    mandatory_pass: passing.length,
    mandatory_total: mandatory.length,
    failing,
    unknown,
  };
}

export const GATE_CATEGORIES: GateCategory[] = [
  'CODE', 'FRONTEND', 'BACKEND', 'AUTH', 'RLS', 'DATABASE', 'DATA_QUALITY',
  'INGESTION', 'AI', 'AGENTS', 'WORKFLOWS', 'BROWSER', 'PAYMENTS',
  'SMART_CONTRACTS', 'SECURITY', 'PRIVACY', 'SEO', 'PWA', 'ACCESSIBILITY',
  'PERFORMANCE', 'OBSERVABILITY', 'RESILIENCE', 'BACKUP', 'ROLLBACK', 'CI_CD',
];