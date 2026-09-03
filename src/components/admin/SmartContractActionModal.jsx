import React, { useState } from "react";
import { X, Loader2, Rocket, FileText, Send, FileCode2, ExternalLink, Check, AlertTriangle, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_COLORS = {
  draft: "bg-blue-100 text-blue-700", deployed: "bg-amber-100 text-amber-700",
  signed: "bg-purple-100 text-purple-700", funded: "bg-indigo-100 text-indigo-700",
  closed: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-700",
};

export default function SmartContractActionModal({ contract, onClose, onRefresh }) {
  const [tab, setTab] = useState(contract?.contract_address ? "documents" : "deploy");
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState(null);
  const [genDocs, setGenDocs] = useState(false);
  const [docResult, setDocResult] = useState(null);
  const [activeDoc, setActiveDoc] = useState(null);
  const [interacting, setInteracting] = useState(null);
  const [interactResult, setInteractResult] = useState(null);
  const [chainState, setChainState] = useState(null);

  const deploy = async () => {
    setDeploying(true); setDeployResult(null);
    try {
      const res = await base44.functions.invoke("deploySmartContract", { smart_contract_id: contract.id });
      setDeployResult(res.data);
      onRefresh();
    } catch (e) { setDeployResult({ error: e.response?.data?.error || e.message }); }
    setDeploying(false);
  };

  const genDocuments = async () => {
    setGenDocs(true); setDocResult(null);
    try {
      const res = await base44.functions.invoke("generateContractDocuments", { smart_contract_id: contract.id });
      setDocResult(res.data);
      onRefresh();
    } catch (e) { setDocResult({ error: e.response?.data?.error || e.message }); }
    setGenDocs(false);
  };

  const interact = async (action, extra = {}) => {
    setInteracting(action); setInteractResult(null);
    try {
      const res = await base44.functions.invoke("interactWithContract", { smart_contract_id: contract.id, action, ...extra });
      setInteractResult(res.data);
      if (action === "get_state") setChainState(res.data);
      onRefresh();
    } catch (e) { setInteractResult({ error: e.response?.data?.error || e.message }); }
    setInteracting(null);
  };

  const downloadDoc = (doc) => {
    const blob = new Blob([doc.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${doc.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "deploy", label: "Deploy", icon: Rocket, show: !contract.contract_address },
    { id: "documents", label: "Documents", icon: FileText, show: true },
    { id: "interact", label: "Interact", icon: Send, show: !!contract.contract_address },
    { id: "source", label: "Source", icon: FileCode2, show: true },
  ].filter((t) => t.show);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-3">
          <div>
            <h2 className="text-sm font-medium">Smart Contract — {contract.contract_type}</h2>
            <p className="text-xs text-black/50">{contract.property?.address || "No property"} · {contract.investor?.name || "Unknown"} → {contract.seller?.name || "Unknown"}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${STATUS_COLORS[contract.status] || "bg-gray-100 text-gray-700"}`}>{contract.status}</span>
            <button onClick={onClose} className="rounded-md p-1.5 hover:bg-black/5"><X className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-black/10 px-5">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs ${tab === t.id ? "border-black text-black" : "border-transparent text-black/40 hover:text-black"}`}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Deploy Tab */}
          {tab === "deploy" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <Stat label="Price" value={contract.terms?.price ? `$${Number(contract.terms.price).toLocaleString()}` : "—"} />
                <Stat label="Earnest" value={contract.terms?.earnest_money ? `$${Number(contract.terms.earnest_money).toLocaleString()}` : "—"} />
                <Stat label="Closing" value={contract.terms?.closing_date || "—"} />
                <Stat label="Chain" value="Polygon" />
              </div>
              <div className="rounded-lg border border-black/10 bg-gray-50 p-4">
                <p className="text-xs text-black/60">This will compile the escrow contract and deploy it to the Polygon blockchain. The deployer wallet (configured in Secrets) will pay gas fees.</p>
                <button onClick={deploy} disabled={deploying} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-black px-4 py-2 text-xs text-white disabled:opacity-50">
                  {deploying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />} {deploying ? "Deploying to Polygon…" : "Deploy to Polygon"}
                </button>
              </div>
              {deployResult && !deployResult.error && (
                <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs">
                  <p className="flex items-center gap-2 font-medium text-emerald-800"><Check className="h-4 w-4" /> Deployed successfully!</p>
                  <p><strong>Address:</strong> <code className="break-all">{deployResult.address}</code></p>
                  <p><strong>TX Hash:</strong> <code className="break-all">{deployResult.txHash}</code></p>
                  <a href={deployResult.explorer} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-700 underline"><ExternalLink className="h-3 w-3" /> View on Polygonscan</a>
                </div>
              )}
              {deployResult?.error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {deployResult.error}
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {tab === "documents" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-black/60">AI generates purchase agreement, escrow instructions, disclosure, closing statement, and warranty deed.</p>
                <button onClick={genDocuments} disabled={genDocs} className="inline-flex items-center gap-1.5 rounded-md bg-black px-4 py-2 text-xs text-white disabled:opacity-50">
                  {genDocs ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} {genDocs ? "AI generating…" : "Generate All Documents"}
                </button>
              </div>
              {docResult?.error && <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{docResult.error}</div>}
              {contract.documents?.length > 0 ? (
                <div className="space-y-2">
                  {contract.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-black/10 p-3">
                      <div>
                        <p className="text-sm font-medium">{doc.title}</p>
                        <p className="text-[10px] text-black/40">{doc.type} · {new Date(doc.generated_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setActiveDoc(activeDoc === i ? null : i)} className="rounded-md border border-black/15 px-3 py-1.5 text-xs hover:bg-black hover:text-white">View</button>
                        <button onClick={() => downloadDoc(doc)} className="rounded-md border border-black/15 p-1.5 hover:bg-black hover:text-white"><Download className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-black/40">No documents yet. Click "Generate All Documents" to create them with AI.</p>
              )}
              {activeDoc !== null && contract.documents?.[activeDoc] && (
                <pre className="max-h-80 overflow-auto rounded-lg bg-gray-900 p-4 text-[11px] leading-relaxed text-white/90 whitespace-pre-wrap">{contract.documents[activeDoc].content}</pre>
              )}
            </div>
          )}

          {/* Interact Tab */}
          {tab === "interact" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-black/60">On-chain contract interactions. The deployer wallet executes these transactions.</p>
                <button onClick={() => interact("get_state")} disabled={interacting === "get_state"} className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-2 text-xs hover:bg-black hover:text-white disabled:opacity-50">
                  {interacting === "get_state" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Sync from Chain
                </button>
              </div>
              {chainState && (
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-black/10 bg-gray-50 p-3 text-xs">
                  <div><p className="text-[10px] text-black/40">State</p><p className="font-medium">{["Awaiting", "Signed", "Funded", "Closed", "Refunded"][chainState.state]}</p></div>
                  <div><p className="text-[10px] text-black/40">Buyer Signed</p><p className="font-medium">{chainState.buyerSigned ? "✓" : "—"}</p></div>
                  <div><p className="text-[10px] text-black/40">Seller Signed</p><p className="font-medium">{chainState.sellerSigned ? "✓" : "—"}</p></div>
                  <div><p className="text-[10px] text-black/40">Inspection</p><p className="font-medium">{chainState.inspectionPassed ? "Passed" : "Pending"}</p></div>
                  <div><p className="text-[10px] text-black/40">Balance</p><p className="font-medium">{parseFloat(chainState.balance || "0").toFixed(4)} MATIC</p></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <ActionBtn label="Sign as Buyer" onClick={() => interact("sign_buyer")} loading={interacting === "sign_buyer"} disabled={contract.status === "signed" || contract.status === "closed"} />
                <ActionBtn label="Sign as Seller" onClick={() => interact("sign_seller")} loading={interacting === "sign_seller"} disabled={contract.status === "signed" || contract.status === "closed"} />
                <ActionBtn label="Deposit Earnest Money" onClick={() => interact("deposit_earnest")} loading={interacting === "deposit_earnest"} disabled={contract.status !== "signed"} />
                <ActionBtn label="Mark Inspection Passed" onClick={() => interact("set_inspection", { inspection_passed: true })} loading={interacting === "set_inspection"} disabled={contract.status === "closed"} />
                <ActionBtn label="Release Funds to Seller" onClick={() => interact("release_funds")} loading={interacting === "release_funds"} disabled={contract.status !== "funded"} variant="success" />
                <ActionBtn label="Refund to Buyer" onClick={() => interact("refund")} loading={interacting === "refund"} disabled={contract.status !== "funded"} variant="danger" />
              </div>
              {interactResult && !interactResult.error && (
                <div className="space-y-1 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                  <p className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> {interactResult.action} — {interactResult.status}</p>
                  {interactResult.txHash && <p className="font-mono text-[10px]">TX: {interactResult.txHash}</p>}
                  {interactResult.explorer && <a href={interactResult.explorer} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline"><ExternalLink className="h-3 w-3" /> View on Polygonscan</a>}
                </div>
              )}
              {interactResult?.error && <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{interactResult.error}</div>}
            </div>
          )}

          {/* Source Tab */}
          {tab === "source" && (
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-black/40">Solidity Source Code</p>
              <pre className="max-h-96 overflow-auto rounded-lg bg-gray-900 p-4 text-[11px] leading-relaxed text-white/90"><code>{contract.source_code || "// No source code on file"}</code></pre>
              {contract.contract_address && (
                <a href={`https://polygonscan.com/address/${contract.contract_address}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-black underline"><ExternalLink className="h-3 w-3" /> View contract on Polygonscan</a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="rounded-lg border border-black/10 p-3"><p className="text-[10px] uppercase tracking-[0.2em] text-black/40">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>;
}

function ActionBtn({ label, onClick, loading, disabled, variant }) {
  const cls = variant === "success" ? "bg-emerald-700" : variant === "danger" ? "bg-red-700" : "bg-black";
  return (
    <button onClick={onClick} disabled={loading || disabled} className={`inline-flex items-center justify-center gap-1.5 rounded-md ${cls} px-4 py-2.5 text-xs text-white disabled:opacity-40`}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} {label}
    </button>
  );
}