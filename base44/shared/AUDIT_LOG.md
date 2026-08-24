# PropertyIntel — Forensic Audit Log
Run: 2026-08-24

## Findings

### CRITICAL
1. **Stripe transaction tracking broken** — `createCheckoutSession` read `BASE44_APP_ID` from `secrets` (not exposed there), so `metadata.base44_app_id` was empty on every checkout session + subscription. Base44 could not attribute transactions. FIX: read from `Deno.env.get('BASE44_APP_ID')`.
2. **Negotiation not 1:1 enforced** — `sendNegotiationMessage` let any logged-in investor append messages to another investor's existing thread (it filtered only by `property_id + seller_id` via asServiceRole, bypassing RLS). FIX: reject non-party posters; let an investor claim an unassigned thread.
3. **No bid-acceptance step** — the deal flow (bid → accept → contract → sign → close) was broken at "accept": sellers had no way to accept a bid, so `property.status` never moved to `under_contract` and the contract generator had no canonical bid. FIX: new `acceptBid` function + seller/admin "Accept top bid" UI on the Bidding page; contract generator now prefers the accepted bid.

### HARDENING (already correct, verified)
- `InvestorSignup` already blocks checkout inside the editor iframe and passes `user_id` + `email` + success/cancel URLs. ✓
- `handleStripeWebhook` verifies Stripe signatures, handles checkout/invoice/subscription lifecycle, creates Investor + Subscription records. ✓
- `placeBid` gates by subscription status, enforces min-bid-over-highest, outbids lower bids, auto-raises proxy bidders, sends notifications. ✓
- `processProxyBids` correctly picks the highest proxy ≥ new bid and raises to min(max, new+increment). ✓
- Daily pipelines (scrape 2 AM, outreach 3 AM, validate 4 AM ET) all wired. ✓
- Address masking + AI image generation + auto-scoring all wired. ✓

### OPTIMIZATIONS (deferred — low impact)
- Property geocoding (lat/lng) not set by scraper → map falls back to defaults.
- `Bid` entity has no RLS (all bids public) — intentional for auction transparency.
- Address-mask "Preview as Pro" toggle is a demo, not a real subscription gate.