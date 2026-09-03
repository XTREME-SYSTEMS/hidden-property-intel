import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

/**
 * Manually scrapes for investor leads or property owners by city, state, and keywords.
 * Uses InvokeLLM with live web search, then stores results as new records.
 *
 * Args:
 *   target_type — 'investor' | 'owner'
 *   city        — city name (optional)
 *   state       — state name (required)
 *   keywords    — additional search keywords (optional, e.g. "wholesaler fix-and-flip")
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { target_type, city, state, keywords } = body;
    if (!target_type || !state) return Response.json({ error: 'target_type and state required' }, { status: 400 });

    const location = city ? `${city}, ${state}` : state;
    const kwContext = keywords ? ` Focus specifically on: ${keywords}.` : '';

    if (target_type === 'investor') {
      const prompt = `Search the LIVE web for real estate investors, cash buyers, house flippers, wholesalers, and investment firms active in ${location}.${kwContext} Look at real estate meetup groups, investment clubs, LinkedIn, BiggerPockets profiles, company websites, and public business filings. Return up to 25 leads with publicly listed contact information. Only include leads with at least an email OR phone number. Return JSON only.`;

      const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            investors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  company: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  website: { type: 'string' },
                  target_markets: { type: 'array', items: { type: 'string' } },
                  investment_types: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      });

      const leads = r.investors || [];
      let saved = 0;
      let skipped = 0;
      for (const l of leads) {
        if (!l.email && !l.phone) { skipped++; continue; }
        if (l.email) {
          const existing = await base44.asServiceRole.entities.InvestorLead.filter({ email: l.email });
          if (existing.length) { skipped++; continue; }
        }
        await base44.asServiceRole.entities.InvestorLead.create({
          name: l.name || 'Unknown',
          company: l.company,
          email: l.email,
          phone: l.phone,
          website: l.website,
          target_markets: l.target_markets || [],
          investment_types: l.investment_types || [],
          region: location,
          source: 'manual_scrape',
          outreach_status: 'new',
        });
        saved++;
      }
      return Response.json({ found: leads.length, saved, skipped, target_type: 'investor' });
    }

    // Owner scrape
    const prompt = `Search the LIVE web for property owners in ${location} who may be in distressed real estate situations.${kwContext} Search public records, county clerk foreclosure filings, probate court notices, tax deed sale listings, code violation liens, divorce filings, bankruptcy filings, and obituaries. Find property owners who may need to sell — look for names, property addresses, and any contact information. Return up to 25 results. Return JSON only.`;

    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          owners: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                property_address: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zip_code: { type: 'string' },
                distress_type: { type: 'string' },
                contact_phone: { type: 'string' },
                contact_email: { type: 'string' },
                contact_address: { type: 'string' },
                owner_type: { type: 'string' },
                source_url: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const owners = r.owners || [];
    let saved = 0;
    for (const o of owners) {
      if (!o.name) continue;
      await base44.asServiceRole.entities.Owner.create({
        name: o.name,
        owner_type: o.owner_type || 'current',
        contact_phone: o.contact_phone,
        contact_email: o.contact_email,
        contact_address: o.contact_address || o.property_address,
        relationship_to_property: o.distress_type ? `Distress: ${o.distress_type}` : undefined,
        source: 'manual_scrape',
        source_url: o.source_url,
        outreach_status: 'new',
      });
      saved++;
    }
    return Response.json({ found: owners.length, saved, target_type: 'owner' });
  } catch (error) {
    console.error('manualScrapeTargets error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}