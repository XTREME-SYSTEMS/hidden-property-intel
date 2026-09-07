/**
 * Comprehensive Florida Source Directory
 * Every category of source for finding distressed properties, land, investors,
 * heirs, images, agents, adjacent businesses, associations, Facebook groups,
 * people who know about distress, data tools, and scraping infrastructure.
 *
 * Organized by category → subcategory → source.
 * Each source: { name, url, description, tags? }
 */

export const FLORIDA_SOURCE_CATEGORIES = [
  // ═══════════════════════════════════════════════════════════
  // 1. GOVERNMENT & PUBLIC RECORDS
  // ═══════════════════════════════════════════════════════════
  {
    id: 'government',
    name: 'Government & Public Records',
    icon: 'Landmark',
    description: 'Official county, state, and federal sources for property records, tax data, foreclosure filings, code violations, and public notices. These are the primary data feeds for the scraping pipeline.',
    subcategories: [
      {
        name: 'County Property Appraisers (All 67 FL Counties)',
        description: 'Every Florida county maintains a property appraiser site with owner names, assessed values, parcel maps, legal descriptions, sales history, and exemption data. These are the backbone of owner identification.',
        sources: [
          { name: 'Lee County Property Appraiser', url: 'https://www.leepa.org', description: 'Owner records, parcel maps, sales history, Tangible Personal Property', tags: ['owner-data', 'parcel-maps', 'sales-history'] },
          { name: 'Miami-Dade Property Appraiser', url: 'https://www.miamidade.gov/propertysearch', description: 'Largest FL county — owner data, folio maps, sales, exemptions', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Broward County Property Appraiser', url: 'https://www.bcpa.net', description: 'Owner records, sales, parcel maps, TRIM notices', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Palm Beach County Property Appraiser', url: 'https://www.pbcgov.org/papa', description: 'Owner data, parcel maps, sales history, exemptions', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Hillsborough County Property Appraiser', url: 'https://www.hcpafl.org', description: 'Owner records, sales, parcel maps, GIS', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Orange County Property Appraiser', url: 'https://www.ocpafl.org', description: 'Owner data, parcel maps, sales, GIS maps', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Pinellas County Property Appraiser', url: 'https://www.pcpao.org', description: 'Owner records, sales, parcel maps, GIS', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Duval County Property Appraiser', url: 'https://www.coj.net/property-appraiser', description: 'Jacksonville area — owner data, parcel maps, sales', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Polk County Property Appraiser', url: 'https://www.polkpa.org', description: 'Owner records, sales, parcel maps', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Brevard County Property Appraiser', url: 'https://www.bcpao.us', description: 'Owner data, parcel maps, sales history', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Volusia County Property Appraiser', url: 'https://www.vcpafl.gov', description: 'Owner records, sales, parcel maps', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Pasco County Property Appraiser', url: 'https://www.pascopa.com', description: 'Owner data, parcel maps, sales', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Seminole County Property Appraiser', url: 'https://www.scpafl.gov', description: 'Owner records, sales, parcel maps', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Sarasota County Property Appraiser', url: 'https://www.sc-pa.com', description: 'Owner data, parcel maps, sales history', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Marion County Property Appraiser', url: 'https://www.pa.marion.fl.us', description: 'Owner records, sales, parcel maps', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Manatee County Property Appraiser', url: 'https://www.manateepa.gov', description: 'Owner data, parcel maps, sales', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Collier County Property Appraiser', url: 'https://www.collierappraiser.com', description: 'Naples area — owner records, sales, parcel maps', tags: ['owner-data', 'parcel-maps'] },
          { name: 'St. Lucie County Property Appraiser', url: 'https://www.paslc.org', description: 'Owner data, parcel maps, sales history', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Leon County Property Appraiser', url: 'https://www.leonpa.gov', description: 'Tallahassee area — owner records, sales, parcel maps', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Alachua County Property Appraiser', url: 'https://www.acpafl.org', description: 'Gainesville area — owner data, parcel maps, sales', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Escambia County Property Appraiser', url: 'https://ecpafl.org', description: 'Pensacola area — owner records, sales, parcel maps', tags: ['owner-data', 'parcel-maps'] },
          { name: 'St. Johns County Property Appraiser', url: 'https://www.sjcpa.us', description: 'St. Augustine area — owner data, parcel maps, sales', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Osceola County Property Appraiser', url: 'https://www.osceolafl.org/property-appraiser', description: 'Owner records, sales, parcel maps', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Lake County Property Appraiser', url: 'https://www.lakecopropappr.com', description: 'Owner data, parcel maps, sales history', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Charlotte County Property Appraiser', url: 'https://www.ccappraiser.com', description: 'Owner records, sales, parcel maps', tags: ['owner-data', 'parcel-maps'] },
          { name: 'Full 67-County Directory', url: 'https://floridarevenue.com/property/Pages/PropertyAppraisers.aspx', description: 'Florida Dept of Revenue directory of ALL 67 county property appraisers with links', tags: ['directory', 'all-counties'] },
        ]
      },
      {
        name: 'County Tax Collectors & Tax Deed Sales',
        description: 'Tax collectors handle delinquent property tax data and tax deed/lien certificate sales. Properties with unpaid taxes are prime distress targets.',
        sources: [
          { name: 'Lee County Tax Collector', url: 'https://www.leetc.com', description: 'Delinquent tax data, tax deed sales, tax lien certificates', tags: ['tax-delinquent', 'tax-deed-sales'] },
          { name: 'Miami-Dade Tax Collector', url: 'https://www.miamidade.gov/taxcollector', description: 'Tax deed sales, delinquent taxes, certificate sales', tags: ['tax-delinquent', 'tax-deed-sales'] },
          { name: 'Broward County Tax Collector', url: 'https://www.broward.org/treasury', description: 'Delinquent taxes, tax deed auctions', tags: ['tax-delinquent', 'tax-deed-sales'] },
          { name: 'Florida Tax Deed Sales Portal', url: 'https://www.floridataxdeeds.com', description: 'Aggregated tax deed sale info across FL counties', tags: ['tax-deed-sales', 'aggregator'] },
          { name: 'RealAuction (FL Tax Deeds)', url: 'https://www.realforeclose.com', description: 'Online tax deed & foreclosure auction platform used by most FL counties', tags: ['tax-deed-sales', 'auctions', 'foreclosures'] },
          { name: 'FL Dept of Revenue — Tax Sale Info', url: 'https://floridarevenue.com/taxes/Pages/tax_deed.aspx', description: 'Statewide tax deed sale process and county links', tags: ['tax-deed-sales', 'directory'] },
        ]
      },
      {
        name: 'County Clerks of Court (Official Records, Lis Pendens, Foreclosures)',
        description: 'Clerks of court record lis pendens (pre-foreclosure notices), foreclosure filings, deeds, mortgages, liens, and probate filings. These are the earliest indicators of distress.',
        sources: [
          { name: 'Lee County Clerk of Court', url: 'https://www.leeclerk.org', description: 'Official records search, lis pendens, foreclosure filings, probate', tags: ['lis-pendens', 'foreclosures', 'probate', 'official-records'] },
          { name: 'Miami-Dade Clerk of Courts', url: 'https://www2.miamidade.gov/global/government/clerk/home.page', description: 'Official records, lis pendens, foreclosures, probate records', tags: ['lis-pendens', 'foreclosures', 'probate'] },
          { name: 'Broward County Clerk of Court', url: 'https://www.browardclerk.org', description: 'Official records, foreclosure auctions, lis pendens', tags: ['lis-pendens', 'foreclosures', 'auctions'] },
          { name: 'Palm Beach County Clerk', url: 'https://www.mypalmbeachclerk.com', description: 'Official records, foreclosures, lis pendens, probate', tags: ['lis-pendens', 'foreclosures', 'probate'] },
          { name: 'Hillsborough County Clerk', url: 'https://www.hillsclerk.com', description: 'Official records, foreclosure sales, lis pendens', tags: ['lis-pendens', 'foreclosures'] },
          { name: 'Orange County Clerk of Courts', url: 'https://www.myorangeclerk.com', description: 'Official records, foreclosures, probate filings', tags: ['lis-pendens', 'foreclosures', 'probate'] },
          { name: 'Pinellas County Clerk', url: 'https://www.pinellasclerk.org', description: 'Official records, foreclosure sales, lis pendens', tags: ['lis-pendens', 'foreclosures'] },
          { name: 'Duval County Clerk of Court', url: 'https://www.duvalclerk.com', description: 'Official records, foreclosures, probate', tags: ['lis-pendens', 'foreclosures', 'probate'] },
          { name: 'FL Clerks Official Records Search', url: 'https://officialrecords.flclerks.com', description: 'Statewide portal for official records across participating counties', tags: ['official-records', 'statewide'] },
        ]
      },
      {
        name: 'County Code Enforcement',
        description: 'Code enforcement divisions track properties with violations (overgrown lawns, structural damage, unsafe conditions) — strong indicators of distress and vacancy.',
        sources: [
          { name: 'Lee County Code Enforcement', url: 'https://www.leegov.com/dcd/codeenforcement', description: 'Open code violations, condemned properties, liens', tags: ['code-violations', 'condemned'] },
          { name: 'Miami-Dade Code Enforcement', url: 'https://www.miamidade.gov/code-enforcement', description: 'Violation cases, unsafe structures, liens', tags: ['code-violations', 'condemned'] },
          { name: 'Broward County Code Enforcement', url: 'https://www.broward.org/codeenforcement', description: 'Code violations, property maintenance cases', tags: ['code-violations'] },
          { name: 'Orlando Code Enforcement', url: 'https://www.orlando.gov/city-planning/code-enforcement', description: 'City of Orlando code violations, liens', tags: ['code-violations'] },
          { name: 'Jacksonville Code Enforcement', url: 'https://www.coj.net/neighborhoods/code-enforcement', description: 'Duval County code violations, unsafe structures', tags: ['code-violations'] },
          { name: 'FL Municode (Local Codes)', url: 'https://www.municode.com/library/fl', description: 'All FL municipal code ordinances — useful for identifying violation types', tags: ['code-reference'] },
        ]
      },
      {
        name: 'Circuit Court Foreclosure Auctions',
        description: 'Each FL judicial circuit holds daily/weekly foreclosure auctions. These are final-stage distressed properties going to the highest bidder.',
        sources: [
          { name: 'RealForeclose (Statewide)', url: 'https://www.realforeclose.com', description: 'Primary online foreclosure auction platform for most FL counties', tags: ['foreclosure-auctions', 'daily'] },
          { name: 'Auction.com FL Foreclosures', url: 'https://www.auction.com/residential/FL', description: 'Bank-owned and foreclosure auction listings', tags: ['foreclosure-auctions', 'reo'] },
          { name: '20th Judicial Circuit (Lee/Collier/Charlotte)', url: 'https://www.leeclerk.org/foreclosures', description: 'SW Florida foreclosure auction schedule', tags: ['foreclosure-auctions'] },
          { name: '11th Judicial Circuit (Miami-Dade)', url: 'https://www.jud11.flcourts.org', description: 'Miami-Dade foreclosure auctions', tags: ['foreclosure-auctions'] },
          { name: '17th Judicial Circuit (Broward)', url: 'https://www.17th.flcourts.org', description: 'Broward foreclosure auctions', tags: ['foreclosure-auctions'] },
          { name: '9th Judicial Circuit (Orange/Osceola)', url: 'https://www.ninthcircuit.org', description: 'Orlando area foreclosure auctions', tags: ['foreclosure-auctions'] },
        ]
      },
      {
        name: 'Federal & State Agency REO',
        description: 'Government agencies sell their foreclosed/real-estate-owned properties directly to the public, often at significant discounts.',
        sources: [
          { name: 'HUD HomeStore (FHA)', url: 'https://www.hudhomestore.com', description: 'FHA-foreclosed homes for sale by HUD', tags: ['reo', 'federal', 'discounted'] },
          { name: 'Fannie Mae HomePath', url: 'https://www.homepath.com', description: 'Fannie Mae REO properties', tags: ['reo', 'federal'] },
          { name: 'Freddie Mac HomeSteps', url: 'https://www.homesteps.com', description: 'Freddie Mac REO properties', tags: ['reo', 'federal'] },
          { name: 'VA REO Properties', url: 'https://www.benefits.va.gov/homeloans/propertylist.asp', description: 'Veterans Affairs foreclosed homes', tags: ['reo', 'federal'] },
          { name: 'USDA Rural Development REO', url: 'https://www.rd.usda.gov/programs-services/single-family-housing-programs', description: 'USDA foreclosed rural properties', tags: ['reo', 'federal', 'rural'] },
          { name: 'IRS Seized Property', url: 'https://www.treasury.gov/auctions/irs', description: 'IRS-seized real property auctions', tags: ['auctions', 'federal'] },
          { name: 'US Marshals Seized Property', url: 'https://www.usmarshals.gov/assets', description: 'Forfeited/seized real estate auctions', tags: ['auctions', 'federal'] },
          { name: 'SBA Seized Property', url: 'https://eweb1.sba.gov/aes/Listing/Listing.aspx', description: 'SBA loan collateral foreclosures', tags: ['auctions', 'federal'] },
          { name: 'FL Dept of Revenue', url: 'https://floridarevenue.com', description: 'Statewide property tax info, tax deed process', tags: ['state', 'tax'] },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 2. DISTRESSED PROPERTY SOURCES
  // ═══════════════════════════════════════════════════════════
  {
    id: 'distress',
    name: 'Distressed Property Sources',
    icon: 'AlertTriangle',
    description: 'Platforms and databases that aggregate pre-foreclosures, tax delinquencies, code violations, probate, divorce, bankruptcy, HOA foreclosures, and auction properties — the core feed for the deal pipeline.',
    subcategories: [
      {
        name: 'Pre-Foreclosure & Lis Pendens Aggregators',
        description: 'Services that scrape county records and provide pre-foreclosure data (NODs, lis pendens, default notices) before properties hit the auction block.',
        sources: [
          { name: 'PropertyRadar', url: 'https://www.propertyradar.com', description: 'Pre-foreclosure, NOD, lis pendens data with owner info', tags: ['pre-foreclosure', 'lis-pendens', 'paid'] },
          { name: 'PropStream', url: 'https://www.propstream.com', description: 'Pre-foreclosure, distressed, skip-tracing, comps', tags: ['pre-foreclosure', 'skip-trace', 'paid'] },
          { name: 'RealtyTrac', url: 'https://www.realtytrac.com', description: 'Foreclosure data, pre-foreclosures, auctions, REO', tags: ['foreclosures', 'pre-foreclosure'] },
          { name: 'Foreclosure.com', url: 'https://www.foreclosure.com', description: 'Foreclosure listings, pre-foreclosures, auctions', tags: ['foreclosures'] },
          { name: 'ForeclosureDaily', url: 'https://www.foreclosuredaily.com', description: 'Daily foreclosure and pre-foreclosure data', tags: ['foreclosures', 'daily'] },
          { name: 'Default Research', url: 'https://www.defaultresearch.com', description: 'NOD and pre-foreclosure data feeds', tags: ['pre-foreclosure', 'nod'] },
        ]
      },
      {
        name: 'Tax Delinquent Properties',
        description: 'Properties with unpaid property taxes — these go to tax lien certificate sales and eventually tax deed auctions. High distress, motivated sellers.',
        sources: [
          { name: 'County Tax Collector Sites', url: 'https://floridarevenue.com/property/Pages/TaxCollectors.aspx', description: 'All 67 FL county tax collectors — delinquent tax lists', tags: ['tax-delinquent', 'all-counties'] },
          { name: 'RealForeclose Tax Deeds', url: 'https://www.realforeclose.com', description: 'Online tax deed auction platform (most FL counties)', tags: ['tax-deed-sales', 'auctions'] },
          { name: 'TaxSaleLists', url: 'https://www.taxsalelists.com', description: 'Aggregated tax sale data across states', tags: ['tax-deed-sales', 'aggregator'] },
          { name: 'Lienserv (Tax Lien Data)', url: 'https://www.lienserv.com', description: 'Tax lien and tax deed data for FL', tags: ['tax-liens', 'tax-deeds'] },
        ]
      },
      {
        name: 'Code Violation & Condemned Properties',
        description: 'Properties cited for code violations (overgrowth, structural damage, unsafe conditions) are often vacant, abandoned, and owned by motivated sellers.',
        sources: [
          { name: 'County Code Enforcement (Direct)', url: 'https://floridacities.com/code-enforcement', description: 'Direct county code enforcement case databases', tags: ['code-violations'] },
          { name: 'PropStream Code Violations', url: 'https://www.propstream.com', description: 'Aggregated code violation data with property details', tags: ['code-violations', 'paid'] },
          { name: 'PropertyRadar Code Violations', url: 'https://www.propertyradar.com', description: 'Code violation and distressed property alerts', tags: ['code-violations', 'paid'] },
          { name: 'CityData Forum (FL)', url: 'https://www.city-data.com/forum/florida', description: 'Community discussions about distressed neighborhoods', tags: ['community-intel'] },
        ]
      },
      {
        name: 'Probate & Inherited Properties',
        description: 'When a property owner dies, the property goes through probate. Heirs are often motivated to sell quickly. These are the highest-value off-market deals.',
        sources: [
          { name: 'County Probate Courts', url: 'https://www.flcourts.org', description: 'FL circuit court probate divisions — case filings', tags: ['probate', 'heirs'] },
          { name: 'Public Notice Newspapers', url: 'https://www.publicnoticeads.com', description: 'Legal notices including probate filings, estate sales', tags: ['probate', 'public-notices'] },
          { name: 'Legacy.com Obituaries', url: 'https://www.legacy.com/us/obituaries/fl', description: 'FL obituaries — cross-reference with property records for heirs', tags: ['obituaries', 'heirs'] },
          { name: 'Newspapers.com Obituaries', url: 'https://www.newspapers.com', description: 'Historical newspaper obituary archive', tags: ['obituaries', 'historical'] },
          { name: 'Florida Probate Records (FamilySearch)', url: 'https://www.familysearch.org/search/collection/2027903', description: 'Historical FL probate records for heir research', tags: ['probate', 'historical', 'heirs'] },
          { name: 'FL Bar Probate Section', url: 'https://www.floridabar.org/public/consumer-information/consumer-pamphlets/probate-in-florida', description: 'Probate process info + attorney directory', tags: ['probate', 'attorneys'] },
        ]
      },
      {
        name: 'Divorce, Bankruptcy & HOA Foreclosures',
        description: 'Life-event distress signals — divorce filings, bankruptcy proceedings, and HOA foreclosures all create motivated seller situations.',
        sources: [
          { name: 'PACER (Bankruptcy Court)', url: 'https://pacer.uscourts.gov', description: 'Federal bankruptcy court records — FL Middle, Southern, Northern districts', tags: ['bankruptcy', 'federal'] },
          { name: 'FL Middle District Bankruptcy', url: 'https://www.flmb.uscourts.gov', description: 'Tampa/Orlando area bankruptcy filings', tags: ['bankruptcy'] },
          { name: 'FL Southern District Bankruptcy', url: 'https://www.flsb.uscourts.gov', description: 'Miami/Fort Lauderdale area bankruptcy filings', tags: ['bankruptcy'] },
          { name: 'County Clerk Divorce Records', url: 'https://officialrecords.flclerks.com', description: 'Divorce filings via clerk of court official records', tags: ['divorce', 'official-records'] },
          { name: 'HOA Lien Foreclosures (Clerk)', url: 'https://www.leeclerk.org', description: 'HOA foreclosure filings recorded in official records', tags: ['hoa-foreclosures'] },
          { name: 'CAI (HOA Association Directory)', url: 'https://www.caionline.org', description: 'Community Associations Institute — HOA management contacts', tags: ['hoa', 'associations'] },
        ]
      },
      {
        name: 'Auction Platforms',
        description: 'Online and live auction platforms for foreclosure, tax deed, bank-owned, and estate sale properties.',
        sources: [
          { name: 'Auction.com', url: 'https://www.auction.com', description: 'Largest real estate auction platform — foreclosures, REO, note sales', tags: ['auctions', 'foreclosures', 'reo'] },
          { name: 'Hubzu', url: 'https://www.hubzu.com', description: 'Online real estate auctions — bank-owned and resale', tags: ['auctions', 'reo'] },
          { name: 'Xome', url: 'https://www.xome.com', description: 'Online auction and traditional real estate listings', tags: ['auctions'] },
          { name: 'Williams & Williams', url: 'https://www.williamsauction.com', description: 'Live and online real estate auctions', tags: ['auctions'] },
          { name: 'Hudson & Marshall', url: 'https://www.hudsonandmarshall.com', description: 'Foreclosure and REO auction services', tags: ['auctions', 'foreclosures'] },
          { name: 'RealEstateAuctions.com', url: 'https://www.realestateauctions.com', description: 'General real estate auction listings', tags: ['auctions'] },
          { name: 'Bid4Assets', url: 'https://www.bid4assets.com', description: 'Government and private real estate auctions', tags: ['auctions', 'government'] },
        ]
      },
      {
        name: 'Bank-Owned (REO) Departments',
        description: 'Banks sell their foreclosed properties through REO departments and asset managers. Direct relationships yield off-market deals.',
        sources: [
          { name: 'Bank of America REO', url: 'https://www.bankofamerica.com/reo', description: 'BofA foreclosed property listings', tags: ['reo', 'bank'] },
          { name: 'Wells Fargo REO', url: 'https://www.wellsfargo.com/reo', description: 'Wells Fargo REO properties', tags: ['reo', 'bank'] },
          { name: 'JPMorgan Chase REO', url: 'https://www.chase.com/reo', description: 'Chase bank foreclosed properties', tags: ['reo', 'bank'] },
          { name: 'Citibank REO', url: 'https://www.citibank.com/reo', description: 'Citi foreclosed property listings', tags: ['reo', 'bank'] },
          { name: 'US Bank REO', url: 'https://www.usbank.com/reo', description: 'US Bank REO properties', tags: ['reo', 'bank'] },
          { name: 'Fannie Mae HomePath', url: 'https://www.homepath.com', description: 'Fannie Mae REO (also in government section)', tags: ['reo', 'federal'] },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 3. PROPERTY & LAND MARKETPLACES
  // ═══════════════════════════════════════════════════════════
  {
    id: 'marketplaces',
    name: 'Property & Land Marketplaces',
    icon: 'Building2',
    description: 'MLS systems, national listing portals, FSBO sites, wholesale platforms, land-specific marketplaces, and commercial listing sites for finding active and off-market properties.',
    subcategories: [
      {
        name: 'MLS Systems (Florida)',
        description: 'Multiple Listing Services are the primary source for active, pending, and sold listings. Direct MLS access requires a real estate license; data feeds are available via partnerships.',
        sources: [
          { name: 'Stellar MLS (Miami/South FL)', url: 'https://www.stellarmls.com', description: 'Largest FL MLS — Miami-Dade, Broward, Palm Beach', tags: ['mls', 'south-fl'] },
          { name: 'MFRMLS (Orlando/Central FL)', url: 'https://www.mfrmls.com', description: 'My Florida Regional MLS — central FL counties', tags: ['mls', 'central-fl'] },
          { name: 'NEFAR MLS (Jacksonville)', url: 'https://www.nefar.com', description: 'Northeast Florida Association of Realtors MLS', tags: ['mls', 'north-fl'] },
          { name: 'Pinellas Suncoast MLS', url: 'https://www.pmar.com', description: 'Pinellas/Tampa Bay area MLS', tags: ['mls', 'tampa'] },
          { name: 'Lakeland MLS', url: 'https://www.larmls.com', description: 'Lakeland Association of Realtors MLS', tags: ['mls', 'polk'] },
          { name: 'Sarasota MLS', url: 'https://www.sabor.com', description: 'Sarasota Association of Realtors MLS', tags: ['mls', 'sarasota'] },
        ]
      },
      {
        name: 'National Listing Portals',
        description: 'Consumer-facing portals that aggregate MLS and FSBO listings. Useful for comps, market trends, and identifying expired/withdrawn listings.',
        sources: [
          { name: 'Zillow', url: 'https://www.zillow.com/fl', description: 'Listings, Zestimates, sales history, FSBO, pre-foreclosures', tags: ['listings', 'comps', 'fsbo'] },
          { name: 'Redfin', url: 'https://www.redfin.com/state/FL', description: 'Listings, sales history, market trends, agent data', tags: ['listings', 'comps'] },
          { name: 'Realtor.com', url: 'https://www.realtor.com/fl', description: 'NAR-affiliated listings, most accurate MLS data', tags: ['listings', 'comps'] },
          { name: 'Trulia', url: 'https://www.trulia.com/FL', description: 'Listings, neighborhood info, crime maps', tags: ['listings', 'neighborhood'] },
          { name: 'Homes.com', url: 'https://www.homes.com/fl', description: 'Listings, property records, agent directory', tags: ['listings', 'comps'] },
          { name: 'RealtyHop', url: 'https://www.realtyhop.com/fl', description: 'Listings, FSBO, foreclosure data', tags: ['listings', 'fsbo'] },
        ]
      },
      {
        name: 'FSBO (For Sale By Owner)',
        description: 'Properties sold directly by owners without agent representation. These are prime off-market opportunities with no commission.',
        sources: [
          { name: 'FSBO.com', url: 'https://www.fsbo.com/fl', description: 'Florida for-sale-by-owner listings', tags: ['fsbo'] },
          { name: 'ForSaleByOwner.com', url: 'https://www.forsalebyowner.com/fl', description: 'FSBO listings with owner contact info', tags: ['fsbo'] },
          { name: 'Zillow FSBO', url: 'https://www.zillow.com/fl/fsbo', description: 'Zillow FSBO filter — direct owner listings', tags: ['fsbo'] },
          { name: 'Craigslist FL Real Estate', url: 'https://geo.craigslist.org/iso/us/fl', description: 'Craigslist real estate by owner — raw FSBO listings', tags: ['fsbo', 'raw'] },
          { name: 'Facebook Marketplace FL', url: 'https://www.facebook.com/marketplace/fl', description: 'Facebook Marketplace property listings', tags: ['fsbo', 'social'] },
        ]
      },
      {
        name: 'Wholesale & Investor Platforms',
        description: 'Platforms built for real estate investors — distressed listings, wholesale deals, assignment contracts, and off-market opportunities.',
        sources: [
          { name: 'Connected Investors', url: 'https://connectedinvestors.com', description: 'Investor network, off-market deals, funding', tags: ['wholesale', 'investor'] },
          { name: 'BiggerPockets Marketplace', url: 'https://www.biggerpockets.com/marketplace', description: 'Investor deals, partnerships, education', tags: ['wholesale', 'investor'] },
          { name: 'Realeflow', url: 'https://www.realeflow.com', description: 'Investor CRM, deal analysis, lead generation', tags: ['wholesale', 'crm'] },
          { name: 'REIPro', url: 'https://www.reipro.com', description: 'Investor lead generation and deal management', tags: ['wholesale', 'leads'] },
          { name: 'FreedomSoft', url: 'https://www.freedomsoft.com', description: 'Investor CRM with built-in lead generation', tags: ['wholesale', 'crm'] },
          { name: 'Pebble CRM', url: 'https://www.pebble.io', description: 'Real estate investor CRM and lead tracking', tags: ['wholesale', 'crm'] },
        ]
      },
      {
        name: 'Land-Specific Marketplaces',
        description: 'Platforms dedicated to raw land, vacant lots, agricultural land, and development parcels — critical for land investors and developers.',
        sources: [
          { name: 'LandWatch', url: 'https://www.landwatch.com/florida-land-for-sale', description: 'Largest land marketplace — FL land for sale', tags: ['land', 'vacant-lots'] },
          { name: 'Land.com', url: 'https://www.land.com/florida', description: 'Lands of America + LandWatch + Land and Farm combined', tags: ['land'] },
          { name: 'Lands of America', url: 'https://www.landsofamerica.com/florida', description: 'Rural land, farms, ranches for sale', tags: ['land', 'agricultural'] },
          { name: 'Land and Farm', url: 'https://www.landandfarm.com/florida', description: 'Land, farms, ranches, recreational property', tags: ['land', 'farms'] },
          { name: 'LotNetwork', url: 'https://www.lotnetwork.com/fl', description: 'Residential lots and home sites', tags: ['land', 'lots'] },
          { name: 'LandCentury', url: 'https://www.landcentury.com/fl', description: 'Discounted land, owner-financed lots', tags: ['land', 'discounted'] },
          { name: 'LandFlip', url: 'https://www.landflip.com/fl', description: 'Land listings with owner financing options', tags: ['land', 'owner-financed'] },
        ]
      },
      {
        name: 'Commercial & Multi-Family',
        description: 'Commercial and multi-family property marketplaces for larger investment opportunities.',
        sources: [
          { name: 'LoopNet', url: 'https://www.loopnet.com/fl', description: 'Largest commercial real estate marketplace', tags: ['commercial', 'multi-family'] },
          { name: 'Crexi', url: 'https://www.crexi.com/fl', description: 'Commercial real estate auctions and listings', tags: ['commercial', 'auctions'] },
          { name: 'CoStar', url: 'https://www.costar.com', description: 'Commercial property data and analytics', tags: ['commercial', 'data', 'paid'] },
          { name: 'CommercialCafe', url: 'https://www.commercialcafe.com/fl', description: 'Commercial listings and market data', tags: ['commercial'] },
          { name: 'CityFeet', url: 'https://www.cityfeet.com/fl', description: 'Commercial property for sale and lease', tags: ['commercial'] },
        ]
      },
      {
        name: 'Mobile & Manufactured Homes',
        description: 'Mobile and manufactured homes are a significant distressed property segment in Florida, especially in mobile home parks.',
        sources: [
          { name: 'MHVillage', url: 'https://www.mhvillage.com/fl', description: 'Largest manufactured home marketplace', tags: ['mobile-homes'] },
          { name: 'MobileHome.net', url: 'https://www.mobilehome.net/fl', description: 'Mobile homes for sale and rent', tags: ['mobile-homes'] },
          { name: 'Mobile Homes by Owner', url: 'https://www.mobilehomesbyowner.com/fl', description: 'FSBO mobile home listings', tags: ['mobile-homes', 'fsbo'] },
          { name: 'Florida Mobile Home Parks', url: 'https://www.mhvillage.com/parks/fl', description: 'Mobile home park directory and listings', tags: ['mobile-homes', 'parks'] },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 4. PROPERTY IMAGE SOURCES
  // ═══════════════════════════════════════════════════════════
  {
    id: 'images',
    name: 'Property Image Sources',
    icon: 'Camera',
    description: 'Sources for property photos, street-level imagery, aerial/satellite views, and parcel images — essential for property evaluation and listing display.',
    subcategories: [
      {
        name: 'Street-Level Imagery',
        description: 'Street-level photos let you assess property condition, neighborhood, and curb appeal without visiting in person.',
        sources: [
          { name: 'Google Street View API', url: 'https://developers.google.com/maps/documentation/streetview', description: 'Programmatic street-level photos by address/coordinates', tags: ['api', 'street-level', 'paid'] },
          { name: 'Google Street View (Web)', url: 'https://www.google.com/streetview', description: 'Manual street-level imagery lookup', tags: ['street-level'] },
          { name: 'Bing Streetside', url: 'https://www.bing.com/maps', description: 'Microsoft street-level imagery (sometimes covers areas Google misses)', tags: ['street-level'] },
          { name: 'Mapillary', url: 'https://www.mapillary.com', description: 'Crowd-sourced street-level imagery — open API', tags: ['street-level', 'open-source'] },
        ]
      },
      {
        name: 'Aerial & Satellite',
        description: 'Aerial and satellite imagery for lot size, land use, roof condition, and neighborhood context.',
        sources: [
          { name: 'Google Maps Satellite', url: 'https://www.google.com/maps', description: 'Free satellite imagery via Google Maps', tags: ['satellite', 'free'] },
          { name: 'Google Earth', url: 'https://www.google.com/earth', description: 'High-res satellite with historical imagery', tags: ['satellite', 'historical'] },
          { name: 'Nearmap', url: 'https://www.nearmap.com', description: 'High-resolution, frequently-updated aerial imagery (paid)', tags: ['aerial', 'paid', 'high-res'] },
          { name: 'NOAA Imagery', url: 'https://coast.noaa.gov/imagery', description: 'Free coastal aerial imagery (post-storm especially useful in FL)', tags: ['aerial', 'free', 'coastal'] },
          { name: 'USGS Earth Explorer', url: 'https://earthexplorer.usgs.gov', description: 'Free satellite and aerial imagery archive', tags: ['satellite', 'free'] },
        ]
      },
      {
        name: 'County Parcel Photos',
        description: 'Many Florida county property appraisers include actual photos of the property in their parcel records — free and accurate.',
        sources: [
          { name: 'Lee County Parcel Photos', url: 'https://www.leepa.org', description: 'Parcel photos included in property records', tags: ['parcel-photos', 'free'] },
          { name: 'Miami-Dade Parcel Images', url: 'https://www.miamidade.gov/propertysearch', description: 'Property photos in parcel data', tags: ['parcel-photos', 'free'] },
          { name: 'Broward Parcel Photos', url: 'https://www.bcpa.net', description: 'Parcel photos in property records', tags: ['parcel-photos', 'free'] },
          { name: 'County GIS Maps', url: 'https://www.fgdl.org', description: 'Florida Geographic Data Library — county GIS layers', tags: ['gis', 'maps'] },
        ]
      },
      {
        name: 'Listing Photo Sources',
        description: 'Real estate listing sites that include property photos — useful when a property was recently on the market.',
        sources: [
          { name: 'Redfin Photos', url: 'https://www.redfin.com/state/FL', description: 'High-quality listing photos with address search', tags: ['listing-photos'] },
          { name: 'Homes.com Photos', url: 'https://www.homes.com/fl', description: 'Listing photos with historical data', tags: ['listing-photos'] },
          { name: 'Zillow Photos', url: 'https://www.zillow.com/fl', description: 'Current and past listing photos', tags: ['listing-photos', 'historical'] },
          { name: 'Trulia Photos', url: 'https://www.trulia.com/FL', description: 'Listing photos with neighborhood context', tags: ['listing-photos'] },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 5. INVESTOR DISCOVERY
  // ═══════════════════════════════════════════════════════════
  {
    id: 'investors',
    name: 'Investor Discovery',
    icon: 'Users',
    description: 'Sources for finding real estate investors — REIA groups, online communities, directories, and networking platforms where active buyers congregate.',
    subcategories: [
      {
        name: 'REIA Groups (Real Estate Investor Associations)',
        description: 'Local REIA groups are the #1 place to find active cash buyers for wholesale deals and partnerships.',
        sources: [
          { name: 'Florida REIA Network', url: 'https://www.floridareia.com', description: 'Statewide REIA network with chapter directory', tags: ['reia', 'networking'] },
          { name: 'Orlando REIA', url: 'https://www.orlandoreia.com', description: 'Central FL investor group — monthly meetings', tags: ['reia', 'orlando'] },
          { name: 'Tampa Bay REIA', url: 'https://www.tampabayreia.com', description: 'Tampa area investor association', tags: ['reia', 'tampa'] },
          { name: 'Miami REIA', url: 'https://www.miamireia.com', description: 'South FL investor group', tags: ['reia', 'miami'] },
          { name: 'Jacksonville REIA', url: 'https://www.jacksonvillereia.com', description: 'North FL investor association', tags: ['reia', 'jacksonville'] },
          { name: 'Fort Myers REIA', url: 'https://www.fortmyersreia.com', description: 'SW Florida investor group', tags: ['reia', 'fort-myers'] },
          { name: 'National REIA Directory', url: 'https://nationalreia.org/find-a-reia', description: 'National REIA — find all affiliated FL chapters', tags: ['reia', 'directory'] },
        ]
      },
      {
        name: 'Online Investor Communities',
        description: 'Digital platforms where investors network, share deals, and discuss strategy.',
        sources: [
          { name: 'BiggerPockets', url: 'https://www.biggerpockets.com', description: 'Largest real estate investor community — forums, tools, podcasts', tags: ['community', 'forums'] },
          { name: 'Connected Investors', url: 'https://connectedinvestors.com', description: 'Social network for real estate investors', tags: ['community', 'networking'] },
          { name: 'BiggerPockets FL Forum', url: 'https://www.biggerpockets.com/forums/93/fl', description: 'Florida-specific investor discussions', tags: ['forums', 'florida'] },
          { name: 'REI Club', url: 'https://www.reiclub.com', description: 'Investor education and networking', tags: ['community', 'education'] },
          { name: 'CreOnline', url: 'https://www.creonline.com', description: 'Creative real estate investor community', tags: ['community'] },
        ]
      },
      {
        name: 'LinkedIn Investor Groups',
        description: 'Professional networking groups on LinkedIn for finding accredited investors and partners.',
        sources: [
          { name: 'FL Real Estate Investors (LinkedIn)', url: 'https://www.linkedin.com/groups', description: 'Search: "Florida Real Estate Investors" — multiple groups', tags: ['linkedin', 'networking'] },
          { name: 'Real Estate Investors Group', url: 'https://www.linkedin.com/groups', description: 'Search: "Real Estate Investors" — national groups with FL members', tags: ['linkedin'] },
          { name: 'Private Lenders Group', url: 'https://www.linkedin.com/groups', description: 'Search: "Private Lenders Real Estate" — hard money contacts', tags: ['linkedin', 'lenders'] },
          { name: 'FL Real Estate Professionals', url: 'https://www.linkedin.com/groups', description: 'Search: "Florida Real Estate Professionals"', tags: ['linkedin', 'florida'] },
        ]
      },
      {
        name: 'Meetup.com Investor Groups',
        description: 'Local meetups for real estate investors — in-person and virtual networking events.',
        sources: [
          { name: 'Meetup.com FL REI', url: 'https://www.meetup.com/find/?keywords=real+estate+investing&location=fl', description: 'All FL real estate investor meetups', tags: ['meetup', 'networking'] },
          { name: 'Meetup.com FL Land', url: 'https://www.meetup.com/find/?keywords=land+investing&location=fl', description: 'FL land investor meetups', tags: ['meetup', 'land'] },
          { name: 'Meetup.com FL Wholesaling', url: 'https://www.meetup.com/find/?keywords=wholesaling&location=fl', description: 'FL wholesaling meetups', tags: ['meetup', 'wholesale'] },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 6. HEIRS & PROBATE DISCOVERY
  // ═══════════════════════════════════════════════════════════
  {
    id: 'heirs',
    name: 'Heirs & Probate Discovery',
    icon: 'HeartPulse',
    description: 'Sources for finding heirs of deceased property owners — obituaries, probate courts, death records, funeral homes, and people-search tools for skip tracing next of kin.',
    subcategories: [
      {
        name: 'Obituary Sources',
        description: 'Obituaries reveal the deceased name, death date, and often list surviving family members (heirs) by name and relationship.',
        sources: [
          { name: 'Legacy.com FL Obituaries', url: 'https://www.legacy.com/us/obituaries/fl', description: 'Largest obituary aggregator — all FL newspapers', tags: ['obituaries', 'heirs'] },
          { name: 'Tributes.com FL', url: 'https://www.tributes.com/fl', description: 'Obituaries and memorial listings', tags: ['obituaries'] },
          { name: 'Eons.com', url: 'https://www.eons.com', description: 'Obituary archive and search', tags: ['obituaries', 'archive'] },
          { name: 'Newspapers.com Obituaries', url: 'https://www.newspapers.com', description: 'Historical newspaper obituary archive (paid)', tags: ['obituaries', 'historical', 'paid'] },
          { name: 'ObitsArchive.com', url: 'https://www.obitsarchive.com/fl', description: 'Florida obituary archive search', tags: ['obituaries', 'archive'] },
          { name: 'FL Newspaper Directory', url: 'https://usnpl.com/flnewspapers.php', description: 'All FL newspapers — local obituary sections', tags: ['newspapers', 'obituaries'] },
        ]
      },
      {
        name: 'Probate Court Records',
        description: 'Probate filings are public record. They list the deceased, the executor/personal representative, heirs, and the property in the estate.',
        sources: [
          { name: 'FL Circuit Court Probate', url: 'https://www.flcourts.org', description: 'FL court system — find local probate divisions', tags: ['probate', 'courts'] },
          { name: 'Lee County Probate Court', url: 'https://www.leeclerk.org/probate', description: 'SW FL probate filings and estate records', tags: ['probate', 'lee'] },
          { name: 'Miami-Dade Probate', url: 'https://www.miamidade.gov/global/government/clerk/probate.page', description: 'South FL probate court records', tags: ['probate', 'miami'] },
          { name: 'Broward Probate Court', url: 'https://www.browardclerk.org/probate', description: 'Broward probate filings', tags: ['probate', 'broward'] },
          { name: 'Orange County Probate', url: 'https://www.myorangeclerk.com/probate', description: 'Orlando area probate records', tags: ['probate', 'orange'] },
          { name: 'Hillsborough Probate', url: 'https://www.hillsclerk.com/probate', description: 'Tampa area probate filings', tags: ['probate', 'hillsborough'] },
        ]
      },
      {
        name: 'Death Records & Genealogy',
        description: 'Official death records and genealogy databases for confirming deaths and finding family connections.',
        sources: [
          { name: 'FL Vital Records (Deaths)', url: 'https://www.flhealth.gov/vitalrecords/death', description: 'FL Dept of Health — official death certificates (restricted access)', tags: ['death-records', 'official'] },
          { name: 'Social Security Death Index', url: 'https://www.familysearch.org/search/collection/1202539', description: 'SSDI — free death record search', tags: ['death-records', 'free'] },
          { name: 'Ancestry.com', url: 'https://www.ancestry.com', description: 'Genealogy, family trees, death records (paid)', tags: ['genealogy', 'paid'] },
          { name: 'FamilySearch.org', url: 'https://www.familysearch.org', description: 'Free genealogy and family history records', tags: ['genealogy', 'free'] },
          { name: 'Find A Grave', url: 'https://www.findagrave.com', description: 'Grave records with birth/death dates and family links', tags: ['death-records', 'free'] },
        ]
      },
      {
        name: 'Funeral Home Directories',
        description: 'Funeral homes are often the first to know about a death and can connect you with the family or estate executor.',
        sources: [
          { name: 'FL Funeral Directors Association', url: 'https://www.ffda.org', description: 'Florida funeral home directory', tags: ['funeral-homes', 'directory'] },
          { name: 'Legacy.com Funeral Homes', url: 'https://www.legacy.com/funeral-homes/fl', description: 'FL funeral home listings by city', tags: ['funeral-homes', 'directory'] },
          { name: 'Undertake Press FL', url: 'https://www.undertakepress.com/fl', description: 'FL funeral home directory', tags: ['funeral-homes'] },
        ]
      },
      {
        name: 'People Search & Skip Tracing Heirs',
        description: 'Once you identify heirs from obituaries or probate records, these tools help locate their current contact information.',
        sources: [
          { name: 'TruePeopleSearch', url: 'https://www.truepeoplesearch.com', description: 'Free people search — phone, address, relatives', tags: ['skip-trace', 'free'] },
          { name: 'FastPeopleSearch', url: 'https://www.fastpeoplesearch.com', description: 'Free people lookup with relatives', tags: ['skip-trace', 'free'] },
          { name: 'BeenVerified', url: 'https://www.beenverified.com', description: 'Background checks, people search, relatives (paid)', tags: ['skip-trace', 'paid'] },
          { name: 'Spokeo', url: 'https://www.spokeo.com', description: 'People search, social profiles, relatives (paid)', tags: ['skip-trace', 'paid'] },
          { name: 'PeopleFinder', url: 'https://www.peoplefinder.com', description: 'People search and background checks', tags: ['skip-trace'] },
          { name: 'WhitePages', url: 'https://www.whitepages.com', description: 'People search, reverse phone, address lookup', tags: ['skip-trace'] },
          { name: 'Intelius', url: 'https://www.intelius.com', description: 'People search and background checks (paid)', tags: ['skip-trace', 'paid'] },
          { name: 'PeopleSmart', url: 'https://www.peoplesmart.com', description: 'People search with contact info (paid)', tags: ['skip-trace', 'paid'] },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 7. REAL ESTATE AGENT NETWORKS
  // ═══════════════════════════════════════════════════════════
  {
    id: 'agents',
    name: 'Real Estate Agent Networks',
    icon: 'Briefcase',
    description: 'Sources for finding real estate agents — especially those who specialize in distressed properties, REO, short sales, and investor transactions.',
    subcategories: [
      {
        name: 'Florida Realtor Associations',
        description: 'State and local Realtor associations with member directories and referral networks.',
        sources: [
          { name: 'Florida Realtors', url: 'https://www.floridarealtors.org', description: 'Statewide association — 200K+ members, agent directory', tags: ['realtors', 'directory'] },
          { name: 'Miami Association of Realtors', url: 'https://www.miamirealtors.com', description: 'Largest local board in FL', tags: ['realtors', 'miami'] },
          { name: 'Orlando Regional Realtor Association', url: 'https://www.orlandorealtors.org', description: 'Central FL realtor association', tags: ['realtors', 'orlando'] },
          { name: 'NEFAR (Jacksonville)', url: 'https://www.nefar.com', description: 'Northeast FL association of realtors', tags: ['realtors', 'jacksonville'] },
          { name: 'Stellar MLS Agent Directory', url: 'https://www.stellarmls.com', description: 'South FL MLS agent directory', tags: ['realtors', 'mls'] },
          { name: 'Pinellas Realtor Organization', url: 'https://www.pmar.com', description: 'Tampa Bay area realtor organization', tags: ['realtors', 'tampa'] },
        ]
      },
      {
        name: 'Agent Directories',
        description: 'Online directories for finding agents by specialty, location, and transaction type.',
        sources: [
          { name: 'Realtor.com Agent Directory', url: 'https://www.realtor.com/realestateagents/fl', description: 'Find agents by city, specialty, reviews', tags: ['agents', 'directory'] },
          { name: 'Zillow Agent Finder', url: 'https://www.zillow.com/agent-finder/fl', description: 'Agent directory with reviews and sales history', tags: ['agents', 'directory'] },
          { name: 'Homes.com Agents', url: 'https://www.homes.com/real-estate-agents/fl', description: 'FL agent directory', tags: ['agents', 'directory'] },
          { name: 'Trulia Agents', url: 'https://www.trulia.com/agents/fl', description: 'Agent directory with local expertise', tags: ['agents', 'directory'] },
          { name: 'Redfin Agents', url: 'https://www.redfin.com/agents/fl', description: 'Redfin agent directory', tags: ['agents', 'directory'] },
        ]
      },
      {
        name: 'Distressed Property Specialists',
        description: 'Agents and brokers who specialize in distressed properties, REO, short sales, and investor transactions.',
        sources: [
          { name: 'CDPE (Distressed Property Experts)', url: 'https://www.cdpe.com/find-an-agent', description: 'Certified Distressed Property Expert directory', tags: ['distressed-agents', 'certified'] },
          { name: 'SFR (Short Sale & Foreclosure)', url: 'https://www.realtor.com/professionals/short-sale-foreclosure-resource', description: 'NAR Short Sale & Foreclosure Resource certification', tags: ['distressed-agents', 'certified'] },
          { name: 'REO Agent Directories', url: 'https://www.auction.com/brokers', description: 'Bank REO agent networks', tags: ['reo-agents'] },
          { name: 'BP Agent Finder', url: 'https://www.biggerpockets.com/agent-finder', description: 'Investor-friendly agent matching', tags: ['investor-agents'] },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 8. ADJACENT BUSINESS PARTNERS
  // ═══════════════════════════════════════════════════════════
  {
    id: 'partners',
    name: 'Adjacent Business Partners',
    icon: 'Handshake',
    description: 'Businesses we can partner with — they help us find deals, close deals, and service properties; we send them referrals. These are the most valuable relationships in the real estate ecosystem.',
    subcategories: [
      {
        name: 'Title Companies & Escrow',
        description: 'Title companies handle closings and can be a source of deal referrals. They know when properties are about to change hands.',
        sources: [
          { name: 'Old Republic National Title', url: 'https://www.ortc.com', description: 'Major FL title insurance company', tags: ['title', 'escrow'] },
          { name: 'First American Title', url: 'https://www.firstam.com/title/fl', description: 'National title company with FL offices', tags: ['title', 'escrow'] },
          { name: 'Stewart Title', url: 'https://www.stewart.com/fl', description: 'Title insurance and escrow services', tags: ['title', 'escrow'] },
          { name: 'Fidelity National Title', url: 'https://www.fntic.com', description: 'Title insurance and closing services', tags: ['title', 'escrow'] },
          { name: 'FL Land Title Association', url: 'https://www.flta.org', description: 'FL title industry association — member directory', tags: ['title', 'association'] },
        ]
      },
      {
        name: 'Lenders & Financing',
        description: 'Hard money lenders, private lenders, and mortgage brokers who finance distressed property acquisitions and rehabs.',
        sources: [
          { name: 'FL Hard Money Lenders Directory', url: 'https://www.biggerpockets.com/lenders/fl', description: 'BiggerPockets FL lender directory', tags: ['lenders', 'hard-money'] },
          { name: 'Kiavi (Hard Money)', url: 'https://www.kiavi.com', description: 'National hard money lender for fix-and-flip/BRRRR', tags: ['lenders', 'hard-money'] },
          { name: 'Lima One Capital', url: 'https://www.limaone.com', description: 'Fix-and-flip and rental property loans', tags: ['lenders', 'hard-money'] },
          { name: 'Visio Lending', url: 'https://www.visiolending.com', description: 'Rental property and fix-and-flip loans', tags: ['lenders', 'rental'] },
          { name: 'CoreVest Finance', url: 'https://www.corevestfinance.com', description: 'Portfolio and rental property financing', tags: ['lenders', 'portfolio'] },
          { name: 'FL Mortgage Brokers Association', url: 'https://www.famb.org', description: 'FL Association of Mortgage Brokers — member directory', tags: ['lenders', 'association'] },
        ]
      },
      {
        name: 'Contractors & Rehab',
        description: 'General contractors, rehabbers, and tradespeople who can estimate repair costs and execute renovations.',
        sources: [
          { name: 'FL Construction Industry Licensing Board', url: 'https://www.myfloridalicense.com/business-and-industry/construction-industry', description: 'Licensed contractor verification — all FL contractors', tags: ['contractors', 'licensed'] },
          { name: 'Angi (FL Contractors)', url: 'https://www.angi.com/fl', description: 'Contractor reviews and ratings by city', tags: ['contractors', 'reviews'] },
          { name: 'HomeAdvisor FL', url: 'https://www.homeadvisor.com/c.Florida', description: 'Find and compare FL contractors', tags: ['contractors', 'reviews'] },
          { name: 'Thumbtack FL', url: 'https://www.thumbtack.com/fl', description: 'Local contractor marketplace', tags: ['contractors'] },
          { name: 'BBB FL Contractors', url: 'https://www.bbb.org/us/fl/category/general-contractor', description: 'BBB-accredited FL contractors', tags: ['contractors', 'bbb'] },
        ]
      },
      {
        name: 'Home Inspectors',
        description: 'Home inspectors assess property condition and identify repair items — critical for deal analysis.',
        sources: [
          { name: 'InterNACHI FL Inspectors', url: 'https://www.nachi.org/find-an-inspector/fl', description: 'Certified home inspector directory', tags: ['inspectors', 'certified'] },
          { name: 'ASHI FL Inspectors', url: 'https://www.homeinspector.org/find-an-inspector', description: 'American Society of Home Inspectors — FL members', tags: ['inspectors', 'certified'] },
          { name: 'FL Dept of Business Inspectors', url: 'https://www.myfloridalicense.com', description: 'State-licensed home inspector verification', tags: ['inspectors', 'licensed'] },
        ]
      },
      {
        name: 'Appraisers',
        description: 'Licensed appraisers who determine property values — essential for ARV estimation and lender requirements.',
        sources: [
          { name: 'FL Real Estate Appraisal Board', url: 'https://www.myfloridalicense.com/business-and-industry/real-estate-appraisers', description: 'Licensed FL appraiser search', tags: ['appraisers', 'licensed'] },
          { name: 'Appraisal Institute FL', url: 'https://www.appraisalinstitute.org/find-an-appraiser', description: 'MAI-designated appraiser directory', tags: ['appraisers', 'certified'] },
          { name: 'National Registry of Appraisers', url: 'https://www.asc.gov/National-Registry', description: 'Federal appraiser registry', tags: ['appraisers', 'federal'] },
        ]
      },
      {
        name: 'Surveyors',
        description: 'Land surveyors for boundary surveys, elevation certificates, and property line verification.',
        sources: [
          { name: 'FL Surveying & Mapping Society', url: 'https://www.fsms.org', description: 'FL surveyor society — member directory', tags: ['surveyors', 'association'] },
          { name: 'NSPS Surveyor Directory', url: 'https://www.nsps.us.com', description: 'National Society of Professional Surveyors', tags: ['surveyors'] },
        ]
      },
      {
        name: 'Legal Professionals',
        description: 'Real estate attorneys, probate attorneys, divorce attorneys, and bankruptcy attorneys — they know about distress before anyone else.',
        sources: [
          { name: 'FL Bar Attorney Search', url: 'https://www.floridabar.org/findalawyer', description: 'All licensed FL attorneys by specialty', tags: ['attorneys', 'licensed'] },
          { name: 'FL Bar Real Estate Section', url: 'https://www.floridabar.org/sections/real-property-probate-trust-law', description: 'Real estate and probate attorney directory', tags: ['attorneys', 'real-estate', 'probate'] },
          { name: 'FL Probate Attorneys', url: 'https://www.floridabar.org/public/consumer-information/consumer-pamphlets/probate-in-florida', description: 'Probate attorney directory and process info', tags: ['attorneys', 'probate'] },
          { name: 'FL Academy of Trial Lawyers', url: 'https://www.floridajustice.org', description: 'Trial attorneys including divorce/family law', tags: ['attorneys', 'divorce'] },
          { name: 'FL Bankruptcy Attorneys', url: 'https://www.floridabar.org/findalawyer?practice=bankruptcy', description: 'Bankruptcy attorney directory', tags: ['attorneys', 'bankruptcy'] },
          { name: 'Martindale-Hubbell FL', url: 'https://www.martindale.com/fl', description: 'Peer-reviewed attorney directory', tags: ['attorneys', 'directory'] },
        ]
      },
      {
        name: 'Insurance',
        description: 'Property insurance agents — Florida insurance is complex (wind, flood, Citizens). Agents know about properties with claims and coverage issues.',
        sources: [
          { name: 'FL Insurance Agents Directory', url: 'https://www.floir.com', description: 'FL Office of Insurance Regulation — agent lookup', tags: ['insurance', 'licensed'] },
          { name: 'Citizens Property Insurance', url: 'https://www.citizensfla.com', description: 'FL state-backed insurer of last resort', tags: ['insurance', 'state'] },
          { name: 'FL Association of Insurance Agents', url: 'https://www.faiia.org', description: 'Independent insurance agent association', tags: ['insurance', 'association'] },
        ]
      },
      {
        name: 'Property Management',
        description: 'Property managers know about distressed rentals, evictions, and owners looking to sell rental portfolios.',
        sources: [
          { name: 'NARPM FL Chapters', url: 'https://www.narpm.org/chapters/fl', description: 'National Association of Residential Property Managers — FL chapters', tags: ['property-management', 'association'] },
          { name: 'FL Apartment Association', url: 'https://www.faaonline.org', description: 'FL apartment and rental property association', tags: ['property-management', 'association'] },
          { name: 'IREM FL', url: 'https://www.irem.org/chapters/fl', description: 'Institute of Real Estate Management — FL chapters', tags: ['property-management'] },
        ]
      },
      {
        name: 'Estate Sale & Junk Removal',
        description: 'Estate sale companies and junk removal services are called when someone dies or a property is being cleared out — early distress signals.',
        sources: [
          { name: 'EstateSales.net FL', url: 'https://www.estatesales.net/FL', description: 'FL estate sale listings — indicates probate/downsizing', tags: ['estate-sales', 'probate'] },
          { name: 'EstateSale.com FL', url: 'https://www.estatesale.com/states/fl', description: 'FL estate sale company directory', tags: ['estate-sales'] },
          { name: '1-800-Got-Junk FL', url: 'https://www.1800gotjunk.com/fl', description: 'Junk removal — called for cleanouts', tags: ['junk-removal'] },
          { name: 'College Hunks Hauling FL', url: 'https://www.collegehunkshaulingjunk.com/fl', description: 'FL junk and moving services', tags: ['junk-removal', 'moving'] },
        ]
      },
      {
        name: 'Moving Companies',
        description: 'Moving companies know when people are leaving — divorce, foreclosure, downsizing, out-of-state relocation.',
        sources: [
          { name: 'FL Moving Companies Directory', url: 'https://www.moving.com/movers/fl', description: 'FL licensed moving companies', tags: ['moving'] },
          { name: 'Better Business Bureau Movers', url: 'https://www.bbb.org/us/fl/category/movers', description: 'BBB-accredited FL movers', tags: ['moving', 'bbb'] },
          { name: 'FL Dept of Ag Movers', url: 'https://www.fdacs.gov/Consumer-Resources/Consumer-Resources/Business-and-Individual-Movers', description: 'State-licensed FL movers', tags: ['moving', 'licensed'] },
        ]
      },
      {
        name: 'Trades (Roofers, Plumbers, Electricians, HVAC)',
        description: 'Tradespeople are called to distressed properties for emergency repairs — they know which properties are in bad shape.',
        sources: [
          { name: 'FL Roofing Contractors', url: 'https://www.fraa.org', description: 'FL Roofing & Sheet Metal Contractors Association', tags: ['roofers', 'association'] },
          { name: 'FL Plumbing Contractors', url: 'https://www.fpcaonline.org', description: 'FL Plumbing Contractors Association', tags: ['plumbers', 'association'] },
          { name: 'FL Electrical Contractors', url: 'https://www.feca.org', description: 'FL Electrical Contractors Association', tags: ['electricians', 'association'] },
          { name: 'FL AC Contractors (ACCA-FL)', url: 'https://www.accafl.org', description: 'FL Air Conditioning Contractors Association', tags: ['hvac', 'association'] },
        ]
      },
      {
        name: 'Pest, Mold & Environmental',
        description: 'Pest control, mold remediation, and environmental services — called to distressed properties with infestation or damage.',
        sources: [
          { name: 'FL Pest Control Association', url: 'https://www.fpcaonline.org', description: 'FL Pest Control Association members', tags: ['pest-control', 'association'] },
          { name: 'IICRC Mold Pros FL', url: 'https://www.iicrc.org/locate-a-certified-firm', description: 'Certified mold remediation firms', tags: ['mold', 'remediation'] },
          { name: 'FL Environmental Professionals', url: 'https://www.faeec.org', description: 'FL environmental engineering consultants', tags: ['environmental', 'consulting'] },
        ]
      },
      {
        name: 'CPAs & Tax Professionals',
        description: 'CPAs know when clients are in financial distress, going through divorce, or need to sell property for tax reasons.',
        sources: [
          { name: 'FL Institute of CPAs', url: 'https://www.ficpa.org', description: 'FL CPA society — member directory', tags: ['cpa', 'association'] },
          { name: 'IRS Tax Pro Directory', url: 'https://www.irs.gov/tax-professionals/choose-a-tax-professional', description: 'IRS-registered tax professionals', tags: ['cpa', 'tax'] },
        ]
      },
      {
        name: 'Notaries & Signing Services',
        description: 'Mobile notaries and signing agents handle document execution — they know when deals are closing and can be referral sources.',
        sources: [
          { name: 'FL Notary Directory', url: 'https://notaries.dos.state.fl.us', description: 'Official FL notary search', tags: ['notaries', 'licensed'] },
          { name: 'National Notary Association FL', url: 'https://www.nationalnotary.org/fl', description: 'NNA FL notary directory and resources', tags: ['notaries', 'association'] },
          { name: 'SigningAgent.com FL', url: 'https://www.signingagent.com/fl', description: 'FL notary signing agent directory', tags: ['notaries', 'signing'] },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 9. PROFESSIONAL ASSOCIATIONS
  // ═══════════════════════════════════════════════════════════
  {
    id: 'associations',
    name: 'Professional Associations',
    icon: 'Award',
    description: 'Industry associations and organizations worth joining for networking, credibility, referrals, and industry intelligence.',
    subcategories: [
      {
        name: 'Real Estate Investor Associations',
        description: 'REIA groups and investor associations — the best place to find buyers, partners, and deals.',
        sources: [
          { name: 'National REIA', url: 'https://nationalreia.org', description: 'National REIA — umbrella for local REIA groups', tags: ['reia', 'national'] },
          { name: 'Florida REIA', url: 'https://www.floridareia.com', description: 'Statewide FL REIA network', tags: ['reia', 'florida'] },
          { name: 'National Association of Real Estate Investors', url: 'https://www.narei.com', description: 'National investor association', tags: ['reia', 'national'] },
        ]
      },
      {
        name: 'Realtor Associations',
        description: 'Realtor associations provide MLS access, networking, and professional credibility.',
        sources: [
          { name: 'Florida Realtors', url: 'https://www.floridarealtors.org', description: 'Statewide realtor association (200K+ members)', tags: ['realtors', 'florida'] },
          { name: 'National Association of Realtors', url: 'https://www.nar.realtor', description: 'NAR — national realtor association', tags: ['realtors', 'national'] },
          { name: 'CCIM Institute', url: 'https://www.ccim.com', description: 'Commercial investment real estate designation', tags: ['commercial', 'designation'] },
        ]
      },
      {
        name: 'Home Builder Associations',
        description: 'Builder associations connect you with developers, contractors, and new construction opportunities.',
        sources: [
          { name: 'Florida Home Builders Association', url: 'https://www.fhba.com', description: 'Statewide home builder association', tags: ['builders', 'florida'] },
          { name: 'NAHB (National)', url: 'https://www.nahb.org', description: 'National Association of Home Builders', tags: ['builders', 'national'] },
          { name: 'Building Industry Association of FL', url: 'https://www.biafl.org', description: 'FL building industry association', tags: ['builders', 'florida'] },
        ]
      },
      {
        name: 'Chambers of Commerce',
        description: 'Local chambers provide business networking and community connections across FL cities.',
        sources: [
          { name: 'FL Chamber of Commerce', url: 'https://www.flchamber.com', description: 'Statewide FL chamber of commerce', tags: ['chamber', 'florida'] },
          { name: 'US Chamber — FL Local', url: 'https://www.uschamber.com/chambers/fl', description: 'Directory of all FL local chambers', tags: ['chamber', 'directory'] },
          { name: 'Miami Chamber', url: 'https://www.mccoc.com', description: 'Greater Miami Chamber of Commerce', tags: ['chamber', 'miami'] },
          { name: 'Orlando Chamber', url: 'https://www.orlando.org', description: 'Orlando Regional Chamber', tags: ['chamber', 'orlando'] },
          { name: 'Tampa Bay Chamber', url: 'https://www.tampabaylight.org', description: 'Tampa Bay area chamber', tags: ['chamber', 'tampa'] },
        ]
      },
      {
        name: 'BNI & Networking Groups',
        description: 'Business Network International chapters — structured referral networking with local professionals.',
        sources: [
          { name: 'BNI Florida', url: 'https://www.bni.com/regions/fl', description: 'BNI chapters across Florida', tags: ['bni', 'networking'] },
          { name: 'BNI Find a Chapter', url: 'https://www.bni.com/find-a-chapter', description: 'Find BNI chapters by FL city', tags: ['bni', 'directory'] },
        ]
      },
      {
        name: 'Industry-Specific Associations',
        description: 'Associations for specific real estate niches — land, commercial, multifamily, property management.',
        sources: [
          { name: 'Land Institute (REALTORS Land Institute)', url: 'https://www.realtorsland.org', description: 'Land specialist designation and network', tags: ['land', 'designation'] },
          { name: 'ICFL (Commercial)', url: 'https://fl.ccim.com', description: 'FL CCIM chapter — commercial investment', tags: ['commercial', 'designation'] },
          { name: 'IREM FL', url: 'https://www.irem.org/chapters/fl', description: 'Property management professionals', tags: ['property-management'] },
          { name: 'CAI (HOA/Community Assoc.)', url: 'https://www.caionline.org', description: 'Community Associations Institute — HOA management', tags: ['hoa', 'associations'] },
          { name: 'FL Apartment Association', url: 'https://www.faaonline.org', description: 'Multifamily and rental property owners', tags: ['multifamily', 'associations'] },
          { name: 'Mortgage Bankers Association of FL', url: 'https://www.mbafl.org', description: 'FL mortgage banking professionals', tags: ['lenders', 'associations'] },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 10. FACEBOOK GROUPS & COMMUNITIES
  // ═══════════════════════════════════════════════════════════
  {
    id: 'facebook',
    name: 'Facebook Groups & Communities',
    icon: 'Facebook',
    description: 'Facebook groups and pages where Florida real estate investors, wholesalers, land buyers, and professionals network, share deals, and discuss the market. These can be scraped for leads and joined for networking.',
    subcategories: [
      {
        name: 'Florida Real Estate Investor Groups',
        description: 'Statewide FL investor groups — deal sharing, buyer/seller matching, and market discussion.',
        sources: [
          { name: 'Florida Real Estate Investors', url: 'https://www.facebook.com/groups/search/?q=florida+real+estate+investors', description: 'Search for FL investor groups (multiple exist)', tags: ['facebook', 'investors', 'florida'] },
          { name: 'Florida Real Estate Investing', url: 'https://www.facebook.com/groups/search/?q=florida+real+estate+investing', description: 'FL investing discussion groups', tags: ['facebook', 'investors'] },
          { name: 'FL Real Estate Wholesaling', url: 'https://www.facebook.com/groups/search/?q=florida+wholesaling', description: 'FL wholesale deal groups', tags: ['facebook', 'wholesale'] },
          { name: 'Florida Real Estate Deals', url: 'https://www.facebook.com/groups/search/?q=florida+real+estate+deals', description: 'FL deal posting groups', tags: ['facebook', 'deals'] },
        ]
      },
      {
        name: 'Regional FL Real Estate Groups',
        description: 'City and county-specific real estate groups — more targeted than statewide groups.',
        sources: [
          { name: 'Miami Real Estate Investors', url: 'https://www.facebook.com/groups/search/?q=miami+real+estate+investors', description: 'Miami-Dade investor groups', tags: ['facebook', 'miami'] },
          { name: 'Orlando Real Estate Investors', url: 'https://www.facebook.com/groups/search/?q=orlando+real+estate+investors', description: 'Central FL investor groups', tags: ['facebook', 'orlando'] },
          { name: 'Tampa Bay Real Estate', url: 'https://www.facebook.com/groups/search/?q=tampa+bay+real+estate', description: 'Tampa Bay area real estate groups', tags: ['facebook', 'tampa'] },
          { name: 'Jacksonville Real Estate', url: 'https://www.facebook.com/groups/search/?q=jacksonville+fl+real+estate', description: 'North FL real estate groups', tags: ['facebook', 'jacksonville'] },
          { name: 'Fort Myers/Cape Coral RE', url: 'https://www.facebook.com/groups/search/?q=fort+myers+real+estate', description: 'SW Florida real estate groups', tags: ['facebook', 'fort-myers'] },
          { name: 'Broward Real Estate', url: 'https://www.facebook.com/groups/search/?q=broward+real+estate', description: 'Broward County investor groups', tags: ['facebook', 'broward'] },
          { name: 'Palm Beach Real Estate', url: 'https://www.facebook.com/groups/search/?q=palm+beach+real+estate', description: 'Palm Beach area groups', tags: ['facebook', 'palm-beach'] },
          { name: 'Sarasota Real Estate', url: 'https://www.facebook.com/groups/search/?q=sarasota+real+estate', description: 'Sarasota/Bradenton area groups', tags: ['facebook', 'sarasota'] },
        ]
      },
      {
        name: 'Land & Lot Groups',
        description: 'Facebook groups focused on land, lots, and acreage for sale in Florida.',
        sources: [
          { name: 'Florida Land for Sale', url: 'https://www.facebook.com/groups/search/?q=florida+land+for+sale', description: 'FL land listings and discussion', tags: ['facebook', 'land'] },
          { name: 'FL Land Investors', url: 'https://www.facebook.com/groups/search/?q=florida+land+investors', description: 'FL land investor networking', tags: ['facebook', 'land', 'investors'] },
          { name: 'FL Acreage for Sale', url: 'https://www.facebook.com/groups/search/?q=florida+acreage+for+sale', description: 'FL acreage and rural land groups', tags: ['facebook', 'land', 'rural'] },
        ]
      },
      {
        name: 'Distressed & Off-Market Groups',
        description: 'Groups specifically for distressed, off-market, and wholesale properties.',
        sources: [
          { name: 'FL Off-Market Properties', url: 'https://www.facebook.com/groups/search/?q=florida+off+market+properties', description: 'Off-market deal sharing', tags: ['facebook', 'off-market'] },
          { name: 'FL Distressed Properties', url: 'https://www.facebook.com/groups/search/?q=florida+distressed+properties', description: 'Distressed property groups', tags: ['facebook', 'distressed'] },
          { name: 'FL Foreclosures', url: 'https://www.facebook.com/groups/search/?q=florida+foreclosures', description: 'Foreclosure discussion and listings', tags: ['facebook', 'foreclosures'] },
          { name: 'FL Cash Buyers', url: 'https://www.facebook.com/groups/search/?q=florida+cash+buyers', description: 'Cash buyer networking groups', tags: ['facebook', 'cash-buyers'] },
        ]
      },
      {
        name: 'Probate & Inherited Property Groups',
        description: 'Groups focused on probate real estate, inherited properties, and estate sales.',
        sources: [
          { name: 'FL Probate Real Estate', url: 'https://www.facebook.com/groups/search/?q=florida+probate+real+estate', description: 'Probate property investor groups', tags: ['facebook', 'probate'] },
          { name: 'FL Estate Sales', url: 'https://www.facebook.com/groups/search/?q=florida+estate+sales', description: 'Estate sale and inherited property groups', tags: ['facebook', 'estate-sales'] },
        ]
      },
      {
        name: 'Contractor & Trade Groups',
        description: 'Facebook groups for contractors and trades — useful for finding rehab partners and getting repair estimates.',
        sources: [
          { name: 'FL Contractors Network', url: 'https://www.facebook.com/groups/search/?q=florida+contractors', description: 'FL contractor networking groups', tags: ['facebook', 'contractors'] },
          { name: 'FL Real Estate Networking', url: 'https://www.facebook.com/groups/search/?q=florida+real+estate+networking', description: 'General FL real estate networking', tags: ['facebook', 'networking'] },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 11. PEOPLE WHO KNOW ABOUT DISTRESSED PROPERTIES
  // ═══════════════════════════════════════════════════════════
  {
    id: 'people',
    name: 'People Who Know Distressed Properties',
    icon: 'UserSearch',
    description: 'Professionals and everyday people who are positioned to know about distressed properties before they hit the market. Building relationships with these people is the most powerful off-market lead generation strategy.',
    subcategories: [
      {
        name: 'Legal Professionals',
        description: 'Attorneys are the first to know about divorce, probate, bankruptcy, and foreclosure situations.',
        sources: [
          { name: 'Probate Attorneys', url: 'https://www.floridabar.org/findalawyer?practice=probate', description: 'They represent estates — they know when heirs want to sell', tags: ['attorneys', 'probate'] },
          { name: 'Divorce/Family Law Attorneys', url: 'https://www.floridabar.org/findalawyer?practice=family', description: 'They know when couples are selling property in divorce', tags: ['attorneys', 'divorce'] },
          { name: 'Bankruptcy Attorneys', url: 'https://www.floridabar.org/findalawyer?practice=bankruptcy', description: 'They know when property is being liquidated', tags: ['attorneys', 'bankruptcy'] },
          { name: 'Real Estate Attorneys', url: 'https://www.floridabar.org/findalawyer?practice=real-estate', description: 'They handle closings and know about distressed sales', tags: ['attorneys', 'real-estate'] },
          { name: 'Estate Planning Attorneys', url: 'https://www.floridabar.org/findalawyer?practice=estate-planning', description: 'They know about properties being transferred to heirs', tags: ['attorneys', 'estate-planning'] },
        ]
      },
      {
        name: 'Financial Professionals',
        description: 'CPAs, financial advisors, and bank employees who know when clients are in financial distress.',
        sources: [
          { name: 'CPAs & Tax Preparers', url: 'https://www.ficpa.org', description: 'They know when clients need to sell for tax or financial reasons', tags: ['cpa', 'financial'] },
          { name: 'Bank Branch Managers', url: 'https://www.fdic.gov/bankfind', description: 'They know about REO properties and distressed borrowers', tags: ['banks', 'reo'] },
          { name: 'Financial Advisors', url: 'https://www.finra.org/brokercheck', description: 'They know when clients need to liquidate real estate', tags: ['financial-advisors'] },
        ]
      },
      {
        name: 'Property-Adjacent Workers',
        description: 'Workers who visit properties regularly and notice distress — vacancy, disrepair, code violations.',
        sources: [
          { name: 'Mail Carriers (USPS)', url: 'https://www.usps.com', description: 'They know which houses have overflowing mailboxes (vacant)', tags: ['mail-carriers', 'vacancy'] },
          { name: 'Utility Workers', url: 'https://www.flpublicservice.com', description: 'Water/electric/gas workers see distressed properties', tags: ['utility-workers'] },
          { name: 'Code Enforcement Officers', url: 'https://floridacities.com/code-enforcement', description: 'They actively track code violations and condemned properties', tags: ['code-enforcement'] },
          { name: 'HOA Managers', url: 'https://www.caionline.org', description: 'They know about delinquent owners and HOA foreclosures', tags: ['hoa-managers'] },
          { name: 'Property Managers', url: 'https://www.narpm.org/chapters/fl', description: 'They know about problem rentals and owners wanting to sell', tags: ['property-managers'] },
          { name: 'Lawn Maintenance Services', url: 'https://www.angi.com/fl/category/lawn-care', description: 'They know which lawns are overgrown (vacant properties)', tags: ['lawn-care', 'vacancy'] },
          { name: 'Pool Service Companies', url: 'https://www.angi.com/fl/category/pool-services', description: 'They know about abandoned pools (green pools = vacancy)', tags: ['pool-service', 'vacancy'] },
          { name: 'Pest Control Services', url: 'https://www.fpcaonline.org', description: 'They see infestations in vacant/distressed properties', tags: ['pest-control'] },
        ]
      },
      {
        name: 'Care & End-of-Life Professionals',
        description: 'Professionals in healthcare and end-of-life services who know about properties entering probate.',
        sources: [
          { name: 'Nursing Homes / Assisted Living', url: 'https://www.floridahealthfinder.gov/facilitylocator', description: 'When residents move in, their homes often need to be sold', tags: ['nursing-homes', 'probate'] },
          { name: 'Hospice Care Organizations', url: 'https://www.floridahospice.org', description: 'They know about end-of-life situations and estate planning', tags: ['hospice', 'probate'] },
          { name: 'Funeral Homes', url: 'https://www.ffda.org', description: 'They know about recent deaths — first step in probate', tags: ['funeral-homes', 'probate'] },
          { name: 'Estate Sale Companies', url: 'https://www.estatesales.net/FL', description: 'They are hired to liquidate estates — strong probate signal', tags: ['estate-sales', 'probate'] },
        ]
      },
      {
        name: 'Real Estate Professionals',
        description: 'Agents, wholesalers, and investors who specialize in distressed properties.',
        sources: [
          { name: 'REO Listing Agents', url: 'https://www.auction.com/brokers', description: 'Agents who list bank-owned properties', tags: ['reo-agents'] },
          { name: 'Short Sale Specialists', url: 'https://www.cdpe.com/find-an-agent', description: 'Agents who handle short sales', tags: ['short-sale-agents'] },
          { name: 'Active Wholesalers', url: 'https://connectedinvestors.com', description: 'Other wholesalers who have deals they cant move', tags: ['wholesalers'] },
          { name: 'Expired Listing Agents', url: 'https://www.stellarmls.com', description: 'Agents with expired listings (motivated sellers)', tags: ['expired-listings'] },
        ]
      },
      {
        name: 'Neighbors & Community',
        description: 'Everyday people who notice distressed properties in their neighborhoods.',
        sources: [
          { name: 'Neighborhood Watch Groups', url: 'https://www.nnw.org', description: 'Neighborhood watch members notice vacant properties', tags: ['neighbors', 'vacancy'] },
          { name: 'Nextdoor App', url: 'https://nextdoor.com', description: 'Hyper-local social network — neighbors discuss issues', tags: ['neighbors', 'social'] },
          { name: 'Community Facebook Groups', url: 'https://www.facebook.com/groups', description: 'Neighborhood-specific Facebook groups', tags: ['neighbors', 'facebook'] },
          { name: 'FL HOA Board Members', url: 'https://www.caionline.org', description: 'HOA board members know about delinquent owners', tags: ['hoa', 'community'] },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 12. DATA & SKIP TRACING TOOLS
  // ═══════════════════════════════════════════════════════════
  {
    id: 'data-tools',
    name: 'Data & Skip Tracing Tools',
    icon: 'Database',
    description: 'Software platforms for property data, skip tracing (finding people), list building, CRM, and lead generation — the technology stack for finding and contacting distressed property owners.',
    subcategories: [
      {
        name: 'Property Data & List Building',
        description: 'Platforms that provide property data, owner information, comps, and list-building tools for targeted marketing.',
        sources: [
          { name: 'PropStream', url: 'https://www.propstream.com', description: 'Property data, skip tracing, comps, marketing lists', tags: ['data', 'skip-trace', 'paid'] },
          { name: 'PropertyRadar', url: 'https://www.propertyradar.com', description: 'Distressed property data with owner info and alerts', tags: ['data', 'distress', 'paid'] },
          { name: 'ListSource (CoreLogic)', url: 'https://www.listsource.com', description: 'Mailing list builder by property/owner criteria', tags: ['data', 'lists', 'paid'] },
          { name: 'Realeflow', url: 'https://www.realeflow.com', description: 'All-in-one investor platform — leads, CRM, deal analysis', tags: ['data', 'crm', 'paid'] },
          { name: 'REIPro', url: 'https://www.reipro.com', description: 'Lead generation, skip tracing, deal management', tags: ['data', 'leads', 'paid'] },
          { name: 'DealMachine', url: 'https://www.dealmachine.com', description: 'Driving for dollars app with skip tracing', tags: ['data', 'driving-for-dollars', 'mobile'] },
          { name: 'REISift', url: 'https://www.reisift.com', description: 'Data processing and skip tracing platform', tags: ['data', 'skip-trace'] },
          { name: 'BatchLeads', url: 'https://www.batchleads.io', description: 'Property data, skip tracing, CRM, dialer', tags: ['data', 'skip-trace', 'crm'] },
        ]
      },
      {
        name: 'Skip Tracing Services',
        description: 'Services for finding current phone numbers, emails, and addresses of property owners and heirs.',
        sources: [
          { name: 'TLO (TransUnion)', url: 'https://www.tlo.com', description: 'Professional skip tracing — comprehensive people search', tags: ['skip-trace', 'professional', 'paid'] },
          { name: 'IRBsearch', url: 'https://www.irbsearch.com', description: 'Investigative database for skip tracing', tags: ['skip-trace', 'investigative', 'paid'] },
          { name: 'BeenVerified', url: 'https://www.beenverified.com', description: 'Consumer people search and background checks', tags: ['skip-trace', 'consumer'] },
          { name: 'Spokeo', url: 'https://www.spokeo.com', description: 'People search with social profiles and relatives', tags: ['skip-trace', 'consumer'] },
          { name: 'TruePeopleSearch', url: 'https://www.truepeoplesearch.com', description: 'Free people search — phone, address, relatives', tags: ['skip-trace', 'free'] },
          { name: 'FastPeopleSearch', url: 'https://www.fastpeoplesearch.com', description: 'Free people lookup with relatives', tags: ['skip-trace', 'free'] },
          { name: 'WhitePages', url: 'https://www.whitepages.com', description: 'People search, reverse phone, address lookup', tags: ['skip-trace'] },
          { name: 'Intelius', url: 'https://www.intelius.com', description: 'People search and background checks', tags: ['skip-trace', 'paid'] },
          { name: 'PeopleSmart', url: 'https://www.peoplesmart.com', description: 'People search with contact info', tags: ['skip-trace', 'paid'] },
          { name: 'Skip Genie', url: 'https://www.skipgenie.com', description: 'Investor-focused skip tracing service', tags: ['skip-trace', 'investor'] },
        ]
      },
      {
        name: 'CRM & Dialer Systems',
        description: 'CRM platforms and dialers for managing leads and making high-volume contact calls.',
        sources: [
          { name: 'BatchDialer', url: 'https://www.batchdialer.com', description: 'Predictive dialer for investor outreach', tags: ['dialer', 'paid'] },
          { name: 'Mojo Dialer', url: 'https://www.mojosells.com', description: 'Power dialer and lead management', tags: ['dialer', 'paid'] },
          { name: 'FreedomSoft', url: 'https://www.freedomsoft.com', description: 'Investor CRM with marketing automation', tags: ['crm', 'paid'] },
          { name: 'Pebble CRM', url: 'https://www.pebble.io', description: 'Real estate investor CRM', tags: ['crm', 'paid'] },
          { name: 'REI BlackBook', url: 'https://www.reiblackbook.com', description: 'Investor CRM and marketing automation', tags: ['crm', 'paid'] },
          { name: 'CallTools', url: 'https://www.calltools.com', description: 'Cloud-based dialer system', tags: ['dialer', 'paid'] },
        ]
      },
      {
        name: 'Data Enrichment & Verification',
        description: 'Services for verifying and enriching contact data — phone validation, email verification, address standardization.',
        sources: [
          { name: 'Melissa Data', url: 'https://www.melissa.com', description: 'Address verification, phone validation, email verification', tags: ['enrichment', 'verification', 'paid'] },
          { name: 'Twilio Lookup', url: 'https://www.twilio.com/lookup', description: 'Phone number validation and carrier lookup', tags: ['phone-validation', 'api'] },
          { name: 'Numverify', url: 'https://numverify.com', description: 'Phone number validation API', tags: ['phone-validation', 'api'] },
          { name: 'ZeroBounce', url: 'https://www.zerobounce.net', description: 'Email validation and verification', tags: ['email-validation', 'api'] },
          { name: 'NeverBounce', url: 'https://neverbounce.com', description: 'Email verification API', tags: ['email-validation', 'api'] },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 13. SCRAPING INFRASTRUCTURE & METHODS
  // ═══════════════════════════════════════════════════════════
  {
    id: 'scraping',
    name: 'Scraping Infrastructure & Methods',
    icon: 'Cpu',
    description: 'Tools, frameworks, and services for building automated scraping pipelines — browser automation, HTML parsing, proxy networks, CAPTCHA solving, and data extraction APIs.',
    subcategories: [
      {
        name: 'Browser Automation',
        description: 'Headless browser engines for rendering JavaScript-heavy sites and extracting data from dynamic pages.',
        sources: [
          { name: 'Playwright (Self-Hosted)', url: 'https://playwright.dev', description: 'Our self-hosted cloudbrowser engine — headless Chromium automation', tags: ['browser', 'self-hosted'] },
          { name: 'Puppeteer', url: 'https://pptr.dev', description: 'Node.js headless Chrome automation', tags: ['browser', 'node'] },
          { name: 'Selenium', url: 'https://www.selenium.dev', description: 'Browser automation framework (multi-language)', tags: ['browser', 'java', 'python'] },
          { name: 'Browserbase (Cloud)', url: 'https://www.browserbase.com', description: 'Cloud-hosted headless browser API', tags: ['browser', 'cloud', 'paid'] },
        ]
      },
      {
        name: 'HTML Parsing & Extraction',
        description: 'Libraries and services for parsing HTML and extracting structured data from web pages.',
        sources: [
          { name: 'Cheerio', url: 'https://cheerio.js.org', description: 'Server-side jQuery for HTML parsing (Node.js)', tags: ['parsing', 'node'] },
          { name: 'BeautifulSoup (Python)', url: 'https://www.crummy.com/software/BeautifulSoup', description: 'Python HTML parsing library', tags: ['parsing', 'python'] },
          { name: 'Scrapy (Python)', url: 'https://scrapy.org', description: 'Python web scraping framework', tags: ['scraping', 'python'] },
          { name: 'Import.io', url: 'https://www.import.io', description: 'No-code web data extraction platform', tags: ['extraction', 'no-code', 'paid'] },
          { name: 'Diffbot', url: 'https://www.diffbot.com', description: 'AI-powered web data extraction API', tags: ['extraction', 'ai', 'paid'] },
          { name: 'ScrapingBee', url: 'https://www.scrapingbee.com', description: 'Web scraping API that handles rendering and CAPTCHAs', tags: ['extraction', 'api', 'paid'] },
        ]
      },
      {
        name: 'Proxy Networks',
        description: 'Residential and datacenter proxy services for distributing scraping requests and avoiding IP blocks.',
        sources: [
          { name: 'Bright Data', url: 'https://brightdata.com', description: 'Largest proxy network — residential, datacenter, ISP', tags: ['proxy', 'paid'] },
          { name: 'Smartproxy', url: 'https://smartproxy.com', description: 'Residential and datacenter proxies', tags: ['proxy', 'paid'] },
          { name: 'Oxylabs', url: 'https://oxylabs.io', description: 'Premium proxy and scraping infrastructure', tags: ['proxy', 'paid'] },
          { name: 'ScraperAPI', url: 'https://www.scraperapi.com', description: 'Proxy API with rendering and CAPTCHA handling', tags: ['proxy', 'api', 'paid'] },
          { name: 'Apify Proxy', url: 'https://apify.com/proxy', description: 'Proxy included with Apify scraping platform', tags: ['proxy', 'platform'] },
        ]
      },
      {
        name: 'CAPTCHA Solving',
        description: 'Services for solving CAPTCHAs that block automated scraping.',
        sources: [
          { name: '2Captcha', url: 'https://2captcha.com', description: 'Human-powered CAPTCHA solving service', tags: ['captcha', 'paid'] },
          { name: 'Anti-Captcha', url: 'https://anti-captcha.com', description: 'CAPTCHA solving API', tags: ['captcha', 'paid'] },
          { name: 'CapMonster', url: 'https://capmonster.cloud', description: 'AI-powered CAPTCHA solving', tags: ['captcha', 'ai'] },
        ]
      },
      {
        name: 'Scraping Platforms (No-Code)',
        description: 'Platforms that handle scraping infrastructure — no code required, just configure and extract.',
        sources: [
          { name: 'Apify', url: 'https://apify.com', description: 'Cloud scraping platform with pre-built actors', tags: ['platform', 'no-code', 'paid'] },
          { name: 'ParseHub', url: 'https://www.parsehub.com', description: 'Visual web scraping tool', tags: ['platform', 'no-code', 'paid'] },
          { name: 'Octoparse', url: 'https://www.octoparse.com', description: 'No-code web scraping desktop app', tags: ['platform', 'no-code'] },
          { name: 'Bardeen', url: 'https://bardeen.ai', description: 'Browser automation and scraping extension', tags: ['platform', 'extension'] },
        ]
      },
      {
        name: 'Automation & Orchestration',
        description: 'Tools for orchestrating scraping pipelines, scheduling, and connecting services.',
        sources: [
          { name: 'Zapier', url: 'https://zapier.com', description: 'No-code automation between services', tags: ['automation', 'no-code'] },
          { name: 'Make.com', url: 'https://www.make.com', description: 'Visual automation platform (formerly Integromat)', tags: ['automation', 'no-code'] },
          { name: 'n8n', url: 'https://n8n.io', description: 'Open-source workflow automation (self-hostable)', tags: ['automation', 'open-source'] },
          { name: 'Vercel Cron', url: 'https://vercel.com/docs/cron-jobs', description: 'Serverless cron job scheduling (our orchestrator)', tags: ['scheduling', 'serverless'] },
          { name: 'Railway', url: 'https://railway.app', description: 'Container deployment for scraping workers (our backend)', tags: ['deployment', 'containers'] },
        ]
      },
      {
        name: 'Google APIs (Geocoding & Places)',
        description: 'Google APIs for geocoding addresses, finding nearby businesses, and enriching location data.',
        sources: [
          { name: 'Google Maps Geocoding API', url: 'https://developers.google.com/maps/documentation/geocoding', description: 'Convert addresses to coordinates and vice versa', tags: ['geocoding', 'api', 'paid'] },
          { name: 'Google Places API', url: 'https://developers.google.com/maps/documentation/places', description: 'Find nearby businesses (contractors, agents, etc.)', tags: ['places', 'api', 'paid'] },
          { name: 'Google Maps Distance Matrix', url: 'https://developers.google.com/maps/documentation/distance-matrix', description: 'Calculate distances between properties and amenities', tags: ['distance', 'api', 'paid'] },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 14. PUBLIC NOTICES & LEGAL NOTICES
  // ═══════════════════════════════════════════════════════════
  {
    id: 'public-notices',
    name: 'Public Notices & Legal Notices',
    description: 'Newspapers and online portals that publish legal notices — foreclosure sales, probate filings, tax deed sales, code violation hearings, and estate notices. These are official, public, and free.',
    subcategories: [
      {
        name: 'FL Newspaper Legal Notices',
        description: 'Florida newspapers that publish required legal notices — foreclosure sales, probate, tax deeds, code violations.',
        sources: [
          { name: 'FL Public Notices Portal', url: 'https://www.flpublicnotices.com', description: 'Statewide FL public notice aggregation', tags: ['public-notices', 'statewide'] },
          { name: 'PublicNoticeAds.com', url: 'https://www.publicnoticeads.com/FL', description: 'FL legal notice aggregation', tags: ['public-notices', 'legal'] },
          { name: 'Miami Herald Legal Notices', url: 'https://www.miamiherald.com/legal-notices', description: 'South FL legal notices', tags: ['public-notices', 'miami'] },
          { name: 'Orlando Sentinel Notices', url: 'https://www.orlandosentinel.com/classifieds/legal-notices', description: 'Central FL legal notices', tags: ['public-notices', 'orlando'] },
          { name: 'Tampa Bay Times Notices', url: 'https://www.tampabay.com/legal-notices', description: 'Tampa Bay area legal notices', tags: ['public-notices', 'tampa'] },
          { name: 'News-Press Legal Notices', url: 'https://www.news-press.com/legal-notices', description: 'SW Florida (Fort Myers) legal notices', tags: ['public-notices', 'fort-myers'] },
          { name: 'Jacksonville Legal Notices', url: 'https://www.jacksonville.com/legal-notices', description: 'North FL legal notices', tags: ['public-notices', 'jacksonville'] },
        ]
      },
      {
        name: 'Foreclosure & Tax Sale Notices',
        description: 'Specific legal notice categories for foreclosure and tax deed sales.',
        sources: [
          { name: 'Notice of Sale (Foreclosure)', url: 'https://www.realforeclose.com', description: 'Foreclosure sale notices on RealForeclose', tags: ['foreclosure-notices', 'sales'] },
          { name: 'Tax Deed Sale Notices', url: 'https://floridarevenue.com/taxes/Pages/tax_deed.aspx', description: 'Tax deed sale legal notices by county', tags: ['tax-deed-notices'] },
          { name: 'Lis Pendens Search', url: 'https://officialrecords.flclerks.com', description: 'Lis pendens (pre-foreclosure) filings statewide', tags: ['lis-pendens', 'statewide'] },
        ]
      },
    ]
  },
];

// Compute total source count
export const TOTAL_SOURCES = FLORIDA_SOURCE_CATEGORIES.reduce(
  (total, cat) => total + cat.subcategories.reduce(
    (subTotal, sub) => subTotal + sub.sources.length, 0
  ), 0
);

export const TOTAL_CATEGORIES = FLORIDA_SOURCE_CATEGORIES.length;

export const TOTAL_SUBCATEGORIES = FLORIDA_SOURCE_CATEGORIES.reduce(
  (total, cat) => total + cat.subcategories.length, 0
);