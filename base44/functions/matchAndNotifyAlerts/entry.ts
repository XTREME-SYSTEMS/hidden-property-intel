import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { matchPropertyToAlerts } from '../../shared/alerts.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const propertyId = body.property_id;
    if (!propertyId) return Response.json({ error: 'property_id required' }, { status: 400 });

    let property;
    try {
      property = await base44.asServiceRole.entities.Property.get(propertyId);
    } catch (e) {
      return Response.json({ error: 'property not found' }, { status: 404 });
    }
    if (!property || !property.id) return Response.json({ error: 'property not found' }, { status: 404 });

    const result = await matchPropertyToAlerts(base44, property);
    return Response.json({ property_id: propertyId, ...result });
  } catch (error) {
    console.error('matchAndNotifyAlerts error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}