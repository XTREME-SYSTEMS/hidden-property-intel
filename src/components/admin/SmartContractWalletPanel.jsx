import React, { useState } from "react";
import { Wallet, Plus, KeyRound, Copy, Check, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SmartContractWalletPanel({ walletStatus, onRefresh }) {
  const [generating, setGenerating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [importKey, setImportKey] = useState("");
  const [importRpc, setImportRpc] = useState("https://polygon-rpc.com");
  const [importResult, setImportResult] = useState(null);
  const [copied, setCopied] = useState("");

  const generate = async () => {
    setGenerating(true);
    setGenResult(null);
    try {
      const res = await base44.functions.invoke("generateWallet", {});
      setGenResult(res.data);
    } catch (e) {
      setGenResult({ error: e.response?.data?.error || e.message });
    }
    setGenerating(false);
  };

  const doImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await base44.functions.invoke("importWallet", { private_key: importKey, rpc_url: importRpc });
      setImportResult(res.data);
    } catch (e) {
      setImportResult({ error: e.response?.data?.error || e.message });
    }
    setImporting(false);
  };

  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const configured = walletStatus?.configured && !walletStatus?.error;

  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0c0d0e]">
            <Wallet className="h-5 w-5 text-[#e4b653]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Polygon Wallet</p>
            {configured ? (
              <p className="font-mono text-sm font-medium">{walletStatus.address?.slice(0, 10)}…{walletStatus.address?.slice(-8)}</p>
            ) : (
              <p className="text-sm font-medium text-black/60">Not configured</p>
            )}
          </div>
        </div>
        {configured ? (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Balance</p>
              <p className="text-sm font-medium">{parseFloat(walletStatus.balance || "0").toFixed(4)} MATIC</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Network</p>
              <p className="text-sm font-medium capitalize">{walletStatus.network}</p>
            </div>
            <a href={`https://polygonscan.com/address/${walletStatus.address}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-black/15 px-3 py-2 text-xs hover:bg-black hover:text-white">
              <ExternalLink className="h-3.5 w-3.5" /> Explorer
            </a>
            <button onClick={generate} disabled={generating} className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-2 text-xs hover:bg-black hover:text-white disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" /> {generating ? "Generating…" : "New Wallet"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={generate} disabled={generating} className="inline-flex items-center gap-1.5 rounded-md bg-black px-4 py-2 text-xs text-white disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" /> {generating ? "Generating…" : "Generate Wallet"}
            </button>
            <button onClick={() => setShowImport(!showImport)} className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-4 py-2 text-xs hover:bg-black hover:text-white">
              <KeyRound className="h-3.5 w-3.5" /> Import
            </button>
          </div>
        )}
      </div>

      {walletStatus?.error && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5" /> {walletStatus.error}
        </div>
      )}

      {/* Generate result */}
      {genResult && !genResult.error && (
        <div className="mt-4 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
            <Check className="h-4 w-4" /> Wallet generated — save these credentials!
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Wallet Address</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 rounded bg-white px-3 py-2 text-xs">{genResult.address}</code>
              <button onClick={() => copy(genResult.address, "addr")} className="rounded border border-black/15 p-2 hover:bg-black hover:text-white">
                {copied === "addr" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Private Key — save to Settings → Secrets as POLYGON_PRIVATE_KEY</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 rounded bg-white px-3 py-2 text-xs break-all">{genResult.privateKey}</code>
              <button onClick={() => copy(genResult.privateKey, "pk")} className="rounded border border-black/15 p-2 hover:bg-black hover:text-white">
                {copied === "pk" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          {genResult.mnemonic && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Mnemonic (recovery phrase)</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded bg-white px-3 py-2 text-xs break-all">{genResult.mnemonic}</code>
                <button onClick={() => copy(genResult.mnemonic, "mn")} className="rounded border border-black/15 p-2 hover:bg-black hover:text-white">
                  {copied === "mn" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Go to <strong>Settings → Secrets</strong>, add <code className="bg-amber-100 px-1 rounded">POLYGON_PRIVATE_KEY</code> and <code className="bg-amber-100 px-1 rounded">POLYGON_RPC_URL</code> (use https://polygon-rpc.com), then click refresh.</span>
          </div>
          <button onClick={onRefresh} className="rounded-md bg-black px-4 py-2 text-xs text-white">I've saved the secrets — Refresh</button>
        </div>
      )}
      {genResult?.error && (
        <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{genResult.error}</div>
      )}

      {/* Import form */}
      {showImport && !configured && (
        <div className="mt-4 space-y-3 rounded-lg border border-black/10 bg-gray-50 p-4">
          <p className="text-sm font-medium">Import existing wallet</p>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">Private Key</label>
            <input type="password" value={importKey} onChange={(e) => setImportKey(e.target.value)} className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-xs" placeholder="0x..." />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-black/40">RPC URL</label>
            <input value={importRpc} onChange={(e) => setImportRpc(e.target.value)} className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-xs" />
          </div>
          <button onClick={doImport} disabled={importing || !importKey} className="inline-flex items-center gap-1.5 rounded-md bg-black px-4 py-2 text-xs text-white disabled:opacity-50">
            {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />} {importing ? "Validating…" : "Validate & Show Address"}
          </button>
          {importResult && !importResult.error && (
            <div className="space-y-2 rounded-md bg-emerald-50 p-3 text-xs">
              <p className="font-medium text-emerald-800">Valid wallet — address: {importResult.address}</p>
              {importResult.balance !== null && <p>Balance: {parseFloat(importResult.balance).toFixed(4)} MATIC ({importResult.network})</p>}
              <p className="text-amber-700">Save this private key to <strong>Settings → Secrets</strong> as <code className="bg-amber-100 px-1 rounded">POLYGON_PRIVATE_KEY</code> and the RPC URL as <code className="bg-amber-100 px-1 rounded">POLYGON_RPC_URL</code>, then refresh.</p>
              <button onClick={onRefresh} className="rounded-md bg-black px-4 py-2 text-xs text-white">I've saved — Refresh</button>
            </div>
          )}
          {importResult?.error && <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{importResult.error}</div>}
        </div>
      )}
    </div>
  );
}