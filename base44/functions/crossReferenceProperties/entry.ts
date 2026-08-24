import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Cross-reference system: periodically checks active properties against the live web
 * to detect whether they have sold, gone off-market, or are still available.
 *
 * For each active property, uses LLM web-search to verify current listing status.
 * Updates Property.status to 'expired' (off-market / sold) when no longer available.
 *
 * Processes in batches to stay within serverless time limits.
 */

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    still_available: { type: 'boolean' },
    status: { type: 'string', enum: ['active', 'sold', 'off_market', 'expired', 'unknown'] },
    new_price: { type: 'number' },
    days_since_listed: { type: 'number' },
    reason: { type: 'string' }
  }
};

const BATCH_SIZE = 10;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Only admins can trigger cross-reference
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch active + draft properties, oldest-verified first (most stale = highest priority)
    // Uses last_verified_at (separate from scraped_at) so original scrape time is preserved
    const properties = await base44.asServiceRole.entities.Property.filter(
      { status: { $in: ['active', 'draft'] } },
      'last_verified_at',
      200
    );

    // Always check the oldest BATCH_SIZE properties (those cross-referenced longest ago)
    const toCheck = properties.slice(0, BATCH_SIZE);

    let expired = 0;
    let stillActive = 0;
    let updatedPrice = 0;
    let unknown = 0;
    const results = [];

    for (const p of toCheck) {
      try {
        const prompt = `You are a real estate listing verifier. Search the LIVE web for this EXACT property address and determine its CURRENT listing status:
${p.address}, ${p.city}, ${p.state} ${p.zip_code}

Check whether this property is:
- Still actively listed for sale (on Redfin, Zillow, Homes.com, Auction.com, realforeclose.com, or any real estate site)
- Sold / closed (look for "sold" status, sale date, or recent sale price)
- Off-market / expired / withdrawn (no longer listed anywhere)

Return JSON with: still_available (boolean), status (active/sold/off_market/expired/unknown), new_price (if you find a current or sale price, number), days_since_listed (approximate), and reason (1 sentence explaining what you found).`;

        const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: VERIFY_SCHEMA
        });

        const status = (r.status || 'unknown').toLowerCase();
        const update: any = { last_verified_at: new Date().toISOString() };

        if (status === 'sold' || status === 'off_market' || status === 'expired' || r.still_available === false) {
          update.status = 'expired';
          update.days_on_market = r.days_since_listed || p.days_on_market;
          expired++;
          results.push({ id: p.id, address: p.address, action: 'expired', reason: r.reason });
        } else if (status === 'active' || r.still_available === true) {
          stillActive++;
          if (r.new_price && r.new_price !== p.proposed_asking_price) {
            update.proposed_asking_price = r.new_price;
            updatedPrice++;
          }
          results.push({ id: p.id, address: p.address, action: 'active', price: r.new_price });
        } else {
          unknown++;
          results.push({ id: p.id, address: p.address, action: 'unknown', reason: r.reason });
        }

        await base44.asServiceRole.entities.Property.update(p.id, update);
      } catch (e) {
        console.error('cross-ref failed for', p.id, e?.message);
        unknown++;
        results.push({ id: p.id, address: p.address, action: 'error', error: e.message });
      }
    }

    return Response.json({
      checked: toCheck.length,
      expired,
      still_active: stillActive,
      price_updated: updatedPrice,
      unknown,
      results
    });
  } catch (error) {
    console.error('crossReferenceProperties error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}