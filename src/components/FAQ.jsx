import React, { useState } from "react";
import { Plus } from "lucide-react";

const ITEMS = [
  ["What types of distressed properties does Hidden Property Intel find?", "We track all distress types: pre-foreclosure, foreclosure, probate/inherited, tax-delinquent, code-violation, divorce, bankruptcy, auction, and short-sale properties. Both commercial and residential."],
  ["How does the property scoring work?", "Our AI engine analyzes distress severity, repair cost estimates, after-repair value, comparable sales, location desirability, and market trends to generate a 0-100 score with a proposed asking price and ROI projection."],
  ["How do I access the property database?", "Investors subscribe to one of three plans: Starter ($49/mo), Pro ($149/mo), or Elite ($499/mo). Each plan includes different levels of access to property data, bidding, smart contracts, and analytics."],
  ["Can sellers list properties for free?", "Yes. Sellers can post properties for free on our seller portal. You get AI listing optimization, bid management tools, and an AI negotiation assistant to help you get the best deal."],
  ["How does the smart contract system work?", "We generate Solidity smart contracts on the Polygon blockchain with customizable terms. Both parties sign digitally, and the contract manages escrow and closing on-chain for fast, secure transactions."],
  ["What data sources do you scrape?", "Our autonomous cloud-browser scrapes county assessor records, tax records, probate court filings, pre-foreclosure data, auction listings, and obituary records to identify inherited properties."],
  ["Do you show owner contact information?", "We trace the full ownership chain: current owner, previous owners, and potential heirs identified through probate records. Contact information is included for subscribed investors."],
  ["How often is the property data updated?", "Our scraping pipeline runs daily, surfacing new distressed properties and updating existing ones with fresh ownership data, scores, and market analytics."],
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-[#E5EDEA] rounded-3xl bg-white ring-1 ring-[#E5EDEA]">
      {ITEMS.map(([q, a], i) => (
        <div key={q}>
          <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
            <span className="font-medium text-[#1A2B22]">{q}</span>
            <Plus className={`h-4 w-4 shrink-0 text-[#6B7B72] transition-transform duration-300 ${open === i ? "rotate-45" : ""}`} />
          </button>
          <div className={`grid overflow-hidden transition-all duration-300 ${open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <p className="overflow-hidden px-6 pb-5 text-sm leading-relaxed text-[#6B7B72]">{a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}