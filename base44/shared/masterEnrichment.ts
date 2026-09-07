/**
 * Master Enrichment Engine — the most comprehensive property data enrichment system.
 *
 * Sends a single LLM prompt with web search that researches ALL 15 categories of
 * investor-relevant data for a property and returns a structured JSON payload.
 *
 * Categories covered:
 *  1. Structural — foundation, roof, HVAC, permits, code violations, condition
 *  2. Title/Legal — mortgage, liens, foreclosure, probate, tax delinquency, HOA
 *  3. Valuation — AVM, comps, ARV, rehab costs, holding costs, insurance, equity
 *  4. Neighborhood — demographics, walkability, crime, schools, flood, hurricane, sinkhole
 *  5. Market — appreciation, DOM, inventory, migration, job growth, investor activity
 *  6. Distress — foreclosure timeline, vacancy, death records, divorce, bankruptcy
 *  7. Risk — insurance claims, flood cost, wind mitigation, environmental, zoning change
 *  8. AI Analysis — distress prediction, opportunity score, rehab scope, exit strategy, ROI
 *  9. Legal — STR legality, rental restrictions, building code, easements
 * 10. Financial — deal analysis, sensitivity, stress test, financing, tax, cash flow
 * 11. Visual — aerial, street, topography, solar, view, neighborhood visual score
 */

