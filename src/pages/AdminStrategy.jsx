import React, { useState } from "react";
import {
  Target, TrendingUp, Users, Home, DollarSign, Mail, Phone, MapPin, Zap,
  Search, Brain, Handshake, Building2, Landmark, TreePine, Calculator,
  ChevronDown, ChevronUp, Lightbulb, Award, Eye, Key,
} from "lucide-react";

const STRATEGY_CATEGORIES = [
  { id: "acquisition", icon: Search, label: "Acquisition Strategies" },
  { id: "finding-owners", icon: Users, label: "Finding Owners" },
  { id: "negotiation", icon: Handshake, label: "Negotiation Strategies" },
  { id: "pricing", icon: DollarSign, label: "Pricing Strategies" },
  { id: "outreach", icon: Mail, label: "Outreach Strategies" },
  { id: "investor", icon: TrendingUp, label: "Investor Strategies" },
  { id: "land", icon: TreePine, label: "Land Strategies" },
  { id: "exit", icon: Zap, label: "Exit Strategies" },
];

const STRATEGIES = {
  acquisition: [
    { name: "Pre-Foreclosure Direct-to-Owner", desc: "Contact homeowners the moment a Lis Pendens is filed — before the property hits auction. These owners have 30-120 days and are highly motivated.", best: "Wholesale, fix-and-flip", risk: "Medium", key: "Monitor county clerk Lis Pendens filings daily. Contact within 48 hours of filing." },
    { name: "Tax Deed Sale Acquisition", desc: "Buy properties at county tax deed sales for the amount of back taxes owed. Florida sells tax deeds after 2+ years of delinquency.", best: "Buy-and-hold, flip", risk: "High (no inspection, title issues)", key: "Research title liens BEFORE bidding. Attend tax deed sales in person." },
    { name: "Probate Court Outreach", desc: "Contact executors and heirs of estates with real property. Properties often need work and heirs want fast cash.", best: "Wholesale, fix-and-flip", risk: "Low-Medium", key: "File probate record requests at circuit court. Contact executor listed on filings." },
    { name: "Code Violation List Farming", desc: "Pull code violation lists from county code enforcement. Owners face daily fines and are motivated to sell before liens escalate.", best: "Fix-and-flip, BRRRR", risk: "Low", key: "Visit the property first — code violations often mean serious deferred maintenance." },
    { name: "Driving for Dollars (D4$)", desc: "Drive neighborhoods looking for distressed properties: overgrown lawns, boarded windows, mail piling up, faded for-sale signs.", best: "Wholesale", risk: "Low", key: "Use the DealMachine or PropertyIntel mobile app to tag properties with GPS." },
    { name: "Expired Listing Outreach", desc: "Contact sellers whose MLS listings expired. They wanted to sell, couldn't, and are now open to alternative offers.", best: "Wholesale, fix-and-flip", risk: "Low", key: "Get expired listings from MLS or a Realtor partner. Contact within 7 days of expiration." },
    { name: "Absentee Owner Farming", desc: "Target properties where the owner's mailing address differs from the property address — they're landlords or inherited and may want out.", best: "Buy-and-hold, wholesale", risk: "Low", key: "Filter county property appraiser records by 'mailing address ≠ property address'." },
    { name: "REO Bulk Purchase", desc: "Buy multiple bank-owned properties as a portfolio at 50-70% of market value. Requires significant capital.", best: "Institutional buy-and-hold", risk: "Medium", key: "Build relationships with REO asset managers at banks. Present proof of funds." },
    { name: "Short Sale Negotiation", desc: "Work with homeowners who owe more than their property is worth. Negotiate with the lender to accept less than the full balance.", best: "Buy-and-hold, fix-and-flip", risk: "Medium (lender approval takes 30-90 days)", key: "Get a hardship letter from the seller. Submit complete short sale package to lender." },
    { name: "Auction.com / Foreclosure Auction", desc: "Bid on foreclosure auctions online or at the courthouse. Cash/certified funds required, no inspections.", best: "Fix-and-flip", risk: "High (no inspection, no contingencies)", key: "Run title search BEFORE bidding. Have certified funds ready. Set a hard max bid." },
  ],
  "finding-owners": [
    { name: "Skip Tracing Services", desc: "Use TLO, IRBsearch, or TruePeopleSearch to find phone numbers and addresses for property owners.", best: "All strategies", risk: "Low", key: "TLO and IRBsearch require licensing. TruePeopleSearch is free but less accurate." },
    { name: "County Property Appraiser Lookup", desc: "Search the county property appraiser website by address to get the owner's name and mailing address.", best: "All strategies", risk: "Low", key: "Every FL county has a free property appraiser site. Search by address, name, or parcel number." },
    { name: "Probate Court Record Search", desc: "Search probate court records by deceased person's name to find the executor and heirs.", best: "Probate", risk: "Low", key: "Most FL counties have online probate record search. Some require in-person visit." },
    { name: "Social Media Investigation", desc: "Search Facebook, LinkedIn, and Instagram for the owner's name + city to find them and their relatives.", best: "All strategies", risk: "Low", key: "Facebook search by name + city. Look at friends lists for family members." },
    { name: "Obituary Cross-Reference", desc: "Search legacy.com and local newspapers for obituaries, then cross-reference with property records.", best: "Probate", risk: "Low", key: "Obituaries list survivors — these are your heirs. Note spouse, children, siblings." },
    { name: "LLC/Entity Unmasking", desc: "When a property is owned by an LLC, use Sunbiz.org (FL Division of Corporations) to find the registered agent and members.", best: "All strategies", risk: "Low", key: "Search Sunbiz.org by LLC name. The registered agent often knows the principals." },
    { name: "Neighbor Door-Knocking", desc: "Ask neighbors about the property owner — they often know if the owner died, moved, or is in trouble.", best: "D4$, absentee owners", risk: "Low", key: "Be honest: 'I'm looking to buy the property at X. Do you know the owner?'" },
    { name: "Mail Forwarding Check", desc: "If mail is piling up at the property, the owner may have moved or died. Check with the post office.", best: "Absentee owners, probate", risk: "Low", key: "Look for mail piling up, overgrown lawn, no lights at night — signs of vacancy." },
  ],
  negotiation: [
    { name: "The 'We Buy Houses' Cash Offer", desc: "Offer all cash, close in 7-14 days, no contingencies. Speed and certainty are your leverage.", best: "All distressed", risk: "Low", key: "Emphasize: no repairs, no clean-out, no commissions, no waiting. Cash = certainty." },
    { name: "Subject-To (Sub-To)", desc: "Take over the seller's existing mortgage payments. You get the deed, they keep the loan in their name.", best: "Pre-foreclosure, divorce", risk: "Medium (due-on-sale clause)", key: "Use a land trust to obscure the transfer. Get title insurance. Document everything." },
    { name: "Seller Financing / Owner Carry", desc: "Seller finances the purchase. You make payments to them. No bank needed.", best: "Free-and-clear properties", risk: "Low", key: "Offer above asking price in exchange for seller financing terms. Win-win." },
    { name: "Lease Option (Rent-to-Own)", desc: "Lease the property with an option to buy at a set price later. Control without ownership.", best: "Tired landlords, expired listings", risk: "Low", key: "Get an option fee credited toward purchase. Record the option." },
    { name: "Wholesale Assignment", desc: "Contract the property below market, then assign the contract to an end buyer for a fee.", best: "All distressed", risk: "Low", key: "Never market the property — market your contract interest. Use assignment addendum." },
    { name: "Double Close (Simultaneous Close)", desc: "Buy the property and sell it to an end buyer on the same day. Eliminates assignment risk.", best: "Wholesale with large spreads", risk: "Low", key: "Use transactional funding for the A→B close. End buyer funds B→C." },
    { name: "Equity Split / Partnership", desc: "Partner with the seller: they contribute the property, you contribute the rehab and management.", best: "Probate, tired landlords", risk: "Medium", key: "Define exit and profit split in writing BEFORE starting. Use an operating agreement." },
    { name: "The 'Take Over Payments' Pitch", desc: "For pre-foreclosure: 'I'll take over your mortgage payments and save your credit.'", best: "Pre-foreclosure", risk: "Medium", key: "Get the deed, not just a promise. Record it. Make payments directly to lender." },
  ],
  pricing: [
    { name: "The 70% Rule", desc: "Max Offer = (ARV × 0.70) − Repair Costs. The golden rule of fix-and-flip.", best: "Fix-and-flip", risk: "Low", key: "Use 75% for BRRRR, 80% for buy-and-hold in appreciating markets." },
    { name: "ARV from Comparable Sales", desc: "Average 3-5 comparable sold properties within 0.5 miles, sold in last 6 months, similar size.", best: "All strategies", risk: "Low", key: "Adjust for differences: $100/sqft for size, $10K per bedroom, $5K per bathroom." },
    { name: "Wholesale Fee Targeting", desc: "Target $10K-$20K assignment fee in South FL, $5K-$10K in North FL. Build fee into your offer.", best: "Wholesale", risk: "Low", key: "Your offer = (ARV × 0.70) − repairs − your fee. End buyer still gets a deal." },
    { name: "Cost-Minus Pricing for Distressed", desc: "Start with the seller's situation, not the property value. What do they need to walk away?", best: "Probate, divorce, pre-foreclosure", risk: "Low", key: "Ask: 'What would make this go away today?' Sometimes it's less than you think." },
    { name: "Momentum Pricing (Auction)", desc: "Set a hard max bid before the auction. Don't get caught in bidding fever.", best: "Auction", risk: "High", key: "Calculate max bid = (ARV × 0.65) − estimated repairs − $10K buffer. Stop there." },
    { name: "Tiered Offer Strategy", desc: "Present 3 offers: all cash (lowest), seller financing (middle), full price with terms (highest).", best: "All strategies", risk: "Low", key: "The seller picks the option that works for them. You win regardless." },
    { name: "After-Repair Value (ARV) Stretch", desc: "For BRRRR: use 75-80% of ARV because you're holding, not flipping. Refinance recovers your capital.", best: "BRRRR", risk: "Medium", key: "Verify refinance appraisal will come in at ARV. Use conservative rent estimates." },
  ],
  outreach: [
    { name: "Direct Mail (Yellow Letters)", desc: "Handwritten-style yellow letters to distressed owners. 1-3% response rate.", best: "All distressed", risk: "Low", key: "Send 500+ per month for consistent leads. Follow up 3x. Yellow letter > postcard > formal letter." },
    { name: "Cold Calling (Skip-Traced)", desc: "Call skip-traced phone numbers. 50-100 dials per deal. DNC list compliance required.", best: "Pre-foreclosure, probate", risk: "Low", key: "Use Mojo or BatchDialer. Script: 'Hi, I'm calling about your property at [address]...'" },
    { name: "Door Knocking", desc: "Visit the property in person. Highest conversion rate but most labor-intensive.", best: "D4$, code violations", risk: "Low", key: "Go between 10am-6pm. Be honest, professional, and leave a door hanger if no answer." },
    { name: "Email Outreach", desc: "Send personalized emails to owners with public email addresses. Low response but scalable.", best: "All distressed", risk: "Low", key: "Personalize: use their name, property address, and situation. Follow up 3x." },
    { name: "Text Message (SMS) Outreach", desc: "Text skip-traced mobile numbers. High open rate but TCPA compliance required.", best: "All distressed", risk: "Medium (TCPA)", key: "Get explicit opt-in where possible. Use BatchLeads or REI Reply. Keep it short." },
    { name: "Social Media DM", desc: "Message owners on Facebook or LinkedIn. Less regulated than cold calling.", best: "Absentee owners, probate heirs", risk: "Low", key: "Find them via property address → name search → social media. Be genuine, not salesy." },
    { name: "Bandit Signs", desc: "Place 'We Buy Houses' signs at busy intersections. 1-3 calls per sign per month.", best: "All distressed", risk: "Medium (code enforcement)", key: "Check local sign ordinances. Place Friday evening, remove Sunday night." },
    { name: "Probate Attorney Networking", desc: "Build relationships with probate attorneys who refer executors needing to sell estate properties.", best: "Probate", risk: "Low", key: "Attend local bar association events. Offer to buy properties quickly for cash." },
    { name: "Divorce Attorney Networking", desc: "Build relationships with family law attorneys who refer clients needing to sell marital homes.", best: "Divorce", risk: "Low", key: "Offer fast closings. Divorce settlements often require liquidating the marital home." },
  ],
  investor: [
    { name: "Buy-and-Hold (Rental)", desc: "Buy distressed, rehab, rent out. Long-term wealth building through cash flow + appreciation.", best: "Stable neighborhoods", risk: "Low", key: "Use the 1% rule as a screen. Verify rent with Rentometer. Budget for vacancy + maintenance." },
    { name: "Fix-and-Flip", desc: "Buy distressed, rehab, sell for profit. Short-term capital generation.", best: "Emerging neighborhoods", risk: "Medium", key: "Follow the 70% rule strictly. Time is money — every month of holding eats profit." },
    { name: "BRRRR (Buy, Rehab, Rent, Refinance, Repeat)", desc: "Buy distressed, rehab, rent, refinance to pull capital out, repeat. Infinite ROI potential.", best: "Rental markets", risk: "Medium", key: "Refinance at 75% LTV. Need DSCR ≥ 1.25. Buy at 75% of ARV minus rehab." },
    { name: "Wholesaling", desc: "Contract distressed properties below market, assign to end buyers for a fee. No capital needed.", best: "Entry-level investors", risk: "Low", key: "Build a buyers list FIRST. Market your contract, not the property. Stay legal." },
    { name: "House Hacking", desc: "Buy a multi-family with an FHA loan (3.5% down), live in one unit, rent the others.", best: "2-4 unit properties", risk: "Low", key: "FHA requires owner-occupancy for 1 year. Then you can move and repeat." },
    { name: "Syndication", desc: "Pool investor capital to buy larger deals (apartment complexes, portfolios). GP/LP structure.", best: "Experienced investors", risk: "Medium", key: "SEC Reg D 506(b) or 506(c). Need accredited investors. File Form D." },
    { name: "Note Investing", desc: "Buy performing or non-performing mortgage notes at a discount. Become the lender.", best: "Passive investors", risk: "Medium", key: "Buy non-performing notes at 40-60% of UPB. Modify or foreclose to recover." },
    { name: "Tax Lien Certificates", desc: "Buy tax liens at county auction. Earn 12-18% interest in FL. If unpaid, get the property.", best: "Passive investors", risk: "Low", key: "FL pays 18% annual interest on tax liens. 2-year redemption period then tax deed application." },
  ],
  land: [
    { name: "Raw Land Wholesaling", desc: "Contract vacant land below market, assign to end buyers. Lower competition than houses.", best: "Entry-level", risk: "Low", key: "Land is easier to research — no inspections, no repairs. Use Land.com and LandFlip." },
    { name: "Subdivision Development", desc: "Buy large parcels, subdivide into lots, sell individually. High profit, long timeline.", best: "Experienced developers", risk: "High", key: "Check zoning, minimum lot size, and utility access BEFORE buying. Permitting takes 6-18 months." },
    { name: "Land Flipping", desc: "Buy rural land cheap, market it broadly online, sell at retail. No rehab needed.", best: "Rural markets", risk: "Low", key: "Buy at 10-30% of retail. Market on LandWatch, Craigslist, Facebook Marketplace." },
    { name: "Agricultural Land Lease", desc: "Buy farmland, lease to farmers. Cash flow from agricultural rent + land appreciation.", best: "Rural markets", risk: "Low", key: "Check soil quality, water rights, and existing lease terms. USDA grants available." },
    { name: "Timber Land Investment", desc: "Buy forested land, harvest timber, sell or hold. Timber pays for the land.", best: "North FL, GA", risk: "Medium", key: "Get a timber cruise before buying. Pulpwood vs sawtimber values differ greatly." },
  ],
  exit: [
    { name: "Retail Sale (MLS)", desc: "List the rehabbed property on the MLS with a Realtor. Highest price, 3-6% commission.", best: "Fix-and-flip", risk: "Low", key: "Price 2-5% below comparable sales for fast sale. Stage the property." },
    { name: "Sale to Investor Buyer", desc: "Sell to another investor who will hold as a rental. Faster, no retail buyer financing delays.", best: "Wholesale, BRRRR", risk: "Low", key: "Market to your buyers list. Price at 75-80% of ARV for rental cash flow." },
    { name: "Refinance and Hold (BRRRR)", desc: "Refinance the property at 75% LTV after rehab, pull capital out, rent it out.", best: "BRRRR", risk: "Medium", key: "DSCR loan or conventional refinance. Need 6 months seasoning for conventional." },
    { name: "Lease Option Exit", desc: "Lease the property with an option to buy. Get option fee + monthly cash flow + sale price later.", best: "Buy-and-hold", risk: "Low", key: "Option fee = 3-5% of purchase price. Charge above-market rent with credit toward purchase." },
    { name: "Owner Financing Exit", desc: "Sell with owner financing. Get down payment + monthly payments + interest. Premium price.", best: "Free-and-clear properties", risk: "Medium", key: "Charge 8-10% interest, 5-year balloon. Screen buyers for ability to refinance." },
    { name: "1031 Exchange", desc: "Defer capital gains by exchanging investment property for another. No tax until final sale.", best: "Buy-and-hold", risk: "Low", key: "45 days to identify, 180 days to close. Use a qualified intermediary. Never touch the funds." },
  ],
};

