# PropertyIntel — Build Brief Log

**Logged from agent prompt:** 2026-08-24
**Source:** User-supplied exhaustive build brief ("BUILD BRIEF: PropertyIntel — AI-Powered Distressed Property Investment Platform").

## Summary
Multi-sided marketplace: sellers list free (AI listing optimization + negotiation assistant); investors pay $49/$149/$499/mo to browse, bid, and close via Polygon smart contracts. Autonomous cloud-browser scraping of county assessor / tax / probate / foreclosure / obituary records to find off-market inherited properties. Full ownership-chain tracking, AI scoring, smart-contract closing.

## 14 Entities
1. Property — core listing (exists)
2. Owner — owners + potential heirs (exists)
3. OwnershipChain — transfer history (exists)
4. Bid — bidding (exists)
5. PropertyScore — AI scoring (exists)
6. MarketAnalytics — market trends (exists)
7. SmartContract — Polygon contracts (TODO)
8. Investor — investor profile (TODO)
9. Seller — seller profile (TODO)
10. Subscription — Stripe billing (TODO)
11. ScrapeJob — scrape pipeline runs (TODO)
12. PropertyImage — images (TODO)
13. NegotiationThread — AI negotiation (TODO)
14. DataSource — scrape source config (TODO)

## 15 Pages
Landing(/), Property Search(/properties), Property Detail(/properties/:id), Investor Dashboard, Investor Signup & Payment, Analytics Dashboard, ROI Calculators(/calculators), Seller Dashboard, Seller Property Post, Bidding Interface, Smart Contract Creator, Smart Contract Viewer, Negotiation Assistant, Admin Panel, Scrape Source Manager.
Existing: Landing (LuxuryHome), Property Search (Listings), Property Detail, ROI Calculators.

## 12 Backend Functions
scrapeProperties (Browserbase), scoreProperty (InvokeLLM), generateSmartContract (Polygon/Web3), placeBid, processProxyBids, aiNegotiationAssistant (InvokeLLM), optimizeListing (InvokeLLM), syncMarketAnalytics (InvokeLLM), generatePropertyImages (Google Street View), handleStripeWebhook (Stripe), sendBidNotifications (email+Twilio), dailyScrapePipeline (scheduled workflow).

## Integrations
Browserbase, Stripe, Polygon, Google Maps, Google Street View, Twilio, Base44 InvokeLLM, Base44 Scheduled Workflows.

## Hard Blockers (require external accounts/keys — cannot complete autonomously)
- Browserbase: no built-in integration; needs API key + paid account. Blocks scraping + daily pipeline.
- Polygon: needs wallet private key + RPC URL stored as secret; security-sensitive. Blocks smart contracts.
- Google Maps / Street View: needs API key. Blocks maps + auto images.
- Twilio: needs account SID/auth token. Blocks SMS notifications.
- Stripe: needs installation + keys. Blocks investor subscriptions.