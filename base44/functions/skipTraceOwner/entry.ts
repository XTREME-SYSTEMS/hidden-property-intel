import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * Skip-trace an owner to enrich contact info (phone, email, relatives).
 * Uses InvokeLLM with live web search as a fallback when no skip-trace API key is configured.
 * When a TLO/IRBsearch API key is available, this function will use it instead.
 *
 * Args:
 *   owner_id — the Owner record to enrich
 *   property_id — optional, for context (address)
 *
 * Updates the Owner record with found contact_phone, contact_email, and is_verified=true.
 */
const SKIP_SCHEMA = {
  type: 'object',
  properties: {
    phone: { type: 'string' },
    email: { type: 'string' },
    mailing_address: { type: 'string' },
    relatives: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'string', enum: ['high', 'medium', 'low', 'none'] },
    sources: { type: 'array', items: { type: 'string' } },
  },
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { owner_id, property_id } = body;
    if (!owner_id) return Response.json({ error: 'owner_id required' }, { status: 400 });

    const owners = await base44.asServiceRole.entities.Owner.filter({ id: owner_id });
    const owner = owners[0];
    if (!owner) return Response.json({ error: 'Owner not found' }, { status: 404 });

    // Get property for address context
    let propertyAddress = '';
    if (owner.property_id || property_id) {
      const prop = await base44.asServiceRole.entities.Property.get(owner.property_id || property_id).catch(() => null);
      if (prop) propertyAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
    }

    const prompt = `You are a skip-trace specialist for real estate. Search the LIVE web for contact information for this person:

Name: ${owner.name}
Property address: ${propertyAddress}
Owner type: ${owner.owner_type}

Search public records, people-search sites (whitepages, truepeoplesearch, fastpeoplesearch, spokeo), social media (LinkedIn, Facebook), business filings, and property records.

Find:
- Current phone number(s)
- Email address(es)
- Mailing address (if different from property)
- Known relatives or associates (especially important for probate/heir cases)

Return JSON with: phone, email, mailing_address, relatives (array of names), confidence (high/medium/low/none based on how many sources corroborate), and sources (array of sites where you found this info).

CRITICAL: Only return contact info you actually found on the web. Do NOT invent or guess phone numbers or emails. If you cannot find contact info, return empty strings and confidence "none".`;

    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: SKIP_SCHEMA,
    });

    const update: any = {
      is_verified: r.confidence === 'high' || r.confidence === 'medium',
      contacted_at: new Date().toISOString(),
      source: (r.sources || []).join(', ') || 'web_search',
    };
    if (r.phone) update.contact_phone = r.phone;
    if (r.email) update.contact_email = r.email;
    if (r.mailing_address) update.contact_address = r.mailing_address;

    await base44.asServiceRole.entities.Owner.update(owner.id, update);

    return Response.json({
      owner_id: owner.id,
      name: owner.name,
      phone: r.phone || null,
      email: r.email || null,
      relatives: r.relatives || [],
      confidence: r.confidence || 'none',
      sources: r.sources || [],
      verified: update.is_verified,
    });
  } catch (error) {
    console.error('skipTraceOwner error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}