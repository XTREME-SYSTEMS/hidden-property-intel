import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, Bitcoin, BarChart3, Building2, BookOpen, ExternalLink, ChevronDown, ChevronUp,
  Calculator, Target, Zap, DollarSign, Percent, MapPin, FileText, Cpu, Globe, Scale,
} from "lucide-react";

const SECTIONS = [
  { id: "financial", icon: TrendingUp, label: "Financial Intelligence" },
  { id: "smart-contract", icon: Bitcoin, label: "Smart Contract Intelligence" },
  { id: "market", icon: BarChart3, label: "Market Intelligence" },
  { id: "distressed", icon: Building2, label: "Distressed Property Intelligence" },
  { id: "competitors", icon: Target, label: "Competitor Intelligence" },
  { id: "resources", icon: Globe, label: "Resource Links" },
];

const FINANCIAL_METRICS = [
  { metric: "70% Rule", formula: "Max Offer = (ARV × 0.70) − Repair Costs", detail: "The golden rule of fix-and-flip. Never pay more than 70% of ARV minus repair costs. The 30% margin covers holding costs, closing costs, and profit. For BRRRR, some investors push to 75-80%.", benchmark: "70% for flips, 75-80% for BRRRR" },
  { metric: "After Repair Value (ARV)", formula: "ARV = Avg of 3-5 comparable sold properties (post-rehab)", detail: "The projected value of the property after renovations. Use 3-5 comparable sales within 0.5 miles, sold in last 6 months, similar size/bedrooms. Adjust for differences.", benchmark: "Use 3-5 comps, 0.5mi radius, 6mo lookback" },
  { metric: "Cap Rate", formula: "Cap Rate = NOI / Property Value × 100", detail: "Net Operating Income divided by property value. Measures return on an all-cash purchase. Higher cap rate = higher return but higher risk. FL markets typically run 5-9%.", benchmark: "FL: 5-9% (multifamily), 6-10% (commercial)" },
  { metric: "Cash-on-Cash Return", formula: "CoC = Annual Pre-Tax Cash Flow / Total Cash Invested × 100", detail: "Measures return on actual cash invested (not total property value). Includes financing costs. The most important metric for leveraged investors.", benchmark: "8-12% (good), 12%+ (excellent)" },
  { metric: "ROI (Return on Investment)", formula: "ROI = (Net Profit / Total Investment) × 100", detail: "Total return including appreciation, loan paydown, and cash flow. For flips: (Sale Price − Total Costs) / Total Costs. For holds: annualized total return.", benchmark: "Flips: 20-50%, Holds: 8-15% annualized" },
  { metric: "DSCR (Debt Service Coverage Ratio)", formula: "DSCR = NOI / Annual Debt Service", detail: "Lenders require DSCR ≥ 1.25 for investment property loans. Below 1.0 means the property doesn't cover its mortgage. Critical for BRRRR refinance.", benchmark: "≥1.25 (minimum), 1.5+ (strong)" },
  { metric: "BRRRR Cash Recovery", formula: "Cash Recovered = Refinance Amount − (Purchase + Rehab + Holding Costs)", detail: "The amount of cash you pull out after refinancing. Ideal BRRRR recovers 100%+ of invested capital, leaving you with a free property.", benchmark: "100%+ (ideal), 70-100% (good)" },
  { metric: "Equity Multiple", formula: "Equity Multiple = Total Distributions / Total Equity Invested", detail: "How many times your money you get back over the hold period. 2.0x means you doubled your money. Common in syndications.", benchmark: "1.5-2.5x (5yr hold)" },
  { metric: "IRR (Internal Rate of Return)", formula: "IRR = Discount rate where NPV = 0", detail: "Time-weighted annualized return. Accounts for when cash flows occur. The institutional standard for comparing investments.", benchmark: "8-15% (good), 15%+ (excellent)" },
  { metric: "Gross Rent Multiplier (GRM)", formula: "GRM = Property Price / Gross Annual Rent", detail: "Quick screening metric. Lower GRM = better deal. Doesn't account for expenses. Use for initial filter only.", benchmark: "4-8 (FL markets)" },
  { metric: "Net Operating Income (NOI)", formula: "NOI = Gross Income − Operating Expenses (excl. mortgage)", detail: "The income a property generates before debt service. Operating expenses: taxes, insurance, maintenance, management, vacancy. Excludes principal/interest.", benchmark: "60-70% of gross rent (expense ratio)" },
  { metric: "1% Rule", formula: "Monthly Rent ≥ 1% of Purchase Price", detail: "Quick screen for rental properties. If rent ≥ 1% of price, the deal likely cash flows. In high-cost FL markets, 0.8% may be acceptable.", benchmark: "1% (strong), 0.8% (acceptable in appreciating markets)" },
];

