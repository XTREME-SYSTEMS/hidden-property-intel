import React from "react";
import { jsPDF } from "jspdf";
import { Download } from "lucide-react";
import { money, num, pct } from "@/lib/format";
import { labelFor } from "@/components/DistressBadge";

export default function PropertyBrief({ property, score, owners = [], chain, bids = [], titleRisk }) {
  const generate = () => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const left = 48;
    let y = 60;
    const line = () => (y += 16);
    const h = (t, size = 16) => { doc.setFont("helvetica", "bold"); doc.setFontSize(size); doc.text(t, left, y); y += size + 6; };
    const p = (t, size = 10) => { doc.setFont("helvetica", "normal"); doc.setFontSize(size); doc.text(String(t), left, y, { maxWidth: 500 }); y += 14; };

    doc.setFillColor(15, 42, 29); doc.rect(0, 0, 612, 70, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
    doc.text("PROPERTYINTEL", left, 44);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text("Investor Brief — confidential", 612 - left - 150, 44);
    doc.setTextColor(20, 20, 20);

    y = 100;
    h(`${property.city}, ${property.state} ${property.zip_code}`);
    p(`Distress: ${labelFor(property.distress_type)}  ·  Type: ${labelFor(property.property_type)}  ·  Score: ${num(property.property_score)}`);
    p(`Estimated value: ${money(property.estimated_value)}  ·  Asking: ${money(property.proposed_asking_price)}  ·  Beds/Baths: ${num(property.bedrooms)}/${num(property.bathrooms)}  ·  Sqft: ${num(property.square_footage)}`);
    y += 6;

    h("AI Score Analysis", 12);
    if (score) {
      p(`Overall score: ${num(score.overall_score)}  ·  Severity: ${score.distress_severity || "—"}  ·  Est. ROI: ${pct(score.estimated_roi)}`);
      p(`Repair estimate: ${money(score.repair_cost_estimate)}  ·  ARV: ${money(score.after_repair_value)}`);
      if (score.ai_analysis) { p(score.ai_analysis); }
    } else { p("No score on file."); }

    y += 6;
    h("Title / Lien Risk", 12);
    if (titleRisk) {
      p(`Risk level: ${titleRisk.risk_level || "—"}  ·  Lien total: ${money(titleRisk.lien_total)}  ·  Mortgage: ${money(titleRisk.mortgage_balance)}`);
      p(`Judgments: ${titleRisk.has_judgments ? "Yes" : "No"}  ·  Tax delinquent: ${titleRisk.tax_delinquent ? "Yes" : "No"}  ·  HOA delinquent: ${titleRisk.hoa_delinquent ? "Yes" : "No"}`);
      if (titleRisk.ai_analysis) p(titleRisk.ai_analysis);
    } else { p("No title-risk assessment on file."); }

    y += 6;
    h("Ownership Chain", 12);
    if (owners.length) {
      owners.forEach((o) => p(`• ${o.name} (${labelFor(o.owner_type)}) — ${o.relationship_to_property || ""}`));
    } else { p("No owner records."); }
    if (chain?.transfers?.length) {
      y += 4; p("Transfers:");
      chain.transfers.forEach((t) => p(`  ${t.transfer_date || ""}: ${t.from_owner || "—"} → ${t.to_owner || "—"} (${money(t.sale_price)})`));
    }

    y += 6;
    h("Comparable Sales", 12);
    if (score?.comparable_sales?.length) {
      score.comparable_sales.forEach((c) => p(`• ${c.address} — ${money(c.sale_price)} (${c.sale_date || ""}, ${num(c.sqft)} sqft)`));
    } else { p("No comparable sales on file."); }

    y += 6;
    h("Bid History", 12);
    if (bids.length) {
      bids.forEach((b) => p(`• ${money(b.bid_amount)} — ${b.investor_name || "Investor"} (${b.status})`));
    } else { p("No bids yet."); }

    doc.setFontSize(8); doc.setTextColor(120, 120, 120);
    doc.text(`Generated ${new Date().toLocaleString()} · PropertyIntel`, left, 760);

    doc.save(`PropertyIntel-Brief-${property.city}-${property.state}.pdf`);
  };

  return (
    <button
      onClick={generate}
      className="inline-flex items-center gap-2 rounded-full bg-[#0F2A1D] px-5 py-2.5 text-sm text-white hover:bg-[#1A2B22]"
    >
      <Download className="h-4 w-4" /> Download investor brief
    </button>
  );
}