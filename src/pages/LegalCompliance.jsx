import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Scale, FileText, ShieldCheck, Building2, Bitcoin, DollarSign, Users, AlertTriangle,
  CheckCircle2, ExternalLink as ExternalLinkIcon, ChevronDown, ChevronUp, BookOpen, Gavel, Lock,
} from "lucide-react";

const SECTIONS = [
  { id: "wholesaling", icon: Scale, label: "Wholesaling & Brokerage", statute: "FL Stat. 475" },
  { id: "distressed", icon: AlertTriangle, label: "Distressed Property Protections", statute: "FL Stat. 501.1377, 697.08" },
  { id: "disclosures", icon: FileText, label: "Required Disclosures", statute: "FL & Federal" },
  { id: "esignatures", icon: ShieldCheck, label: "Digital Signatures", statute: "ESIGN / UETA / FL 668.50" },
  { id: "smart-contracts", icon: Bitcoin, label: "Smart Contract & Blockchain", statute: "SEC / Reg D-S-A+-CF" },
  { id: "federal", icon: DollarSign, label: "Federal Regulations", statute: "RESPA / Dodd-Frank / SAFE" },
  { id: "kyc-aml", icon: Users, label: "KYC / AML & FinCEN", statute: "CTA / FinCEN CDD" },
  { id: "forms", icon: BookOpen, label: "Required Forms Library", statute: "FAR/BAR + Federal" },
  { id: "system-mapping", icon: Lock, label: "System Compliance Mapping", statute: "PropertyIntel" },
];

const WHOLESALING_RULES = [
  { rule: "Contract assignment is legal", detail: "Florida has no specific wholesaling statute. Assigning your own purchase contract is legal — you're selling your equitable interest, not brokering.", citation: "FL Stat. 475.011" },
  { rule: "No license required to assign your own contract", detail: "You don't need a real estate license to assign a contract in which you have a bona fide equitable interest. The license requirement applies to brokering someone else's property.", citation: "FL Stat. 475.01" },
  { rule: "Marketing the property = unlicensed brokerage", detail: "If you market or advertise the property itself (not your contract interest) to the public, the DBPR may consider this unlicensed brokerage activity — a third-degree felony.", citation: "FL Stat. 475.42" },
  { rule: "Assignment fee ≠ commission", detail: "Your assignment fee must be characterized as compensation for assigning your contractual position, not a commission for brokerage services. A commission-based fee contract is unenforceable without a license.", citation: "FL Stat. 475.01(1)(a)" },
  { rule: "Must disclose licensed/unlicensed status", detail: "In any wholesale transaction, you must state whether you are a licensed real estate agent or not. Transparency is mandatory.", citation: "FL Stat. 475.42" },
  { rule: "Build seller relationship before contract", detail: "The cleanest legal posture is to establish a bona fide intent to purchase. Taking title (double-close or transactional funding) eliminates brokerage risk entirely.", citation: "Industry best practice" },
];

const DISTRESSED_REQUIREMENTS = [
  { req: "Written agreement required", detail: "All foreclosure-rescue consultant agreements must be in writing, printed in at least 12-point uppercase type, and signed by both parties.", citation: "FL Stat. 501.1377(4)(a)" },
  { req: "1-day review period", detail: "The foreclosure-rescue consultant must give the homeowner a copy of the agreement to review not less than 1 business day before signing.", citation: "FL Stat. 501.1377(4)(a)" },
  { req: "3-day non-waivable cancellation right", detail: "The homeowner has the right to cancel the agreement within 3 business days after signing. This right cannot be waived or limited.", citation: "FL Stat. 501.1377(4)(b)" },
  { req: "Mandatory cancellation notice", detail: "The agreement must contain a specific uppercase statement above the signature line explaining the homeowner's right to cancel.", citation: "FL Stat. 501.1377(4)(c)" },
  { req: "No upfront fees for rescue services", detail: "Foreclosure-rescue consultants may not collect payment before completing all promised services. Payments must be returned within 10 business days of cancellation.", citation: "FL Stat. 501.1377(3)(b)" },
  { req: "Equity purchaser disclosure", detail: "Equity purchasers must provide a written disclosure of the nature of the transaction and the homeowner's right to rescind.", citation: "FL Stat. 501.1377(5)" },
  { req: "$15,000 penalty per violation", detail: "Violations carry civil penalties of $15,000 per violation, enforceable by the Florida Attorney General under FDUPTA.", citation: "FL Stat. 501.1377(7)" },
  { req: "Copy of signed agreement within 3 hours", detail: "The consultant must give the homeowner a copy of the signed agreement within 3 hours after execution.", citation: "FL Stat. 501.1377(4)(e)" },
];

