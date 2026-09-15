import React, { useMemo, useState } from "react";
import { money } from "@/lib/format";
import { Home, RefreshCw, Building2, Briefcase } from "lucide-react";

const STRATEGIES = [
  { id: "flip", label: "Flip", icon: Home },
  { id: "brrrr", label: "BRRRR", icon: RefreshCw },
  { id: "buy_hold", label: "Buy & Hold", icon: Building2 },
  { id: "wholesale", label: "Wholesale", icon: Briefcase },
];

function Field({ label, value, onChange, prefix = "$" }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-[#6B7B72]">{label}</span>
      <div className="mt-1 flex items-center rounded-xl bg-[#F8FAF9] px-3 ring-1 ring-[#E5EDEA] focus-within:ring-emerald-500">
        {prefix && <span className="text-sm text-[#6B7B72]">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-2 py-2.5 text-sm tabular-nums outline-none"
        />
      </div>
    </label>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-xl bg-[#F8FAF9] p-4 ring-1 ring-[#E5EDEA]">
      <p className="text-[10px] uppercase tracking-widest text-[#6B7B72]">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${accent || ""}`}>{value}</p>
    </div>
  );
}

export default function ExitStrategyModel({
  defaultPrice = 250000, defaultRepairs = 40000, defaultArv = 380000, defaultRent = 2200,
}) {
  const [strategy, setStrategy] = useState("flip");
  const [v, setV] = useState({
    price: defaultPrice, repairs: defaultRepairs, arv: defaultArv, holding: 8000,
    sellingCostPct: 8, rent: defaultRent, downPct: 25, rate: 7.5, wholesaleFee: 10000,
  });
  const set = (k, val) => setV((s) => ({ ...s, [k]: Number(val) || 0 }));

  const r = useMemo(() => {
    const { price, repairs, arv, holding, sellingCostPct, rent, downPct, rate, wholesaleFee } = v;
    const sellingCosts = arv * (sellingCostPct / 100);
    const flipProfit = arv - price - repairs - holding - sellingCosts;
    const brrrrCashOut = arv * 0.75;
    const brrrrLeftIn = Math.max(0, price + repairs + holding - brrrrCashOut);
    const brrrrProfit = brrrrCashOut - (price + repairs + holding);
    const down = price * (downPct / 100);
    const loan = price - down;
    const annualDebt = loan * (rate / 100);
    const annualNOI = rent * 12 * 0.6;
    const capRate = price ? (annualNOI / price) * 100 : 0;
    const cashFlow = annualNOI - annualDebt;
    const cocReturn = down ? (cashFlow / down) * 100 : 0;
    return { flipProfit, brrrrCashOut, brrrrLeftIn, brrrrProfit, down, loan, capRate, cashFlow, cocReturn, wholesaleFee };
  }, [v]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {STRATEGIES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStrategy(s.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              strategy === s.id ? "bg-[#0F2A1D] text-white" : "bg-[#F8FAF9] text-[#1A2B22] ring-1 ring-[#E5EDEA] hover:bg-[#E5EDEA]"
            }`}
          >
            <s.icon className="h-3.5 w-3.5" /> {s.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Field label="Purchase price" value={v.price} onChange={(x) => set("price", x)} />
        <Field label="Rehab budget" value={v.repairs} onChange={(x) => set("repairs", x)} />
        <Field label="After-repair value" value={v.arv} onChange={(x) => set("arv", x)} />
        {strategy === "buy_hold" ? (
          <>
            <Field label="Down payment %" value={v.downPct} onChange={(x) => set("downPct", x)} prefix="" />
            <Field label="Interest rate %" value={v.rate} onChange={(x) => set("rate", x)} prefix="" />
            <Field label="Monthly rent" value={v.rent} onChange={(x) => set("rent", x)} />
          </>
        ) : strategy === "wholesale" ? (
          <Field label="Assignment fee" value={v.wholesaleFee} onChange={(x) => set("wholesaleFee", x)} />
        ) : (
          <>
            <Field label="Holding costs" value={v.holding} onChange={(x) => set("holding", x)} />
            <Field label="Selling costs %" value={v.sellingCostPct} onChange={(x) => set("sellingCostPct", x)} prefix="" />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {strategy === "flip" && (
          <>
            <Stat label="Projected profit" value={money(r.flipProfit)} accent={r.flipProfit >= 0 ? "text-emerald-600" : "text-red-600"} />
            <Stat label="Selling costs" value={money(v.arv * (v.sellingCostPct / 100))} />
            <Stat label="Total cost basis" value={money(v.price + v.repairs + v.holding)} />
          </>
        )}
        {strategy === "brrrr" && (
          <>
            <Stat label="Cash-out at refi" value={money(r.brrrrCashOut)} />
            <Stat label="Capital left in deal" value={money(r.brrrrLeftIn)} accent={r.brrrrLeftIn <= 0 ? "text-emerald-600" : ""} />
            <Stat label="Net to investor" value={money(r.brrrrProfit)} accent={r.brrrrProfit >= 0 ? "text-emerald-600" : "text-red-600"} />
          </>
        )}
        {strategy === "buy_hold" && (
          <>
            <Stat label="Cap rate" value={`${r.capRate.toFixed(2)}%`} />
            <Stat label="Annual cash flow" value={money(r.cashFlow)} accent={r.cashFlow >= 0 ? "text-emerald-600" : "text-red-600"} />
            <Stat label="Cash-on-cash" value={`${r.cocReturn.toFixed(1)}%`} accent={r.cocReturn >= 0 ? "text-emerald-600" : "text-red-600"} />
          </>
        )}
        {strategy === "wholesale" && (
          <>
            <Stat label="Assignment fee" value={money(v.wholesaleFee)} accent="text-emerald-600" />
            <Stat label="Capital required" value={money(0)} />
            <Stat label="ROI on fee" value="∞" accent="text-emerald-600" />
          </>
        )}
      </div>
    </div>
  );
}