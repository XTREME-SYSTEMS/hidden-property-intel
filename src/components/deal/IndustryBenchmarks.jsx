import React from "react";
import { Info, TrendingUp, Users, Briefcase, Building2 } from "lucide-react";

const BENCHMARKS = {
  wholesale: [
    { label: "Avg Assignment Fee (Nationwide)", value: "$13,000", source: "Real Estate Bees survey of 1,000+ wholesalers", good: "Your fee should be $5K-$20K" },
    { label: "Experienced Wholesaler Range", value: "$15K-$20K", source: "Industry standard for pros", good: "Scale up as you gain experience" },
    { label: "New Wholesaler Range", value: "$3K-$7K", source: "Typical first 5 deals", good: "Start here, raise as you build a buyers list" },
    { label: "Fee as % of Buyer's Spread", value: "15-25%", source: "Industry rule of thumb", good: "Don't take more than 25% of buyer's profit" },
    { label: "Assignment Fee Formula", value: "10-15% of contract price OR $5K min", source: "BiggerPockets community standard", good: "Whichever is higher" },
  ],
  flip: [
    { label: "70% Rule (Max Offer)", value: "ARV × 70% − Rehab", source: "Fix & flip industry standard", good: "Your purchase price should be ≤ this" },
    { label: "Rehab Cost / sqft (Light)", value: "$15-$25/sf", source: "Paint, flooring, fixtures", good: "Cosmetic updates only" },
    { label: "Rehab Cost / sqft (Medium)", value: "$30-$50/sf", source: "Kitchen, bath, some systems", good: "Most standard flips" },
    { label: "Rehab Cost / sqft (Heavy)", value: "$60-$120+/sf", source: "Full gut, structural, roof", good: "Add 10-15% contingency" },
    { label: "Healthy Flip ROI", value: "20-30%+", source: "Experienced flippers target", good: "Below 15% is marginal" },
    { label: "Closing Costs (Acquisition)", value: "2-5% of price", source: "Title, lender, attorney, transfer", good: "Budget 3% as safe estimate" },
  ],
  brrrr: [
    { label: "Refi LTV Standard", value: "70-75% of ARV", source: "DSCR/conventional lenders", good: "Higher LTV = more cash-out" },
    { label: "Ideal Cash Left in Deal", value: "$0", source: "True BRRRR = infinite CoC return", good: "Less cash left = better return" },
    { label: "DSCR Loan Rate", value: "5-7% typical", source: "2025 market rates", good: "Based on FICO, LTV, DSCR ratio" },
    { label: "DSCR Ratio Minimum", value: "1.2+", source: "Most lenders require", good: "Rent / (PITI + mgmt) ≥ 1.2" },
    { label: "Refi Closing Costs", value: "2-4% of loan", source: "Lender fees, appraisal, title", good: "Budget 3%" },
  ],
  hold: [
    { label: "Good Cap Rate", value: "6-8%+", source: "Investor benchmark", good: "Below 5% is marginal in most markets" },
    { label: "Cash-on-Cash Target", value: "8-12%+", source: "Long-term hold standard", good: "Accounts for financing" },
    { label: "Vacancy Rate (Standard)", value: "5-8%", source: "Property management standard", good: "5% for stable areas, 8% transient" },
    { label: "Maintenance Reserve", value: "5-8% of rent", source: "Industry standard", good: "Higher for older properties" },
    { label: "Management Fee", value: "8-10% of rent", source: "Property managers", good: "Self-manage to save" },
  ],
};

const COMMISSIONS = [
  { label: "Total Commission (Both Sides)", value: "5-6%", detail: "Split between listing + buyer's agent" },
  { label: "Listing Agent", value: "2.5-3%", detail: "Paid by seller at closing" },
  { label: "Buyer's Agent", value: "2.5-3%", detail: "Negotiable post-2024 NAR settlement" },
  { label: "Discount Brokerage", value: "1-2%", detail: "Clever, Redfin, flat-fee MLS" },
];

const STAFF_RECS = [
  { role: "Transaction Coordinator", cost: "$350-$650 per deal", why: "Manages contracts, deadlines, escrow coordination. Essential once you close 2+ deals/month." },
  { role: "Acquisitions Manager", cost: "$45K-$75K/yr + commission", why: "Negotiates with sellers, runs comps, signs contracts. Needed at 5+ deals/month." },
  { role: "Dispositions Manager", cost: "$40K-$60K/yr + commission", why: "Sells your contracts to buyers, manages buyers list. Pair with acquisitions." },
  { role: "Skip Tracer / VA", cost: "$8-$15/hr (overseas)", why: "Finds owner phone numbers, sends outreach. Outsource early." },
  { role: "Title Attorney / Escrow", cost: "$500-$1,500 per deal", why: "Closes the transaction, handles title insurance. Required by law in FL." },
  { role: "Real Estate Attorney", cost: "$200-$500/hr", why: "Reviews contracts, handles probate, advises on legal compliance." },
  { role: "CPA / Bookkeeper", cost: "$150-$400/mo", why: "Tracks deal P&L, tax strategy, entity structuring (LLC/S-corp)." },
  { role: "Licensed Realtor", cost: "Commission split", why: "MLS access, comp pulls, listing on exit. Get your license or partner." },
];

export default function IndustryBenchmarks({ results, dealType }) {
  const benchmarks = BENCHMARKS[dealType] || [];

  return (
    <div className="space-y-4">
      {/* Industry benchmarks */}
      <div className="rounded-lg border border-black/10 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-black/40" />
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-black/60">Industry Benchmarks</p>
        </div>
        <div className="space-y-3">
          {benchmarks.map((b) => (
            <div key={b.label} className="border-b border-black/5 pb-3 last:border-0">
              <p className="text-xs font-medium text-black/70">{b.label}</p>
              <p className="mt-0.5 font-display text-lg font-medium text-black">{b.value}</p>
              <p className="mt-0.5 text-[10px] text-black/40">{b.source}</p>
              <p className="mt-1 text-[10px] text-emerald-600">✓ {b.good}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Commission standards */}
      <div className="rounded-lg border border-black/10 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-black/40" />
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-black/60">Commission Standards</p>
        </div>
        <div className="space-y-2">
          {COMMISSIONS.map((c) => (
            <div key={c.label} className="flex items-center justify-between border-b border-black/5 pb-2 last:border-0">
              <div>
                <p className="text-xs font-medium">{c.label}</p>
                <p className="text-[10px] text-black/40">{c.detail}</p>
              </div>
              <p className="font-display text-sm font-medium text-gold">{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Staff recommendations */}
      <div className="rounded-lg border border-black/10 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-black/40" />
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-black/60">Recommended Team Members</p>
        </div>
        <div className="space-y-3">
          {STAFF_RECS.map((s) => (
            <div key={s.role} className="border-b border-black/5 pb-3 last:border-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">{s.role}</p>
                <p className="text-[10px] font-medium text-gold">{s.cost}</p>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-black/50">{s.why}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Legal note */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-xs font-medium text-amber-800">Legal Compliance Note</p>
            <p className="mt-1 text-[10px] leading-relaxed text-amber-700">
              Florida requires a real estate license to market properties you don't own (unless you're a principal in the transaction).
              Always disclose your assignment fee to all parties. Use a licensed attorney for contract review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}