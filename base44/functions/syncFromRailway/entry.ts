import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { normalizeAddress, dedupeKey } from '../../shared/addressUtils.ts';

/**
 * syncFromRailway — token-authenticated ingress for Railway scrapers + Groq AI.
 *
 * Railway does the expensive work (scraping + AI scoring via Groq) and pushes
 * the finished, enriched records here. Base44 only stores + serves them.
 * This keeps Base44 credits minimal — no InvokeLLM, no scraping on Base44.
 *
 * Auth: Authorization: Bearer <RAILWAY_SYNC_TOKEN>
 *
 * Actions:
 *   heartbeat            → { status: "ok" }
 *   upsert_properties    → { properties: [{ address, city, state, zip_code, ... }] }
 *   upsert_scores        → { scores: [{ normalized_address|property_id, score fields }] }
 */

function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export default async function(req: Request): Promise<Response> {
  const token = process.env.RAILWAY_SYNC_TOKEN;
  const auth = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const sent = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token || sent !== token) return unauthorized();

  let body;
  try { body = await req.json(); } catch { body = {}; }
  const action = body.action;
  const base44 = createClientFromRequest(req);

  try {
    // ── heartbeat ──────────────────────────────────────────────
    if (action === 'heartbeat') {
      return Response.json({ status: 'ok', service: 'syncFromRailway', ts: new Date().toISOString() });
    }

    // ── upsert properties ───────────────────────────────────────
    if (action === 'upsert_properties') {
      const items = Array.isArray(body.properties) ? body.properties : [];
      const source = body.source || 'railway';
      let created = 0, updated = 0, skipped = 0;
      const errors = [];

      for (const p of items) {
        try {
          if (!p.address || !p.city || !p.state || !p.zip_code) { skipped++; continue; }
          const norm = normalizeAddress(p.address);
          const key = dedupeKey(p.address, p.zip_code);

          // find existing by normalized_address + zip
          const existing = await base44.asServiceRole.entities.Property.filter(
            { normalized_address: norm, zip_code: String(p.zip_code) },
            '-updated_date', 1
          );

          const payload = {
            address: p.address,
            normalized_address: norm,
            city: p.city,
            state: p.state,
            zip_code: String(p.zip_code),
            lat: p.lat ?? null,
            lng: p.lng ?? null,
            property_type: p.property_type || 'residential',
            distress_type: p.distress_type || undefined,
            status: p.status || 'active',
            estimated_value: p.estimated_value ?? null,
            proposed_asking_price: p.proposed_asking_price ?? null,
            property_score: p.property_score ?? null,
            square_footage: p.square_footage ?? null,
            bedrooms: p.bedrooms ?? null,
            bathrooms: p.bathrooms ?? null,
            year_built: p.year_built ?? null,
            lot_size: p.lot_size ?? null,
            description: p.description || undefined,
            source: 'scraped',
            source_url: p.source_url || undefined,
            scraped_at: new Date().toISOString(),
            images: Array.isArray(p.images) ? p.images : undefined,
            days_on_market: p.days_on_market ?? null,
          };
          // strip undefined
          Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

          if (existing && existing.length > 0) {
            await base44.asServiceRole.entities.Property.update(existing[0].id, payload);
            updated++;
          } else {
            await base44.asServiceRole.entities.Property.create(payload);
            created++;
          }
        } catch (e) {
          errors.push({ address: p?.address, error: e.message });
        }
      }

      return Response.json({
        status: 'ok', action, source,
        total: items.length, created, updated, skipped, errors: errors.slice(0, 20),
      });
    }

    // ── upsert scores (AI-computed on Groq, pushed in) ──────────
    if (action === 'upsert_scores') {
      const items = Array.isArray(body.scores) ? body.scores : [];
      let applied = 0, skipped = 0;
      const errors = [];

      for (const s of items) {
        try {
          let prop = null;
          if (s.property_id) {
            prop = await base44.asServiceRole.entities.Property.get(s.property_id);
          } else if (s.address) {
            const norm = normalizeAddress(s.address);
            const found = await base44.asServiceRole.entities.Property.filter(
              { normalized_address: norm }, '-updated_date', 1
            );
            prop = found && found[0];
          }
          if (!prop) { skipped++; continue; }

          await base44.asServiceRole.entities.Property.update(prop.id, {
            property_score: s.overall_score ?? s.score ?? null,
            estimated_value: s.estimated_value ?? prop.estimated_value ?? null,
            proposed_asking_price: s.proposed_asking_price ?? prop.proposed_asking_price ?? null,
          });

          // write a PropertyScore record if score provided
          if (s.overall_score != null || s.score != null) {
            await base44.asServiceRole.entities.PropertyScore.create({
              property_id: prop.id,
              overall_score: s.overall_score ?? s.score,
              distress_severity: s.distress_severity || undefined,
              repair_cost_estimate: s.repair_cost_estimate ?? null,
              after_repair_value: s.after_repair_value ?? null,
              estimated_roi: s.estimated_roi ?? null,
              ai_analysis: s.ai_analysis || undefined,
              scored_at: new Date().toISOString(),
              model_version: s.model_version || 'groq-railway-v1',
            });
          }
          applied++;
        } catch (e) {
          errors.push({ id: s?.property_id, address: s?.address, error: e.message });
        }
      }

      return Response.json({
        status: 'ok', action,
        total: items.length, applied, skipped, errors: errors.slice(0, 20),
      });
    }

    return Response.json({ error: `Unknown action: ${action}. Use: heartbeat, upsert_properties, upsert_scores` }, { status: 400 });
  } catch (error) {
    console.error('syncFromRailway error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}