const SMART_CONTRACT_INTEL = [
  { topic: "Polygon PoS — Recommended Chain", detail: "Polygon Proof-of-Stake is the recommended blockchain for real estate escrow. Gas costs ~$0.01 per transaction (vs $5-50 on Ethereum mainnet), finality ~2 seconds, and it's EVM-compatible (Solidity works natively). Over 1M daily transactions, secured by $3B+ staked MATIC.", link: "https://polygon.technology/" },
  { topic: "Solidity 0.8.20 — Contract Language", detail: "PropertyIntel uses Solidity 0.8.20 for escrow contracts. Key features: built-in overflow protection (no SafeMath needed), custom errors (gas-efficient), immutable variables, and revert with reason strings. Contracts are compiled with solc before deployment.", link: "https://docs.soliditylang.org/en/v0.8.20/" },
  { topic: "Escrow Contract Architecture", detail: "The RealEstateEscrow contract manages: (1) earnest money deposit (held in contract), (2) buyer/seller signatures, (3) contingency tracking, (4) fund release conditions, (5) cancellation/refund logic. State machine: draft → deployed → signed → funded → closed/cancelled.", link: null },
  { topic: "Gas Estimation", detail: "Before deploying, the system estimates gas costs. Typical deployment: 500K-2M gas units × ~30 gwei = $0.15-$0.60 on Polygon. Contract interactions (sign, fund, release): 50K-200K gas = $0.01-$0.05 each. Always estimate before executing.", link: "https://docs.ethers.org/v6/" },
  { topic: "ethers.js v6 — Interaction Library", detail: "PropertyIntel uses ethers.js v6 for blockchain interaction. Key classes: JsonRpcProvider (read), Wallet (sign), Contract (interact). The deploySmartContract function compiles Solidity → deploys via Wallet → stores ABI + contract address in the SmartContract entity.", link: "https://docs.ethers.org/v6/" },
  { topic: "Smart Contract Audit", detail: "Before mainnet deployment, contracts should be audited by: CertiK, Quantstamp, ConsenSys Diligence, or OpenZeppelin. Common vulnerabilities: reentrancy (use checks-effects-interactions pattern), integer overflow (mitigated in 0.8+), access control (use OpenZeppelin Ownable). Cost: $5K-$50K depending on complexity.", link: "https://www.certik.com/" },
  { topic: "FL UETA Legal Recognition", detail: "Under FL Stat. 668.50, smart contracts and blockchain records have the same legal effect as paper records. Electronic signatures on-chain are legally binding. The statute explicitly recognizes 'smart contracts' as electronic records under UETA.", link: "https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0600-0699/0668/Sections/0668.50.html" },
  { topic: "On-Chain vs Off-Chain Data", detail: "Best practice: store only hashes and transaction references on-chain. Store full contract terms, documents, and metadata off-chain (in the SmartContract entity). The on-chain contract verifies signatures and releases funds; the off-chain system manages the full deal lifecycle.", link: null },
  { topic: "Wallet Management", detail: "PropertyIntel generates Polygon wallets (generateWallet function) and imports existing wallets (importWallet function). Private keys are stored as app secrets (POLYGON_PRIVATE_KEY). For production, use hardware wallets (Ledger) or multi-sig (Gnosis Safe) for contract deployment.", link: "https://docs.ethers.org/v6/api/wallet/" },
  { topic: "Chain State Synchronization", detail: "The syncAllContractStates function runs hourly to sync on-chain state with the SmartContract entity. It reads contract status, signature counts, and fund balances from Polygon, then updates the database. This ensures the UI always reflects the true on-chain state.", link: null },
  { topic: "Audit Logging", detail: "Every on-chain action (deploy, sign, fund, release, cancel) is logged in the SmartContract.audit_log array with: action, actor, timestamp, details, and tx_hash. This creates an immutable record of all contract interactions for legal compliance.", link: null },
];