const DISCLOSURES = [
  { name: "Radon Gas Disclosure", authority: "FL Stat. 404.056(5)", when: "Every FL real estate contract", requirement: "Must include specific statutory language warning about radon gas. Language is prescribed by statute and appears in FAR/BAR contracts by default.", link: "https://www.flsenate.gov/Laws/Statutes/2025/404.056" },
  { name: "Lead-Based Paint Disclosure", authority: "42 U.S.C. 4852d (Federal)", when: "Homes built before 1978", requirement: "Sellers must disclose known lead-based paint hazards, provide EPA pamphlet 'Protect Your Family from Lead in Your Home', and give buyers a 10-day inspection window. Applies even if seller has no knowledge of lead.", link: "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards" },
  { name: "Flood Disclosure (FD-1)", authority: "FL Stat. 689.302 (eff. Oct 1, 2024)", when: "All FL residential sales", requirement: "Standalone form completed at or before contract execution. Must disclose: (1) knowledge of flooding that damaged property during ownership, (2) whether flood insurance claims were filed, (3) whether FEMA/federal flood assistance was received.", link: "https://www.flsenate.gov/Laws/Statutes/2025/689.302" },
  { name: "HOA/Condo Disclosure", authority: "FL Stat. 720.401 / 718.503", when: "Properties in HOA or condo associations", requirement: "Must provide declaration, bylaws, rules, most recent financial statements, and management information before or at contract execution. Condo sellers have parallel obligations under Chapter 718.", link: "https://www.flsenate.gov/Laws/Statutes/2025/720.401" },
  { name: "Coastal Construction Disclosure", authority: "FL Stat. 161.57", when: "Properties seaward of Coastal Construction Control Line", requirement: "Must disclose that property may be subject to regulations regarding construction, erosion, coastal protection, beach nourishment, and marine turtle protection.", link: "https://www.flsenate.gov/Laws/Statutes/2025/161.57" },
  { name: "Property Tax Disclosure", authority: "FL Stat. 689.261", when: "All FL real estate contracts", requirement: "Must include disclosure informing buyers that property taxes may increase substantially after purchase.", link: "https://www.flsenate.gov/Laws/Statutes/2025/689.261" },
  { name: "Seller's Property Disclosure (FAR/BAR)", authority: "Johnson v. Davis (FL Supreme Court)", when: "All residential sales", requirement: "Florida's common law duty (Johnson v. Davis, 480 So. 2d 625) requires sellers to disclose all known material defects not readily observable. The FAR/BAR form organizes this but is not a ceiling — sellers remain liable for undisclosed known defects.", link: "https://www.palmparadiserealty.com/blog/sellers-disclosure-florida/" },
  { name: "Mold Disclosure", authority: "Industry standard / FL common law", when: "When mold is known or suspected", requirement: "No specific FL statute, but falls under Johnson v. Davis material defect disclosure duty. Must disclose known mold issues that materially affect value.", link: null },
];

const ESIGN_REQUIREMENTS = [
  { req: "Intent to sign electronically", detail: "Both parties must demonstrate intent to sign electronically. The system must capture this intent (e.g., clicking 'I agree to sign electronically')." },
  { req: "Consent to do business electronically", detail: "Parties must consent to electronic records. The system must provide a way to opt out and obtain paper copies if requested." },
  { req: "Record retention", detail: "Electronic records must be retained and accurately reproduced for later reference by all parties. Must be accessible and printable." },
  { req: "Attribution", detail: "The signature must be attributable to the person signing. The system must capture IP address, timestamp, user agent, and authentication method." },
  { req: "Same legal effect as handwritten", detail: "Under ESIGN (federal) and UETA (FL 668.50), electronic signatures have the same legal effect as handwritten signatures for most commercial transactions.", citation: "15 U.S.C. 7001 / FL Stat. 668.50" },
  { req: "Audit trail", detail: "The system must maintain a complete audit trail: who signed, what they signed, when they signed, and the document hash at time of signing." },
];