const MASTER_SCHEMA = {
  type: 'object',
  properties: {
    structural: {
      type: 'object',
      properties: {
        foundation_type: { type: 'string' },
        roof_material: { type: 'string' },
        roof_age: { type: 'number' },
        hvac_age: { type: 'number' },
        plumbing_type: { type: 'string' },
        electrical_type: { type: 'string' },
        siding_type: { type: 'string' },
        window_type: { type: 'string' },
        property_condition_score: { type: 'number' },
        energy_rating: { type: 'string' },
        has_solar: { type: 'boolean' },
        has_impact_windows: { type: 'boolean' },
        permits: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, date: { type: 'string' }, contractor: { type: 'string' }, status: { type: 'string' }, value: { type: 'number' } } } },
        code_violations: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, severity: { type: 'string' }, fine_amount: { type: 'number' }, hearing_date: { type: 'string' }, status: { type: 'string' } } } },
        unpermitted_work: { type: 'boolean' },
        environmental_hazards: { type: 'array', items: { type: 'string' } },
      },
    },
    title_legal: {
      type: 'object',
      properties: {
        mortgage_balance: { type: 'number' },
        mortgage_lender: { type: 'string' },
        mortgage_type: { type: 'string' },
        lien_total: { type: 'number' },
        lien_details: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, amount: { type: 'number' }, holder: { type: 'string' } } } },
        foreclosure_status: { type: 'string' },
        foreclosure_timeline: { type: 'object', properties: { nod_date: { type: 'string' }, lis_pendens_date: { type: 'string' }, judgment_date: { type: 'string' }, auction_date: { type: 'string' } } },
        probate_status: { type: 'string' },
        tax_delinquent: { type: 'boolean' },
        tax_delinquent_amount: { type: 'number' },
        tax_sale_date: { type: 'string' },
        hoa_name: { type: 'string' },
        hoa_fee: { type: 'number' },
        hoa_delinquent: { type: 'boolean' },
        hoa_rental_restrictions: { type: 'string' },
        judgments: { type: 'array', items: { type: 'string' } },
        ucc_filings: { type: 'array', items: { type: 'string' } },
      },
    },
    valuation: {
      type: 'object',
      properties: {
        avm_low: { type: 'number' },
        avm_mid: { type: 'number' },
        avm_high: { type: 'number' },
        avm_sources: { type: 'array', items: { type: 'object', properties: { source: { type: 'string' }, value: { type: 'number' } } } },
        comparable_sales: { type: 'array', items: { type: 'object', properties: { address: { type: 'string' }, sale_price: { type: 'number' }, sale_date: { type: 'string' }, sqft: { type: 'number' }, beds: { type: 'number' }, baths: { type: 'number' }, distance_miles: { type: 'number' } } } },
        price_per_sqft_1yr: { type: 'number' },
        price_per_sqft_3yr: { type: 'number' },
        price_per_sqft_5yr: { type: 'number' },
        str_rental_estimate: { type: 'number' },
        str_occupancy_rate: { type: 'number' },
        ltr_rental_estimate: { type: 'number' },
        arv: { type: 'number' },
        rehab_cost_estimate: { type: 'object', properties: { roof: { type: 'number' }, hvac: { type: 'number' }, kitchen: { type: 'number' }, bath: { type: 'number' }, flooring: { type: 'number' }, paint: { type: 'number' }, electrical: { type: 'number' }, plumbing: { type: 'number' }, total: { type: 'number' } } },
        holding_costs: { type: 'object', properties: { monthly_total: { type: 'number' }, taxes: { type: 'number' }, insurance: { type: 'number' }, utilities: { type: 'number' }, hoa: { type: 'number' }, maintenance: { type: 'number' }, loan_interest: { type: 'number' } } },
        insurance_estimate: { type: 'object', properties: { hazard: { type: 'number' }, flood: { type: 'number' }, wind: { type: 'number' }, builders_risk: { type: 'number' } } },
        property_tax_projection: { type: 'number' },
        utility_cost_estimate: { type: 'object', properties: { electric: { type: 'number' }, water: { type: 'number' }, gas: { type: 'number' } } },
        cdd_fees: { type: 'number' },
        equity_calculation: { type: 'object', properties: { market_value: { type: 'number' }, total_liens: { type: 'number' }, equity: { type: 'number' } } },
      },
    },
    neighborhood: {
      type: 'object',
      properties: {
        demographics: { type: 'object', properties: { median_income: { type: 'number' }, median_age: { type: 'number' }, education_level: { type: 'string' }, household_size: { type: 'number' }, owner_occupancy_pct: { type: 'number' }, population_trend: { type: 'string' } } },
        employment_centers: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, distance_miles: { type: 'number' }, employees: { type: 'number' } } } },
        walk_score: { type: 'number' },
        transit_score: { type: 'number' },
        bike_score: { type: 'number' },
        crime_stats: { type: 'object', properties: { level: { type: 'string' }, violent_crime_rate: { type: 'number' }, property_crime_rate: { type: 'number' }, trend: { type: 'string' } } },
        school_details: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string' }, rating: { type: 'number' }, grades: { type: 'string' } } } },
        hospital_access: { type: 'object', properties: { name: { type: 'string' }, distance_miles: { type: 'number' }, trauma_level: { type: 'string' } } },
        amenity_proximity: { type: 'object', properties: { grocery_miles: { type: 'number' }, shopping_miles: { type: 'number' }, restaurants_miles: { type: 'number' }, parks_miles: { type: 'number' }, gym_miles: { type: 'number' } } },
        future_development: { type: 'array', items: { type: 'string' } },
        flood_zone_detail: { type: 'object', properties: { zone: { type: 'string' }, bfe: { type: 'string' }, insurance_rate: { type: 'number' } } },
        hurricane_risk: { type: 'object', properties: { wind_zone: { type: 'string' }, evacuation_zone: { type: 'string' }, storm_surge: { type: 'string' } } },
        sinkhole_risk: { type: 'string' },
        wetlands_designation: { type: 'string' },
      },
    },
    market: {
      type: 'object',
      properties: {
        appreciation_trend: { type: 'object', properties: { yr1: { type: 'number' }, yr3: { type: 'number' }, yr5: { type: 'number' }, yr10: { type: 'number' } } },
        dom_trend: { type: 'object', properties: { current: { type: 'number' }, yr1_avg: { type: 'number' }, trend: { type: 'string' } } },
        inventory_levels: { type: 'object', properties: { active_listings: { type: 'number' }, months_supply: { type: 'number' }, absorption_rate: { type: 'number' } } },
        seasonal_patterns: { type: 'object', properties: { best_month_buy: { type: 'string' }, best_month_sell: { type: 'string' } } },
        migration_patterns: { type: 'object', properties: { net_migration: { type: 'string' }, top_sources: { type: 'array', items: { type: 'string' } } } },
        job_growth: { type: 'object', properties: { rate: { type: 'number' }, trend: { type: 'string' }, major_announcements: { type: 'array', items: { type: 'string' } } } },
        population_growth: { type: 'object', properties: { rate: { type: 'number' }, projection: { type: 'string' } } },
        new_construction: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, units: { type: 'number' }, price_range: { type: 'string' } } } },
        investor_activity: { type: 'object', properties: { pct_investor_purchases: { type: 'number' }, flip_count_90d: { type: 'number' } } },
        rental_market_trends: { type: 'object', properties: { rent_growth: { type: 'number' }, vacancy_rate: { type: 'number' }, supply_pipeline: { type: 'string' } } },
      },
    },
    distress: {
      type: 'object',
      properties: {
        distress_signals: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, severity: { type: 'string' }, date_detected: { type: 'string' }, details: { type: 'string' } } } },
        vacancy_detected: { type: 'boolean' },
        maintenance_neglect_score: { type: 'number' },
        death_record_match: { type: 'boolean' },
        divorce_filing: { type: 'boolean' },
        bankruptcy_filing: { type: 'boolean' },
        life_event_triggers: { type: 'array', items: { type: 'string' } },
        code_violation_escalation: { type: 'object', properties: { violation_age_days: { type: 'number' }, fine_total: { type: 'number' }, next_hearing: { type: 'string' } } },
        hoa_foreclosure: { type: 'boolean' },
        expired_listing: { type: 'boolean' },
        fsbo_detected: { type: 'boolean' },
      },
    },
    risk: {
      type: 'object',
      properties: {
        insurance_claims_history: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, date: { type: 'string' }, amount: { type: 'number' } } } },
        flood_insurance_cost: { type: 'number' },
        wind_mitigation: { type: 'object', properties: { roof_shape: { type: 'string' }, opening_protection: { type: 'string' }, premium_reduction: { type: 'number' } } },
        special_assessment_risk: { type: 'string' },
        zoning_change_risk: { type: 'string' },
        eminent_domain_risk: { type: 'string' },
        environmental_contamination: { type: 'string' },
        insurance_availability: { type: 'string' },
      },
    },
    ai_analysis: {
      type: 'object',
      properties: {
        predictive_distress_score: { type: 'number' },
        investment_opportunity_score: { type: 'number' },
        auto_rehab_scope: { type: 'array', items: { type: 'object', properties: { trade: { type: 'string' }, item: { type: 'string' }, quantity: { type: 'string' }, unit_cost: { type: 'number' }, total: { type: 'number' } } } },
        exit_strategy_recommendation: { type: 'string' },
        risk_adjusted_roi: { type: 'object', properties: { best_case: { type: 'number' }, expected: { type: 'number' }, worst_case: { type: 'number' }, probability_weighted: { type: 'number' } } },
        comparable_rent_analysis: { type: 'object', properties: { avg_rent: { type: 'number' }, adjusted_rent: { type: 'number' }, confidence: { type: 'string' } } },
        gentrification_prediction: { type: 'object', properties: { score: { type: 'number' }, timeframe: { type: 'string' }, indicators: { type: 'array', items: { type: 'string' } } } },
        optimal_offer_price: { type: 'number' },
        natural_language_summary: { type: 'string' },
      },
    },
    legal_compliance: {
      type: 'object',
      properties: {
        str_legality: { type: 'string' },
        rental_restrictions: { type: 'string' },
        building_code_compliance: { type: 'string' },
        easement_encroachment: { type: 'string' },
        zoning_verification: { type: 'string' },
        survey_available: { type: 'boolean' },
      },
    },
    financial_modeling: {
      type: 'object',
      properties: {
        deal_analysis: { type: 'object', properties: { total_cost: { type: 'number' }, projected_profit: { type: 'number' }, roi: { type: 'number' }, cash_on_cash: { type: 'number' }, irr: { type: 'number' }, equity_multiple: { type: 'number' } } },
        sensitivity_analysis: { type: 'object', properties: { arv_minus10: { type: 'number' }, arv_plus10: { type: 'number' }, rehab_plus10: { type: 'number' }, time_plus30: { type: 'number' } } },
        stress_test: { type: 'object', properties: { worst_case_profit: { type: 'number' }, break_even_arv: { type: 'number' }, max_safe_offer: { type: 'number' } } },
        financing_comparison: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, rate: { type: 'number' }, monthly: { type: 'number' }, total_cost: { type: 'number' } } } },
        tax_implications: { type: 'object', properties: { depreciation_benefit: { type: 'number' }, capital_gains: { type: 'number' }, exchange_1031_eligible: { type: 'boolean' } } },
        cash_flow_projection: { type: 'array', items: { type: 'object', properties: { year: { type: 'number' }, rent: { type: 'number' }, expenses: { type: 'number' }, noi: { type: 'number' }, cash_flow: { type: 'number' } } } },
        exit_timing: { type: 'object', properties: { optimal_hold_months: { type: 'number' }, reasoning: { type: 'string' } } },
      },
    },
    visual_spatial: {
      type: 'object',
      properties: {
        aerial_imagery_available: { type: 'boolean' },
        street_imagery_available: { type: 'boolean' },
        lot_boundary_available: { type: 'boolean' },
        topography: { type: 'object', properties: { slope: { type: 'string' }, elevation: { type: 'string' }, drainage: { type: 'string' } } },
        solar_exposure: { type: 'object', properties: { roof_orientation: { type: 'string' }, shading: { type: 'string' }, solar_viability: { type: 'string' } } },
        view_analysis: { type: 'object', properties: { water_view: { type: 'boolean' }, obstruction: { type: 'string' }, premium_pct: { type: 'number' } } },
        neighborhood_visual_score: { type: 'number' },
      },
    },
  },
};

