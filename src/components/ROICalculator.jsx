import React, { useState } from "react";
import { money, pct } from "@/lib/format";

function Field({ label, value, onChange, suffix }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-[#6B7B72]">{label}</span>
      <div className="mt-1.5 flex items-center rounded-xl bg-white ring-1 ring-[#E5EDEA] focus-within:ring-2 focus-within:ring-emerald-400">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent px-3 py-2.5 text-sm tabular-nums outline-none"
        />
        {suffix && <span className="pr-3 text-xs text-[#6B7B72]">{suffix}</span>}
      </div>
    </label>
  );
}

function Out({ label, value }) {
  return (
    <div className="rounded-xl bg-[#0F2A1D] p-4 text-white">
      <p className="text-[10px] uppercase tracking-widest text-emerald-300">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

const TABS = ["Rental", "Fix & Flip", "Wholesale", "Short-term"];

export default function ROICalculator({ defaultPrice = 250000, defaultRepairs = 40000, defaultArv = 380000 }) {
  const [tab, setTab] = useState(0);
  const [s, setS] = useState({
    price: defaultPrice, down: 20, rate: 7, rent: 2400, expenses: 700, vacancy: 6,
    repairs: defaultRepairs, arv: defaultArv, holding: 12000, selling: 6,
    contract: defaultPrice, fee: 15000,
    nightly: 220, occupancy: 65, strExpenses: 1200,
  });
  const set = (k) => (v) => setS((p) => ({ ...p, [k]: v }));

  let outputs = [];
  if (tab === 0) {
    const loan = s.price * (1 - s.down / 100);
    const r = s.rate / 100 / 12;
    const mortgage = r > 0 ? (loan * r) / (1 - Math.pow(1 + r, -360)) : loan / 360;
    const effRent = s.rent * (1 - s.vacancy / 100);
    const cash = effRent - s.expenses - mortgage;
    const noi = (effRent - s.expenses) * 12;
    const invested = s.price * (s.down / 100);
    outputs = [
      { label: "Monthly cash flow", value: money(cash) },
      { label: "Cap rate", value: pct((noi / s.price) * 100) },
      { label: "Cash-on-cash", value: pct(((cash * 12) / (invested || 1)) * 100) },
      { label: "Annual NOI", value: money(noi) },
    ];
  } else if (tab === 1) {
    const total = s.price + s.repairs + s.holding;
    const sellCost = s.arv * (s.selling / 100);
    const net = s.arv - sellCost - total;
    outputs = [
      { label: "Total investment", value: money(total) },
      { label: "Gross profit", value: money(s.arv - total) },
      { label: "Net profit", value: money(net) },
      { label: "ROI", value: pct((net / (total || 1)) * 100) },
    ];
  } else if (tab === 2) {
    const investorTotal = s.contract + s.fee + s.repairs;
    const profit = s.arv - investorTotal;
    outputs = [
      { label: "Assignment fee", value: money(s.fee) },
      { label: "Investor all-in", value: money(investorTotal) },
      { label: "Investor profit", value: money(profit) },
      { label: "Investor ROI", value: pct((profit / (investorTotal || 1)) * 100) },
    ];
  } else {
    const monthly = s.nightly * 30 * (s.occupancy / 100);
    const netMonthly = monthly - s.strExpenses;
    outputs = [
      { label: "Monthly revenue", value: money(monthly) },
      { label: "Annual revenue", value: money(monthly * 12) },
      { label: "Cap rate", value: pct(((netMonthly * 12) / (s.price || 1)) * 100) },
      { label: "Annual net", value: money(netMonthly * 12) },
    ];
  }

  return (
    <div className="rounded-3xl bg-[#F8FAF9] ring-1 ring-[#E5EDEA] p-5 sm:p-7">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              tab === i ? "bg-[#0F2A1D] text-white" : "bg-white text-[#1A2B22] ring-1 ring-[#E5EDEA] hover:bg-[#E5EDEA]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tab === 0 && (
          <>
            <Field label="Purchase price" value={s.price} onChange={set("price")} />
            <Field label="Down payment" value={s.down} onChange={set("down")} suffix="%" />
            <Field label="Interest rate" value={s.rate} onChange={set("rate")} suffix="%" />
            <Field label="Monthly rent" value={s.rent} onChange={set("rent")} />
            <Field label="Monthly expenses" value={s.expenses} onChange={set("expenses")} />
            <Field label="Vacancy" value={s.vacancy} onChange={set("vacancy")} suffix="%" />
          </>
        )}
        {tab === 1 && (
          <>
            <Field label="Purchase price" value={s.price} onChange={set("price")} />
            <Field label="Repair costs" value={s.repairs} onChange={set("repairs")} />
            <Field label="After-repair value" value={s.arv} onChange={set("arv")} />
            <Field label="Holding costs" value={s.holding} onChange={set("holding")} />
            <Field label="Selling costs" value={s.selling} onChange={set("selling")} suffix="%" />
          </>
        )}
        {tab === 2 && (
          <>
            <Field label="Contract price" value={s.contract} onChange={set("contract")} />
            <Field label="Assignment fee" value={s.fee} onChange={set("fee")} />
            <Field label="Estimated ARV" value={s.arv} onChange={set("arv")} />
            <Field label="Repair costs" value={s.repairs} onChange={set("repairs")} />
          </>
        )}
        {tab === 3 && (
          <>
            <Field label="Purchase price" value={s.price} onChange={set("price")} />
            <Field label="Nightly rate" value={s.nightly} onChange={set("nightly")} />
            <Field label="Occupancy" value={s.occupancy} onChange={set("occupancy")} suffix="%" />
            <Field label="Monthly expenses" value={s.strExpenses} onChange={set("strExpenses")} />
          </>
        )}
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {outputs.map((o) => <Out key={o.label} {...o} />)}
      </div>
    </div>
  );
}