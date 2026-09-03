import React, { useState } from "react";
import {
  Lightbulb, Eye, Key, Award, ChevronDown, ChevronUp, TrendingUp,
  Users, Home, DollarSign, AlertTriangle, Zap, Target, Brain,
} from "lucide-react";

const TRICKS = [
  {
    category: "Finding Hidden Deals",
    icon: Eye,
    items: [
      {
        trick: "The 'Dead Letter' Technique",
        secret: "Send a letter to the property address AND the owner's mailing address. If both come back undeliverable, the owner has died or moved — prime probate or absentee target.",
        why: "Undeliverable mail = no one is managing the property. These are the most motivated sellers — they don't even know they need to sell yet.",
        examples: [
          "Letter to 123 Main St returns 'No Such Address' → owner subdivided or address changed → check county records for new parcel ID.",
          "Letter to owner's mailing address returns 'Deceased, Return to Sender' → owner died → search obituaries → contact heirs.",
          "Letter to property returns 'Vacant' → property is empty → skip trace the owner → they're probably a tired landlord.",
        ],
      },
      {
        trick: "The 'Tax Bill Bounce'",
        secret: "Check if property tax bills are being returned to the tax collector. If the county can't reach the owner, neither can anyone else — until you skip trace them.",
        why: "County tax collectors maintain 'returned mail' lists. These are owners the county has lost contact with — often deceased, institutionalized, or incarcerated.",
        examples: [
          "Request the 'undeliverable tax bill' list from the county tax collector → these owners haven't paid taxes or responded → tax delinquent + unreachable.",
          "Property tax bill returned for 3 years → owner is likely deceased or in care facility → probate opportunity.",
          "Tax bill goes to a nursing home → owner is elderly → may need to sell to pay for care → contact family.",
        ],
      },
      {
        trick: "Water Shut-Off Records",
        secret: "Request water utility shut-off records. If water has been off for 6+ months, the property is vacant — and the owner is paying for nothing.",
        why: "Vacant properties deteriorate. Owners of vacant properties are motivated to sell before the property falls apart or gets squatted.",
        examples: [
          "Water off 8 months → property vacant → owner may be out of state → skip trace → offer cash, fast close.",
          "Water off 2 years → property may have code violations → check code enforcement → owner facing fines.",
          "Water off + code violations + tax delinquent = triple distress → highly motivated seller.",
        ],
      },
      {
        trick: "Code Violation 'Pre-Lien' Window",
        secret: "Contact owners when code violations are first filed but BEFORE a lien is recorded. They're scared of escalating fines but the lien hasn't destroyed their equity yet.",
        why: "Once a lien is recorded, the owner may give up. In the pre-lien window, they're scared and motivated — the perfect time to offer a clean exit.",
        examples: [
          "Code violation filed for overgrown lawn → $250/day fine → contact owner before it hits $10K → offer to buy before fines consume equity.",
          "Unpermitted addition noticed → owner faces $500/day → offer to buy as-is, take on the violation → owner relieved.",
          "Boarded-up notice posted → owner has 30 days to fix → offer cash, close in 7 days → owner avoids the fine spiral.",
        ],
      },
    ],
  },
  {
    category: "Probate & Inheritance Secrets",
    icon: Users,
    items: [
      {
        trick: "The 'Surviving Spouse' Window",
        secret: "When one spouse dies, the surviving spouse often can't maintain the property. Contact them within 30-60 days of the death — before they list with a Realtor.",
        why: "Surviving spouses are overwhelmed. They want simplicity. A cash offer with no repairs and a fast close is exactly what they need.",
        examples: [
          "Obituary lists 'survived by wife Mary' → find Mary via skip trace → offer to buy the house as-is → she doesn't have to clean out 40 years of belongings.",
          "Husband dies, wife moves in with daughter → house sits empty → contact wife → offer cash, let her leave everything behind.",
          "Surviving spouse is elderly → can't maintain → offer a life estate: they live there until death, you get the house after.",
        ],
      },
      {
        trick: "The 'Out-of-State Heir'",
        secret: "Heirs who live in another state inherited a property they can't manage. They're the easiest probate deals — they want it gone.",
        why: "Out-of-state heirs can't check on the property, can't do repairs, and can't manage tenants. A cash offer that takes the problem off their hands is a relief.",
        examples: [
          "Heir lives in New York, inherited house in Florida → can't manage from 1,000 miles away → offer cash, close remotely via docusign.",
          "Multiple heirs in different states → they can't agree on what to do → offer to buy out all shares → everyone gets cash.",
          "Heir is executor + out of state → has court authority to sell → offer cash, close through the estate.",
        ],
      },
      {
        trick: "The 'Probate Before Listing' Approach",
        secret: "Contact the executor BEFORE they list the property with a Realtor. Executors have a fiduciary duty to sell at fair market value — but 'fair market value' to an estate means fast cash, not top dollar.",
        why: "Executors want to close the estate and get paid. A 30-day cash close is worth more to them than a 6-month listing at a higher price.",
        examples: [
          "Executor is a lawyer → they want the estate closed fast → offer cash, 14-day close → they get their fee, heirs get cash.",
          "Executor is a family member → they're overwhelmed → offer to handle the clean-out, closing, everything → turnkey solution.",
          "Probate property needs $40K in repairs → no retail buyer will touch it → offer cash as-is → only realistic option.",
        ],
      },
      {
        trick: "The 'Homestead Exemption' Clue",
        secret: "When a property's homestead exemption is removed (because the owner died), it signals a probate opportunity. Check the county property appraiser for homestead status changes.",
        why: "Homestead exemptions are removed when the owner dies or moves. This is a public record signal that the property is in transition.",
        examples: [
          "Homestead removed last month → owner likely died → search obituaries → contact heirs.",
          "Homestead removed + taxes went up → surviving spouse can't afford the increase → motivated seller.",
          "Homestead never filed → investor-owned or inherited → check ownership history → may be a tired landlord.",
        ],
      },
    ],
  },
  {
    category: "Negotiation Secrets",
    icon: DollarSign,
    items: [
      {
        trick: "The 'Walk Away' Power",
        secret: "The party who cares least wins. Be willing to walk away from every deal. When sellers sense you NEED the deal, they hold firm. When they sense you'll walk, they negotiate.",
        why: "Desperation is detectable. The moment a seller senses you're emotionally attached, your leverage disappears.",
        examples: [
          "Seller asks for $200K, you offer $150K → they say 'no way' → you say 'I understand, good luck' and leave → they call back in 3 days.",
          "Multiple offers on a property → don't get into a bidding war → submit your best offer with a 48-hour expiration → walk if not accepted.",
          "Seller is emotional about the house → don't negotiate the price → negotiate the terms: closing date, repairs, possession.",
        ],
      },
      {
        trick: "The 'Problem Solver' Frame",
        secret: "Don't sell — solve. Ask 'What's the biggest problem this property is causing you?' Then solve THAT problem, not the price.",
        why: "Sellers don't sell because of price — they sell because of pain. Find the pain and the price takes care of itself.",
        examples: [
          "Seller says 'I just want it gone' → offer a 7-day close, no clean-out, as-is → price barely matters.",
          "Seller is behind on taxes → offer to pay the taxes at closing → they keep their credit, you get the house.",
          "Seller is going through divorce → offer to buy out one spouse's share → faster than a contested sale.",
        ],
      },
      {
        trick: "The 'Three Offer' Technique",
        secret: "Always present three offers: cash (lowest), terms (middle), full price (highest). The seller picks the one that fits their situation — and you never lose.",
        why: "Anchoring: the cash offer looks low, but next to the full-price offer, it's one of three options. The seller feels in control.",
        examples: [
          "Offer 1: $150K cash, 7-day close. Offer 2: $175K seller financing, 30-day close. Offer 3: $200K full price, 90-day close, contingent on sale of their next home.",
          "Seller picks Offer 2 → you get the property at 87% of asking with no bank → seller gets more money → win-win.",
          "Seller picks Offer 1 → you get it cheap and fast → flip or wholesale for $20K spread.",
        ],
      },
      {
        trick: "The 'Silence After the Offer'",
        secret: "After you make an offer, shut up. The first person to speak loses. Sit in the silence.",
        why: "Sellers are uncomfortable with silence. They'll often negotiate against themselves by breaking the silence with a concession.",
        examples: [
          "You offer $140K. Silence. 30 seconds. Seller says 'Could you do $150K?' — they just dropped from their $200K asking price.",
          "You present the offer in writing and say nothing. Seller reads it, fidgets, then says 'What if I leave the appliances?' — they're negotiating against themselves.",
          "On a phone call, you state your offer and go quiet. The seller fills the silence with 'Let me think about it' — which means they're considering, not rejecting.",
        ],
      },
    ],
  },
  {
    category: "Hidden Niches & Overlooked Opportunities",
    icon: Target,
    items: [
      {
        trick: "The 'Burned Landlord'",
        secret: "Landlords who've been burned by bad tenants are the most motivated sellers. Find them through eviction court records.",
        why: "A landlord who just went through a $10K eviction and $20K in property damage will sell at a discount just to be done.",
        examples: [
          "Check eviction court records → landlord just evicted a tenant who destroyed the property → offer to buy as-is → they're relieved.",
          "Landlord with 3 properties, one is a nightmare → offer to buy the worst one → they keep the good ones, you get a deal.",
          "Out-of-state landlord → property manager quit → can't find a new one → offer to buy → they're done being a landlord.",
        ],
      },
      {
        trick: "The 'Estate Sale' Connection",
        secret: "Estate sale companies know about probate properties before anyone else. Build relationships with 5-10 estate sale companies in your area.",
        why: "Estate sale companies are hired by executors to liquidate contents. They know the property will be sold next — and they know the executor.",
        examples: [
          "Estate sale company calls you: 'I just did a sale at 123 Main St, the executor wants to sell the house' → you're first in line.",
          "Estate sale company refers you → you offer them a $1K referral fee → they send you every probate property they touch.",
          "Estate sale at a property → attend the sale → meet the family → hand your card to the executor → 'I buy houses as-is, cash, fast.'",
        ],
      },
      {
        trick: "The 'Nursing Home Transition'",
        secret: "When an elderly owner moves to a nursing home, their house sits vacant. The family is paying $8K+/month for care and needs to sell the house to fund it.",
        why: "Nursing home costs create urgent financial pressure. The family needs liquid cash fast — a cash offer on the house solves their problem.",
        examples: [
          "Obituary mentions 'preceded in death by spouse, survived by children' → check if surviving spouse is in a facility → contact children.",
          "Property vacant + owner's mailing address changed to a nursing home → family is paying for care → offer fast cash close.",
          "Medicaid estate recovery → state will take the house after death → family would rather sell to you than lose it to the state.",
        ],
      },
      {
        trick: "The 'Zombie Property'",
        secret: "Zombie properties are homes where the owner moved out after foreclosure started but the bank never completed the foreclosure. The title is in limbo.",
        why: "No one is maintaining the property. The bank thinks they own it (but don't yet). The owner thinks they lost it (but still have title). You can buy from the owner.",
        examples: [
          "Foreclosure filed 3 years ago, never completed → owner moved out → property deteriorating → you buy from owner who still has title.",
          "Bank started foreclosure, then the mortgage was sold → paperwork lost → foreclosure stalled → owner still owns → buy it cheap.",
          "Owner walked away, property is vacant, code violations piling up → you buy from owner, cure the violation, flip it.",
        ],
      },
      {
        trick: "The 'Divorce Pre-Listing'",
        secret: "Couples divorcing often need to sell the marital home to split assets. Contact them BEFORE they list with a Realtor — they want speed and certainty, not top dollar.",
        why: "Divorcing couples are in conflict. They want the house sold and the money split. A cash offer with a fast close eliminates the house as a source of conflict.",
        examples: [
          "Divorce filed → check court records → both spouses want the house gone → offer cash, close in 14 days → they split the cash.",
          "One spouse wants to keep the house, other wants to sell → offer to buy, both get cash → conflict resolved.",
          "Divorce + behind on mortgage → both spouses' credit at risk → offer to take over payments or buy before foreclosure.",
        ],
      },
      {
        trick: "The 'Tired Wholesaler' Deal",
        secret: "Other wholesalers who can't close their deals will assign them to you for a smaller fee. Network with every wholesaler in your market.",
        why: "A wholesaler with a property under contract they can't move is desperate. They'll take a $3K assignment fee instead of $10K just to not lose the deal.",
        examples: [
          "Wholesaler has a property under contract for $150K, can't find a buyer → you buy the assignment for $3K → close at $153K → ARV is $250K.",
          "Wholesaler's buyer fell through 2 days before closing → they're about to lose their EMD → you step in, close, save their fee.",
          "Build a 'wholesaler's wholesaler' list → they send you their overflow deals → you get deals without doing the marketing.",
        ],
      },
    ],
  },
  {
    category: "Situational Awareness — Reading Between the Lines",
    icon: Brain,
    items: [
      {
        trick: "The 'For Rent → For Sale' Flip",
        secret: "When a 'For Rent' sign comes down and a 'For Sale' sign goes up on the same property within 6 months, the landlord couldn't find a tenant. The property has issues.",
        why: "A property that can't be rented has something wrong — bad location, condition, or neighborhood. But it might be a great flip if the price is right.",
        examples: [
          "For Rent 3 months → For Sale → landlord gave up → offer 20% below asking → they're motivated because they have no rental income.",
          "For Rent → For Sale → expired listing → now it's been on the market 6 months with no income → very motivated.",
          "Multiple 'For Rent' signs in a neighborhood → oversupply → landlords are desperate → buy cheap, hold for the cycle.",
        ],
      },
      {
        trick: "The 'Inheritance + Tax Delinquency' Combo",
        secret: "When a property is inherited AND tax delinquent, the heirs don't have the money to pay the taxes. They'll sell for the tax amount.",
        why: "Heirs who inherited a property but can't pay the taxes are losing it to tax sale. They'd rather sell to you for the tax amount than lose it for nothing.",
        examples: [
          "Owner died, heirs inherited, taxes are 2 years delinquent ($8K) → heirs can't pay → offer $8K + $5K to heirs → they get cash, you get a house.",
          "Inherited property + tax lien filed → heirs don't know about the lien → you inform them → offer to buy and cure the lien.",
          "Probate + tax deed sale scheduled → heirs about to lose the property → you buy before the sale → they get something instead of nothing.",
        ],
      },
      {
        trick: "The 'Post-Eviction Property'",
        secret: "After an eviction, the property is often trashed and the owner is emotionally done. This is the best time to buy a rental.",
        why: "The owner just spent 3 months and $5K+ on an eviction. The property is damaged. They never want to be a landlord again. You're their savior.",
        examples: [
          "Eviction completed → property has holes in walls, cat urine, missing copper → owner is traumatized → offer cash as-is → they cry with relief.",
          "Owner evicted tenant, now owes $10K in repairs → can't re-rent → offer to buy → they're done being a landlord forever.",
          "Serial eviction landlord → 3 evictions in 2 years → bad at screening tenants → offer to buy all 3 properties → they exit gracefully.",
        ],
      },
      {
        trick: "The 'New Roof' Tell",
        secret: "If a property just got a new roof but is now for sale, the owner was planning to stay but something changed. Find out what.",
        why: "No one puts a $15K roof on a house they're about to sell — unless something forced them. Divorce, job loss, health crisis. That's your motivation signal.",
        examples: [
          "New roof + for sale → owner got transferred for work → needs to sell fast → offer cash, quick close.",
          "New roof + for sale → owner got divorced → can't afford the house alone → motivated seller.",
          "New roof + expired listing → owner sunk $15K into a house that won't sell → desperate → lowball offer accepted.",
        ],
      },
    ],
  },
];

