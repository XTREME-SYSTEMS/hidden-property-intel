import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    // Allow workflow calls (no user context) but block non-admin authenticated users
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const region = body?.region;

    const all = await base44.asServiceRole.entities.Property.list('-created_date', 1000);
    const inRegion = region
      ? all.filter(p => `${p.city}, ${p.state}` === region || p.city === region || p.state === region)
      : all;

    const groups = {};
    for (const p of inRegion) {
      const key = `${p.city}, ${p.state}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }

    const results = [];
    for (const [key, props] of Object.entries(groups)) {
      const [city, state] = key.split(', ');
      const values = props.map(p => p.estimated_value).filter(v => v != null);
      const sqfts = props.map(p => p.square_footage).filter(v => v > 0);
      const doms = props.map(p => p.days_on_market).filter(v => v != null);
      const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const avgPerSqft = values.length && sqfts.length
        ? values.reduce((a, b, i) => a + (b / (sqfts[i] || 1)), 0) / values.length
        : 0;
      const avgDom = doms.length ? doms.reduce((a, b) => a + b, 0) / doms.length : 0;
      const distressCount = props.filter(p => p.distress_type).length;
      const distressTypes = {};
      for (const p of props) {
        if (p.distress_type) distressTypes[p.distress_type] = (distressTypes[p.distress_type] || 0) + 1;
      }
      const top = Object.entries(distressTypes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);

      // Use LLM to get real market trend data for this region
      let trend = 'stable';
      let trendPct = 0;
      let medianRoi = 0;
      try {
        const trendSchema = {
          type: 'object',
          properties: {
            price_trend: { type: 'string', enum: ['rising', 'falling', 'stable'] },
            trend_percentage: { type: 'number' },
            median_roi: { type: 'number' }
          }
        };
        const trendRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a real estate market analyst. Search the LIVE web for current market trends in ${key}, United States. What is the current home price trend (rising/falling/stable), the approximate year-over-year percentage change, and the median ROI for real estate investors in this area? Return JSON only.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: trendSchema
        });
        trend = trendRes.price_trend || 'stable';
        trendPct = trendRes.trend_percentage || 0;
        medianRoi = trendRes.median_roi || 0;
      } catch (e) {
        console.error('trend LLM failed for', key, e?.message);
      }

      const payload = {
        region: key,
        state,
        avg_price: avg,
        avg_price_per_sqft: avgPerSqft,
        avg_days_on_market: avgDom,
        distress_property_count: distressCount,
        price_trend: trend,
        trend_percentage: trendPct,
        median_roi: medianRoi,
        top_distress_types: top,
        updated_at: new Date().toISOString()
      };

      const existing = await base44.asServiceRole.entities.MarketAnalytics.filter({ region: key });
      if (existing[0]) {
        await base44.asServiceRole.entities.MarketAnalytics.update(existing[0].id, payload);
        results.push({ region: key, updated: existing[0].id });
      } else {
        const rec = await base44.asServiceRole.entities.MarketAnalytics.create(payload);
        results.push({ region: key, created: rec.id });
      }
    }

    return Response.json({ synced: results.length, regions: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}