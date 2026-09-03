import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { property_id } = body;
    if (!property_id) return Response.json({ error: 'property_id required' }, { status: 400 });

    const property = await base44.entities.Property.get(property_id);
    if (!property) return Response.json({ error: 'Property not found' }, { status: 404 });

    const images = await base44.entities.PropertyImage.filter({ property_id }, '-created_date', 10);
    const imageUrls = (images.length > 0 ? images : (property.images || [])).map(i => i.image_url || i.url).filter(Boolean).slice(0, 5);

    const prompt = `You are an expert property condition assessor. Analyze this property and estimate its condition from available data.

Property: ${property.address}, ${property.city}, ${property.state} ${property.zip_code}
Type: ${property.property_type}
Year Built: ${property.year_built || 'Unknown'}
Square Footage: ${property.square_footage || 'Unknown'}
Bedrooms: ${property.bedrooms || 'Unknown'}
Bathrooms: ${property.bathrooms || 'Unknown'}
Distress Type: ${property.distress_type || 'None'}
Days on Market: ${property.days_on_market || 'Unknown'}
${imageUrls.length > 0 ? `Images available: ${imageUrls.length} images (street view, exterior, interior)` : 'No images available — estimate from age and distress type'}

Assess the following:
1. Estimated roof age and condition (based on year built — roofs last ~20-25 years)
2. Visible exterior damage likelihood (cracks, peeling paint, sagging)
3. Yard/landscaping condition
4. HVAC system age estimate
5. Plumbing/electrical age estimate
6. Overall condition score (1-10, where 10 = excellent, 1 = uninhabitable)
7. Estimated exterior repair cost
8. Estimated interior repair cost
9. Key condition risk factors

Be conservative — distressed properties typically score 3-6.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: imageUrls.length > 0 ? imageUrls : undefined,
      response_json_schema: {
        type: "object",
        properties: {
          overall_condition_score: { type: "number" },
          roof_age_estimate: { type: "string" },
          roof_condition: { type: "string" },
          exterior_damage: { type: "string" },
          yard_condition: { type: "string" },
          hvac_age_estimate: { type: "string" },
          plumbing_electrical_age: { type: "string" },
          exterior_repair_cost: { type: "number" },
          interior_repair_cost: { type: "number" },
          total_repair_estimate: { type: "number" },
          condition_risk_factors: { type: "array", items: { type: "string" } },
          ai_assessment: { type: "string" },
          recommendation: { type: "string" }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}