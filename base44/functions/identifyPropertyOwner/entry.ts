import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { gatewayChat, isGatewayConfigured } from "../../shared/aiGateway.ts";

/**
 * identifyPropertyOwner — Master Owner Identification Engine.
 *
 * Given a property (by property_id or raw address), exhausts EVERY available
 * method and source to (1) identify the owner's name, (2) skip-trace contact
 * info, (3) check deceased status + find heirs/next of kin, and (4) build the
 * ownership chain. Persists Owner + OwnershipChain records and returns a
 * full confidence-scored report.
 *
 * Args:
 *   property_id  — existing Property record to identify the owner of
 *   address, city, state, zip_code — raw address (creates a draft Property if no property_id)
 *
 * Admin only.
 */

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    owner_name: { type: 'string', description: 'Full legal name of the current owner of record' },
    entity_type: { type: 'string', enum: ['individual', 'llc', 'trust', 'corporation', 'partnership', 'government', 'unknown'] },
    co_owners: { type: 'array', items: { type: 'string' }, description: 'Other named owners on the deed' },
    aka: { type: 'array', items: { type: 'string' }, description: 'Aliases / alternate names / maiden name / DBA' },
    deceased: { type: 'boolean', description: 'True if owner is confirmed or likely deceased' },
    deceased_evidence: { type: 'string', description: 'Obituary source or evidence if deceased' },
    contact_phone: { type: 'string' },
    contact_email: { type: 'string' },
    mailing_address: { type: 'string', description: 'Current mailing address if different from property' },
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
    ownership_chain: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          from_owner: { type: 'string' },
          to_owner: { type: 'string' },
          transfer_date: { type: 'string' },
          transfer_type: { type: 'string' },
          sale_price: { type: 'number' },
          source: { type: 'string' },
        },
      },
      description: 'Chronological chain of ownership transfers, oldest first',
    },
    methods: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          method: { type: 'string' },
          source: { type: 'string' },
          status: { type: 'string', enum: ['found', 'not_found', 'partial', 'error'] },
          result: { type: 'string' },
        },
      },
      description: 'Every identification method attempted and its outcome',
    },
    sources: { type: 'array', items: { type: 'string' }, description: 'All URLs/sites where information was found' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low', 'none'] },
    confidence_score: { type: 'number', description: '0-100' },
    summary: { type: 'string', description: 'Plain-English narrative of findings' },
  },
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { property_id, address, city, state, zip_code } = body;

    let property;
    let propertyAddress;

    if (property_id) {
      property = await base44.asServiceRole.entities.Property.get(property_id).catch(() => null);
      if (!property) return Response.json({ error: 'Property not found' }, { status: 404 });
      propertyAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;
    } else if (address) {
      propertyAddress = `${address}, ${city || ''}, ${state || ''} ${zip_code || ''}`.trim();
      // Create a draft property so the owner can be linked
      property = await base44.asServiceRole.entities.Property.create({
        address,
        city: city || '',
        state: state || '',
        zip_code: zip_code || '',
        status: 'draft',
        source: 'user_submitted',
      });
    } else {
      return Response.json({ error: 'property_id or address required' }, { status: 400 });
    }

    const prompt = `You are the master owner-identification engine for a real estate investment platform. Given a property address, you must EXHAUST EVERY available public-source method to:
1. Identify the current owner of record (legal name)
2. Skip-trace the owner (phone, email, mailing address)
3. Determine if the owner is deceased, and if so find heirs/executor
4. Build the ownership chain (prior transfers)

PROPERTY ADDRESS: ${propertyAddress}

You MUST attempt ALL of the following methods/sources and report the outcome of each in the "methods" array:

OWNER IDENTITY METHODS:
- County Property Appraiser / Assessor records (search the county assessor site for ${state || 'the state'})
- County Tax Collector / Tax Records (delinquency, owner of record)
- County Clerk / Recorder deed records (grantee search)
- FloridaDept of Revenue property data
- Real estate aggregator sites (Zillow, Redfin, Realtor.com, Trulia — show "owner" or "public records" section)
- MLS / public listing history
- GIS / parcel maps

SKIP-TRACE METHODS (only after identifying the owner name):
- People-search aggregators (TruePeopleSearch, FastPeopleSearch, Whitepages, Spokeo, BeenVerified, PeopleFinder)
- Social media (LinkedIn, Facebook, Instagram, Twitter/X)
- Business filings (Sunbiz.org for LLC/corporation owners in Florida, Secretary of State)
- Voter registration records
- Court records (county clerk case search)
- Reverse address lookup (who lives at this address)
- Phone number lookup (reverse phone)
- Email search (email rep, haveibeenpwned public, Google search of name + email)

DECEASED / HEIR METHODS:
- Obituary search (legacy.com, newspapers, funeral home sites near the property)
- Probate court filings (county probate clerk)
- Social Security Death Index
- Deed transfer to "Estate of" or "Personal Representative"

OWNERSHIP CHAIN METHODS:
- County deed records — chain of title (grantor/grantee index)
- Prior sale records (price, date, parties)
- Mortgage / lien recordings

INSTRUCTIONS:
- Search the LIVE web for each of these. Be thorough and persistent.
- In the "methods" array, report EVERY method you attempted with status "found", "not_found", "partial", or "error" and a brief result note.
- Only return contact info (phone, email) you actually found on the web. Do NOT invent or guess.
- For deceased status, set "deceased": true only if you found an obituary or death record; put the source in "deceased_evidence".
- For relatives/heirs, only include people you found evidence of.
- Set confidence_score as a number 0-100: 90+ = name + phone + email all found and corroborated; 70-89 = name + one contact method; 50-69 = name found, no contact; 30-49 = partial/uncertain name; below 30 = could not identify.
- Write a clear "summary" explaining what you found, what you could not find, and recommended next steps.

Return the complete JSON report.`;

    let r;
    if (isGatewayConfigured()) {
      // Use Perplexity Sonar Pro via the Vercel AI Gateway — live web search,
      // works even when platform integration credits are exhausted.
      const gw = await gatewayChat({
        prompt,
        web_search: true,
        model: 'perplexity/sonar-pro',
        max_tokens: 8000,
        response_json_schema: REPORT_SCHEMA,
      });
      r = gw.json || {};
      if (!r.owner_name) {
        // gateway didn't return clean JSON — try to salvage
        const salvage = gw.text.match(/\{[\s\S]*\}/);
        if (salvage) { try { r = JSON.parse(salvage[0]); } catch {} }
      }
    } else {
      // Fallback to built-in InvokeLLM (requires platform credits)
      r = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: REPORT_SCHEMA,
      });
    }

    const ownerName = r.owner_name || 'Unknown Owner';
    const confidenceScore = typeof r.confidence_score === 'number' ? r.confidence_score : confidenceToScore(r.confidence);

    // Check for existing current owner record for this property
    const existingOwners = await base44.asServiceRole.entities.Owner.filter({ property_id: property.id });
    const existingCurrent = existingOwners.find((o) => o.owner_type === 'current' && o.name === ownerName);

    const ownerUpdate = {
      property_id: property.id,
      name: ownerName,
      owner_type: 'current',
      entity_type: r.entity_type || 'individual',
      contact_phone: r.contact_phone || undefined,
      contact_email: r.contact_email || undefined,
      contact_address: r.mailing_address || undefined,
      deceased: !!r.deceased,
      aka: r.aka || [],
      identification_methods: r.methods || [],
      source: (r.sources || []).join(', ') || 'web_search',
      confidence_score: confidenceScore,
      is_verified: confidenceScore >= 70,
      is_reachable: !!(r.contact_phone || r.contact_email),
      next_of_kin: (r.relatives || []).map((rel) => ({
        name: rel.name,
        relationship: rel.relationship,
        contact_phone: rel.contact_phone || '',
        contact_email: rel.contact_email || '',
        source: rel.source || 'web search',
      })),
      last_identified_at: new Date().toISOString(),
    };

    let ownerId;
    if (existingCurrent) {
      await base44.asServiceRole.entities.Owner.update(existingCurrent.id, ownerUpdate);
      ownerId = existingCurrent.id;
    } else {
      const created = await base44.asServiceRole.entities.Owner.create(ownerUpdate);
      ownerId = created.id;
    }

    // Create co-owner records
    if (Array.isArray(r.co_owners)) {
      for (const coName of r.co_owners) {
        if (!coName || coName === ownerName) continue;
        const existing = existingOwners.find((o) => o.name === coName && o.property_id === property.id);
        if (!existing) {
          await base44.asServiceRole.entities.Owner.create({
            property_id: property.id,
            name: coName,
            owner_type: 'current',
            entity_type: 'individual',
            source: 'co-owner from deed',
            confidence_score: confidenceScore,
            last_identified_at: new Date().toISOString(),
          });
        }
      }
    }

    // Create potential_heir records for relatives with contact info (deceased cases)
    if (r.deceased && Array.isArray(r.relatives)) {
      for (const rel of r.relatives) {
        if (!rel.name) continue;
        const existing = existingOwners.find((o) => o.name === rel.name && o.property_id === property.id);
        if (!existing) {
          await base44.asServiceRole.entities.Owner.create({
            property_id: property.id,
            name: rel.name,
            owner_type: 'potential_heir',
            relationship_to_property: rel.relationship || 'heir',
            contact_phone: rel.contact_phone || undefined,
            contact_email: rel.contact_email || undefined,
            source: rel.source || 'heir search',
            is_reachable: !!(rel.contact_phone || rel.contact_email),
            last_identified_at: new Date().toISOString(),
          });
        }
      }
    }

    // Persist ownership chain
    if (Array.isArray(r.ownership_chain) && r.ownership_chain.length > 0) {
      const existingChain = await base44.asServiceRole.entities.OwnershipChain.filter({ property_id: property.id });
      if (existingChain.length > 0) {
        await base44.asServiceRole.entities.OwnershipChain.update(existingChain[0].id, {
          transfers: r.ownership_chain.map((t) => ({
            from_owner: t.from_owner || '',
            to_owner: t.to_owner || '',
            transfer_date: t.transfer_date || '',
            transfer_type: t.transfer_type || '',
            sale_price: t.sale_price || undefined,
            source: t.source || 'deed records',
          })),
        });
      } else {
        await base44.asServiceRole.entities.OwnershipChain.create({
          property_id: property.id,
          transfers: r.ownership_chain.map((t) => ({
            from_owner: t.from_owner || '',
            to_owner: t.to_owner || '',
            transfer_date: t.transfer_date || '',
            transfer_type: t.transfer_type || '',
            sale_price: t.sale_price || undefined,
            source: t.source || 'deed records',
          })),
        });
      }
    }

    return Response.json({
      property_id: property.id,
      property_address: propertyAddress,
      owner_id: ownerId,
      owner_name: ownerName,
      entity_type: r.entity_type || 'individual',
      co_owners: r.co_owners || [],
      aka: r.aka || [],
      deceased: !!r.deceased,
      deceased_evidence: r.deceased_evidence || null,
      contact_phone: r.contact_phone || null,
      contact_email: r.contact_email || null,
      mailing_address: r.mailing_address || null,
      relatives: r.relatives || [],
      ownership_chain: r.ownership_chain || [],
      methods: r.methods || [],
      sources: r.sources || [],
      confidence: r.confidence || 'none',
      confidence_score: confidenceScore,
      summary: r.summary || '',
    });
  } catch (error) {
    console.error('identifyPropertyOwner error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function confidenceToScore(c) {
  const map = { high: 90, medium: 65, low: 35, none: 10 };
  return map[c] ?? 20;
}