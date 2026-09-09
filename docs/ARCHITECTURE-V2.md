# Hidden Property Intel — Full System Architecture (v2)

> End-to-end architecture for the AI-powered off-market distressed real estate platform.
> Authoritative reference for the Prime agent and the autonomous swarm to encode against.
> Last updated: 2026-09-09

---

## 1. Mission

Surface distressed and off-market properties **before they reach the MLS**, score them with AI,
and close them with on-chain smart-contract escrow — faster, cheaper, and more transparent than
the traditional process. Operate 24/7 via an autonomous swarm with human direction through Prime.

## 2. High-Level Topology

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (React + Vite + Tailwind, Base44-hosted)           │
│  V2 layout (Zillow-clean) · PWA · persona dashboards         │
│  Prime agent bubble (bottom-right) on every page             │
└───────────┬─────────────────────────────────┬───────────────┘
            │ SDK (base44.entities / functions) │
┌───────────▼─────────────────┐  ┌──────────────▼──────────────┐
│  BASE44 BaaS                 │  │  VERCEL ORCHESTRATOR (paid) │
│  - Entities (Postgres)       │  │  - Cron: swarm-cycle @5min   │
│  - Backend functions (Deno)  │  │  - Cron: code-cycle @5min   │
│  - Workflows (SWF + crons)   │  │  - AI Gateway (best-model)  │
│  - Agents (Prime)            │  │  - Sandbox + agents         │
│  - Auth / RLS                │  └──────────────┬──────────────┘
└──────┬───────────────────────┘                 │
       │ forced_function (zero-credit)          │
┌──────▼──────────┐  ┌──────────────┐  ┌────────▼─────────┐
│  SUPABASE (paid) │  │  RAILWAY     │  │  GITHUB (2-way)  │
│  - Data warehouse│  │  - Scraper   │  │  - Code sync      │
│  - swarm log    │  │  - Cloud     │  │  - PR auto-merge  │
└─────────────────┘  │    browser   │  └───────────────────┘
                     └─────────────┘
```

## 3. Frontend

### 3.1 Two parallel surfaces
- **V2 (primary, public):** `V2Layout` — Zillow/Redfin-clean, blue accent (`--z-blue #006aff`),
  scoped CSS in `src/styles/v2.css` under `.hpi-v2`. Home, listings, property detail, smart contracts,
  process, pricing, about, blog, contact, deal calculator.
- **Legacy luxury (being retired):** `LuxLayout` — black/gold. Admin + authenticated dashboards still
  use it until rebranded.

### 3.2 Routes (src/App.jsx)
- `/` → V2Home · `/v2/listings` → V2Listings · `/v2/properties/:id` → V2PropertyDetail
- `/smart-contracts` · `/process` · `/pricing` · `/about` · `/blog` · `/contact` · `/deal-calculator`
- `/v2/app/*` → PWA persona dashboards (investor/agent/seller/broker) via `V2AppShell`
- `/admin/*` → admin backoffice (ProtectedRoute, admin role)
- Auth: `/login` `/register` `/forgot-password` `/reset-password`

### 3.3 Prime agent bubble
`src/components/PrimeBubble.jsx` — fixed bottom-right, opens a chat panel wired to the `prime` agent
via `base44.agents.*` SDK. Appears on every V2 page. Lets the user direct the swarm in natural language.

## 4. Data Model (Entities)

Core: **Property** (the inventory), **PropertyScore**, **PropertyImage**, **OwnershipChain**, **Owner**,
**TitleRisk**, **DataSource**, **ScrapeJob**.
Marketplace: **Investor**, **Seller**, **Wholesaler**, **Bid**, **Deal**, **SmartContract**,
**DigitalSignature**, **NegotiationThread**, **SavedSearch**, **Watchlist**, **DealAlert**, **AlertPreference**.
Comms/CRM: **InvestorLead**, **Campaign**, **CommsEvent**, **CommunicationTemplate**, **Conversation**, **PhoneNumber**.
Commerce: **Subscription**.
Autonomy: **SwarmCycle**, **AutonomousCycle**, **SystemGap**, **SystemHealth**, **ShadowReport**.
Platform: **User** (built-in), **ApiKey**.

