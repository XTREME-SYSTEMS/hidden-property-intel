import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { property_id, language = 'en' } = body;

    let property = body.property;
    if (property_id && !property) {
      property = await base44.entities.Property.get(property_id);
    }
    if (!property) return Response.json({ error: 'Property data required' }, { status: 400 });

    const langInstruction = language === 'es'
      ? 'Write all descriptions in Spanish, optimized for the Miami real estate market.'
      : 'Write all descriptions in English.';

    const prompt = `You are an expert real estate copywriter. Generate 3 SEO-optimized property listing descriptions for the following property. Each description should be approximately 200 words.

Property Details:
- Address: ${property.address}, ${property.city}, ${property.state} ${property.zip_code}
- Type: ${property.property_type || 'residential'}
- Distress Type: ${property.distress_type || 'unknown'}
- Bedrooms: ${property.bedrooms || 'N/A'}
- Bathrooms: ${property.bathrooms || 'N/A'}
- Square Footage: ${property.square_footage || 'N/A'}
- Lot Size: ${property.lot_size || 'N/A'}
- Year Built: ${property.year_built || 'N/A'}
- Estimated Value: $${property.estimated_value || 'N/A'}
- Description: ${property.description || 'N/A'}

${langInstruction}

Generate 3 descriptions in different tones:
1. "professional" — Formal, factual, investment-focused. Highlights ROI potential and financial metrics.
2. "emotional" — Warm, lifestyle-focused. Paints a picture of the home and neighborhood.
3. "investment" — Direct, numbers-focused. Emphasizes equity, ARV, repair costs, and profit potential.

Each description must be SEO-optimized with relevant keywords (distressed property, investment opportunity, [city] real estate, etc.).`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          descriptions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tone: { type: "string" },
                content: { type: "string" },
                word_count: { type: "number" },
                seo_keywords: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}