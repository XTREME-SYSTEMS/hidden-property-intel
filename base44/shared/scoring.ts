const SCHEMA = {
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

/**
 * Score a single property via LLM web-search: comparable sales, ARV, repair costs,
 * ROI, distress severity, 0-100 score. Creates a PropertyScore record and writes the
 * headline numbers back onto the Property. Shared by the admin scoreProperty endpoint
 * and the daily scrape pipeline (auto-scoring newly harvested records).
 */
export async function scorePropertyRecord(base44, property) {
  const property_id = property.id;
  const prompt = `You are a real estate investment analyst. Analyze this distressed property and return JSON only.
Address: ${property.address}, ${property.city}, ${property.state} ${property.zip_code}
Type: ${property.property_type}, Distress: ${property.distress_type}
Beds: ${property.bedrooms ?? 'n/a'}, Baths: ${property.bathrooms ?? 'n/a'}, Sqft: ${property.square_footage ?? 'n/a'}, Year built: ${property.year_built ?? 'n/a'}, Lot sqft: ${property.lot_size ?? 'n/a'}
Estimated value: ${property.estimated_value ?? 'n/a'}, Proposed asking: ${property.proposed_asking_price ?? 'n/a'}

Find comparable sales within 1 mile in the last 12 months, estimate current market value, repair costs for the distress type, after-repair value (ARV), distress severity, estimated ROI %, and score factors (0-100 each). Write a 2-3 paragraph ai_analysis explaining the score.`;

  const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: SCHEMA
  });

  await base44.asServiceRole.entities.PropertyScore.create({
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

  return r;
}