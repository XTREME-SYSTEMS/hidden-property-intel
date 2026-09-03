import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { property_id, square_footage, condition, renovation_scope, city, state } = body;

    let property = body.property;
    if (property_id && !property) {
      property = await base44.entities.Property.get(property_id);
    }

    const sqft = square_footage || property?.square_footage || 1500;
    const propCondition = condition || property?.condition || 'average';
    const scope = renovation_scope || 'medium';
    const propCity = city || property?.city || 'Orlando';
    const propState = state || property?.state || 'FL';

    const prompt = `You are an expert real estate contractor and cost estimator in ${propCity}, ${propState}. Estimate detailed rehab costs for a property with the following characteristics:

- Square Footage: ${sqft} sqft
- Current Condition: ${propCondition}
- Renovation Scope: ${scope} (light = cosmetic only, medium = cosmetic + some systems, full = gut renovation)
- Location: ${propCity}, ${propState}

Provide a detailed cost breakdown by category. Use LOCAL contractor rates for ${propCity}, ${propState} — adjust for regional cost differences (Miami is 20-30% higher than Orlando, Jacksonville is 10-15% lower than Orlando).

Categories to estimate:
1. Roof
2. Kitchen
3. Bathrooms
4. Flooring
5. Paint (interior + exterior)
6. HVAC
7. Plumbing
8. Electrical
9. Windows/Doors
10. Permits & Contingency (10% of total)

For each category, provide: estimated cost, cost per sqft, and notes on what's included.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          total_estimate: { type: "number" },
          total_low: { type: "number" },
          total_high: { type: "number" },
          cost_per_sqft: { type: "number" },
          breakdown: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                estimated_cost: { type: "number" },
                cost_per_sqft: { type: "number" },
                notes: { type: "string" }
              }
            }
          },
          market_adjustment_note: { type: "string" },
          scope_description: { type: "string" }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}