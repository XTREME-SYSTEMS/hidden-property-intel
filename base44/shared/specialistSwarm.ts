/**
 * SPECIALIST SWARM REGISTRY — 14 reusable specialists for Alpha Prime.
 *
 * Each specialist has a constrained charter. No specialist may mark its own work RELEASE PASS.
 * The Independent Release Validator (14) is the only entity that certifies.
 *
 * Alpha Prime dispatches a specialist by calling agentThink with the specialist's
 * mission/scope, then routes the output through the sensitive-action firewall.
 */

export type RiskClass = 'safe' | 'reversible' | 'consequential' | 'irreversible';
export type EscalationPolicy = 'auto_close' | 'escalate_on_fail' | 'always_escalate' | 'human_required';

export interface Specialist {
  id: string;
  name: string;
  role: string;
  mission: string;
  scope: string[];
  allowed_tools: string[];
  forbidden_actions: string[];
  input_schema: string;
  output_schema: string;
  budget_tokens: number;
  timeout_seconds: number;
  risk_class: RiskClass;
  escalation: EscalationPolicy;
  can_certify_release: boolean;
}

const S = (
  id: string, name: string, role: string,
  mission: string, scope: string[], allowed: string[], forbidden: string[],
  budget: number, timeout: number, risk: RiskClass, escalation: EscalationPolicy,
): Specialist => ({
  id, name, role, mission, scope,
  allowed_tools: allowed, forbidden_actions: forbidden,
  input_schema: '{ finding_id, subsystem, context }',
  output_schema: '{ diagnosis, root_cause, repair_plan, evidence, risk }',
  budget_tokens: budget, timeout_seconds: timeout, risk_class: risk, escalation,
  can_certify_release: false,
});

export const SPECIALIST_SWARM: Specialist[] = [
  S('s01_source_truth', 'Source Truth Sentinel', 'guardian',
    'Verify GitHub/Base44 sync, record SHA on every receipt, detect drift.',
    ['git_sync', 'sha_stamp', 'change_detection'],
    ['read', 'diff', 'sha_lookup'], ['mutate_source', 'force_push'],
    4000, 30, 'safe', 'escalate_on_fail'),

  S('s02_frontend_pwa', 'Frontend + PWA Specialist', 'frontend',
    'Repair render failures, console errors, PWA manifest/SW, responsive layout.',
    ['frontend', 'pwa', 'accessibility'],
    ['edit_src', 'build', 'preview', 'axe_scan'], ['deploy_prod', 'rls_change'],
    8000, 120, 'reversible', 'escalate_on_fail'),

  S('s03_backend_api', 'Backend + API Specialist', 'backend',
    'Repair function boot errors, API smoke failures, input validation, timeout issues.',
    ['backend_functions', 'api', 'integrations'],
    ['edit_function', 'invoke_test', 'deploy_function'], ['schema_migration_prod', 'secret_change'],
    8000, 120, 'reversible', 'escalate_on_fail'),

  S('s04_security_rls', 'Security + RLS Specialist', 'security',
    'Repair RLS matrix failures, authz gaps, secret exposure, input-validation holes.',
    ['security', 'rls', 'auth'],
    ['rls_audit', 'secret_scan', 'input_audit'], ['disable_rls', 'weaken_auth', 'expose_secret'],
    6000, 90, 'consequential', 'always_escalate'),

  S('s05_data_acquisition', 'Data Acquisition Specialist', 'ingestion',
    'Repair scrape failures, source freshness, Florida-only guard, fallback chains.',
    ['scraping', 'browser_engine', 'sources'],
    ['run_scrape', 'browser_probe', 'source_audit'], ['scrape_outside_florida', 'disable_geo_guard'],
    8000, 180, 'reversible', 'escalate_on_fail'),

  S('s06_data_quality', 'Data Quality + Enrichment Specialist', 'data',
    'Repair title-risk, image, ownership, enrichment coverage gaps. Never fabricate data.',
    ['enrichment', 'title_risk', 'images', 'ownership'],
    ['coverage_audit', 'enrich', 'score'], ['fabricate_data', 'mark_unavailable_as_verified'],
    8000, 180, 'reversible', 'escalate_on_fail'),

  S('s07_billing', 'Billing + Transaction Specialist', 'payments',
    'Repair Stripe webhook, checkout, subscription flows. Test mode only unless approved.',
    ['stripe', 'checkout', 'subscriptions'],
    ['stripe_test_api', 'webhook_test', 'checkout_smoke'], ['real_charge', 'real_refund', 'live_key_swap'],
    4000, 60, 'irreversible', 'human_required'),

  S('s08_seo_aeo_perf', 'SEO + AEO + Performance Specialist', 'growth',
    'Repair sitemap, indexability, structured data, Core Web Vitals, Lighthouse regressions.',
    ['seo', 'aeo', 'performance', 'lighthouse'],
    ['seo_audit', 'sitemap_check', 'perf_measure'], ['cloaking', 'black_hat_seo'],
    6000, 120, 'reversible', 'escalate_on_fail'),

  S('s09_qa_e2e', 'QA + E2E Specialist', 'qa',
    'Run Playwright E2E, smoke tests, regression suites. Reproduce findings deterministically.',
    ['e2e', 'regression', 'smoke'],
    ['run_e2e', 'run_smoke', 'record_repro'], ['deploy_prod', 'mutate_data'],
    6000, 180, 'safe', 'escalate_on_fail'),

  S('s10_sre_observability', 'SRE + Observability Specialist', 'sre',
    'Repair log gaps, alerting, error intake, lease recovery, incident response.',
    ['observability', 'alerts', 'incidents'],
    ['log_probe', 'error_intake', 'lease_recover'], ['disable_alerting', 'delete_logs'],
    4000, 90, 'reversible', 'escalate_on_fail'),

  S('s11_ai_router', 'AI + Model Router Specialist', 'ai',
    'Repair AI gateway failures, model routing, cost optimization, fallback models.',
    ['ai_gateway', 'model_routing', 'cost'],
    ['gateway_probe', 'route_audit', 'cost_audit'], ['swap_to_expensive_model_default', 'disable_fallback'],
    6000, 90, 'reversible', 'escalate_on_fail'),

  S('s12_privacy_compliance', 'Privacy + Compliance Specialist', 'privacy',
    'Enforce retention, permissible-purpose gating, Florida jurisdiction, data minimization.',
    ['privacy', 'compliance', 'jurisdiction'],
    ['retention_audit', 'purpose_gate_audit'], ['extend_retention', 'bypass_purpose_gate'],
    4000, 60, 'consequential', 'always_escalate'),

  S('s13_red_team', 'Red Team Specialist', 'adversary',
    'Probe for authz bypass, injection, RLS escape, prompt injection, webhook forgery.',
    ['security', 'adversarial'],
    ['authz_probe', 'injection_test', 'rls_escape_test'], ['exploit_live_data', 'persist_backdoor'],
    6000, 120, 'consequential', 'always_escalate'),

  // The only certifier — never repairs, only validates
  S('s14_release_validator', 'Independent Release Validator', 'validator',
    'Independently validate repairs and certify release readiness. Never the same worker that generated the repair.',
    ['validation', 'certification'],
    ['run_validation', 'check_evidence', 'verify_sha'], ['self_certify', 'skip_evidence', 'mark_unknown_pass'],
    8000, 180, 'consequential', 'always_escalate'),
];

