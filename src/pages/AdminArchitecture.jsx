import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Radar, Brain, FileSignature, Users, RefreshCw, Mail, ShieldCheck, Database,
  TrendingUp, Target, Zap, ArrowRight, Activity, AlertTriangle, CheckCircle2,
  Image, Phone, Eye, Bug, Copy, MapPin, Cpu, Server, Gauge, Layers,
} from "lucide-react";

/**
 * Admin Architecture Hub — the system's living memory.
 * Consolidates: architecture decisions, competitive benchmark, gap matrix,
 * live self-reflection (SystemHealth), and prioritized implementation roadmap.
 */

const ARCHITECTURE_DECISIONS = [
  {
    icon: Activity, area: "Monitoring — sold detection",
    decisions: [
      "Signal = county clerk deed transfer (new deed = sold). OwnershipChain + populateOwnershipChains already built for this.",
      "Re-verify job re-scrapes source_url; listing gone from auction calendar → status closed/expired.",
      "Tiered frequency: auction ≤7 days out → daily; everything else → weekly. Driven off DataSource.scrape_frequency.",
      "Property.status enum already has closed/expired — no schema change needed.",
    ],
    gap: "No re-verify job exists yet. Need a scheduled 'verifyActiveProperties' function.",
    priority: "High",
  },
  {
    icon: Image, area: "Images",
    decisions: [
      "Engine pulls <img> src via evaluate → backend fetches binary (referer header) → UploadFile → PropertyImage.file_url.",
      "Source priority: county assessor/GIS (stable, no bot walls) → Google Street View Static API → Zillow last (signed URLs + bot walls).",
      "Storage: Base44 UploadFile now → Supabase Storage (S3-compatible) post-migration. Never local disk.",
      "Naming: prop/{property_id}/{type}_{index}.webp; is_primary on best image.",
    ],
    gap: "fetchPropertyImages + ingestPropertyImages exist but aren't wired to county GIS imagery or Street View API.",
    priority: "High",
  },
  {
    icon: Phone, area: "Contact enrichment",
    decisions: [
      "Owner names: county property appraiser + tax collector parcel pages (unprotected) → Owner entity.",
      "Phone/email: skip-trace API (TLO / IRBsearch / TruePeopleSearch) — industry standard for RE.",
      "Fallback: InvokeLLM add_context_from_internet for LLC/business owners (filings, directories).",
      "Relatives (probate heirs): skip-trace 'possible associates' — only reliable source.",
    ],
    gap: "No skip-trace integration. Owner records are created but stay contact-empty.",
    priority: "Critical",
  },
  {
    icon: Eye, area: "Shadow mode (anti-detection)",
    decisions: [
      "Proxy rotation: needed for aggregators only. Confirmed realforeclose.com 403s the engine's datacenter IP.",
      "County assessor/clerk sites are government and lenient — no proxy needed.",
      "Fingerprint masking: engine needs stealth layer (playwright-extra + stealth) for hard targets.",
      "Randomized delays: 2–8s between actions, human-like scroll/mouse. Essential for sustained scraping.",
    ],
    gap: "Engine has no stealth layer or proxy support. Aggregator targets (realforeclose, Auction.com) are blocked.",
    priority: "Critical",
  },
  {
    icon: Bug, area: "Error handling",
    decisions: [
      "Source down: ScrapeJob records failed + error. N consecutive failures → DataSource.status='error', alert, auto-recover next cycle.",
      "Retry: exponential backoff (3 attempts) within one job, then skip + mark. runDailyScrapePipeline already continues past failures.",
      "Blocked IP: detect 403/429/captcha → pause source 24h, alert, rotate proxy if available. Never hammer a blocked source.",
    ],
    gap: "No consecutive-failure counter or auto-pause. Sources retry blindly until manually fixed.",
    priority: "Medium",
  },
  {
    icon: Copy, area: "Data quality — dedupe",
    decisions: [
      "Current dedupe: exact address + zip_code. '123 Main St' vs '123 Main Street' slips through.",
      "Normalize: USPS Address Validation API or libpostal → store normalized_address; dedupe on (normalized_address, zip).",
      "Secondary dedupe: lat/lng geohash proximity — two listings within ~10m = same parcel.",
      "Merge, don't discard: duplicate found → merge into richer record, link sources.",
    ],
    gap: "No address normalization or geohash dedupe. Duplicate properties accumulate across sources.",
    priority: "High",
  },
];

