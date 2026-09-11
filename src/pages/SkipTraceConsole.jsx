import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  ShieldCheck, Search, Loader2, AlertTriangle, CheckCircle2, XCircle,
  Fingerprint, Link2, Phone, Scale, Target, ChevronDown, FileText, Clock, Database,
} from "lucide-react";

const VERDICT_STYLES = {
  VERIFIED: { color: "#247a45", bg: "#e8f5ee", icon: CheckCircle2 },
  PROBABLE: { color: "#375a7f", bg: "#e8f0f7", icon: ShieldCheck },
  AMBIGUOUS: { color: "#a6640b", bg: "#fbf3e2", icon: AlertTriangle },
  CONFLICTED: { color: "#b33a31", bg: "#fbeceb", icon: XCircle },
  SUPPRESSED: { color: "#6f6a60", bg: "#f0ede7", icon: XCircle },
  NOT_FOUND: { color: "#6f6a60", bg: "#f0ede7", icon: Search },
};

const SCORE_DEFS = [
  { key: "identity_match", label: "Identity Match", icon: Fingerprint, desc: "Are these records about the same person?" },
  { key: "relationship_match", label: "Relationship Match", icon: Link2, desc: "Is the person connected to the property/case?" },
  { key: "channel_ownership", label: "Channel Ownership", icon: Phone, desc: "Does this phone/email/address belong to them now?" },
  { key: "contact_eligibility", label: "Contact Eligibility", icon: Scale, desc: "May we legally use that channel for this purpose?" },
  { key: "target_priority", label: "Target Priority", icon: Target, desc: "Is the person worth contacting for the objective?" },
];

