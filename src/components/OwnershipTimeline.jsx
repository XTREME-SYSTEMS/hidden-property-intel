import React from "react";
import { money } from "@/lib/format";
import { FileText } from "lucide-react";

export default function OwnershipTimeline({ transfers = [] }) {
  if (!transfers.length) return <p className="text-sm text-[#6B7B72]">No recorded transfers found.</p>;
  return (
    <ol className="relative border-l border-[#E5EDEA] pl-6 space-y-7">
      {transfers.map((t, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
          <p className="text-sm font-medium text-[#1A2B22]">
            {t.from_owner} → {t.to_owner}
          </p>
          <p className="mt-0.5 text-xs text-[#6B7B72] tabular-nums">
            {t.transfer_date} · {t.transfer_type} · {money(t.sale_price)}
          </p>
          {t.source && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-[#6B7B72]">
              <FileText className="h-3 w-3" /> Source: {t.source}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}