import React, { useState, useEffect, useCallback } from "react";
import { Mail, Phone, Loader2, RefreshCw, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ScrapePanel from "@/components/admin/ScrapePanel";
import OutreachEditor from "@/components/admin/OutreachEditor";
import FollowUpControls from "@/components/admin/FollowUpControls";

export default function AdminOwnerList() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [searchingKin, setSearchingKin] = useState(null);
  const [kinResults, setKinResults] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const records = await base44.entities.Owner.list("-created_date", 200);
      setOwners(records);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchKin = async (ownerId) => {
    setSearchingKin(ownerId);
    try {
      const res = await base44.functions.invoke("searchNextOfKin", { owner_id: ownerId });
      setKinResults((prev) => ({ ...prev, [ownerId]: res.data }));
      await load();
    } catch (e) {
      setKinResults((prev) => ({ ...prev, [ownerId]: { error: e.response?.data?.error || e.message } }));
    }
    setSearchingKin(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
        <div>
          <h2 className="text-lg font-medium">Property Owner List</h2>
          <p className="text-xs text-black/40">
            {owners.length} owners · next of kin search, outreach & follow-up
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

      <ScrapePanel targetType="owner" onComplete={load} />

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-black/40" />
          </div>
        ) : owners.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-black/40">
            No property owners yet. Use the manual scrape above to find owners.
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {owners.map((owner) => (
              <div key={owner.id} className="px-4 py-3 hover:bg-black/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{owner.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          owner.owner_type === "current"
                            ? "bg-blue-50 text-blue-700"
                            : owner.owner_type === "potential_heir"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {owner.owner_type}
                      </span>
                      <StatusBadge status={owner.outreach_status} />
                    </div>
                    {owner.contact_address && (
                      <p className="mt-0.5 text-xs text-black/50">{owner.contact_address}</p>
                    )}
                    <div className="mt-1 flex items-center gap-3">
                      {owner.contact_email && (
                        <span className="flex items-center gap-1 text-xs text-black/60">
                          <Mail className="h-3 w-3" />
                          {owner.contact_email}
                        </span>
                      )}
                      {owner.contact_phone && (
                        <span className="flex items-center gap-1 text-xs text-black/60">
                          <Phone className="h-3 w-3" />
                          {owner.contact_phone}
                        </span>
                      )}
                      {!owner.contact_email && !owner.contact_phone && (
                        <span className="text-xs text-black/30">No contact info</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FollowUpControls targetType="owner" record={owner} onUpdate={load} />
                    <button
                      onClick={() => handleSearchKin(owner.id)}
                      disabled={searchingKin === owner.id}
                      className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-1.5 text-xs disabled:opacity-50"
                    >
                      {searchingKin === owner.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Users className="h-3 w-3" />
                      )}
                      {searchingKin === owner.id ? "Searching…" : "Next of Kin"}
                    </button>
                    <button
                      onClick={() => setSelected({ record: owner, mode: "outreach", nextOfKin: owner.next_of_kin })}
                      className="inline-flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-xs text-white"
                    >
                      <Mail className="h-3 w-3" /> Outreach
                    </button>
                  </div>
                </div>

                {/* Next of kin search results */}
                {kinResults[owner.id] && (
                  <div className="mt-3 ml-4 rounded-md border border-black/10 bg-[#faf9f6] p-3">
                    {kinResults[owner.id].error ? (
                      <p className="text-xs text-red-600">{kinResults[owner.id].error}</p>
                    ) : kinResults[owner.id].relatives?.length > 0 ? (
                      <div>
                        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-black/40">
                          Next of Kin Found ({kinResults[owner.id].confidence} confidence)
                        </p>
                        <div className="space-y-2">
                          {kinResults[owner.id].relatives.map((kin, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-md border border-black/5 bg-white p-2"
                            >
                              <div>
                                <p className="text-xs font-medium">{kin.name}</p>
                                <p className="text-[10px] text-black/50">
                                  {kin.relationship || "relative"}
                                  {kin.contact_phone && ` · ${kin.contact_phone}`}
                                  {kin.contact_email && ` · ${kin.contact_email}`}
                                </p>
                                <p className="text-[10px] text-black/30">{kin.source}</p>
                              </div>
                              <button
                                onClick={() =>
                                  setSelected({
                                    record: owner,
                                    mode: "next_of_kin",
                                    nextOfKin: kinResults[owner.id].relatives,
                                    nextOfKinIndex: i,
                                    recipientEmail: kin.contact_email,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-2.5 py-1 text-[11px]"
                              >
                                <Mail className="h-3 w-3" /> Outreach
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-black/40">
                        No relatives found. Try a skip-trace for more contact info.
                      </p>
                    )}
                  </div>
                )}

                {/* Stored next of kin from record */}
                {!kinResults[owner.id] && owner.next_of_kin?.length > 0 && (
                  <div className="mt-3 ml-4 rounded-md border border-black/10 bg-[#faf9f6] p-3">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-black/40">
                      Next of Kin ({owner.next_of_kin.length})
                    </p>
                    <div className="space-y-2">
                      {owner.next_of_kin.map((kin, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-md border border-black/5 bg-white p-2"
                        >
                          <div>
                            <p className="text-xs font-medium">{kin.name}</p>
                            <p className="text-[10px] text-black/50">
                              {kin.relationship || "relative"}
                              {kin.contact_phone && ` · ${kin.contact_phone}`}
                              {kin.contact_email && ` · ${kin.contact_email}`}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setSelected({
                                record: owner,
                                mode: "next_of_kin",
                                nextOfKin: owner.next_of_kin,
                                nextOfKinIndex: i,
                                recipientEmail: kin.contact_email,
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-2.5 py-1 text-[11px]"
                          >
                            <Mail className="h-3 w-3" /> Outreach
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <OutreachEditor
          targetType="owner"
          record={selected.record}
          nextOfKin={selected.nextOfKin}
          initialMode={selected.mode}
          initialNextOfKinIndex={selected.nextOfKinIndex}
          recipientEmail={selected.recipientEmail}
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
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] || styles.new}`}>
      {status || "new"}
    </span>
  );
}