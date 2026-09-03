import React, { useState, useEffect, useCallback } from "react";
import { Mail, Phone, Loader2, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ScrapePanel from "@/components/admin/ScrapePanel";
import OutreachEditor from "@/components/admin/OutreachEditor";
import FollowUpControls from "@/components/admin/FollowUpControls";

export default function AdminInvestorList() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const records = await base44.entities.InvestorLead.list("-created_date", 200);
      setInvestors(records);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
        <div>
          <h2 className="text-lg font-medium">Investor List</h2>
          <p className="text-xs text-black/40">
            {investors.length} leads · outreach, follow-up & automation
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-black/15 px-3 py-1.5 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <ScrapePanel targetType="investor" onComplete={load} />

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-black/40" />
          </div>
        ) : investors.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-black/40">
            No investor leads yet. Use the manual scrape above to find investors.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b border-black/10 bg-white">
              <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-black/40">
                <th className="px-4 py-2.5">Name / Company</th>
                <th className="px-4 py-2.5">Contact</th>
                <th className="px-4 py-2.5">Markets</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Follow-up</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {investors.map((inv) => (
                <tr key={inv.id} className="hover:bg-black/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium">{inv.name}</p>
                    {inv.company && <p className="text-xs text-black/50">{inv.company}</p>}
                    <p className="mt-0.5 text-[10px] text-black/30">
                      {inv.source || "—"} · {inv.contact_count || 0} contacts
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {inv.email && (
                      <p className="flex items-center gap-1.5 text-xs">
                        <Mail className="h-3 w-3 text-black/40" />
                        {inv.email}
                      </p>
                    )}
                    {inv.phone && (
                      <p className="flex items-center gap-1.5 text-xs text-black/60">
                        <Phone className="h-3 w-3 text-black/40" />
                        {inv.phone}
                      </p>
                    )}
                    {!inv.email && !inv.phone && <span className="text-xs text-black/30">No contact info</span>}
                  </td>
                  <td className="px-4 py-3">
                    {(inv.target_markets || []).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {inv.target_markets.slice(0, 2).map((m, i) => (
                          <span key={i} className="rounded-full bg-black/5 px-2 py-0.5 text-[10px]">
                            {m}
                          </span>
                        ))}
                        {inv.target_markets.length > 2 && (
                          <span className="text-[10px] text-black/40">+{inv.target_markets.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-black/30">—</span>
                    )}
                    {(inv.investment_types || []).length > 0 && (
                      <p className="mt-1 text-[10px] text-black/40">{inv.investment_types.join(", ")}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.outreach_status} />
                  </td>
                  <td className="px-4 py-3">
                    <FollowUpControls targetType="investor" record={inv} onUpdate={load} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected({ record: inv, mode: "outreach" })}
                      className="inline-flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-xs text-white"
                    >
                      <Mail className="h-3 w-3" /> Outreach
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <OutreachEditor
          targetType="investor"
          record={selected.record}
          initialMode={selected.mode}
          onClose={() => setSelected(null)}
          onSent={load}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    new: "bg-blue-50 text-blue-700",
    contacted: "bg-amber-50 text-amber-700",
    responded: "bg-emerald-50 text-emerald-700",
    opted_out: "bg-red-50 text-red-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${styles[status] || styles.new}`}>
      {status || "new"}
    </span>
  );
}