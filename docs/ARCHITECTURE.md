# Hidden Property Intel — Deep Architecture Blueprint

> The single source of truth for the platform's entities, functions, workflows, agents, data flow,
> the Vercel autonomous coding loop, and the Zillow/Redfin-clean design system.
> Every feature built after this doc must trace back to a section here.

---

## 0. North Star

**Hidden Property Intel (HPI)** is an AI-powered real estate investment platform that:
1. **Discovers** off-market distressed properties (court records, assessor, tax, code violations).
2. **Enriches** each property with 15-category master data (ATTOM, VISIONCORTEX, skip-trace).
3. **Scores** every deal with a multi-signal distress + opportunity model.
4. **Engages** owners, heirs, and investors with multi-channel AI outreach (Eden Skye).
5. **Closes** with on-chain Polygon escrow + digital signatures + title/notary workflow.

The platform is a **public app** (no login required to browse) with gated investor/seller/admin portals.

---

## 1. System Layers

```
┌─────────────────────────────────────────────────────────┐
│  PRESENTATION  (React + Tailwind, Zillow/Redfin-clean)   │
│  Public site · Investor portal · Seller portal · Admin   │
└───────────────┬──────────────────────────────────────────┘
                │  base44 SDK (entities, functions, integrations)
┌───────────────▼──────────────────────────────────────────┐
│  APPLICATION LOGIC  (Base44 backend functions + agents)   │
│  Scraping · Enrichment · Scoring · Outreach · Contracts   │
└───────────────┬──────────────────────────────────────────┘
                │  workflows (scheduled + event-triggered)
┌───────────────▼──────────────────────────────────────────┐
│  DATA  (Base44 entities + Supabase mirror)               │
│  Property · Owner · Deal · Bid · SmartContract · etc.    │
└───────────────┬──────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────┐
│  EXTERNAL SERVICES                                       │
│  Bright Data · ATTOM · VISIONCORTEX · Telnyx · Polygon    │
│  Stripe · Google Workspace · AI Gateway (Vercel)         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Entity Map (Data Model)

### 2.1 Core Property Data
| Entity | Role | Key Fields |
|--------|------|-----------|
| **Property** | Central record | address, distress_type, estimated_value, arv, property_score, enrichment_data, foreclosure_status, occupancy_status |
| **Owner** | Property owner + next of kin | name, contact, deceased, heirs[] |
| **OwnershipChain** | Title history | transfers[] (from/to/date/price) |
| **PropertyImage** | Media library | url, type, caption, source |
| **PropertyScore** | Scoring snapshot | overall_score, distress_severity, roi, factors |
| **TitleRisk** | Title/lien risk | liens, judgments, encumbrances |

### 2.2 Deal & Transaction
| Entity | Role |
|--------|------|
| **Deal** | Pipeline stage (lead → closing) |
| **Bid** | Investor offers (initial/counter/proxy) |
| **SmartContract** | On-chain Polygon escrow |
| **DigitalSignature** | Document signing records |
| **NegotiationThread** | Buyer↔seller messages |

### 2.3 People
| Entity | Role |
|--------|------|
| **Investor** | Buyer profile + subscription |
| **InvestorLead** | Prospective investor (outbound) |
| **Seller** | Property owner listing |
| **Wholesaler** | Assignment middleman |
| **Campaign** | Outreach campaign config |

### 2.4 Sourcing & Ops
| Entity | Role |
|--------|------|
| **DataSource** | Scrape source config (county, court, assessor) |
| **ScrapeJob** | Individual scrape run |
| **AutonomousCycle** | Shadow orchestrator run log |
| **ShadowReport** | Autonomous intelligence brief |
| **SystemHealth** | Live system status |
| **ApiKey** | Multi-tenant gateway auth |
| **PhoneNumber** | Telnyx number provisioning |
| **CommsEvent** | Email/SMS/voice event log |
| **Conversation** | Multi-channel thread |

### 2.5 User-Facing
| Entity | Role |
|--------|------|
| **SavedSearch** | Investor alert filters |
| **AlertPreference** | Notification settings |
| **Watchlist** | Tracked properties |
| **DealAlert** | Match notifications |
| **MaintenanceRequest** | Property mgr tickets |
| **MarketAnalytics** | ZIP/county trends |
| **Subscription** | Stripe billing record |

---

## 3. Function Map (Backend Logic)

### 3.1 Sourcing Pipeline
```
runDailyScrapePipeline ──► scrapeProperties ──► normalizeAddresses
        │                                          │
        ├──► scrapeProbateRecords                  ▼
        ├──► manualScrapeTargets            geocodeProperties
        └──► scrapeInvestors                        │
                                                   ▼
                                          processDraftProperties
