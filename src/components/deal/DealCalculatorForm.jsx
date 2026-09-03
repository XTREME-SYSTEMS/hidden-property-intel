import React from "react";
import { Home, Wrench, Calendar, DollarSign, Percent, TrendingUp } from "lucide-react";

function Field({ label, value, onChange, prefix, suffix, type = "number", hint }) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/50">{label}</label>
      <div className="mt-1 flex items-center rounded-md border border-black/15 bg-white">
        {prefix && <span className="pl-3 text-xs text-black/40">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-3 py-2 text-sm outline-none"
        />
        {suffix && <span className="pr-3 text-xs text-black/40">{suffix}</span>}
      </div>
      {hint && <p className="mt-1 text-[10px] text-black/30">{hint}</p>}
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-black/40" />
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-black/60">{title}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

export default function DealCalculatorForm({ inputs, setInputs, dealType }) {
  const set = (key) => (val) => setInputs((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-4">
      <Section title="Property & Valuation" icon={Home}>
        <Field label="ARV (After Repair)" value={inputs.arv} onChange={set("arv")} prefix="$" hint="What it sells for post-rehab" />
        <Field label="As-Is Value" value={inputs.as_is_value} onChange={set("as_is_value")} prefix="$" hint="Current condition value" />
        <Field label="Contract / Purchase Price" value={inputs.contract_price} onChange={set("contract_price")} prefix="$" hint="Price agreed with seller" />
        <Field label="Square Footage" value={inputs.square_footage || ""} onChange={set("square_footage")} suffix="sqft" hint="For $/sqft rehab estimate" />
      </Section>

      <Section title="Rehab & Timeline" icon={Wrench}>
        <Field label="Rehab Budget" value={inputs.rehab_budget} onChange={set("rehab_budget")} prefix="$" hint="Light $15-25/sf · Med $30-50 · Heavy $60-120" />
        <Field label="Rehab Time" value={inputs.rehab_months} onChange={set("rehab_months")} suffix="mo" />
        <Field label="Holding Period" value={inputs.holding_months} onChange={set("holding_months")} suffix="mo" hint="Total time owning property" />
        <div />
      </Section>

      <Section title="Monthly Carrying Costs" icon={Calendar}>
        <Field label="Property Taxes / mo" value={inputs.monthly_taxes} onChange={set("monthly_taxes")} prefix="$" />
        <Field label="Insurance / mo" value={inputs.monthly_insurance} onChange={set("monthly_insurance")} prefix="$" />
        <Field label="Utilities / mo" value={inputs.monthly_utilities} onChange={set("monthly_utilities")} prefix="$" />
        <Field label="HOA / mo" value={inputs.monthly_hoa} onChange={set("monthly_hoa")} prefix="$" />
      </Section>

      {dealType === "wholesale" && (
        <Section title="Wholesale Assignment" icon={DollarSign}>
          <Field label="Assignment Fee" value={inputs.assignment_fee} onChange={set("assignment_fee")} prefix="$" hint="Industry avg: $13,000 · Range $5K-$20K" />
          <div />
        </Section>
      )}

      {(dealType === "flip" || dealType === "brrrr") && (
        <Section title="Hard Money / Bridge Loan" icon={Percent}>
          <Field label="Interest Rate" value={inputs.hard_money_rate} onChange={set("hard_money_rate")} suffix="%" hint="Typical: 8-12%" />
          <Field label="Points" value={inputs.hard_money_points} onChange={set("hard_money_points")} suffix="pts" hint="Typical: 1-3" />
          <Field label="Down Payment" value={inputs.down_payment_pct} onChange={set("down_payment_pct")} suffix="%" hint="Typical: 10-20%" />
          <div />
        </Section>
      )}

      {(dealType === "brrrr" || dealType === "hold") && (
        <Section title="Rental & Refinance" icon={TrendingUp}>
          <Field label="Market Rent / mo" value={inputs.market_rent} onChange={set("market_rent")} prefix="$" />
          <Field label="Refi LTV" value={inputs.refi_ltv} onChange={set("refi_ltv")} suffix="%" hint="Typical: 70-75%" />
          <Field label="Refi Rate" value={inputs.refi_rate} onChange={set("refi_rate")} suffix="%" />
          <Field label="Loan Term" value={inputs.refi_term} onChange={set("refi_term")} suffix="yr" />
          <Field label="Property Tax Rate" value={inputs.property_tax_pct} onChange={set("property_tax_pct")} suffix="%" hint="FL avg ~1.1%" />
          <Field label="Insurance / yr" value={inputs.insurance_annual} onChange={set("insurance_annual")} prefix="$" />
          <Field label="Mgmt Fee" value={inputs.management_pct} onChange={set("management_pct")} suffix="%" />
          <Field label="Vacancy" value={inputs.vacancy_pct} onChange={set("vacancy_pct")} suffix="%" />
        </Section>
      )}

      <Section title="Sale Costs & Seller Info" icon={DollarSign}>
        <Field label="Commission Rate" value={inputs.commission_rate} onChange={set("commission_rate")} suffix="%" hint="Total both sides · Typical 5-6%" />
        <Field label="Closing Cost Rate" value={inputs.closing_cost_rate} onChange={set("closing_cost_rate")} suffix="%" hint="Typical 2-5%" />
        <Field label="Seller Mortgage Payoff" value={inputs.seller_mortgage} onChange={set("seller_mortgage")} prefix="$" />
        <Field label="Seller Liens / Judgments" value={inputs.seller_liens} onChange={set("seller_liens")} prefix="$" />
      </Section>
    </div>
  );
}