All entities carry built-in `id`, `created_date`, `updated_date`, `created_by_id`. RLS is configured
per entity (admin-only for system entities; ownership-scoped for user data).

## 5. Backend Functions (Deno, base44/functions/)

~90 functions. Key groups:
- **Scraping:** scrapeProperties, scrapeProbateRecords, scrapePropertyImages, fetchPropertyImages,
  runDailyScrapePipeline, manualScrapeTargets, ingestPropertyImages.
- **Enrichment:** runMasterEnrichment, enrichProperties, scoreProperty, scoreAllActiveProperties,
  estimateRehabCosts, assessPropertyCondition, geocodeProperties, populateOwnershipChains,
  skipTraceOwner, searchNextOfKin, findHeirsForProperty, crossReferenceProperties, validateEnrichment.
- **Marketplace:** placeBid, processProxyBids, acceptBid, expireOldBids, matchInvestorSeller,
  matchAndNotifyAlerts, sendBidNotifications.
- **Smart contracts:** generateSmartContract, deploySmartContract, interactWithContract,
  auditSmartContract, automateContractCreation, syncAllContractStates, generateContractDocuments,
  signDocument, getSmartContractDashboard, generateWallet, importWallet.
- **Outreach/Comms:** generateOwnerOutreach, generateInvestorOutreach, outreachSellers,
  outreachInvestors, outreachProbateHeirs, runDailyOutreach, sendOutreach, sendNegotiationMessage,
  aiNegotiationAssistant, generateReplyEmail, captureLead, configureFollowUp, processFollowUps,
  autonomousFollowUp, xtremeComms, provisionNumbers, lookupNumbers, validateEmailQuality.
- **Autonomy:** autonomousSwarmCycle, autonomousCodeOrchestrator, autonomousCodePush,
  autonomousMasterLoop, shadowOrchestrator, shadowDealHunt, generateMorningBrief, validateSystem,
  systemPreflight.
- **Integrations:** aiGatewayGenerate, syncToSupabase, syncFromSupabase, syncFromRailway,
  syncGoogleSheet, syncToGoogleSheets, syncGoogleCalendar, syncSearchConsole, syncMarketAnalytics,
  dynamicSitemap, submitSitemap.
- **Commerce/Platform:** createCheckoutSession, handleStripeWebhook, manageApiKeys, edenVoiceConfig,
  agentAPI, generateLegalDisclosures, auditFairHousing, optimizeListing, optimizePortfolio,
  optimizeSellerTiming, generatePropertyDescription, predictDistress, expireStaleProperties,
  processDraftProperties, normalizeAddresses.

Shared logic lives in `base44/shared/` (scoring, enrichment, bidding, escrow, outreach, supabase, aiGateway, browserEngine).

## 6. Workflows (base44/workflows/)

Cron-driven, SWF format:
- **Autonomous Code Loop** — every 5 min → autonomousCodeOrchestrator (Planner→Coder→Validator→GitHub push).
- **AGI Swarm Cycle** — every 30 min → autonomousSwarmCycle (free deterministic heartbeat).
- **Daily Scrape Pipeline**, **Property Enrichment Engine**, **Daily Outreach**, **Daily Follow-Up Engine**,
  **Deal Alert Matcher**, **Smart Contract Chain Sync**, **Shadow Orchestrator**, **Search Console Sync**,
  **Google Sheet Sync** (30 min), **Property Image Ingestion**, etc.

## 7. The AGI Swarm (autonomous 24/7 operation)

### 7.1 Swarm cycle (deterministic, zero-credit)
`autonomousSwarmCycle` reads national coverage from Base44, decides the highest-impact action
(enrich > score > scrape > alert > validate), executes via `forced_function` (no LLM = zero Base44
credits), logs to Supabase. Specialist agents: ARCHITECT (enrich), ORACLE (score), SENTINEL (scrape),
ANALYST (alerts), HEALER (validate).

