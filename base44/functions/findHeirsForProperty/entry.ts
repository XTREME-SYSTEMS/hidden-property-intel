import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

/**
 * FindHeirsForProperty — enhanced heir finder specifically for probate properties.
 *
 * Takes a property_id with a deceased owner and searches the web for:
 *  - Probate court filings listing heirs and executors
 *  - Obituary survivors list (spouse, children, siblings)
 *  - Social media family connections
 *  - Property deed transfers to family members
 *  - People-search sites for relatives of the deceased
 *
 * Creates Owner records for each identified heir with owner_type = 'potential_heir'.
 * Stores all relatives on the deceased owner's next_of_kin array.
 *
 * Args:
 *  property_id — the probate property ID
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { property_id } = body;
    if (!property_id) return Response.json({ error: 'property_id required' }, { status: 400 });

    const property = await base44.asServiceRole.entities.Property.get(property_id);
    if (!property) return Response.json({ error: 'Property not found' }, { status: 404 });

    const propertyAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;

    // Get the deceased owner
    const owners = await base44.asServiceRole.entities.Owner.filter({ property_id });
    const deceasedOwner = owners.find(o => o.owner_type === 'previous' && o.relationship_to_property === 'deceased owner');
    if (!deceasedOwner) return Response.json({ error: 'No deceased owner found for this property' }, { status: 404 });

    // Skip if heirs already found with contact info
    const existingHeirs = owners.filter(o => o.owner_type === 'potential_heir' && (o.contact_email || o.contact_phone));
    if (existingHeirs.length > 0) {
      return Response.json({
        property_id,
        deceased_name: deceasedOwner.name,
        heirs_already_found: existingHeirs.length,
        heirs: existingHeirs.map(h => ({ name: h.name, relationship: h.relationship_to_property, email: h.contact_email, phone: h.contact_phone }))
      });
    }

    const prompt = `You are a probate heir researcher for a real estate investment platform. A property owner has died and we need to find their next of kin, heirs, or the executor of their estate.

DECEASED OWNER: ${deceasedOwner.name}
PROPERTY: ${propertyAddress}
OWNER NOTES: ${deceasedOwner.notes || 'No additional notes'}

Search the LIVE web for:
1. OBITUARIES — Find the obituary for ${deceasedOwner.name} near ${property.city}, ${property.state}. Obituaries typically list survivors: spouse, children, siblings, parents, grandchildren. Extract each survivor's name and relationship.
2. PROBATE COURT FILINGS — Search county probate court records for ${deceasedOwner.name}. Probate filings list the executor/personal representative and all heirs at law.
3. PROPERTY DEED TRANSFERS — Check if the property has been transferred to a family member via probate (look for "Personal Representative's Deed" or "Executor's Deed").
4. PEOPLE-SEARCH SITES — Search for relatives of ${deceasedOwner.name} at ${property.city}, ${property.state} (truepeoplesearch, fastpeoplesearch, whitepages).
5. SOCIAL MEDIA — Search Facebook for family members of ${deceasedOwner.name} in ${property.city}, ${property.state}.

For each heir/relative found, provide:
- name: full name
- relationship: spouse, son, daughter, brother, sister, executor, trustee, etc.
- contact_phone: if findable
- contact_email: if findable
- contact_address: their mailing address if findable
- source: where you found them (obituary, probate filing, people-search, social media)
- confidence: high, medium, or low

CRITICAL: Only return people you actually found evidence of. Do NOT invent or guess relatives. If you cannot find any, return an empty array.

Return JSON: {
  "heirs": [
    { "name": "...", "relationship": "...", "contact_phone": "...", "contact_email": "...", "contact_address": "...", "source": "...", "confidence": "..." }
  ],
  "obituary_found": true/false,
  "obituary_url": "...",
  "probate_filing_found": true/false,
  "probate_case_number": "...",
  "executor_name": "...",
  "overall_confidence": "high|medium|low|none"
}`;

    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          heirs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                relationship: { type: 'string' },
                contact_phone: { type: 'string' },
                contact_email: { type: 'string' },
                contact_address: { type: 'string' },
                source: { type: 'string' },
                confidence: { type: 'string' }
              }
            }
          },
          obituary_found: { type: 'boolean' },
          obituary_url: { type: 'string' },
          probate_filing_found: { type: 'boolean' },
          probate_case_number: { type: 'string' },
          executor_name: { type: 'string' },
          overall_confidence: { type: 'string' }
        }
      }
    });

    const heirs = r.heirs || [];
    let newHeirsCreated = 0;

    // Update the deceased owner's next_of_kin array
    const nextOfKin = heirs.map(h => ({
      name: h.name,
      relationship: h.relationship,
      contact_phone: h.contact_phone || '',
      contact_email: h.contact_email || '',
      source: h.source || 'web search'
    }));

    await base44.asServiceRole.entities.Owner.update(deceasedOwner.id, {
      next_of_kin: nextOfKin,
      notes: `${deceasedOwner.notes || ''} | Heir search: ${r.obituary_found ? 'Obituary found' : 'No obituary'}, ${r.probate_filing_found ? 'Probate filing found' : 'No probate filing'}. Executor: ${r.executor_name || 'unknown'}. Confidence: ${r.overall_confidence || 'none'}`
    });

    // Create Owner records for each new heir (dedupe by name + property)
    for (const heir of heirs) {
      if (!heir.name) continue;
      const existing = owners.find(o => o.name === heir.name && o.property_id === property_id);
      if (existing) {
        // Update existing heir record with new contact info
        if (heir.contact_email || heir.contact_phone) {
          await base44.asServiceRole.entities.Owner.update(existing.id, {
            contact_email: heir.contact_email || existing.contact_email,
            contact_phone: heir.contact_phone || existing.contact_phone,
            contact_address: heir.contact_address || existing.contact_address,
            is_reachable: !!(heir.contact_email || heir.contact_phone),
            is_verified: heir.confidence === 'high'
          });
        }
      } else {
        await base44.asServiceRole.entities.Owner.create({
          property_id,
          name: heir.name,
          owner_type: 'potential_heir',
          relationship_to_property: heir.relationship || 'heir',
          contact_email: heir.contact_email || undefined,
          contact_phone: heir.contact_phone || undefined,
          contact_address: heir.contact_address || undefined,
          source: heir.source || 'heir search',
          is_reachable: !!(heir.contact_email || heir.contact_phone),
          is_verified: heir.confidence === 'high',
          next_of_kin: [{
            name: deceasedOwner.name,
            relationship: 'deceased owner',
            source: 'heir search'
          }]
        });
        newHeirsCreated++;
      }
    }

    return Response.json({
      property_id,
      deceased_name: deceasedOwner.name,
      property_address: propertyAddress,
      heirs_found: heirs.length,
      new_heirs_created: newHeirsCreated,
      obituary_found: r.obituary_found,
      obituary_url: r.obituary_url,
      probate_filing_found: r.probate_filing_found,
      probate_case_number: r.probate_case_number,
      executor_name: r.executor_name,
      overall_confidence: r.overall_confidence,
      heirs: heirs.map(h => ({
        name: h.name,
        relationship: h.relationship,
        email: h.contact_email,
        phone: h.contact_phone,
        source: h.source,
        confidence: h.confidence
      }))
    });
  } catch (error) {
    console.error('findHeirsForProperty error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}