function buildMasterPrompt(p: any) {
  return `You are the most comprehensive real estate investment analysis AI in existence. Research this property using the live web and return a complete JSON analysis covering ALL 15 categories below.

PROPERTY: ${p.address}, ${p.city}, ${p.state} ${p.zip_code}
TYPE: ${p.property_type || 'residential'}, DISTRESS: ${p.distress_type || 'unknown'}
BEDS: ${p.bedrooms ?? 'n/a'}, BATHS: ${p.bathrooms ?? 'n/a'}, SQFT: ${p.square_footage ?? 'n/a'}, YEAR: ${p.year_built ?? 'n/a'}, LOT SQFT: ${p.lot_size ?? 'n/a'}
ESTIMATED VALUE: ${p.estimated_value ?? 'n/a'}, ASKING: ${p.proposed_asking_price ?? 'n/a'}

Research using: county property appraiser, tax collector, clerk of court, code enforcement, Zillow, Redfin, Realtor.com, Rentometer, AirDNA, GreatSchools, CrimeMapping, FEMA flood maps, NOAA, EPA, Census, Google Maps, FL Geological Survey, and any other relevant sources.

Return JSON with these top-level objects:

1. "structural" — foundation_type, roof_material, roof_age, hvac_age, plumbing_type, electrical_type, siding_type, window_type, property_condition_score (1-10), energy_rating, has_solar, has_impact_windows, permits [{type,date,contractor,status,value}], code_violations [{type,severity,fine_amount,hearing_date,status}], unpermitted_work, environmental_hazards [string]

2. "title_legal" — mortgage_balance, mortgage_lender, mortgage_type, lien_total, lien_details [{type,amount,holder}], foreclosure_status (none|pre_foreclosure|lis_pendens|judgment|auction_scheduled|sold|reo), foreclosure_timeline {nod_date,lis_pendens_date,judgment_date,auction_date}, probate_status, tax_delinquent, tax_delinquent_amount, tax_sale_date, hoa_name, hoa_fee, hoa_delinquent, hoa_rental_restrictions, judgments [string], ucc_filings [string]

3. "valuation" — avm_low, avm_mid, avm_high, avm_sources [{source,value}], comparable_sales [{address,sale_price,sale_date,sqft,beds,baths,distance_miles}], price_per_sqft_1yr, price_per_sqft_3yr, price_per_sqft_5yr, str_rental_estimate, str_occupancy_rate, ltr_rental_estimate, arv, rehab_cost_estimate {roof,hvac,kitchen,bath,flooring,paint,electrical,plumbing,total}, holding_costs {monthly_total,taxes,insurance,utilities,hoa,maintenance,loan_interest}, insurance_estimate {hazard,flood,wind,builders_risk}, property_tax_projection, utility_cost_estimate {electric,water,gas}, cdd_fees, equity_calculation {market_value,total_liens,equity}

4. "neighborhood" — demographics {median_income,median_age,education_level,household_size,owner_occupancy_pct,population_trend}, employment_centers [{name,distance_miles,employees}], walk_score, transit_score, bike_score, crime_stats {level,violent_crime_rate,property_crime_rate,trend}, school_details [{name,type,rating,grades}], hospital_access {name,distance_miles,trauma_level}, amenity_proximity {grocery_miles,shopping_miles,restaurants_miles,parks_miles,gym_miles}, future_development [string], flood_zone_detail {zone,bfe,insurance_rate}, hurricane_risk {wind_zone,evacuation_zone,storm_surge}, sinkhole_risk (none|low|moderate|high|severe), wetlands_designation

5. "market" — appreciation_trend {yr1,yr3,yr5,yr10}, dom_trend {current,yr1_avg,trend}, inventory_levels {active_listings,months_supply,absorption_rate}, seasonal_patterns {best_month_buy,best_month_sell}, migration_patterns {net_migration,top_sources}, job_growth {rate,trend,major_announcements}, population_growth {rate,projection}, new_construction [{type,units,price_range}], investor_activity {pct_investor_purchases,flip_count_90d}, rental_market_trends {rent_growth,vacancy_rate,supply_pipeline}

6. "distress" — distress_signals [{type,severity,date_detected,details}], vacancy_detected, maintenance_neglect_score (0-100), death_record_match, divorce_filing, bankruptcy_filing, life_event_triggers [string], code_violation_escalation {violation_age_days,fine_total,next_hearing}, hoa_foreclosure, expired_listing, fsbo_detected

7. "risk" — insurance_claims_history [{type,date,amount}], flood_insurance_cost, wind_mitigation {roof_shape,opening_protection,premium_reduction}, special_assessment_risk, zoning_change_risk, eminent_domain_risk, environmental_contamination, insurance_availability

8. "ai_analysis" — predictive_distress_score (0-100), investment_opportunity_score (0-100), auto_rehab_scope [{trade,item,quantity,unit_cost,total}], exit_strategy_recommendation (flip|brrrr|buy_hold|wholesale), risk_adjusted_roi {best_case,expected,worst_case,probability_weighted}, comparable_rent_analysis {avg_rent,adjusted_rent,confidence}, gentrification_prediction {score,timeframe,indicators}, optimal_offer_price, natural_language_summary (3-4 paragraph investor brief)

9. "legal_compliance" — str_legality (legal|restricted|prohibited|unknown), rental_restrictions, building_code_compliance, easement_encroachment, zoning_verification, survey_available

10. "financial_modeling" — deal_analysis {total_cost,projected_profit,roi,cash_on_cash,irr,equity_multiple}, sensitivity_analysis {arv_minus10,arv_plus10,rehab_plus10,time_plus30}, stress_test {worst_case_profit,break_even_arv,max_safe_offer}, financing_comparison [{type,rate,monthly,total_cost}], tax_implications {depreciation_benefit,capital_gains,exchange_1031_eligible}, cash_flow_projection [{year,rent,expenses,noi,cash_flow}], exit_timing {optimal_hold_months,reasoning}

11. "visual_spatial" — aerial_imagery_available, street_imagery_available, lot_boundary_available, topography {slope,elevation,drainage}, solar_exposure {roof_orientation,shading,solar_viability}, view_analysis {water_view,obstruction,premium_pct}, neighborhood_visual_score (1-10)

For each field, provide the best available data from web research. If specific data is unavailable, provide a conservative estimate based on area data and note the uncertainty. Never fabricate exact addresses or specific comps — use area-level estimates when property-specific data is missing.

The natural_language_summary should cover: investment potential, neighborhood profile, rental income potential, key risks, recommended exit strategy, and optimal offer price with reasoning.`;
}

