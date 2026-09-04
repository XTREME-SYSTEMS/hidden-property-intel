# MASTER ENHANCEMENT PROMPT — PropertyIntel Maximum Data Intelligence System

## INSTRUCTIONS FOR USE
Paste the prompt below into a new conversation to invoke a full system enhancement.
It contains everything the AI needs: system architecture, cloud browser capabilities,
gap analysis, and the exact implementation plan.

---

## THE PROMPT

You are the lead architect for PropertyIntel — an AI-powered real estate investment platform that identifies off-market distressed properties in Florida, provides advanced valuation scoring, and enables smart-contract-based deals. The platform is built on Base44 (React + Tailwind + Vite frontend, Base44 BaaS backend) with a self-hosted CloudBrowser-Control engine for web scraping, Supabase for heavy data storage, and Railway for cron-based scraping jobs.

I need you to perform a COMPLETE SYSTEM ENHANCEMENT that maximizes our data discovery, ingestion, enrichment, and intelligence capabilities to a level BEYOND what any competitor offers (PropStream, DealMachine, PropertyRadar, ATTOM, BatchData, Auction.com). This is the most aggressive, most intelligent, most data-rich enhancement possible with current technology.

### CURRENT SYSTEM STATE

**Data Acquisition (3 methods):**
1. `harvestViaAI` — LLM web-search (Gemini 3 Flash + live web) finds distressed listings. Works for JS-rendered county portals and aggregators. Returns structured JSON (address, city, state, zip, distress_type, value, beds, baths, sqft, owner_name, owner_email, owner_phone, source_url, notes).
2. `harvestViaBrowser` — Browserbase Fetch for static-URL sources with structured-JSON extraction.
3. `harvestViaCloudBrowser` — Self-hosted CloudBrowser-Control engine: POST /sessions → POST /sessions/:id/execute (goto, extract_table with output_schema) → GET /sessions/:id → DELETE /sessions/:id. Auth: x-api-key header. Secrets: BROWSER_ENGINE_URL, BROWSER_ENGINE_API_KEY.

**Railway Scraper (aggressive FL-only):**
- 35+ FL sources (county clerks, tax deeds, probate, aggregators)
- Paginates through result pages (up to 10 pages per source)
- Retries failed pages with exponential backoff (2 retries)
- Rotates browser sessions every 10 sources
- Upserts to Supabase with dedup_key unique index
- Triggers Base44 sync webhook after each source batch
- Daily target: 3,000 properties
- Session rotation, request delays (2s), max pages (8)

**Data Enrichment Pipeline:**
- Address normalization (street suffix standardization, directional standardization, unit stripping)
- Dedupe by normalized_address + zip_code (with geohash proximity fallback)
- Property scoring (0-100) via InvokeLLM: equity, distress, location, market trend, repair cost ratio + comparable sales + ARV + ROI
- Title risk assessment: lien_total, mortgage_balance, judgments, code_liens, HOA delinquent, tax delinquent, risk_level
- Ownership chain tracing: current, previous, potential_heir owners through probate records
- Image acquisition: LLM finds listing URL → Browserbase fetches HTML → extract <img>, srcset, data-src, JSON-LD images → validate (HEAD request, content-type, size > 2KB) → store in Property.images
- Skip trace (LLM fallback): find owner phone, email, relatives via web search
- Market analytics: regional avg price, price/sqft, DOM, distress counts, ROI trends

