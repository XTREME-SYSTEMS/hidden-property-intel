import React, { useState } from "react";
import {
  AlertTriangle, Eye, Search, MapPin,
  HeartCrack, Scale, DollarSign, Building2, Home, Users, Zap, BookOpen, ExternalLink,
} from "lucide-react";

const DISTRESS_CAUSES = [
  {
    id: "probate",
    icon: HeartCrack,
    title: "Death of Owner (Probate / Inheritance)",
    summary: "The property owner has died. The property goes through probate court and is transferred to heirs or sold to pay estate debts.",
    warningSigns: [
      "Obituary published in local newspaper or Legacy.com",
      "Homestead exemption removed from property tax records",
      "Property tax bills returned undeliverable",
      "Water/utility accounts closed or in deceased's name",
      "Mail piling up at the property",
      "Property maintenance declining (overgrown lawn, peeling paint)",
      "Probate filing at county circuit court",
      "Property listed by an estate executor or probate attorney",
      "Deed transfer to 'Estate of [Name]' or to heirs",
    ],
    whereToLook: [
      { source: "Legacy.com", url: "https://www.legacy.com", how: "Search obituaries by city + date. Obituaries list surviving family = heirs." },
      { source: "County Circuit Court — Probate Division", url: "https://www.flcourts.org", how: "Search probate filings by deceased name. Filings list executor and heirs." },
      { source: "County Property Appraiser", url: "https://www.bcpa.net", how: "Check if homestead exemption was removed — signals owner death or move." },
      { source: "County Tax Collector", url: "https://www.broward.org/tax", how: "Request 'returned mail' list — undeliverable tax bills signal deceased or absent owner." },
      { source: "Local Newspaper Obituaries", url: "https://www.miamiherald.com/obituaries", how: "Daily obituary sections. Search by city and date range." },
      { source: "Funeral Home Websites", url: "https://www.legacy.com/funeral-homes", how: "Local funeral homes post obituaries with service details and survivors." },
    ],
    earlyCalc: "When an obituary is found → cross-reference name with county property appraiser → if they own property → flag as probate lead → search for heirs → begin outreach timeline.",
    timingWindow: "3-12 months from death to probate close. Best contact window: 30-60 days after death, before heirs list with a Realtor.",
  },
  {
    id: "divorce",
    icon: Users,
    title: "Divorce",
    summary: "Owners are divorcing and need to sell the jointly-owned marital home to divide assets. Often need a fast, clean sale.",
    warningSigns: [
      "Divorce filing at county circuit court (family law division)",
      "One spouse moves out (change of mailing address on property appraiser records)",
      "Property listed for sale shortly after divorce filing",
      "Mortgage payments missed (one spouse stops paying)",
      "Lis Pendens filed (divorce-related property disputes)",
      "Property maintenance declining (one spouse left, other can't maintain)",
      "Two names on deed, one name on new mailing address",
      "For Sale by Owner (divorcing couples avoid Realtor commissions)",
      "Property listed below market for fast sale",
    ],
    whereToLook: [
      { source: "County Circuit Court — Family Law Division", url: "https://www.browardclerk.org/family", how: "Search divorce filings by party name. Cross-reference with property records." },
      { source: "County Property Appraiser", url: "https://www.bcpa.net", how: "Check if mailing address changed for one owner — signals separation." },
      { source: "County Clerk — Official Records", url: "https://www.browardclerk.org/official-records", how: "Search for quitclaim deeds between spouses — signals divorce property transfer." },
      { source: "MLS — Expired/Withdrawn Listings", url: "https://www.mls.com", how: "Properties listed during divorce often expire — contact after expiration." },
      { source: "Public Records — Divorce Search", url: "https://www.publicrecords.onlinesearches.com", how: "Directory of county divorce record search pages nationwide." },
    ],
    earlyCalc: "Divorce filing found → check if couple owns property together → flag as divorce lead → wait 60-90 days for emotional settling → contact with cash offer emphasizing speed and simplicity.",
    timingWindow: "30-180 days from filing to need-to-sell. Best contact window: 60-90 days after filing, when reality sets in but before listing.",
  },
  {
    id: "pre-foreclosure",
    icon: AlertTriangle,
    title: "Pre-Foreclosure (Mortgage Default)",
    summary: "Homeowner has missed 1-3 mortgage payments. Lender has filed Notice of Default / Lis Pendens. Property not yet at auction.",
    warningSigns: [
      "Lis Pendens filed at county clerk (public record)",
      "Notice of Default recorded",
      "Mortgage payments 30-90 days late",
      "Homeowner avoiding lender calls",
      "Property taxes also delinquent (compounding distress)",
      "Homeowner listing personal items on Craigslist/Facebook Marketplace",
      "For Sale by Owner signs (trying to sell before foreclosure)",
      "Short sale listing on MLS",
    ],
    whereToLook: [
      { source: "County Clerk of Court — Lis Pendens", url: "https://www.browardclerk.org", how: "Search daily for new Lis Pendens filings. This is the first public foreclosure signal." },
      { source: "Realforeclose.com", url: "https://www.realforeclose.com", how: "Check upcoming auction calendar — properties scheduled are in final pre-foreclosure." },
      { source: "RealtyTrac", url: "https://www.realtytrac.com", how: "Aggregates pre-foreclosure data. Filter by county and filing date." },
      { source: "County Property Appraiser", url: "https://www.bcpa.net", how: "Check mortgage info and equity position. Low equity = better wholesale opportunity." },
      { source: "PropStream", url: "https://www.propstream.com", how: "Filter for pre-foreclosure status + mortgage balance + equity." },
    ],
    earlyCalc: "Lis Pendens filed → check mortgage balance vs. property value → if equity exists → contact owner with cash offer → if underwater → pursue short sale.",
    timingWindow: "30-120 days from Lis Pendens to auction. Best contact: within 48 hours of filing — before the owner gets overwhelmed.",
  },
  {
    id: "tax-delinquent",
    icon: DollarSign,
    title: "Tax Delinquency",
    summary: "Property owner has not paid property taxes. After 2+ years of delinquency, the property is subject to tax lien sale or tax deed sale.",
    warningSigns: [
      "Property taxes delinquent 1+ years",
      "Tax lien certificate sold at county auction",
      "Tax deed sale scheduled (published in local newspaper)",
      "Property tax bills returned undeliverable",
      "Homestead exemption removed (owner moved or died)",
      "Multiple years of unpaid taxes",
      "Code violations also present (compounding distress)",
    ],
    whereToLook: [
      { source: "County Tax Collector", url: "https://www.broward.org/tax", how: "Request delinquent tax list. Check for tax deed sale calendar." },
      { source: "FL Tax Lien Auction (LienHub)", url: "https://www.lienhub.com", how: "View sold tax lien certificates. Properties with liens are in distress." },
      { source: "TaxSale.com", url: "https://www.taxsale.com", how: "Aggregates tax sale data across states. Filter by county." },
      { source: "County Property Appraiser", url: "https://www.bcpa.net", how: "Check tax status on any property. Homestead removal = red flag." },
      { source: "Local Newspaper Legal Notices", url: "https://www.miamiherald.com", how: "Tax deed sale notices are published in local newspapers 4+ weeks before sale." },
    ],
    earlyCalc: "Tax delinquent 2+ years → check if tax lien sold → if lienholder is pursuing tax deed → contact owner before deed sale → offer to buy and cure taxes.",
    timingWindow: "2+ years delinquent → tax lien sale → 2-year redemption → tax deed sale. Best contact: before lien sale or during redemption period.",
  },
  {
    id: "code-violations",
    icon: Building2,
    title: "Code Violations",
    summary: "Property has outstanding code violations (unpermitted work, blight, safety hazards). Owner faces daily fines and escalating liens.",
    warningSigns: [
      "Code violation case opened at county/city code enforcement",
      "Daily fines accruing ($250-$1000/day in some jurisdictions)",
      "Boarded-up windows or doors",
      "Overgrown vegetation, trash accumulation",
      "Unpermitted construction or additions",
      "Safety hazards (roof damage, structural issues)",
      "Water/utility shut-off",
      "Property abandoned by owner",
    ],
    whereToLook: [
      { source: "County/City Code Enforcement", url: "https://www.broward.org/code", how: "Request open code violation cases. Search by address or owner name." },
      { source: "County Property Appraiser", url: "https://www.bcpa.net", how: "Check for recorded code liens on the property." },
      { source: "City 311 / Code Complaint Portal", url: "https://www.miamidade.gov/code-enforcement", how: "Many cities have online complaint portals — check for complaints on specific properties." },
      { source: "Driving for Dollars", url: "https://www.dealmachine.com", how: "Drive neighborhoods looking for visible code violations: boarded windows, overgrown lawns, trash." },
    ],
    earlyCalc: "Code violation filed → check fine amount and daily rate → calculate how long before fines exceed equity → contact owner BEFORE lien is recorded → offer to buy and cure violation.",
    timingWindow: "Fines accrue daily. Best contact: immediately after violation is filed, before fines consume equity.",
  },
  {
    id: "bankruptcy",
    icon: Scale,
    title: "Bankruptcy",
    summary: "Owner has filed for bankruptcy (Chapter 7 or 13). Property may be sold as part of bankruptcy proceedings by the trustee.",
    warningSigns: [
      "Bankruptcy filing in federal court (Chapter 7 or 13)",
      "Automatic stay on foreclosure proceedings",
      "Trustee sale scheduled",
      "Property listed in bankruptcy estate schedules",
      "Mortgage payments missed before filing",
      "Owner attempting loan modification",
    ],
    whereToLook: [
      { source: "PACER (Federal Court Records)", url: "https://pacer.uscourts.gov", how: "Search federal bankruptcy court filings by name. Requires free account." },
      { source: "County Clerk — Lis Pendens", url: "https://www.browardclerk.org", how: "Foreclosure filings often precede bankruptcy — check both." },
      { source: "Bankruptcy Trustee Notifications", url: "https://www.justice.gov/ust", how: "Trustee sales are published. Check the US Trustee program website." },
    ],
    earlyCalc: "Bankruptcy filed → check if property is in the estate → if trustee is selling → contact trustee with offer → court approval required.",
    timingWindow: "60-180 days. Chapter 7 is faster (liquidation). Chapter 13 is slower (reorganization). Best contact: after filing, before trustee sale.",
  },
  {
    id: "absentee-owner",
    icon: Home,
    title: "Absentee Owner / Tired Landlord",
    summary: "Owner doesn't live at the property. May be a tired landlord, inherited the property, or moved and couldn't sell.",
    warningSigns: [
      "Mailing address differs from property address (county records)",
      "Property is a rental with high tenant turnover",
      "Recent eviction filing at county court",
      "Property maintenance declining (landlord not maintaining)",
      "Out-of-state owner (mailing address in different state)",
      "Owner is elderly (may need to liquidate)",
      "Multiple properties owned by same person (portfolio fatigue)",
    ],
    whereToLook: [
      { source: "County Property Appraiser", url: "https://www.bcpa.net", how: "Filter by 'mailing address ≠ property address'. This is the absentee owner filter." },
      { source: "County Clerk — Eviction Records", url: "https://www.browardclerk.org", how: "Search eviction filings — landlords who just evicted are motivated to sell." },
      { source: "ListSource (CoreLogic)", url: "https://www.listsource.com", how: "Build absentee owner mailing lists. Filter by property type and ownership length." },
      { source: "PropStream", url: "https://www.propstream.com", how: "Filter for absentee owners + mortgage balance + equity position." },
    ],
    earlyCalc: "Absentee owner identified → check how long they've owned → if 10+ years, high equity → check for evictions or code violations → contact with cash offer.",
    timingWindow: "No fixed timeline — these are evergreen leads. Best contact: after a triggering event (eviction, code violation, tax delinquency).",
  },
  {
    id: "vacant",
    icon: Eye,
    title: "Vacant Properties",
    summary: "Property is unoccupied — owner died, moved, was incarcerated, or abandoned it. Vacant properties deteriorate and attract crime.",
    warningSigns: [
      "No lights at night (drive by after dark)",
      "Mail piling up",
      "Overgrown lawn / unkept landscaping",
      "Boarded windows or doors",
      "Water shut-off (request from utility)",
      "Code violations for blight",
      "No trash pickup (check with waste management)",
      "Property taxes delinquent",
      "Utility accounts in deceased person's name",
    ],
    whereToLook: [
      { source: "Water Utility — Shut-Off Records", url: "https://www.broward.org/water", how: "Request water shut-off records. 6+ months off = likely vacant." },
      { source: "USPS — Vacant Property Indicator", url: "https://www.usps.com", how: "Mail carriers flag vacant properties. Request via post office." },
      { source: "County Property Appraiser", url: "https://www.bcpa.net", how: "Check homestead status — removed homestead = likely vacant." },
      { source: "Driving for Dollars", url: "https://www.dealmachine.com", how: "Drive neighborhoods. Look for the physical signs of vacancy." },
      { source: "Code Enforcement — Vacant Registry", url: "https://www.miamidade.gov/code-enforcement", how: "Many cities require vacant properties to be registered. Check the registry." },
    ],
    earlyCalc: "Vacant property identified → skip trace owner → check for compounding distress (tax, code, utility) → contact with cash offer emphasizing 'as-is, no clean-out'.",
    timingWindow: "The longer vacant, the more motivated. 6+ months vacant = high motivation. 2+ years = extreme motivation.",
  },
  {
    id: "short-sale",
    icon: DollarSign,
    title: "Short Sale (Underwater Mortgage)",
    summary: "Owner owes more than the property is worth. Lender agrees to accept less than the full balance. Requires lender approval.",
    warningSigns: [
      "Property value below mortgage balance (check property appraiser vs. mortgage records)",
      "Pre-foreclosure / Lis Pendens filed",
      "Short sale listed on MLS",
      "Owner experiencing financial hardship (job loss, medical)",
      "Property listed below mortgage payoff amount",
      "Lender has initiated loss mitigation process",
    ],
    whereToLook: [
      { source: "MLS — Short Sale Filter", url: "https://www.mls.com", how: "Filter MLS listings for 'short sale' status. Requires Realtor access." },
      { source: "County Clerk — Lis Pendens", url: "https://www.browardclerk.org", how: "Pre-foreclosures are often short sale candidates." },
      { source: "County Property Appraiser", url: "https://www.bcpa.net", how: "Compare estimated value to mortgage balance (from clerk records)." },
      { source: "PropStream", url: "https://www.propstream.com", how: "Filter for properties with mortgage balance > estimated value." },
    ],
    earlyCalc: "Property value < mortgage balance → flag as short sale candidate → contact owner → offer to facilitate short sale → lender approval takes 30-90 days.",
    timingWindow: "30-90 days for lender approval. Best contact: at pre-foreclosure stage, before the owner lists with a Realtor.",
  },
];