/**
 * Count populated fields in a nested object — used for completeness scoring.
 */
function countPopulated(obj: any, total: { filled: number; total: number }) {
  if (obj === null || obj === undefined) return;
  if (typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === null || val === undefined || val === '' ) continue;
    if (Array.isArray(val)) {
      total.total++;
      if (val.length > 0) total.filled++;
    } else if (typeof val === 'object') {
      countPopulated(val, total);
    } else {
      total.total++;
      total.filled++;
    }
  }
}

export function calculateCompleteness(data: any): number {
  if (!data || typeof data !== 'object') return 0;
  const total = { filled: 0, total: 0 };
  for (const category of Object.keys(data)) {
    countPopulated(data[category], total);
  }
  if (total.total === 0) return 0;
  return Math.round((total.filled / total.total) * 100);
}

/**
 * Map LLM response to individual Property fields + enrichment_data object.
 */
function safeNum(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? null : n;
}

function mapToPropertyFields(data: any) {
  const s = data.structural || {};
  const t = data.title_legal || {};
  const v = data.valuation || {};
  const n = data.neighborhood || {};
  const d = data.distress || {};
  const r = data.risk || {};
  const a = data.ai_analysis || {};
  const l = data.legal_compliance || {};

  return {
    // Structural
    foundation_type: s.foundation_type || null,
    roof_material: s.roof_material || null,
    roof_age: safeNum(s.roof_age),
    hvac_age: safeNum(s.hvac_age),
    has_solar: s.has_solar ?? false,
    has_impact_windows: s.has_impact_windows ?? false,
    energy_rating: s.energy_rating || null,
    property_condition_score: safeNum(s.property_condition_score),
    permits: s.permits || [],
    code_violations_detail: s.code_violations || [],
    environmental_hazards: s.environmental_hazards || [],

    // Title/Legal
    mortgage_balance: safeNum(t.mortgage_balance),
    mortgage_lender: t.mortgage_lender || null,
    mortgage_type: t.mortgage_type || null,
    tax_delinquent_amount: safeNum(t.tax_delinquent_amount),
    tax_sale_date: t.tax_sale_date || null,
    foreclosure_status: t.foreclosure_status || 'none',
    foreclosure_auction_date: t.foreclosure_timeline?.auction_date || null,
    probate_status: t.probate_status || null,
    hoa_name: t.hoa_name || null,
    hoa_fee: safeNum(t.hoa_fee),

    // Valuation
    arv: safeNum(v.arv),
    str_rental_estimate: safeNum(v.str_rental_estimate),
    str_occupancy_rate: safeNum(v.str_occupancy_rate),
    flood_insurance_cost: safeNum(v.insurance_estimate?.flood) ?? safeNum(r.flood_insurance_cost),
    hazard_insurance_cost: safeNum(v.insurance_estimate?.hazard),
    cdd_fees: safeNum(v.cdd_fees),
    comparable_sales: v.comparable_sales || [],
    equity_estimate: safeNum(v.equity_calculation?.equity) ?? null,
    rental_estimate: safeNum(v.ltr_rental_estimate),

    // Neighborhood
    walk_score: safeNum(n.walk_score),
    transit_score: safeNum(n.transit_score),
    bike_score: safeNum(n.bike_score),
    neighborhood_rating: safeNum(n.demographics?.owner_occupancy_pct) ? Math.round(safeNum(n.demographics.owner_occupancy_pct) / 10) : null,
    school_rating: safeNum(n.school_details?.[0]?.rating),
    crime_level: n.crime_stats?.level || 'unknown',
    flood_zone: n.flood_zone_detail?.zone || null,
    zoning: l.zoning_verification || null,
    sinkhole_risk: n.sinkhole_risk || 'none',
    str_legality: l.str_legality || 'unknown',
    building_code_compliance: l.building_code_compliance || null,

    // Distress
    vacancy_detected: d.vacancy_detected ?? false,
    maintenance_neglect_score: safeNum(d.maintenance_neglect_score),
    distress_signals: d.distress_signals || [],

    // AI Analysis
    predictive_distress_score: safeNum(a.predictive_distress_score),
    investment_opportunity_score: safeNum(a.investment_opportunity_score),
    optimal_offer_price: safeNum(a.optimal_offer_price),
    investor_summary: a.natural_language_summary || null,

    // Visual
    neighborhood_visual_score: safeNum(data.visual_spatial?.neighborhood_visual_score),

    // Master enrichment metadata
    enrichment_data: data,
    master_enriched_at: new Date().toISOString(),
    enriched_at: new Date().toISOString(),
  };
}

