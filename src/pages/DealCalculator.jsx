import React, { useState, useMemo } from "react";
import { Calculator, Users, TrendingUp, DollarSign, Scale, Info } from "lucide-react";
import Seo from "@/components/Seo";
import DealCalculatorForm from "@/components/deal/DealCalculatorForm";
import DealSummary from "@/components/deal/DealSummary";
import IndustryBenchmarks from "@/components/deal/IndustryBenchmarks";

const DEAL_TYPES = [
  { id: "wholesale", label: "Wholesale Assignment", desc: "Contract → assign to buyer for fee" },
  { id: "flip", label: "Fix & Flip", desc: "Buy → rehab → sell for profit" },
  { id: "brrrr", label: "BRRRR", desc: "Buy → rehab → rent → refinance" },
  { id: "hold", label: "Buy & Hold", desc: "Buy → rent long-term cash flow" },
];

const DEFAULT_INPUTS = {
  arv: 250000,
  as_is_value: 180000,
  contract_price: 140000,
  rehab_budget: 30000,
  rehab_months: 3,
  holding_months: 5,
  monthly_taxes: 250,
  monthly_insurance: 120,
  monthly_utilities: 150,
  monthly_hoa: 0,
  commission_rate: 5.5,
  closing_cost_rate: 3,
  assignment_fee: 13000,
  seller_mortgage: 100000,
  seller_liens: 0,
  hard_money_rate: 8,
  hard_money_points: 2,
  down_payment_pct: 10,
  refi_ltv: 75,
  refi_rate: 7,
  refi_term: 30,
  market_rent: 1800,
  property_tax_pct: 1.1,
  insurance_annual: 1200,
  management_pct: 8,
  vacancy_pct: 5,
  maintenance_pct: 8,
};

export default function DealCalculator() {
  const [dealType, setDealType] = useState("wholesale");
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);

  const results = useMemo(() => calculateDeal(dealType, inputs), [dealType, inputs]);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-14 lg:px-10">
      <Seo
        title="Deal Calculator — Per-Person Profit Split, Commissions & Industry Standards"
        description="Auto-calculate every real estate deal: wholesale assignment fees, fix-and-flip profit, BRRRR cash-out, and buy-and-hold cash flow. See exactly who gets what — seller, wholesaler, buyer, agents, title, and county — with industry-standard benchmarks."
        keywords="real estate deal calculator, wholesale assignment fee calculator, fix and flip calculator, BRRRR calculator, real estate commission calculator, seller net proceeds, buyer closing costs, real estate profit split, MAO calculator, 70% rule calculator"
        path="/deal-calculator"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Real Estate Deal Calculator",
          "description": "Auto-calculates deal economics with per-person profit breakdown and industry benchmarks.",
          "url": "https://hiddenpropertyintel.com/deal-calculator",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        }}
      />

      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Deal Calculator</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tight sm:text-5xl">
          Who gets <em className="not-italic text-gold">what</em> — and is it fair?
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/60">
          Auto-calculates every dollar in the deal — seller net proceeds, wholesaler fee, buyer profit, agent commissions,
          title costs, and transfer taxes — benchmarked against industry standards so everyone walks away fair.
        </p>
      </div>

      {/* Deal type selector */}
      <div className="mb-6 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {DEAL_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setDealType(t.id)}
            className={`rounded-lg border p-4 text-left transition ${dealType === t.id ? "border-black bg-black text-white" : "border-black/10 bg-white hover:border-black/30"}`}
          >
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <p className="text-sm font-medium">{t.label}</p>
            </div>
            <p className={`mt-1 text-xs ${dealType === t.id ? "text-white/60" : "text-black/40"}`}>{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr_320px]">
        <DealCalculatorForm inputs={inputs} setInputs={setInputs} dealType={dealType} />
        <DealSummary results={results} dealType={dealType} />
        <IndustryBenchmarks results={results} dealType={dealType} />
      </div>
    </div>
  );
}

