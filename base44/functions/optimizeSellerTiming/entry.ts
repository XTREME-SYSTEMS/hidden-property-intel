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

    const market = await base44.entities.MarketAnalytics.filter({ city: property.city, state: property.state }, '-created_date', 1);

    const prompt = `You are a Seller Timing Optimizer. Analyze market conditions and advise the seller on the optimal time to sell this property.

Property: ${property.address}, ${property.city}, ${property.state}
Type: ${property.property_type} | Distress: ${property.distress_type}
Estimated Value: $${property.estimated_value || 'N/A'}
Year Built: ${property.year_built || 'N/A'} | Sqft: ${property.square_footage || 'N/A'}

Market Data: ${market[0] ? `Avg Price: $${market[0].avg_price}, Price/Sqft: $${market[0].price_per_sqft}, Avg DOM: ${market[0].avg_days_on_market}, Distress Count: ${market[0].distress_count}` : 'No local market data — use general FL market trends'}

Current Season: ${new Date().toLocaleString('default', { month: 'long' })}

Analyze:
1. Current market conditions (buyer's vs seller's market)
2. Seasonal pricing patterns in FL real estate
3. Interest rate environment impact
4. Local inventory levels and competition
5. Distress type urgency (some distress types require fast sale)

Provide:
- "Sell Now" projected price
- "Wait 3 months" projected price
- "Wait 6 months" projected price
- Optimal timing recommendation
- Key factors driving the recommendation
- Risk of waiting (market could decline, distress could worsen)`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          market_condition: { type: "string" },
          sell_now_price: { type: "number" },
          wait_3_month_price: { type: "number" },
          wait_6_month_price: { type: "number" },
          optimal_timing: { type: "string" },
          recommendation: { type: "string" },
          key_factors: { type: "array", items: { type: "string" } },
          risk_of_waiting: { type: "string" },
          urgency_level: { type: "string" }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}