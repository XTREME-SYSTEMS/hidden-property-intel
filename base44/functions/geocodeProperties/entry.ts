import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Geocodes properties that are missing lat/lng coordinates using LLM web search.
 * Processes in batches to stay within serverless time limits.
 * Runs daily via the Daily Maintenance workflow.
 */

const BATCH_SIZE = 15;
const TIME_LIMIT_MS = 250000;

const GEOCODE_SCHEMA = {
  type: 'object',
  properties: {
    lat: { type: 'number' },
    lng: { type: 'number' }
  }
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch properties missing coordinates
    const all = await base44.asServiceRole.entities.Property.list('-created_date', 500);
    const needingGeocode = all.filter(p =>
      (p.status === 'active' || p.status === 'draft') &&
      (p.lat == null || p.lng == null) &&
      p.address && p.city && p.state
    );

    const toProcess = needingGeocode.slice(0, BATCH_SIZE);
    const results = [];
    let geocoded = 0;
    const startedAt = Date.now();

    for (const p of toProcess) {
      if (Date.now() - startedAt > TIME_LIMIT_MS) break;
      try {
        const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `What are the exact latitude and longitude coordinates for this property address: ${p.address}, ${p.city}, ${p.state} ${p.zip_code || ''}? Return JSON with lat and lng as decimal degrees. Be precise.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: GEOCODE_SCHEMA
        });

        if (r.lat != null && r.lng != null) {
          await base44.asServiceRole.entities.Property.update(p.id, {
            lat: Number(r.lat),
            lng: Number(r.lng)
          });
          geocoded++;
          results.push({ id: p.id, address: p.address, lat: r.lat, lng: r.lng, action: 'geocoded' });
        } else {
          results.push({ id: p.id, address: p.address, action: 'no_coordinates' });
        }
      } catch (e) {
        console.error('geocode failed for', p.id, e?.message);
        results.push({ id: p.id, address: p.address, action: 'error', error: e.message });
      }
    }

    return Response.json({
      needing_geocode: needingGeocode.length,
      processed: toProcess.length,
      geocoded,
      results
    });
  } catch (error) {
    console.error('geocodeProperties error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}