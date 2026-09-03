import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { normalizeAddress, dedupeKey } from '../../shared/addressUtils.ts';

/**
 * ScrapeProbateRecords — continuously monitors sources that indicate deceased homeowners
 * and finds their next of kin or whoever the house gets signed over to.
 *
 * Sources scanned:
 *  - Florida obituary aggregators (legacy.com, tributes.com, local newspaper obituaries)
 *  - County probate court filings (circuit court probate divisions)
 *  - Florida death notice publications
 *
 * For each deceased homeowner found:
 *  1. Cross-reference the deceased name with county property appraiser records
 *  2. Create a Property record with distress_type = 'probate_inherited'
 *  3. Create an Owner record for the deceased (owner_type = 'previous')
 *  4. Trigger heir search to find next of kin / will executors
 *
 * Args:
 *  state — target state (default: FL)
 *  county — optional county filter
 *  max_results — max deceased homeowners to find per run (default: 15)
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const state = body.state || 'FL';
    const county = body.county || null;
    const maxResults = body.max_results || 15;

    // Get existing probate sources
    const probateSources = await base44.asServiceRole.entities.DataSource.filter({
      type: 'probate_court',
      status: 'active'
    });
    const obituarySources = await base44.asServiceRole.entities.DataSource.filter({
      type: 'obituary',
      status: 'active'
    });

    const region = county ? `${county} County, ${state}` : `the state of ${state}`;

    const prompt = `You are a probate property researcher for a real estate investment platform. Search the LIVE web for recently deceased homeowners in ${region}, United States, whose properties are likely entering probate.

Search these source types:
1. OBITUARIES — legacy.com, tributes.com, local Florida newspaper obituary sections, funeral home websites. Look for obituaries published in the last 60 days that mention the deceased owned a home or property.
2. PROBATE COURT FILINGS — county circuit court probate divisions, clerk of court probate records, probate notices published in legal newspapers.
3. DEATH NOTICES — public death notices that reference real estate holdings.

For each deceased homeowner found, return:
- deceased_name: full name of the deceased
- death_date: approximate date of death (if known)
- death_date_source: where you found the death information (obituary URL, probate filing, etc.)
- property_address: the property address if identifiable from obituary, probate filing, or property records (if not found, leave empty — we'll cross-reference)
- city, state, zip_code: property location if known
- estimated_value: estimated property value if findable
- bedrooms, bathrooms, square_footage: if available
- heirs_known: any heirs, executors, or next of kin mentioned in the obituary or probate filing (names and relationships)
- probate_status: "filed", "pending", "published_notice", or "unknown"
- source_url: the exact URL where you found this information
- notes: additional context (e.g., "survived by spouse and 2 children", "estate includes residential property")

CRITICAL: Only return deceased individuals you actually found via web search. Do NOT invent or guess. If you cannot find real records, return an empty array.

Return up to ${maxResults} records.`;

    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          deceased_homeowners: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                deceased_name: { type: 'string' },
                death_date: { type: 'string' },
                death_date_source: { type: 'string' },
                property_address: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zip_code: { type: 'string' },
                estimated_value: { type: 'number' },
                bedrooms: { type: 'number' },
                bathrooms: { type: 'number' },
                square_footage: { type: 'number' },
                heirs_known: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      relationship: { type: 'string' },
                      contact_info: { type: 'string' }
                    }
                  }
                },
                probate_status: { type: 'string' },
                source_url: { type: 'string' },
                notes: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const deceased = r.deceased_homeowners || [];
    let propertiesCreated = 0;
    let propertiesUpdated = 0;
    let ownersCreated = 0;
    let heirsIdentified = 0;
    const newProbateProperties = [];

    for (const d of deceased) {
      if (!d.deceased_name) continue;

      // If we have a property address, create/update the property
      if (d.property_address && d.city) {
        const norm = normalizeAddress(d.property_address);
        let existing = await base44.asServiceRole.entities.Property.filter({
          zip_code: d.zip_code,
          normalized_address: norm
        });
        if (!existing.length && d.zip_code) {
          existing = await base44.asServiceRole.entities.Property.filter({
            address: d.property_address,
            zip_code: d.zip_code
          });
        }

        const propertyData = {
          address: d.property_address,
          normalized_address: norm,
          city: d.city,
          state: d.state || state,
          zip_code: d.zip_code,
          distress_type: 'probate_inherited',
          estimated_value: d.estimated_value || null,
          bedrooms: d.bedrooms || null,
          bathrooms: d.bathrooms || null,
          square_footage: d.square_footage || null,
          description: d.notes || `Probate property — owner deceased ${d.death_date || 'recently'}. Probate status: ${d.probate_status || 'unknown'}.`,
          source: 'scraped',
          source_url: d.source_url || d.death_date_source,
          scraped_at: new Date().toISOString(),
          status: 'draft'
        };

        let propertyId;
        if (existing[0]) {
          // Update existing property to probate_inherited if it wasn't already
          await base44.asServiceRole.entities.Property.update(existing[0].id, propertyData);
          propertyId = existing[0].id;
          propertiesUpdated++;
        } else {
          const created = await base44.asServiceRole.entities.Property.create(propertyData);
          propertyId = created.id;
          propertiesCreated++;
          newProbateProperties.push(created);
        }

        // Create deceased owner record
        const deceasedOwner = await base44.asServiceRole.entities.Owner.create({
          property_id: propertyId,
          name: d.deceased_name,
          owner_type: 'previous',
          relationship_to_property: 'deceased owner',
          source: d.death_date_source || 'probate_scraper',
          is_reachable: false,
          notes: `Deceased ${d.death_date || 'recently'}. Probate status: ${d.probate_status || 'unknown'}.`
        });
        ownersCreated++;

        // Create heir/next-of-kin records if identified
        if (d.heirs_known && d.heirs_known.length > 0) {
          for (const heir of d.heirs_known) {
            if (!heir.name) continue;
            const heirContact = heir.contact_info || '';
            const emailMatch = heirContact.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
            const phoneMatch = heirContact.match(/[\d\s().-]{10,}/);

            await base44.asServiceRole.entities.Owner.create({
              property_id: propertyId,
              name: heir.name,
              owner_type: 'potential_heir',
              relationship_to_property: heir.relationship || 'heir',
              contact_email: emailMatch ? emailMatch[0] : undefined,
              contact_phone: phoneMatch ? phoneMatch[0].trim() : undefined,
              source: 'obituary/probate filing',
              is_reachable: !!(emailMatch || phoneMatch),
              is_verified: false,
              next_of_kin: [{
                name: d.deceased_name,
                relationship: 'deceased owner',
                source: d.death_date_source || 'probate_scraper'
              }]
            });
            ownersCreated++;
            heirsIdentified++;
          }
        }
      } else {
        // No property address — still record the deceased name for future cross-referencing
        // Try to find their property via a secondary LLM search
        const lookupPrompt = `Search the web for property records owned by ${d.deceased_name} in ${region}. Check county property appraiser sites, tax collector records, or any public records that show their home address. Return the property address if found.`;
        try {
          const lookup = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: lookupPrompt,
            add_context_from_internet: true,
            model: 'gemini_3_flash',
            response_json_schema: {
              type: 'object',
              properties: {
                property_address: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zip_code: { type: 'string' },
                estimated_value: { type: 'number' },
                source_url: { type: 'string' },
                confidence: { type: 'string' }
              }
            }
          });

          if (lookup.property_address && lookup.confidence !== 'low') {
            const norm = normalizeAddress(lookup.property_address);
            let existing = await base44.asServiceRole.entities.Property.filter({
              zip_code: lookup.zip_code,
              normalized_address: norm
            });

            const propertyData = {
              address: lookup.property_address,
              normalized_address: norm,
              city: lookup.city || d.city,
              state: lookup.state || state,
              zip_code: lookup.zip_code,
              distress_type: 'probate_inherited',
              estimated_value: lookup.estimated_value || null,
              description: d.notes || `Probate property — owner deceased ${d.death_date || 'recently'}.`,
              source: 'scraped',
              source_url: lookup.source_url || d.death_date_source,
              scraped_at: new Date().toISOString(),
              status: 'draft'
            };

            let propertyId;
            if (existing[0]) {
              await base44.asServiceRole.entities.Property.update(existing[0].id, propertyData);
              propertyId = existing[0].id;
              propertiesUpdated++;
            } else {
              const created = await base44.asServiceRole.entities.Property.create(propertyData);
              propertyId = created.id;
              propertiesCreated++;
              newProbateProperties.push(created);
            }

            await base44.asServiceRole.entities.Owner.create({
              property_id: propertyId,
              name: d.deceased_name,
              owner_type: 'previous',
              relationship_to_property: 'deceased owner',
              source: d.death_date_source || 'probate_scraper',
              is_reachable: false
            });
            ownersCreated++;

            // Create heir records
            if (d.heirs_known && d.heirs_known.length > 0) {
              for (const heir of d.heirs_known) {
                if (!heir.name) continue;
                await base44.asServiceRole.entities.Owner.create({
                  property_id: propertyId,
                  name: heir.name,
                  owner_type: 'potential_heir',
                  relationship_to_property: heir.relationship || 'heir',
                  source: 'obituary/probate filing',
                  is_reachable: false
                });
                ownersCreated++;
                heirsIdentified++;
              }
            }
          }
        } catch (e) {
          // Secondary lookup failed — skip this record
          console.error('property lookup failed for', d.deceased_name, e?.message);
        }
      }
    }

    return Response.json({
      scanned_sources: probateSources.length + obituarySources.length,
      deceased_found: deceased.length,
      properties_created: propertiesCreated,
      properties_updated: propertiesUpdated,
      owners_created: ownersCreated,
      heirs_identified: heirsIdentified,
      new_properties: newProbateProperties.map(p => ({ id: p.id, address: p.address, city: p.city }))
    });
  } catch (error) {
    console.error('scrapeProbateRecords error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}