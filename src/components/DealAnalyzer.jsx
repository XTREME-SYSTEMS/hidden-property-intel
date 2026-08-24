import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { money, pct } from "@/lib/format";

function Field({ label, value, onChange, suffix, options }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.2em] text-[#707070]">{label}</span>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-[#e0e0e0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#c5a059]"
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <div className="mt-1.5 flex items-center rounded-lg border border-[#e0e0e0] bg-white focus-within:border-[#c5a059]">
          <span className="pl-3 text-sm text-[#707070]">$</span>
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full bg-transparent px-2 py-2.5 text-sm tabular-nums outline-none"
          />
          {suffix && <span className="pr-3 text-xs text-[#707070]">{suffix}</span>}
        </div>
      )}
    </label>
  );
}

function Result({ label, value, highlight }) {
  return (
    <div className={`rounded-lg p-4 ${highlight ? "bg-[#c5a059] text-[#0a0a0a]" : "bg-[#1a1a1a] text-white"}`}>
      <p className={`text-[9px] uppercase tracking-[0.2em] ${highlight ? "text-[#0a0a0a]/60" : "text-white/40"}`}>{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums sm:text-xl">{value}</p>
    </div>
  );
}

export default function DealAnalyzer({ defaultPrice = 250000, defaultRepairs = 40000, defaultArv = 380000 }) {
  const [s, setS] = useState({
    price: defaultPrice,
    repairs: defaultRepairs,
    closing: 5000,
    holdingMonths: 6,
    holdingMonthly: 2000,
    loanType: "Conventional",
    downPct: 25,
    arv: defaultArv,
    sellingCostPct: 6,
  });
  const set = (k) => (v) => setS((p) => ({ ...p, [k]: v }));

  const results = useMemo(() => {
    const downPayment = s.price * (s.downPct / 100);
    const loanAmount = s.price - downPayment;
    const closingCosts = s.closing;
    const holdingCosts = s.holdingMonths * s.holdingMonthly;
    const totalInvested = downPayment + s.repairs + closingCosts + holdingCosts;
    const sellCosts = s.arv * (s.sellingCostPct / 100);
    const loanPayoff = loanAmount;
    const netSale = s.arv - sellCosts - loanPayoff;
    const profit = netSale - (downPayment + s.repairs + closingCosts + holdingCosts);
    const roi = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
    const annualized = s.holdingMonths > 0 ? roi * (12 / s.holdingMonths) : 0;
    const cashOnCash = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

    return { downPayment, loanAmount, closingCosts, holdingCosts, totalInvested, sellCosts, profit, roi, annualized, cashOnCash, arv: s.arv };
  }, [s]);

  const chartData = useMemo(() => [
    { name: "Purchase", value: s.price * (s.downPct / 100), color: "#0a0a0a" },
    { name: "Repairs", value: s.repairs, color: "#c5a059" },
    { name: "Closing", value: s.closing, color: "#707070" },
    { name: "Holding", value: s.holdingMonths * s.holdingMonthly, color: "#2a2a2a" },
    { name: "Profit", value: Math.max(0, results.profit), color: "#c5a059" },
  ].filter((d) => d.value > 0), [s, results]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      {/* Input form */}
      <div className="rounded-xl border border-[#e0e0e0] bg-white p-5 sm:p-6">
        <h3 className="text-[11px] uppercase tracking-[0.25em] text-[#707070]">Purchase Details</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Purchase Price" value={s.price} onChange={set("price")} />
          <Field label="Repair Budget" value={s.repairs} onChange={set("repairs")} />
          <Field label="Closing Costs" value={s.closing} onChange={set("closing")} />
          <Field label="Holding Months" value={s.holdingMonths} onChange={set("holdingMonths")} suffix="mo" />
          <Field label="Holding Cost / Mo" value={s.holdingMonthly} onChange={set("holdingMonthly")} />
          <Field label="Loan Type" value={s.loanType} onChange={set("loanType")} options={["Conventional", "Hard Money", "Cash", "FHA", "VA"]} />
          <Field label="Down Payment" value={s.downPct} onChange={set("downPct")} suffix="%" />
          <Field label="After-Repair Value" value={s.arv} onChange={set("arv")} />
        </div>
      </div>

      {/* Results */}
      <div className="rounded-xl bg-[#0a0a0a] p-5 text-white sm:p-6">
        <h3 className="text-[11px] uppercase tracking-[0.25em] text-white/40">Estimated Results</h3>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Result label="ARV" value={money(results.arv)} />
          <Result label="Total Investment" value={money(results.totalInvested)} />
          <Result label="Projected Profit" value={money(results.profit)} highlight />
          <Result label="ROI" value={pct(results.roi)} highlight />
          <Result label="Cash-on-Cash" value={pct(results.cashOnCash)} />
          <Result label="Annualized ROI" value={pct(results.annualized)} />
        </div>

        {/* Donut chart */}
        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Projected Profit Breakdown</p>
          <div className="mt-3 flex items-center gap-6">
            <div className="h-36 w-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={2}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-2 text-xs">
              {chartData.map((d) => (
                <li key={d.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-white/60">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="tabular-nums text-white/80">{money(d.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}