import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { CERTIFIER } from '../../shared/specialistSwarm.ts';

/**
 * INDEPENDENT RELEASE VALIDATOR (Specialist 14)
 *
 * The ONLY entity permitted to certify a repair as PASS.
 * Never the same worker that generated the repair (enforced: repair_agent != CERTIFIER.id).
 *
 * Deterministic-first: checks evidence presence, SHA stamp, and test results.
 * LLM opinion is never sufficient for PASS — evidence is required.
 */

function uid(prefix: string) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }

export default async function(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    if (!body || typeof body !== 'object' || Array.isArray(body)) {

      return Response.json({ error: 'JSON object body required' }, { status: 400 });

    }
    const { repair_id, finding_id, repair_agent, test_results, source_sha } = body;

    if (!repair_id || !finding_id || !repair_agent) {
      return Response.json({ error: 'repair_id, finding_id, repair_agent required' }, { status: 400 });
    }

    // Independence guard — validator must differ from repair agent
    if (repair_agent === CERTIFIER.id) {
      return Response.json({
        validation_id: uid('val'), repair_id, finding_id, validator_agent: CERTIFIER.id,
        independent: false, verdict: 'blocked', source_sha: source_sha || null,
        reasoning: 'Self-certification forbidden: repair agent cannot be the validator.',
        timestamp: new Date().toISOString(),
      });
    }

    // Deterministic checks
    const hasEvidence = test_results && Object.keys(test_results).length > 0;
    const hasSha = !!source_sha;
    const testPassed = test_results?.status !== 'error' && test_results?.status !== 'failed';

    let verdict: 'pass' | 'fail' | 'blocked' = 'fail';
    const reasoning: string[] = [];
    if (!hasEvidence) reasoning.push('No test evidence provided — cannot PASS without evidence.');
    if (!hasSha) reasoning.push('No source SHA stamped — cannot certify without provenance.');
    if (!testPassed) reasoning.push(`Repair test status: ${test_results?.status || 'unknown'}.`);
    if (hasEvidence && hasSha && testPassed) {
      verdict = 'pass';
      reasoning.push('Evidence present, SHA stamped, tests passed.');
    }
    if (!hasEvidence || !hasSha) verdict = 'blocked';

    return Response.json({
      validation_id: uid('val'), repair_id, finding_id, validator_agent: CERTIFIER.id,
      independent: true, verdict, test_results, regression_results: null,
      evidence_refs: verdict === 'pass' ? [repair_id] : [],
      source_sha: source_sha || null,
      reasoning: reasoning.join(' '),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('independentValidate error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}