const SMART_CONTRACT_COMPLIANCE = [
  { area: "Securities registration requirement", detail: "Every offer and sale of a security must be registered with the SEC unless an exemption applies. Tokenized real estate interests are likely securities under the Howey test.", citation: "Securities Act 1933, §5", link: "https://www.sec.gov/newsroom/speeches-statements/corp-fin-statement-tokenized-securities-012826-statement-tokenized-securities" },
  { area: "Regulation D — Rule 506(b)", detail: "Unlimited fundraising from accredited investors only. No general solicitation. Form D must be filed with SEC within 15 days of first sale. Most common exemption for real estate tokenization.", link: "https://www.sec.gov/smallbusiness/exemptofferings/rule506b" },
  { area: "Regulation D — Rule 506(c)", detail: "Unlimited fundraising with general solicitation allowed, but must take reasonable steps to verify all purchasers are accredited investors (income >$200K/yr or net worth >$1M).", link: "https://www.sec.gov/smallbusiness/exemptofferings/rule506c" },
  { area: "Regulation S", detail: "Exemption for offerings made exclusively to non-U.S. persons outside the United States. No SEC registration required for offshore sales.", link: "https://www.sec.gov/smallbusiness/exemptofferings/regulations" },
  { area: "Regulation A+ (Tier 2)", detail: 'Mini-IPO allowing up to $75M/year from both accredited and non-accredited investors. Requires SEC-qualified offering statement (Form 1-A) and ongoing reporting. "Test the waters" permitted.', link: "https://www.sec.gov/smallbusiness/exemptofferings/regulationa" },
  { area: "Regulation CF (Crowdfunding)", detail: "Up to $5M/year from retail investors via SEC-registered funding portals. Investment limits based on income/net worth. Requires Form C filings.", link: "https://www.sec.gov/smallbusiness/exemptofferings/regulation-crowdfunding" },
  { area: "Howey Test", detail: "An investment contract exists if: (1) investment of money, (2) in a common enterprise, (3) with expectation of profit, (4) derived from efforts of others. Tokenized real estate with passive investors likely meets this test.", link: "https://www.investopedia.com/terms/h/howey-test.asp" },
  { area: "Florida UETA for smart contracts", detail: "Under FL Stat. 668.50, smart contracts and blockchain-based transactions are legally recognizable as electronic records and signatures. They operate within a valid electronic records framework.", citation: "FL Stat. 668.50", link: "https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0600-0699/0668/Sections/0668.50.html" },
  { area: "Smart contract audit", detail: "All deployed smart contracts should be audited by a reputable firm (CertiK, Quantstamp, ConsenSys Diligence) before mainnet deployment. Audits are not legally required but are industry standard for liability protection.", link: "https://www.certik.com/" },
  { area: "Gas and network risks", detail: "Polygon PoS is the recommended chain for real estate escrow due to low gas costs (~$0.01) and fast finality (~2s). Ethereum mainnet is cost-prohibitive for most real estate transactions.", link: "https://polygon.technology/" },
];

const FEDERAL_REGS = [
  { name: "RESPA (Real Estate Settlement Procedures Act)", authority: "12 U.S.C. 2601-2617", applies: "Most residential mortgage transactions", requirements: "Prohibits kickbacks and referral fees between settlement service providers. Requires GFE/Loan Estimate and HUD-1/Closing Disclosure. Applies to wholesaling when a mortgage is involved. Violations carry treble damages.", link: "https://www.consumerfinance.gov/compliance/compliance-resources/mortgage-resources/real-estate-settlement-procedures-act/" },
  { name: "Dodd-Frank Act — Seller Financing", authority: "12 U.S.C. 5101 et seq.", applies: "Seller-financed residential 1-4 unit properties", requirements: "One-property exclusion: 1 property/12 months, individual/trust/estate only, fixed or 5+yr ARM, no negative amortization, no ability-to-repay determination. Three-property exclusion: 3 properties/12 months, fully amortizing, no balloon, good-faith ability-to-repay determination. >5 deals/yr = must be licensed mortgage originator.", link: "https://barneswalker.com/seller-financing-restrictions-under-the-dodd-frank-act/" },
  { name: "SAFE Act (Secure and Fair Enforcement)", authority: "12 U.S.C. 5101", applies: "Mortgage loan originators", requirements: "Requires licensing for anyone who takes a residential mortgage loan application or offers/negotiates terms for compensation. Exemptions for seller-financing under Dodd-Frank limits. State-level licensing via NMLS.", link: "https://www.flsenate.gov/Laws/Statutes/2025/494" },
  { name: "TRID Rule (TILA-RESPA Integrated Disclosure)", authority: "12 CFR 1026.19", applies: "Most closed-end consumer credit secured by real property", requirements: "Requires Loan Estimate (3 business days after application) and Closing Disclosure (3 business days before consummation). Investors doing ≤5 seller-financed deals/yr are exempt.", link: "https://www.consumerfinance.gov/rules-policy/final-rules/integrated-mortgage-disclosures-rule-under-tila-respa-regulation-z/" },
  { name: "Fair Housing Act", authority: "42 U.S.C. 3601-3619", applies: "All housing transactions", requirements: "Prohibits discrimination based on race, color, national origin, religion, sex, familial status, or disability. Applies to advertising, showing, terms, and closing. Violations carry actual + punitive damages.", link: "https://www.hud.gov/topics/housing_discrimination" },
];