export const CERTIFIER = SPECIALIST_SWARM.find((s) => s.id === 's14_release_validator')!;

export function specialistFor(subsystem: string): Specialist {
  const map: Record<string, string> = {
    frontend: 's02_frontend_pwa', pwa: 's02_frontend_pwa',
    backend: 's03_backend_api', api: 's03_backend_api', functions: 's03_backend_api',
    security: 's04_security_rls', rls: 's04_security_rls', auth: 's04_security_rls',
    ingestion: 's05_data_acquisition', scraping: 's05_data_acquisition', browser: 's05_data_acquisition',
    data_quality: 's06_data_quality', enrichment: 's06_data_quality', title_risk: 's06_data_quality',
    payments: 's07_billing', stripe: 's07_billing',
    seo: 's08_seo_aeo_perf', performance: 's08_seo_aeo_perf',
    qa: 's09_qa_e2e', e2e: 's09_qa_e2e',
    observability: 's10_sre_observability', sre: 's10_sre_observability',
    ai: 's11_ai_router', ai_gateway: 's11_ai_router',
    privacy: 's12_privacy_compliance', compliance: 's12_privacy_compliance',
    source_truth: 's01_source_truth',
  };
  const id = map[subsystem] || 's03_backend_api';
  return SPECIALIST_SWARM.find((s) => s.id === id)!;
}

// Sensitive-action firewall
export type ActionClass = 'auto_allow' | 'requires_approval';

export function classifyAction(action: string): ActionClass {
  const auto = ['read', 'analyze', 'test', 'lint', 'typecheck', 'build', 'sandbox', 'preview', 'draft', 'branch_repair', 'validate', 'simulate', 'receipt'];
  const needs = ['production_deploy', 'schema_migration_prod', 'rls_change_prod', 'secret_modify', 'real_charge', 'real_refund', 'contract_deploy', 'contract_transaction', 'customer_messaging', 'outreach', 'social_publish', 'destructive_db', 'large_spend', 'irreversible_infra'];
  const a = action.toLowerCase();
  if (needs.some((n) => a.includes(n))) return 'requires_approval';
  if (auto.some((n) => a.includes(n))) return 'auto_allow';
  return 'requires_approval'; // conservative default at irreversible boundaries
}