const MARKET_INTEL = [
  { metric: "Median Home Price (FL)", value: "$395,000", trend: "+3.2% YoY", note: "FL median price has stabilized after 2022-2023 surge. Distressed markets still 20-40% below median." },
  { metric: "Days on Market (FL)", value: "67 days", trend: "+12 days YoY", note: "Inventory rising = buyer's market emerging. Distressed properties sell faster (30-45 days) due to investor demand." },
  { metric: "Active Foreclosures (FL)", value: "~12,500", trend: "+8% YoY", note: "FL ranks #3 nationally in foreclosure activity (behind IL, NJ). Miami-Dade, Broward, Orange County lead." },
  { metric: "Pre-Foreclosures (FL)", value: "~28,000", trend: "+15% YoY", note: "Rising pre-foreclosures = more distressed inventory coming. These are the highest-value leads for investors." },
  { metric: "Tax-Delinquent Properties (FL)", value: "~45,000", trend: "Stable", note: "Properties with unpaid property taxes. Available via tax deed sales and tax lien certificates. High ROI potential." },
  { metric: "Cash Buyer Percentage (FL)", value: "38%", trend: "+5% YoY", note: "FL has one of the highest cash-buyer rates in the US. Investors dominate distressed market." },
  { metric: "Average Wholesale Fee", value: "$8,000-$15,000", trend: "Stable", note: "Typical assignment fee for FL wholesale deals. Higher in South FL ($10-20K), lower in North FL ($5-10K)." },
  { metric: "Average Flip Profit", value: "$35,000-$65,000", trend: "-5% YoY", note: "Flipping margins compressing due to rising rehab costs and softening prices. 70% rule more important than ever." },
  { metric: "Cap Rates (FL Multifamily)", value: "5.5-8.5%", trend: "Rising", note: "Cap rates expanding as prices soften. Jacksonville, Tampa, Orlando offer best cap rates. Miami lowest (4-6%)." },
  { metric: "Rent Growth (FL)", value: "+4.2% YoY", trend: "Cooling", note: "Rent growth normalizing after 2021-2022 surge. Still positive, but single-digit. Good for buy-and-hold." },
];

const DISTRESS_TYPES = [
  { type: "Pre-Foreclosure", description: "Homeowner has missed 1-3 mortgage payments. Lender has filed Notice of Default (Lis Pendens in FL). Property not yet at auction.", opportunity: "Highest opportunity — owner can still sell, equity may exist, motivated seller. Best for wholesale/creative finance.", timeline: "30-120 days before auction" },
  { type: "Foreclosure (Auction)", description: "Property scheduled for public auction (foreclosure sale). In FL, judicial foreclosure — lender must file lawsuit, get judgment, then auction.", opportunity: "Buy at auction for below market. Requires cash/certified funds. No inspections, no contingencies. High risk, high reward.", timeline: "Auction day (typically 30-45 days after final judgment)" },
  { type: "REO (Bank-Owned)", description: "Property did not sell at auction and reverted to the lender. Now owned by the bank.", opportunity: "Banks motivated to sell. Can negotiate price, inspections allowed, clean title. Slower process (30-60 days).", timeline: "Listed 30-90 days after auction" },
  { type: "Probate / Inherited", description: "Property owner has died. Property is in probate court or has been inherited by heirs. Often unmaintained, taxes owed.", opportunity: "Heirs motivated to sell quickly. Properties often need work. No emotional attachment. Great for wholesale.", timeline: "3-12 months (probate process)" },
  { type: "Tax Delinquent", description: "Property owner has not paid property taxes. Property subject to tax lien sale or tax deed sale.", opportunity: "Buy tax liens (12-18% interest in FL) or buy property at tax deed sale. Can acquire for just back taxes owed. High ROI.", timeline: "2+ years delinquent → tax sale" },
  { type: "Code Violation", description: "Property has outstanding code violations (unpermitted work, blight, safety hazards). Owner faces fines/lien.", opportunity: "Owners motivated to avoid escalating fines. Properties need rehab. Good for fix-and-flip or BRRRR.", timeline: "Fines accrue daily until resolved" },
  { type: "Short Sale", description: "Owner owes more than property is worth. Lender agrees to accept less than full balance.", opportunity: "Buy below market. Lender approval required (30-90 days). Good for buy-and-hold. Patience required.", timeline: "30-90 days for lender approval" },
  { type: "Divorce", description: "Owners divorcing and need to sell jointly-owned property quickly to divide assets.", opportunity: "Motivated sellers, often need fast close. Can negotiate favorable terms. No property distress — just seller distress.", timeline: "Varies (30-180 days)" },
  { type: "Bankruptcy", description: "Owner has filed bankruptcy. Property may be sold as part of bankruptcy proceedings.", opportunity: "Trustee sale or negotiated purchase. Court approval required. Clean title. Can take 60-180 days.", timeline: "60-180 days" },
  { type: "Bank-Owned (REO) Bulk", description: "Banks selling multiple REO properties as a portfolio at a discount.", opportunity: "Buy in bulk at 50-70% of market value. Requires significant capital. Best for institutional investors.", timeline: "30-90 days" },
];

