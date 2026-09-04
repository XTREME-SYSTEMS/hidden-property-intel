# MASTER STRATEGIC PLAN — PropertyIntel × VisionCortex × FaultLine
## Maximum Capability Integration Prompt

### INSTRUCTIONS
Paste everything below the line into a new conversation to invoke the full strategic enhancement.
This prompt integrates three platforms into one unified maximum-capability system.

---

## THE PROMPT

You are the lead architect for PropertyIntel — an AI-powered real estate investment platform that identifies off-market distressed Florida properties, provides advanced valuation scoring, and enables smart-contract-based deals. The platform runs on Base44 (React + Tailwind + Vite frontend, Base44 BaaS backend) with a self-hosted CloudBrowser-Control engine, Supabase for heavy data, Railway for cron scraping, and Stripe for payments.

I have dissected two additional platforms — **VisionCortex** (autonomous AI wealth intelligence) and **FaultLine** (autonomous website cloning + business auditing + self-healing) — that provide capabilities PropertyIntel does not yet use. Your job is to formulate and execute a MASTER STRATEGIC PLAN that fuses all three platforms' capabilities into PropertyIntel at MAXIMUM capability, creating a system no competitor can match.

---

### PLATFORM 1: PropertyIntel (Current State)

**Data Acquisition (3 methods):**
- `harvestViaAI` — LLM web-search (Gemini 3 Flash + live web) finds distressed listings. Returns structured JSON.
- `harvestViaBrowser` — Browserbase Fetch for static-URL sources.
- `harvestViaCloudBrowser` — Self-hosted CloudBrowser-Control engine: POST /sessions → POST /sessions/:id/execute (goto, extract_table with output_schema) → GET /sessions/:id → DELETE. Auth: x-api-key. Secrets: BROWSER_ENGINE_URL, BROWSER_ENGINE_API_KEY.

**CloudBrowser-Control Engine (FULLY AVAILABLE — barely utilized):**
- Anti-Bot Bypass — Akamai, DataDome, PerimeterX, Kasada, Imperva, Arkose Labs
- TLS Fingerprinting — JA3/JA4 matching (Chrome 131, Firefox 133, Safari 17)
- Captcha Solver — 2captcha integration, CAPTCHA_SOLVER_API_KEY
- Proxy Provider — Residential, mobile, datacenter with ASN matching, geo-targeting
- Human Behavior Simulation — Mouse bezier, typing jitter, scroll patterns
- Fingerprint Randomization — WebGL, Canvas, AudioContext spoofing
- Auto-Scaler — Dynamic session pool scaling
- Anomaly Detection — Error/block pattern detection
- Rate Limiter — Per-domain rate limiting
- Compliance Controls — robots.txt, ToS enforcement
- Cost Tracking — Per-action cost, budgets, invoices
- Distributed Fabric — Multi-region session distribution
- HAR Generator — Network recording
- PII Redaction — Automatic PII detection/redaction
- SSRF Protection — URL validation
- Concurrency Quotas — Per-user session limits
- Session Pooling, Video Recording, CDP, Extensions, Persistent Profiles, Network Mocks, Stealth Mode

**Railway Scraper:** 35+ FL sources, paginates (up to 10 pages), retries with backoff, rotates sessions every 10 sources, upserts to Supabase, triggers Base44 sync webhook. Daily target: 3,000 properties.

**Data Enrichment:** Address normalization, dedupe (normalized_address + zip + geohash), property scoring (0-100 via InvokeLLM), title risk, ownership chains, image acquisition, skip trace (LLM fallback), market analytics.

**317 DataSource records** across all 67 FL counties covering: foreclosures, tax deeds, probate, property appraisers, code violations, aggregators, REO, auctions, legal notices, bankruptcy, divorce, obituaries, HOA, commercial, land, mobile homes, multi-family, condos, waterfront, short sales, evictions, environmental, permits, tax liens, mixed-use, rentals.

**Existing Entities:** Property, Owner, DataSource, ScrapeJob, PropertyScore, TitleRisk, OwnershipChain, PropertyImage, Investor, Seller, Bid, Deal, SmartContract, DigitalSignature, InvestorLead, Watchlist, SavedSearch, MarketAnalytics, DealAlert, AlertPreference, Wholesaler, MaintenanceRequest, Subscription, SystemHealth, NegotiationThread.

