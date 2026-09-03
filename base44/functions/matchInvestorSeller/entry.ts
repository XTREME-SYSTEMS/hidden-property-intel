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

    const investors = await base44.entities.Investor.filter({ subscription_status: 'active' }, '-rating', 50);
    if (investors.length === 0) return Response.json({ error: 'No active investors found' }, { status: 404 });

    const prompt = `You are an Investor-Seller Compatibility Matching AI. Match this property to the best investors in our network.

Property: ${property.address}, ${property.city}, ${property.state}
Type: ${property.property_type} | Distress: ${property.distress_type}
Value: $${property.estimated_value || 'N/A'} | Beds: ${property.bedrooms || 'N/A'} | Baths: ${property.bathrooms || 'N/A'} | Sqft: ${property.square_footage || 'N/A'}

Available Investors (top 50 by rating):
${investors.map((inv, i) => `${i + 1}. ${inv.name} | Company: ${inv.company || 'N/A'} | Plan: ${inv.subscription_plan} | Rating: ${inv.rating || 'N/A'}/5 | Markets: ${(inv.target_markets || []).join(', ') || 'All'} | Types: ${(inv.investment_types || []).join(', ') || 'All'} | Price Range: $${inv.target_price_range?.min || 0}-$${inv.target_price_range?.max || 'N/A'} | Deals Won: ${inv.properties_won || 0} | Total Invested: $${inv.total_invested || 0}`).join('\n')}

Rank the top 5 investors by compatibility. For each, provide:
- Match score (0-100)
- Why they're a good fit (specific reasons)
- Deal type recommendation (flip, BRRRR, buy_hold, wholesale)
- Expected offer range
- Closing speed estimate
- Risk of deal falling through

Consider: location match, investment type match, price range match, investor track record, and current capacity.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          matches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                investor_index: { type: "number" },
                investor_name: { type: "string" },
                match_score: { type: "number" },
                deal_type: { type: "string" },
                reasoning: { type: "string" },
                expected_offer_range: { type: "string" },
                closing_speed: { type: "string" },
                risk_level: { type: "string" }
              }
            }
          },
          summary: { type: "string" }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}