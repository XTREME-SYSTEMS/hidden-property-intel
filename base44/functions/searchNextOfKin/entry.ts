import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

/**
 * Searches the live web for known relatives / next of kin of a property owner
 * who may be unreachable. Stores results on the Owner record's next_of_kin array.
 *
 * Args:
 *   owner_id — the Owner record ID
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { owner_id } = body;
    if (!owner_id) return Response.json({ error: 'owner_id required' }, { status: 400 });

    const owners = await base44.asServiceRole.entities.Owner.filter({ id: owner_id });
    const owner = owners[0];
    if (!owner) return Response.json({ error: 'Owner not found' }, { status: 404 });

    // Get property address for context
    let propertyAddress = '';
    if (owner.property_id) {
      const prop = await base44.asServiceRole.entities.Property.get(owner.property_id).catch(() => null);
      if (prop) propertyAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
    }
    if (!propertyAddress && owner.contact_address) propertyAddress = owner.contact_address;

    const prompt = `You are a skip-trace specialist for real estate. The property owner below may be unreachable and we need to find known relatives or associates who may have contact with them.

OWNER INFO:
- Name: ${owner.name}
- Property address: ${propertyAddress || 'Unknown'}
- Owner type: ${owner.owner_type}

Search the LIVE web for:
- Obituary records (if the owner may be deceased — search obituaries near the property address)
- Probate court filings (which often list heirs and executors)
- People-search sites (whitepages, truepeoplesearch, fastpeoplesearch) for known relatives/associates
- Social media (Facebook, LinkedIn) for family connections
- Property deed records that may show co-owners or prior transfer to family

Find known relatives, heirs, executors, or close associates who may be able to reach this owner or act on their behalf. For each person found, include their name, relationship to the owner (if determinable), and any contact information (phone, email).

CRITICAL: Only return people you actually found evidence of on the web. Do NOT invent or guess relatives. If you cannot find any, return an empty array.

Return JSON: {
  "relatives": [
    { "name": "...", "relationship": "...", "contact_phone": "...", "contact_email": "...", "source": "where you found them" }
  ],
  "confidence": "high|medium|low|none"
}`;

    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          relatives: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                relationship: { type: 'string' },
                contact_phone: { type: 'string' },
                contact_email: { type: 'string' },
                source: { type: 'string' },
              },
            },
          },
          confidence: { type: 'string', enum: ['high', 'medium', 'low', 'none'] },
        },
      },
    });

    const relatives = r.relatives || [];
    const confidence = r.confidence || 'none';

    await base44.asServiceRole.entities.Owner.update(owner.id, {
      next_of_kin: relatives,
      is_reachable: confidence !== 'none' || relatives.length === 0 ? owner.is_reachable : false,
    });

    return Response.json({
      owner_id: owner.id,
      name: owner.name,
      relatives,
      confidence,
    });
  } catch (error) {
    console.error('searchNextOfKin error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}