**Existing Functions:** 60+ backend functions including scrapeProperties, scoreProperty, skipTraceOwner, generateOwnerOutreach, outreachInvestors, deploySmartContract, assessDealRisk, predictDistress, optimizePortfolio, auditSmartContract, validateSystem, etc.

---

### PLATFORM 2: VisionCortex (Autonomous AI Wealth Intelligence)

A covert AI wealth-building platform with a **Shadow** operator (invisible AI with unrestricted entity + function access) and a full A-Z capability matrix:

**Intelligence Discovery Capabilities:**
- Arbitrage Scanning — Cross-market price/asset differences
- Billionaire Deal Tracking — Track high-level financial movements & AI deals
- Competitor Reverse-Engineering — Exploit weaknesses in existing solutions
- Distressed Asset Discovery — Find undervalued businesses & assets
- Failure-Point Pre-Mortem — Identify where methods fail before building
- Glitch/System-Exploit Detection — Find financial rail exploits & algorithms
- Hashtag & Viral Trend Prediction — Predict viral content formats early
- Niche Saturation Scoring — Score competitor density per niche
- Sentiment-Driven Entry/Exit — Time markets by social sentiment
- Trend Wave Early Detection — Catch trends before they peak
- Underserved Audience Discovery — Find ignored market segments
- Viral Content Format ID — Identify high-virality content patterns
- Zero-Competition Niche Discovery — Find blue-ocean markets

**Automated System Creation:**
- Auto-Generate Architecture — Full SaaS architecture from one-liner
- Auto-Provision Vercel/Supabase — Instant infrastructure
- Auto-Generate Branding — Name, palette, voice, viral hooks
- Auto-Generate Landing Pages — Full marketing site generation
- Auto-Generate Social Content — 30-piece content calendars

**Speed of Monetization:**
- Stripe Revenue Verification — Real balance + per-project revenue
- Forensic Audit — Strategy-to-execution gap analysis
- Self-Healing Pipeline — Auto-fix system enhancements

**Wealth Delivery & Compounding:**
- Portfolio ROI Tracking — Cross-project revenue tracking
- Revenue Pattern Detection — Find new opportunities in revenue data

**Full Autonomy Layer:**
- Scheduled Money Hunts — Auto-hunt every 6 hours
- Auto-Evaluate AI-Automatability — Score 100% AI-automatable methods
- Auto-Queue Viable Projects — Stage projects for building
- Auto-Advance Build Pipeline — Progress through build stages
- Auto-Launch When Ready — One-click deployment
- Auto-Schedule Milestones — Google Calendar deadline creation
- Auto-Save Playbooks — Google Drive document archiving
- Auto-Verify Revenue — Stripe balance verification
- Auto-Alert Owner via Email — Critical finding notifications
- Continuous Self-Audit — E2E system health auditing

**Key Components:** ShadowCommandCenter, VisionPipelinePanel, MoneyHuntPanel, MonetizationPanel, BuildStrategyPanel, MissionTracker, CapabilityMatrix, SentimentTracker, EnhancementQueue, MorningBrief, MorningFeed, AutonomousActions, KanbanBoard, RecommendationsPanel, FactorySeedPanel, FactorySocialAI, DeepAuditReport, AutoRecommendPanel, LifeGrid, IntelCharts, PaperTrade.

---

### PLATFORM 3: FaultLine (Autonomous Cloning + Business Auditing + Self-Healing)

An autonomous website cloning, business auditing, and digital agency platform with 11 agents and 200+ functions:

**Stealth Browser Engine (stealthBrowser.ts):**
- Browserbase Sessions API with advancedStealth (real browser fingerprints, CDP-mode stealth)
- solveCaptchas — Automatic CAPTCHA solving (reCAPTCHA, hCaptcha, custom)
- proxies — Residential proxy network (geo-rotating, country/state/city targeting)
- verified — Purpose-built Chromium recognized by bot-protection partners
- blockAds — Ad blocking for cleaner extraction
- ignoreCertificateErrors — Bypass SSL issues
- CDP over WebSocket — Raw Chrome DevTools Protocol (Base44 Deno can't use Puppeteer/Playwright)
- deepRender — Scroll + resolve lazy images + extract computed backgrounds
- keepAlive — Session persistence

**Full-Site Clone Engine (fullSiteClone.ts):**
- Per-page asset re-hosting, CSS inlining, branding swap, link rewriting
- Sitemap-driven discovery (not BFS — finds ALL pages via sitemap.xml)
- Multi-page static site generation with 404 fallback
- On-demand deep path resolution

**11 Agents:**
1. auto_fixer — Autonomous repair: heals broken clones to 100% parity, forces through rigorous gate, finishes stalled, cleans orphaned Vercel projects, applies operational hardening, fixes security headers, rebuilds broken clones
2. clone_agent — Sitemap-driven full-site cloning (100+ pages, stealth browser, re-host assets, inject AI tools, deploy to Vercel, provision GitHub + Supabase + Drive)
3. faultline_assistant — Business diagnostic expert (findings, scores, revenue leaks, repair plans)
4. faultline_autocoder — Reads QA reports + Sentinel root-cause recommendations, generates exact code patches (file path, find string, replace string)
5. faultline_builder — Guided build agent (walks through building every missing opportunity with approval-gated flow)
6. faultline_enhancer — Recursive enhancement engine (implements, validates, audits every SystemEnhancement until all pass, then runs deep forensic audit)
7. faultline_qa — Autonomous QA, validation, headless-testing, compliance (navigates pages, fills forms, clicks through flows, double-checks EVERY output through mandatory QA gate)
8. faultline_sentinel — Autonomous headless testing with self-reflection (runs scripts against every page, self-reflects to identify root causes, generates corrective action lists, persists as QAReport)
9. rebrand_agent — Complete systematic rebrand (replaces brand name in ALL locations: text, meta, OG, Twitter cards, JSON-LD, alt text, aria-labels, schema.org, canonical URLs, favicons, manifest, inline CSS/JS)
10. system_tester — End-to-end audit (forensic security, visual parity, operational parity, all AI tools, all checkouts, form handler, dynamic deep-path resolution)
11. xtreme_commander — Full-access AI commander (read/write/execute across all entities, functions, site operations)

**200+ Key Functions:**
- Autonomous: autonomousFullSiteClone, autonomousCloneTo100, autonomousMarketplaceStocker, autonomousSEOEngine, autonomousBuildCycle, autonomousCodeSystem
- Continuous: continuousConvergenceEngine, continuousImprovementHeartbeat, overnightHeartbeat
- Orchestration: universalOrchestrator, universalDiscovery, businessOrchestrator, monitoringOrchestrator
- Wealth: wealthDiscoveryEngine, discoverIndustryOpportunities, discoverCompanies, scanCompetitors, scanIndustriesForNiches, searchTopWebsitesByIndustry
- Deep Scan: deepDiscoveryScan, publicScan, seoCrawlSite, structuralVisualParity, captureSourceBehavior, autonomousHeadlessScan
- Security: forensicAuditAndHarden, deepSecurityScan, securityPenTest, securityComplianceCheck, runSecurityPipeline
- Self-Healing: selfReflectAndHeal, sentinelReflect, healAllClonesTo100, forceClonesTo100, finishStalledClones, resumeStuckClones, cleanupBrokenClones, cleanupOrphanedVercelProjects
- Validation: recursiveEndToEndValidator, masterQualityGate, rigorousCloneGate, validateFullStack, proveFullStackChains, differentialValidation, validatorPipelineRegressionTest
- Backend Inference: buildInferredBackend, inferTargetBackend, repairBackendChain
- Generation: generateEnhancedSystem, generateWebsite, generateSiteAll, nicheWebsiteEngine, generateBrandAssets, generateSocialContent, generateMarketingVideo, generateIndustryImage
- Templates: deriveTemplatesFromClones, extractReusableTemplates, compileGenerator, generateFromTemplate, generateTemplatePack, generateDesignPack
- Rebranding: executeRebrand, deepRebrandSite, cloneAndRecolor
- Business: generateBidProposal, draftOutreach, sendApprovedOutreach, pushOpportunityToHubSpot, syncToHubSpot
- Finance: createInvoice, sendInvoice, recordInvoicePayment, getFinancialSummary, createCheckout, createImplementationCheckout
- Signatures: createSignatureEnvelope, sendForSignature, signEnvelope
- RAG: ragIngest, ragQuery, setupRagDatabase
- AI Tools: invokeAiTool, recommendToolStack, buildBackendCapabilityLedger
- Queues: processCloneQueue, processCodeQueue, processJobQueue
- Pipeline: launchPipelineStart, launchPipelineValidate, launchPipelineFinalize, clientWorkflowEngine
- Taxonomy: buildTaxonomyGraph, discoverTaxonomy, classifyUnmatchedRoutes, validateRoutesAgainstTaxonomy
- SEO: seoCrawlSite, seoGenerateTags, seoInjectTags, seoSetupAnalytics, seoSubmitToSearchConsole, seoTrackRankings
- Reports: generateMorningReceipt, weeklyDigest, generateReport
- Monitoring: monitoringOrchestrator, rescanMonitor, sendSmsAlert

**Key Entities:** LaunchProject, Finding, RepairPlan, IndustryOpportunity, Audit, BusinessProject, SystemNode, BackendCapabilityLedger, ToolRecommendation, AiTool, Organization, ClientProject, ScanSnapshot, ConvergenceProofLog, CoverageLedger, ValidationResult, QAReport, Artifact, AgentJob, BuildQueueItem, JobQueue, ClosureBoard, MonitoringEvent, InteractionGraph, Lead, CartOrder, CustomerAccount, Proposal, SecurityProposal, OutreachDraft, Expense, LedgerAccount, PricingProfile, WhiteLabelConfig, EnvironmentProfile, PartnerApiKey, MediaAsset, MediaProviderAdapter, Deliverable, Appointment, RepairTask, GateReview, Evidence, StrategyCallRequest, SyncState, AssetLicense, ProductEntitlement, ContractorService, RebrandProject, WebsiteTemplate, WebsiteLibraryAsset, ToolBundle, BrowserProviderRegistry, BuildQueueItem, CloneQueue, Website, GhlPage, ProductCatalogItem, GeneratorDefinition, NewsletterSubscriber, SignatureEnvelope, IntakeResponse, Lead, EnvatoAsset, HeartbeatReceipt, PricingRule, QAReport, MessageTemplate, PromptTemplate, SecurityProposal, MarketPrice, StepRun, PricingProfile, Organization, AuditLead, ClientPortalConfig, ClosureBoard, Expense, SystemNode, CustomerAccount, ClientOnboarding, MonitoringEvent, InteractionGraph, SystemConfig, AiTool, Deliverable, Appointment, RepairPlan, ImplementationService, ClientProject, SyncState, AssetLicense, ProductEntitlement, ContractorService, RebrandProject, GateReview, Audit, Evidence, StrategyCallRequest, CoverageLedger, ValidationResult, BrowserProviderRegistry, BuildQueueItem, BusinessProject, WebsiteLibraryAsset, ToolBundle, GhlPipeline, ScanSnapshot, FinishProfile, Finding, OvernightExecutionReceipt, Artifact, WebhookEndpoint, LaunchProject, GhlActivity, Proposal, WebsiteTemplate, ConvergenceProofLog.

---

### THE MASTER STRATEGIC PLAN

Your plan must fuse these three platforms into one unified system with these strategic pillars:

#### PILLAR 1: MAXIMUM STEALTH DATA ACQUISITION
Wire FaultLine's stealthBrowser.ts engine (advancedStealth, solveCaptchas, residential proxies, verified Chromium, CDP, deepRender) to PropertyIntel's scraper alongside the CloudBrowser-Control engine's anti-bot bypass, TLS fingerprinting, captcha solving, proxy rotation, human behavior simulation, and fingerprint randomization. This creates a DUAL-ENGINE stealth scraping system:
- Engine A (CloudBrowser-Control): Self-hosted, full anti-bot bypass (Akamai/DataDome/PerimeterX), TLS JA3/JA4 matching, fingerprint randomization, human behavior simulation, session pooling, persistent profiles, network mocks, video recording
- Engine B (FaultLine Stealth/Browserbase): advancedStealth (real browser fingerprints), solveCaptchas (reCAPTCHA/hCaptcha), residential geo-rotating proxies, verified Chromium, blockAds, deepRender (scroll + lazy image resolution), CDP over WebSocket
- Auto-select engine per source based on anti_bot_required, proxy_required, captcha_required flags
- Enable stealth mode for ALL 317 sources — fingerprint randomization + human behavior + TLS matching + proxy rotation
- Enable captcha solving for sources that present CAPTCHAs
- Use session pooling to reuse warm sessions across sources
- Use persistent profiles to maintain cookies across runs
- Use network mocks to block tracking/analytics scripts
- Use the rate limiter to respect per-domain rate limits
- Use anomaly detection to auto-pause failing sources
- Use the auto-scaler to dynamically scale session pool based on source count
- Use FaultLine's structuralVisualParity and captureSourceBehavior to verify scrape quality

#### PILLAR 2: AUTONOMOUS INTELLIGENCE DISCOVERY
Apply VisionCortex's A-Z intelligence capabilities to Florida real estate:
- **Arbitrage Scanning** — Cross-county price differences (same property type in Miami-Dade vs. Broward vs. Palm Beach)
- **Distressed Asset Discovery** — Find undervalued properties before they hit public records (pre-foreclosure signals, code violations, tax delinquency, probate filings)
- **Competitor Reverse-Engineering** — Monitor PropStream, DealMachine, PropertyRadar, Auction.com for properties we don't have; reverse-engineer their data sources
- **Sentiment-Driven Entry/Exit** — Track FL real estate sentiment (social media, news, forums) to time market entry/exit
- **Trend Wave Early Detection** — Detect FL market trends before they peak (migration patterns, interest rate impacts, insurance crisis effects)
- **Niche Saturation Scoring** — Score competitor density per FL county/city/distress type
- **Zero-Competition Niche Discovery** — Find underserved FL markets (rural counties, specific distress types competitors ignore)
- **Failure-Point Pre-Mortem** — Identify where deals fail before building (title issues, lien problems, code violations)
- **Underserved Audience Discovery** — Find ignored seller segments (elderly owners, out-of-state landlords, inherited property heirs)
- **Viral Content Format ID** — Identify high-virality real estate content patterns for marketing
- **Wealth Compounding Optimization** — Optimize reinvestment strategies for investor portfolios
- **X-Factor Differentiation** — Unique value proposition discovery (AI scoring + smart contracts + ownership chains = no competitor has all three)

#### PILLAR 3: AUTONOMOUS SELF-HEALING PIPELINE
Wire FaultLine's self-healing architecture to PropertyIntel:
- **selfReflectAndHeal** — The system reflects on its own performance and auto-heals issues
- **sentinelReflect** — Headless testing sentinel runs against every page, self-reflects to identify root causes, generates corrective action lists
- **continuousConvergenceEngine** — Continuously converges all system scores to 100/100
- **continuousImprovementHeartbeat** — Ongoing improvement loop
- **overnightHeartbeat** — Nightly autonomous execution receipt
- **healAllClonesTo100** → adapt to healAllSourcesTo100 — Auto-heal failing data sources to 100% health
- **forceClonesTo100** → adapt to forceSourcesTo100 — Force sources through rigorous quality gate
- **finishStalledClones** → adapt to finishStalledSources — Batch-finish stalled scrape jobs
- **resumeStuckClones** → adapt to resumeStuckSources — Resume stuck jobs
- **cleanupBrokenClones** → adapt to cleanupBrokenSources — Remove irrecoverable sources
- **forensicAuditAndHarden** — Forensic audit + security hardening of the entire pipeline
- **recursiveEndToEndValidator** — Recursive E2E validation of every data flow
- **masterQualityGate** — Master quality gate before any data goes live
- **rigorousCloneGate** → adapt to rigorousSourceGate — Rigorous source validation gate
- **faultline_autocoder pattern** — Read QA reports, generate exact code patches for issues
- **faultline_enhancer pattern** — Recursive enhancement: implement, validate, audit until all pass

#### PILLAR 4: AUTONOMOUS BUSINESS ORCHESTRATION
Apply VisionCortex's autonomy layer + FaultLine's business orchestration:
- **Scheduled Money Hunts** → Scheduled Deal Hunts — Auto-hunt for distressed FL properties every 6 hours
- **Auto-Queue Viable Properties** — Stage high-score properties for investor matching
- **Auto-Advance Deal Pipeline** — Progress properties through deal stages automatically
- **Auto-Launch Outreach** — When a property scores above threshold, auto-launch outreach campaign
- **Auto-Schedule Milestones** — Google Calendar integration for deal deadlines
- **Auto-Alert Owner** — Critical finding notifications (new high-score property, source failure, bid accepted)
- **Continuous Self-Audit** — E2E system health auditing via validateSystem
- **Morning Brief** — Daily AI-generated brief: top 10 properties, top 5 deals, system health, revenue
- **Morning Receipt** → Daily Execution Receipt — What the system did overnight
- **Weekly Digest** — Weekly performance summary
- **businessOrchestrator** — Orchestrate the full business workflow
- **universalOrchestrator** — Universal task orchestration
- **monitoringOrchestrator** — Continuous monitoring
- **wealthDiscoveryEngine** → Deal Discovery Engine — Discover new deal opportunities
- **discoverIndustryOpportunities** → discoverMarketOpportunities — Find FL market opportunities
- **discoverCompanies** → discoverInvestors — Discover new investor leads
- **scanCompetitors** — Scan competitor platforms for properties we're missing

#### PILLAR 5: MAXIMUM DATA ENRICHMENT + RAG INTELLIGENCE
Wire FaultLine's RAG system + deep scanning to PropertyIntel:
- **ragIngest** — Ingest all property data, owner records, title records, market analytics into a RAG database
- **ragQuery** — Natural language queries against the property intelligence database ("Find all probate properties in Miami-Dade with >50% equity and code violations")
- **setupRagDatabase** — Initialize the RAG database with all PropertyIntel data
- **deepDiscoveryScan** — Deep scan every property for hidden distress signals
- **publicScan** — Public surface scan of every source
- **captureSourceBehavior** — Capture and learn source behavior patterns for better scraping
- **structuralVisualParity** — Verify visual parity of scraped data vs. source
- **buildInferredBackend** — Infer missing backend data from partial scrapes
- **repairBackendChain** — Repair broken data chains
- **proveFullStackChains** — Prove every data flow chain end-to-end
- **buildBackendCapabilityLedger** — Track what the backend can do
- **recommendToolStack** — AI recommends the best tool stack for each task
- **invokeAiTool** — Invoke any AI tool dynamically

#### PILLAR 6: MAXIMUM OUTREACH INTELLIGENCE
Combine all three platforms' outreach capabilities:
- **Multi-channel orchestration** — Email → SMS → direct mail → ringless voicemail → follow-up
- **AI message generation** — Personalized outreach with correct name, property details, emotional intelligence
- **Autonomous follow-up** — AI decides when/how/whether to follow up
- **draftOutreach** → FaultLine's outreach drafting — Generate outreach drafts
- **sendApprovedOutreach** — Send approved outreach campaigns
- **pushOpportunityToHubSpot** — Push deals to HubSpot CRM (connector already registered)
- **syncToHubSpot** — Sync all deals to HubSpot
- **generateSocialContent** — Generate social media content for property marketing
- **generateMarketingVideo** — Generate marketing videos for properties
- **generateIndustryImage** — Generate industry-specific images
- **Fair housing compliance** — AI scans all outreach for discriminatory language
- **A/B testing** — Auto-test subject lines, message tones, send times
- **Deliverability monitoring** — Track bounce rates, spam complaints, auto-suppress

#### PILLAR 7: MAXIMUM MONETIZATION + FINANCE
Wire FaultLine's finance + signature systems:
- **Stripe Revenue Verification** — Real balance + per-project revenue (VisionCortex shadowRevenueCheck)
- **createCheckout** — Stripe checkout for subscriptions
- **createInvoice** — Generate invoices for services
- **sendInvoice** — Send invoices to investors/clients
- **recordInvoicePayment** — Record payments
- **getFinancialSummary** — Full financial dashboard
- **createSignatureEnvelope** — Create e-signature envelopes for contracts
- **sendForSignature** — Send contracts for signature
- **signEnvelope** — Sign envelopes
- **generateBidProposal** — Generate professional bid proposals
- **Portfolio ROI Tracking** — Cross-project revenue tracking
- **Revenue Pattern Detection** — Find new opportunities in revenue data
- **Auto-Reinvest Profits** — Reinvest into highest-ROI next project
- **Double-Down vs Sunset** — Auto-identify which markets to scale/kill

#### PILLAR 8: MAXIMUM SEO + MARKETING
Wire FaultLine's SEO engine:
- **seoCrawlSite** — Crawl our site for SEO issues
- **seoGenerateTags** — Generate SEO meta tags
- **seoInjectTags** — Inject SEO tags into pages
- **seoSetupAnalytics** — Set up analytics
- **seoSubmitToSearchConsole** — Submit to Google Search Console (connector already authorized)
- **seoTrackRankings** — Track search rankings
- **autonomousSEOEngine** — Fully autonomous SEO optimization
- **generateSocialContent** — 30-piece content calendars
- **generateMarketingVideo** — Marketing video generation
- **Auto-Generate SEO Blogs** — SEO-optimized content engine
- **Auto-Create Ad Campaigns** — Google + Meta ads with targeting

#### PILLAR 9: MAXIMUM SECURITY + FORENSICS
Wire FaultLine's security pipeline:
- **forensicAuditAndHarden** — Forensic audit + auto-harden security headers
- **deepSecurityScan** — Deep security scan of entire platform
- **securityPenTest** — Penetration testing
- **securityComplianceCheck** — Compliance checking
- **runSecurityPipeline** — Full security pipeline
- **operationalHarden** — Operational hardening (form handlers, CTA integrity)
- **Auto-Detect Security Vulns** — Continuous security scanning
- **Auto-Monitor Uptime** — Auto-recover from outages
- **PII Redaction** — Automatic PII detection in all stored data
- **SSRF Protection** — URL validation for all scraped URLs
- **Compliance Controls** — robots.txt, ToS enforcement per source

#### PILLAR 10: MAXIMUM QUALITY ASSURANCE
Wire FaultLine's QA + validation system:
- **recursiveEndToEndValidator** — Recursive E2E validation of every data flow
- **masterQualityGate** — Master quality gate before any data goes live
- **rigorousCloneGate** → rigorousSourceGate — Rigorous source validation
- **validateFullStack** — Validate full stack
- **proveFullStackChains** — Prove every data flow chain
- **differentialValidation** — Differential validation
- **validatorPipelineRegressionTest** — Regression testing
- **faultline_qa pattern** — Autonomous QA: navigate pages, fill forms, click through flows, double-check EVERY output through mandatory QA gate
- **faultline_sentinel pattern** — Headless testing with self-reflection
- **faultline_autocoder pattern** — Read QA reports, generate exact code patches
- **faultline_enhancer pattern** — Recursive enhancement until all pass
- **runHeadlessTest** — Run headless tests
- **captureTestEvidence** — Capture test evidence
- **browserWorkerPairedValidation** — Paired browser validation
- **createQAReview** — Create QA reviews
- **qaValidateStep** — Validate each pipeline step

---

### IMPLEMENTATION PRIORITIES

**P0 — Unblock Scale (Week 1):**
1. Wire dual-engine stealth scraping (CloudBrowser-Control + FaultLine stealthBrowser) to all 317 sources
2. Enable stealth mode + proxy + captcha for all anti-bot sources (realforeclose, Auction.com, Zillow, Redfin, LoopNet)
3. Enable pagination on all sources (many currently without)
4. Wire self-healing pipeline (selfReflectAndHeal, healAllSourcesTo100, finishStalledSources)
5. Wire continuous convergence engine (continuousConvergenceEngine, overnightHeartbeat)

**P1 — Maximum Intelligence (Week 2):**
6. Wire RAG database (setupRagDatabase, ragIngest, ragQuery) for property intelligence
7. Wire deep discovery scan (deepDiscoveryScan, captureSourceBehavior, structuralVisualParity)
8. Wire autonomous deal hunting (scheduled money hunts, auto-queue viable properties)
9. Wire morning brief + daily execution receipt + weekly digest
10. Wire multi-source image acquisition (county GIS + Street View + listing sites)
11. Wire full skip-trace enrichment (LLM primary, API when available)
12. Wire distress stacking across all signals
13. Wire predictive distress scoring + motivation scoring + deal quality scoring

**P2 — Maximum Monetization (Week 3):**
14. Wire autonomous outreach orchestration (multi-channel, AI messages, follow-up)
15. Wire finance system (invoices, payments, financial summary)
16. Wire e-signature system (createSignatureEnvelope, sendForSignature, signEnvelope)
17. Wire SEO engine (autonomousSEOEngine, seoCrawlSite, seoTrackRankings)
18. Wire social content + marketing video generation
19. Wire HubSpot CRM sync (pushOpportunityToHubSpot, syncToHubSpot)
20. Wire competitor monitoring (scanCompetitors, auto-alert when they list properties we don't have)

**P3 — Maximum Autonomy (Week 4):**
21. Wire full autonomy layer (auto-advance pipeline, auto-launch outreach, auto-schedule milestones)
22. Wire forensic audit + security hardening (forensicAuditAndHarden, deepSecurityScan)
23. Wire recursive E2E validation (recursiveEndToEndValidator, masterQualityGate)
24. Wire continuous self-audit (validateSystem, continuousImprovementHeartbeat)
25. Wire autocoder pattern (read QA reports, generate code patches)
26. Wire enhancer pattern (recursive enhancement until all pass)

---

### EXPECTED OUTCOME

- 10,000+ active Florida properties (from 214)
- 317+ active data sources (from 35) — all with stealth mode
- 90%+ image coverage (from 22%)
- 90%+ title risk coverage (from 17%)
- 90%+ owner enrichment (from ~30%)
- Full distress stacking on every property
- RAG-powered natural language property intelligence queries
- AI intelligence layer: arbitrage scanning, sentiment-driven entry/exit, trend wave detection, zero-competition niche discovery, competitor reverse-engineering
- Self-healing pipeline: auto-heal failing sources, auto-finish stalled jobs, auto-resume stuck jobs, continuous convergence to 100/100
- Autonomous deal hunting every 6 hours
- Morning brief + daily execution receipt + weekly digest
- Dual-engine stealth scraping that unblocks all hard targets
- Anti-detection that no competitor can match
- Auto-healing pipeline that runs without human intervention
- Full finance + e-signature + CRM integration
- Autonomous SEO + social content + marketing video generation
- Forensic security + recursive E2E validation + continuous self-audit

### CONSTRAINTS
- Florida-only scraping (all sources must be FL-specific)
- Base44 backend functions have 300s timeout — heavy scraping stays on Railway
- Supabase is primary database for raw scraped data; Base44 entities for enriched/scored data
- Use existing entities (Property, Owner, DataSource, ScrapeJob, PropertyScore, TitleRisk, OwnershipChain, PropertyImage, etc.)
- Use existing shared modules (scraper.ts, propertyImages.ts, addressUtils.ts, scoring.ts)
- Use existing cloud browser engine API (BROWSER_ENGINE_URL, BROWSER_ENGINE_API_KEY)
- Use existing Browserbase API (BROWSERBASE_API_KEY) for FaultLine stealth engine
- Use existing Stripe integration (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET)
- Use existing Supabase connector, Google Sheets connector, Google Search Console connector
- Use existing HubSpot workspace connector for CRM sync
- All code must be production-ready, no stubs, no placeholders
- Every button must work, every flow must finish, every enrichment must persist
- Create focused components under 50 lines; use find_replace for existing file edits

### EXECUTION
Analyze every file in all three systems, the cloud browser engine capabilities, the competitive benchmark, and the gap matrix. Then implement the maximum enhancement, starting with P0 items. Create new files as needed. Update existing files with find_replace. Test every backend function. Build it completely — every button works, every flow finishes, every enrichment persists, every source self-heals, every morning brings a fresh brief, every deal is scored, every owner is enriched, every image is acquired, every contract is signed, every payment is tracked, every competitor is monitored, every trend is detected, every gap is closed.