```

### 3.2 Enrichment Pipeline
```
enrichProperties ──► runMasterEnrichment ──► validateEnrichment
        │
        ├──► fetchPropertyImages / scrapePropertyImages / ingestPropertyImages
        ├──► assessPropertyCondition (VISIONCORTEX)
        ├──► skipTraceOwner
        ├──► populateOwnershipChains
        └──► crossReferenceProperties
```

### 3.3 Scoring & Intelligence
```
scoreProperty ──► scoreAllActiveProperties
predictDistress (multi-signal OR/AND model)
estimateRehabCosts
optimizeListing / optimizePortfolio / optimizeSellerTiming
assessDealRisk
auditFairHousing
```

### 3.4 Outreach & Comms
```
generateOwnerOutreach / generateInvestorOutreach / generateReplyEmail
sendOutreach ──► outreachSellers / outreachInvestors / outreachProbateHeirs
xtremeComms (Telnyx SMS/voice)
processFollowUps / autonomousFollowUp / configureFollowUp
validateEmailQuality
```

### 3.5 Deal & Closing
```
placeBid ──► processProxyBids ──► acceptBid ──► sendBidNotifications
matchInvestorSeller ──► matchAndNotifyAlerts
generateSmartContract ──► deploySmartContract ──► interactWithContract
auditSmartContract / syncAllContractStates
generateContractDocuments / generateLegalDisclosures / signDocument
aiNegotiationAssistant / sendNegotiationMessage
```

### 3.6 Shadow (Autonomous)
```
shadowOrchestrator ──► autonomousMasterLoop
shadowDealHunt
generateMorningBrief
systemPreflight / validateSystem
findHeirsForProperty / searchNextOfKin
```

### 3.7 Sync & Billing
```
syncToSupabase / syncFromSupabase / syncFromRailway
syncToGoogleSheets / syncGoogleCalendar / syncSearchConsole
createCheckoutSession / handleStripeWebhook
submitSitemap / dynamicSitemap
manageApiKeys / provisionNumbers / lookupNumbers / edenVoiceConfig
```

---

## 4. Workflow Map (Automations)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| Daily Scrape Pipeline | scheduled (daily) | runDailyScrapePipeline |
| Property Enrichment Engine | entity (Property created) | runMasterEnrichment |
| Property Image Scraper | scheduled | scrapePropertyImages |
| Property Image Ingestion | entity | ingestPropertyImages |
| Draft Property Processor | entity | processDraftProperties |
| Probate Pipeline | scheduled | scrapeProbateRecords + findHeirs |
| Daily Outreach | scheduled | runDailyOutreach |
| Daily Follow-Up Engine | scheduled | processFollowUps |
| Deal Alert Matcher | entity (Property scored) | matchAndNotifyAlerts |
| Shadow Orchestrator | scheduled (hourly) | shadowOrchestrator |
| Smart Contract Chain Sync | scheduled | syncAllContractStates |
| Search Console Sync | scheduled | syncSearchConsole |
| Property Cross-Reference | entity | crossReferenceProperties |
| System Validation | scheduled | validateSystem |

---

## 5. Agent Map

| Agent | Channel | Role |
|-------|---------|------|
| **Eden Skye** | in-app, WhatsApp (future) | Executive assistant — comms, scheduling, deal intel |
| **admin_assistant** | in-app | Admin operations — run scrapes, heal systems, generate reports |

Both agents have full read/write/delete/execute across all entities and functions.

---

## 6. Data Flow — End to End

```
1. DISCOVER
   DataSource (court/assessor) → scrapeProperties → Property (draft)
   → normalizeAddresses → geocodeProperties → processDraftProperties → Property (active)

