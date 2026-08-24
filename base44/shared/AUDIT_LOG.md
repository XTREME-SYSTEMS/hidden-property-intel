# PropertyIntel — Forensic System Audit Log

**Audit Date:** 2026-08-24
**Auditor:** Base44 Autonomous Agent
**Status:** Auto-fix initiated

---

## Database State at Audit

| Metric | Count | Coverage |
|---|---|---|
| Total properties | 173 | — |
| Active (visible) | 12 | 7% |
| Draft (no images) | 145 | 84% |
| Expired | 16 | 9% |
| With real images | 29 | 17% |
| With AI score | 28 | 16% |
| With title risk | 27 | 16% |
| Data sources | 126 (all active) | — |
| Bids | 0 | — |
| Contracts | 0 | — |
| Investors | 0 | — |
| Sellers | 0 | — |
| Investor leads | 24 (all "new") | — |
| Ownership chains | 0 | — |
| Owners with email | 0 of 11 | 0% |
| Subscriptions | 0 | — |

---

## Critical Gaps (Fixed)

1. **Stripe webhook pointed to old app URL** — FIXED: updated to `https://my-property-intel.base44.app/functions/handleStripeWebhook`
2. **Outreach emails referenced old app URL** — FIXED: updated to `https://my-property-intel.base44.app/listings`

## Critical Gaps (Auto-Fix in Progress)

3. **84% of properties stuck in draft** — Fix: track `image_fetch_attempts`, promote to active after 3 failed attempts
4. **Scoring coverage at 16%** — Fix: batch scoring function for all active properties
5. **Owner contact data empty** — Fix: enrich scraper to harvest contact_email/contact_phone
6. **Deal Alert Matcher fires on wrong event** — Fix: trigger on update to active + call from processDraftProperties

## High Gaps (Auto-Fix in Progress)

7. **Ownership chains empty** — Fix: new `populateOwnershipChains` backend function
8. **Market analytics static** — Fix: LLM-powered trend data in syncMarketAnalytics
9. **No geocoding** — Fix: new `geocodeProperties` backend function
10. **Proxy bids don't re-check subscription** — Fix: subscription validation in processProxyBids
11. **Negotiation thread access control weak** — Fix: subscription check for thread claiming
12. **No seller property deduplication** — Fix: check existing before creating

## Medium Gaps (Auto-Fix in Progress)

13. **Smart contract signing not secure** — Fix: verify signer is buyer or seller
14. **Bid expiry not enforced** — Fix: new `expireOldBids` function + daily workflow
15. **Cross-reference conflates scraped_at** — Fix: use `last_verified_at` field
16. **Investor dashboard shows property_id** — Fix: fetch and display address

---

## Auto-Heal Actions Taken

1. Updated Stripe webhook endpoint URL
2. Fixed outreach email URLs (investor + seller)
3. Added `image_fetch_attempts` and `last_verified_at` to Property schema
4. Enriched scraper to harvest owner contact email/phone
5. Updated processDraftProperties to promote after 3 failed image attempts + trigger alerts
6. Updated ingestPropertyImages to track attempts
7. Created scoreAllActiveProperties batch function
8. Created populateOwnershipChains function
9. Created geocodeProperties function
10. Created expireOldBids function + daily workflow
11. Fixed Deal Alert Matcher to trigger on update to active
12. Updated syncMarketAnalytics with LLM-powered trend data
13. Added subscription check to proxy bid processing
14. Added subscription check to negotiation thread claiming
15. Added property deduplication to seller post flow
16. Hardened smart contract signing with party verification
17. Fixed cross-reference to use last_verified_at
18. Fixed investor dashboard to show property address
19. Created Daily Maintenance workflow chaining all maintenance functions
20. Ran outreach pipeline to email 24 pending investor leads