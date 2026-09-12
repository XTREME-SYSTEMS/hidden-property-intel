import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import {
  validatePurposeGate, normalizeSeed, computeVerdict, detectContradictions,
  scoreIdentityMatch, scoreRelationshipMatch, scoreChannelOwnership,
  scoreContactEligibility, scoreTargetPriority, automationAllowed,
  independentConfirmations, freshnessDays,
  type PurposeGate, type EvidenceItem, type Score,
} from '../../shared/skipTraceSpec.ts';
import { runBrowserSearch, runAICorroboration, SEARCH_STRATEGIES } from '../../shared/skipTraceEngine.ts';

/**
 * skipTraceResolve — the NIST-aligned resolution orchestrator.
 *
 * Pipeline:
 *  1. Purpose gateway (reject if missing required fields)
 *  2. Seed normalization (Unicode, diacritics, phonetics, E.164, IDNA)
 *  3. Parallel source fan-out (browser strategies + AI corroboration)
 *  4. Five independent scores (never combined)
 *  5. Contradiction engine
 *  6. Verification verdict (VERIFIED / PROBABLE / AMBIGUOUS / CONFLICTED / SUPPRESSED / NOT_FOUND)
 *  7. Evidence provenance storage (every attribute: source, date, freshness)
 *  8. Automation gate (proceeds only when all gates pass)
 */
