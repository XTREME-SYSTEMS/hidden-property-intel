import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { enrichPropertyMaster, calculateCompleteness } from '../../shared/masterEnrichment.ts';

/**
 * Master Enrichment Runner — runs the comprehensive 15-category enrichment
 * on a batch of properties. Supports auto-heal mode (only enriches properties
 * below a completeness threshold).
 *
 * Modes:
 *  - single: enrich one property by ID
 *  - batch: enrich N properties (default 5, max 10 per run)
 *  - auto_heal: only enrich properties with enrichment_completeness < threshold
 */

const BATCH_SIZE = 5;
const TIME_LIMIT_MS = 200000;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const mode = body.mode || 'batch';
    const threshold = body.threshold || 80;

    let candidates: any[] = [];

    if (mode === 'single' && body.property_id) {
      const p = await base44.asServiceRole.entities.Property.get(body.property_id);
      candidates = [p];
    } else if (mode === 'auto_heal') {
      // Fetch properties with completeness below threshold
      const all = await base44.asServiceRole.entities.Property.filter(
        { status: 'active' },
        '-created_date',
        200
      );
      candidates = all
        .filter(p => (p.enrichment_completeness ?? 0) < threshold)
        .slice(0, BATCH_SIZE);
    } else {
      // Batch mode — enrich most recently created active properties
      candidates = await base44.asServiceRole.entities.Property.filter(
        { status: 'active' },
        '-created_date',
        BATCH_SIZE
      );
    }

    const results = [];
    let enriched = 0;
    let failed = 0;
    const startedAt = Date.now();

    for (const p of candidates) {
      if (Date.now() - startedAt > TIME_LIMIT_MS) {
        results.push({ id: p.id, address: p.address, action: 'skipped', note: 'time limit' });
        continue;
      }
      try {
        const result = await enrichPropertyMaster(base44, p);
        enriched++;
        results.push({
          id: p.id,
          address: p.address,
          action: 'enriched',
          completeness: result.completeness,
        });
      } catch (e) {
        failed++;
        results.push({ id: p.id, address: p.address, action: 'error', error: e.message });
      }
    }

    // Calculate system-wide average completeness
    const allActive = await base44.asServiceRole.entities.Property.filter({ status: 'active' }, '-created_date', 100);
    const scores = allActive.map(p => p.enrichment_completeness ?? 0);
    const avgCompleteness = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    return Response.json({
      mode,
      processed: candidates.length,
      enriched,
      failed,
      system_avg_completeness: avgCompleteness,
      results,
    });
  } catch (error) {
    console.error('runMasterEnrichment error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}