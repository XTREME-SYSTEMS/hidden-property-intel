import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * Enrichment Validation Engine — scans all active properties and calculates
 * per-property and system-wide enrichment completeness across all 15 categories.
 *
 * Returns a detailed report showing which categories are strong vs weak,
 * and which properties need re-enrichment (auto-heal candidates).
 */

const CATEGORY_FIELDS = {
  structural: ['foundation_type', 'roof_material', 'roof_age', 'hvac_age', 'property_condition_score', 'permits', 'code_violations_detail', 'energy_rating', 'has_solar', 'has_impact_windows', 'environmental_hazards'],
  title_legal: ['mortgage_balance', 'mortgage_lender', 'mortgage_type', 'tax_delinquent_amount', 'foreclosure_status', 'probate_status', 'hoa_name', 'hoa_fee'],
  valuation: ['arv', 'str_rental_estimate', 'str_occupancy_rate', 'flood_insurance_cost', 'hazard_insurance_cost', 'cdd_fees', 'comparable_sales', 'equity_estimate', 'rental_estimate'],
  neighborhood: ['walk_score', 'transit_score', 'bike_score', 'neighborhood_rating', 'school_rating', 'crime_level', 'flood_zone', 'zoning', 'sinkhole_risk'],
  market: ['enrichment_data'],
  distress: ['vacancy_detected', 'maintenance_neglect_score', 'distress_signals'],
  risk: ['enrichment_data'],
  ai_analysis: ['predictive_distress_score', 'investment_opportunity_score', 'optimal_offer_price', 'investor_summary'],
  legal_compliance: ['str_legality', 'building_code_compliance'],
  visual_spatial: ['aerial_imagery_url', 'neighborhood_visual_score'],
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const properties = await base44.asServiceRole.entities.Property.filter(
      { status: 'active' },
      '-created_date',
      100
    );

    const categoryScores: Record<string, { filled: number; total: number }> = {};
    for (const cat of Object.keys(CATEGORY_FIELDS)) {
      categoryScores[cat] = { filled: 0, total: 0 };
    }

    const propertyReports = [];
    let systemTotal = 0;
    let systemFilled = 0;

    for (const p of properties) {
      let propFilled = 0;
      let propTotal = 0;
      const propCats: Record<string, number> = {};

      for (const [cat, fields] of Object.entries(CATEGORY_FIELDS)) {
        let catFilled = 0;
        let catTotal = 0;

        for (const field of fields) {
          catTotal++;
          propTotal++;
          const val = p[field];
          if (val !== null && val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0)) {
            catFilled++;
            propFilled++;
          }
        }

        const catPct = catTotal > 0 ? Math.round((catFilled / catTotal) * 100) : 0;
        propCats[cat] = catPct;
        categoryScores[cat].filled += catFilled;
        categoryScores[cat].total += catTotal;
      }

      const propPct = propTotal > 0 ? Math.round((propFilled / propTotal) * 100) : 0;
      systemTotal += propTotal;
      systemFilled += propFilled;

      propertyReports.push({
        id: p.id,
        address: `${p.address}, ${p.city}, ${p.state}`,
        completeness: propPct,
        enrichment_completeness: p.enrichment_completeness ?? 0,
        master_enriched_at: p.master_enriched_at || null,
        categories: propCats,
      });
    }

    const systemPct = systemTotal > 0 ? Math.round((systemFilled / systemTotal) * 100) : 0;

    const categoryReport: Record<string, number> = {};
    for (const [cat, scores] of Object.entries(categoryScores)) {
      categoryReport[cat] = scores.total > 0 ? Math.round((scores.filled / scores.total) * 100) : 0;
    }

    // Identify auto-heal candidates (below 80%)
    const healCandidates = propertyReports
      .filter(p => p.completeness < 80)
      .sort((a, b) => a.completeness - b.completeness);

    return Response.json({
      total_properties: properties.length,
      system_completeness: systemPct,
      category_scores: categoryReport,
      auto_heal_candidates: healCandidates.length,
      weakest_categories: Object.entries(categoryReport)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 5)
        .map(([cat, pct]) => ({ category: cat, completeness: pct })),
      properties: propertyReports.sort((a, b) => a.completeness - b.completeness),
    });
  } catch (error) {
    console.error('validateEnrichment error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}