const COMPETITORS = [
  { name: "PropStream", price: "$99/mo", users: "150M+ liens", strengths: "150M+ involuntary liens, 41M pre-foreclosures, 165 filters, 20 lead lists, list-stacking, equity/mortgage-balance data, skip tracing, CRM.", ourEdge: "AI scoring + ownership chains. We match with AI-driven deal analysis." },
  { name: "DealMachine", price: "$99+/mo", users: "250K+ users", strengths: "Driving-for-Dollars mobile app, skip tracing, CRM, marketing automation, 100K+ deals closed.", ourEdge: "PWA + investor pipeline. Smart-contract escrow is unique. AI negotiation assistant." },
  { name: "PropertyRadar", price: "$249/mo", users: "Regional", strengths: "List-stacking across multiple distress lists, strong Western-state county coverage.", ourEdge: "crossReferenceProperties function. FL-focused depth. Smart contracts." },
  { name: "ATTOM Data", price: "Enterprise", users: "B2B data", strengths: "Foreclosure timelines, Propensity-to-Default scoring, nationwide warehouse.", ourEdge: "Our 0-100 score is equivalent. Enrich with default-propensity signals." },
  { name: "BatchData", price: "Tiered", users: "B2B data", strengths: "Multi-source resilience, 99.99% uptime, daily freshness, skip tracing.", ourEdge: "validateSystem + expireStaleProperties daily sweep. Auto-healing." },
  { name: "DealCheck", price: "Free-$49/mo", users: "Investors", strengths: "Fast deal analysis — cash flow, cap rate, ROI from public records.", ourEdge: "ROI calculators + exit-strategy models. Mobile analyzer. Smart contracts." },
  { name: "Auction.com", price: "Free to bid", users: "Largest auction platform", strengths: "Largest online REO + foreclosure auction, live bidding, nationwide.", ourEdge: "Smart-contract escrow. AI negotiation. Ownership chains." },
  { name: "PropertyOnion", price: "Free/Freemium", users: "FL-focused", strengths: "FL foreclosure + tax-deed calendar, county auction schedules.", ourEdge: "Full platform (not just data). Smart contracts. AI scoring. Outreach engines." },
];

