# Hidden Property Intel | Repair and Fast-Launch Control Packet

**Mission:** HPI-RECOVERY-20261016  
**Phase:** DISCOVERY → BRANCH REPAIR → VALIDATION (release NOT approved)  
**Source:** `XTREME-SYSTEMS/hidden-property-intel`  
**Base main:** `ad24e6f6656691fad8f6e4163a37b992cfb33a48` (2026-10-02)  
**Development branch:** `repair/hpi-evidence-first-20261016`  
**Production:** unchanged. No secret, DB, DNS, scheduled-job, billing, public-contact, merge or production deployment changes.

## Current evidence (2026-10-16)

- Live Base44 entity snapshot: 801 property records and 480 configured data sources. Of the 480, 303 had no last-run timestamp and 177 had last run more than 30 days earlier; all were labeled active.
- 271 sampled scrape jobs: 233 complete, 38 failed; latest recorded completion was 2026-09-14. Successful job status is not equivalent to fresh or verified property data.
- Prior SystemHealth record: overall CRITICAL; reported title-risk coverage 15%, image coverage 22%, 0 active deals. These are platform-generated metrics, not third-party property verification.
- Canonical GitHub source is a live 609-path React/Vite + Base44 app with Railway scraper and existing Vercel integration.
- Railway service `hidden-property-intel-scraper` (id `ae0a7cea-05c6-48f3-b387-ac78ffd97c47`, project `b68545a5-c9f8-482d-8e1b-4c1574f7af3b`) is deployed from main SHA `ad24e6f...`; deployment is marked SUCCESS but Oct 2 runtime logs show a startup exception: native WebSocket unavailable under Node v20.20.2.
- Railway service effective configuration has no cron schedule. Root `railway.json` contains a cron declaration, but it is not applied to the service.
- Vercel preview of development commits reports READY. Browser test redirected to Vercel login, so user-facing route/functionality testing is BLOCKED pending authorized preview access.
- Base44 scheduled-workflow runtime authentication is UNKNOWN. HPI Supabase project `eihkuzvgwvwszdjitdgd` was historically permission-denied in the connected account; recheck authorization before any migration.

## Implemented safely on branch

1. `base44/shared/healthMetrics.js`: pure evidence-first scorer; separates configured/active/fresh sources; uses persisted new/updated property counts rather than LLM-discovered raw counts; treats no 24h activity as critical; never changes historical failures.
2. `tests/healthMetrics.test.mjs`: ten deterministic tests, locally **10/10 PASS** with Node 22.16.0. Run `npm run test:health`.
3. `base44/functions/validateSystem/entry.ts`: admin-only, no scrape retries, no false completion, explicit dry-run, bounded entity reads, one health row only for normal mode.
4. `base44/workflows/System Validation.jsonc`: description matches evidence-only behavior.
5. `src/pages/AdminSystemTest.jsx`: no automatic invocation of live functions, because the old implementation could send customer communications, mutate records or deploy smart contracts and declare success merely for returning HTTP 200.
6. `src/pages/AdminSources.jsx`: caps bulk manual runs to ten sources; requires real HTTPS URL, never invents a government URL, and starts new sources inactive with no assumed health.
7. `base44/shared/scraper.ts`: rejects candidates lacking basic address/ZIP and specific source URL, and no longer auto-promotes existing property status merely because scraping returned data. Candidate URL is *not* independent proof; do not publish without evidence verification.
8. `railway/package.json`: Node 22+ engine constraint. `railway/Dockerfile`: Node 22 + reproducible npm ci fallback. Railpack currently active; effective runtime version must be independently checked after an approved isolated deploy.

## Blockers / release gates

