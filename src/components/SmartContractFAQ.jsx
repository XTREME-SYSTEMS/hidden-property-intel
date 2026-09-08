import React, { useState } from "react";
import { ChevronDown, Zap, Wallet, Clock, Shield, Scale, Lock, Building2, Phone } from "lucide-react";
import Seo from "@/components/Seo";

const FAQS = [
  {
    q: "What is the fastest a real estate deal can close with a smart contract?",
    a: "If both parties already have crypto wallets and agree on price and terms, an HPI smart-contract close can complete in under 1 hour — sometimes as fast as 15 minutes. The contract deploys, earnest money is deposited in USDC, both parties sign on-chain, and funds release instantly on mutual confirmation. The only real bottleneck is contingencies: if inspection, financing, and title are waived or pre-cleared, same-day closing is possible. With a standard 10-day inspection contingency, the typical HPI close takes 7–14 days — still 3× faster than the 30–45 day traditional escrow.",
    category: "speed",
  },
  {
    q: "Can I close a real estate deal in one day with a smart contract?",
    a: "Yes. If you and the other party already have wallets set up, agree on terms, and either waive contingencies or have them pre-cleared (inspection done, title pulled, financing secured), the HPI smart contract can execute the entire close — deploy, fund, sign, release, and deed recording coordination — within hours. The blockchain steps (deploy, fund, sign, release) take minutes. The county deed recording is scheduled same-day where county systems allow e-recording.",
    category: "speed",
  },
  {
    q: "How long does the blockchain part of the smart contract take?",
    a: "The on-chain steps are nearly instant. Deploying the contract: ~10 seconds. Depositing earnest money (USDC transfer): ~10 seconds. Each on-chain signature: ~10 seconds. Releasing funds on mutual confirmation: ~10 seconds. Total blockchain execution time: under 2 minutes. The remaining time in a 7–14 day close is the contingency period — inspection, financing, and title work — which happens off-chain.",
    category: "speed",
  },
  {
    q: "Do I need a crypto wallet to use the smart contract escrow?",
    a: "Yes, both the buyer and seller need a crypto wallet to deposit and receive funds. HPI helps you set up a wallet in minutes — we recommend MetaMask or Coinbase Wallet, both free. If you don't want to manage a wallet yourself, our team can act as your custodian and handle the wallet on your behalf. You'll still see every transaction on-chain and retain full control of your funds.",
    category: "accounts",
  },
  {
    q: "What accounts do I need to create to finalize a smart contract close?",
    a: "You need three things: (1) a free HPI account — created when you register on our platform; (2) a crypto wallet — we'll walk you through setting up MetaMask or Coinbase Wallet in about 5 minutes, at no cost; (3) USDC (a dollar-pegged stablecoin) for the earnest money deposit — if you don't already have USDC, we help you convert dollars to USDC through Coinbase or MoonPay. You do NOT need a separate escrow account, title company account, or attorney account — HPI handles all of that.",
    category: "accounts",
  },
  {
    q: "Do I need a Coinbase or exchange account?",
    a: "Not strictly, but it makes funding easier. If you already have a Coinbase, Kraken, or Gemini account, you can buy USDC there and send it to your wallet. If you don't, we use MoonPay — a built-in on-ramp that lets you buy USDC directly with a debit card or bank transfer, right from the HPI interface. No separate exchange account is required.",
    category: "accounts",
  },
  {
    q: "Do I need a bank account to use smart contract escrow?",
    a: "You need a way to fund USDC (debit card, bank transfer via MoonPay, or an existing crypto exchange). You do NOT need to wire money to a title company or escrow account. The earnest money goes directly from your wallet into the smart contract on the Polygon blockchain — no bank intermediary, no wire-fraud risk, no 24–72 hour hold.",
    category: "accounts",
  },
  {
    q: "Is the smart contract escrow legally binding?",
    a: "Yes. Every HPI transaction is conducted under the real estate license of Steve Giordano, a Licensed Real Estate Broker in Florida, in full compliance with Florida real estate law. The smart contract is the escrow instrument — it holds and releases funds according to agreed terms. The recorded deed is the legal transfer of ownership. The blockchain provides immutable evidence of what happened; the county record proves who owns the property. Both work together.",
    category: "legal",
  },
  {
    q: "Does the smart contract replace a title company?",
    a: "No. The smart contract replaces the escrow holding and fund-release function — not title insurance or deed recording. HPI coordinates title search, title insurance, and deed recording with licensed professionals. The smart contract handles the money; the title process handles the legal ownership transfer. This is why HPI is faster and cheaper than traditional escrow but still fully legally compliant.",
    category: "legal",
  },
  {
    q: "Is smart contract escrow legal in Florida?",
    a: "Yes. Florida law does not prohibit using blockchain-based escrow for real estate transactions. The earnest money is held in a smart contract rather than a title company's bank account, but the underlying transaction — purchase agreement, deed recording, title transfer — follows all Florida real estate statutes. HPI operates under the license of Steve Giordano, Licensed Real Estate Broker, ensuring full compliance.",
    category: "legal",
  },
  {
    q: "What happens if a contingency fails?",
    a: "If an inspection, financing, or title contingency fails, the smart contract automatically returns your full earnest money deposit to your wallet. No escrow officer decides whether you 'deserve' your money back — the rules are written in code and execute automatically. This is one of the key advantages: the refund is guaranteed by the contract, not by a person's judgment.",
    category: "legal",
  },
  {
    q: "How much does smart contract escrow cost?",
    a: "HPI charges a flat 3% platform fee on the earnest money amount — far less than the $1,500–$4,000 in traditional escrow and attorney drafting fees on a typical $200K deal. You also pay Polygon gas (network fees), which typically run under $1 per transaction. There are no hidden fees, no wire fees, no notary fees, and no document storage fees. Elite and Enterprise HPI plans include smart-contract escrow at no additional platform cost.",
    category: "cost",
  },
  {
    q: "Is smart contract escrow cheaper than traditional escrow?",
    a: "Significantly. Traditional escrow and attorney fees on a $200,000 deal typically run $1,500–$4,000. HPI's flat fee is a fraction of that, and you save an additional $30–$50 in wire transfer fees. On a $500,000 deal, traditional escrow can cost $3,000–$8,000; HPI's cost remains a small flat percentage of earnest money. The bigger the deal, the bigger the savings.",
    category: "cost",
  },
  {
    q: "What is the gas fee on Polygon?",
    a: "Polygon gas fees are extremely low — typically $0.01 to $0.50 per transaction. A full smart-contract close (deploy, fund, sign, release) costs under $2 total in gas. This is why HPI uses Polygon instead of Ethereum mainnet, where the same operations would cost $50–$200+.",
    category: "cost",
  },
  {
    q: "Is my money safe in a smart contract?",
    a: "Yes. Your earnest money is held in the smart contract itself on the Polygon blockchain — not in any person's or company's bank account. The contract can only release funds according to its programmed rules: mutual confirmation, contingency failure (auto-refund), or contract expiration. No one — not HPI, not the other party, not a hacker — can move the funds outside these rules. The contract code is public and auditable.",
    category: "security",
  },
  {
    q: "What is the wire-fraud risk with smart contract escrow?",
    a: "Zero. Wire fraud in real estate happens when criminals intercept wire instructions and redirect your earnest money to their account. With HPI smart-contract escrow, there is no wire. Funds go directly from your crypto wallet to the smart contract address on-chain. The address is verifiable on the public blockchain. There is no intermediary to intercept, no bank account to spoof, no email to phish.",
    category: "security",
  },
  {
    q: "Can the smart contract be hacked?",
    a: "The smart contract code is audited and uses battle-tested escrow patterns. Once deployed, the contract is immutable — its logic cannot be changed by anyone, including HPI. The funds can only move according to the rules written into the code. The primary risk in any smart contract is a code bug, which is why HPI uses audited, simple, well-tested contract patterns rather than complex custom logic.",
    category: "security",
  },
  {
    q: "What blockchain does HPI use?",
    a: "HPI uses the Polygon blockchain — a Layer-2 scaling solution for Ethereum. Polygon was chosen for its extremely low gas fees (under $1 per transaction), fast confirmation times (seconds, not minutes), and strong security (it inherits Ethereum's security model). Polygon is one of the most widely used and trusted blockchains for real-world asset transactions.",
    category: "blockchain",
  },
  {
    q: "What is USDC and why is it used for escrow?",
    a: "USDC (USD Coin) is a stablecoin — a cryptocurrency pegged 1:1 to the US dollar. One USDC always equals one dollar, held in reserve by Circle, a regulated financial institution. HPI uses USDC for escrow because it eliminates crypto price volatility: your $10,000 earnest money deposit stays $10,000 throughout the entire escrow period, regardless of crypto market movements.",
    category: "blockchain",
  },
  {
    q: "Do I need to understand blockchain or crypto to use this?",
    a: "No. HPI handles the blockchain complexity for you. You need to set up a wallet (5 minutes, we guide you) and fund it with USDC (we help you through MoonPay or Coinbase). Beyond that, the HPI interface shows you the same information you'd see in a traditional escrow — deposit status, signatures, contingencies, fund release — just faster and more transparently. You never need to touch raw blockchain code.",
    category: "blockchain",
  },
  {
    q: "What happens to the deed and title?",
    a: "The smart contract handles the money. The deed recording and title transfer still follow your state's legal process. HPI coordinates both: we work with licensed title professionals to perform the title search, issue title insurance, and record the deed with the county clerk. You receive both an on-chain transaction record (proving the funds flow) and a recorded deed (proving legal ownership).",
    category: "process",
  },
  {
    q: "Can I use smart contract escrow for any type of property?",
    a: "HPI smart-contract escrow works for residential, commercial, land, and multi-family properties in our active markets (currently Florida). The property type doesn't affect the smart contract — it handles the money the same way regardless. The deed recording process varies slightly by property type and county, but HPI coordinates that for you.",
    category: "process",
  },
  {
    q: "What if the other party doesn't have a crypto wallet?",
    a: "HPI will help the other party set up a wallet — it takes about 5 minutes and is free. If they prefer not to manage a wallet, our team can act as custodian on their behalf. They'll still see every transaction on-chain and receive their funds directly. We've designed the process so that neither party needs prior crypto experience.",
    category: "process",
  },
  {
    q: "How do I get started with a smart contract close?",
    a: "Three steps: (1) Register a free HPI account; (2) Set up your crypto wallet with our guided walkthrough (5 minutes); (3) Browse live deals or list your property. When you and the other party agree on terms, HPI generates the smart contract automatically. You can also call Steve Giordano directly at 833-484-3799 to walk through your specific deal.",
    category: "process",
  },
  {
    q: "What is the difference between smart contract escrow and traditional escrow?",
    a: "Traditional escrow: a title company holds your money in a bank account, charges $1,500–$4,000, takes 30–45 days, requires wire transfers (fraud risk), and relies on an escrow officer's judgment. Smart contract escrow: the blockchain holds your money in code, charges a flat fraction of the cost, takes 7–14 days (or same-day with waived contingencies), uses on-chain transfers (zero fraud risk), and executes automatically per programmed rules. Same legal outcome — deed recorded, title transferred — radically better process.",
    category: "comparison",
  },
  {
    q: "Can I still do a traditional escrow if I don't want smart contracts?",
    a: "Yes. HPI offers both options. If you prefer the traditional escrow process — title company, wire transfer, 30-day timeline — we can coordinate that for you through our licensed broker. We believe smart-contract escrow is better, but we respect that some clients prefer the familiar process. The choice is always yours.",
    category: "comparison",
  },
];

