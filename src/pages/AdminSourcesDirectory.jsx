import React, { useState } from "react";
import {
  Database, Globe, Search, ExternalLink,
  Building2, FileText, Users, Landmark, Scale, Home, DollarSign, AlertTriangle,
} from "lucide-react";

const SOURCE_CATEGORIES = [
  { id: "foreclosure", icon: AlertTriangle, label: "Foreclosure & Pre-Foreclosure" },
  { id: "probate", icon: Scale, label: "Probate & Obituaries" },
  { id: "tax", icon: DollarSign, label: "Tax Delinquent & Tax Sales" },
  { id: "code", icon: Building2, label: "Code Violations" },
  { id: "county", icon: Landmark, label: "County Property Appraiser" },
  { id: "divorce", icon: Users, label: "Divorce & Court Records" },
  { id: "aggregators", icon: Database, label: "Data Aggregators" },
  { id: "land", icon: Home, label: "Land & Vacant Property" },
  { id: "investor", icon: Search, label: "Investor & Buyer Sources" },
];

const SOURCES = {
  foreclosure: [
    { name: "Realforeclose.com", url: "https://www.realforeclose.com", coverage: "All 67 FL counties", type: "Foreclosure auction calendar + results", access: "Free, public", notes: "FL's official foreclosure auction site. WAF blocks datacenter IPs — use stealth/proxy." },
    { name: "Auction.com", url: "https://www.auction.com", coverage: "Nationwide", type: "REO + foreclosure auctions", access: "Free to browse, registration to bid", notes: "Largest online REO auction platform. Bank-owned inventory." },
    { name: "HUD Home Store", url: "https://www.hudhomestore.com", coverage: "Nationwide", type: "HUD-owned foreclosures", access: "Free, public", notes: "FHA foreclosures. Bidding through HUD-registered brokers." },
    { name: "Fannie Mae HomePath", url: "https://www.homepath.com", coverage: "Nationwide", type: "Fannie Mae REO", access: "Free, public", notes: "Fannie Mae-owned foreclosures. First Look period for owner-occupants." },
    { name: "Freddie Mac HomeSteps", url: "https://www.homesteps.com", coverage: "Nationwide", type: "Freddie Mac REO", access: "Free, public", notes: "Freddie Mac-owned foreclosures." },
    { name: "County Clerk of Court — Lis Pendens", url: "https://www.browardclerk.org", coverage: "Per county", type: "Pre-foreclosure filings (Lis Pendens)", access: "Free online search (most FL counties)", notes: "Lis Pendens = the first public sign of foreclosure. Search daily." },
    { name: "RealtyTrac", url: "https://www.realtytrac.com", coverage: "Nationwide", type: "Foreclosure data aggregator", access: "Paid subscription", notes: "Pre-foreclosure, auction, and REO data. Good for filtering." },
    { name: "Foreclosure.com", url: "https://www.foreclosure.com", coverage: "Nationwide", type: "Foreclosure listings", access: "Paid subscription", notes: "Aggregates foreclosure data from multiple sources." },
  ],
  probate: [
    { name: "Legacy.com", url: "https://www.legacy.com", coverage: "Nationwide", type: "Obituary aggregator", access: "Free, public", notes: "Largest obituary database. Search by name + city. Lists survivors = heirs." },
    { name: "Tributes.com", url: "https://www.tributes.com", coverage: "Nationwide", type: "Obituary aggregator", access: "Free, public", notes: "Alternative to Legacy.com. Search by location and date." },
    { name: "County Circuit Court — Probate Division", url: "https://www.flcourts.org", coverage: "Per county", type: "Probate filings, executors, heirs", access: "Free online search (most FL counties)", notes: "Search by deceased name. Filings list executor + heirs at law." },
    { name: "Newspapers.com", url: "https://www.newspapers.com", coverage: "Historical", type: "Historical newspaper obituaries", access: "Paid subscription", notes: "Useful for older deaths. Search local FL newspapers." },
    { name: "Florida Death Records (VitalChek)", url: "https://www.vitalchek.com", coverage: "FL statewide", type: "Death certificates", access: "Paid, restricted access", notes: "Official FL death records. Restricted to family/legal interest." },
    { name: "Funeral Home Websites", url: "https://www.legacy.com/funeral-homes", coverage: "Local", type: "Obituaries + service info", access: "Free, public", notes: "Local funeral homes post obituaries. Often list surviving family." },
    { name: "Local Newspaper Obituaries", url: "https://www.miamiherald.com/obituaries", coverage: "Regional", type: "Newspaper obituaries", access: "Free, public", notes: "Miami Herald, Orlando Sentinel, Tampa Bay Times, etc. Published daily." },
    { name: "Florida Bar — Probate Section", url: "https://www.floridabar.org", coverage: "FL statewide", type: "Probate attorney directory", access: "Free, public", notes: "Find probate attorneys to network with for referrals." },
  ],
  tax: [
    { name: "County Tax Collector — Tax Deed Sales", url: "https://www.taxdeedflorida.com", coverage: "Per county", type: "Tax deed auction calendar", access: "Free, public", notes: "Properties sold for back taxes. Each FL county tax collector posts sales." },
    { name: "FL Tax Lien Auction (LienHub)", url: "https://www.lienhub.com", coverage: "FL statewide", type: "Tax lien certificate auctions", access: "Free to browse, registration to bid", notes: "FL pays 18% annual interest on tax liens. 2-year redemption period." },
    { name: "County Tax Collector — Delinquent Tax List", url: "https://www.broward.org/tax", coverage: "Per county", type: "Delinquent property tax list", access: "Public records request", notes: "Request the delinquent tax list from each county tax collector." },
    { name: "TaxSale.com", url: "https://www.taxsale.com", coverage: "Nationwide", type: "Tax sale aggregator", access: "Paid subscription", notes: "Aggregates tax sale data across states." },
    { name: "RealtyTrac Tax Data", url: "https://www.realtytrac.com", coverage: "Nationwide", type: "Tax delinquent properties", access: "Paid subscription", notes: "Filter for tax delinquent status." },
  ],
  code: [
    { name: "County Code Enforcement", url: "https://www.broward.org/code", coverage: "Per county/city", type: "Code violation records", access: "Public records request", notes: "Each county/city code enforcement division maintains violation records." },
    { name: "City Code Enforcement", url: "https://www.miamidade.gov/code-enforcement", coverage: "Per city", type: "Code violation cases + liens", access: "Free online search (most cities)", notes: "Search by address or owner name. Violations = motivated sellers." },
    { name: "County Property Appraiser — Code Lien Check", url: "https://www.bcpa.net", coverage: "Per county", type: "Code liens on property", access: "Free, public", notes: "Check property appraiser records for recorded code liens." },
  ],
  county: [
    { name: "Broward County Property Appraiser", url: "https://www.bcpa.net", coverage: "Broward County, FL", type: "Property records, owner info, values", access: "Free, public", notes: "Search by address, owner name, or parcel number. Includes ownership history." },
    { name: "Miami-Dade Property Appraiser", url: "https://www.miamidade.gov/propertysearch", coverage: "Miami-Dade County, FL", type: "Property records, owner info, values", access: "Free, public", notes: "Comprehensive property search with GIS maps." },
    { name: "Palm Beach Property Appraiser", url: "https://www.pbcgov.org/papa", coverage: "Palm Beach County, FL", type: "Property records, owner info, values", access: "Free, public", notes: "Search by address, name, or parcel. Includes sales history." },
    { name: "Orange County Property Appraiser", url: "https://www.ocpafl.org", coverage: "Orange County, FL (Orlando)", type: "Property records, owner info, values", access: "Free, public", notes: "Orlando-area property records." },
    { name: "Hillsborough County Property Appraiser", url: "https://www.hcpafl.org", coverage: "Hillsborough County, FL (Tampa)", type: "Property records, owner info, values", access: "Free, public", notes: "Tampa-area property records." },
    { name: "Duval County Property Appraiser", url: "https://www.coj.net/property-appraiser", coverage: "Duval County, FL (Jacksonville)", type: "Property records, owner info, values", access: "Free, public", notes: "Jacksonville-area property records." },
    { name: "Lee County Property Appraiser", url: "https://www.leepa.org", coverage: "Lee County, FL (Fort Myers)", type: "Property records, owner info, values", access: "Free, public", notes: "Fort Myers / Cape Coral area." },
    { name: "Pinellas County Property Appraiser", url: "https://www.pcpao.org", coverage: "Pinellas County, FL (St. Pete)", type: "Property records, owner info, values", access: "Free, public", notes: "St. Petersburg / Clearwater area." },
    { name: "Florida Sunbiz (Division of Corporations)", url: "https://dos.fl.gov/sunbiz", coverage: "FL statewide", type: "LLC/corporation ownership lookup", access: "Free, public", notes: "Search by entity name to find registered agent and officers. Essential for LLC-owned properties." },
    { name: "County Clerk of Court — Official Records", url: "https://www.browardclerk.org/official-records", coverage: "Per county", type: "Deeds, mortgages, liens", access: "Free online search (most FL counties)", notes: "Search by name to find all recorded documents for a person." },
  ],
  divorce: [
    { name: "County Circuit Court — Family Law Division", url: "https://www.browardclerk.org/family", coverage: "Per county", type: "Divorce filings", access: "Free online search (most FL counties)", notes: "Divorce filings are public record. Search by party name." },
    { name: "Florida Courts — Family Law Forms", url: "https://www.flcourts.gov/family-law-forms", coverage: "FL statewide", type: "Divorce petition forms + filing info", access: "Free, public", notes: "Understand the divorce process and timeline to predict when sale is needed." },
    { name: "Public Records Search — Divorce", url: "https://www.publicrecords.onlinesearches.com", coverage: "Nationwide", type: "Divorce record search directory", access: "Free, public", notes: "Directory of county divorce record search pages." },
  ],
  aggregators: [
    { name: "PropStream", url: "https://www.propstream.com", coverage: "Nationwide", type: "Full property data + skip tracing", access: "$99/mo", notes: "150M+ liens, 41M pre-foreclosures, 165 filters. Industry standard." },
    { name: "DealMachine", url: "https://www.dealmachine.com", coverage: "Nationwide", type: "D4$ app + skip tracing + CRM", access: "$99+/mo", notes: "Mobile-first. Driving for dollars with auto-skip-trace." },
    { name: "PropertyRadar", url: "https://www.propertyradar.com", coverage: "Western US + FL", type: "List-stacking + distressed data", access: "$249/mo", notes: "Cross-reference multiple distress lists." },
    { name: "ATTOM Data", url: "https://www.attomdata.com", coverage: "Nationwide", type: "Enterprise property data API", access: "Enterprise pricing", notes: "Foreclosure timelines, propensity-to-default scoring." },
    { name: "BatchData", url: "https://www.batchdata.io", coverage: "Nationwide", type: "Skip tracing + property data", access: "Tiered pricing", notes: "99.99% uptime, daily freshness checks." },
    { name: "DealCheck", url: "https://www.dealcheck.io", coverage: "Nationwide", type: "Deal analysis + property data", access: "Free-$49/mo", notes: "Fast deal analysis from public records." },
    { name: "PropertyOnion", url: "https://www.propertyonion.com", coverage: "FL focused", type: "FL foreclosure + tax deed calendar", access: "Free/Freemium", notes: "FL county auction schedules and property data." },
    { name: "ListSource (CoreLogic)", url: "https://www.listsource.com", coverage: "Nationwide", type: "Mailing lists + property data", access: "Pay per list", notes: "Build custom lists: absentee owners, pre-foreclosures, etc." },
  ],
  land: [
    { name: "Land.com", url: "https://www.land.com", coverage: "Nationwide", type: "Land for sale listings", access: "Free to browse", notes: "Largest land listing site. Search by county, acreage, price." },
    { name: "LandFlip", url: "https://www.landflip.com", coverage: "Nationwide", type: "Land for sale listings", access: "Free to browse", notes: "Alternative to Land.com. Good for rural land." },
    { name: "LandWatch", url: "https://www.landwatch.com", coverage: "Nationwide", type: "Land for sale listings", access: "Free to browse", notes: "Part of Land.com network. Good for filtering." },
    { name: "County Property Appraiser — Vacant Land", url: "https://www.bcpa.net", coverage: "Per county", type: "Vacant parcel records", access: "Free, public", notes: "Filter property appraiser records by property type = vacant land." },
    { name: "Craigslist Land Section", url: "https://www.craigslist.org", coverage: "Local", type: "FSBO land listings", access: "Free, public", notes: "Owner-financed land deals. Filter for 'owner financing'." },
    { name: "Farms.com", url: "https://www.farms.com", coverage: "Nationwide", type: "Agricultural land for sale", access: "Free to browse", notes: "Farm and ranch land listings." },
  ],
  investor: [
    { name: "BiggerPockets Forums", url: "https://www.biggerpockets.com/forums", coverage: "Nationwide", type: "Investor community + deal networking", access: "Free, public", notes: "Find cash buyers, partners, and wholesalers in your market." },
    { name: "Facebook Real Estate Groups", url: "https://www.facebook.com/groups", coverage: "Local", type: "Local investor groups", access: "Free, public", notes: "Search 'Florida real estate investors' or '[city] REIA'. Post your deals." },
    { name: "Local REIA Meetings", url: "https://nationalreia.org", coverage: "Nationwide", type: "Real Estate Investor Association meetings", access: "Membership fee", notes: "Attend local REIA meetings to network with buyers and wholesalers." },
    { name: "LinkedIn Real Estate", url: "https://www.linkedin.com", coverage: "Nationwide", type: "Professional networking", access: "Free, public", notes: "Search 'real estate investor [city]' to find and connect with buyers." },
    { name: "MLS — Cash Buyer Search", url: "https://www.mls.com", coverage: "Local", type: "Recent cash sales data", access: "Realtor access", notes: "Search MLS for recent cash sales to identify active cash buyers." },
    { name: "County Clerk — Warranty Deeds", url: "https://www.browardclerk.org/official-records", coverage: "Per county", type: "Recent deed recordings", access: "Free, public", notes: "Search recent warranty deeds to find active cash buyers (LLC buyers)." },
  ],
};

