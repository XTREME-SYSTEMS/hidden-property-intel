import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { investor_id } = body;

    if (!investor_id) return Response.json({ error: 'investor_id required' }, { status: 400 });

    const investor = await base44.entities.Investor.filter({ user_id: investor_id }, '-created_date', 1);
    const investorRecord = investor[0];
    if (!investorRecord) return Response.json({ error: 'Investor profile not found' }, { status: 404 });

    const deals = await base44.entities.Deal.filter({ user_id: investor_id, status: 'active' }, '-updated_date', 20);
    const wonDeals = await base44.entities.Deal.filter({ user_id: investor_id, status: 'won' }, '-updated_date', 20);

    const portfolioSummary = {
      total_deals: deals.length + wonDeals.length,
      active_deals: deals.length,
      won_deals: wonDeals.length,
      target_markets: investorRecord.target_markets || [],
      investment_types: investorRecord.investment_types || [],
      total_invested: investorRecord.total_invested || 0,
      properties_won: investorRecord.properties_won || 0,
      avg_roi: wonDeals.length > 0
        ? wonDeals.reduce((sum, d) => sum + (d.projected_profit / (d.acquisition_price || 1) * 100), 0) / wonDeals.length
        : 0,
      exit_strategies: deals.map(d => d.exit_strategy).filter(Boolean),
    };

    const allProperties = await base44.entities.Property.filter({ status: 'active' }, '-property_score', 50);
    const topProperties = allProperties
      .filter(p => p.property_score && p.property_score >= 70)
      .slice(0, 20);

    const prompt = `You are an AI real estate portfolio advisor. Analyze the following investor's portfolio and recommend 5 properties that best complement their existing holdings.

Investor Profile:
- Name: ${investorRecord.name}
- Target Markets: ${portfolioSummary.target_markets.join(', ') || 'Not specified'}
- Investment Types: ${portfolioSummary.investment_types.join(', ') || 'Not specified'}
- Total Deals: ${portfolioSummary.total_deals}
- Active Deals: ${portfolioSummary.active_deals}
- Won Deals: ${portfolioSummary.won_deals}
- Total Invested: $${portfolioSummary.total_invested}
- Properties Won: ${portfolioSummary.properties_won}
- Average ROI on Won Deals: ${portfolioSummary.avg_roi.toFixed(1)}%
- Current Exit Strategies: ${portfolioSummary.exit_strategies.join(', ') || 'None'}

Available Properties (top 20 by score):
${topProperties.map((p, i) => `${i + 1}. ${p.address}, ${p.city}, ${p.state} | Score: ${p.property_score}/100 | Type: ${p.property_type} | Distress: ${p.distress_type} | Value: $${p.estimated_value || 'N/A'} | Beds: ${p.bedrooms || 'N/A'} | Baths: ${p.bathrooms || 'N/A'} | Sqft: ${p.square_footage || 'N/A'}`).join('\n')}

Recommend 5 properties that:
1. Complement the investor's existing portfolio (diversification)
2. Match their target markets or suggest strategic expansion
3. Align with their investment types and exit strategies
4. Offer the best risk-adjusted returns
5. Fill gaps in their current portfolio

For each recommendation, explain WHY it's a good fit and what gap it fills.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          portfolio_analysis: { type: "string" },
          diversification_score: { type: "number" },
          risk_assessment: { type: "string" },
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                property_index: { type: "number" },
                address: { type: "string" },
                score: { type: "number" },
                reasoning: { type: "string" },
                portfolio_gap_filled: { type: "string" },
                projected_roi: { type: "number" },
                risk_level: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({ portfolio_summary: portfolioSummary, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}