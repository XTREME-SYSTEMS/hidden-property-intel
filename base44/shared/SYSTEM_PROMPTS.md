# Hidden Property Intel — Master System Prompts

These are the canonical prompts that invoke the autonomous data-acquisition,
investor-growth, and freshness engines. Paste the relevant prompt into the
Base44 builder chat (or a scheduled workflow) to trigger a full run.

---

## 1. Distressed-Property Source Harvest (daily)

> Run the full distressed-property acquisition pipeline. For every active
> DataSource, invoke `runDailyScrapePipeline` to harvest current pre-foreclosure,
> foreclosure, probate, tax-delinquent, code-violation, divorce, bankruptcy,
> auction, short-sale, and bank-owned listings from county assessor, tax
> collector, clerk of court, probate, and public-notice sources. Upsert each
> property with address+zip dedupe, create Owner records for any owner name
> found, then run `ingestPropertyImages` to attach real street-view / satellite
> / listing photos. After ingestion, run `scoreAllActiveProperties` to assign
> 0–100 deal scores, ARV, and repair estimates. Finally, run
> `expireStaleProperties` to remove any property not re-verified in 45 days so
> the inventory is guaranteed current. Log every source run to ScrapeJob and
> report the total new / updated / expired counts.

## 2. Investor & Buyer Growth (daily)

> Run the investor-growth engine. Invoke `scrapeInvestors` across the top
> Florida metros (Miami-Dade, Broward, Palm Beach, Orlando, Tampa, Jacksonville,
> Fort Myers, Port St. Lucie) to harvest active cash buyers, flippers,
> wholesalers, and investment firms with public contact info, deduped by email.
> Then invoke `outreachInvestors` to send the polished, personalized investor
> invitation email to every new lead — each email uses the investor's name,
> company, target markets, and live inventory stats. Log every contact to
> InvestorLead with outreach_status and last_contacted. Report total leads
> found, saved, and emails sent per region.

## 3. Seller / Owner Outreach (daily)

> Run the seller-outreach engine. Invoke `outreachSellers` to send the polished,
> personalized cash-offer email to every Owner record with a contact email that
> hasn't been contacted yet. Each email uses the owner's name and the specific
> property address and distress type. Log every send to Owner.outreach_status
> and contacted_at. Report total emails sent.

## 4. Full System Freshness & Integrity (nightly)

> Run the nightly integrity sweep. Invoke `validateSystem` to inspect every
> subsystem — scrape pipeline, data sources, investor outreach, smart contracts,
> deal alerts, investor pipeline, title-risk coverage, image coverage — and
> auto-heal any failures (re-run failed sources, reset error sources, clear
> stale jobs). Then invoke `expireStaleProperties` to guarantee no stale
> inventory remains. Log the full SystemHealth record with metrics, checks,
> and actions_taken. Report overall_status and any auto-heal actions.

## 5. Smart-Contract Generation (on accepted bid)

> When a bid is accepted, invoke `generateSmartContract` with the property_id,
> investor_id, seller_id, and deal terms (price, earnest money, closing date,
> contingencies). The function generates a complete Solidity 0.8.20 escrow
> contract for Polygon, stores the source code and ABI, and returns the
> smart_contract_id. Verify the contract compiles and that the ABI includes
> deposit, sign, release, refund, and event functions before marking it ready
> for deployment.