export default function AdminSourcesDirectory() {
  const [activeCategory, setActiveCategory] = useState("foreclosure");
  const [search, setSearch] = useState("");

  const filtered = SOURCES[activeCategory]?.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.coverage.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-[#c38a1b]" />
        <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Sources Directory</p>
      </div>
      <h1 className="mt-2 font-display text-3xl font-light tracking-tight">Every Source for Distressed Property Data</h1>
      <p className="mt-2 max-w-3xl text-sm text-black/50">
        A categorized directory of every online source for finding distressed properties, owners, investors, and sellers —
        across every state, county, and city. Use these to build your data pipeline and find deals before anyone else.
      </p>

      <div className="mt-6 flex items-center gap-3 rounded-sm border border-black/15 px-4">
        <Search className="h-4 w-4 text-black/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sources by name or coverage area..." className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-black/40" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SOURCE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-[11px] font-medium transition ${
              activeCategory === c.id ? "border-black bg-black text-white" : "border-black/15 text-black/60 hover:bg-black/5"
            }`}
          >
            <c.icon className="h-3.5 w-3.5" />
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/15 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
              <th className="pb-3 pr-4">Source</th>
              <th className="pb-3 pr-4">Coverage</th>
              <th className="pb-3 pr-4">Data Type</th>
              <th className="pb-3 pr-4">Access</th>
              <th className="pb-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {filtered.map((s, i) => (
              <tr key={i} className="align-top">
                <td className="py-3 pr-4">
                  <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-black hover:underline">
                    {s.name} <ExternalLink className="h-3 w-3 text-black/40" />
                  </a>
                </td>
                <td className="py-3 pr-4 text-black/60">{s.coverage}</td>
                <td className="py-3 pr-4 text-black/70">{s.type}</td>
                <td className="py-3 pr-4 text-black/60">{s.access}</td>
                <td className="py-3 text-black/60">{s.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}