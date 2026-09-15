import React, { useState } from "react";
import { X, Loader2, Rocket, FileText, Send, FileCode2, ExternalLink, Check, AlertTriangle, Download, ShieldCheck, History, Gauge } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_COLORS = {
  draft: "bg-blue-100 text-blue-700", deployed: "bg-amber-100 text-amber-700",
  signed: "bg-purple-100 text-purple-700", funded: "bg-indigo-100 text-indigo-700",
  closed: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-700",
};

const LIFECYCLE = ["draft", "deployed", "signed", "funded", "closed"];
const LIFECYCLE_LABELS = ["Draft", "Deployed", "Signed", "Funded", "Closed"];

export default function SmartContractActionModal({ contract, onClose, onRefresh }) {
  const [tab, setTab] = useState(contract?.contract_address ? "interact" : "deploy");
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState(null);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [genDocs, setGenDocs] = useState(false);
  const [docResult, setDocResult] = useState(null);
  const [activeDoc, setActiveDoc] = useState(null);
  const [interacting, setInteracting] = useState(null);
  const [interactResult, setInteractResult] = useState(null);
  const [chainState, setChainState] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const estimateGas = async () => {
    setEstimating(true); setGasEstimate(null);
    try {
      const res = await base44.functions.invoke("deploySmartContract", { smart_contract_id: contract.id, estimate_only: true });
      setGasEstimate(res.data);
    } catch (e) { setGasEstimate({ error: e.response?.data?.error || e.message }); }
    setEstimating(false);
  };

  const deploy = async () => {
    setDeploying(true); setDeployResult(null);
    try {
      const res = await base44.functions.invoke("deploySmartContract", { smart_contract_id: contract.id });
      setDeployResult(res.data); onRefresh();
    } catch (e) { setDeployResult({ error: e.response?.data?.error || e.message }); }
    setDeploying(false);
  };

  const genDocuments = async () => {
    setGenDocs(true); setDocResult(null);
    try {
      const res = await base44.functions.invoke("generateContractDocuments", { smart_contract_id: contract.id });
      setDocResult(res.data); onRefresh();
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
    setConfirmAction(null);
  };

  const handleActionClick = (action, extra = {}, isDestructive = false) => {
    if (isDestructive) {
      setConfirmAction({ action, extra, label: action.replace(/_/g, " ") });
    } else {
      interact(action, extra);
    }
  };

  const downloadDoc = (doc) => {
    const blob = new Blob([doc.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${doc.title.replace(/\s+/g, "_")}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const currentStage = LIFECYCLE.indexOf(contract.status);
  const tabs = [
    { id: "deploy", label: "Deploy", icon: Rocket, show: !contract.contract_address },
    { id: "interact", label: "Interact", icon: Send, show: !!contract.contract_address },
    { id: "documents", label: "Documents", icon: FileText, show: true },
    { id: "audit", label: "Audit Log", icon: History, show: true },
    { id: "source", label: "Source", icon: FileCode2, show: true },
  ].filter((t) => t.show);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-3">
          <div>
            <h2 className="text-sm font-medium">Smart Contract — {contract.contract_type}</h2>
            <p className="text-xs text-black/50">{contract.property?.address || "No property"} · {contract.investor?.name || "Unknown"} → {contract.seller?.name || "Unknown"}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${STATUS_COLORS[contract.status] || "bg-gray-100"}`}>{contract.status}</span>
            <button onClick={onClose} className="rounded-md p-1.5 hover:bg-black/5"><X className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Lifecycle progress bar */}
        <div className="flex items-center justify-between px-8 py-4">
          {LIFECYCLE.map((stage, i) => (
            <React.Fragment key={stage}>
              <div className="flex flex-col items-center">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${i <= currentStage ? "bg-black text-white" : "bg-gray-200 text-gray-400"}`}>
                  {i < currentStage ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <p className={`mt-1 text-[9px] uppercase tracking-[0.1em] ${i === currentStage ? "font-bold text-black" : "text-black/40"}`}>{LIFECYCLE_LABELS[i]}</p>
              </div>
              {i < LIFECYCLE.length - 1 && <div className={`h-0.5 flex-1 ${i < currentStage ? "bg-black" : "bg-gray-200"}`} />}
            </React.Fragment>
          ))}
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

              {/* Gas estimation */}
              <div className="rounded-lg border border-black/10 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-black/40" /><p className="text-xs font-medium">Gas Estimation</p></div>
                  <button onClick={estimateGas} disabled={estimating} className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-1.5 text-xs hover:bg-black hover:text-white disabled:opacity-50">
                    {estimating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Gauge className="h-3 w-3" />} {estimating ? "Estimating…" : "Estimate Gas Cost"}
                  </button>
                </div>
                {gasEstimate && !gasEstimate.error && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div><p className="text-[10px] text-black/40">Est. Gas</p><p className="font-medium">{Number(gasEstimate.estimated_gas).toLocaleString()} units</p></div>
                    <div><p className="text-[10px] text-black/40">Gas Price</p><p className="font-medium">{parseFloat(gasEstimate.gas_price_gwei).toFixed(2)} Gwei</p></div>
                    <div><p className="text-[10px] text-black/40">Est. Cost</p><p className="font-medium">{parseFloat(gasEstimate.estimated_cost_matic).toFixed(6)} MATIC</p></div>
                  </div>
                )}
                {gasEstimate?.error && <p className="mt-2 text-xs text-red-600">{gasEstimate.error}</p>}
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs text-amber-800">This will compile the escrow contract and deploy it to the Polygon blockchain. The deployer wallet pays gas fees.</p>
                <button onClick={deploy} disabled={deploying} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-black px-4 py-2 text-xs text-white disabled:opacity-50">
                  {deploying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />} {deploying ? "Deploying to Polygon…" : "Deploy to Polygon"}
                </button>
              </div>
              {deployResult && !deployResult.error && (
                <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs">
                  <p className="flex items-center gap-2 font-medium text-emerald-800"><Check className="h-4 w-4" /> Deployed successfully!</p>
                  <p><strong>Address:</strong> <code className="break-all">{deployResult.address}</code></p>
                  <p><strong>TX:</strong> <code className="break-all">{deployResult.txHash}</code></p>
                  {deployResult.gas_cost_matic && <p><strong>Gas Cost:</strong> {parseFloat(deployResult.gas_cost_matic).toFixed(6)} MATIC</p>}
                  <a href={deployResult.explorer} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-700 underline"><ExternalLink className="h-3 w-3" /> View on Polygonscan</a>
                </div>
              )}
              {deployResult?.error && <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700"><AlertTriangle className="h-4 w-4 shrink-0" /> {deployResult.error}</div>}
            </div>
          )}

          {/* Interact Tab */}
          {tab === "interact" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-black/60">On-chain interactions. The deployer wallet executes these transactions.</p>
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
                <ActionBtn label="Sign as Buyer" onClick={() => handleActionClick("sign_buyer")} loading={interacting === "sign_buyer"} disabled={contract.status === "signed" || contract.status === "closed"} />
                <ActionBtn label="Sign as Seller" onClick={() => handleActionClick("sign_seller")} loading={interacting === "sign_seller"} disabled={contract.status === "signed" || contract.status === "closed"} />
                <ActionBtn label="Deposit Earnest Money" onClick={() => handleActionClick("deposit_earnest")} loading={interacting === "deposit_earnest"} disabled={contract.status !== "signed"} />
                <ActionBtn label="Mark Inspection Passed" onClick={() => handleActionClick("set_inspection", { inspection_passed: true })} loading={interacting === "set_inspection"} disabled={contract.status === "closed"} />
                <ActionBtn label="Release Funds to Seller" onClick={() => handleActionClick("release_funds", {}, true)} loading={interacting === "release_funds"} disabled={contract.status !== "funded"} variant="success" />
                <ActionBtn label="Refund to Buyer" onClick={() => handleActionClick("refund", {}, true)} loading={interacting === "refund"} disabled={contract.status !== "funded"} variant="danger" />
              </div>

              {/* Confirmation dialog */}
              {confirmAction && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-red-700"><AlertTriangle className="h-4 w-4" /> Confirm: {confirmAction.label}?</p>
                  <p className="mt-1 text-xs text-red-600">This is an irreversible on-chain transaction. Are you sure?</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => interact(confirmAction.action, confirmAction.extra)} className="rounded-md bg-red-700 px-4 py-2 text-xs text-white">Yes, Execute</button>
                    <button onClick={() => setConfirmAction(null)} className="rounded-md border border-black/15 px-4 py-2 text-xs">Cancel</button>
                  </div>
                </div>
              )}

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
                      <div><p className="text-sm font-medium">{doc.title}</p><p className="text-[10px] text-black/40">{doc.type} · {new Date(doc.generated_at).toLocaleDateString()}</p></div>
                      <div className="flex gap-1">
                        <button onClick={() => setActiveDoc(activeDoc === i ? null : i)} className="rounded-md border border-black/15 px-3 py-1.5 text-xs hover:bg-black hover:text-white">View</button>
                        <button onClick={() => downloadDoc(doc)} className="rounded-md border border-black/15 p-1.5 hover:bg-black hover:text-white"><Download className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-black/40">No documents yet. Click "Generate All Documents" to create them with AI.</p>}
              {activeDoc !== null && contract.documents?.[activeDoc] && (
                <pre className="max-h-80 overflow-auto rounded-lg bg-gray-900 p-4 text-[11px] leading-relaxed text-white/90 whitespace-pre-wrap">{contract.documents[activeDoc].content}</pre>
              )}
            </div>
          )}

          {/* Audit Log Tab */}
          {tab === "audit" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-black/40" /><p className="text-xs font-medium">Immutable audit trail — every action is logged.</p></div>
              {(contract.audit_log || []).length === 0 ? (
                <p className="text-xs text-black/40">No audit entries yet.</p>
              ) : (
                <div className="space-y-1">
                  {(contract.audit_log || []).slice().reverse().map((entry, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-black/10 p-3 text-xs">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/5"><History className="h-3 w-3 text-black/50" /></div>
                      <div className="flex-1">
                        <p className="font-medium capitalize">{entry.action.replace(/_/g, " ")}</p>
                        <p className="text-[10px] text-black/50">{entry.details}</p>
                        <p className="text-[10px] text-black/30">{new Date(entry.timestamp).toLocaleString()} · by {entry.actor}</p>
                        {entry.tx_hash && <p className="mt-0.5"><a href={`https://polygonscan.com/tx/${entry.tx_hash}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline"><ExternalLink className="h-2.5 w-2.5" /> {entry.tx_hash.slice(0, 20)}…</a></p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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