2. ENRICH
   Property (active) triggers → runMasterEnrichment
   → ATTOM (9,000 attrs) + VISIONCORTEX (condition) + skipTrace + ownershipChain
   → Property (enriched) + PropertyScore + PropertyImage

3. SCORE
   scoreProperty + predictDistress (multi-signal OR/AND)
   → Property (scored) + PropertyScore snapshot
   → triggers Deal Alert Matcher → DealAlert → AlertPreference → email/push

4. ENGAGE
   Campaign → generateOwnerOutreach → sendOutreach (email/SMS/voice)
   → Conversation + CommsEvent
   → inbound reply → generateReplyEmail → autonomousFollowUp

5. DEAL
   Investor → placeBid → Bid → matchInvestorSeller → Deal (lead→underwriting→offer→contract)
   → aiNegotiationAssistant → NegotiationThread

6. CLOSE
   generateSmartContract → deploySmartContract (Polygon) → SmartContract (deployed)
   → generateContractDocuments → signDocument → DigitalSignature
   → interactWithContract (fund escrow) → SmartContract (funded→closed)
   → syncAllContractStates

7. SHADOW (always-on)
   shadowOrchestrator (hourly) → autonomousMasterLoop
   → shadowDealHunt (finds deals) → generateMorningBrief (daily report)
   → systemPreflight (health) → validateSystem
```

---

## 7. External Service Map

| Service | Purpose | Secret |
|---------|---------|--------|
| **Bright Data** | Stealth scraping of protected court/assessor sites | BROWSER_ENGINE_API_KEY/URL |
| **ATTOM** | 9,000-attribute property enrichment | AI_GATEWAY_API_KEY (proxy) |
| **VISIONCORTEX** | Computer-vision property condition scoring | VISIONCORTEX_API_KEY |
| **Telnyx** | SMS/voice/MMS comms | TELNYX_API_KEY |
| **Polygon** | Smart-contract escrow blockchain | POLYGON_RPC_URL / POLYGON_PRIVATE_KEY |
| **Stripe** | Subscription billing | STRIPE_SECRET_KEY |
| **Supabase** | Data mirror / analytics warehouse | SUPABASE_URL/KEYS |
| **Railway** | Scraper cron workers | RAILWAY_TOKEN |
| **Google Workspace** | Calendar, Sheets, Gmail, Search Console | OAuth connectors |
| **AI Gateway (Vercel)** | Multi-model LLM routing (Perplexity, Claude, etc.) | AI_GATEWAY_API_KEY |

---

## 8. Vercel Autonomous Coding Loop

> **Goal:** the platform codes itself. Agents generate code, validate it, deploy to a
> Vercel sandbox preview, run tests, and promote to production on green — fully autonomous.

### 8.1 Architecture

```
┌──────────────────────────────────────────────────────────┐
│  TRIGGER                                                  │
│  • Scheduled (nightly build queue)                        │
│  • GitHub issue labeled "agent-build"                     │
│  • Admin "Generate Feature" button in HPI                 │
└───────────────┬──────────────────────────────────────────┘
                ▼
┌──────────────────────────────────────────────────────────┐
│  1. PLANNER AGENT  (Claude Opus via AI Gateway)           │
│  Reads this ARCHITECTURE.md + the feature request.        │
│  Outputs: task breakdown (file list, function list,       │
│  entity changes, test plan) as structured JSON.           │
└───────────────┬──────────────────────────────────────────┘
                ▼
┌──────────────────────────────────────────────────────────┐
│  2. CODER AGENT  (Claude Sonnet via AI Gateway)           │
│  For each task: generates code, writes to a git branch.  │
│  Follows: this doc's entity/function conventions,        │
│  Zillow/Redfin design system (§9), Base44 SDK patterns.   │
└───────────────┬──────────────────────────────────────────┘
                ▼