const BENCHMARK = [
  {
    name: "PropStream", url: "propstream.com", price: "$99/mo", users: "150M+ liens",
    strengths: "150M+ involuntary liens, 41M pre-foreclosures, 165 filters, 20 lead lists, list-stacking, equity/mortgage-balance data, skip tracing, CRM.",
    tech: "Nationwide data warehouse, real-time API, mobile + web, list export, direct mail integration.",
    take: "Equity-position + mortgage-balance fields and filter granularity. We match with AI scoring + ownership chains.",
  },
  {
    name: "DealMachine", url: "dealmachine.com", price: "$99+/mo", users: "250K+ users",
    strengths: "Driving-for-Dollars mobile app, skip tracing, CRM, marketing automation, 100K+ deals closed.",
    tech: "React Native mobile, map-first UX, in-app skip trace, direct-mail postcards, ARV engine.",
    take: "Mobile-first field acquisition + CRM. We have a PWA + pipeline; next is in-app skip-trace + D4$ map mode.",
  },
  {
    name: "PropertyRadar", url: "propertyradar.com", price: "$249/mo", users: "Regional",
    strengths: "List-stacking across multiple distress lists, strong Western-state county coverage, regional focus.",
    tech: "Web app, multi-list cross-reference, county-record depth, export to CSV/direct mail.",
    take: "List-stacking UI. crossReferenceProperties function exists; expose it in the marketplace.",
  },
  {
    name: "ATTOM Data", url: "attomdata.com", price: "Enterprise", users: "B2B data",
    strengths: "Foreclosure timelines (default/auction/REO), Propensity-to-Default scoring, nationwide warehouse.",
    tech: "REST API, bulk data files, mortgage + lien + tax data, propensity models.",
    take: "Propensity / predictive scoring. Our 0–100 score is the equivalent; enrich with default-propensity signals.",
  },
  {
    name: "BatchData", url: "batchdata.io", price: "Tiered", users: "B2B data",
    strengths: "Multi-source resilience, 99.99% uptime, daily freshness checks, skip tracing, investor leads.",
    tech: "Real-time API, freshness SLA, multi-source aggregation, skip-trace API.",
    take: "Data-freshness SLA + multi-source resilience. validateSystem + expireStaleProperties is our equivalent.",
  },
  {
    name: "DealCheck", url: "dealcheck.io", price: "Free–$49/mo", users: "Investors",
    strengths: "Fast deal analysis — cash flow, cap rate, ROI, sale profit from public records + listings, photos.",
    tech: "Web + mobile, deal comparison, report export, lender comps.",
    take: "Underwriting speed + clarity. Our ROI calculators + exit-strategy models match; keep mobile analyzer one-tap.",
  },
  {
    name: "Auction.com", url: "auction.com", price: "Free to bid", users: "Largest auction platform",
    strengths: "Largest online REO + foreclosure auction, bank-owned inventory, live bidding, nationwide.",
    tech: "Live auction engine, bidder verification, escrow integration, mobile bidding.",
    take: "Live auction UX + bank-owned inventory. We have bidding + smart-contract escrow; add live auction events.",
  },
  {
    name: "PropertyOnion", url: "propertyonion.com", price: "Free/Freemium", users: "FL-focused",
    strengths: "FL foreclosure + tax-deed calendar, county auction schedules, free public data aggregation.",
    tech: "Web scraper over county sites, calendar UI, property detail pages.",
    take: "FL county auction calendar model. Our DataSource + ScrapeJob pipeline can replicate this for FL.",
  },
];

