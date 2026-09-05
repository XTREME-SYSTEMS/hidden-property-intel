import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Phone, Upload, Search, Loader2, AlertCircle, Check, Database, ArrowRight } from "lucide-react";

export default function AdminNumbers() {
  const [tab, setTab] = useState("import");
  const [numbers, setNumbers] = useState([]);
  const [staged, setStaged] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [lookupResult, setLookupResult] = useState(null);
  const [loadingStaged, setLoadingStaged] = useState(true);

  const loadStaged = useCallback(async () => {
    setLoadingStaged(true);
    try {
      const list = await base44.entities.PhoneNumber.list('-created_date', 50);
      setStaged(list);
    } catch (e) {
      // entity may be empty — ignore
    }
    setLoadingStaged(false);
  }, []);

  useEffect(() => { loadStaged(); }, [loadStaged]);

  const handleImport = async () => {
    const parsed = numbers
      .split(/[\n,]/)
      .map(n => n.trim())
      .filter(Boolean);
    if (parsed.length === 0) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("provisionNumbers", {
        numbers: parsed,
        source: "manual"
      });
      setResult(res.data);
      loadStaged();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const handleLookup = async () => {
    const parsed = numbers
      .split(/[\n,]/)
      .map(n => n.trim())
      .filter(Boolean);
    if (parsed.length === 0) return;
    setBusy(true);
    setError(null);
    setLookupResult(null);
    try {
      const res = await base44.functions.invoke("lookupNumbers", {
        numbers: parsed
      });
      setLookupResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const statusColor = (status) => {
    const map = {
      sandbox: "bg-blue-100 text-blue-700",
      credentials_required: "bg-amber-100 text-amber-700",
      active: "bg-emerald-100 text-emerald-700",
      provisioned: "bg-emerald-100 text-emerald-700",
      failed: "bg-red-100 text-red-700",
      opted_out: "bg-gray-200 text-gray-600"
    };
    return map[status] || "bg-black/10 text-black/50";
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-black/60" />
            <h2 className="font-display text-xl">Number Import Gateway</h2>
          </div>
          <p className="mt-1 text-xs text-black/50">
            Bulk-import and validate phone numbers through the XTREME COMMUNICATIONS provisioning API.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-sm border border-black/10 p-1">
          <button
            onClick={() => setTab("import")}
            className={`rounded-sm px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] ${tab === "import" ? "bg-black text-white" : "text-black/50"}`}
          >Import</button>
          <button
            onClick={() => setTab("lookup")}
            className={`rounded-sm px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] ${tab === "lookup" ? "bg-black text-white" : "text-black/50"}`}
          >Lookup</button>
          <button
            onClick={() => setTab("staged")}
            className={`rounded-sm px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] ${tab === "staged" ? "bg-black text-white" : "text-black/50"}`}
          >Staged ({staged.length})</button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Import / Lookup tab */}
      {(tab === "import" || tab === "lookup") && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">
              {tab === "import" ? "Numbers to Import (one per line or comma-separated)" : "Numbers to Lookup"}
            </label>
            <textarea
              value={numbers}
              onChange={(e) => setNumbers(e.target.value)}
              placeholder={"+17728123930\n+13055551234\n5615550000"}
              className="mt-1.5 h-64 w-full resize-none rounded-sm border border-black/15 p-3 font-mono text-xs outline-none focus:border-black"
            />
            <div className="mt-3 flex items-center gap-2">
              {tab === "import" ? (
                <button
                  onClick={handleImport}
                  disabled={busy || !numbers.trim()}
                  className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Provision Numbers
                </button>
              ) : (
                <button
                  onClick={handleLookup}
                  disabled={busy || !numbers.trim()}
                  className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Run Lookup
                </button>
              )}
              <span className="text-[10px] text-black/40">
                {numbers.split(/[\n,]/).filter(n => n.trim()).length} numbers parsed
              </span>
            </div>
          </div>

          {/* Results */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Result</label>
            <div className="mt-1.5 h-64 overflow-y-auto rounded-sm border border-black/15 bg-black/[0.02] p-3">
              {tab === "import" && result && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-sm border border-black/10 bg-white p-2.5">
                      <p className="text-[9px] uppercase tracking-[0.15em] text-black/40">Total</p>
                      <p className="mt-1 font-display text-lg">{result.total}</p>
                    </div>
                    <div className="rounded-sm border border-black/10 bg-white p-2.5">
                      <p className="text-[9px] uppercase tracking-[0.15em] text-black/40">Imported</p>
                      <p className="mt-1 font-display text-lg text-emerald-600">{result.imported}</p>
                    </div>
                    <div className="rounded-sm border border-black/10 bg-white p-2.5">
                      <p className="text-[9px] uppercase tracking-[0.15em] text-black/40">Duplicates</p>
                      <p className="mt-1 font-display text-lg text-amber-600">{result.duplicates}</p>
                    </div>
                    <div className="rounded-sm border border-black/10 bg-white p-2.5">
                      <p className="text-[9px] uppercase tracking-[0.15em] text-black/40">Invalid</p>
                      <p className="mt-1 font-display text-lg text-red-600">{result.invalid}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Staged as <strong>{result.staged_as}</strong> — carrier credentials {result.carrier_configured ? "active" : "not configured (sandbox mode)"}
                  </div>
                  <div className="space-y-1">
                    {result.numbers?.slice(0, 20).map((n, i) => (
                      <div key={i} className="flex items-center justify-between rounded-sm border border-black/5 bg-white px-2.5 py-1.5 text-xs">
                        <code className="font-mono text-black/70">{n.number || n.raw}</code>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${
                          n.status === 'staged' ? 'bg-emerald-100 text-emerald-700' :
                          n.status === 'duplicate' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{n.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tab === "lookup" && lookupResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-sm border border-black/10 bg-white p-2.5">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <p className="text-xs text-black/60">
                      <strong>{lookupResult.valid}</strong> of {lookupResult.total} valid.
                      Carrier lookup {lookupResult.carrier_configured ? "available" : "staged (credentials required for carrier data)"}
                    </p>
                  </div>
                  {lookupResult.results?.map((r, i) => (
                    <div key={i} className="rounded-sm border border-black/5 bg-white p-2.5">
                      <div className="flex items-center justify-between">
                        <code className="font-mono text-xs text-black/70">{r.number || r.raw}</code>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${
                          r.valid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>{r.valid ? 'valid' : 'invalid'}</span>
                      </div>
                      {r.valid && (
                        <div className="mt-1.5 flex gap-3 text-[10px] text-black/50">
                          <span>Line: {r.line_type}</span>
                          <span>Country: {r.country_code}</span>
                          <span>Staged: {r.staged ? 'yes' : 'no'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {!result && !lookupResult && (
                <div className="flex h-full items-center justify-center text-xs text-black/30">
                  Results will appear here after running.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Staged numbers tab */}
      {tab === "staged" && (
        <div className="mt-5">
          {loadingStaged ? (
            <div className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-black/30" /></div>
          ) : staged.length === 0 ? (
            <div className="py-12 text-center text-sm text-black/40">
              <Database className="mx-auto mb-3 h-8 w-8 text-black/20" />
              No numbers staged yet. Import numbers to populate the database.
            </div>
          ) : (
            <div className="overflow-hidden rounded-sm border border-black/10">
              <table className="w-full">
                <thead className="border-b border-black/10 bg-black/[0.02]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Number</th>
                    <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Country</th>
                    <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Status</th>
                    <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Source</th>
                    <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Imported</th>
                  </tr>
                </thead>
                <tbody>
                  {staged.map(n => (
                    <tr key={n.id} className="border-b border-black/5 last:border-0">
                      <td className="px-4 py-3"><code className="font-mono text-xs">{n.number}</code></td>
                      <td className="px-4 py-3 text-xs text-black/60">{n.country_code}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.15em] ${statusColor(n.status)}`}>{n.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-black/50">{n.source}</td>
                      <td className="px-4 py-3 text-xs text-black/50">
                        {n.imported_at ? new Date(n.imported_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Gateway info */}
      <div className="mt-5 flex items-start gap-2 rounded-sm border border-black/10 bg-black/[0.02] px-4 py-3">
        <ArrowRight className="h-4 w-4 shrink-0 text-black/40 mt-0.5" />
        <div className="text-[11px] leading-relaxed text-black/50">
          <p>
            <strong>API Endpoints:</strong>{" "}
            <code className="font-mono text-black/70">POST /functions/provisionNumbers</code>{" | "}
            <code className="font-mono text-black/70">POST /functions/lookupNumbers</code>
          </p>
          <p className="mt-1">
            Numbers without configured carrier credentials are staged as <code className="font-mono">credentials_required</code> —
            they persist safely in the database without breaking the threading engine. When Twilio credentials are added,
            staged numbers automatically activate and carrier lookups enrich.
          </p>
        </div>
      </div>
    </div>
  );
}