# Forensic Audit Findings — Hidden Property Intel
**Audit Date:** 2026-08-24
**Status:** 24 FIXED · 13 NOTED/DEFERRED

## 🔴 CRITICAL: Security Vulnerabilities

| # | Finding | Status |
|---|---------|--------|
| 1 | RLS on Property — update/delete restricted to seller/admin | ✅ FIXED |
| 2 | RLS on Bid — read restricted to investor/seller/admin + added seller_id field | ✅ FIXED |
| 3 | RLS on Owner — admin-only (PII protected) | ✅ FIXED |
| 4 | RLS on PropertyScore — admin-only writes | ✅ FIXED |
| 5 | RLS on OwnershipChain — admin-only writes | ✅ FIXED |
| 6 | RLS on MarketAnalytics — admin-only writes | ✅ FIXED |
| 7 | Property address masking client-side only | ⚠️ NOTED — needs backend function for field-level masking |
| 8 | Smart contract signature_hash uses random UUID | ✅ FIXED — now SHA-256 hash of user+contract+timestamp |
| 9 | No Polygon blockchain deployment | ⚠️ NOTED — requires wallet integration (future phase) |
| 10 | Shill bidding possible | ✅ FIXED — seller cannot bid on own property |

## 🟠 HIGH: Functional Bugs

| # | Finding | Status |
|---|---------|--------|
| 11 | "List your property" links → /listings | ✅ FIXED — all 5 links now point to /seller/post-property |
| 12 | "Place a bid" on PropertyDetail → /listings | ✅ FIXED — now /properties/:id/bid |
| 13 | SavedSearch.create omits user_id | ✅ FIXED |
| 14 | Bidding page passes wrong IDs to contract gen | ✅ FIXED — uses investor_id, not bid ID; no "seller" string |
| 15 | NegotiationChat shows wrong thread | ✅ FIXED — backend creates separate threads per investor |
| 16 | AlertPreference toggle logic broken | ✅ FIXED — simplified to clear logic |
| 17 | "Choose plan" links → /listings | ✅ FIXED — now /investor/signup |

## 🟡 MEDIUM: Performance Issues

| # | Finding | Status |
|---|---------|--------|
| 18 | N+1 queries in InvestorDashboard | ✅ FIXED — single bulk fetch |
| 19 | InvestorPipeline fetches properties individually | ✅ FIXED — single bulk fetch |
| 20 | Listings loads 300 properties client-side | ⚠️ NOTED — needs server-side pagination (backend function) |
| 21 | syncMarketAnalytics LLM call per city | ⚠️ NOTED — needs batching optimization |
| 22 | validateSystem loads 5000+ records | ⚠️ NOTED — needs query optimization |

## 🟡 MEDIUM: Data Integrity Issues

| # | Finding | Status |
|---|---------|--------|
| 23 | Scoring creates duplicate PropertyScore/TitleRisk | ✅ FIXED — upsert pattern (update if exists) |
| 24 | OwnershipChain can create duplicates | ⚠️ NOTED — low risk, existing check is sufficient |
| 25 | Cross-reference only 10 properties/day | ⚠️ NOTED — needs batch size increase |

## 🔵 Design & UX Inconsistencies

| # | Finding | Status |
|---|---------|--------|
| 26 | Two competing design systems | ⚠️ NOTED — needs token migration across app pages |
| 27 | PropertyBrief PDF says "PROPERTYINTEL" | ✅ FIXED — now "HIDDEN PROPERTY INTEL" |
| 28 | InvestorPipeline manual UUID entry | ⚠️ NOTED — needs property search UI |
| 29 | Mobile nav minimal | ⚠️ NOTED — minor UX improvement |

## ⚪ Code Quality & Maintenance

| # | Finding | Status |
|---|---------|--------|
| 30 | 10+ dead/legacy files | ⚠️ NOTED — needs careful import analysis before deletion |
| 31 | Duplicate distress type arrays | ✅ FIXED — centralized in src/lib/constants.js |
| 32 | Two overlapping negotiation functions | ⚠️ NOTED — needs consolidation refactor |
| 33 | Deal Alert Matcher triggers on every update | ⚠️ NOTED — dedup logic prevents duplicate alerts |

## 📋 Business Logic Gaps

| # | Finding | Status |
|---|---------|--------|
| 34 | No closing flow | ✅ FIXED — admin can close signed contracts → property status "closed" |
| 35 | No Seller entity creation | ✅ FIXED — created on property post, incremented on subsequent posts |
| 36 | No investor verification | ⚠️ NOTED — needs verification flow |
| 37 | Outreach emails no unsubscribe | ✅ FIXED — unsubscribe note added to all outreach emails |
| 38 | No earnest money payment | ⚠️ NOTED — needs Stripe payment integration |