import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { property_id, investor_id } = body;
    if (!property_id) return Response.json({ error: 'property_id required' }, { status: 400 });

    const property = await base44.entities.Property.get(property_id);
    if (!property) return Response.json({ error: 'Property not found' }, { status: 404 });

    const [scores, titleRisks, marketData, deals] = await Promise.all([
      base44.entities.PropertyScore.filter({ property_id }, '-scored_at', 1),
      base44.entities.TitleRisk.filter({ property_id }, '-created_date', 1),
      base44.entities.MarketAnalytics.filter({ city: property.city, state: property.state }, '-created_date', 1),
      base44.entities.Deal.filter({ property_id, status: 'active' }, '-created_date', 5),
    ]);

    const score = scores[0];
    const titleRisk = titleRisks[0];
    const market = marketData[0];

    const prompt = `You are a Deal Risk Intelligence Engine. Analyze this property across 5 risk dimensions and generate a comprehensive risk report.

Property: ${property.address}, ${property.city}, ${property.state}
Type: ${property.property_type} | Distress: ${property.distress_type} | Value: $${property.estimated_value || 'N/A'}
Year Built: ${property.year_built || 'N/A'} | Sqft: ${property.square_footage || 'N/A'} | DOM: ${property.days_on_market || 'N/A'}

AI Score: ${score?.overall_score || 'N/A'}/100
Distress Severity: ${score?.distress_severity || 'N/A'}
Repair Cost Estimate: $${score?.repair_cost_estimate || 'N/A'}
ARV: $${score?.after_repair_value || 'N/A'}
Estimated ROI: ${score?.estimated_roi || 'N/A'}%

Title Risk: ${titleRisk?.risk_level || 'Unknown'}
Liens: $${titleRisk?.lien_total || 0} | Mortgage: $${titleRisk?.mortgage_balance || 0}
Tax Delinquent: ${titleRisk?.tax_delinquent ? 'Yes' : 'No'} | Judgments: ${titleRisk?.has_judgments ? 'Yes' : 'No'}

Market Data: ${market ? `Avg Price: $${market.avg_price}, Price/Sqft: $${market.price_per_sqft}, DOM: ${market.avg_days_on_market}` : 'No market data'}

Active Deals on this property: ${deals.length}

Score these 5 risk dimensions (0-100, higher = more risk):
1. TITLE RISK — liens, judgments, tax delinquency, HOA issues
2. MARKET RISK — declining area, high DOM, oversupply, price trends
3. CONDITION RISK — age, distress severity, repair cost ratio
4. FINANCIAL RISK — ROI viability, ARV confidence, cost overruns
5. LEGAL RISK — distress type complications, probate issues, code violations

Provide an overall risk score, risk level (low/medium/high/critical), and specific mitigation recommendations for each dimension.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          overall_risk_score: { type: "number" },
          risk_level: { type: "string" },
          dimensions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                dimension: { type: "string" },
                score: { type: "number" },
                level: { type: "string" },
                analysis: { type: "string" },
                mitigation: { type: "string" }
              }
            }
          },
          summary: { type: "string" },
          recommendation: { type: "string" },
          deal_viability: { type: "string" }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}