import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

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

    const prompt = `You are a real estate investment analyst. Analyze this distressed property and return JSON only.
Address: ${property.address}, ${property.city}, ${property.state} ${property.zip_code}
Type: ${property.property_type}, Distress: ${property.distress_type}
Beds: ${property.bedrooms ?? 'n/a'}, Baths: ${property.bathrooms ?? 'n/a'}, Sqft: ${property.square_footage ?? 'n/a'}, Year built: ${property.year_built ?? 'n/a'}, Lot sqft: ${property.lot_size ?? 'n/a'}
Estimated value: ${property.estimated_value ?? 'n/a'}, Proposed asking: ${property.proposed_asking_price ?? 'n/a'}

Find comparable sales within 1 mile in the last 12 months, estimate current market value, repair costs for the distress type, after-repair value (ARV), distress severity, estimated ROI %, and score factors (0-100 each). Write a 2-3 paragraph ai_analysis explaining the score.`;

    const schema = {
      type: 'object',
      properties: {
        estimated_value: { type: 'number' },
        proposed_asking_price: { type: 'number' },
        repair_cost_estimate: { type: 'number' },
        after_repair_value: { type: 'number' },
        distress_severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        estimated_roi: { type: 'number' },
        overall_score: { type: 'number' },
        score_factors: {
          type: 'object',
          properties: {
            equity: { type: 'number' },
            distress_level: { type: 'number' },
            location_score: { type: 'number' },
            market_trend: { type: 'number' },
            repair_cost_ratio: { type: 'number' }
          }
        },
        comparable_sales: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              address: { type: 'string' },
              sale_price: { type: 'number' },
              sale_date: { type: 'string' },
              sqft: { type: 'number' }
            }
          }
        },
        ai_analysis: { type: 'string' }
      }
    };

    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: schema
    });

    const score = await base44.asServiceRole.entities.PropertyScore.create({
      property_id,
      overall_score: r.overall_score,
      distress_severity: r.distress_severity,
      repair_cost_estimate: r.repair_cost_estimate,
      after_repair_value: r.after_repair_value,
      estimated_roi: r.estimated_roi,
      comparable_sales: r.comparable_sales,
      score_factors: r.score_factors,
      ai_analysis: r.ai_analysis,
      scored_at: new Date().toISOString(),
      model_version: 'gemini_3_flash-v1'
    });

    await base44.asServiceRole.entities.Property.update(property_id, {
      estimated_value: r.estimated_value,
      proposed_asking_price: r.proposed_asking_price,
      property_score: r.overall_score
    });

    return Response.json({ score_id: score.id, overall_score: r.overall_score, ai_analysis: r.ai_analysis });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}