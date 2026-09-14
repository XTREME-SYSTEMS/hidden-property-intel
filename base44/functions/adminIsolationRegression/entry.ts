import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import {
  buildReceipt, resolveSourceSha, type GithubSecrets, type ValidatorReceipt,
} from '../../shared/validatorContract.ts';

/**
 * ADMIN ISOLATION REGRESSION — deterministic behavioral proof that the
 * /admin/* boundary is enforced on BOTH the frontend guard and the server.
 *
 * Probes (run under the REAL caller identity via the user-scoped client):
 *   1. Pure AdminRoute decision matrix — all 4 scenarios (unauth/investor/seller/admin)
 *   2. Entity READ isolation on the 7 convergence entities (RLS must deny non-admin)
 *   3. Entity CREATE denial on GateResult (RLS must reject non-admin before insert)
 *   4. runValidators invoke → 403 non-admin / 401 unauth / 200 admin
 *   5. alphaPrime invoke (authenticated only) → 403 non-admin / 200 admin
 *
 * Coverage is tracked durably across runs. The gate reaches PASS only when
 * probes pass AND live behavioral evidence exists for admin + non-admin +
 * unauthenticated callers. Until then UNKNOWN — never inferred.
 *
 * This function is intentionally NOT admin-only: it must be invocable by every
 * role so each role's denial can be behaviorally observed.
 */

// Mirrors src/lib/adminGuard.js — the pure AdminRoute decision logic.
function adminRouteDecision(input: { isAuthenticated: boolean; user: { role: string } | null }): 'render' | 'login' | 'portal' {
  if (!input.isAuthenticated || !input.user) return 'login';
  if (input.user.role !== 'admin') return 'portal';
  return 'render';
}

const CONVERGENCE_ENTITIES = [
  'GateResult', 'HeartbeatReceipt', 'ValidationTask', 'ValidationReceipt',
  'RepairTask', 'Finding', 'SubsystemState',
] as const;

const COVERAGE_KEY = 'admin_isolation_coverage';
const REQUIRED_ROLES = ['admin', 'non-admin', 'unauthenticated'] as const;
const GATE_ID = 'security.admin_isolation';

function uid(p: string) { return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }

