import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  FileSignature, Brain, Loader2, ShieldCheck, Clock,
  CheckCircle2, AlertTriangle, Stamp, UserCheck,
} from "lucide-react";

export default function NotaryDashboard() {
  const [loading, setLoading] = useState(true);
  const [signatures, setSignatures] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const sigList = await base44.entities.DigitalSignature.list("-created_date", 30);
        setSignatures(sigList);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const runComplianceCheck = async () => {
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI notary compliance assistant for a real estate platform. Review the following pending digital signatures and provide:
1. Compliance verification for each document (ESIGN Act / UETA requirements)
2. Identity verification recommendations
3. Commission expiration alerts
4. Witness requirements by document type
5. Fraud risk indicators
6. Recommended actions

Pending signatures: ${JSON.stringify(signatures.filter(s => s.status === "pending").map(s => ({
  id: s.id,
  document_title: s.document_title,
  document_type: s.document_type,
  signer_name: s.signer_name,
  signer_email: s.signer_email,
  signer_role: s.signer_role,
  status: s.status,
  expires_at: s.expires_at,
})))}

Provide a structured response for a notary managing these signings.`,
        response_json_schema: {
          type: "object",
          properties: {
            compliance_status: { type: "array", items: { type: "object", properties: { doc_id: { type: "string" }, compliant: { type: "boolean" }, issues: { type: "array", items: { type: "string" } } } } },
            identity_recommendations: { type: "array", items: { type: "string" } },
            commission_alerts: { type: "array", items: { type: "string" } },
            witness_requirements: { type: "array", items: { type: "string" } },
            fraud_indicators: { type: "array", items: { type: "string" } },
            recommended_actions: { type: "array", items: { type: "string" } },
            overall_summary: { type: "string" }
          }
        }
      });
      setAiAnalysis(res);
    } catch (e) { setAiAnalysis({ error: e.message }); }
    setAiLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-sm text-black/40">Loading notary dashboard…</div>;

  const pending = signatures.filter(s => s.status === "pending");
  const signed = signatures.filter(s => s.status === "signed");

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="flex items-center gap-2">
        <Stamp className="h-5 w-5 text-[#c38a1b]" />
        <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Notary Dashboard</p>
      </div>
      <h1 className="mt-2 font-display text-3xl font-light tracking-tight">Digital Signature Management</h1>
      <p className="mt-2 max-w-3xl text-sm text-black/50">
        Manage digital signatures, verify signer identity, track commission status, and ensure ESIGN Act / UETA compliance with AI.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 lg:grid-cols-4">
        <Stat icon={Clock} label="Pending Signatures" value={pending.length} />
        <Stat icon={CheckCircle2} label="Completed" value={signed.length} />
        <Stat icon={FileSignature} label="Total Documents" value={signatures.length} />
        <Stat icon={AlertTriangle} label="Expiring Soon" value={pending.filter(s => s.expires_at && new Date(s.expires_at) < new Date(Date.now() + 7 * 86400000)).length} />
      </div>

      {/* AI Compliance Check */}
      <div className="mt-8 rounded-sm border border-[#c38a1b]/30 bg-amber-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#c38a1b]" />
            <h2 className="font-display text-lg font-light">AI Notary Compliance Check</h2>
          </div>
          <button onClick={runComplianceCheck} disabled={aiLoading} className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {aiLoading ? "Checking…" : "Run Compliance Check"}
          </button>
        </div>
        {aiAnalysis && !aiAnalysis.error && (
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">Overall Summary</p>
              <p className="mt-1 text-amber-900">{aiAnalysis.overall_summary}</p>
            </div>
            {aiAnalysis.recommended_actions?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">Recommended Actions</p>
                <ul className="mt-1 space-y-1 text-amber-900">
                  {aiAnalysis.recommended_actions.map((a, i) => <li key={i}>• {a}</li>)}
                </ul>
              </div>
            )}
            {aiAnalysis.fraud_indicators?.length > 0 && (
              <div className="rounded-sm border border-red-200 bg-red-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-red-700">Fraud Indicators</p>
                <ul className="mt-1 space-y-1 text-red-900">
                  {aiAnalysis.fraud_indicators.map((f, i) => <li key={i}>• {f}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        {aiAnalysis?.error && <p className="mt-2 text-sm text-red-600">Error: {aiAnalysis.error}</p>}
      </div>

      {/* Signature Queue */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-light">Signature Queue</h2>
        <div className="mt-4 space-y-2">
          {signatures.length === 0 ? (
            <div className="rounded-sm border border-black/10 p-6 text-center text-sm text-black/40">No signatures in queue</div>
          ) : signatures.map((s) => (
            <div key={s.id} className="rounded-sm border border-black/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSignature className="h-4 w-4 text-black/60" />
                  <div>
                    <p className="font-medium">{s.document_title}</p>
                    <p className="text-xs text-black/50">Signer: {s.signer_name} ({s.signer_role}) · {s.signer_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {s.notary_name && <span className="text-xs text-black/50">Notary: {s.notary_name}</span>}
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-white ${s.status === "signed" ? "bg-emerald-600" : s.status === "pending" ? "bg-amber-500" : "bg-red-600"}`}>{s.status}</span>
                </div>
              </div>
              {s.expires_at && <p className="mt-2 text-xs text-black/40">Expires: {new Date(s.expires_at).toLocaleString()}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-white p-5">
      <Icon className="h-5 w-5 text-black/40" />
      <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-black/40">{label}</p>
      <p className="mt-1 font-display text-2xl font-light">{value}</p>
    </div>
  );
}