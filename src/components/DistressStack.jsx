import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Layers, AlertTriangle, FileX, Scale, Home, DollarSign, ShieldAlert } from "lucide-react";

/**
 * List-Stacking UI — surfaces all cross-referenced distress indicators
 * for a single property in one panel (PropertyRadar parity).
 *
 * Pulls from: Property distress_type, TitleRisk, OwnershipChain, days_on_market.
 */
export default function DistressStack({ property, titleRisk, chain, score }) {
  const [indicators, setIndicators] = useState([]);

  useEffect(() => {
    const list = [];

    // 1. Primary distress type
    if (property?.distress_type) {
      list.push({
        icon: AlertTriangle,
        label: property.distress_type.replace(/_/g, " "),
        detail: "Primary distress signal from county records",
        severity: "high",
      });
    }

    // 2. Title risk indicators
    if (titleRisk) {
      if (titleRisk.tax_delinquent) {
        list.push({ icon: DollarSign, label: "Tax Delinquent", detail: "Property taxes unpaid", severity: "high" });
      }
      if (titleRisk.hoa_delinquent) {
        list.push({ icon: DollarSign, label: "HOA Delinquent", detail: "HOA fees unpaid", severity: "medium" });
      }
      if (titleRisk.has_judgments) {
        list.push({ icon: Scale, label: "Judgments", detail: "Civil judgments on record", severity: "high" });
      }
      if ((titleRisk.lien_total || 0) > 0) {
        list.push({ icon: FileX, label: "Liens", detail: `$${titleRisk.lien_total.toLocaleString()} in liens`, severity: "critical" });
      }
      if ((titleRisk.mortgage_balance || 0) > 0) {
        list.push({ icon: Home, label: "Mortgage", detail: `$${titleRisk.mortgage_balance.toLocaleString()} balance`, severity: "medium" });
      }
      if (titleRisk.code_liens?.length > 0) {
        list.push({ icon: ShieldAlert, label: "Code Violations", detail: titleRisk.code_liens.join(", "), severity: "high" });
      }
    }

    // 3. Ownership chain signals (probate, recent transfer)
    if (chain?.transfers?.length > 0) {
      const recent = chain.transfers[0];
      const transferDate = new Date(recent.transfer_date);
      const daysSince = (Date.now() - transferDate.getTime()) / (1000 * 60 * 60 * 24);
      if (recent.transfer_type?.toLowerCase().includes("probate") || daysSince < 180) {
        list.push({
          icon: Home,
          label: "Recent Transfer",
          detail: `${recent.transfer_type || "Ownership transfer"} ${recent.transfer_date}`,
          severity: "medium",
        });
      }
    }

    // 4. Days on market (stale = more motivated)
    if ((property?.days_on_market || 0) > 90) {
      list.push({
        icon: AlertTriangle,
        label: "Extended DOM",
        detail: `${property.days_on_market} days on market — motivated seller`,
        severity: "medium",
      });
    }

    // 5. Distress severity from score
    if (score?.distress_severity === "critical" || score?.distress_severity === "high") {
      list.push({
        icon: ShieldAlert,
        label: "High Distress Severity",
        detail: `AI severity: ${score.distress_severity}`,
        severity: "critical",
      });
    }

    setIndicators(list);
  }, [property, titleRisk, chain, score]);

  if (!indicators.length) return null;

  const severityColor = {
    critical: "border-red-300 bg-red-50 text-red-700",
    high: "border-orange-300 bg-orange-50 text-orange-700",
    medium: "border-amber-300 bg-amber-50 text-amber-700",
    low: "border-emerald-300 bg-emerald-50 text-emerald-700",
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-5 w-5 text-gold" />
        <h3 className="font-display text-lg">Stacked distress indicators</h3>
        <span className="rounded-full bg-black px-2 py-0.5 text-[10px] uppercase tracking-widest text-white">
          {indicators.length} signals
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {indicators.map((ind, i) => (
          <div key={i} className={`flex items-start gap-3 rounded-xl border p-3 ${severityColor[ind.severity]}`}>
            <ind.icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-medium capitalize">{ind.label}</p>
              <p className="text-xs opacity-80">{ind.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}