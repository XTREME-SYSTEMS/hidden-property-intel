import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Shadow Morning Brief — AI-generated daily intelligence brief for PropertyIntel.
// Synthesizes the latest orchestrator audit + deal hunt into a readable brief.

export default async function (req: any) {
  const base44 = createClientFromRequest(req);
  const now = new Date().toISOString();

  try {
    // Get latest orchestrator report and deal hunt
    const [orchReports, huntReports, properties, bids, deals, investors] = await Promise.all([
      base44.asServiceRole.entities.ShadowReport.filter({ type: 'orchestrator' }, '-created_date', 1),
      base44.asServiceRole.entities.ShadowReport.filter({ type: 'deal_hunt' }, '-created_date', 1),
      base44.asServiceRole.entities.Property.list('-property_score', 10),
      base44.asServiceRole.entities.Bid.list('-created_date', 10),
      base44.asServiceRole.entities.Deal.list('-created_date', 10),
      base44.asServiceRole.entities.Investor.list('-created_date', 50),
    ]);

    const orch = orchReports[0];
    const hunt = huntReports[0];
    const topProperties = properties.filter((p: any) => p.property_score).slice(0, 5).map((p: any) => ({
      address: p.address, city: p.city, score: p.property_score, distress_type: p.distress_type, estimated_value: p.estimated_value
    }));

    const metrics = orch?.metrics || {};
    const dimScores = orch?.dimension_scores || {};
    const huntResults = hunt?.deal_hunt_results || {};

    const prompt = `You are the Shadow Intelligence Officer for PropertyIntel, a Florida distressed real estate investment platform.
Generate a concise, actionable MORNING BRIEF for the system owner.

SYSTEM AUDIT SUMMARY (latest run):
- Overall system score: ${orch?.overall_score || 'N/A'}/100
- Convergence delta: ${orch?.convergence_delta || 0} (positive = improving)
- Dimension scores: ${JSON.stringify(dimScores)}
- Total properties: ${metrics.total_properties || 0}
- Active sources: ${metrics.active_sources || 0} / ${metrics.total_sources || 0}
- Active investors: ${metrics.active_investors || 0}
- Active deals: ${metrics.active_deals || 0}
- Active subscriptions: ${metrics.active_subscriptions || 0}
- Audit findings: ${orch?.audit_findings?.length || 0} issues
- Auto-healing actions: ${orch?.actions_taken?.length || 0}

DEAL HUNT RESULTS (latest run):
- Opportunities found: ${huntResults.opportunities?.length || 0}
- Arbitrage opportunities: ${huntResults.arbitrage?.length || 0}
- Zero-competition niches: ${huntResults.niches?.length || 0}
- Competitor insights: ${huntResults.competitor_intel?.length || 0}
- Emerging trends: ${huntResults.trends?.length || 0}

TOP PROPERTIES (by score):
${JSON.stringify(topProperties)}

Generate the brief as JSON:
{
  "headline": "One-sentence headline summarizing the most important thing happening today",
  "system_status": "2-3 sentence assessment of system health and trajectory",
  "revenue_summary": "2-3 sentence financial status",
  "action_items": ["3-5 prioritized action items the owner should take today"],
  "competitive_intel": "2-3 sentence competitive intelligence summary",
  "opportunities": ["3-5 key opportunities discovered"],
  "risks": ["2-3 risks or issues needing attention"]
}

Be direct, specific, and actionable. This is for a real estate investment professional.`;

    const briefResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          system_status: { type: 'string' },
          revenue_summary: { type: 'string' },
          action_items: { type: 'array', items: { type: 'string' } },
          competitive_intel: { type: 'string' },
          opportunities: { type: 'array', items: { type: 'string' } },
          risks: { type: 'array', items: { type: 'string' } },
        }
      },
    });

    const brief = briefResult as any;

    // Generate the full natural language brief
    const fullBriefText = `${brief.headline}

SYSTEM STATUS: ${brief.system_status}

REVENUE: ${brief.revenue_summary}

COMPETITIVE INTEL: ${brief.competitive_intel}

ACTION ITEMS:
${brief.action_items.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}

OPPORTUNITIES:
${brief.opportunities.map((o: string) => `• ${o}`).join('\n')}

RISKS:
${brief.risks.map((r: string) => `• ${r}`).join('\n')}`;

    // Persist the brief
    const report = await base44.asServiceRole.entities.ShadowReport.create({
      run_at: now,
      type: 'brief',
      morning_brief: fullBriefText,
      brief_sections: {
        ...brief,
        top_properties: topProperties,
      },
      metrics: {
        system_score: orch?.overall_score || 0,
        convergence_delta: orch?.convergence_delta || 0,
        total_properties: metrics.total_properties || 0,
        active_deals: metrics.active_deals || 0,
        opportunities_found: huntResults.opportunities?.length || 0,
      },
    });

    return Response.json({
      ...brief,
      full_text: fullBriefText,
      top_properties: topProperties,
      report_id: report.id,
      run_at: now,
    });
  } catch (error) {
    console.error('generateMorningBrief error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}