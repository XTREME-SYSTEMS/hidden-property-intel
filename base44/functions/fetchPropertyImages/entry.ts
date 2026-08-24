import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { fetchPropertyImages } from '../../shared/propertyImages.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 25;

    let properties;
    if (body.property_id) {
      properties = [await base44.asServiceRole.entities.Property.get(body.property_id)];
    } else {
      properties = await base44.asServiceRole.entities.Property.list('-scraped_at', limit);
    }

    const results = [];
    for (const p of properties) {
      const r = await fetchPropertyImages(base44, p);
      results.push({
        id: p.id,
        address: `${p.address}, ${p.city}, ${p.state}`,
        found: r.found || 0,
        listing_url: r.listing_url,
        source: r.source,
        note: r.note,
        error: r.error
      });
    }

    const updated = results.filter(r => r.found > 0).length;
    return Response.json({ processed: results.length, updated, results });
  } catch (error) {
    console.error('fetchPropertyImages error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}