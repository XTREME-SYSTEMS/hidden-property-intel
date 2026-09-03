import React, { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const FAQ_DATA = {
  investor: [
    { q: "How do I find distressed properties?", a: "Use the Listings page to search our AI-scored database of distressed properties across Florida. Filter by distress type (pre-foreclosure, probate, tax-delinquent, code violations), county, price range, and property score. Each property includes ownership chain data, estimated value, and AI-generated deal score." },
    { q: "What is the property score and how is it calculated?", a: "Our AI scores each property 0-100 based on equity potential, distress severity, location quality, market trends, and repair cost ratio. Scores above 75 indicate high-potential deals. The score breakdown is visible on each property detail page." },
    { q: "Can I skip trace property owners?", a: "Yes. On any property, click 'Skip Trace' to find the owner's phone number, email, and relatives. Elite plan includes 50 skip traces per month. Enterprise includes unlimited." },
    { q: "How does the smart contract escrow work?", a: "Once you and the seller agree on terms, a Polygon blockchain escrow contract is deployed. Both parties sign digitally, the buyer deposits earnest money into the contract, and funds are released to the seller only when inspection passes — all recorded on-chain with full audit trail." },
    { q: "What exit strategies can I model?", a: "Use the Deal Calculator to model wholesale assignment, fix & flip, BRRRR, and buy & hold on any property. It calculates MAO (70% rule), projected profit, ROI, cash-on-cash return, and per-person profit splits with industry benchmarks." },
    { q: "Can I save properties and get alerts?", a: "Yes. Add any property to your watchlist and set up alerts for new matches, price drops, auction dates, and outbid notifications. Alerts are sent via email and in-app." },
    { q: "How do I make an offer?", a: "Navigate to any property, click 'Make Offer' to use our AI offer generator, which calculates a fair offer based on ARV, rehab costs, and the 70% rule. You can customize terms, add contingencies, and send the offer directly to the seller through the platform." },
    { q: "Is my data secure?", a: "All data is encrypted in transit and at rest. Smart contract transactions are secured by Polygon blockchain cryptography. Your personal information is never shared with other users without your consent." },
  ],
  seller: [
    { q: "How much does it cost to list my property?", a: "Listing your property is completely free. We only earn when your property sells — there are no upfront fees, no monthly charges, and no hidden costs." },
    { q: "What types of properties do you accept?", a: "We specialize in distressed and off-market properties: pre-foreclosures, probate/inherited homes, tax-delinquent properties, code violations, divorce, bankruptcy, and properties needing significant repairs. We also accept standard residential listings." },
    { q: "How fast can I sell?", a: "Depending on the property and offer type, you can receive offers within 24-48 hours. Cash offers can close in as little as 7-14 days. Traditional financed offers typically take 30-45 days." },
    { q: "Do I need to make repairs?", a: "No. We connect you with investors who buy properties as-is. You don't need to spend money on repairs, cleaning, or staging. The investor factors repair costs into their offer." },
    { q: "What disclosures am I required to provide?", a: "Florida law requires sellers to provide a Seller's Property Disclosure (Fla. Stat. §689.26). For properties built before 1978, a Lead-Based Paint Disclosure is federally required. We auto-generate all required disclosure forms for you in your dashboard — just fill them out and sign digitally." },
    { q: "How does the smart contract escrow protect me?", a: "The blockchain escrow ensures the buyer's earnest money is locked in a smart contract before you sign. Funds can only be released to you when inspection passes — the buyer cannot pull out and keep your property off market. All terms are transparent and tamper-proof." },
    { q: "Can I negotiate offers?", a: "Yes. Our AI Negotiation Assistant helps you evaluate and counter offers. You can see the buyer's offer history, our AI's assessment of fairness, and suggested counter-offer amounts with reasoning." },
    { q: "What if I'm behind on mortgage payments?", a: "We can still help. Many of our investors specialize in pre-foreclosure situations and can work with your lender to stop the foreclosure. Contact us immediately if you've received a foreclosure notice — time is critical." },
  ],
  agent: [
    { q: "How do I verify my Florida real estate license?", a: "Enter your Florida real estate license number in your profile settings. We verify it against the DBPR (Department of Business and Professional Regulation) database. Verified agents get access to all agent tools including MLS comps, commission tracking, and co-marketing agreements." },
    { q: "Can I represent both buyers and sellers?", a: "Yes. As a licensed agent, you can represent buyers, sellers, or both (with proper disclosure). Use the Buyer Representation Agreement generator and Co-Marketing Agreement templates in your dashboard." },
    { q: "How do I track my commissions?", a: "The Commission Tracker shows all your active and closed deals with earned vs paid commissions, split percentages, and payout status. Each deal links to its smart contract and closing documents." },
    { q: "Can I co-market with investors?", a: "Yes. Use the Co-Marketing Agreement tool to create legally binding partnership agreements with investors. Define commission splits, marketing responsibilities, and deal terms — then sign digitally." },
    { q: "How do I generate required disclosure forms?", a: "Go to any property in your pipeline, click 'Generate Disclosures,' and select the forms you need. We auto-generate FL Seller's Property Disclosure, Lead-Based Paint (pre-1978), Radon, HOA, and Mold disclosures — all ready for digital signature." },
    { q: "Can I syndicate listings to the MLS?", a: "Yes. Verified agents can push listings to the MLS, Zillow, and Realtor.com directly from the platform. The Listing Syndication tool handles the formatting and submission." },
    { q: "How do I manage showings?", a: "The Showing Scheduler lets buyers request showings online. You'll receive notifications, can confirm or reschedule, and track all showings in one place." },
    { q: "What are the fair housing compliance requirements?", a: "All outreach and marketing through our platform is automatically audited for fair housing compliance. The system flags potentially discriminatory language and provides compliant alternatives. You must complete fair housing training annually." },
  ],
};

export default function DashboardFAQ({ type }) {
  const [open, setOpen] = useState(null);
  const faqs = FAQ_DATA[type] || [];

  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-black/40" />
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-black/60">Frequently Asked Questions</p>
      </div>
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-lg border border-black/5 bg-gray-50/50">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between p-3 text-left"
            >
              <span className="text-sm font-medium text-black/80">{faq.q}</span>
              {open === i ? <ChevronUp className="h-4 w-4 shrink-0 text-black/40" /> : <ChevronDown className="h-4 w-4 shrink-0 text-black/40" />}
            </button>
            {open === i && (
              <p className="px-3 pb-3 text-xs leading-relaxed text-black/60">{faq.a}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}