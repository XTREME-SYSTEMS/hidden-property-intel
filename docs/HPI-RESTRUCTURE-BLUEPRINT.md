# Hidden Property Intel — Restructure & Re-Platform Blueprint

> The master plan for turning HPI into a Zillow-clean, PropertyRadar-powered,
> AGI-swarm-driven distressed-property intelligence platform. This is the
> "submit" deliverable: the architecture, the clone targets, the build order,
> and the autonomy layer.

---

## 1. Mission

Move **all** content and data from the legacy luxury site into the new V2
(Zillow-clean) design, adopt the best features of the top real-estate
platforms, wire deep scraping + enrichment providers, install an AGI swarm
modeled on Vision Cortex, and route every AI task through the Vercel AI
Gateway (Perplexity + every other major LLM). Ship an installable PWA now and
a native iOS/Android build next.

---

## 2. Current State (post V2 home-page switch)

- ✅ V2 Zillow-clean homepage live at `/` (hero, trending carousel, BuyAbility, spot cards, footer)
- ✅ Vercel AI Gateway wired (`aiGatewayGenerate` + `AI_GATEWAY_API_KEY`)
- ✅ PWA manifest + service worker + `PWAInstall` component exist
- ✅ 85+ backend functions, 20+ workflows, 30+ entities already built
- ✅ Stripe (test), Polygon escrow, Supabase, Google connectors authorized
- ⏳ V2 styling only on the homepage — all other pages still use the luxury theme
- ⏳ No AGI swarm, no Perplexity models, no native mobile build

---

## 3. Platforms to Clone (feature parity targets)

| # | Platform | What to clone into HPI | HPI module |
|---|----------|------------------------|-----------|
| 1 | **PropertyRadar 5.0** | Court-sourced divorce/probate/eviction leads, multi-signal OR/AND distress scoring, relatives/next-of-kin, "Plays" (ready-to-run campaigns) | Distress Tracker + Shadow Command + Campaigns |
| 2 | **PropStream** | 120+ list filters, comps engine, AI property insights, 10K exports/mo | Listings + PropertyDetail + Filters |
| 3 | **DealMachine** | Mobile driving-for-dollars capture, bundled skip tracing, drive-and-mail loop | Mobile app + `skipTraceOwner` |
| 4 | **HomeSage.ai** | Computer vision on every listing, investment-opportunity scoring, MCP server | VISIONCORTEX + `assessPropertyCondition` + enrichment |
| 5 | **BatchData** | API-first 600+ data points, skip-trace enrichment, MCP-for-Claude | `ApiKeys` + data layer |
| 6 | **ATTOM** | 9,000 attributes/property, foreclosure + default-propensity, 200M permits, neighborhood data | Master enrichment (15 categories) |

---

## 4. Scraping Systems to Adopt

| System | Role | Why |
|--------|------|-----|
| **Bright Data** | Hard targets (county courts, assessor portals) | 98% success, 400M IPs, CAPTCHA solving — for protected sites |
| **Firecrawl** | AI-ready feeds → enrichment | LLM-ready markdown/JSON, fast — feeds straight into InvokeLLM |
| **Zyte** | Fallback for JS-heavy protected sites | AI auto-extraction |
| **Cloud Browser + Browserbase** | JS-rendered scraping | Already wired — keep |

---

## 5. Enrichment Data Providers to Adopt

| Provider | Use in HPI |
|----------|------------|
| **ATTOM** | Deep 9,000-attribute enrichment → `enrichment_data` |
| **BatchData** | Owner contact + skip-trace (phone/email) → `skipTraceOwner` |
| **HouseCanary** | AVM + block-level forecasting → `arv` + `estimated_value` |
| **HomeSage.ai** | Computer-vision condition scoring → `property_condition_score` + `maintenance_neglect_score` |

---

## 6. Build Priority (what to build first)

1. **Court-sourced distress (PropertyRadar model)** — extend the probate scraper to divorce + eviction courts via Bright Data → biggest lead-volume unlock.
2. **Multi-signal distress scoring** — upgrade `predictive_distress_score` to PropertyRadar's OR/AND multi-signal model.
3. **ATTOM enrichment integration** — new backend function pulling 9,000 attributes into the master enrichment pipeline.
4. **Computer-vision on every listing** — wire VISIONCORTEX to auto-run on all new scraped images (HomeSage model).
5. **"Plays" campaign templates** — motivation-specific ready-to-run outreach (divorce, probate, eviction, tired-landlord).
6. **Vercel AI Gateway multi-model + Perplexity** — ✅ started (model map extended).

HPI already owns the architecture for all of this — the restructure is
adopting the best features from each leader into the matching module, not
rebuilding.

---

## 7. Page Re-Platform Plan (luxury → V2)

Port each page into the clean V2 look, in priority order:

| Phase | Pages | Notes |
|-------|-------|-------|
| 1 | `Listings`, `PropertyDetail` | Core browse → detail flow; wire V2 search + cards |
| 2 | `DealCalculator`, `SmartContractMarketing`, `SmartContractDetail` | Money + contracts |
| 3 | `SellerPostProperty`, `SellerDashboard`, `InvestorDashboard`, `InvestorPipeline` | Personas |
| 4 | `About`, `Pricing`, `Blog`, `Contact`, `TheProcess`, `LaunchElite` | Marketing |
| 5 | `NegotiationChat`, `Bidding`, `Calculators`, `Alerts` | Tools |