/**
 * Run master enrichment on a single property.
 * Sends the comprehensive LLM prompt with web search, maps the response to
 * individual Property fields + enrichment_data, and persists everything.
 */
export async function enrichPropertyMaster(base44: any, property: any) {
  const prompt = buildMasterPrompt(property);

  const raw = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: prompt + '\n\nReturn ONLY a valid JSON object with the 11 top-level keys (structural, title_legal, valuation, neighborhood, market, distress, risk, ai_analysis, legal_compliance, financial_modeling, visual_spatial). No markdown, no code fences, just raw JSON.',
    add_context_from_internet: true,
    model: 'gemini_3_8_flash',
  });

  // Parse the string response as JSON
  let result: any;
  try {
    const cleaned = typeof raw === 'string' ? raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim() : raw;
    result = JSON.parse(cleaned);
  } catch {
    // Try to extract JSON from the response
    const match = typeof raw === 'string' ? raw.match(/\{[\s\S]*\}/) : null;
    if (match) {
      result = JSON.parse(match[0]);
    } else {
      throw new Error('Failed to parse LLM response as JSON');
    }
  }

  const completeness = calculateCompleteness(result);
  const mappedFields = mapToPropertyFields(result);
  mappedFields.enrichment_completeness = completeness;

  await base44.asServiceRole.entities.Property.update(property.id, mappedFields);

  return { property_id: property.id, address: property.address, completeness, data: result };
}