export default function AdminStrategy() {
  const [activeCategory, setActiveCategory] = useState("acquisition");
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (id) => setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-[#c38a1b]" />
        <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Strategy Library</p>
      </div>
      <h1 className="mt-2 font-display text-3xl font-light tracking-tight">Distressed Property Strategy Playbook</h1>
      <p className="mt-2 max-w-3xl text-sm text-black/50">
        Every strategy for finding, acquiring, negotiating, pricing, and exiting distressed real estate deals.
        Organized by category with risk levels, best-use scenarios, and key execution tips.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {STRATEGY_CATEGORIES.map((c) => (
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

      <div className="mt-8 space-y-3">
        {STRATEGIES[activeCategory].map((s, i) => {
          const id = `${activeCategory}-${i}`;
          return (
            <div key={i} className="rounded-sm border border-black/10 bg-white">
              <button onClick={() => toggleItem(id)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                <div>
                  <p className="font-display text-base font-medium">{s.name}</p>
                  <p className="mt-1 text-xs text-black/50">{s.desc}</p>
                </div>
                {expandedItems[id] ? <ChevronUp className="h-4 w-4 text-black/40" /> : <ChevronDown className="h-4 w-4 text-black/40" />}
              </button>
              {expandedItems[id] && (
                <div className="border-t border-black/10 px-5 py-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Best For</p>
                      <p className="mt-1 text-sm text-black/70">{s.best}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Risk Level</p>
                      <p className={`mt-1 text-sm font-medium ${s.risk.includes("High") ? "text-red-600" : s.risk.includes("Medium") ? "text-amber-600" : "text-emerald-600"}`}>{s.risk}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Key Tip</p>
                      <p className="mt-1 text-sm text-black/70">{s.key}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}