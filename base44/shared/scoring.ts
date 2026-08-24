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

import { hasRealImages, fetchPropertyImages } from './propertyImages.ts';

const TITLE_SCHEMA = {
  type: 'object',
  properties: {
    lien_total: { type: 'number' },
    mortgage_balance: { type: 'number' },
    has_judgments: { type: 'boolean' },
    code_liens: { type: 'array', items: { type: 'string' } },
    hoa_delinquent: { type: 'boolean' },
    tax_delinquent: { type: 'boolean' },
    risk_level: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    details: { type: 'string' },
    ai_analysis: { type: 'string' }
  }
};

/**
 * Generate a title / lien risk assessment for a property via LLM web-search.
 * Creates a TitleRisk record. Idempotent per call (latest wins).
 */
export async function generateTitleRisk(base44, property) {
  const property_id = property.id;
  const prompt = `You are a title-risk analyst for a real estate investment platform. Research public records for this property and return JSON only.
Address: ${property.address}, ${property.city}, ${property.state} ${property.zip_code}
Distress type: ${property.distress_type}

Estimate: total outstanding lien amount (USD), mortgage balance (USD), whether there are open judgments, any code-violation liens (list them), HOA delinquency, property-tax delinquency, and an overall title risk level. Write a 1-2 paragraph ai_analysis explaining encumbrances that affect acquisition cost. If data is unavailable, estimate conservatively and note the uncertainty.`;

  const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: TITLE_SCHEMA
  });

  const existingRisks = await base44.asServiceRole.entities.TitleRisk.filter({ property_id });
  const riskData = {
    lien_total: r.lien_total,
    mortgage_balance: r.mortgage_balance,
    has_judgments: r.has_judgments,
    code_liens: r.code_liens,
    hoa_delinquent: r.hoa_delinquent,
    tax_delinquent: r.tax_delinquent,
    risk_level: r.risk_level,
    details: r.details,
    ai_analysis: r.ai_analysis,
    checked_at: new Date().toISOString()
  };
  if (existingRisks[0]) {
    await base44.asServiceRole.entities.TitleRisk.update(existingRisks[0].id, riskData);
  } else {
    await base44.asServiceRole.entities.TitleRisk.create({ property_id, ...riskData });
  }
  return r;
}

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

  const existingScores = await base44.asServiceRole.entities.PropertyScore.filter({ property_id });
  const scoreData = {
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
  };
  if (existingScores[0]) {
    await base44.asServiceRole.entities.PropertyScore.update(existingScores[0].id, scoreData);
  } else {
    await base44.asServiceRole.entities.PropertyScore.create({ property_id, ...scoreData });
  }

  await base44.asServiceRole.entities.Property.update(property_id, {
    estimated_value: r.estimated_value,
    proposed_asking_price: r.proposed_asking_price,
    property_score: r.overall_score
  });

  // fetch REAL listing photos via Browserbase (no AI-generated images)
  if (!hasRealImages(property)) {
    try {
      await fetchPropertyImages(base44, property);
    } catch (e) {
      console.error('real image fetch failed', property_id, e?.message);
    }
  }

  // title / lien risk assessment
  try {
    await generateTitleRisk(base44, property);
  } catch (e) {
    console.error('title risk failed', property_id, e?.message);
  }

  return r;
}