const CAPABILITY_MATRIX = [
  { cap: "County-record scraping (multi-source)", us: 8, best: "PropStream (10)", gap: "Depth of lien/equity data", status: "Strong" },
  { cap: "AI deal scoring (0–100)", us: 9, best: "ATTOM (8)", gap: "Propensity signals", status: "Leading" },
  { cap: "Ownership chain + heirs", us: 9, best: "PropStream (7)", gap: "Heir contact enrichment", status: "Leading" },
  { cap: "AI negotiation assistant", us: 9, best: "None (unique)", gap: "—", status: "Unique" },
  { cap: "Smart-contract escrow", us: 8, best: "None (unique)", gap: "Contract audit + gas", status: "Unique" },
  { cap: "Autonomous outreach engines", us: 8, best: "DealMachine (7)", gap: "In-app skip trace", status: "Strong" },
  { cap: "Market analytics + trends", us: 7, best: "ATTOM (9)", gap: "Predictive trends", status: "Strong" },
  { cap: "Mobile / D4$ field acquisition", us: 4, best: "DealMachine (10)", gap: "D4$ map mode, native app", status: "Gap" },
  { cap: "Skip-trace integration", us: 5, best: "DealMachine (9)", gap: "InvokeLLM fallback live; needs real API", status: "Gap" },
  { cap: "Live auction events", us: 3, best: "Auction.com (10)", gap: "No live auction engine", status: "Gap" },
  { cap: "Address normalization + dedupe", us: 8, best: "PropStream (9)", gap: "Live with geohash proximity dedupe", status: "Strong" },
  { cap: "Anti-detection (stealth/proxy)", us: 2, best: "BatchData (8)", gap: "No stealth/proxy layer", status: "Critical gap" },
  { cap: "Image acquisition pipeline", us: 4, best: "PropStream (9)", gap: "No GIS/Street View wiring", status: "Gap" },
  { cap: "Sold-detection re-verify", us: 7, best: "ATTOM (9)", gap: "crossReferenceProperties live + daily workflow", status: "Strong" },
  { cap: "Data freshness SLA", us: 7, best: "BatchData (10)", gap: "No formal SLA", status: "Strong" },
  { cap: "SEO / AEO optimization", us: 8, best: "PropStream (8)", gap: "JSON-LD, sitemap, Search Console live", status: "Strong" },
];

const STATUS_COLOR = {
  "Leading": "bg-emerald-600", "Unique": "bg-violet-600", "Strong": "bg-emerald-600",
  "Gap": "bg-amber-500", "Critical gap": "bg-red-600",
};

const ROADMAP = [
  { icon: Eye, t: "Stealth + proxy layer for engine", d: "Add playwright-stealth + residential proxy rotation to cloudbrowser engine. Unlocks realforeclose + Auction.com.", priority: "P0", area: "Shadow mode", status: "Blocked" },
  { icon: Phone, t: "Skip-trace API integration", d: "InvokeLLM web-search skip-trace live (fallback). Wire TLO or IRBsearch API for production-grade enrichment.", priority: "P0", area: "Contact enrichment", status: "Partial" },
  { icon: Copy, t: "Address normalization + geohash dedupe", d: "normalizeAddress + dedupeKey + proximityKey live. normalizeAddresses batch function merges duplicates.", priority: "P0", area: "Data quality", status: "Live" },
  { icon: Activity, t: "verifyActiveProperties job", d: "crossReferenceProperties function + daily workflow live. Re-verifies via LLM web search, marks expired.", priority: "P1", area: "Monitoring", status: "Live" },
  { icon: Image, t: "County GIS + Street View image pipeline", d: "Wire fetchPropertyImages to assessor GIS imagery + Google Street View Static API. Store in PropertyImage.", priority: "P1", area: "Images", status: "Partial" },
  { icon: Radar, t: "Driving-for-Dollars map mode", d: "Mobile map to tag off-market properties in the field, auto-create draft records with geocode.", priority: "P2", area: "Mobile", status: "Not started" },
  { icon: TrendingUp, t: "Live auction events", d: "Real-time bidding engine with countdown + bidder verification (Auction.com parity).", priority: "P2", area: "Auction", status: "Not started" },
  { icon: Target, t: "List-stacking UI", d: "DistressStack component live on property detail. Shows all stacked distress signals (liens, tax, code, DOM, severity).", priority: "P2", area: "Marketplace", status: "Live" },
  { icon: Gauge, t: "SEO + AEO + schema", d: "JSON-LD schema, sitemap.xml, robots.txt, dynamic sitemap, Search Console sync — all live.", priority: "P1", area: "SEO/AEO", status: "Live" },
  { icon: Bug, t: "Failure counter + auto-pause", d: "consecutive_failures + paused_until on DataSource. Auto-pauses after 3 failures, recovers next cycle.", priority: "P2", area: "Error handling", status: "Live" },
];

