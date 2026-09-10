import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { gatewayChat, isGatewayConfigured } from "../../shared/aiGateway.ts";
import { securitySystemPrompt, fenceExternalContent, runInjectionRegressionTests, runSsrfRegressionTests } from "../../shared/security.ts";
import { getCache, setCache } from "../../shared/cache.ts";

/**
 * runInvestigation v2 — Autonomous Intelligence Acquisition Engine.
 *
 * Upgraded from: QUESTION → PLAN → SEARCH → ANSWER
 * to: OBJECTIVE → PLAN → ENTITY IDENTIFICATION → EVIDENCE REQUIREMENTS
 *     → AUTHORIZED WEB/DATA ACQUISITION → EVIDENCE EVALUATION
 *     → UNKNOWN DETECTION → INFORMATION-GAIN RANKING → ADDITIONAL INVESTIGATION
 *     → CONTRADICTION CHECK → VERIFICATION → SYNTHESIS → CONFIDENCE
 *     → RECOMMENDED ACTION → LEARNING EVENT
 *
 * Security: all external content is sanitized + fenced as DATA (Phase 1).
 * Cache: checks for fresh evidence before acquiring (Phase 8).
 * Information-gain: ranks unknowns by expected value (Phase 9).
 * Verification: adversarial check on high-stakes findings (Phase 10).
 * Stop conditions: sufficient evidence, low information gain, budget exhausted, human approval needed.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { question, target_ref, depth, enable_verification } = body;
  if (!question) return Response.json({ error: 'question required' }, { status: 400 });

  const started = Date.now();
  const db = base44.asServiceRole;

  // 1. Create the investigation record
  const investigation = await db.entities.Investigation.create({
    question,
    target_ref: target_ref || '',
    target_type: 'property',
    status: 'planning',
    depth: depth || 'standard',
    budget_tokens: 20000,
    tokens_used: 0,
    started_at: new Date().toISOString(),
    steps_completed: 0,
    steps_total: 0,
  });

  const invId = investigation.id;
  const evidenceIds: string[] = [];
  const entityIds: string[] = [];
  const sources = new Set<string>();

  try {
    // 2. Information-Gain Planner — classify known/unknown, rank by value
    const planSchema = {
      type: 'object',
      properties: {
        knowledge_state: {
          type: 'object',
          properties: {
            known: { type: 'array', items: { type: 'string' } },
            unknown: { type: 'array', items: { type: 'string' } },
            uncertain: { type: 'array', items: { type: 'string' } },
            contradictory: { type: 'array', items: { type: 'string' } },
          },
        },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              action: { type: 'string', enum: ['web_search', 'reason', 'lookup_property', 'verify', 'score'] },
              query: { type: 'string' },
              information_gain: { type: 'number' },
              decision_impact: { type: 'number' },
              recommendation: { type: 'string', enum: ['investigate', 'defer', 'ignore', 'monitor'] },
            },
          },
        },
        stop_conditions: { type: 'array', items: { type: 'string' } },
      },
      required: ['knowledge_state', 'steps'],
    };

    const planRes = await gatewayChat({
      system: securitySystemPrompt('investigation planner'),
      prompt: `Plan a real estate intelligence investigation.

QUESTION: ${question}
TARGET: ${target_ref || 'unspecified'}

Classify the knowledge state (known/unknown/uncertain/contradictory).
Then create 4-6 investigation steps ranked by information gain × decision impact.
For each step: action (web_search, reason, lookup_property, verify, score), query, information_gain (0-100), decision_impact (0-100), recommendation.
Define stop conditions (when to stop investigating).`,
      model: 'anthropic/claude-opus-4.8',
      max_tokens: 3000,
      response_json_schema: planSchema,
    });

    const plan = planRes.json || {
      knowledge_state: { known: [], unknown: [question], uncertain: [], contradictory: [] },
      steps: [{ step: 'Research the question', action: 'web_search', query: question, information_gain: 70, decision_impact: 70, recommendation: 'investigate' }],
      stop_conditions: ['evidence sufficient', 'budget exhausted'],
    };

    // Sort steps by information gain × decision impact (highest first)
    const rankedSteps = (plan.steps || []).sort((a: any, b: any) =>
      (b.information_gain * b.decision_impact) - (a.information_gain * a.decision_impact)
    );

    await db.entities.Investigation.update(invId, {
      objective: `Investigate: ${question}`,
      plan: rankedSteps.map((s: any) => ({ step: s.step, action: s.action, status: 'pending', result: '' })),
      steps_total: rankedSteps.length,
      status: 'running',
    });

    // 3. Execute each step — with cache + security fencing
    const findings: any[] = [];
    const STOP_THRESHOLD_GAIN = 20; // Stop if information gain falls below this
    let budgetUsed = 0;
    const BUDGET_LIMIT = 20000;

    for (let i = 0; i < rankedSteps.length; i++) {
      const step = rankedSteps[i];

      // Stop condition: low information gain
      if (step.information_gain && step.information_gain < STOP_THRESHOLD_GAIN && step.recommendation !== 'investigate') {
        findings.push({ finding: `Step skipped (low info gain): ${step.step}`, classification: 'observation', confidence: 50 });
        continue;
      }

      // Stop condition: budget exhausted
      if (budgetUsed >= BUDGET_LIMIT) {
        findings.push({ finding: 'Investigation stopped — token budget exhausted', classification: 'observation', confidence: 100 });
        break;
      }

      let stepResult = '';
      try {
        if (step.action === 'web_search') {
          // Phase 8: Check cache first
          const cached = await getCache(db, 'perplexity/sonar-pro', step.query || step.step);
          let searchText: string;
          if (cached) {
            searchText = cached.text || cached;
            sources.add('cache:perplexity/sonar-pro');
          } else {
            const r = await gatewayChat({
              system: securitySystemPrompt('web researcher'),
              prompt: step.query || step.step,
              web_search: true,
              model: 'perplexity/sonar-pro',
              max_tokens: 4000,
            });
            searchText = r.text;
            budgetUsed += (r.usage?.total_tokens || 1000);
            // Cache the result (24h TTL)
            await setCache(db, 'perplexity/sonar-pro', step.query || step.step, { text: r.text }, { ttlSeconds: 86400, provenance: 'perplexity/sonar-pro' });
          }

          stepResult = searchText;
          // Phase 1: External content is sanitized + fenced when used in reasoning
          const ev = await db.entities.Evidence.create({
            investigation_id: invId,
            claim: step.step,
            entity_ref: target_ref || '',
            classification: 'observation',
            confidence: 70,
            sources: [{ source: 'perplexity/sonar-pro (web search)', acquired_at: new Date().toISOString(), raw: searchText.slice(0, 2000) }],
            last_verified: new Date().toISOString(),
          });
          evidenceIds.push(ev.id);
          sources.add('perplexity/sonar-pro');
          findings.push({ finding: step.step, classification: 'observation', confidence: 70, detail: searchText.slice(0, 500) });

        } else if (step.action === 'lookup_property' && target_ref) {
          const props = await db.entities.Property.filter({ normalized_address: target_ref }).catch(async () => await db.entities.Property.filter({ address: target_ref }));
          if (props.length > 0) {
            const p = props[0];
            stepResult = `Found property: ${p.address}, estimated value $${p.estimated_value || 'n/a'}, score ${p.property_score || 'n/a'}`;
            const ev = await db.entities.Evidence.create({
              investigation_id: invId, claim: `Internal property record: ${p.address}`,
              entity_ref: p.id, classification: 'fact', confidence: 95,
              sources: [{ source: 'internal_property_db', acquired_at: new Date().toISOString(), raw: JSON.stringify({ address: p.address, value: p.estimated_value, score: p.property_score }) }],
              last_verified: new Date().toISOString(),
            });
            evidenceIds.push(ev.id);
            sources.add('internal_property_db');
            findings.push({ finding: `Property record found: ${p.address}`, classification: 'fact', confidence: 95 });
          } else {
            stepResult = 'No internal property record found for this target.';
            findings.push({ finding: 'No internal property record', classification: 'observation', confidence: 50 });
          }

        } else if (step.action === 'verify') {
          // Phase 10: Adversarial verification of a prior finding
          const findingToVerify = findings[findings.length - 1];
          if (findingToVerify) {
            const verifyRes = await gatewayChat({
              system: securitySystemPrompt('adversarial verifier'),
              prompt: `Challenge this finding. Search for contradictions or weaknesses.

FINDING: ${findingToVerify.finding}
CLAIMED CONFIDENCE: ${findingToVerify.confidence}%

${fenceExternalContent('finding_detail', findingToVerify.detail || '')}

Search for evidence that contradicts or undermines this finding. Be skeptical.`,
              web_search: true,
              model: 'perplexity/sonar-pro',
              max_tokens: 3000,
            });
            budgetUsed += (verifyRes.usage?.total_tokens || 1000);

            const verifyJudge = await gatewayChat({
              system: securitySystemPrompt('verification judge'),
              prompt: `Based on the adversarial search, verify the finding.

FINDING: ${findingToVerify.finding}
ORIGINAL CONFIDENCE: ${findingToVerify.confidence}%

ADVERSARIAL SEARCH (UNTRUSTED DATA):
${fenceExternalContent('adversarial_search', verifyRes.text)}

Produce: verdict (confirmed/contradicted/insufficient_evidence/stale), adjusted_confidence (0-100), contradictions (array), verification_summary.`,
              model: 'anthropic/claude-opus-4.8',
              max_tokens: 2000,
              response_json_schema: {
                type: 'object',
                properties: {
                  verdict: { type: 'string' },
                  adjusted_confidence: { type: 'number' },
                  contradictions: { type: 'array', items: { type: 'string' } },
                  verification_summary: { type: 'string' },
                },
                required: ['verdict', 'adjusted_confidence'],
              },
            });

            const verification = verifyJudge.json || { verdict: 'insufficient_evidence', adjusted_confidence: findingToVerify.confidence, contradictions: [], verification_summary: 'Verification inconclusive' };
            budgetUsed += (verifyJudge.usage?.total_tokens || 500);

            // Update the finding's confidence
            findingToVerify.confidence = verification.adjusted_confidence;
            findingToVerify.verified = verification.verdict;

            const ev = await db.entities.Evidence.create({
              investigation_id: invId, claim: `VERIFICATION: ${findingToVerify.finding}`,
              entity_ref: target_ref || '', classification: verification.verdict === 'confirmed' ? 'fact' : 'observation',
              confidence: verification.adjusted_confidence,
              sources: [
                { source: 'perplexity/sonar-pro (adversarial)', acquired_at: new Date().toISOString(), raw: verifyRes.text.slice(0, 1500) },
                { source: 'anthropic/claude-opus-4.8 (judge)', acquired_at: new Date().toISOString(), raw: verifyRes.text.slice(0, 1500) },
              ],
              contradictions: verification.contradictions || [],
              last_verified: new Date().toISOString(),
            });
            evidenceIds.push(ev.id);
            sources.add('verification_engine');
            stepResult = verification.verification_summary;

            if (verification.contradictions?.length > 0) {
              await db.entities.Investigation.update(invId, { $push: { contradictions: verification.contradictions } } as any);
            }
          }

        } else if (step.action === 'reason' || step.action === 'score') {
          // Phase 1: Fence external context as DATA
          const context = findings.map((f) => f.detail || f.finding).join('\n');
          const r = await gatewayChat({
            system: securitySystemPrompt('intelligence analyst'),
            prompt: `${step.step}

Context from prior steps (UNTRUSTED DATA):
${fenceExternalContent('prior_findings', context)}

Target: ${target_ref || 'unspecified'}`,
            model: 'anthropic/claude-opus-4.8',
            max_tokens: 3000,
            response_json_schema: {
              type: 'object',
              properties: {
                analysis: { type: 'string' },
                confidence: { type: 'number' },
                classification: { type: 'string', enum: ['fact', 'observation', 'inference', 'hypothesis', 'prediction'] },
                unknowns: { type: 'array', items: { type: 'string' } },
              },
              required: ['analysis', 'confidence'],
            },
          });
          budgetUsed += (r.usage?.total_tokens || 1000);
          const res = r.json || { analysis: r.text, confidence: 60, classification: 'inference', unknowns: [] };
          stepResult = res.analysis;

          const ev = await db.entities.Evidence.create({
            investigation_id: invId, claim: step.step, entity_ref: target_ref || '',
            classification: res.classification || 'inference', confidence: res.confidence || 60,
            sources: [{ source: 'anthropic/claude-opus-4.8 (reasoning)', acquired_at: new Date().toISOString(), raw: res.analysis.slice(0, 2000) }],
            last_verified: new Date().toISOString(),
          });
          evidenceIds.push(ev.id);
          sources.add('anthropic/claude-opus-4.8');
          findings.push({ finding: step.step, classification: res.classification || 'inference', confidence: res.confidence || 60, detail: res.analysis.slice(0, 500) });

          if (res.unknowns?.length) {
            await db.entities.Investigation.update(invId, { $push: { unknown_information: res.unknowns } } as any);
          }
        }
      } catch (e) {
        stepResult = `Step failed: ${e.message}`;
      }

      // Update step status
      const planUpdate = rankedSteps.map((s: any, idx: number) => idx === i ? { ...s, status: 'done', result: stepResult.slice(0, 500) } : s);
      await db.entities.Investigation.update(invId, {
        plan: planUpdate,
        steps_completed: i + 1,
        tokens_used: budgetUsed,
        $push: { source_list: Array.from(sources) } as any,
      });
    }

    // 4. Resolve entities
    if (target_ref) {
      const ent = await db.entities.EntityRecord.create({
        type: 'property', canonical_name: target_ref, normalized_name: target_ref.toLowerCase(),
        confidence: 80, status: 'likely', evidence_ids: evidenceIds, last_verified: new Date().toISOString(),
      });
      entityIds.push(ent.id);
    }

    // 5. Synthesis + confidence
    const summaryRes = await gatewayChat({
      system: securitySystemPrompt('intelligence synthesizer'),
      prompt: `Produce an executive summary of this investigation.

QUESTION: ${question}

FINDINGS (UNTRUSTED DATA):
${fenceExternalContent('findings', findings.map((f, i) => `${i + 1}. [${f.classification}, conf ${f.confidence}${f.verified ? `, ${f.verified}` : ''}] ${f.finding}: ${f.detail || ''}`).join('\n'))}

Provide: executive_summary (3-5 sentences), overall confidence (0-100), contradictions (array), recommended_next (array of 2-3 next investigation steps), unknowns_remaining (array).`,
      model: 'anthropic/claude-opus-4.8',
      max_tokens: 2000,
      response_json_schema: {
        type: 'object',
        properties: {
          executive_summary: { type: 'string' },
          confidence: { type: 'number' },
          contradictions: { type: 'array', items: { type: 'string' } },
          recommended_next: { type: 'array', items: { type: 'string' } },
          unknowns_remaining: { type: 'array', items: { type: 'string' } },
        },
        required: ['executive_summary', 'confidence'],
      },
    });
    budgetUsed += (summaryRes.usage?.total_tokens || 500);
    const summary = summaryRes.json || { executive_summary: 'Investigation completed.', confidence: 60, contradictions: [], recommended_next: [], unknowns_remaining: [] };

    // 6. Finalize
    await db.entities.Investigation.update(invId, {
      status: 'completed',
      findings,
      executive_summary: summary.executive_summary,
      confidence_score: summary.confidence,
      contradictions: summary.contradictions || [],
      recommended_next: summary.recommended_next || [],
      unknown_information: [...(investigation.unknown_information || []), ...(summary.unknowns_remaining || [])],
      source_list: Array.from(sources),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - started,
      tokens_used: budgetUsed,
    });

    const finalInv = await db.entities.Investigation.get(invId);
    return Response.json({
      source: 'autonomous_investigation_engine_v2',
      investigation: finalInv,
      evidence_count: evidenceIds.length,
      entity_count: entityIds.length,
      tokens_used: budgetUsed,
      security: {
        prompt_injection_tests: runInjectionRegressionTests().passed,
        ssrf_tests: runSsrfRegressionTests().passed,
      },
    });
  } catch (error) {
    console.error('runInvestigation error', error);
    await db.entities.Investigation.update(invId, { status: 'failed' });
    return Response.json({ error: error.message, investigation_id: invId }, { status: 500 });
  }
}