### 7.2 Autonomous code loop
`autonomousCodeOrchestrator` runs a Planner→Coder→Validator pipeline against a master blueprint of
unbuilt features, generates production code, validates it against framework conventions, and pushes
to GitHub via `autonomousCodePush` (2-way sync). `SystemGap` entities track each gap from open→speced→
coded→validated→closed. No manual approval gate.

### 7.3 Vercel orchestrator (paid, primary driver)
`vercel-orchestrator/` is a separate Vercel project:
- `vercel.json` crons: `/api/swarm-cycle` @5min, `/api/autonomous-code-cycle` @5min,
  `/api/trigger-scrape` @6h, `/api/mirror-to-supabase` @30min.
- `swarm-cycle.js` — deterministic coordinator calling Base44 (status + forced exec), Supabase (log),
  Railway (scrape), optional Vercel AI Gateway (USE_LLM=true).
- **Deployment gap:** This only runs once deployed to Vercel with env vars set
  (`BASE44_APP_URL`, `BASE44_SYNC_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`,
  `RAILWAY_SCRAPER_URL`, `RAILWAY_TOKEN`, `AI_GATEWAY_API_KEY`). This is a deploy step on the user's
  side — the code is complete and ready.

## 8. External Infrastructure

- **Supabase** (paid): data warehouse, `swarm_cycles` log table, mirror. DDL in `base44/shared/supabaseDDL.sql`.
- **Railway** (paid): scraper cron + cloud browser engine (stealth scraping, anti-bot).
- **Vercel** (paid): orchestrator crons + AI Gateway (best-model routing across 52 categories).
- **Polygon**: smart-contract escrow (USDC stablecoin, ~$1 gas). `escrowContract.ts` shared module.
- **Telnyx**: SMS/MMS/voice for outreach. `TELNYX_API_KEY` secret.
- **Stripe**: subscriptions (Starter $49, Pro $149, Elite $499/mo). Test mode, unclaimed.
- **GitHub**: 2-way repo sync for the autonomous code loop.

## 9. The Prime Agent

`base44/agents/prime.jsonc` — the user's command interface to the whole system.
- Lives as a floating bubble on every page (`PrimeBubble.jsx`).
- Tool access: swarm functions, scrape/enrich/score, AI gateway, Supabase sync, shadow intel,
  validation, smart contracts, lead capture, and CRUD on key entities.
- Can direct the swarm, queue work via `SystemGap`, generate docs, and trigger any pipeline.
- Acts as the current app user (admin powers require admin login).

## 10. Security & RLS

- System entities (SwarmCycle, SystemGap, DataSource, ShadowReport, etc.): admin-only.
- User data (Investor, Seller, Bid, Deal, DealAlert): ownership-scoped (`data.user_id == {{user.id}}`).
- Public reads where appropriate (Property, OwnershipChain, PropertyImage, Seller).
- Secrets managed via Base44 Secrets; never exposed to the frontend.

## 11. Deployment & 24/7 Operation

1. **Base44 app** publishes to `https://my-property-intel.base44.app` (live).
2. **Vercel orchestrator** — deploy `vercel-orchestrator/` to Vercel, set env vars, crons go live.
3. **Supabase** — run DDL, confirm `swarm_cycles` table.
4. **Railway** — scraper service running.
5. Base44 workflows (Autonomous Code Loop, AGI Swarm Cycle) are already active and firing.
6. Prime agent available in-app for directed operation.

Once Vercel is deployed, the system is fully autonomous: scrapes → enriches → scores → alerts →
codes → deploys, 24/7, with Prime as the human direction layer.

## 12. Rebrand Status (V2)

Done: Home, Listings, Property Detail, Smart Contracts, Process, Pricing, About, Blog, Contact,
Deal Calculator, Contact (all under V2Layout).
Remaining: Property Detail (old /properties/:id), Investor/Seller/Admin dashboards, Calculators,
Bidding, LaunchElite, Eden pages, admin sub-pages. Sequence continues on request.