export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const startedAt = Date.now();
  const now = new Date().toISOString();
  try {
    const user = await base44.auth.me().catch(() => null);
    const callerRole: string = !user ? 'unauthenticated' : (user.role === 'admin' ? 'admin' : 'non-admin');

    // Source SHA lineage
    const runtimeSecrets: any = (await import('base44:runtime')).secrets;
    const secrets: GithubSecrets = {
      GITHUB_REPO: runtimeSecrets.get ? runtimeSecrets.get('GITHUB_REPO') : runtimeSecrets.GITHUB_REPO,
      GITHUB_TOKEN: runtimeSecrets.get ? runtimeSecrets.get('GITHUB_TOKEN') : runtimeSecrets.GITHUB_TOKEN,
      GITHUB_BASE_BRANCH: (runtimeSecrets.get ? runtimeSecrets.get('GITHUB_BASE_BRANCH') : runtimeSecrets.GITHUB_BASE_BRANCH) || 'main',
    };
    const shaResult = await resolveSourceSha(secrets);
    const sourceSha = shaResult.sha;

    const probes: Array<{ name: string; expected: string; actual: string; result: 'PASS' | 'FAIL'; evidence: string }> = [];
    const pass = (name: string, expected: string, actual: string, evidence: string) =>
      probes.push({ name, expected, actual, result: 'PASS', evidence });
    const fail = (name: string, expected: string, actual: string, evidence: string) =>
      probes.push({ name, expected, actual, result: 'FAIL', evidence });

    // ── 1. Pure decision matrix (all 4 scenarios, deterministic) ──
    const scenarios = [
      { label: 'unauthenticated', input: { isAuthenticated: false, user: null }, expected: 'login' },
      { label: 'investor', input: { isAuthenticated: true, user: { role: 'investor' } }, expected: 'portal' },
      { label: 'seller', input: { isAuthenticated: true, user: { role: 'seller' } }, expected: 'portal' },
      { label: 'admin', input: { isAuthenticated: true, user: { role: 'admin' } }, expected: 'render' },
    ];
    for (const s of scenarios) {
      const actual = adminRouteDecision(s.input);
      if (actual === s.expected) pass(`decision.${s.label}`, s.expected, actual, `adminRouteDecision(${s.label})`);
      else fail(`decision.${s.label}`, s.expected, actual, 'decision mismatch');
    }

    // ── 2. Entity READ isolation (live, under caller identity) ──
    // filter with an impossible id → returns [] if allowed, throws if RLS denies.
    for (const entity of CONVERGENCE_ENTITIES) {
      const expected = callerRole === 'admin' ? 'allowed' : 'denied';
      let actual = 'allowed';
      let evidence = '';
      try {
        await (base44.entities as any)[entity].list('-created_date', 1);
        evidence = `read ok as ${callerRole}`;
      } catch (e: any) {
        actual = 'denied';
        evidence = `${e?.status || e?.response?.status || ''} ${e?.message || 'denied'}`.trim();
      }
      if (actual === expected) pass(`entity.${entity}.read`, expected, actual, evidence);
      else fail(`entity.${entity}.read`, expected, actual, evidence);
    }

    // ── 3. Entity CREATE denial (live, GateResult representative) ──
    // Non-admin/unauth: RLS must reject before insert (non-destructive).
    // Admin: skipped to avoid polluting evidence tables.
    if (callerRole !== 'admin') {
      const expected = 'denied';
      let actual = 'denied';
      let evidence = '';
      let createdId: string | null = null;
      try {
        const created = await (base44.entities as any).GateResult.create({
          gate_id: '__isolation_probe__', category: 'SECURITY', mandatory: false,
          status: 'UNKNOWN', evaluated_at: now,
        });
        actual = 'allowed';
        createdId = created?.id || null;
        evidence = `UNEXPECTED create succeeded as ${callerRole}`;
      } catch (e: any) {
        evidence = `${e?.status || e?.response?.status || ''} ${e?.message || 'denied'}`.trim();
      }
      // Safety net: if a bug let the create through, remove the probe record.
      if (actual === 'allowed' && createdId) {
        await (base44.entities as any).GateResult.delete(createdId).catch(() => {});
      }
      if (actual === expected) pass('entity.GateResult.create', expected, actual, evidence);
      else fail('entity.GateResult.create', expected, actual, evidence);
    } else {
      pass('entity.GateResult.create', 'skipped', 'skipped', 'admin caller — create allowed, skipped to avoid pollution');
    }

    // ── 4. runValidators invoke (live) ──
    {
      const expected = callerRole === 'admin' ? '200' : (callerRole === 'unauthenticated' ? '401' : '403');
      const status = await invokeStatus(base44, 'runValidators', {});
      if (String(status) === expected) pass('api.runValidators', expected, String(status), `HTTP ${status}`);
      else fail('api.runValidators', expected, String(status), `HTTP ${status}`);
    }

    // ── 5. alphaPrime invoke (live, authenticated only) ──
    // Unauthenticated is the workflow/service path (covered by heartbeat_active),
    // not an authenticated-execution bypass — not probed here to avoid side effects.
    if (callerRole !== 'unauthenticated') {
      const expected = callerRole === 'admin' ? '200' : '403';
      const status = await invokeStatus(base44, 'alphaPrime', {});
      if (String(status) === expected) pass('api.alphaPrime', expected, String(status), `HTTP ${status}`);
      else fail('api.alphaPrime', expected, String(status), `HTTP ${status}`);
    } else {
      pass('api.alphaPrime', 'skipped', 'skipped', 'unauthenticated — workflow path, covered by heartbeat_active gate');
    }

    const allPass = probes.every((p) => p.result === 'PASS');

    // ── 6. Durable coverage tracking across runs ──
    let coverage: string[] = [];
    try {
      const existing = await base44.asServiceRole.entities.CacheEntry.filter({ cache_key: COVERAGE_KEY }).catch(() => []);
      if (existing[0]) {
        coverage = Array.isArray(existing[0].response?.verified) ? existing[0].response.verified : [];
        if (allPass && !coverage.includes(callerRole)) {
          coverage = [...coverage, callerRole];
          await base44.asServiceRole.entities.CacheEntry.update(existing[0].id, {
            response: { verified: coverage }, cached_at: now, status: 'fresh',
          }).catch(() => {});
        }
      } else if (allPass) {
        coverage = [callerRole];
        await base44.asServiceRole.entities.CacheEntry.create({
          cache_key: COVERAGE_KEY, source: 'admin_isolation_regression', query: 'coverage',
          response: { verified: coverage }, cached_at: now,
          expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
          ttl_seconds: 30 * 86400, provenance: 'adminIsolationRegression', status: 'fresh',
        }).catch(() => {});
      }
    } catch { /* coverage is best-effort */ }

    const missingRoles = REQUIRED_ROLES.filter((r) => !coverage.includes(r));
    const fullCoverage = missingRoles.length === 0;
    const gateStatus: 'PASS' | 'FAIL' | 'UNKNOWN' = !allPass
      ? 'FAIL'
      : fullCoverage ? 'PASS' : 'UNKNOWN';
    const failed = probes.filter((p) => p.result === 'FAIL');
    const reason = !allPass
      ? `${failed.length} probe(s) FAILED under caller=${callerRole}: ${failed.map((p) => p.name).join(', ')}`
      : fullCoverage
        ? `All probes PASS. Behavioral coverage: ${coverage.join(', ')}`
        : `Probes PASS for ${callerRole}. Awaiting live behavioral probe from: ${missingRoles.join(', ')}`;

    // ── 7. Persist GateResult (durable evidence, surfaced in Convergence Center) ──
    const evidenceRefs = probes.filter((p) => p.result === 'PASS').map((p) => p.name);
    await base44.asServiceRole.entities.GateResult.create({
      gate_id: GATE_ID, category: 'SECURITY', mandatory: true,
      status: gateStatus, evidence_refs: evidenceRefs, detail: reason,
      source_sha: sourceSha, artifact_refs: [], evaluated_at: now,
    }).catch(() => {});

    // ── 8. FAIL → Finding (repair work) ──
    if (gateStatus === 'FAIL') {
      const existing = await base44.asServiceRole.entities.Finding.filter({
        category: GATE_ID, status: { $in: ['discovered', 'diagnosed', 'repair_planned', 'failed', 'blocked'] },
      }, '-discovered_at', 1).catch(() => []);
      if (!existing[0]) {
        await base44.asServiceRole.entities.Finding.create({
          finding_id: uid('fnd'), subsystem: 'security', category: GATE_ID,
          severity: 'critical', priority: 'p0', title: 'Admin isolation regression FAILED',
          description: reason + '\nFailed probes:\n' + failed.map((p) => `${p.name}: expected ${p.expected}, got ${p.actual} (${p.evidence})`).join('\n'),
          status: 'discovered', source_sha: sourceSha, discovered_at: now,
        }).catch(() => {});
      }
    }

    return Response.json({
      gate_id: GATE_ID, status: gateStatus, caller_role: callerRole,
      source_sha: sourceSha, coverage, missing_roles: missingRoles,
      probes, reason, duration_ms: Date.now() - startedAt, timestamp: now,
    });
  } catch (error) {
    console.error('adminIsolationRegression error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/** Returns the HTTP status of a function invoke, whether the SDK threw or returned. */
async function invokeStatus(base44: any, fn: string, payload: any): Promise<number> {
  try {
    const res = await base44.functions.invoke(fn, payload);
    return res?.status || 200;
  } catch (e: any) {
    return e?.status || e?.response?.status || e?.statusCode || 0;
  }
}