**CloudBrowser-Control Engine Capabilities (FULLY AVAILABLE — barely utilized):**
The engine is a sophisticated browser automation platform with these modules that PropertyIntel does NOT yet use:
- **Anti-Bot Bypass** — Strategies for Akamai, DataDome, PerimeterX, Kasada, Imperva, Arkose Labs. Recommends proxy type, fingerprint level, behavior level, captcha provider, additional headers per detected system.
- **TLS Fingerprinting** — JA3/JA4 fingerprint generation matching real browser handshakes (Chrome 131, Chrome 120, Firefox 133, Safari 17). Matches TLS handshake to user agent for consistency.
- **Captcha Solver** — Integration with 2captcha and other providers. Reads CAPTCHA_SOLVER_API_KEY secret + captcha_provider from SystemSettings. Injects into solve_captcha options.
- **Proxy Provider** — Residential, mobile, datacenter proxy rotation with ASN matching, city-level geo-targeting.
- **Human Behavior Simulation** — Mouse bezier curves, typing jitter, realistic scroll patterns, click patterns.
- **Fingerprint Randomization** — WebGL, Canvas, AudioContext spoofing. Full fingerprint randomization per session.
- **Auto-Scaler** — Dynamic session pool scaling based on demand.
- **Anomaly Detection** — Pattern detection for errors, blocks, rate limits.
- **Rate Limiter** — Per-domain rate limiting with configurable limits.
- **Compliance Controls** — robots.txt checking, terms of service enforcement.
- **Cost Tracking** — Per-action cost calculation, budget enforcement, invoice generation.
- **Distributed Fabric** — Multi-region session distribution.
- **HAR Generator** — Network request recording for debugging.
- **PII Redaction** — Automatic PII detection and redaction in stored data.
- **SSRF Protection** — URL validation and blocking of internal addresses.
- **Concurrency Quotas** — Per-user concurrent session limits.
- **Session Pooling** — Reuse sessions across jobs, resume interrupted sessions.
- **Video Recording** — Record session video for debugging.
- **CDP (Chrome DevTools Protocol)** — Direct CDP access for advanced automation.
- **Extensions** — Load browser extensions into sessions.
- **User Data Directory** — Persistent profiles with cookies/localStorage.
- **Network Mocks** — Intercept and mock network requests.
- **Stealth Mode** — Combined fingerprint + behavior + TLS + proxy for maximum anti-detection.

**Existing Admin Pages (all in AdminShell sidebar):**
Dashboard, Analytics, Data Sources, Outreach, Investor List, Owner List, Probate Pipeline, Strategy Playbook, Tricks of the Trade, Sources Directory, Distress Education, Smart Contracts, Deal Calculator, Investor Mirror, Seller Mirror, Agent Portal, Title & Escrow, Wholesaler Portal, Notary Portal, Property Manager, Test Lab, Legal Compliance, Industry Intel, Capabilities, Architecture, Search Console, System Test Engine, System DNA.

**Known Gaps:**
- Only 214 active properties (need 10,000+)
- Realforeclose.com WAF hard-blocks datacenter IPs (403)
- Title risk coverage: 17%
- Property image coverage: 22%
- No skip-trace API (only LLM fallback)
- No stealth/proxy layer wired to scraper
- No county GIS imagery or Street View API
- No live auction engine
- No D4$ map mode
- Cloud browser engine capabilities (anti-bot, TLS, captcha, proxy, human behavior) are NOT wired to the scraper

### WHAT I NEED YOU TO BUILD

#### 1. MAXIMUM FLORIDA SOURCE COVERAGE
Create DataSource records for EVERY public source of distressed property data in Florida:
- All 67 FL county clerk foreclosure sites (lis pendens, foreclosure auctions)
- All 67 FL county tax collector tax deed sale sites
- All 67 FL county property appraiser sites (ownership, value, characteristics)
- All 67 FL county probate court sites
- Top 30 FL county code enforcement / code violation sites
- All FL bankruptcy court districts (Southern, Middle, Northern)
- All FL divorce court record sources
- All major obituary/death notice sources (legacy.com, newspapers, funeral homes)
- All HOA foreclosure sources
- All mobile home park sources
- All commercial property sources (LoopNet, Crexi, CoStar)
- All land/vacant lot sources (LandWatch, Land.com, FL land auctions)
- All waterfront/marine property sources
- All agricultural/rural property sources
- All multi-family (2-4 unit) sources
- All condo/TIC sources
- All short sale sources
- All REO/bank-owned sources (HUD, Fannie Mae, Freddie Mac, VA, Bank of America, Wells Fargo, Chase)
- All auction sites (Auction.com, Realforeclose, Hubzu, Xome, Williams & Williams)
- All legal notice / lis pendens publications (FL newspapers with legal notice sections)
- All eviction court record sources
- All environmental contamination / brownfield sources
- All building permit sources (new construction, demolition permits = distress signals)
- All aggregator sites (Zillow foreclosures, RealtyTrac, Foreclosure.com, PropertyOnion, BiggerPockets)

