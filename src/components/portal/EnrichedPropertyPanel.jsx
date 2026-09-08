import React from "react";
import { Image } from "@/components/ui/image";
import { Building2, Gauge } from "lucide-react";

function Row({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between gap-3 py-1.5 text-xs" style={{ borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span className="text-right font-medium" style={{ color: "var(--ink)" }}>{value}</span>
    </div>
  );
}

export default function EnrichedPropertyPanel({ property, owner }) {
  const p = property || {};
  const score = p.investment_opportunity_score ?? p.property_score;
  return (
    <div className="grid gap-4 lg:grid-cols-[160px_1fr_1fr]">
      <div className="overflow-hidden rounded-lg" style={{ background: "#f4f6fb", border: "1px solid var(--border)" }}>
        {p.images?.[0]?.url ? (
          <Image src={p.images[0].url} alt={p.address} fittingType="fill" className="h-32 w-full" />
        ) : (
          <div className="grid h-32 place-items-center"><Building2 className="h-8 w-8" style={{ color: "var(--gold-3)" }} /></div>
        )}
      </div>
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-wide" style={{ color: "var(--gold-3)" }}>Property</p>
        <Row label="Type" value={p.property_type} />
        <Row label="Beds / Baths" value={p.bedrooms || p.bathrooms ? `${p.bedrooms || 0} / ${p.bathrooms || 0}` : ""} />
        <Row label="Sq Ft" value={p.square_footage?.toLocaleString()} />
        <Row label="Year Built" value={p.year_built} />
        <Row label="Lot" value={p.lot_size?.toLocaleString()} />
        <Row label="Zoning" value={p.zoning} />
        <Row label="Occupancy" value={p.occupancy_status} />
      </div>
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-wide" style={{ color: "var(--gold-3)" }}>Value & Distress</p>
        <Row label="Est. Value" value={p.estimated_value ? `$${p.estimated_value.toLocaleString()}` : ""} />
        <Row label="ARV" value={p.arv ? `$${p.arv.toLocaleString()}` : ""} />
        <Row label="Tax Assessed" value={p.tax_assessed_value ? `$${p.tax_assessed_value.toLocaleString()}` : ""} />
        <Row label="Equity" value={p.equity_estimate ? `$${p.equity_estimate.toLocaleString()}` : ""} />
        <Row label="Mortgage Bal." value={p.mortgage_balance ? `$${p.mortgage_balance.toLocaleString()}` : ""} />
        <Row label="Tax Delinquent" value={p.tax_delinquent_amount ? `$${p.tax_delinquent_amount.toLocaleString()}` : ""} />
        <Row label="Foreclosure" value={p.foreclosure_status && p.foreclosure_status !== "none" ? p.foreclosure_status : ""} />
        <Row label="Distress" value={p.distress_type?.replace(/_/g, " ")} />
      </div>
      {score !== undefined && (
        <div className="lg:col-span-3">
          <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: "#eef2fb", border: "1px solid var(--border)" }}>
            <Gauge className="h-5 w-5 shrink-0" style={{ color: "var(--gold-3)" }} />
            <div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Opportunity Score</p>
              <p className="font-heading text-lg font-bold" style={{ color: "var(--ink)" }}>{score} / 100</p>
            </div>
            {p.investor_summary && <p className="ml-auto max-w-md text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{p.investor_summary}</p>}
          </div>
        </div>
      )}
      {p.comparable_sales?.length > 0 && (
        <div className="lg:col-span-3">
          <p className="mb-2 text-[10px] uppercase tracking-wide" style={{ color: "var(--gold-3)" }}>Comparable Sales</p>
          <div className="flex flex-wrap gap-2">
            {p.comparable_sales.slice(0, 6).map((c, i) => (
              <div key={i} className="rounded-md px-2.5 py-1.5 text-xs" style={{ background: "#f4f6fb", border: "1px solid var(--border)", color: "var(--ink)" }}>
                {c.address || "Comp"} · ${c.sale_price?.toLocaleString() || "—"}
              </div>
            ))}
          </div>
        </div>
      )}
      {owner?.owner_type === "potential_heir" && owner?.next_of_kin?.length > 0 && (
        <div className="lg:col-span-3">
          <p className="mb-2 text-[10px] uppercase tracking-wide" style={{ color: "var(--gold-3)" }}>Heir / Next of Kin</p>
          <div className="flex flex-wrap gap-2">
            {owner.next_of_kin.map((k, i) => (
              <div key={i} className="rounded-md px-2.5 py-1.5 text-xs" style={{ background: "#f4f6fb", border: "1px solid var(--border)", color: "var(--ink)" }}>
                {k.name} ({k.relationship || "kin"}) · {k.contact_phone || k.contact_email || "no contact"}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}