import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { gatewayChat, isGatewayConfigured } from "../../shared/aiGateway.ts";

/**
 * runInvestigation — Autonomous Intelligence Acquisition Engine.
 * Accepts a natural-language question + target, decomposes it into an
 * investigation plan, executes acquisition steps via the AI Gateway
 * (web search + reasoning), records every finding as Evidence with
 * provenance, resolves entities, builds relationships, scores confidence,
 * and produces an executive summary. Every conclusion is traceable to its
 * sources.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { question, target_ref, depth } = body;
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
    // 2. Decompose the question into an investigation plan
    const planSchema = {
      type: 'object',
      properties: {
        objective: { type: 'string' },
        steps: { type: 'array', items: { type: 'object', properties: {
          step: { type: 'string' },
          action: { type: 'string', enum: ['web_search', 'reason', 'lookup_property', 'score'] },
          query: { type: 'string' },
        }, required: ['step', 'action'] } },
      },
      required: ['objective', 'steps'],
    };

    const planRes = await gatewayChat({
      prompt: `Decompose this investigation question into 4-6 concrete acquisition/analysis steps. Target: "${target_ref || 'unspecified'}". Question: "${question}". For each step, choose action: web_search (live web research), reason (analysis/inference), lookup_property (check internal property DB), or score (opportunity scoring). Provide a specific query for web_search steps.`,
      web_search: false,
      model: 'anthropic/claude-opus-4.8',
      max_tokens: 2000,
      response_json_schema: planSchema,
    });

    const plan = planRes.json || { objective: question, steps: [{ step: 'Research the question', action: 'web_search', query: question }] };
    await db.entities.Investigation.update(invId, {
      objective: plan.objective,
      plan: plan.steps.map((s: any) => ({ step: s.step, action: s.action, status: 'pending', result: '' })),
      steps_total: plan.steps.length,
      status: 'running',
    });

    // 3. Execute each step
    const findings: any[] = [];
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      let stepResult = '';
      try {
        if (step.action === 'web_search') {
          const r = await gatewayChat({
            prompt: step.query || step.step,
            web_search: true,
            model: 'perplexity/sonar-pro',
            max_tokens: 4000,
          });
          stepResult = r.text;
          // Record evidence from the search
          const ev = await db.entities.Evidence.create({
            investigation_id: invId,
            claim: step.step,
            entity_ref: target_ref || '',
            classification: 'observation',
            confidence: 70,
            sources: [{ source: 'perplexity/sonar-pro (web search)', acquired_at: new Date().toISOString(), raw: r.text.slice(0, 2000) }],
            last_verified: new Date().toISOString(),
          });
          evidenceIds.push(ev.id);
          sources.add('perplexity/sonar-pro');
          findings.push({ finding: step.step, classification: 'observation', confidence: 70, detail: r.text.slice(0, 500) });
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
        } else if (step.action === 'reason' || step.action === 'score') {
          const context = findings.map((f) => f.detail || f.finding).join('\n');
          const r = await gatewayChat({
            prompt: `${step.step}\n\nContext from prior steps:\n${context}\n\nTarget: ${target_ref || 'unspecified'}`,
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
      const planUpdate = plan.steps.map((s: any, idx: number) => idx === i ? { ...s, status: 'done', result: stepResult.slice(0, 500) } : s);
      await db.entities.Investigation.update(invId, {
        plan: planUpdate,
        steps_completed: i + 1,
        $push: { source_list: Array.from(sources) } as any,
      });
    }

    // 4. Resolve entities (create EntityRecords for the target + discovered parties)
    if (target_ref) {
      const ent = await db.entities.EntityRecord.create({
        type: 'property', canonical_name: target_ref, normalized_name: target_ref.toLowerCase(),
        confidence: 80, status: 'likely', evidence_ids: evidenceIds, last_verified: new Date().toISOString(),
      });
      entityIds.push(ent.id);
    }

    // 5. Generate executive summary + confidence
    const summaryRes = await gatewayChat({
      prompt: `Produce an executive summary of this investigation. Question: "${question}". Findings:\n${findings.map((f, i) => `${i + 1}. [${f.classification}, conf ${f.confidence}] ${f.finding}: ${f.detail || ''}`).join('\n')}\n\nProvide: executive_summary (3-5 sentences), overall confidence (0-100), contradictions (array), recommended_next (array of 2-3 next investigation steps).`,
      model: 'anthropic/claude-opus-4.8',
      max_tokens: 2000,
      response_json_schema: {
        type: 'object',
        properties: {
          executive_summary: { type: 'string' },
          confidence: { type: 'number' },
          contradictions: { type: 'array', items: { type: 'string' } },
          recommended_next: { type: 'array', items: { type: 'string' } },
        },
        required: ['executive_summary', 'confidence'],
      },
    });
    const summary = summaryRes.json || { executive_summary: 'Investigation completed.', confidence: 60, contradictions: [], recommended_next: [] };

    // 6. Finalize
    await db.entities.Investigation.update(invId, {
      status: 'completed',
      findings,
      executive_summary: summary.executive_summary,
      confidence_score: summary.confidence,
      contradictions: summary.contradictions || [],
      recommended_next: summary.recommended_next || [],
      source_list: Array.from(sources),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - started,
    });

    const finalInv = await db.entities.Investigation.get(invId);
    return Response.json({
      source: 'autonomous_investigation_engine',
      investigation: finalInv,
      evidence_count: evidenceIds.length,
      entity_count: entityIds.length,
    });
  } catch (error) {
    console.error('runInvestigation error', error);
    await db.entities.Investigation.update(invId, { status: 'failed' });
    return Response.json({ error: error.message, investigation_id: invId }, { status: 500 });
  }
}