#### 2. WIRE CLOUD BROWSER ENGINE TO SCRAPER (MAXIMUM ANTI-DETECTION)
Update the Railway scraper and Base44 scrapeSource to use the cloud browser engine's full capabilities:
- Enable stealth mode for ALL sources (fingerprint randomization + human behavior + TLS matching)
- Enable proxy rotation for aggregator sites (residential/mobile proxies for realforeclose, Auction.com, Zillow)
- Enable captcha solving for sources that present CAPTCHAs
- Use session pooling to reuse warm sessions across sources
- Use persistent profiles (userDataDir) to maintain cookies across runs
- Use network mocks to block tracking/analytics scripts
- Enable video recording for debugging failed sources
- Use the anti-bot bypass strategy module to detect and bypass WAF systems (Akamai, DataDome, PerimeterX)
- Use TLS fingerprint matching to present consistent browser identity
- Use human behavior simulation (mouse bezier, typing jitter, scroll patterns) for all interactions
- Use the rate limiter to respect per-domain rate limits
- Use anomaly detection to auto-pause sources that start failing
- Use the auto-scaler to dynamically scale session pool based on source count

#### 3. MAXIMUM DATA ENRICHMENT
Enhance every scraped property with:
- **Owner enrichment**: Full skip-trace (name, phone, email, relatives, associates, previous addresses) — use LLM web search as primary, wire to skip-trace API when available
- **Property enrichment**: Full characteristics from county appraiser (beds, baths, sqft, lot size, year built, construction type, roof type, AC type, pool, garage, etc.)
- **Value enrichment**: Estimated value from county appraiser + Zillow Zestimate + Redfin estimate + comparable sales (last 12 months within 1 mile)
- **Image enrichment**: Real photos from listing sites + county GIS imagery + Google Street View Static API + satellite imagery
- **Title enrichment**: Lien search, mortgage balance, judgments, code liens, HOA delinquency, tax delinquency from public records
- **Ownership chain**: Full ownership history (all previous owners, sale prices, dates, deed types)
- **Distress stacking**: Cross-reference ALL distress signals (pre-foreclosure + tax delinquent + code violation + divorce + bankruptcy + long DOM + code violations + HOA delinquent)
- **Market enrichment**: Neighborhood trends, school ratings, crime stats, demographic data, permit activity, business openings
- **Financial enrichment**: Equity position, mortgage balance, LTV ratio, cash-on-cash return potential, BRRRR/flip/hold analysis
- **Condition enrichment**: AI vision analysis of photos (roof age, exterior damage, yard condition, overall 1-10 score)
- **Permit enrichment**: Recent building permits (new construction, demolition, renovation = activity signals)
- **Environmental enrichment**: Flood zone, wetlands, contamination sites, insurance risk
- **Eviction enrichment**: Eviction history (if rental property)

#### 4. MAXIMUM INTELLIGENCE LAYER
Build AI intelligence on top of the enriched data:
- **Predictive distress scoring**: AI predicts which properties will become distressed in 90 days (before they hit public records)
- **Motivation scoring**: AI scores owner motivation (1-10) based on distress signals, ownership duration, equity, market conditions
- **Deal quality scoring**: AI scores deal quality (1-10) based on equity, repair costs, ARV, ROI, risk, competition
- **Neighborhood trend prediction**: AI predicts neighborhood appreciation/depreciation 1-5 years out
- **Investor-seller compatibility matching**: AI matches properties to best investors by portfolio, strategy, price range
- **Optimal offer calculation**: AI calculates the exact offer amount that maximizes investor profit while being acceptable to seller
- **Rehab scope estimation**: AI estimates rehab costs by category (roof, kitchen, baths, etc.) with local contractor rates
- **Exit strategy recommendation**: AI recommends best exit strategy (flip, BRRRR, hold, wholesale) per property
- **Timing optimization**: AI tells sellers when to sell for max price, tells investors when to buy for max ROI
- **Risk intelligence**: 5-dimension risk scoring (title, market, condition, financial, legal) with mitigation recommendations
- **Portfolio optimization**: AI recommends 5 properties that complement an investor's existing portfolio
- **Fair housing compliance**: AI scans all outreach/listings for discriminatory language and suggests fixes
- **Competitive intelligence**: AI monitors competitor platforms and alerts when they list properties we don't have