export default function AdminDistressEducation() {
  const [activeCause, setActiveCause] = useState("probate");

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-[#c38a1b]" />
        <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Distress Education</p>
      </div>
      <h1 className="mt-2 font-display text-3xl font-light tracking-tight">Every Cause of Property Distress</h1>
      <p className="mt-2 max-w-3xl text-sm text-black/50">
        An exhaustive education on every situation that causes a property to become distressed — the warning signs,
        where to find the data, and how to calculate early intervention opportunities. Use this to build early-warning
        systems that identify distressed properties before anyone else.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {DISTRESS_CAUSES.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCause(c.id)}
            className={`inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-[11px] font-medium transition ${
              activeCause === c.id ? "border-black bg-black text-white" : "border-black/15 text-black/60 hover:bg-black/5"
            }`}
          >
            <c.icon className="h-3.5 w-3.5" />
            {c.title}
          </button>
        ))}
      </div>

      {DISTRESS_CAUSES.filter((c) => c.id === activeCause).map((c) => (
        <div key={c.id} className="mt-8 space-y-6">
          <div className="rounded-sm border border-black/10 bg-white p-6">
            <div className="flex items-center gap-3">
              <c.icon className="h-6 w-6 text-[#c38a1b]" />
              <h2 className="font-display text-2xl font-light tracking-tight">{c.title}</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-black/60">{c.summary}</p>
            <div className="mt-4 rounded-sm bg-black/5 p-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Timing Window</p>
              <p className="mt-1 text-sm text-black/70">{c.timingWindow}</p>
            </div>
          </div>

          <div className="rounded-sm border border-black/10 bg-white p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="font-display text-lg font-light">Warning Signs</h3>
            </div>
            <div className="mt-4 space-y-2">
              {c.warningSigns.map((sign, i) => (
                <div key={i} className="flex items-start gap-3 rounded-sm border border-black/5 p-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <p className="text-sm text-black/70">{sign}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-sm border border-black/10 bg-white p-6">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-black/70" />
              <h3 className="font-display text-lg font-light">Where to Find the Data</h3>
            </div>
            <div className="mt-4 space-y-3">
              {c.whereToLook.map((src, i) => (
                <div key={i} className="rounded-sm border border-black/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#c38a1b]" />
                      <a href={src.url} target="_blank" rel="noreferrer" className="font-medium text-black hover:underline">
                        {src.source}
                      </a>
                    </div>
                    <a href={src.url} target="_blank" rel="noreferrer" className="text-black/40 hover:text-black">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <p className="mt-2 text-sm text-black/60">{src.how}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-sm border border-[#c38a1b]/30 bg-amber-50 p-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#c38a1b]" />
              <h3 className="font-display text-lg font-light">Early Calculation Strategy</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-amber-900">{c.earlyCalc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}