| Gate | State | Required proof |
|---|---|---|
| Vercel UI bundle build | READY preview metadata | Check actual login, navigation, property search and mobile routes with authorized browser |
| Railway scraper startup | **FAIL** on production main | Isolated Node 22 run; no WebSocket exception; bounded synthetic source test |
| Railway scheduler | **FAIL** (no effective cron) | Verify single authoritative scheduler and successful run receipts before enabling |
| Base44 workflow identity | **UNKNOWN** | Test scheduled invocation of admin-gated diagnostic without widening anonymous service-role access |
| Source freshness | **FAIL** | One verified real record from one legal/accessible source, proper provenance, date and dedupe |
| HPI Supabase access | **BLOCKED/UNKNOWN** | Exact project access and schema read; never substitute X1 projects |
| Auth & tenant isolation | **UNKNOWN** | Independent anonymous/user/admin and cross-tenant negative tests, especially owner/title data |
| Stripe checkout | **UNKNOWN** | Verify actual Stripe prices and webhook idempotency. Public pricing $39/$79/$199 disagrees with webhook plan amounts $49/$149/$499 |
| Full app tests | **UNKNOWN** | npm build/lint/typecheck, browser tests, role coverage, synthetic call paths and rollback |
| Public production release | **BLOCKED** | Explicit approval, independent review, exact SHA, rollback evidence |

### Important security follow-ups

- `createCheckoutSession` trusts caller-supplied `user_id` and redirect URLs. Bind identity to the authenticated user, allowlist callback origins and verify live Stripe product mapping before charging.
- Owner fields and ownership-chain RLS must be assessed for authorized Pro/Elite access. Do not grant broad read permission merely to reveal paywalled PII.
- Scraped-owner contact data, skip tracing, probate outreach, foreclosure marketing, communication consent, opt-outs, and source licenses need jurisdiction- and purpose-specific review.
- Current admin system audit had static scores and old preflight paths; never use a self-certified 100/100 as production evidence.
- Existing convergence draft PR #38 has reusable control-plane work but is not production proof. Reconcile against the latest main instead of blindly merging stale migrations.

## Fast launch: narrowly scoped pilot first

**Product:** Subscription-based Florida Distressed Property Research; market as *source-linked research tools*, not guaranteed deals or verified investment returns.

1. **One authoritative data lane:** choose one access-permitted Florida county/clerk/tax or paid licensed source; store capture timestamp, property-specific source URL, immutable source reference and verification state. No thin scraped pages.
2. **One useful customer journey:** landing → filtered, verified property results → property details with explicit estimate/uncertainty labels → sign up → save property → opt-in alert. No automated seller contact or on-chain escrow in the pilot.
3. **One controlled integration canary:** Node22 worker executes a maximum-ten-record synthetic test in a staging data store; prove no duplicates, trace IDs, daily freshness and idempotent retries.
4. **One trusted subscription:** reconcile advertised vs Stripe prices, implement authenticated checkout/cancel/billing status and idempotent signed webhook, and complete test-mode transactions.
5. **One release dashboard:** monitor source yield, age, verified properties, user registrations, subscriptions, qualified investor research requests, churn and costs; release only after independently verified tests.
6. **Replicate:** adapt to more Florida counties or B2B investor teams only when licenses, quality, unit economics and data freshness pass.

**Fast monetization option:** paid verified research briefs or a controlled Pro-search pilot with invited investors, subject to real source quality and payment-flow validation. Existing contacts are not contacted without operator approval.

## Next permitted work

- Reconcile/merge the isolated fixes into a single *draft* PR without changing main.
- Re-check precise current Vercel preview SHA/build logs. For browser QA, use approved preview auth rather than weakening deployment protection.
- Inspect worker start path under Node 22 in an isolated runner; inspect source feasibility and verify a no-write dry-run fixture.
- Resolve remaining Stripe and RLS flaws in distinct safe code packets.
- **Approval later required** for production Railway version/config/cadence, Base44 deployment/scheduled workflow, Stripe live checkout, production DB/RLS, GitHub main merge and public release.

**Receipt:** branch-safe; unit tests 10/10 PASS; production operational status **NOT VERIFIED**, production unchanged. No continuous/background execution is implied by this document.
