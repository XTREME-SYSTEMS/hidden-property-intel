/**
 * Property data enrichment engine — gathers investor-relevant data via LLM web search.
 *
 * For each property, researches and returns:
 *  - rental_estimate: estimated monthly rent for this property type in this area
 *  - neighborhood_rating: 1-10 neighborhood quality
 *  - school_rating: 1-10 nearby public school rating
 *  - crime_level: low / moderate / high / unknown
 *  - flood_zone: FEMA flood zone designation
 *  - zoning: zoning designation
 *  - tax_assessed_value: current tax assessed value
 *  - equity_estimate: market value minus liens/mortgages
 *  - occupancy_status: vacant / occupied / unknown
 *  - investor_summary: 2-3 paragraph investor analysis
 *
 * Used by:
 *  - enrichProperties backend function (scheduled batch enrichment)
 */

const ENRICHMENT_SCHEMA = {
  type: 'object',
  properties: {
    rental_estimate: { type: 'number' },
    neighborhood_rating: { type: 'number' },
    school_rating: { type: 'number' },
    crime_level: { type: 'string', enum: ['low', 'moderate', 'high', 'unknown'] },
    flood_zone: { type: 'string' },
    zoning: { type: 'string' },
    tax_assessed_value: { type: 'number' },
    equity_estimate: { type: 'number' },
    occupancy_status: { type: 'string', enum: ['vacant', 'occupied', 'unknown'] },
    investor_summary: { type: 'string' }
  }
};

function buildEnrichmentPrompt(property: any) {
  return `You are a real estate investment analyst enriching property data for investors. Research this property using the live web and return JSON only.

Address: ${property.address}, ${property.city}, ${property.state} ${property.zip_code}
Type: ${property.property_type || 'residential'}, Distress: ${property.distress_type || 'unknown'}
Beds: ${property.bedrooms ?? 'n/a'}, Baths: ${property.bathrooms ?? 'n/a'}, Sqft: ${property.square_footage ?? 'n/a'}, Year built: ${property.year_built ?? 'n/a'}, Lot sqft: ${property.lot_size ?? 'n/a'}
Estimated value: ${property.estimated_value ?? 'n/a'}, Proposed asking: ${property.proposed_asking_price ?? 'n/a'}

Research the web for this specific property and its neighborhood. Use county property appraiser sites, Zillow, Rentometer, GreatSchools, CrimeMapping, FEMA flood maps, and local zoning data. Return:

1. rental_estimate: estimated monthly rent for this property type in this area (USD, number)
2. neighborhood_rating: 1-10 overall neighborhood quality (10 = excellent)
3. school_rating: 1-10 average nearby public school rating (10 = top)
4. crime_level: "low", "moderate", "high", or "unknown"
5. flood_zone: FEMA flood zone designation (e.g. "X", "AE", "VE") — empty string if not found
6. zoning: zoning designation (e.g. "RS-1", "RM-2", "commercial") — empty string if not found
7. tax_assessed_value: current tax assessed value (USD, number)
8. equity_estimate: estimated equity = market value minus outstanding liens/mortgages (USD, number)
9. occupancy_status: "vacant", "occupied", or "unknown"
10. investor_summary: 2-3 paragraph analysis covering: investment potential, neighborhood profile, rental income potential, key risks (flood, crime, title), and recommended exit strategy (flip, BRRRR, buy-and-hold, wholesale). Be specific to this property and area.

If specific data is unavailable, estimate conservatively based on the area and note the uncertainty in the investor_summary. Never fabricate exact addresses or comps — use area-level estimates when property-specific data is missing.`;
}

/**
 * Enrich a single property with investor-relevant data via LLM web search.
 * Persists all enrichment fields + enriched_at timestamp onto the Property record.
 * Returns the enrichment data object.
 */
export async function enrichProperty(base44: any, property: any) {
  const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: buildEnrichmentPrompt(property),
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: ENRICHMENT_SCHEMA
  });

  const enrichmentData = {
    rental_estimate: r.rental_estimate ?? null,
    neighborhood_rating: r.neighborhood_rating ?? null,
    school_rating: r.school_rating ?? null,
    crime_level: r.crime_level || 'unknown',
    flood_zone: r.flood_zone || null,
    zoning: r.zoning || null,
    tax_assessed_value: r.tax_assessed_value ?? null,
    equity_estimate: r.equity_estimate ?? null,
    occupancy_status: r.occupancy_status || 'unknown',
    investor_summary: r.investor_summary || null,
    enriched_at: new Date().toISOString()
  };

  await base44.asServiceRole.entities.Property.update(property.id, enrichmentData);
  return enrichmentData;
}