┌──────────────────────────────────────────────────────────┐
│  3. VALIDATOR AGENT  (static analysis + runtime)          │
│  • ESLint + build check (vite build)                      │
│  • Import resolution check (no missing imports)           │
│  • Entity schema validation                              │
│  • Function smoke test (test_backend_function)            │
│  • Design-token compliance (no hardcoded colors)           │
│  Outputs: pass/fail per check + diff.                    │
└───────────────┬──────────────────────────────────────────┘
                ▼
┌──────────────────────────────────────────────────────────┐
│  4. SANDBOX DEPLOY  (Vercel preview)                     │
│  Push branch → Vercel auto-creates preview deployment.    │
│  Preview URL stored in AutonomousCycle record.            │
└───────────────┬──────────────────────────────────────────┘
                ▼
┌──────────────────────────────────────────────────────────┐
│  5. TEST RUNNER  (Playwright + visual)                   │
│  • E2E flow tests against preview URL                     │
│  • Screenshot diff vs baseline                           │
│  • Lighthouse perf/SEO/a11y score                         │
│  Outputs: test report JSON.                              │
└───────────────┬──────────────────────────────────────────┘
                ▼
        ┌───────┴───────┐
        ▼               ▼
   ALL GREEN        FAILURES
        │               │
        ▼               ▼
  6. PROMOTE       7. FEEDBACK LOOP
  Merge to main    Validator sends failures
  → Vercel prod    back to Coder Agent with
  deploy.           errors → regenerate →
                   re-validate (max 3 rounds).
