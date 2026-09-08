import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Key, Plus, Copy, RefreshCw, Trash2, Shield, AlertCircle, Check, Loader2, X,
  Brain, MessageSquare, Globe, Pencil, Zap, ArrowRight, Code2, Activity
} from "lucide-react";

const SYSTEM_ICONS = {
  vision_cortex: Brain,
  xtreme_comms: MessageSquare,
  cloud_browser: Globe,
};

const SYSTEM_COLORS = {
  vision_cortex: { border: "border-violet-200", bg: "bg-violet-50", text: "text-violet-700", icon: "text-violet-600" },
  xtreme_comms: { border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-600" },
  cloud_browser: { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-600" },
};

export default function AdminApiGenerator() {
  const [keys, setKeys] = useState([]);
  const [presets, setPresets] = useState({ system_connectors: [], platform_scopes: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("system");
  const [showCreate, setShowCreate] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDesc, setNewKeyDesc] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState(["properties:read"]);
  const [newKeyType, setNewKeyType] = useState("general");
  const [createdKey, setCreatedKey] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [keysRes, presetsRes] = await Promise.all([
        base44.functions.invoke("manageApiKeys", { action: "list" }),
        base44.functions.invoke("manageApiKeys", { action: "presets" }),
      ]);
      setKeys(keysRes.data.keys || []);
      setPresets(presetsRes.data || { system_connectors: [], platform_scopes: [] });
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const generateKey = async () => {
    if (!newKeyName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("manageApiKeys", {
        action: "generate",
        name: newKeyName.trim(),
        description: newKeyDesc.trim(),
        scopes: newKeyScopes,
        system_type: newKeyType,
      });
      setCreatedKey(res.data);
      setNewKeyName("");
      setNewKeyDesc("");
      setNewKeyScopes(["properties:read"]);
      setNewKeyType("general");
      setShowCreate(false);
      loadData();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const createSystemKey = async (preset) => {
    setBusy(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("manageApiKeys", {
        action: "generate",
        name: preset.name,
        description: preset.description,
        scopes: preset.scopes,
        system_type: preset.system_type,
      });
      setCreatedKey(res.data);
      loadData();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const updateKey = async () => {
    if (!editingKey || !editingKey.name?.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await base44.functions.invoke("manageApiKeys", {
        action: "update",
        key_id: editingKey.id,
        name: editingKey.name,
        description: editingKey.description || "",
        scopes: editingKey.scopes,
      });
      setEditingKey(null);
      loadData();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const rollKey = async (id) => {
    if (!confirm("Roll this key? The old key stops working immediately and a new one is generated.")) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke("manageApiKeys", { action: "roll", key_id: id });
      setCreatedKey(res.data);
      loadData();
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
      loadData();
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
      loadData();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleScope = (scope) => {
    setNewKeyScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
  };

  const toggleEditScope = (scope) => {
    setEditingKey(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope) ? prev.scopes.filter(s => s !== scope) : [...prev.scopes, scope],
    }));
  };

  const systemKeys = keys.filter(k => k.system_type && k.system_type !== "general");
  const generalKeys = keys.filter(k => !k.system_type || k.system_type === "general");

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-black/60" />
            <h2 className="font-display text-xl">API Key Generator</h2>
          </div>
          <p className="mt-1 text-xs text-black/50">
            Generate scoped API keys to connect external systems to Hidden Property Intel — with special bi-directional connectors for Vision Cortex, Xtreme Comms, and Cloud Browser.
          </p>
        </div>
        <button
          onClick={() => { setNewKeyType("general"); setNewKeyScopes(["properties:read"]); setShowCreate(true); }}
          className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white hover:bg-black/80"
        >
          <Plus className="h-3.5 w-3.5" /> Custom Key
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
              onClick={() => copyText(createdKey.key, "new")}
              className="inline-flex items-center gap-1.5 rounded-sm bg-amber-600 px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-white hover:bg-amber-700"
            >
              {copiedId === "new" ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-[10px] text-amber-700">
            <span>Prefix: <code className="font-mono">{createdKey.key_prefix}…</code></span>
            <span>System: <strong>{createdKey.system_type || "general"}</strong></span>
            <span>Scopes: {createdKey.scopes?.join(", ")}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex items-center gap-1 rounded-sm border border-black/10 p-1 w-fit">
        <button onClick={() => setTab("system")} className={`rounded-sm px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] ${tab === "system" ? "bg-black text-white" : "text-black/50"}`}>System Connectors</button>
        <button onClick={() => setTab("keys")} className={`rounded-sm px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] ${tab === "keys" ? "bg-black text-white" : "text-black/50"}`}>All Keys ({keys.length})</button>
      </div>

      {/* System Connectors Tab */}
      {tab === "system" && (
        <div className="mt-5 space-y-8">
          {/* Special system connector cards */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-black/40 mb-3">Bi-Directional System Connectors</p>
            <div className="grid gap-4 lg:grid-cols-3">
              {presets.system_connectors.map((preset) => {
                const Icon = SYSTEM_ICONS[preset.system_type] || Zap;
                const colors = SYSTEM_COLORS[preset.system_type] || { border: "border-black/10", bg: "bg-black/[0.02]", text: "text-black/70", icon: "text-black/60" };
                const existing = systemKeys.filter(k => k.system_type === preset.system_type && k.status === "active");
                return (
                  <div key={preset.system_type} className={`rounded-sm border-2 ${colors.border} ${colors.bg} p-5 flex flex-col`}>
                    <div className="flex items-center gap-2">
                      <div className={`rounded-sm p-2 ${colors.bg} ${colors.icon}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-display text-sm font-medium">{preset.name.split(" — ")[0]}</p>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-black/40">{preset.name.split(" — ")[1]}</p>
                      </div>
                      {existing.length > 0 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-emerald-700">
                          {existing.length} active
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed text-black/55">{preset.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {preset.scopes.map(s => (
                        <span key={s} className="rounded-full bg-white border border-black/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-black/50">{s}</span>
                      ))}
                    </div>
                    <div className="mt-3 border-t border-black/10 pt-3">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-black/40 mb-1.5">Capabilities</p>
                      <ul className="space-y-1">
                        {preset.capabilities.slice(0, 5).map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[10px] text-black/55">
                            <Check className="h-3 w-3 mt-0.5 shrink-0 text-emerald-500" /> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-3 border-t border-black/10 pt-3">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-black/40 mb-1.5">Endpoints</p>
                      <div className="space-y-0.5">
                        {preset.endpoints.slice(0, 4).map((e, i) => (
                          <code key={i} className="block font-mono text-[9px] text-black/40 truncate">{e}</code>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => createSystemKey(preset)}
                      disabled={busy}
                      className={`mt-4 inline-flex items-center justify-center gap-2 rounded-sm bg-black px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white hover:bg-black/80 disabled:opacity-50`}
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Key className="h-3.5 w-3.5" /> Generate Connector Key</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active system connector keys */}
          {systemKeys.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/40 mb-3">Active System Connector Keys</p>
              <div className="space-y-2">
                {systemKeys.map(k => {
                  const Icon = SYSTEM_ICONS[k.system_type] || Zap;
                  const colors = SYSTEM_COLORS[k.system_type] || {};
                  return (
                    <div key={k.id} className={`rounded-sm border ${colors.border || "border-black/10"} bg-white p-4 flex items-center gap-4`}>
                      <div className={`rounded-sm p-2 ${colors.bg || "bg-black/[0.02]"} ${colors.icon || "text-black/60"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{k.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <code className="font-mono text-[10px] text-black/40">{k.key_prefix}…</code>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] ${
                            k.status === "active" ? "bg-emerald-100 text-emerald-700" :
                            k.status === "rolled" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>{k.status}</span>
                          <span className="text-[10px] text-black/40">{k.request_count || 0} requests</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => copyText(k.key_prefix, k.id)} title="Copy prefix" className="rounded-sm p-1.5 text-black/40 hover:bg-black/5 hover:text-black">
                          {copiedId === k.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => setEditingKey({ ...k })} title="Edit" className="rounded-sm p-1.5 text-black/40 hover:bg-blue-50 hover:text-blue-600">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => rollKey(k.id)} disabled={k.status !== "active" || busy} title="Roll" className="rounded-sm p-1.5 text-black/40 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-30">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => revokeKey(k.id)} disabled={k.status !== "active" || busy} title="Revoke" className="rounded-sm p-1.5 text-black/40 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-30">
                          <Shield className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteKey(k.id)} disabled={busy} title="Delete" className="rounded-sm p-1.5 text-black/40 hover:bg-red-50 hover:text-red-600 disabled:opacity-30">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Keys Tab */}
      {tab === "keys" && (
        <div className="mt-5">
          {/* Quick scope chips */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {presets.platform_scopes?.map(s => (
              <span key={s.scope} className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-black/50" title={s.description}>
                {s.label}
              </span>
            ))}
          </div>

          <div className="overflow-hidden rounded-sm border border-black/10">
            <table className="w-full">
              <thead className="border-b border-black/10 bg-black/[0.02]">
                <tr>
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Name</th>
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Prefix</th>
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Type</th>
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Scopes</th>
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Status</th>
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Used</th>
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.2em] text-black/40">Reqs</th>
                  <th className="px-4 py-3 text-right text-[9px] uppercase tracking-[0.2em] text-black/40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-xs text-black/40">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td></tr>
                ) : keys.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-xs text-black/40">
                    No API keys yet. Generate a system connector key above or create a custom key.
                  </td></tr>
                ) : keys.map(k => (
                  <tr key={k.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.01]">
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium">{k.name}</p>
                      {k.description && <p className="text-[10px] text-black/40 truncate max-w-[200px]">{k.description}</p>}
                    </td>
                    <td className="px-4 py-3.5"><code className="font-mono text-xs text-black/60">{k.key_prefix}…</code></td>
                    <td className="px-4 py-3.5">
                      {k.system_type && k.system_type !== "general" ? (
                        <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${SYSTEM_COLORS[k.system_type]?.text || "text-black/50"}`}>
                          {k.system_type.replace("_", " ")}
                        </span>
                      ) : (
                        <span className="text-[10px] text-black/30">general</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(k.scopes || []).slice(0, 3).map(s => (
                          <span key={s} className="rounded-full bg-black/5 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-black/50">{s}</span>
                        ))}
                        {(k.scopes || []).length > 3 && <span className="text-[9px] text-black/30">+{(k.scopes || []).length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.15em] ${
                        k.status === "active" ? "bg-emerald-100 text-emerald-700" :
                        k.status === "rolled" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>{k.status}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-black/50">
                      {k.last_used ? new Date(k.last_used).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-black/50">{k.request_count || 0}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => copyText(k.key_prefix, k.id)} title="Copy prefix" className="rounded-sm p-1.5 text-black/40 hover:bg-black/5 hover:text-black">
                          {copiedId === k.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => setEditingKey({ ...k })} title="Edit" className="rounded-sm p-1.5 text-black/40 hover:bg-blue-50 hover:text-blue-600">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => rollKey(k.id)} disabled={k.status !== "active" || busy} title="Roll" className="rounded-sm p-1.5 text-black/40 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-30">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => revokeKey(k.id)} disabled={k.status !== "active" || busy} title="Revoke" className="rounded-sm p-1.5 text-black/40 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-30">
                          <Shield className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteKey(k.id)} disabled={busy} title="Delete" className="rounded-sm p-1.5 text-black/40 hover:bg-red-50 hover:text-red-600 disabled:opacity-30">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create custom key modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg rounded-lg border border-black/10 bg-white p-6 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-display text-base">Create Custom API Key</p>
              <button onClick={() => setShowCreate(false)} className="text-black/40 hover:text-black"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Key Name</label>
                <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="e.g. External CRM Sync — Read Only" className="mt-1.5 w-full rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Description (optional)</label>
                <input value={newKeyDesc} onChange={e => setNewKeyDesc(e.target.value)} placeholder="What system does this key connect to?" className="mt-1.5 w-full rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Scopes — select what this key can access</label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 max-h-48 overflow-auto">
                  {presets.platform_scopes?.map(s => (
                    <button
                      key={s.scope}
                      onClick={() => toggleScope(s.scope)}
                      title={s.description}
                      className={`flex items-center gap-2 rounded-sm border px-2.5 py-2 text-left transition ${
                        newKeyScopes.includes(s.scope) ? "border-black bg-black/[0.03]" : "border-black/15 hover:bg-black/[0.02]"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border ${newKeyScopes.includes(s.scope) ? "bg-black border-black" : "border-black/30"}`}>
                        {newKeyScopes.includes(s.scope) && <Check className="w-3 h-3 text-white m-px" />}
                      </div>
                      <div>
                        <p className="text-[11px] font-medium">{s.label}</p>
                        <p className="text-[9px] text-black/40 truncate">{s.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="rounded-sm border border-black/15 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-black/60 hover:bg-black/5">Cancel</button>
                <button onClick={generateKey} disabled={!newKeyName.trim() || busy} className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white disabled:opacity-50">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />} Generate Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit key modal */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditingKey(null)}>
          <div className="w-full max-w-lg rounded-lg border border-black/10 bg-white p-6 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-black/60" />
                <p className="font-display text-base">Edit API Key</p>
              </div>
              <button onClick={() => setEditingKey(null)} className="text-black/40 hover:text-black"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Key Name</label>
                <input value={editingKey.name || ""} onChange={e => setEditingKey({ ...editingKey, name: e.target.value })} className="mt-1.5 w-full rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Description</label>
                <input value={editingKey.description || ""} onChange={e => setEditingKey({ ...editingKey, description: e.target.value })} className="mt-1.5 w-full rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Scopes</label>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 max-h-48 overflow-auto">
                  {presets.platform_scopes?.map(s => (
                    <button
                      key={s.scope}
                      onClick={() => toggleEditScope(s.scope)}
                      title={s.description}
                      className={`flex items-center gap-2 rounded-sm border px-2.5 py-2 text-left transition ${
                        (editingKey.scopes || []).includes(s.scope) ? "border-black bg-black/[0.03]" : "border-black/15 hover:bg-black/[0.02]"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border ${(editingKey.scopes || []).includes(s.scope) ? "bg-black border-black" : "border-black/30"}`}>
                        {(editingKey.scopes || []).includes(s.scope) && <Check className="w-3 h-3 text-white m-px" />}
                      </div>
                      <div>
                        <p className="text-[11px] font-medium">{s.label}</p>
                        <p className="text-[9px] text-black/40 truncate">{s.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditingKey(null)} className="rounded-sm border border-black/15 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-black/60 hover:bg-black/5">Cancel</button>
                <button onClick={updateKey} disabled={!editingKey.name?.trim() || busy} className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white disabled:opacity-50">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="mt-6 flex items-start gap-2 rounded-sm border border-black/10 bg-black/[0.02] px-4 py-3">
        <Code2 className="h-4 w-4 shrink-0 text-black/40 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-black/50">
          API keys are hashed with SHA-256 — the raw key is shown only once at creation. Use the system connector presets to give external AI systems bi-directional access to operate and help each other. Roll a key to replace it without downtime; revoke to disable immediately.
        </p>
      </div>
    </div>
  );
}