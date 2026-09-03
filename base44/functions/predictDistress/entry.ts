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

    const scores = await base44.entities.PropertyScore.filter({ property_id }, '-scored_at', 1);
    const lastScore = scores[0];

    const prompt = `You are an AI real estate analyst specializing in predictive distress modeling. Analyze the following property and predict its probability of becoming distressed (entering pre-foreclosure, tax delinquency, or code violation status) within the next 90 days.

Property Data:
- Address: ${property.address}, ${property.city}, ${property.state}
- Property Type: ${property.property_type}
- Current Distress Type: ${property.distress_type || 'none'}
- Status: ${property.status}
- Estimated Value: $${property.estimated_value || 'N/A'}
- Year Built: ${property.year_built || 'N/A'}
- Square Footage: ${property.square_footage || 'N/A'}
- Bedrooms: ${property.bedrooms || 'N/A'}
- Bathrooms: ${property.bathrooms || 'N/A'}
- Days on Market: ${property.days_on_market || 'N/A'}
- Current Score: ${lastScore?.overall_score || 'N/A'}/100
- Current Distress Severity: ${lastScore?.distress_severity || 'N/A'}

Analyze these predictive factors:
1. Mortgage age (estimate from year built and last sale if available)
2. Market decline trend (based on city/state)
3. Days since last sale or verification
4. Neighborhood distress rate (based on city)
5. Property age and condition indicators
6. Current distress signals already present

Provide a predictive distress probability (0-100%), estimated timeframe, and the key risk factors driving the prediction.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          predictive_score: { type: "number" },
          distress_probability: { type: "number" },
          predicted_timeframe_days: { type: "number" },
          risk_level: { type: "string" },
          key_risk_factors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                factor: { type: "string" },
                weight: { type: "number" },
                description: { type: "string" }
              }
            }
          },
          ai_analysis: { type: "string" },
          recommendation: { type: "string" }
        }
      }
    });

    if (lastScore) {
      await base44.asServiceRole.entities.PropertyScore.update(lastScore.id, {
        ai_analysis: (lastScore.ai_analysis || '') + '\n\n[Predictive] ' + (result.ai_analysis || ''),
      });
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}