const RESOURCES = [
  { category: "Florida Statutes", links: [
    { label: "FL Stat. Chapter 475 (Real Estate Brokerage)", url: "https://www.flsenate.gov/Laws/Statutes/2025/Chapter475/All" },
    { label: "FL Stat. 501.1377 (Foreclosure Rescue)", url: "https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0500-0599/0501/Sections/0501.1377.html" },
    { label: "FL Stat. 668.50 (UETA / Electronic Records)", url: "https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0600-0699/0668/Sections/0668.50.html" },
    { label: "FL Stat. 404.056 (Radon Disclosure)", url: "https://www.flsenate.gov/Laws/Statutes/2025/404.056" },
    { label: "FL Stat. 689.302 (Flood Disclosure)", url: "https://www.flsenate.gov/Laws/Statutes/2025/689.302" },
    { label: "FL Stat. 720.401 (HOA Disclosure)", url: "https://www.flsenate.gov/Laws/Statutes/2025/720.401" },
  ]},
  { category: "Federal Regulations", links: [
    { label: "SEC Tokenized Securities Statement", url: "https://www.sec.gov/newsroom/speeches-statements/corp-fin-statement-tokenized-securities-012826-statement-tokenized-securities" },
    { label: "SEC Regulation D Exemptions", url: "https://www.sec.gov/smallbusiness/exemptofferings/rule506b" },
    { label: "EPA Lead-Based Paint Disclosure", url: "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards" },
    { label: "RESPA (CFPB)", url: "https://www.consumerfinance.gov/compliance/compliance-resources/mortgage-resources/real-estate-settlement-procedures-act/" },
    { label: "FinCEN Beneficial Ownership", url: "https://www.fincen.gov/boi" },
    { label: "FinCEN CDD Rule", url: "https://www.fincen.gov/resources/statutes-and-regulations/cdd-final-rule" },
  ]},
  { category: "Industry Resources", links: [
    { label: "Florida Realtors (FAR/BAR Forms)", url: "https://www.floridarealtors.org/" },
    { label: "BiggerPockets (Investor Community)", url: "https://www.biggerpockets.com/" },
    { label: "Polygon Technology", url: "https://polygon.technology/" },
    { label: "Solidity Documentation", url: "https://docs.soliditylang.org/" },
    { label: "ethers.js v6 Docs", url: "https://docs.ethers.org/v6/" },
    { label: "CertiK Smart Contract Audit", url: "https://www.certik.com/" },
  ]},
  { category: "PropertyIntel Internal", links: [
    { label: "Legal Compliance Framework", url: "/legal-compliance" },
    { label: "System DNA & Architecture", url: "/system-dna" },
    { label: "Admin Architecture Hub", url: "/admin/architecture" },
    { label: "Deal Calculator", url: "/deal-calculator" },
    { label: "Smart Contract Marketing", url: "/smart-contracts" },
  ]},
];