const KYC_AML = [
  { req: "Corporate Transparency Act (CTA) reporting", detail: "All business entities (LLCs, corps) formed or registered to do business in the US must report beneficial ownership information to FinCEN. Existing entities (pre-2024) must file by Jan 1, 2025. New entities must file within 90 days of formation.", citation: "31 U.S.C. 5336", link: "https://www.fincen.gov/boi" },
  { req: "Beneficial owner definition", detail: "Any individual who directly or indirectly owns 25%+ of equity interests, OR exercises substantial control over the entity. Must report: full legal name, date of birth, current address, and unique ID number.", citation: "FinCEN CDD Rule", link: "https://www.fincen.gov/resources/statutes-and-regulations/cdd-final-rule" },
  { req: "KYC for blockchain transactions", detail: "While not directly regulated like banks, platforms facilitating real estate tokenization should implement KYC/AML procedures to avoid being classified as an unregistered money transmitter or MSB.", citation: "FinCEN MSB regulations", link: "https://www.fincen.gov/resources/statutes-and-regulations" },
  { req: "Currency Transaction Reports (CTR)", detail: "Cash transactions >$10,000 in a single business day require a CTR filing. Real estate closings involving cash must be reported.", citation: "31 U.S.C. 5313", link: "https://www.fincen.gov/resources/statutes-and-regulations" },
  { req: "Suspicious Activity Reports (SAR)", detail: "Financial institutions must file SARs for suspicious transactions. Real estate professionals should be aware of structuring (breaking large cash transactions into smaller ones to avoid CTRs).", citation: "31 U.S.C. 5318(g)", link: "https://www.fincen.gov/resources/statutes-and-regulations" },
  { req: "FinCEN Real Estate AML Rule", detail: "FinCEN issued a final rule requiring AML reporting for the real estate sector, targeting non-financed (cash) transactions. Transferee entities must report beneficial ownership at closing.", citation: "FinCEN Final Rule 2024", link: "https://www.mcdermottlaw.com/insights/fincen-issues-final-rule-requiring-aml-reporting-for-real-estate-sector/" },
];

const REQUIRED_FORMS = [
  { form: "FAR/BAR 'AS IS' Residential Contract", purpose: "Standard FL purchase contract (Florida Realtors + Florida Bar approved)", when: "All residential purchases", authority: "Florida Realtors / FL Bar" },
  { form: "Seller's Property Disclosure Form", purpose: "Discloses known material defects", when: "All residential sales", authority: "Johnson v. Davis / FL common law" },
  { form: "Radon Disclosure Statement", purpose: "Statutory radon warning (included in FAR/BAR)", when: "Every FL real estate contract", authority: "FL Stat. 404.056(5)" },
  { form: "Lead-Based Paint Disclosure Form", purpose: "Federal lead hazard disclosure + EPA pamphlet", when: "Properties built before 1978", authority: "42 U.S.C. 4852d" },
  { form: "Flood Disclosure Form (FD-1)", purpose: "Discloses flood history, claims, and FEMA assistance", when: "All FL residential sales (eff. Oct 1, 2024)", authority: "FL Stat. 689.302" },
  { form: "HOA/Condo Disclosure Package", purpose: "Declaration, bylaws, rules, financials, management info", when: "Properties in HOA/condo associations", authority: "FL Stat. 720.401 / 718.503" },
  { form: "Coastal Construction Disclosure", purpose: "Discloses CCCL regulations and erosion risk", when: "Properties seaward of CCCL", authority: "FL Stat. 161.57" },
  { form: "Property Tax Disclosure", purpose: "Warns buyer of potential tax increase after purchase", when: "All FL real estate contracts", authority: "FL Stat. 689.261" },
  { form: "Assignment Contract", purpose: "Assigns equitable interest in purchase contract to end buyer", when: "Wholesale transactions", authority: "FL contract law" },
  { form: "Foreclosure-Rescue Agreement", purpose: "Written agreement for foreclosure-rescue services (12pt uppercase, cancellation notice)", when: "Distressed/foreclosure properties", authority: "FL Stat. 501.1377(4)" },
  { form: "Purchase & Sale Agreement (PSA)", purpose: "Binding contract between buyer and seller", when: "All transactions", authority: "FL contract law" },
  { form: "Escrow Agreement", purpose: "Governs earnest money deposit and escrow terms", when: "All transactions with earnest money", authority: "FL contract law" },
  { form: "Warranty Deed / Quitclaim Deed", purpose: "Transfers title from seller to buyer", when: "At closing", authority: "FL Stat. 689" },
  { form: "Digital Signature Record", purpose: "ESIGN/UETA-compliant electronic signature with audit trail", when: "All digitally signed documents", authority: "ESIGN / FL Stat. 668.50" },
  { form: "Smart Contract (Solidity)", purpose: "Blockchain escrow on Polygon managing earnest money + signatures", when: "Blockchain-secured transactions", authority: "FL Stat. 668.50 / Polygon" },
  { form: "Form D (SEC)", purpose: "Notice of exempt offering under Reg D", when: "Tokenized real estate offerings", authority: "Securities Act 1933" },
  { form: "BOI Report (FinCEN)", purpose: "Beneficial ownership information report", when: "All business entities", authority: "Corporate Transparency Act" },
];