const CATEGORIES = [
  { id: "speed", label: "Speed & Timing", icon: Zap },
  { id: "accounts", label: "Accounts & Setup", icon: Wallet },
  { id: "cost", label: "Cost & Fees", icon: Clock },
  { id: "security", label: "Security & Safety", icon: Shield },
  { id: "legal", label: "Legal & Compliance", icon: Scale },
  { id: "blockchain", label: "Blockchain & Crypto", icon: Lock },
  { id: "process", label: "Process & How-To", icon: Building2 },
  { id: "comparison", label: "Comparisons", icon: Phone },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function SmartContractFAQ() {
  const [open, setOpen] = useState(null);
  const [category, setCategory] = useState("speed");

  const filtered = category === "all" ? FAQS : FAQS.filter((f) => f.category === category);

  return (
    <>
      <Seo
        title="Smart Contract Escrow FAQ — Answers to Every Question"
        description="Exhaustive FAQ on HPI smart-contract escrow: fastest close time, accounts needed, costs, legal compliance, security, blockchain, and how to get started. Get answers in seconds."
        keywords="smart contract escrow FAQ, blockchain real estate questions, how fast can smart contract close, do I need a wallet for real estate escrow, Polygon escrow cost, USDC real estate, smart contract legal Florida"
        path="/smart-contracts"
        jsonLd={FAQ_JSON_LD}
      />

      {/* Fastest Deal Spotlight */}
      <div className="grid gap-px overflow-hidden rounded-lg border border-black/10 bg-black/10 md:grid-cols-3">
        <div className="bg-black p-6 text-white">
          <Zap className="h-6 w-6 text-gold-warm" />
          <p className="mt-3 font-display text-3xl font-light text-gold-warm">15 min</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Theoretical minimum</p>
          <p className="mt-2 text-xs leading-relaxed text-white/60">Both parties have wallets, terms agreed, all contingencies waived.</p>
        </div>
        <div className="bg-white p-6">
          <Clock className="h-6 w-6 text-gold" />
          <p className="mt-3 font-display text-3xl font-light">Same day</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Best realistic case</p>
          <p className="mt-2 text-xs leading-relaxed text-black/55">Wallets ready, contingencies pre-cleared, e-recording available.</p>
        </div>
        <div className="bg-white p-6">
          <Shield className="h-6 w-6 text-emerald-600" />
          <p className="mt-3 font-display text-3xl font-light">7–14 days</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Typical close</p>
          <p className="mt-2 text-xs leading-relaxed text-black/55">With standard 10-day inspection contingency — still 3× faster than traditional.</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="mt-8 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory("all")}
          className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
            category === "all" ? "bg-black text-white" : "border border-black/15 text-black/60 hover:bg-black/5"
          }`}
        >
          All questions
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
              category === c.id ? "bg-black text-white" : "border border-black/15 text-black/60 hover:bg-black/5"
            }`}
          >
            <c.icon className="h-3 w-3" /> {c.label}
          </button>
        ))}
      </div>

      {/* FAQ accordion */}
      <div className="mt-6 divide-y divide-black/10 border-y border-black/10">
        {filtered.map((f, i) => {
          const idx = FAQS.indexOf(f);
          const isOpen = open === idx;
          return (
            <div key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : idx)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 font-mono text-[10px] text-black/30">{String(i + 1).padStart(2, "0")}</span>
                  <span className={`font-display text-base tracking-tight ${isOpen ? "text-black" : "text-black/80"}`}>{f.q}</span>
                </div>
                <ChevronDown className={`h-5 w-5 shrink-0 text-black/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="pb-6 pl-8 pr-8">
                  <p className="text-sm leading-relaxed text-black/65">{f.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}