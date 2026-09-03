import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Loader2, AlertTriangle, CheckCircle2, X } from "lucide-react";

export default function FairHousingAudit({ subject, body, onFix }) {
  const [auditing, setAuditing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  const audit = async () => {
    setAuditing(true); setError(null); setResult(null);
    try {
      const content = `Subject: ${subject || ""}\n\nBody: ${body || ""}`;
      const res = await base44.functions.invoke("auditFairHousing", { content, content_type: "email" });
      setResult(res.data);
      setOpen(true);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setAuditing(false);
  };

  const applyFix = (original, replacement) => {
    if (onFix) onFix(original, replacement);
  };

  return (
    <>
      <button
        onClick={audit}
        disabled={auditing || (!subject && !body)}
        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
        title="Check email for fair housing violations before sending"
      >
        {auditing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
        {auditing ? "Auditing…" : "Fair Housing Check"}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}

      {open && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-3">
              <div className="flex items-center gap-2">
                {result.violations_found ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
                <h3 className="text-sm font-medium">Fair Housing Audit</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-black/40 hover:text-black"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${result.compliance_score >= 90 ? "bg-emerald-100" : result.compliance_score >= 70 ? "bg-amber-100" : "bg-red-100"}`}>
                  <span className={`font-display text-xl ${result.compliance_score >= 90 ? "text-emerald-700" : result.compliance_score >= 70 ? "text-amber-700" : "text-red-700"}`}>{result.compliance_score}</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-black/40">Compliance Score</p>
                  <p className="text-sm font-medium">
                    {result.violations_found
                      ? `${result.violations.length} violation${result.violations.length === 1 ? "" : "s"} found`
                      : "No violations — compliant!"}
                  </p>
                  <p className="text-xs text-black/50">{result.overall_assessment}</p>
                </div>
              </div>

              {result.violations?.length > 0 && (
                <div className="mt-5 space-y-3">
                  {result.violations.map((v, i) => (
                    <div key={i} className="rounded-lg border border-black/10 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-red-700">"{v.phrase}"</p>
                          <p className="mt-0.5 text-xs text-black/50">{v.explanation}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-widest ${
                          v.severity === "high" ? "bg-red-100 text-red-700" :
                          v.severity === "medium" ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>{v.severity}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-emerald-50 p-2">
                        <p className="text-xs text-emerald-800"><span className="font-medium">Fix:</span> {v.compliant_alternative}</p>
                        <button
                          onClick={() => applyFix(v.phrase, v.compliant_alternative)}
                          className="shrink-0 rounded bg-emerald-600 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-emerald-700"
                        >
                          Apply Fix
                        </button>
                      </div>
                      <p className="mt-1.5 text-[10px] uppercase tracking-widest text-black/30">Protected class: {v.protected_class}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-black/10 px-5 py-3">
              <button onClick={() => setOpen(false)} className="w-full rounded-md bg-black px-4 py-2 text-xs font-medium text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}