import React, { useState, useEffect, useCallback } from "react";
import { Plus, Zap, Loader2, RefreshCw, ExternalLink, Blocks, Search, Filter, AlertTriangle, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SmartContractWalletPanel from "@/components/admin/SmartContractWalletPanel";
import SmartContractCreateModal from "@/components/admin/SmartContractCreateModal";
import SmartContractActionModal from "@/components/admin/SmartContractActionModal";

const STATUS_COLORS = {
  draft: "bg-blue-100 text-blue-700", deployed: "bg-amber-100 text-amber-700",
  signed: "bg-purple-100 text-purple-700", funded: "bg-indigo-100 text-indigo-700",
  closed: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-700",
};

export default function AdminSmartContracts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [automating, setAutomating] = useState(false);
  const [autoResult, setAutoResult] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getSmartContractDashboard", {});
      setData(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAutomate = async () => {
    setAutomating(true); setAutoResult(null);
    try {
      const res = await base44.functions.invoke("automateContractCreation", {});
      setAutoResult(res.data); load();
    } catch (e) { setAutoResult({ error: e.response?.data?.error || e.message }); }
    setAutomating(false);
  };

  const handleSyncAll = async () => {
    setSyncing(true); setSyncResult(null);
    try {
      const res = await base44.functions.invoke("syncAllContractStates", {});
      setSyncResult(res.data); load();
    } catch (e) { setSyncResult({ error: e.response?.data?.error || e.message }); }
    setSyncing(false);
  };

  const contracts = data?.contracts || [];
  const stats = data?.stats || {};
  const walletStatus = data?.walletStatus || { configured: false };

  // Filter contracts
  const filtered = contracts.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.property?.address?.toLowerCase().includes(q) ||
      c.investor?.name?.toLowerCase().includes(q) ||
      c.seller?.name?.toLowerCase().includes(q) ||
      c.contract_address?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Polygon Blockchain</p>
          <h1 className="mt-1 font-display text-2xl font-light">Smart Contract System</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSyncAll} disabled={syncing} className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-2 text-xs hover:bg-black hover:text-white disabled:opacity-50" title="Sync all contract states from Polygon">
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} {syncing ? "Syncing…" : "Sync All from Chain"}
          </button>
          <button onClick={handleAutomate} disabled={automating} className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-2 text-xs hover:bg-black hover:text-white disabled:opacity-50">
            {automating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} {automating ? "Automating…" : "Auto-Create from Deals"}
          </button>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 rounded-md bg-black px-4 py-2 text-xs text-white">
            <Plus className="h-3.5 w-3.5" /> Create Contract
          </button>
          <button onClick={load} disabled={loading} className="rounded-md border border-black/15 p-2 hover:bg-black hover:text-white disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {autoResult && (
        <div className={`mb-3 rounded-lg border p-3 text-xs ${autoResult.error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {autoResult.error ? autoResult.error : `Auto-created ${autoResult.created} contract(s) · ${autoResult.skipped} already had contracts · ${autoResult.errors} skipped`}
        </div>
      )}
      {syncResult && (
        <div className={`mb-3 rounded-lg border p-3 text-xs ${syncResult.error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {syncResult.error ? syncResult.error : `Chain sync complete: ${syncResult.synced} updated, ${syncResult.unchanged} unchanged, ${syncResult.errors} errors out of ${syncResult.total} contracts`}
        </div>
      )}

      {/* Wallet panel */}
      <div className="mb-5">
        <SmartContractWalletPanel walletStatus={walletStatus} onRefresh={load} />
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-6 gap-2">
        <StatCard label="Total" value={stats.total || 0} />
        <StatCard label="Draft" value={stats.draft || 0} color="text-blue-600" />
        <StatCard label="Deployed" value={stats.deployed || 0} color="text-amber-600" />
        <StatCard label="Signed" value={stats.signed || 0} color="text-purple-600" />
        <StatCard label="Funded" value={stats.funded || 0} color="text-indigo-600" />
        <StatCard label="Closed" value={stats.closed || 0} color="text-emerald-600" />
      </div>

      {/* Search & Filter */}
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by property, investor, seller, or contract address…" className="w-full rounded-md border border-black/15 py-2 pl-9 pr-3 text-xs" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-black/15 px-3 py-2 text-xs">
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="deployed">Deployed</option>
          <option value="signed">Signed</option>
          <option value="funded">Funded</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Contract table */}
      <div className="overflow-hidden rounded-lg border border-black/10">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-black/40">
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Investor → Seller</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">On-Chain</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {loading && !data ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-black/40"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-black/40">{contracts.length === 0 ? "No smart contracts yet. Click \"Create Contract\" or \"Auto-Create from Deals\" to get started." : "No contracts match your search."}</td></tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="text-xs hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {c.property ? <div><p className="font-medium">{c.property.address}</p><p className="text-[10px] text-black/40">{c.property.city}, {c.property.state}</p></div> : <span className="text-black/40">No property</span>}
                  </td>
                  <td className="px-4 py-3"><p>{c.investor?.name || "Unknown"}</p><p className="text-[10px] text-black/40">→ {c.seller?.name || "Unknown"}</p></td>
                  <td className="px-4 py-3 capitalize">{c.contract_type}</td>
                  <td className="px-4 py-3">{c.terms?.price ? `$${Number(c.terms.price).toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-700"}`}>{c.status}</span></td>
                  <td className="px-4 py-3">
                    {c.contract_address ? (
                      <a href={`https://polygonscan.com/address/${c.contract_address}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline"><ExternalLink className="h-3 w-3" /> {c.contract_address.slice(0, 8)}…</a>
                    ) : <span className="text-[10px] text-black/30">Not deployed</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelected(c)} className="inline-flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-[11px] text-white hover:bg-black/80"><Blocks className="h-3 w-3" /> Manage</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && <SmartContractCreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {selected && <SmartContractActionModal contract={selected} onClose={() => setSelected(null)} onRefresh={load} />}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return <div className="rounded-lg border border-black/10 bg-white p-3"><p className="text-[10px] uppercase tracking-[0.2em] text-black/40">{label}</p><p className={`mt-1 text-xl font-medium ${color || ""}`}>{value}</p></div>;
}