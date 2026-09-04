import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Shadow Deal Hunt — persistent intelligence discovery for Florida real estate.
// Uses AI web search to find: distressed opportunities, cross-county arbitrage,
// zero-competition niches, competitor movements, and emerging trends.

export default async function (req: any) {
  const base44 = createClientFromRequest(req);
  const now = new Date().toISOString();

  try {
    // Get current state to inform the hunt
    const [properties, sources] = await Promise.all([
      base44.asServiceRole.entities.Property.list('-created_date', 500),
      base44.asServiceRole.entities.DataSource.list('-created_date', 500),
    ]);

    const currentCounties = [...new Set(properties.map((p: any) => p.city).filter(Boolean))].slice(0, 20).join(', ');
    const currentDistressTypes = [...new Set(properties.map((p: any) => p.distress_type).filter(Boolean))].join(', ');
    const sourceCount = sources.length;
    const propertyCount = properties.length;

    // Single comprehensive AI web-search call for deal intelligence
    const prompt = `You are the Shadow Deal Hunter for PropertyIntel, a Florida distressed real estate investment platform.

CURRENT STATE:
- ${propertyCount} properties in database
- ${sourceCount} data sources active
- Top cities: ${currentCounties || 'none yet'}
- Distress types covered: ${currentDistressTypes || 'none yet'}

MISSION: Find actionable intelligence for Florida real estate investment. Search the web for:

1. DISTRESSED OPPORTUNITIES: Find specific Florida properties currently in pre-foreclosure, foreclosure, probate, tax delinquency, or code violation that are NOT yet on major platforms. Include address, county, distress type, and estimated value if available.

2. CROSS-COUNTY ARBITRAGE: Find price disparities for similar properties across Florida counties. E.g., a 3BR/2BA house in Miami-Dade vs. same in Polk County — what's the price difference and what does that mean for investors?

3. ZERO-COMPETITION NICHES: Identify Florida real estate niches that competitors (PropStream, DealMachine, PropertyRadar) are NOT covering well. Think: mobile home parks, vacant land in specific counties, commercial distress, HOA foreclosures, environmental liens.

4. COMPETITOR INTELLIGENCE: What are PropStream, DealMachine, PropertyRadar, Auction.com, and PropertyOnion doing right now? Any new features, data sources, or markets they're expanding into? What properties do they have that we might be missing?

5. EMERGING TRENDS: What Florida real estate trends are emerging? Migration patterns, insurance crisis effects, interest rate impacts, new laws affecting distressed property investing, demographic shifts.

Return as JSON with this exact structure:
{
  "opportunities": [{"address": "...", "county": "...", "distress_type": "...", "estimated_value": 0, "source": "...", "notes": "..."}],
  "arbitrage": [{"comparison": "...", "price_difference": "...", "implication": "...", "counties": ["...", "..."]}],
  "niches": [{"niche": "...", "why_underserved": "...", "potential": "...", "target_counties": ["...", "..."]}],
  "competitor_intel": [{"competitor": "...", "recent_move": "...", "our_advantage": "...", "gap_to_close": "..."}],
  "trends": [{"trend": "...", "impact": "...", "timeframe": "...", "action": "..."}]
}

Be specific to Florida. Use real county names, real cities, real data where available.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          opportunities: { type: 'array', items: { type: 'object', properties: { address: { type: 'string' }, county: { type: 'string' }, distress_type: { type: 'string' }, estimated_value: { type: 'number' }, source: { type: 'string' }, notes: { type: 'string' } } } },
          arbitrage: { type: 'array', items: { type: 'object', properties: { comparison: { type: 'string' }, price_difference: { type: 'string' }, implication: { type: 'string' }, counties: { type: 'array', items: { type: 'string' } } } } },
          niches: { type: 'array', items: { type: 'object', properties: { niche: { type: 'string' }, why_underserved: { type: 'string' }, potential: { type: 'string' }, target_counties: { type: 'array', items: { type: 'string' } } } } },
          competitor_intel: { type: 'array', items: { type: 'object', properties: { competitor: { type: 'string' }, recent_move: { type: 'string' }, our_advantage: { type: 'string' }, gap_to_close: { type: 'string' } } } },
          trends: { type: 'array', items: { type: 'object', properties: { trend: { type: 'string' }, impact: { type: 'string' }, timeframe: { type: 'string' }, action: { type: 'string' } } } },
        }
      },
    });

    const dealHuntResults = result as any;

    // Persist the deal hunt report
    const report = await base44.asServiceRole.entities.ShadowReport.create({
      run_at: now,
      type: 'deal_hunt',
      deal_hunt_results: dealHuntResults,
      metrics: {
        opportunities_found: dealHuntResults.opportunities?.length || 0,
        arbitrage_found: dealHuntResults.arbitrage?.length || 0,
        niches_found: dealHuntResults.niches?.length || 0,
        competitor_insights: dealHuntResults.competitor_intel?.length || 0,
        trends_found: dealHuntResults.trends?.length || 0,
      },
    });

    return Response.json({
      ...dealHuntResults,
      report_id: report.id,
      run_at: now,
    });
  } catch (error) {
    console.error('shadowDealHunt error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}