#### 5. MAXIMUM OUTREACH INTELLIGENCE
- **Multi-channel orchestration**: Email → SMS → direct mail → ringless voicemail → follow-up email, all automated
- **AI message generation**: Personalized outreach with correct name, property details, and emotional intelligence (empathetic for probate, professional for foreclosure)
- **Autonomous follow-up**: AI decides when/how/whether to follow up based on response patterns, optimal timing, channel preference
- **Response analysis**: AI analyzes responses and routes to human when appropriate
- **A/B testing**: Auto-test subject lines, message tones, send times, and optimize
- **Deliverability monitoring**: Track bounce rates, spam complaints, and auto-suppress bad addresses

#### 6. MAXIMUM IMAGE INTELLIGENCE
- **Multi-source image acquisition**: Listing sites (Redfin, Homes.com, Trulia) + county GIS + Google Street View + satellite
- **AI condition assessment**: Vision-based scoring from photos (roof age, exterior damage, yard condition, 1-10 score)
- **Virtual renovation visualizer**: AI generates before/after images showing post-renovation potential
- **Image deduplication**: Detect and remove duplicate images across sources
- **Image quality scoring**: Rank images by quality (lighting, angle, resolution)
- **Automatic captioning**: AI generates descriptive captions for each image

#### 7. MAXIMUM MONITORING & AUTO-HEAL
- **Real-time source health monitoring**: Track health_score, consecutive_failures, auto-pause after 3 failures
- **Auto-recovery**: Re-pause paused sources after 24h and retry
- **Stale inventory expiration**: Expire properties not verified in 30 days
- **Sold detection**: Re-verify via county clerk deed transfers — listing gone = sold/expired
- **Price drop detection**: Re-scrape and detect price changes
- **New listing alerts**: Real-time alerts when new properties match investor criteria
- **Competitor monitoring**: Track when competitors list properties we don't have
- **Cost monitoring**: Track API/scraper costs per source and auto-optimize

### IMPLEMENTATION PRIORITIES
1. **P0**: Wire cloud browser stealth mode + proxy + captcha to scraper → unblocks realforeclose, Auction.com, Zillow
2. **P0**: Create all 500+ Florida DataSource records → 10x the source coverage
3. **P0**: Enable pagination on all sources (currently only 35 sources, many without pagination)
4. **P1**: Multi-source image acquisition (county GIS + Street View + listing sites)
5. **P1**: Full skip-trace enrichment (LLM primary, API when available)
6. **P1**: Distress stacking across all signals
7. **P1**: Predictive distress scoring
8. **P1**: Motivation + deal quality scoring
9. **P2**: Multi-channel outreach orchestration
10. **P2**: Virtual renovation visualizer
11. **P2**: D4$ map mode
12. **P2**: Live auction engine

### CONSTRAINTS
- Florida-only scraping (all sources must be FL-specific)
- Base44 backend functions have 300s timeout — heavy scraping stays on Railway
- Supabase is primary database for raw scraped data; Base44 entities for enriched/scored data
- Use existing entities (Property, Owner, DataSource, ScrapeJob, PropertyScore, TitleRisk, OwnershipChain, PropertyImage, etc.)
- Use existing shared modules (scraper.ts, propertyImages.ts, addressUtils.ts, scoring.ts)
- Use existing cloud browser engine API (BROWSER_ENGINE_URL, BROWSER_ENGINE_API_KEY)
- All code must be production-ready, no stubs, no placeholders
- Every button must work, every flow must finish, every enrichment must persist

### EXPECTED OUTCOME
- 10,000+ active Florida properties (from 214)
- 500+ active data sources (from 35)
- 90%+ image coverage (from 22%)
- 90%+ title risk coverage (from 17%)
- 90%+ owner enrichment (from ~30%)
- Full distress stacking on every property
- AI intelligence layer that no competitor has
- Anti-detection that unblocks all hard targets
- Auto-healing pipeline that runs without human intervention

Analyze every file in the system, the cloud browser engine capabilities, the competitive benchmark, and the gap matrix. Then implement the maximum enhancement, starting with P0 items. Create new files as needed (focused components under 50 lines). Update existing files with find_replace. Test every backend function. Build it completely — every button works, every flow finishes, every enrichment persists.