const SYSTEM_MAPPING = [
  { systemFeature: "Property entity (distress_type field)", complianceArea: "Distressed Property Protections", requirement: "Properties flagged as pre-foreclosure/foreclosure trigger FL 501.1377 requirements. System must enforce written agreement + 3-day cancellation.", status: "Enforced" },
  { systemFeature: "generateLegalDisclosures function", complianceArea: "Required Disclosures", requirement: "Generates FL-mandated disclosure forms (seller, lead paint, radon, HOA, mold). Must include all 8 statutory disclosures.", status: "Live" },
  { systemFeature: "DigitalSignature entity + signDocument function", complianceArea: "Digital Signatures", requirement: "ESIGN/UETA compliance: captures IP, timestamp, user agent, document hash, and signer attribution. FL 668.50 compliant.", status: "Live" },
  { systemFeature: "SmartContract entity + deploySmartContract function", complianceArea: "Smart Contract & Blockchain", requirement: "Deploys Solidity escrow on Polygon. Must comply with SEC Reg D if tokenized. FL UETA 668.50 recognizes smart contracts.", status: "Live" },
  { systemFeature: "Owner entity (outreach_status)", complianceArea: "Distressed Property Protections", requirement: "Outreach to distressed owners must include 501.1377 disclosures. System tracks outreach_status to ensure compliance.", status: "Live" },
  { systemFeature: "Investor entity (subscription_plan)", complianceArea: "Securities Compliance", requirement: "If subscription = equity/token in properties, must verify accredited investor status under Reg D 506(c) or register under Reg A+.", status: "Review needed" },
  { systemFeature: "Deal entity (exit_strategy: wholesale)", complianceArea: "Wholesaling & Brokerage", requirement: "Wholesale deals must verify assignment (not brokerage), disclose licensed/unlicensed status, and avoid marketing property publicly.", status: "Review needed" },
  { systemFeature: "User entity (role: admin/user)", complianceArea: "KYC/AML", requirement: "System should collect and verify beneficial ownership info for entity users (LLCs) per FinCEN CTA. Individual users need identity verification.", status: "Review needed" },
  { systemFeature: "createCheckoutSession (Stripe)", complianceArea: "Federal Regulations", requirement: "Payment processing must comply with RESPA (no kickbacks) and Fair Housing Act (no discrimination in advertising/terms).", status: "Live" },
  { systemFeature: "aiNegotiationAssistant function", complianceArea: "Wholesaling & Brokerage", requirement: "AI-generated negotiation scripts must not constitute unlicensed brokerage advice. Must include disclaimer that AI is not a licensed agent.", status: "Review needed" },
];