function calculateDeal(dealType, i) {
  const num = (v) => Number(v) || 0;
  const arv = num(i.arv);
  const contractPrice = num(i.contract_price);
  const rehab = num(i.rehab_budget);
  const rehabMonths = num(i.rehab_months);
  const holdMonths = num(i.holding_months);
  const monthlyCarry = num(i.monthly_taxes) + num(i.monthly_insurance) + num(i.monthly_utilities) + num(i.monthly_hoa);
  const totalHolding = monthlyCarry * holdMonths;
  const commissionPct = num(i.commission_rate) / 100;
  const closingPct = num(i.closing_cost_rate) / 100;
  const assignmentFee = num(i.assignment_fee);
  const sellerMortgage = num(i.seller_mortgage);
  const sellerLiens = num(i.seller_liens);

  // Acquisition closing costs
  const acqClosing = contractPrice * closingPct;

  // Sale-side costs (for flip/hold exit)
  const saleCommission = arv * commissionPct;
  const saleClosing = arv * 0.015; // ~1.5% transfer + title on sale
  const totalSaleCosts = saleCommission + saleClosing;

  // Hard money (flip/brrrr)
  const loanAmount = contractPrice * (1 - num(i.down_payment_pct) / 100);
  const loanPoints = loanAmount * (num(i.hard_money_points) / 100);
  const loanInterest = loanAmount * (num(i.hard_money_rate) / 100) * (holdMonths / 12);

  const people = [];
  let metrics = {};

  if (dealType === "wholesale") {
    // Seller
    const sellerClosing = contractPrice * 0.015;
    const sellerNet = contractPrice - sellerMortgage - sellerLiens - sellerClosing;
    // Buyer (end investor)
    const buyerPrice = contractPrice + assignmentFee;
    const buyerRehab = rehab;
    const buyerHolding = monthlyCarry * holdMonths;
    const buyerSaleCosts = arv * commissionPct + arv * 0.015;
    const buyerTotalCost = buyerPrice + buyerRehab + buyerHolding + buyerSaleCosts + acqClosing;
    const buyerProfit = arv - buyerTotalCost;
    const buyerROI = buyerTotalCost > 0 ? (buyerProfit / buyerTotalCost) * 100 : 0;
    const mao = arv * 0.70 - rehab; // 70% rule

    people.push({ role: "Seller", name: "Property Owner", amount: sellerNet, detail: `Net after $${sellerMortgage.toLocaleString()} mortgage + closing`, color: "blue" });
    people.push({ role: "Wholesaler", name: "Assignment Fee", amount: assignmentFee, detail: `${((assignmentFee / (buyerProfit || 1)) * 100).toFixed(0)}% of buyer's profit spread`, color: "gold" });
    people.push({ role: "End Buyer", name: "Investor Profit", amount: buyerProfit, detail: `ROI: ${buyerROI.toFixed(1)}% · Cash invested: $${buyerTotalCost.toLocaleString()}`, color: "emerald" });
    people.push({ role: "Listing Agent", name: "Sale Commission", amount: saleCommission / 2, detail: `${(commissionPct * 50).toFixed(1)}% of ARV`, color: "purple" });
    people.push({ role: "Buyer's Agent", name: "Sale Commission", amount: saleCommission / 2, detail: `${(commissionPct * 50).toFixed(1)}% of ARV`, color: "purple" });
    people.push({ role: "Title / Escrow", name: "Title Insurance + Escrow", amount: acqClosing + saleClosing, detail: "Both sides of transaction", color: "gray" });
    people.push({ role: "County / State", name: "Transfer Tax + Recording", amount: contractPrice * 0.004 + arv * 0.004, detail: "~0.4% per side (FL avg)", color: "gray" });

    metrics = {
      mao, buyerPrice, buyerProfit, buyerROI, sellerNet,
      assignmentPctOfSpread: buyerProfit > 0 ? (assignmentFee / buyerProfit) * 100 : 0,
      dealFairForBuyer: buyerProfit > 0 && buyerROI > 15,
      dealFairForSeller: sellerNet > 0,
      assignmentInRange: assignmentFee >= 5000 && assignmentFee <= 20000,
    };
  } else if (dealType === "flip") {
    const totalProjectCost = contractPrice + rehab + acqClosing + totalHolding + loanPoints + loanInterest;
    const netSale = arv - totalSaleCosts;
    const profit = netSale - totalProjectCost;
    const cashInvested = (contractPrice - loanAmount) + rehab + acqClosing + totalHolding + loanPoints;
    const roi = cashInvested > 0 ? (profit / cashInvested) * 100 : 0;
    const mao = arv * 0.70 - rehab;

    people.push({ role: "Seller", name: "Property Owner", amount: contractPrice - sellerMortgage - sellerLiens - contractPrice * 0.015, detail: "Net proceeds at closing", color: "blue" });
    people.push({ role: "Investor", name: "Flip Profit", amount: profit, detail: `ROI: ${roi.toFixed(1)}% · Cash: $${cashInvested.toLocaleString()}`, color: "emerald" });
    people.push({ role: "Lender", name: "Hard Money Interest + Points", amount: loanInterest + loanPoints, detail: `${i.hard_money_rate}% APR · ${i.hard_money_points} pts · ${holdMonths}mo`, color: "amber" });
    people.push({ role: "Listing Agent", name: "Sale Commission", amount: saleCommission / 2, detail: `${(commissionPct * 50).toFixed(1)}% of sale`, color: "purple" });
    people.push({ role: "Buyer's Agent", name: "Sale Commission", amount: saleCommission / 2, detail: `${(commissionPct * 50).toFixed(1)}% of sale`, color: "purple" });
    people.push({ role: "Title / Escrow", name: "Title + Escrow Fees", amount: acqClosing + saleClosing, detail: "Both sides", color: "gray" });
    people.push({ role: "County / State", name: "Transfer Tax", amount: contractPrice * 0.004 + arv * 0.004, detail: "~0.4% per side", color: "gray" });

    metrics = {
      mao, totalProjectCost, profit, roi, cashInvested, netSale,
      dealProfitable: profit > 0,
      meets70Rule: contractPrice <= mao,
      roiHealthy: roi > 20,
    };
  } else if (dealType === "brrrr") {
    const totalProjectCost = contractPrice + rehab + acqClosing + totalHolding + loanPoints + loanInterest;
    const refiAmount = arv * (num(i.refi_ltv) / 100);
    const refiClosing = refiAmount * 0.03;
    const cashOut = refiAmount - totalProjectCost - refiClosing;
    const cashInvested = (contractPrice - loanAmount) + rehab + acqClosing + totalHolding + loanPoints;
    const cashLeftIn = cashInvested - cashOut;

    // Rental metrics
    const rent = num(i.market_rent);
    const annualRent = rent * 12;
    const propTax = arv * (num(i.property_tax_pct) / 100);
    const insurance = num(i.insurance_annual);
    const management = annualRent * (num(i.management_pct) / 100);
    const vacancy = annualRent * (num(i.vacancy_pct) / 100);
    const maintenance = annualRent * (num(i.maintenance_pct) / 100);
    const mortgagePI = refiAmount * (num(i.refi_rate) / 100 / 12) * 12; // P&I only (simplified)
    const annualExpenses = propTax + insurance + management + vacancy + maintenance + mortgagePI;
    const annualCashFlow = annualRent - annualExpenses;
    const monthlyCashFlow = annualCashFlow / 12;
    const cocReturn = cashLeftIn > 0 ? (annualCashFlow / cashLeftIn) * 100 : Infinity;

    people.push({ role: "Seller", name: "Property Owner", amount: contractPrice - sellerMortgage - sellerLiens - contractPrice * 0.015, detail: "Net proceeds", color: "blue" });
    people.push({ role: "Investor", name: "Cash-Out at Refi", amount: cashOut, detail: `Cash left in deal: $${Math.max(0, cashLeftIn).toLocaleString()}`, color: "emerald" });
    people.push({ role: "Investor", name: "Monthly Cash Flow", amount: monthlyCashFlow, detail: `CoC: ${cashLeftIn > 0 ? cocReturn.toFixed(1) + "%" : "∞"} · Rent: $${rent}/mo`, color: "emerald", isMonthly: true });
    people.push({ role: "Lender", name: "Hard Money (bridge)", amount: loanInterest + loanPoints, detail: `${i.hard_money_rate}% · ${holdMonths}mo bridge`, color: "amber" });
    people.push({ role: "Lender", name: "Refi Lender", amount: refiClosing, detail: "3% of new loan", color: "amber" });
    people.push({ role: "Title / Escrow", name: "Title + Escrow", amount: acqClosing, detail: "Acquisition side", color: "gray" });
    people.push({ role: "County / State", name: "Transfer Tax", amount: contractPrice * 0.004, detail: "~0.4%", color: "gray" });

    metrics = {
      totalProjectCost, refiAmount, cashOut, cashLeftIn, monthlyCashFlow, cocReturn,
      annualRent, annualExpenses, mortgagePI,
      dealProfitable: cashOut > 0,
      cashFlowPositive: monthlyCashFlow > 0,
    };
  } else if (dealType === "hold") {
    const downPayment = contractPrice * (num(i.down_payment_pct) / 100);
    const loanAmountHold = contractPrice - downPayment;
    const acqClosingHold = contractPrice * 0.02;
    const cashInvested = downPayment + acqClosingHold;
    const rent = num(i.market_rent);
    const annualRent = rent * 12;
    const propTax = arv * (num(i.property_tax_pct) / 100);
    const insurance = num(i.insurance_annual);
    const management = annualRent * (num(i.management_pct) / 100);
    const vacancy = annualRent * (num(i.vacancy_pct) / 100);
    const maintenance = annualRent * (num(i.maintenance_pct) / 100);
    const mortgagePI = loanAmountHold * (num(i.refi_rate) / 100 / 12) * 12;
    const annualExpenses = propTax + insurance + management + vacancy + maintenance + mortgagePI;
    const annualCashFlow = annualRent - annualExpenses;
    const monthlyCashFlow = annualCashFlow / 12;
    const cocReturn = (annualCashFlow / cashInvested) * 100;
    const capRate = (annualRent - propTax - insurance - management - vacancy - maintenance) / contractPrice * 100;

    people.push({ role: "Seller", name: "Property Owner", amount: contractPrice - sellerMortgage - sellerLiens - contractPrice * 0.015, detail: "Net proceeds", color: "blue" });
    people.push({ role: "Investor", name: "Monthly Cash Flow", amount: monthlyCashFlow, detail: `CoC: ${cocReturn.toFixed(1)}% · Cap: ${capRate.toFixed(1)}%`, color: "emerald", isMonthly: true });
    people.push({ role: "Lender", name: "Mortgage (annual P&I)", amount: mortgagePI, detail: `${i.refi_rate}% · ${i.refi_term}yr`, color: "amber" });
    people.push({ role: "Property Mgmt", name: "Management (8%)", amount: management, detail: "Annual", color: "purple" });
    people.push({ role: "Title / Escrow", name: "Title + Escrow", amount: acqClosingHold, detail: "Acquisition", color: "gray" });
    people.push({ role: "County / State", name: "Transfer Tax", amount: contractPrice * 0.004, detail: "~0.4%", color: "gray" });

    metrics = {
      cashInvested, monthlyCashFlow, annualCashFlow, cocReturn, capRate,
      downPayment, loanAmountHold, annualRent, annualExpenses,
      cashFlowPositive: monthlyCashFlow > 0,
      goodCapRate: capRate >= 6,
    };
  }

  return { people, metrics, dealType };
}