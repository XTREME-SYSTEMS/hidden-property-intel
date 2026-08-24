import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const property_id = body?.property_id;
    if (!property_id) return Response.json({ error: 'property_id required' }, { status: 400 });

    const property = await base44.asServiceRole.entities.Property.get(property_id);
    const isOwner = property.seller_id && property.seller_id === user.id;
    if (user.role !== 'admin' && !isOwner) {
      return Response.json({ error: 'Only the seller or admin can optimize this listing' }, { status: 403 });
    }

    const prompt = `You are a real estate marketing copywriter for an investment marketplace. Improve this listing.
Address: ${property.address}, ${property.city}, ${property.state}
Type: ${property.property_type}, Distress: ${property.distress_type}
Beds: ${property.bedrooms ?? 'n/a'}, Baths: ${property.bathrooms ?? 'n/a'}, Sqft: ${property.square_footage ?? 'n/a'}
Estimated value: ${property.estimated_value ?? 'n/a'}, Current asking: ${property.proposed_asking_price ?? 'n/a'}
Current description: ${property.description ?? '(none)'}

Return JSON with a compelling title, an improved marketing description (highlight investment potential, ROI angle, distress situation), a suggested optimal asking price, photo improvement tips, and SEO meta tags.`;

    const schema = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        suggested_price: { type: 'number' },
        photo_tips: { type: 'array', items: { type: 'string' } },
        seo_meta: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' }
          }
        }
      }
    };

    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    return Response.json({ suggestions: r });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}