export default async function (req) {
  const startedAt = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { gate, seed_input, property_id, owner_id } = body;
    if (!gate) return Response.json({ error: 'Purpose gate required' }, { status: 400 });

    // ── 1. Purpose gateway (authorized_user is injected from the authenticated session) ──
    const purposeGate: PurposeGate = { ...gate, authorized_user: user.id };
    const gateCheck = validatePurposeGate(purposeGate);
    if (!gateCheck.passed) {
      return Response.json({ error: 'Purpose gate failed', violations: gateCheck.violations }, { status: 400 });
    }

    // ── 2. Seed normalization ──
    const seed = normalizeSeed(seed_input || {});

    // Enrich seed with property/owner context if provided
    let propertyAddress = '';
    if (property_id) {
      const prop = await base44.asServiceRole.entities.Property.get(property_id).catch(() => null);
      if (prop) {
        propertyAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
        if (!seed.address) seed.address = propertyAddress;
        if (!seed.zip) seed.zip = prop.zip_code;
      }
    }
    if (owner_id && !seed.name) {
      const owners = await base44.asServiceRole.entities.Owner.filter({ id: owner_id });
      if (owners[0]) seed.name = owners[0].name;
    }

    // ── Create the case record ──
    const caseId = `stc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const caseRecord = await base44.asServiceRole.entities.SkipTraceCase.create({
      case_id: caseId,
      case_type: purposeGate.case_type,
      authorized_user: user.id,
      jurisdiction: purposeGate.jurisdiction,
      permissible_purpose: purposeGate.permissible_purpose,
      intended_use: purposeGate.intended_use,
      retention_period_days: purposeGate.retention_period_days,
      permitted_outreach: purposeGate.permitted_outreach,
      seed: seed_input || {},
      status: 'running',
      started_at: new Date(startedAt).toISOString(),
    });

    // ── 3. Source fan-out: InvokeLLM web search (primary) + browser strategies (parallel) ──
    const secrets = (await import('base44:runtime')).secrets;
    const target = {
      name: seed.name || seed_input?.name,
      address: seed.address || propertyAddress,
      entity_type: seed.entity_type,
    };

    // Primary: InvokeLLM with live web search (uses restored integration credits)
    const llmPrompt = `You are an elite skip-trace analyst. Search the LIVE web for contact and identity information about this target:

TARGET:
Name: ${target.name || 'Unknown'}
Address: ${target.address || 'Unknown'}
Entity Type: ${target.entity_type || 'individual'}

Search public records, people-search sites, social media (LinkedIn, Facebook), business filings (Sunbiz, OpenCorporates), property records, and court records.

Find:
1. Phone numbers (with type: mobile/landline/voip)
2. Email addresses
3. Current and previous addresses
4. Relatives and associates
5. Social media profiles
6. Business affiliations (LLC officer, registered agent)

For EVERY finding, name the specific source site where you found it (e.g. "whitepages.com", "linkedin.com", "sunbiz.org"). Score each finding's confidence 0-100 based on corroboration.

CRITICAL: Only return information you actually found on the web. Do NOT invent or guess. If you cannot find something, return an empty array for that field.`;

    const llmPromise = base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: llmPrompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          phones: { type: 'array', items: { type: 'object', properties: { number: { type: 'string' }, type: { type: 'string' }, confidence: { type: 'number' }, source: { type: 'string' } } } },
          emails: { type: 'array', items: { type: 'object', properties: { address: { type: 'string' }, confidence: { type: 'number' }, source: { type: 'string' } } } },
          addresses: { type: 'array', items: { type: 'object', properties: { line: { type: 'string' }, type: { type: 'string' }, confidence: { type: 'number' }, source: { type: 'string' } } } },
          relatives: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, relationship: { type: 'string' }, confidence: { type: 'number' }, source: { type: 'string' } } } },
          associates: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string' }, confidence: { type: 'number' }, source: { type: 'string' } } } },
          social_profiles: { type: 'array', items: { type: 'object', properties: { platform: { type: 'string' }, url: { type: 'string' }, confidence: { type: 'number' } } } },
          business_affiliations: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, role: { type: 'string' }, status: { type: 'string' } } } },
          overall_confidence: { type: 'number' },
          executive_summary: { type: 'string' },
        },
      },
    }).catch((e) => ({ executive_summary: `LLM error: ${e.message}` }));

    // Secondary: browser strategies in parallel (cloudbrowser + browserbase fallback)
    const browserStrategies = SEARCH_STRATEGIES.filter((s) => s.method === 'browser');
    const strategyResults = await Promise.all(
      browserStrategies.map((s) => runBrowserSearch(s, target, secrets).catch((e) => ({ strategy: s.id, status: 'error', message: e.message })))
    );

    // Tertiary: external AI gateway corroboration of browser results (if configured)
    const gatewayRes: any = await runAICorroboration(target, strategyResults, secrets).catch((e) => ({ status: 'error', message: e.message }));

    // Merge: InvokeLLM web-search results are primary; gateway corroboration supplements
    const llmRes: any = await llmPromise;
    const aiResult: any = {
      phones: [...(llmRes.phones || []), ...(gatewayRes.phones || [])],
      emails: [...(llmRes.emails || []), ...(gatewayRes.emails || [])],
      addresses: [...(llmRes.addresses || []), ...(gatewayRes.addresses || [])],
      relatives: [...(llmRes.relatives || []), ...(gatewayRes.relatives || [])],
      associates: [...(llmRes.associates || []), ...(gatewayRes.associates || [])],
      social_profiles: [...(llmRes.social_profiles || []), ...(gatewayRes.social_profiles || [])],
      business_affiliations: [...(llmRes.business_affiliations || []), ...(gatewayRes.business_affiliations || [])],
      overall_confidence: llmRes.overall_confidence || gatewayRes.overall_confidence || 0,
      executive_summary: llmRes.executive_summary || gatewayRes.executive_summary || '',
    };

    // ── 4. Build evidence items with provenance ──
    const evidence: EvidenceItem[] = [];
    const now = new Date().toISOString();
    const collectedAt = aiResult?.executive_summary ? now : now;

    // Phones
    for (const p of (aiResult.phones || [])) {
      evidence.push({
        claim: `${target.name} reachable at ${p.number}`,
        attribute: 'phone',
        value: p.number,
        source: p.source || 'ai_corroboration',
        source_upstream: p.source || 'web_search',
        authority: 40,
        collected_at: collectedAt,
        freshness_days: 0,
        classification: 'observation',
      });
    }
    // Emails
    for (const e of (aiResult.emails || [])) {
      evidence.push({
        claim: `${target.name} reachable at ${e.address}`,
        attribute: 'email',
        value: e.address,
        source: e.source || 'ai_corroboration',
        source_upstream: e.source || 'web_search',
        authority: 40,
        collected_at: collectedAt,
        freshness_days: 0,
        classification: 'observation',
      });
    }
    // Addresses
    for (const a of (aiResult.addresses || [])) {
      evidence.push({
        claim: `${target.name} associated with address ${a.line}`,
        attribute: 'address',
        value: a.line,
        source: a.source || 'ai_corroboration',
        source_upstream: a.source || 'web_search',
        authority: 50,
        collected_at: collectedAt,
        freshness_days: 0,
        classification: 'observation',
      });
    }
    // Relatives / associates
    for (const r of [...(aiResult.relatives || []), ...(aiResult.associates || [])]) {
      evidence.push({
        claim: `${r.name} is a ${r.relationship || 'associate'} of ${target.name}`,
        attribute: 'relationship',
        value: r.name,
        source: r.source || 'ai_corroboration',
        source_upstream: r.source || 'web_search',
        authority: 30,
        collected_at: collectedAt,
        freshness_days: 0,
        classification: 'inference',
      });
    }
    // Business affiliations
    for (const b of (aiResult.business_affiliations || [])) {
      evidence.push({
        claim: `${target.name} affiliated with ${b.name} as ${b.role}`,
        attribute: 'business',
        value: b.name,
        source: 'ai_corroboration',
        source_upstream: 'web_search',
        authority: 45,
        collected_at: collectedAt,
        freshness_days: 0,
        classification: 'observation',
      });
    }

    // ── 5. Contradiction engine ──
    const contradictions = detectContradictions(evidence);

    // ── 6. The five independent scores ──
    const candidates = [{ name: target.name, address: target.address, phone: (aiResult.phones || [])[0]?.number, email: (aiResult.emails || [])[0]?.address }];
    const relationships = (aiResult.relatives || []).map((r) => ({ type: 'associated_with', target_name: r.name }));
    const channels = [
      ...(aiResult.phones || []).map((p) => ({ type: 'voice', value: p.number, ownership_verified: p.confidence >= 70, freshness_days: 0, dnc: false, consent: false, suppressed: false })),
      ...(aiResult.emails || []).map((e) => ({ type: 'email', value: e.address, ownership_verified: e.confidence >= 70, freshness_days: 0, dnc: false, consent: false, suppressed: false })),
    ];

    const scores: Score[] = [
      scoreIdentityMatch(seed, candidates),
      scoreRelationshipMatch(seed, relationships),
      scoreChannelOwnership(channels),
      scoreContactEligibility(purposeGate, channels),
      scoreTargetPriority({
        verified_need: !!property_id,
        expected_value: 0,
        freshness_days: 0,
        response_probability: 0.3,
        cost: 0,
      }),
    ];

    // ── 7. Independent source count (upstream-deduplicated) ──
    const independentSources = independentConfirmations(
      evidence.map((e) => ({ source: e.source, upstream: e.source_upstream }))
    );

    // ── 8. Verdict ──
    const verdict = computeVerdict(scores, contradictions, independentSources);
    const auto = automationAllowed(scores, verdict);

    // ── 9. Canonical record ──
    const canonical = {
      entity_id: null as string | null,
      canonical_name: target.name || seed.name,
      former_names: [],
      current_addresses: (aiResult.addresses || []).filter((a) => a.type === 'current').map((a) => a.line),
      former_addresses: (aiResult.addresses || []).filter((a) => a.type === 'previous').map((a) => a.line),
      companies: (aiResult.business_affiliations || []).map((b) => b.name),
      properties: property_id ? [property_id] : [],
      best_phone: (aiResult.phones || [])[0]?.number || null,
      best_email: (aiResult.emails || [])[0]?.address || null,
      best_address: (aiResult.addresses || [])[0]?.line || propertyAddress || null,
    };

    // Create / link EntityRecord
    let entity = null;
    if (canonical.canonical_name) {
      const existing = await base44.asServiceRole.entities.EntityRecord.filter({
        normalized_name: canonical.canonical_name.toLowerCase(),
        type: seed.entity_type === 'business' ? 'organization' : 'person',
      }).catch(() => []);
      if (existing[0]) {
        entity = existing[0];
        canonical.entity_id = entity.id;
      } else {
        entity = await base44.asServiceRole.entities.EntityRecord.create({
          type: seed.entity_type === 'business' ? 'organization' : 'person',
          canonical_name: canonical.canonical_name,
          normalized_name: canonical.canonical_name.toLowerCase(),
          aliases: [],
          confidence: scores.find((s) => s.kind === 'IDENTITY_MATCH')?.value ?? 0,
          status: verdict === 'VERIFIED' ? 'known' : verdict === 'PROBABLE' ? 'likely' : 'possible',
          properties: { best_phone: canonical.best_phone, best_email: canonical.best_email, best_address: canonical.best_address },
          last_verified: now,
        });
        canonical.entity_id = entity.id;
      }
    }

    // Store evidence items
    for (const e of evidence) {
      await base44.asServiceRole.entities.Evidence.create({
        investigation_id: caseId,
        claim: e.claim,
        entity_ref: canonical.canonical_name,
        classification: e.classification as any,
        confidence: e.authority,
        sources: [{ source: e.source, url: '', acquired_at: e.collected_at, raw: e.value }],
        last_verified: e.collected_at,
      }).catch(() => {});
    }

    // ── 10. Update the case ──
    const scoreMap = {
      identity_match: scores.find((s) => s.kind === 'IDENTITY_MATCH')?.value ?? 0,
      relationship_match: scores.find((s) => s.kind === 'RELATIONSHIP_MATCH')?.value ?? 0,
      channel_ownership: scores.find((s) => s.kind === 'CHANNEL_OWNERSHIP')?.value ?? 0,
      contact_eligibility: scores.find((s) => s.kind === 'CONTACT_ELIGIBILITY')?.value ?? 0,
      target_priority: scores.find((s) => s.kind === 'TARGET_PRIORITY')?.value ?? 0,
    };

    await base44.asServiceRole.entities.SkipTraceCase.update(caseRecord.id, {
      status: verdict === 'SUPPRESSED' ? 'suppressed' : 'completed',
      verdict,
      scores: scoreMap,
      canonical_record: canonical,
      evidence,
      contradictions,
      independent_sources: independentSources,
      automation_allowed: auto,
      lawful_purpose: `${purposeGate.permissible_purpose} — ${purposeGate.intended_use} (${purposeGate.jurisdiction}). Retention ${purposeGate.retention_period_days}d. Outreach: ${purposeGate.permitted_outreach.join(', ')}.`,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
    });

    return Response.json({
      case_id: caseId,
      verdict,
      scores: scoreMap,
      canonical_record: canonical,
      contradictions,
      independent_sources: independentSources,
      automation_allowed: auto,
      evidence_count: evidence.length,
      duration_ms: Date.now() - startedAt,
    });
  } catch (error) {
    console.error('skipTraceResolve error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}