export default function IndustryIntelligence() {
  const [activeSection, setActiveSection] = useState("financial");
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (id) => setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12">
      <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Industry Intelligence Framework</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight sm:text-5xl">Industry intelligence & financial frameworks</h1>
      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-black/60">
        Comprehensive intelligence framework covering financial metrics, smart contract architecture, market trends,
        distressed property types, competitor analysis, and curated resource links. Every metric and framework here
        is mapped to the PropertyIntel system's scoring, calculation, and deal analysis capabilities.
      </p>

      {/* Section navigation */}
      <div className="mt-10 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-[11px] font-medium transition ${
              activeSection === s.id
                ? "border-black bg-black text-white"
                : "border-black/15 text-black/60 hover:bg-black/5"
            }`}
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {activeSection === "financial" && (
          <Section title="Financial Intelligence" subtitle="Core Metrics, Formulas & Benchmarks" icon={TrendingUp}>
            <p className="text-sm text-black/60">
              The financial metrics every distressed real estate investor must know. Each metric is mapped to a
              PropertyIntel system feature — the Deal Calculator, PropertyScore entity, and AI scoring functions
              use these formulas to evaluate every property.
            </p>
            <div className="mt-6 space-y-3">
              {FINANCIAL_METRICS.map((m, i) => (
                <div key={i} className="rounded-sm border border-black/10">
                  <button onClick={() => toggleItem(`fin-${i}`)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                    <div>
                      <span className="text-sm font-medium text-black/80">{m.metric}</span>
                      <span className="ml-3 font-mono text-xs text-black/40">{m.formula}</span>
                    </div>
                    {expandedItems[`fin-${i}`] ? <ChevronUp className="h-4 w-4 text-black/40" /> : <ChevronDown className="h-4 w-4 text-black/40" />}
                  </button>
                  {expandedItems[`fin-${i}`] && (
                    <div className="border-t border-black/10 px-4 py-3">
                      <p className="text-sm leading-relaxed text-black/60">{m.detail}</p>
                      <p className="mt-2 text-xs"><span className="text-black/40">Benchmark: </span><span className="font-medium text-black/70">{m.benchmark}</span></p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Callout type="info" title="System Integration">
              The PropertyIntel DealCalculator page and PropertyScore entity implement these metrics. The scoreProperty
              function calculates ROI, ARV, repair costs, and comparable sales using InvokeLLM with web search context.
              The 70% rule is enforced in the deal analysis pipeline.
            </Callout>
            <Link to="/deal-calculator" className="mt-4 inline-flex items-center gap-2 rounded-sm bg-black px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-black/80">
              <Calculator className="h-4 w-4" /> Open Deal Calculator
            </Link>
          </Section>
        )}

        {activeSection === "smart-contract" && (
          <Section title="Smart Contract Intelligence" subtitle="Polygon / Solidity / Escrow Architecture" icon={Bitcoin}>
            <p className="text-sm text-black/60">
              Deep intelligence on the blockchain layer of PropertyIntel. The platform deploys Solidity escrow
              contracts on Polygon PoS, managed via ethers.js v6. Every contract has an on-chain escrow + off-chain
              metadata architecture, with hourly chain-state synchronization.
            </p>
            <div className="mt-6 space-y-3">
              {SMART_CONTRACT_INTEL.map((s, i) => (
                <div key={i} className="rounded-sm border border-black/10">
                  <button onClick={() => toggleItem(`sc-${i}`)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                    <span className="text-sm font-medium text-black/80">{s.topic}</span>
                    {expandedItems[`sc-${i}`] ? <ChevronUp className="h-4 w-4 text-black/40" /> : <ChevronDown className="h-4 w-4 text-black/40" />}
                  </button>
                  {expandedItems[`sc-${i}`] && (
                    <div className="border-t border-black/10 px-4 py-3">
                      <p className="text-sm leading-relaxed text-black/60">{s.detail}</p>
                      {s.link && (
                        <a href={s.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-black underline">
                          <ExternalLink className="h-3 w-3" /> Learn more
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Callout type="success" title="System Architecture">
              PropertyIntel's smart contract stack: Solidity 0.8.20 → solc compile → ethers.js v6 deploy → Polygon PoS →
              SmartContract entity (ABI + address + terms) → hourly syncAllContractStates workflow → audit_log array.
              All legally recognized under FL Stat. 668.50 (UETA).
            </Callout>
            <Link to="/smart-contracts" className="mt-4 inline-flex items-center gap-2 rounded-sm border border-black/15 px-5 py-3 text-[11px] uppercase tracking-[0.3em] hover:bg-black hover:text-white">
              <Cpu className="h-4 w-4" /> Smart Contract Overview
            </Link>
          </Section>
        )}

        {activeSection === "market" && (
          <Section title="Market Intelligence" subtitle="Florida Real Estate Market Indicators (2025)" icon={BarChart3}>
            <p className="text-sm text-black/60">
              Current Florida real estate market indicators relevant to distressed property investing. Data sourced
              from public records, foreclosure filings, and market analytics. The PropertyIntel syncMarketAnalytics
              function updates these metrics regularly via web search.
            </p>
            <div className="mt-6 grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-3">
              {MARKET_INTEL.map((m, i) => (
                <div key={i} className="bg-white p-5">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">{m.metric}</p>
                  <p className="mt-2 font-display text-2xl font-light">{m.value}</p>
                  <p className="mt-1 text-xs font-medium text-emerald-600">{m.trend}</p>
                  <p className="mt-2 text-xs leading-relaxed text-black/50">{m.note}</p>
                </div>
              ))}
            </div>
            <Callout type="info" title="System Integration">
              The MarketAnalytics entity and syncMarketAnalytics function capture regional avg price, price/sqft,
              days-on-market, distress counts, and ROI trends. The matchAndNotifyAlerts workflow uses these to match
              investor saved searches with new properties.
            </Callout>
          </Section>
        )}

        {activeSection === "distressed" && (
          <Section title="Distressed Property Intelligence" subtitle="Distress Types, Opportunities & Timelines" icon={Building2}>
            <p className="text-sm text-black/60">
              Every type of distressed property in the Florida market, with the opportunity, timeline, and best
              strategy for each. The PropertyIntel Property entity tracks these via the distress_type field, and the
              DataSource pipeline scrapes each type from county records.
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/15 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                    <th className="pb-3 pr-4">Distress Type</th>
                    <th className="pb-3 pr-4">Description</th>
                    <th className="pb-3 pr-4">Opportunity</th>
                    <th className="pb-3">Timeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {DISTRESS_TYPES.map((d, i) => (
                    <tr key={i} className="align-top">
                      <td className="py-3 pr-4 font-medium">{d.type}</td>
                      <td className="py-3 pr-4 text-black/60">{d.description}</td>
                      <td className="py-3 pr-4 text-black/70">{d.opportunity}</td>
                      <td className="py-3 text-black/60">{d.timeline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Callout type="info" title="System Integration">
              The Property.distress_type enum includes: pre-foreclosure, foreclosure, probate_inherited, tax_delinquent,
              code_violation, divorce, bankruptcy, auction, short_sale, bank_owned. The DistressStack component
              visualizes all stacked distress signals on each property detail page.
            </Callout>
          </Section>
        )}

        {activeSection === "competitors" && (
          <Section title="Competitor Intelligence" subtitle="Platform Comparison & Our Edge" icon={Target}>
            <p className="text-sm text-black/60">
              Side-by-side comparison of PropertyIntel against the top distressed-property platforms. Each competitor's
              strengths are mapped to our unique edge. This intelligence drives the product roadmap and pricing
              strategy (20% below competitor pricing).
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/15 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                    <th className="pb-3 pr-4">Platform</th>
                    <th className="pb-3 pr-4">Price</th>
                    <th className="pb-3 pr-4">Scale</th>
                    <th className="pb-3 pr-4">Core Strengths</th>
                    <th className="pb-3">Our Edge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {COMPETITORS.map((c, i) => (
                    <tr key={i} className="align-top">
                      <td className="py-3 pr-4 font-medium">{c.name}</td>
                      <td className="py-3 pr-4 text-black/60">{c.price}</td>
                      <td className="py-3 pr-4 text-black/60">{c.users}</td>
                      <td className="py-3 pr-4 text-black/70">{c.strengths}</td>
                      <td className="py-3 text-black/70">{c.ourEdge}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Callout type="success" title="Unique Advantages">
              PropertyIntel's unique capabilities no competitor offers: (1) AI negotiation assistant, (2) smart-contract
              escrow on Polygon, (3) ownership chain + heir tracing, (4) autonomous outreach engines, (5) auto-healing
              data pipeline. Priced 20% below all competitors.
            </Callout>
            <Link to="/system-dna" className="mt-4 inline-flex items-center gap-2 rounded-sm border border-black/15 px-5 py-3 text-[11px] uppercase tracking-[0.3em] hover:bg-black hover:text-white">
              <Zap className="h-4 w-4" /> System DNA
            </Link>
          </Section>
        )}

        {activeSection === "resources" && (
          <Section title="Resource Links" subtitle="Statutes, Regulations & Industry Resources" icon={Globe}>
            <p className="text-sm text-black/60">
              Curated links to every statute, regulation, and industry resource referenced in this intelligence
              framework. Organized by category for quick reference.
            </p>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {RESOURCES.map((cat, i) => (
                <div key={i} className="rounded-sm border border-black/10 p-5">
                  <h3 className="font-display text-base font-medium">{cat.category}</h3>
                  <div className="mt-3 space-y-2">
                    {cat.links.map((l, j) => (
                      <a
                        key={j}
                        href={l.url}
                        target={l.url.startsWith("/") ? undefined : "_blank"}
                        rel={l.url.startsWith("/") ? undefined : "noreferrer"}
                        className="flex items-center gap-2 text-sm text-black/70 hover:text-black hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-black/40" />
                        {l.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Footer link to legal compliance */}
      <div className="mt-16 rounded-sm bg-black p-8 text-white lg:p-12">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl font-light">Paired with Legal Compliance</h2>
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/70">
          This intelligence framework is paired with the Legal Compliance Framework, which maps every system feature
          to its corresponding legal requirement. Together, they form the complete operational intelligence layer for
          PropertyIntel — ensuring every action the system takes is both financially sound and legally compliant.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/legal-compliance" className="inline-flex items-center gap-2 rounded-sm bg-white px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-black hover:bg-gold-warm">
            <Scale className="h-4 w-4" /> Legal Compliance
          </Link>
          <Link to="/admin" className="inline-flex items-center gap-2 rounded-sm border border-white/30 px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-white/10">
            Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="rounded-sm border border-black/10 bg-white p-8 lg:p-10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-black/5">
          <Icon className="h-5 w-5 text-black/70" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-light tracking-tight">{title}</h2>
          <p className="text-xs text-black/40">{subtitle}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Callout({ type, title, children }) {
  const styles = {
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };
  return (
    <div className={`mt-6 rounded-sm border p-4 ${styles[type]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em]">{title}</p>
      <p className="mt-2 text-sm leading-relaxed">{children}</p>
    </div>
  );
}