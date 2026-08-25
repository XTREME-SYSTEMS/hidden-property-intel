# Forensic Audit Findings — 2026-08-25

## CRITICAL

### C1. Bid entity — open create RLS (privilege escalation / impersonation)
- **File:** `base44/entities/Bid.jsonc`
- **Root cause:** `rls.create: {}` allows ANY authenticated user to create a Bid with an arbitrary `investor_id` and `seller_id`. A direct SDK call (`base44.entities.Bid.create({ investor_id: "<other user>", ... })`) bypasses the `placeBid` function entirely, letting a user impersonate another investor or route bids to themselves.
- **Fix:** Restrict `create` to `data.investor_id == user.id` OR admin.

### C2. Property entity — open create RLS (seller_id spoofing → hijack)
- **File:** `base44/entities/Property.jsonc`
- **Root cause:** `rls.create: {}` allows any user to create a Property with `seller_id` set to another user's ID. Since `update`/`delete` allow `data.seller_id == user.id`, the spoofed user would gain edit/delete access to a property they never posted.
- **Fix:** Restrict `create` to `data.seller_id == user.id` OR admin.

### C3. Stripe webhook doesn't sync Investor.subscription_status
- **File:** `base44/functions/handleStripeWebhook/entry.ts`
- **Root cause:** On `invoice.paid` and `invoice.payment_failed`, the Subscription record is updated but the **Investor** record's `subscription_status` is not. The bidding gate (`placeBid`) checks `investor.subscription_status`, so after a payment fails and is later paid, the investor stays locked out (or stays "active" after a real failure).
- **Fix:** Update `Investor.subscription_status` in both handlers.

### C4. PropertyDetail `unlocked` is never set to true — Pro feature completely broken
- **File:** `src/pages/PropertyDetail.jsx`
- **Root cause:** `const [unlocked, setUnlocked] = useState(false)` — `setUnlocked(true)` is never called. Full address reveal and ownership-chain access (the core Pro/Elite value proposition) are never shown to any user, including paying subscribers.
- **Fix:** Set `unlocked` based on the user's Investor subscription plan (Pro/Elite) or admin role.

## HIGH

### H1. syncMarketAnalytics — avg_price_per_sqft index misalignment
- **File:** `base44/functions/syncMarketAnalytics/entry.ts`
- **Root cause:** `values` and `sqfts` are built with separate `.filter()` calls, so their indices don't align. Dividing `values[i] / sqfts[i]` pairs the wrong property's price with the wrong square footage.
- **Fix:** Compute price/sqft per-property, then average.

### H2. NegotiationChat loads first thread for property without user filter
- **File:** `src/pages/NegotiationChat.jsx`
- **Root cause:** `NegotiationThread.filter({ property_id })` returns the first thread, which may belong to a different investor. RLS protects reads, but the UX shows the wrong conversation.
- **Fix:** Filter by `investor_id` or `seller_id` matching the current user.

### H3. Dead `secrets` param passed to scrapeSource
- **Files:** `runDailyScrapePipeline`, `scrapeProperties`, `validateSystem`
- **Root cause:** All pass `{ secrets, source }` to `scrapeSource`, whose signature is `({ source, url, distress_type, state })` — `secrets` is unused. Confusing dead code.
- **Fix:** Remove the `secrets` argument.

### H4. SellerPostProperty — no required-field validation
- **File:** `src/pages/SellerPostProperty.jsx`
- **Root cause:** `publish()` doesn't validate `address/city/state/zip_code` before calling `Property.create`. Empty fields produce a generic API error.
- **Fix:** Validate required fields and show a clear message.

## MEDIUM

### M1. createCheckoutSession accepts user_id from request body unverified
- Public-app design, but a user could pay for another user's subscription. Low impact (they're spending money, not stealing), but should bind to the authenticated user when available.

### M2. Bidding page doesn't hide the bid form for the property's seller
- Server blocks it, but the UI is confusing — seller sees a form that will always error.

### M3. Dead CSS — ~700 lines of HPI class definitions in index.css unused by current Tailwind pages
- Bundle bloat. The current pages use Tailwind utilities, not `.hero`, `.market-head`, etc.

### M4. Orphaned pages — Home.jsx, Properties.jsx, NegotiationAssistant.jsx exist but aren't routed
- Dead code, potential confusion.

## LOW

### L1. MobileNav has no Account/Alerts/Dashboard tab
### L2. LuxNav has no login/logout link
### L3. InvestorDashboard fetches 500 properties to map bid property IDs (workaround for lack of `$in` filter)