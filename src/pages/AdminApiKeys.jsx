import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Key, Plus, Copy, RefreshCw, Trash2, Shield, AlertCircle, Check, Loader2, X } from "lucide-react";

const SCOPES = ["lookups", "provisioning", "numbers:read", "numbers:write", "admin"];

export default function AdminApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState(["lookups", "numbers:read"]);
  const [createdKey, setCreatedKey] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("manageApiKeys", { action: "list" });
      setKeys(res.data.keys || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const generateKey = async () => {
    if (!newKeyName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("manageApiKeys", {
        action: "generate",
        name: newKeyName.trim(),
        scopes: newKeyScopes
      });
      setCreatedKey(res.data);
      setNewKeyName("");
      setNewKeyScopes(["lookups", "numbers:read"]);
      setShowCreate(false);
      loadKeys();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const rollKey = async (id) => {
    if (!confirm("Roll this key? The old key will stop working immediately and a new one will be generated.")) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke("manageApiKeys", { action: "roll", key_id: id });
      setCreatedKey(res.data);
      loadKeys();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const revokeKey = async (id) => {
    if (!confirm("Revoke this key? It will stop working immediately.")) return;
    setBusy(true);
    try {
      await base44.functions.invoke("manageApiKeys", { action: "revoke", key_id: id });
      loadKeys();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const deleteKey = async (id) => {
    if (!confirm("Permanently delete this key? This cannot be undone.")) return;
    setBusy(true);
    try {
      await base44.functions.invoke("manageApiKeys", { action: "delete", key_id: id });
      loadKeys();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleScope = (scope) => {
    setNewKeyScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-black/60" />
            <h2 className="font-display text-xl">API Key Management</h2>
          </div>
          <p className="mt-1 text-xs text-black/50">
            Generate, roll, and revoke live multi-tenant authentication tokens for the XTREME COMMUNICATIONS gateway.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white hover:bg-black/80"
        >
          <Plus className="h-3.5 w-3.5" /> Generate Key
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Created key reveal */}
      {createdKey && (
        <div className="mt-4 rounded-sm border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              <p className="font-display text-sm font-medium text-amber-900">
                {createdKey.message || "Save this key now — it will not be shown again."}
              </p>
            </div>
            <button onClick={() => setCreatedKey(null)} className="text-amber-700 hover:text-amber-900">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-sm border border-amber-300 bg-white px-3 py-2.5">
            <code className="flex-1 font-mono text-xs text-amber-900 break-all">{createdKey.key}</code>
            <button
              onClick={() => copyKey(createdKey.key)}
              className="inline-flex items-center gap-1.5 rounded-sm bg-amber-600 px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-white hover:bg-amber-700"
            >
              {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
            </button>
          </div>
          <div className="mt-2 flex gap-4 text-[10px] text-amber-700">
            <span>Prefix: <code className="font-mono">{createdKey.key_prefix}…</code></span>
            <span>Scopes: {createdKey.scopes?.join(", ")}</span>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="mt-4 rounded-sm border border-black/10 bg-black/[0.02] p-5">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm">New API Key</p>
            <button onClick={() => setShowCreate(false)} className="text-black/40 hover:text-black">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Key Name</label>
              <input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production Gateway — Lead Import"
                className="mt-1.5 w-full rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Scopes</label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {SCOPES.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleScope(s)}
                    className={`rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] transition ${
                      newKeyScopes.includes(s)
                        ? "bg-black text-white"
                        : "border border-black/15 text-black/60 hover:bg-black/5"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-sm border border-black/15 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-black/60 hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                onClick={generateKey}
                disabled={!newKeyName.trim() || busy}
                className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />} Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keys table */}
      <div className="mt-6 overflow-hidden rounded-sm border border-black/10">
        <table className="w-full">
          <thead className="border-b border-black/10 bg-black/[0.02]">
            <tr>
              <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Name</th>
              <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Key Prefix</th>
              <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Scopes</th>
              <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Status</th>
              <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Last Used</th>
              <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Requests</th>
              <th className="px-4 py-3 text-right text-[9px] uppercase tracking-[0.2em] text-black/40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-xs text-black/40">
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              </td></tr>
            ) : keys.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-xs text-black/40">
                No API keys yet. Generate your first key to begin importing numbers.
              </td></tr>
            ) : keys.map(k => (
              <tr key={k.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3.5 text-sm font-medium">{k.name}</td>
                <td className="px-4 py-3.5"><code className="font-mono text-xs text-black/60">{k.key_prefix}…</code></td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {(k.scopes || []).map(s => (
                      <span key={s} className="rounded-full bg-black/5 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-black/50">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.15em] ${
                    k.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    k.status === 'rolled' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>{k.status}</span>
                </td>
                <td className="px-4 py-3.5 text-xs text-black/50">
                  {k.last_used ? new Date(k.last_used).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3.5 text-xs text-black/50">{k.request_count || 0}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => rollKey(k.id)}
                      disabled={k.status !== 'active' || busy}
                      title="Roll key"
                      className="rounded-sm p-1.5 text-black/40 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-30"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => revokeKey(k.id)}
                      disabled={k.status !== 'active' || busy}
                      title="Revoke"
                      className="rounded-sm p-1.5 text-black/40 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-30"
                    >
                      <Shield className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteKey(k.id)}
                      disabled={busy}
                      title="Delete"
                      className="rounded-sm p-1.5 text-black/40 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info note */}
      <div className="mt-4 flex items-start gap-2 rounded-sm border border-black/10 bg-black/[0.02] px-4 py-3">
        <AlertCircle className="h-4 w-4 shrink-0 text-black/40 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-black/50">
          API keys authenticate requests to <code className="font-mono text-black/70">/v1/lookups</code> and <code className="font-mono text-black/70">/v1/numbers/provision</code>.
          Keys are hashed with SHA-256 — the raw key is shown only once at creation. Roll a key to replace it without downtime; revoke to disable immediately.
        </p>
      </div>
    </div>
  );
}