export default function SkipTraceConsole() {
  const [gate, setGate] = useState({
    case_type: "property_owner",
    jurisdiction: "US-FL",
    permissible_purpose: "legitimate_business_interest",
    intended_use: "distressed_property_acquisition",
    retention_period_days: 365,
    permitted_outreach: ["email", "mail"],
  });
  const [seedInput, setSeedInput] = useState({ name: "", phone: "", email: "", address: "", zip: "", business_name: "", entity_type: "individual" });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [cases, setCases] = useState([]);
  const [expandedCase, setExpandedCase] = useState(null);

  const loadCases = useCallback(async () => {
    try {
      const r = await base44.entities.SkipTraceCase.list("-created_date", 20);
      setCases(r);
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => { loadCases(); }, [loadCases]);

  const runResolve = async () => {
    setRunning(true); setError(null); setResult(null);
    try {
      const res = await base44.functions.invoke("skipTraceResolve", { gate, seed_input: seedInput });
      setResult(res.data);
      loadCases();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setRunning(false);
    }
  };

  const toggleOutreach = (ch) => {
    setGate((g) => {
      const has = g.permitted_outreach.includes(ch);
      return { ...g, permitted_outreach: has ? g.permitted_outreach.filter((x) => x !== ch) : [...g.permitted_outreach, ch] };
    });
  };

  return (
    <div className="min-h-screen bg-white text-[#12110f]">
      {/* Header */}
      <div className="border-b border-[#e7e1d6] bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c38a1b] bg-[#fff8e9]">
            <ShieldCheck className="h-5 w-5 text-[#c38a1b]" />
          </div>
          <div>
            <h2 className="text-xl font-light tracking-wide">Skip-Trace Resolution Console</h2>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#6f6a60]">NIST SP 800-63A aligned · Purpose gateway · Five independent scores · Verification verdicts</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Purpose Gate */}
          <div className="rounded-xl border border-[#e7e1d6] bg-[#f7f5f0] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Scale className="h-4 w-4 text-[#c38a1b]" />
              <h3 className="text-sm font-semibold">Purpose Gateway</h3>
              <span className="text-[9px] uppercase tracking-[0.15em] text-[#6f6a60]">Required before any search</span>
            </div>
            <div className="grid gap-3">
              <Field label="Case type">
                <select value={gate.case_type} onChange={(e) => setGate({ ...gate, case_type: e.target.value })} className="input">
                  <option value="property_owner">Property owner</option>
                  <option value="residential_lead">Residential lead</option>
                  <option value="contractor_lead">Contractor lead</option>
                  <option value="heir_search">Heir search</option>
                  <option value="asset_recovery">Asset recovery</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Jurisdiction">
                  <input value={gate.jurisdiction} onChange={(e) => setGate({ ...gate, jurisdiction: e.target.value })} className="input" />
                </Field>
                <Field label="Retention (days)">
                  <input type="number" value={gate.retention_period_days} onChange={(e) => setGate({ ...gate, retention_period_days: +e.target.value })} className="input" />
                </Field>
              </div>
              <Field label="Permissible purpose">
                <input value={gate.permissible_purpose} onChange={(e) => setGate({ ...gate, permissible_purpose: e.target.value })} className="input" />
              </Field>
              <Field label="Intended use">
                <input value={gate.intended_use} onChange={(e) => setGate({ ...gate, intended_use: e.target.value })} className="input" />
              </Field>
              <Field label="Permitted outreach channels">
                <div className="flex flex-wrap gap-2">
                  {["voice", "sms", "email", "mail", "none"].map((ch) => (
                    <button
                      key={ch}
                      onClick={() => toggleOutreach(ch)}
                      className={`rounded-md border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide transition ${
                        gate.permitted_outreach.includes(ch) ? "border-[#c38a1b] bg-[#c38a1b] text-white" : "border-[#e7e1d6] bg-white text-[#6f6a60]"
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </div>

          {/* Seed Input */}
          <div className="rounded-xl border border-[#e7e1d6] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-[#c38a1b]" />
              <h3 className="text-sm font-semibold">Search Seed</h3>
              <span className="text-[9px] uppercase tracking-[0.15em] text-[#6f6a60]">Normalized: Unicode · diacritics · E.164 · IDNA · phonetics</span>
            </div>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name">
                  <input value={seedInput.name} onChange={(e) => setSeedInput({ ...seedInput, name: e.target.value })} className="input" placeholder="John Smith" />
                </Field>
                <Field label="Entity type">
                  <select value={seedInput.entity_type} onChange={(e) => setSeedInput({ ...seedInput, entity_type: e.target.value })} className="input">
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone">
                  <input value={seedInput.phone} onChange={(e) => setSeedInput({ ...seedInput, phone: e.target.value })} className="input" placeholder="(305) 555-0100" />
                </Field>
                <Field label="Email">
                  <input value={seedInput.email} onChange={(e) => setSeedInput({ ...seedInput, email: e.target.value })} className="input" placeholder="name@domain.com" />
                </Field>
              </div>
              <Field label="Address">
                <input value={seedInput.address} onChange={(e) => setSeedInput({ ...seedInput, address: e.target.value })} className="input" placeholder="123 Main St, Miami, FL" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="ZIP">
                  <input value={seedInput.zip} onChange={(e) => setSeedInput({ ...seedInput, zip: e.target.value })} className="input" />
                </Field>
                <Field label="Business name">
                  <input value={seedInput.business_name} onChange={(e) => setSeedInput({ ...seedInput, business_name: e.target.value })} className="input" />
                </Field>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={runResolve}
            disabled={running || !seedInput.name}
            className="inline-flex items-center gap-2 rounded-lg bg-[#c38a1b] px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-[#e4b653] disabled:opacity-50"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            {running ? "Resolving…" : "Run Resolution"}
          </button>
        </div>

        {/* Result */}
        {result && <ResultPanel result={result} />}

        {/* Case history */}
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-[#6f6a60]" />
            <h3 className="text-sm font-semibold">Recent Cases</h3>
          </div>
          <div className="space-y-2">
            {cases.length === 0 && <p className="text-xs text-[#6f6a60]">No cases yet — run your first resolution above.</p>}
            {cases.map((c) => {
              const v = VERDICT_STYLES[c.verdict] || VERDICT_STYLES.NOT_FOUND;
              const VIcon = v.icon;
              return (
                <div key={c.id} className="rounded-lg border border-[#e7e1d6] bg-white">
                  <button onClick={() => setExpandedCase(expandedCase === c.id ? null : c.id)} className="flex w-full items-center gap-3 p-3 text-left">
                    <span className="rounded-md px-2 py-1 text-[10px] font-bold" style={{ color: v.color, background: v.bg }}>
                      <VIcon className="mr-1 inline h-3 w-3" />{c.verdict || "PENDING"}
                    </span>
                    <span className="flex-1 text-xs font-medium">{c.seed?.name || c.canonical_record?.canonical_name || "Unknown"}</span>
                    <span className="text-[10px] text-[#6f6a60]">{c.case_type?.replace(/_/g, " ")}</span>
                    <span className="text-[10px] text-[#6f6a60]">{c.independent_sources || 0} independent sources</span>
                    <ChevronDown className={`h-4 w-4 text-[#6f6a60] transition ${expandedCase === c.id ? "rotate-180" : ""}`} />
                  </button>
                  {expandedCase === c.id && (
                    <div className="border-t border-[#e7e1d6] p-4">
                      <CaseDetail c={c} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`.input{border:1px solid #e7e1d6;border-radius:8px;padding:9px 11px;background:#fff;font-size:12px;width:100%;}`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6f6a60]">{label}</span>
      {children}
    </label>
  );
}

function ResultPanel({ result }) {
  const v = VERDICT_STYLES[result.verdict] || VERDICT_STYLES.NOT_FOUND;
  const VIcon = v.icon;
  return (
    <div className="mt-6 rounded-xl border border-[#e7e1d6] bg-white p-5">
      {/* Verdict banner */}
      <div className="flex items-center gap-4 rounded-lg p-4" style={{ background: v.bg }}>
        <VIcon className="h-9 w-9" style={{ color: v.color }} />
        <div className="flex-1">
          <p className="text-lg font-light" style={{ color: v.color }}>{result.verdict}</p>
          <p className="text-[11px] text-[#6f6a60]">{result.independent_sources} independent sources · {result.evidence_count} evidence items · {result.duration_ms}ms</p>
        </div>
        <div className={`rounded-full px-3 py-1 text-[10px] font-bold ${result.automation_allowed ? "bg-emerald-600 text-white" : "bg-[#6f6a60] text-white"}`}>
          {result.automation_allowed ? "AUTOMATION ALLOWED" : "AUTOMATION BLOCKED"}
        </div>
      </div>

      {/* Five scores */}
      <div className="mt-4">
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#6f6a60]">Five Independent Scores — never combined</p>
        <div className="grid gap-2 sm:grid-cols-5">
          {SCORE_DEFS.map((s) => {
            const val = result.scores?.[s.key] ?? 0;
            const Icon = s.icon;
            return (
              <div key={s.key} className="rounded-lg border border-[#e7e1d6] bg-[#f7f5f0] p-3">
                <Icon className="h-3.5 w-3.5 text-[#c38a1b]" />
                <p className="mt-1.5 text-xl font-light">{val}</p>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#12110f]">{s.label}</p>
                <p className="mt-1 text-[8px] leading-tight text-[#6f6a60]">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Canonical record */}
      {result.canonical_record && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#6f6a60]">Canonical Record</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <KV label="Name" value={result.canonical_record.canonical_name} />
            <KV label="Best phone" value={result.canonical_record.best_phone} />
            <KV label="Best email" value={result.canonical_record.best_email} />
            <KV label="Best address" value={result.canonical_record.best_address} />
            <KV label="Companies" value={(result.canonical_record.companies || []).join(", ") || "—"} />
            <KV label="Properties" value={(result.canonical_record.properties || []).join(", ") || "—"} />
          </div>
        </div>
      )}

      {/* Contradictions */}
      {result.contradictions?.length > 0 && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-red-700">Contradictory Evidence</p>
          {result.contradictions.map((c, i) => (
            <p key={i} className="mt-1 text-xs text-red-800"><span className="font-bold">{c.severity}:</span> {c.description}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function CaseDetail({ c }) {
  return (
    <div className="grid gap-3">
      <div className="text-[10px] text-[#6f6a60]">{c.lawful_purpose}</div>
      {c.scores && (
        <div className="grid grid-cols-5 gap-2">
          {SCORE_DEFS.map((s) => (
            <div key={s.key} className="rounded border border-[#e7e1d6] bg-[#f7f5f0] px-2 py-1.5 text-center">
              <p className="text-sm font-medium">{c.scores[s.key] ?? 0}</p>
              <p className="text-[8px] uppercase text-[#6f6a60]">{s.label.split(" ")[0]}</p>
            </div>
          ))}
        </div>
      )}
      {c.contradictions?.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-red-700">Contradictions</p>
          {c.contradictions.map((con, i) => <p key={i} className="text-xs text-red-800">{con.description}</p>)}
        </div>
      )}
      {c.evidence?.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wide text-[#6f6a60]">Evidence ({c.evidence.length})</p>
          <div className="max-h-40 overflow-auto rounded border border-[#e7e1d6]">
            {c.evidence.slice(0, 10).map((e, i) => (
              <div key={i} className="flex items-center gap-2 border-b border-[#e7e1d6] px-2 py-1.5 text-[10px]">
                <FileText className="h-3 w-3 text-[#c38a1b]" />
                <span className="font-medium">{e.attribute}:</span>
                <span className="flex-1 truncate text-[#12110f]">{e.value}</span>
                <span className="text-[#6f6a60]">{e.source}</span>
                <Clock className="h-3 w-3 text-[#6f6a60]" />
                <span className="text-[#6f6a60]">{e.freshness_days}d</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div className="rounded-lg border border-[#e7e1d6] px-3 py-2">
      <p className="text-[9px] uppercase tracking-wide text-[#6f6a60]">{label}</p>
      <p className="text-xs font-medium text-[#12110f]">{value || "—"}</p>
    </div>
  );
}