Each port: apply `hpi-v2` scoped classes, keep all business logic intact.

---

## 8. Mobile: PWA + Native

- **PWA (now):** `manifest.json` + `sw.js` + `PWAInstall` already exist. V2 nav
  now has an install button and the homepage has a full app-download section.
  Users install from the browser — no store, works offline.
- **Native iOS/Android (next):** Base44 publishes the same code to the App Store
  and Google Play. This is a **publishing step**, not a code step — it requires
  Apple Developer + Google Play Console accounts and store review. No code
  change is needed; it's triggered from the dashboard publish flow.

---

## 9. Perplexity + Vercel AI Gateway (multi-model AI)

The Vercel AI Gateway brokers many providers through one key
(`AI_GATEWAY_API_KEY`, already set). The model map in
`base44/shared/aiGateway.ts` now includes:

- **OpenAI:** GPT-5.6 Sol/Luna, GPT-5.4, GPT-5 Mini
- **Anthropic:** Claude Sonnet 5, Claude Opus 5
- **Google:** Gemini 3 Flash, Gemini 3.1 Pro
- **Perplexity:** Sonar, Sonar Pro, Reasoning Pro, Deep Research ← new
- **xAI:** Grok 4, Grok 4 Fast ← new
- **DeepSeek:** Chat, Reasoner ← new
- **Meta:** Llama 3.3 70B ← new
- **Mistral:** Mistral Large ← new

All callable through `aiGatewayGenerate` (`action: "generate"`, `model: "<id>"`)
with automatic fallback to built-in InvokeLLM. Perplexity models give real-time
web-grounded research answers with no separate API key.

> Note: model IDs must match the Vercel AI Gateway catalog exactly. If a model
> 404s, the function surfaces the gateway error; verify the ID in the Vercel
> dashboard and adjust the map.

---

## 10. AGI Swarm (Vision Cortex model)

Goal: an autonomous swarm that monitors HPI, finds its own gaps, writes specs,
dispatches real backend work, validates results, and evolves docs — on a loop,
with zero human intervention. Modeled on the Vision Cortex architecture.

### Layers to replicate
1. **Blueprint in memory** — store this doc + the AGI architecture as a
   `CoreDocument` the swarm reads each cycle.
2. **Self-builder loop** — a workflow (`agiSelfBuilder`) that audits the
   blueprint, finds the next gap, generates a spec with the best model for the
   category, and dispatches to a real backend function. Runs every 5 minutes.
3. **RAG retrieval** — `ragRetrieval` pulls ranked context from documents,
   blueprints, and intel before every delegation.
4. **ML feedback** — `mlFeedbackEngine` records each outcome as a training
   sample and auto-promotes underperforming prompts to the best model.
5. **Best-model routing** — a 50+ category map (strategy→Opus, code→Sonnet,
   vision→Gemini, simulation→Luna, research→Perplexity).
6. **Council of agents** — `eden_skye` + a new `primus` orchestrator agent that
   delegates to specialist agents and executes real functions (no approval gates).
7. **Swarm performance dashboard** — a page showing per-agent task completion,
   error logs, and 5-minute loop timing.

### What the swarm CAN do autonomously
- Generate specs, dispatch to 85+ existing functions, provision infra,
  scrape, enrich, send outreach, self-audit, self-heal, evolve docs.

### What it CANNOT do (needs the builder)
- Write new React pages/components, create entities, create backend function
  files, create workflows, edit `App.jsx` routes. The self-builder records these
  as `SystemGap`s for the next builder turn.

---

## 11. Phased Roadmap

| Phase | Scope | Owner |
|-------|-------|-------|
| **0 — Done** | V2 home at `/`, nav cleanup, search wiring, PWA install, gateway multi-model | builder |
| **1** | Port Listings + PropertyDetail to V2; wire real listings to homepage | builder |
| **2** | Court-sourced divorce/eviction scraping via Bright Data → Shadow system | builder + Bright Data key |
| **3** | ATTOM 9,000-attribute enrichment function + master pipeline | builder + ATTOM key |
| **4** | Computer-vision auto-run on all new images (HomeSage/BatchData) | builder + VISIONCORTEX |
| **5** | "Plays" campaign templates + multi-signal distress scoring | builder |
| **6** | AGI swarm: blueprint doc, self-builder workflow, RAG, ML feedback, Prime agent | builder |
| **7** | Native iOS/Android publish | user (store accounts) |

---

## 12. Secrets / keys still needed

- `BRIGHTDATA_API_KEY` — court/assessor scraping
- `ATTOM_API_KEY` — 9,000-attribute enrichment
- `BATCHDATA_API_KEY` — skip-trace enrichment
- `HOUSECANARY_API_KEY` — AVM + forecasting
- `FIRECRAWL_API_KEY` — AI-ready feeds
- `ZYTE_API_KEY` — JS-heavy fallback

(`AI_GATEWAY_API_KEY` already covers Perplexity + all gateway LLMs.)

---

*This blueprint is the single source of truth for the restructure. Each phase
lands fully before the next begins.*