const PRIORITY_COLOR = { "P0": "bg-red-600", "P1": "bg-amber-500", "P2": "bg-black/60" };
const ROADMAP_STATUS = {
  "Blocked": "text-red-600", "Not started": "text-black/40", "Partial": "text-amber-600", "Function exists": "text-emerald-600", "Live": "text-emerald-600",
};

export default function AdminArchitecture() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const records = await base44.entities.SystemHealth.list("-created_date", 1);
        setHealth(records[0] || null);
      } catch (e) { setHealth(null); }
      setLoading(false);
    })();
  }, []);

  const gapCount = CAPABILITY_MATRIX.filter(c => c.status === "Gap" || c.status === "Critical gap").length;
  const criticalCount = CAPABILITY_MATRIX.filter(c => c.status === "Critical gap").length;
  const leadingCount = CAPABILITY_MATRIX.filter(c => c.status === "Leading" || c.status === "Unique").length;
  const avgScore = (CAPABILITY_MATRIX.reduce((s, c) => s + c.us, 0) / CAPABILITY_MATRIX.length).toFixed(1);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12">
      <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Admin · System Architecture Hub</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight sm:text-5xl">System memory & implementation tracker</h1>
      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-black/60">
        The single source of truth for where PropertyIntel stands against the market. Architecture decisions are
        frozen here as memory; the gap matrix and live health feed the self-reflection loop; the roadmap tracks
        every implementation needed to close the gaps.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 lg:grid-cols-4">
        <Stat label="Avg capability score" value={`${avgScore}/10`} sub="across 16 categories" />
        <Stat label="Leading / unique" value={leadingCount} sub="categories we win" tone="emerald" />
        <Stat label="Open gaps" value={gapCount} sub="need work" tone="amber" />
        <Stat label="Critical gaps" value={criticalCount} sub="blocking scale" tone="red" />
      </div>

      <section className="mt-14">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl font-light">Self-reflection — live system health</h2>
        </div>
        <p className="mt-2 text-xs text-black/50">Reads the latest SystemHealth record. This is the system looking at itself.</p>
        {loading ? (
          <div className="mt-6 rounded-sm border border-black/10 p-8 text-center text-sm text-black/40">Loading system health…</div>
        ) : health ? (
          <div className="mt-6 rounded-sm border border-black/10 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Overall status</p>
                <p className="mt-1 font-display text-xl">{health.overall_status || "unknown"}</p>
                <p className="text-xs text-black/40">Run: {health.run_at ? new Date(health.run_at).toLocaleString() : "—"}</p>
              </div>
              <div className="flex gap-6 text-sm">
                <div><p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Checks</p><p className="font-medium">{health.checks?.length || 0}</p></div>
                <div><p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Actions taken</p><p className="font-medium">{health.actions_taken?.length || 0}</p></div>
              </div>
            </div>
            {health.checks?.length > 0 && (
              <div className="mt-6 divide-y divide-black/10">
                {health.checks.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 py-3">
                    {c.status === "healthy" || c.status === "ok" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-black/50">{c.detail}</p>
                    </div>
                    <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-black/40">{c.status}</span>
                  </div>
                ))}
              </div>
            )}
            {health.actions_taken?.length > 0 && (
              <div className="mt-4 rounded-sm bg-black/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Auto-heal actions</p>
                <ul className="mt-2 space-y-1 text-xs text-black/60">
                  {health.actions_taken.map((a, i) => <li key={i}>• {a}</li>)}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-sm border border-dashed border-black/20 p-8 text-center text-sm text-black/40">
            No SystemHealth records yet. Run the validation pipeline to populate self-reflection.
          </div>
        )}
      </section>

      <section className="mt-16">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl font-light">Architecture memory — the 6 decisions</h2>
        </div>
        <p className="mt-2 text-xs text-black/50">Frozen reference. Every implementation below traces back to one of these.</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {ARCHITECTURE_DECISIONS.map((d) => (
            <div key={d.area} className="rounded-sm border border-black/10 bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <d.icon className="h-5 w-5 text-black/70" />
                  <p className="font-display text-base tracking-tight">{d.area}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-white ${d.priority === "Critical" ? "bg-red-600" : d.priority === "High" ? "bg-amber-500" : "bg-black/50"}`}>{d.priority}</span>
              </div>
              <ul className="mt-4 space-y-2">
                {d.decisions.map((dec, i) => (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed text-black/65">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gold" />
                    <span>{dec}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-sm bg-black/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Current gap</p>
                <p className="mt-1 text-xs text-black/60">{d.gap}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl font-light">Competitive benchmark — full sheet</h2>
        </div>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/15 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                <th className="pb-3 pr-4">Platform</th>
                <th className="pb-3 pr-4">Price</th>
                <th className="pb-3 pr-4">Scale</th>
                <th className="pb-3 pr-4">Core strengths</th>
                <th className="pb-3 pr-4">Technology</th>
                <th className="pb-3">What we take</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {BENCHMARK.map((b) => (
                <tr key={b.name} className="align-top">
                  <td className="py-4 pr-4">
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-black/40">{b.url}</p>
                  </td>
                  <td className="py-4 pr-4 text-black/60">{b.price}</td>
                  <td className="py-4 pr-4 text-black/60">{b.users}</td>
                  <td className="py-4 pr-4 text-black/70">{b.strengths}</td>
                  <td className="py-4 pr-4 text-black/60">{b.tech}</td>
                  <td className="py-4 text-black/60">{b.take}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl font-light">Gap matrix — us vs. market best</h2>
        </div>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/15 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                <th className="pb-3 pr-4">Capability</th>
                <th className="pb-3 pr-4">Us (0–10)</th>
                <th className="pb-3 pr-4">Market best</th>
                <th className="pb-3 pr-4">Gap</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {CAPABILITY_MATRIX.map((c) => (
                <tr key={c.cap} className="align-top">
                  <td className="py-3 pr-4 font-medium">{c.cap}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-black/10">
                        <div className="h-full bg-black" style={{ width: `${c.us * 10}%` }} />
                      </div>
                      <span className="text-xs text-black/60">{c.us}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-black/60">{c.best}</td>
                  <td className="py-3 pr-4 text-black/60">{c.gap}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-white ${STATUS_COLOR[c.status]}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl font-light">Implementation roadmap — closing the gaps</h2>
        </div>
        <p className="mt-2 text-xs text-black/50">Prioritized work items. Each traces to an architecture decision + a gap above.</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {ROADMAP.map((r) => (
            <div key={r.t} className="rounded-sm border border-black/10 bg-white p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <r.icon className="mt-0.5 h-5 w-5 shrink-0 text-black/70" />
                  <div>
                    <p className="font-display text-base tracking-tight">{r.t}</p>
                    <p className="mt-1 text-xs leading-relaxed text-black/55">{r.d}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-white ${PRIORITY_COLOR[r.priority]}`}>{r.priority}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-3 text-[10px] uppercase tracking-[0.2em]">
                <span className="text-black/40">{r.area}</span>
                <span className={ROADMAP_STATUS[r.status]}>{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-sm bg-black p-8 text-white lg:p-12">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl font-light">Architecture in one breath</h2>
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/70">
          A daily pipeline scrapes county records (LLM web-search + cloud browser) → normalizes + dedupes addresses →
          upserts properties → ingests real images (GIS + Street View) → scores every property with AI → traces ownership
          chains and heirs → skip-traces contacts → syncs market analytics. Two autonomous email engines grow the
          investor network and contact distressed owners. Accepted bids generate Solidity escrow contracts on Polygon.
          A re-verify job detects sold properties; a nightly integrity sweep auto-heals failures and expires stale
          inventory. Everything is logged, measurable, and self-healing — the system stays current without human
          intervention, and this page is its memory.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/admin/sources" className="inline-flex items-center gap-2 rounded-sm bg-white px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-black hover:bg-gold-warm">
            Data sources <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/admin/outreach" className="inline-flex items-center gap-2 rounded-sm border border-white/30 px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-white/10">
            Outreach console <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/system-dna" className="inline-flex items-center gap-2 rounded-sm border border-white/30 px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-white/10">
            System DNA <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, sub, tone }) {
  const toneCls = tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : tone === "red" ? "text-red-600" : "text-black";
  return (
    <div className="bg-white p-6">
      <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">{label}</p>
      <p className={`mt-2 font-display text-3xl font-light ${toneCls}`}>{value}</p>
      <p className="mt-1 text-xs text-black/40">{sub}</p>
    </div>
  );
}