export default function LegalCompliance() {
  const [activeSection, setActiveSection] = useState("wholesaling");
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (id) => setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12">
      <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Legal Compliance Framework</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight sm:text-5xl">Legal compliance & regulatory intelligence</h1>
      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-black/60">
        Comprehensive legal compliance framework for distressed real estate investment in Florida. Covers wholesaling
        laws, distressed property protections, required disclosures, digital signature compliance, smart contract
        regulations, federal statutes, KYC/AML requirements, and the full forms library — mapped to every feature in
        the PropertyIntel system.
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
        {activeSection === "wholesaling" && (
          <Section title="Wholesaling & Brokerage Compliance" subtitle="Florida Statute 475 — Real Estate Brokerage" icon={Scale}>
            <p className="text-sm text-black/60">
              Florida has no specific wholesaling statute. Contract assignments are legal, and no real estate license is
              required to assign your own purchase contract. However, Chapter 475 of the Florida Statutes governs real
              estate brokerage, and the line between assigning a contract and unlicensed brokerage activity is the key
              compliance issue every Florida wholesaler must understand. The DBPR and FREC enforce these provisions.
            </p>
            <div className="mt-6 space-y-3">
              {WHOLESALING_RULES.map((r, i) => (
                <ExpandableItem key={i} id={`w-${i}`} title={r.rule} detail={r.detail} citation={r.citation} expanded={expandedItems[`w-${i}`]} onToggle={() => toggleItem(`w-${i}`)} />
              ))}
            </div>
            <Callout type="warning" title="Critical Risk">
              Marketing a property you don't own (as opposed to marketing your contract interest) is unlicensed
              brokerage — a third-degree felony under FL Stat. 475.42. Always market your assignable contract, not the
              property itself. The safest posture is taking title via double-close or transactional funding.
            </Callout>
            <ResourceLink href="https://dealrun.ai/compliance/florida" label="Full FL Wholesaling Compliance Guide" />
            <ResourceLink href="https://www.flsenate.gov/Laws/Statutes/2025/Chapter475/All" label="FL Stat. Chapter 475 (full text)" />
          </Section>
        )}

        {activeSection === "distressed" && (
          <Section title="Distressed Property & Foreclosure Rescue" subtitle="FL Stat. 501.1377 & 697.08 — Homeowner Protections" icon={AlertTriangle}>
            <p className="text-sm text-black/60">
              Florida has specific consumer protection laws for transactions involving distressed sellers — homeowners
              who are delinquent on their mortgage or facing foreclosure. These statutes require written agreements,
              cancellation rights, and strict disclosure obligations. Violations carry penalties of $15,000 per
              violation, enforceable by the Florida Attorney General under FDUPTA.
            </p>
            <div className="mt-6 space-y-3">
              {DISTRESSED_REQUIREMENTS.map((r, i) => (
                <ExpandableItem key={i} id={`d-${i}`} title={r.req} detail={r.detail} citation={r.citation} expanded={expandedItems[`d-${i}`]} onToggle={() => toggleItem(`d-${i}`)} />
              ))}
            </div>
            <Callout type="danger" title="$15,000 Per Violation">
              Every violation of FL Stat. 501.1377 carries a $15,000 civil penalty. A single distressed-property
              transaction with multiple violations (no written agreement, no cancellation notice, upfront fees) can
              result in $45,000+ in penalties. These requirements are NOT optional for distressed property investors.
            </Callout>
            <ResourceLink href="https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0500-0599/0501/Sections/0501.1377.html" label="FL Stat. 501.1377 (full text)" />
          </Section>
        )}

        {activeSection === "disclosures" && (
          <Section title="Required Disclosures" subtitle="Florida Statutory + Federal Disclosure Requirements" icon={FileText}>
            <p className="text-sm text-black/60">
              Florida requires specific statutory disclosures in every real estate transaction, plus federal
              disclosures for certain properties. The FAR/BAR Seller's Property Disclosure form accompanies most
              residential contracts, but statutory disclosures (radon, flood, lead paint) are separately mandated
              and cannot be waived.
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/15 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                    <th className="pb-3 pr-4">Disclosure</th>
                    <th className="pb-3 pr-4">Authority</th>
                    <th className="pb-3 pr-4">When Required</th>
                    <th className="pb-3 pr-4">Requirement</th>
                    <th className="pb-3">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {DISCLOSURES.map((d, i) => (
                    <tr key={i} className="align-top">
                      <td className="py-3 pr-4 font-medium">{d.name}</td>
                      <td className="py-3 pr-4 text-black/60">{d.authority}</td>
                      <td className="py-3 pr-4 text-black/60">{d.when}</td>
                      <td className="py-3 pr-4 text-black/70">{d.requirement}</td>
                      <td className="py-3">
                        {d.link && (
                          <a href={d.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-black underline">
                            <ExternalLinkIcon className="h-3 w-3" /> View
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Callout type="info" title="Johnson v. Davis Common Law Duty">
              Florida's Supreme Court established that sellers must disclose all known material defects not readily
              observable to buyers (Johnson v. Davis, 480 So. 2d 625). This duty exists independent of any form — a
              seller can check "no" on every disclosure item and still be liable for known defects they concealed.
            </Callout>
          </Section>
        )}

        {activeSection === "esignatures" && (
          <Section title="Digital Signature Compliance" subtitle="ESIGN Act / UETA / Florida Stat. 668.50" icon={ShieldCheck}>
            <p className="text-sm text-black/60">
              Electronic signatures are legally binding in Florida under the federal ESIGN Act (15 U.S.C. 7001) and
              Florida's adoption of UETA (FL Stat. 668.50). The PropertyIntel DigitalSignature entity and signDocument
              function implement these requirements with full audit trails.
            </p>
            <div className="mt-6 space-y-3">
              {ESIGN_REQUIREMENTS.map((r, i) => (
                <ExpandableItem key={i} id={`e-${i}`} title={r.req} detail={r.detail} citation={r.citation} expanded={expandedItems[`e-${i}`]} onToggle={() => toggleItem(`e-${i}`)} />
              ))}
            </div>
            <Callout type="success" title="System Compliance">
              The PropertyIntel DigitalSignature entity captures: signer_name, signer_email, signer_role,
              signature_hash, document_hash, ip_address, user_agent, signed_at, and witness/notary fields. This
              satisfies all ESIGN/UETA requirements for legal enforceability.
            </Callout>
            <ResourceLink href="https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0600-0699/0668/Sections/0668.50.html" label="FL Stat. 668.50 (UETA)" />
            <ResourceLink href="https://www.docusign.com/learn/esign-act-ueta" label="ESIGN Act & UETA Overview" />
          </Section>
        )}

        {activeSection === "smart-contracts" && (
          <Section title="Smart Contract & Blockchain Compliance" subtitle="SEC Regulations / Securities Exemptions / FL UETA" icon={Bitcoin}>
            <p className="text-sm text-black/60">
              Smart contracts on blockchain are legally recognizable under Florida's UETA (FL Stat. 668.50). However,
              if real estate interests are tokenized (fractional ownership, investment contracts), they are likely
              securities under the Howey test and must be registered with the SEC or qualify for an exemption.
              PropertyIntel deploys Solidity escrow contracts on Polygon — these are not securities (no fractional
              ownership), but any future tokenization must comply with SEC regulations.
            </p>
            <div className="mt-6 space-y-3">
              {SMART_CONTRACT_COMPLIANCE.map((r, i) => (
                <ExpandableItem key={i} id={`sc-${i}`} title={r.area} detail={r.detail} citation={r.citation} link={r.link} expanded={expandedItems[`sc-${i}`]} onToggle={() => toggleItem(`sc-${i}`)} />
              ))}
            </div>
            <Callout type="warning" title="Current System Status">
              PropertyIntel's smart contracts are escrow agreements (earnest money + signatures), not securities.
              They do not create fractional ownership or investment contracts. If the platform adds tokenized
              ownership shares, SEC Reg D (506b or 506c) compliance and Form D filing become mandatory.
            </Callout>
            <ResourceLink href="https://www.sec.gov/newsroom/speeches-statements/corp-fin-statement-tokenized-securities-012826-statement-tokenized-securities" label="SEC Statement on Tokenized Securities" />
          </Section>
        )}

        {activeSection === "federal" && (
          <Section title="Federal Regulations" subtitle="RESPA / Dodd-Frank / SAFE Act / Fair Housing" icon={DollarSign}>
            <p className="text-sm text-black/60">
              Federal regulations apply to real estate transactions involving mortgages, seller financing, and
              consumer protection. Wholesalers and investors must comply with RESPA (no kickbacks), Dodd-Frank
              (seller-financing limits), the SAFE Act (mortgage originator licensing), and the Fair Housing Act
              (non-discrimination).
            </p>
            <div className="mt-6 space-y-3">
              {FEDERAL_REGS.map((r, i) => (
                <ExpandableItem key={i} id={`f-${i}`} title={r.name} detail={`${r.requirements} (Authority: ${r.authority}. Applies to: ${r.applies}.)`} link={r.link} expanded={expandedItems[`f-${i}`]} onToggle={() => toggleItem(`f-${i}`)} />
              ))}
            </div>
            <Callout type="warning" title="Seller Financing Limits">
              Under Dodd-Frank, individual investors can seller-finance up to 3 properties/year with specific term
              restrictions (fixed rate or 5+yr ARM, fully amortizing, no balloon). More than 5 deals/year requires a
              mortgage originator license under the SAFE Act.
            </Callout>
          </Section>
        )}

        {activeSection === "kyc-aml" && (
          <Section title="KYC / AML & FinCEN Compliance" subtitle="Corporate Transparency Act / FinCEN CDD Rule" icon={Users}>
            <p className="text-sm text-black/60">
              Anti-money laundering regulations apply to real estate transactions, especially cash purchases. The
              Corporate Transparency Act requires all business entities to report beneficial ownership to FinCEN.
              FinCEN's real estate AML rule targets non-financed (cash) transactions. Platforms facilitating
              blockchain-based real estate should implement KYC procedures.
            </p>
            <div className="mt-6 space-y-3">
              {KYC_AML.map((r, i) => (
                <ExpandableItem key={i} id={`k-${i}`} title={r.req} detail={r.detail} citation={r.citation} link={r.link} expanded={expandedItems[`k-${i}`]} onToggle={() => toggleItem(`k-${i}`)} />
              ))}
            </div>
            <Callout type="danger" title="CTA Filing Deadline">
              Existing business entities (formed before Jan 1, 2024) must file Beneficial Ownership Information (BOI)
              reports with FinCEN by January 1, 2025. New entities must file within 90 days of formation. Failure to
              file carries $500/day penalties and potential criminal charges.
            </Callout>
            <ResourceLink href="https://www.fincen.gov/boi" label="FinCEN BOI Filing Portal" />
          </Section>
        )}

        {activeSection === "forms" && (
          <Section title="Required Forms Library" subtitle="FAR/BAR + Federal + Statutory Forms" icon={BookOpen}>
            <p className="text-sm text-black/60">
              Complete library of forms required for distressed real estate transactions in Florida. The PropertyIntel
              generateLegalDisclosures function generates the statutory disclosure forms automatically. All other
              forms should be available in the system's document generation pipeline.
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/15 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                    <th className="pb-3 pr-4">Form</th>
                    <th className="pb-3 pr-4">Purpose</th>
                    <th className="pb-3 pr-4">When Required</th>
                    <th className="pb-3">Authority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {REQUIRED_FORMS.map((f, i) => (
                    <tr key={i} className="align-top">
                      <td className="py-3 pr-4 font-medium">{f.form}</td>
                      <td className="py-3 pr-4 text-black/60">{f.purpose}</td>
                      <td className="py-3 pr-4 text-black/60">{f.when}</td>
                      <td className="py-3 text-black/70">{f.authority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {activeSection === "system-mapping" && (
          <Section title="System Compliance Mapping" subtitle="PropertyIntel Features → Legal Requirements" icon={Lock}>
            <p className="text-sm text-black/60">
              Every feature in the PropertyIntel system is mapped to its corresponding legal compliance requirement.
              This ensures the system operates within the legal framework at all times. Items marked "Review needed"
              require additional compliance work before production use.
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/15 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                    <th className="pb-3 pr-4">System Feature</th>
                    <th className="pb-3 pr-4">Compliance Area</th>
                    <th className="pb-3 pr-4">Requirement</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {SYSTEM_MAPPING.map((m, i) => (
                    <tr key={i} className="align-top">
                      <td className="py-3 pr-4 font-mono text-xs">{m.systemFeature}</td>
                      <td className="py-3 pr-4 text-black/60">{m.complianceArea}</td>
                      <td className="py-3 pr-4 text-black/70">{m.requirement}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-white ${
                          m.status === "Live" || m.status === "Enforced" ? "bg-emerald-600" : "bg-amber-500"
                        }`}>{m.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Callout type="info" title="Sync with System">
              This mapping is the compliance framework for PropertyIntel. Any new feature added to the system must be
              mapped here with its corresponding legal requirement. The admin assistant agent enforces this by
              checking compliance before executing any new function.
            </Callout>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/industry-intelligence" className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-black/80">
                Industry Intelligence <ExternalLinkIcon className="h-4 w-4" />
              </Link>
              <Link to="/admin" className="inline-flex items-center gap-2 rounded-sm border border-black/15 px-5 py-3 text-[11px] uppercase tracking-[0.3em] hover:bg-black hover:text-white">
                Admin Dashboard
              </Link>
            </div>
          </Section>
        )}
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

function ExpandableItem({ title, detail, citation, link, expanded, onToggle }) {
  return (
    <div className="rounded-sm border border-black/10">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="text-sm font-medium text-black/80">{title}</span>
        {expanded ? <ChevronUp className="h-4 w-4 text-black/40" /> : <ChevronDown className="h-4 w-4 text-black/40" />}
      </button>
      {expanded && (
        <div className="border-t border-black/10 px-4 py-3">
          <p className="text-sm leading-relaxed text-black/60">{detail}</p>
          <div className="mt-3 flex items-center gap-4">
            {citation && <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">Citation: {citation}</span>}
            {link && (
              <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-black underline">
                <ExternalLinkIcon className="h-3 w-3" /> Source
              </a>
            )}
          </div>
        </div>
      )}
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

function ResourceLink({ href, label }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-black/60 underline hover:text-black">
      <ExternalLinkIcon className="h-3 w-3" /> {label}
    </a>
  );
}