export default function AdminTricksOfTrade() {
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (id) => setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-[#c38a1b]" />
        <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Tricks of the Trade</p>
      </div>
      <h1 className="mt-2 font-display text-3xl font-light tracking-tight">The Insider's Playbook</h1>
      <p className="mt-2 max-w-3xl text-sm text-black/50">
        The secrets, methods, and between-the-lines intelligence that 100 years of distressed real estate investing
        has taught us. Every trick includes the reasoning behind it and 3 real-world examples of how to profit.
      </p>

      <div className="mt-8 space-y-10">
        {TRICKS.map((cat, ci) => (
          <section key={ci}>
            <div className="flex items-center gap-2 border-b border-black/10 pb-3">
              <cat.icon className="h-5 w-5 text-black/70" />
              <h2 className="font-display text-xl font-light tracking-tight">{cat.category}</h2>
            </div>
            <div className="mt-4 space-y-3">
              {cat.items.map((item, ii) => {
                const id = `${ci}-${ii}`;
                return (
                  <div key={ii} className="rounded-sm border border-black/10 bg-white">
                    <button onClick={() => toggleItem(id)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                      <div className="flex items-center gap-3">
                        <Key className="h-4 w-4 shrink-0 text-[#c38a1b]" />
                        <div>
                          <p className="font-display text-base font-medium">{item.trick}</p>
                          <p className="mt-1 text-xs text-black/50">{item.secret}</p>
                        </div>
                      </div>
                      {expandedItems[id] ? <ChevronUp className="h-4 w-4 text-black/40" /> : <ChevronDown className="h-4 w-4 text-black/40" />}
                    </button>
                    {expandedItems[id] && (
                      <div className="border-t border-black/10 px-5 py-4">
                        <div className="rounded-sm bg-amber-50 border border-amber-200 p-3 mb-4">
                          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">Why It Works</p>
                          <p className="mt-1 text-sm text-amber-900">{item.why}</p>
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-black/40 mb-2">Real-World Examples</p>
                        <div className="space-y-2">
                          {item.examples.map((ex, ei) => (
                            <div key={ei} className="flex gap-3 rounded-sm border border-black/10 p-3">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">{ei + 1}</span>
                              <p className="text-sm leading-relaxed text-black/70">{ex}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}