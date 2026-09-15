import React from "react";
import { Users, Check, AlertTriangle, TrendingUp, DollarSign, Scale } from "lucide-react";

const COLOR_MAP = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  gold: "bg-amber-50 text-amber-700 border-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  amber: "bg-orange-50 text-orange-700 border-orange-200",
  gray: "bg-gray-50 text-gray-700 border-gray-200",
};

function FairnessBadge({ ok, label, okText, badText }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs ${ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
      {ok ? <Check className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
      <span className="font-medium">{label}</span>
      <span className="ml-auto text-[10px]">{ok ? okText : badText}</span>
    </div>
  );
}

export default function DealSummary({ results, dealType }) {
  const { people, metrics } = results;

  // Key metric cards per deal type
  const metricCards = [];
  if (dealType === "wholesale") {
    metricCards.push({ label: "Max Allowable Offer (70% Rule)", value: `$${metrics.mao?.toLocaleString() || 0}`, sub: "ARV × 70% − Rehab" });
    metricCards.push({ label: "Buyer's Purchase Price", value: `$${metrics.buyerPrice?.toLocaleString() || 0}`, sub: "Contract + Assignment Fee" });
    metricCards.push({ label: "Buyer's Projected Profit", value: `$${metrics.buyerProfit?.toLocaleString() || 0}`, sub: `ROI: ${metrics.buyerROI?.toFixed(1) || 0}%` });
    metricCards.push({ label: "Seller Net Proceeds", value: `$${metrics.sellerNet?.toLocaleString() || 0}`, sub: "After mortgage + closing" });
  } else if (dealType === "flip") {
    metricCards.push({ label: "Total Project Cost", value: `$${metrics.totalProjectCost?.toLocaleString() || 0}`, sub: "Purchase + rehab + carry + loan" });
    metricCards.push({ label: "Net Sale Proceeds", value: `$${metrics.netSale?.toLocaleString() || 0}`, sub: "ARV − commissions − closing" });
    metricCards.push({ label: "Flip Profit", value: `$${metrics.profit?.toLocaleString() || 0}`, sub: `ROI: ${metrics.roi?.toFixed(1) || 0}%` });
    metricCards.push({ label: "Cash Invested", value: `$${metrics.cashInvested?.toLocaleString() || 0}`, sub: "Down + rehab + carry + points" });
  } else if (dealType === "brrrr") {
    metricCards.push({ label: "Cash-Out at Refi", value: `$${metrics.cashOut?.toLocaleString() || 0}`, sub: "Refi amount − project cost" });
    metricCards.push({ label: "Cash Left in Deal", value: `$${Math.max(0, metrics.cashLeftIn || 0).toLocaleString()}`, sub: "Ideally $0 (infinite CoC)" });
    metricCards.push({ label: "Monthly Cash Flow", value: `$${metrics.monthlyCashFlow?.toFixed(0) || 0}`, sub: "After all expenses + mortgage" });
    metricCards.push({ label: "Cash-on-Cash Return", value: `${metrics.cocReturn > 999 ? "∞" : (metrics.cocReturn || 0).toFixed(1) + "%"}`, sub: "Annual / cash left in" });
  } else if (dealType === "hold") {
    metricCards.push({ label: "Cash Invested", value: `$${metrics.cashInvested?.toLocaleString() || 0}`, sub: "Down payment + closing" });
    metricCards.push({ label: "Monthly Cash Flow", value: `$${metrics.monthlyCashFlow?.toFixed(0) || 0}`, sub: "After all expenses" });
    metricCards.push({ label: "Cash-on-Cash Return", value: `${(metrics.cocReturn || 0).toFixed(1)}%`, sub: "Annual cash flow / invested" });
    metricCards.push({ label: "Cap Rate", value: `${(metrics.capRate || 0).toFixed(1)}%`, sub: "NOI / purchase price" });
  }

  // Fairness checks
  const fairness = [];
  if (dealType === "wholesale") {
    fairness.push({ ok: metrics.dealFairForBuyer, label: "Fair for buyer?", okText: `ROI ${metrics.buyerROI?.toFixed(0)}%`, badText: "ROI too low" });
    fairness.push({ ok: metrics.dealFairForSeller, label: "Seller walks with cash?", okText: "Net positive", badText: "Owes at closing" });
    fairness.push({ ok: metrics.assignmentInRange, label: "Assignment fee in range?", okText: "$5K-$20K", badText: "Outside industry norm" });
    fairness.push({ ok: metrics.assignmentPctOfSpread < 25, label: "Fee ≤ 25% of spread?", okText: `${metrics.assignmentPctOfSpread?.toFixed(0)}%`, badText: `${metrics.assignmentPctOfSpread?.toFixed(0)}% — too high` });
  } else if (dealType === "flip") {
    fairness.push({ ok: metrics.dealProfitable, label: "Deal profitable?", okText: `+$${metrics.profit?.toLocaleString()}`, badText: "Losing money" });
    fairness.push({ ok: metrics.meets70Rule, label: "Meets 70% rule?", okText: `≤ $${metrics.mao?.toLocaleString()}`, badText: "Overpaying" });
    fairness.push({ ok: metrics.roiHealthy, label: "ROI > 20%?", okText: `${metrics.roi?.toFixed(0)}%`, badText: `${metrics.roi?.toFixed(0)}% — marginal` });
  } else if (dealType === "brrrr") {
    fairness.push({ ok: metrics.dealProfitable, label: "Cash-out positive?", okText: `+$${metrics.cashOut?.toLocaleString()}`, badText: "Cash stuck in deal" });
    fairness.push({ ok: metrics.cashFlowPositive, label: "Cash flow positive?", okText: `+$${metrics.monthlyCashFlow?.toFixed(0)}/mo`, badText: "Negative monthly" });
  } else if (dealType === "hold") {
    fairness.push({ ok: metrics.cashFlowPositive, label: "Cash flow positive?", okText: `+$${metrics.monthlyCashFlow?.toFixed(0)}/mo`, badText: "Negative" });
    fairness.push({ ok: metrics.goodCapRate, label: "Cap rate ≥ 6%?", okText: `${metrics.capRate?.toFixed(1)}%`, badText: `${metrics.capRate?.toFixed(1)}% — below threshold` });
  }

  return (
    <div className="space-y-4">
      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        {metricCards.map((m) => (
          <div key={m.label} className="rounded-lg border border-black/10 bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-black/40">{m.label}</p>
            <p className="mt-1 font-display text-2xl font-light">{m.value}</p>
            <p className="mt-0.5 text-[10px] text-black/40">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Fairness checks */}
      <div className="rounded-lg border border-black/10 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Scale className="h-4 w-4 text-black/40" />
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-black/60">Deal Fairness Analysis</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {fairness.map((f) => (
            <FairnessBadge key={f.label} ok={f.ok} label={f.label} okText={f.okText} badText={f.badText} />
          ))}
        </div>
      </div>

      {/* Per-person breakdown */}
      <div className="rounded-lg border border-black/10 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-black/40" />
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-black/60">Who Gets What — Per-Person Breakdown</p>
        </div>
        <div className="space-y-2">
          {people.map((p, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-lg border p-3 ${COLOR_MAP[p.color] || COLOR_MAP.gray}`}>
              <div className="flex-1">
                <p className="text-sm font-medium">{p.role}</p>
                <p className="text-[10px] opacity-70">{p.name}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-medium">
                  {p.isMonthly ? "" : "$"}{p.amount?.toLocaleString(undefined, { maximumFractionDigits: 0 })}{p.isMonthly ? "/mo" : ""}
                </p>
                <p className="text-[10px] opacity-60">{p.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}