```

### 8.2 Vercel Project Setup

```jsonc
// vercel.json (in-repo)
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "git": {
    "deploymentEnabled": true
  },
  "github": {
    "silent": false,
    "autoAlias": false
  },
  "env": {
    "VITE_BASE44_APP_ID": "@base44_app_id"
  }
}
```

### 8.3 Autonomous Cycle Record

Each autonomous run is stored as an **AutonomousCycle** entity:
```
{
  trigger_source: "scheduled" | "issue" | "admin_button",
  feature_request: "string",
  plan: { tasks: [...], files: [...], tests: [...] },
  branch: "agent/feature-slug",
  preview_url: "https://xxx.vercel.app",
  validation: { lint: pass, build: pass, tests: pass },
  test_report: { e2e: pass, lighthouse: 92 },
  status: "planning" | "coding" | "validating" | "preview" | "testing" | "promoted" | "failed",
  rounds: 1,
  pr_url: "..."
}
```

### 8.4 Safety Rails
- **Max 3 regeneration rounds** per feature — then human review.
- **Never auto-merge** to main without all checks green.
- **Never touch** auth, billing, or smart-contract code without explicit admin approval.
- **Diff review** — Validator posts the full diff to the admin dashboard before promote.
- **Rollback** — every promote keeps the previous deployment alias for instant rollback.

### 8.5 Secrets for the Loop
| Secret | Use |
|--------|-----|
| `AI_GATEWAY_API_KEY` | LLM calls (Planner, Coder, Validator) |
| `VERCEL_TOKEN` | Deploy + promote via Vercel API |
| `GITHUB_TOKEN` | Branch + PR creation |
| (existing) | Base44, Supabase, etc. |

---

## 9. Design System — Zillow/Redfin Clean

> Target: light, spacious, consumer-friendly, large property cards, big search.
> Move away from the current dark-gold editorial luxury aesthetic toward a clean MLS feel.

### 9.1 Color Tokens
```css
:root {
  --background: 0 0% 100%;          /* #ffffff */
  --foreground: 222 47% 11%;        /* #0f172a slate-900 */
  --card: 0 0% 100%;
  --muted: 210 40% 96%;             /* #f1f5f9 slate-100 */
  --muted-foreground: 215 16% 47%;  /* #64748b slate-500 */
  --border: 214 32% 91%;            /* #e2e8f0 slate-200 */
  --primary: 222 47% 11%;           /* slate-900 (buttons) */
  --primary-foreground: 0 0% 100%;
  --accent: 142 71% 45%;            /* #16a34a green-600 (CTA accent) */
  --accent-foreground: 0 0% 100%;
  --ring: 142 71% 45%;
  --radius: 0.5rem;
}
```

### 9.2 Typography
- **Headings:** Inter 700/800, tight letter-spacing (-0.02em)
- **Body:** Inter 400/500, 1.6 line-height
- **Mono:** ui-monospace (for data/addresses)

### 9.3 Component Targets
| Component | Spec |
|-----------|------|
| **PropertyCard** | 16:9 image, price bold 22px, address 14px muted, beds/baths/sqft row, distress badge top-left, score chip top-right, hover lift 2px |
| **SearchBar** | full-width, pill-shaped, location input + filters button + search button, sticky on scroll |
| **FilterSidebar** | 280px, collapsible sections, range sliders + checkboxes, "Apply" sticky bottom |
| **MapResults** | split view — 50% list / 50% Leaflet map, pins with price labels |
| **PropertyDetail** | hero gallery, sticky price bar, tabbed sections (overview, comps, distress, history), sidebar with score + CTA |
| **AdminCommandBar** | top sticky, global search (Cmd+K), category pills, Eden Skye bubble right |
| **AdminSidebar** | 240px, grouped workflow categories, active state accent-green left border |

### 9.4 Spacing & Density
- Page padding: 24px desktop, 16px mobile
- Card padding: 20px
- Section gap: 32px
- Grid: 4-col desktop → 2-col tablet → 1-col mobile
- Max content width: 1400px

### 9.5 Motion
- Hover lift: `translateY(-2px)` + shadow, 200ms ease
- Card image zoom on hover: `scale(1.03)`, 300ms
- Page transitions: fade 150ms
- No heavy parallax or cinematic effects — keep it fast and clean

---

## 10. Implementation Roadmap

### Phase 1 — Foundation (this doc + design tokens)
- [x] This architecture doc
- [ ] Apply Zillow/Redfin design tokens to `src/index.css`
- [ ] Rebuild `PropertyCard` to clean spec
- [ ] Rebuild `SearchBar` + `FilterSidebar`

### Phase 2 — Public Site Redesign
- [ ] LuxuryHome → clean home with big search + featured listings
- [ ] Listings → split map/list view
- [ ] PropertyDetail → tabbed clean layout
- [ ] Calculators, Pricing, Blog, About, Contact

### Phase 3 — Portal Redesign
- [ ] InvestorDashboard → clean investor command center
- [ ] SellerDashboard → clean seller tools
- [ ] AdminShell → modern command center (Zillow-clean + pro density)

### Phase 4 — Vercel Autonomous Loop
- [ ] Set up Vercel project + preview deploys
- [ ] Build Planner + Coder + Validator agents (Base44 agents)
- [ ] Wire AutonomousCycle entity + admin "Generate Feature" button
- [ ] Test full loop on a sample feature

### Phase 5 — New Capabilities (from PropertyRadar 5.0 clone)
- [ ] Court-sourced divorce + eviction scrapers
- [ ] Multi-signal OR/AND distress scoring
- [ ] "Plays" campaign templates
- [ ] 300+ filter criteria builder

---

## 11. Conventions

- **Entities:** full JSON schema in `base44/entities/<Name>.jsonc`, no placeholders.
- **Functions:** `base44/functions/<name>/entry.ts`, shared logic in `base44/shared/`.
- **Frontend:** `@/` alias imports, shadcn/ui + Tailwind, lucide-react icons only.
- **Design tokens:** only `src/index.css` + `tailwind.config.js`, no hardcoded colors in JSX.
- **No `require()`** — ESM only (Vite).
- **Auth:** platform-owned, never implement backend auth logic.
- **Every new page** gets a Route in `src/App.jsx` in the same batch.

---

_End of architecture doc. This is the blueprint — all future work traces back here._