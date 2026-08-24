import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { scorePropertyRecord } from '../../shared/scoring.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const property_id = body?.property_id;
    if (!property_id) return Response.json({ error: 'property_id required' }, { status: 400 });

    const property = await base44.asServiceRole.entities.Property.get(property_id);
    const r = await scorePropertyRecord(base44, property);
    return Response.json({ property_id, overall_score: r.overall_score, ai_analysis: r.ai_analysis });
  } catch (error) {
    console.error('scoreProperty error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}