import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Loader2, User, Phone, Mail, MapPin, Users, History, ShieldCheck,
  AlertTriangle, CheckCircle2, XCircle, FileSearch, Database, Globe,
  Building2, Skull, ListChecks, Sparkles, RefreshCw, Link2,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const METHOD_ICONS = {
  "County Property Appraiser": Database,
  "County Tax": Database,
  "Deed Records": FileSearch,
  "People-Search": Users,
  "Social Media": Globe,
  "Business Filings": Building2,
  "Obituary": Skull,
  "Probate": FileSearch,
};

function methodIcon(method) {
  const m = (method || "").toLowerCase();
  if (m.includes("assessor") || m.includes("appraiser") || m.includes("tax")) return Database;
  if (m.includes("deed") || m.includes("recorder") || m.includes("clerk")) return FileSearch;
  if (m.includes("people") || m.includes("truepeople") || m.includes("whitepage") || m.includes("spokeo") || m.includes("beenverified")) return Users;
  if (m.includes("social") || m.includes("linkedin") || m.includes("facebook")) return Globe;
  if (m.includes("business") || m.includes("sunbiz") || m.includes("llc") || m.includes("corporation")) return Building2;
  if (m.includes("obituary") || m.includes("death")) return Skull;
  if (m.includes("probate") || m.includes("heir")) return FileSearch;
  return Search;
}

function statusStyle(status) {
  switch (status) {
    case "found": return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "partial": return "text-amber-600 bg-amber-50 border-amber-200";
    case "not_found": return "text-black/40 bg-black/5 border-black/10";
    case "error": return "text-red-600 bg-red-50 border-red-200";
    default: return "text-black/40 bg-black/5 border-black/10";
  }
}

function StatusIcon({ status }) {
  switch (status) {
    case "found": return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "partial": return <AlertTriangle className="h-3.5 w-3.5" />;
    case "not_found": return <XCircle className="h-3.5 w-3.5" />;
    case "error": return <AlertTriangle className="h-3.5 w-3.5" />;
    default: return <div className="h-3.5 w-3.5 rounded-full border border-current" />;
  }
}

function ConfidenceRing({ score }) {
  const s = Math.max(0, Math.min(100, score || 0));
  const color = s >= 70 ? "#247a45" : s >= 40 ? "#a6640b" : "#b33a31";
  return (
    <div className="relative grid h-24 w-24 place-items-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(${color} ${s * 3.6}deg, #e7e1d6 0)` }}
      />
      <div className="absolute inset-[10px] rounded-full bg-white" />
      <div className="relative text-center">
        <p className="font-display text-2xl font-light" style={{ color }}>{s}</p>
        <p className="text-[8px] uppercase tracking-[0.2em] text-black/40">Confidence</p>
      </div>
    </div>
  );
}

export default function AdminOwnerIdentification() {
  const [mode, setMode] = useState("address"); // "address" | "property"
  const [form, setForm] = useState({ address: "", city: "", state: "FL", zip_code: "" });
  const [propertyId, setPropertyId] = useState("");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const loadProperties = useCallback(async () => {
    try {
      const recs = await base44.entities.Property.list("-updated_date", 50);
      setProperties(recs || []);
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => { loadProperties(); }, [loadProperties]);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = mode === "property" ? { property_id: propertyId } : form;
      const res = await base44.functions.invoke("identifyPropertyOwner", payload);
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Identification failed");
    }
    setLoading(false);
  };

  const canRun = mode === "property" ? !!propertyId : !!form.address;

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-black text-[#e4b653]">
          <UserSearch />
        </div>
        <div>
          <h1 className="font-display text-2xl font-light tracking-tight">Owner Identification Engine</h1>
          <p className="text-xs text-black/50">
            Enter any property — the system exhausts every public source & method to identify the owner, skip-trace contact info, find heirs, and build the ownership chain.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="mt-6 rounded-lg border border-black/10 bg-white p-5">
        <div className="flex gap-1 rounded-md bg-black/5 p-1 w-fit">
          <button
            onClick={() => setMode("address")}
            className={`rounded px-4 py-1.5 text-xs font-medium transition ${mode === "address" ? "bg-white text-black shadow-sm" : "text-black/50"}`}
          >
            Enter Address
          </button>
          <button
            onClick={() => setMode("property")}
            className={`rounded px-4 py-1.5 text-xs font-medium transition ${mode === "property" ? "bg-white text-black shadow-sm" : "text-black/50"}`}
          >
            Select Existing Property
          </button>
        </div>

        {mode === "address" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              className="rounded-md border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black sm:col-span-2 lg:col-span-2"
              placeholder="Property address *"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <input
              className="rounded-md border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <div className="flex gap-2">
              <input
                className="w-20 rounded-md border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black"
                placeholder="ST"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
              <input
                className="flex-1 rounded-md border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black"
                placeholder="ZIP"
                value={form.zip_code}
                onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <select
            className="mt-4 w-full rounded-md border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            <option value="">Select a property…</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}, {p.city}, {p.state} {p.zip_code}
              </option>
            ))}
          </select>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={run}
            disabled={!canRun || loading}
            className="inline-flex items-center gap-2 rounded-md bg-black px-5 py-2.5 text-xs font-medium text-white transition hover:bg-black/80 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Identifying…" : "Run Full Identification"}
          </button>
          {result && !loading && (
            <button
              onClick={run}
              className="inline-flex items-center gap-2 rounded-md border border-black/15 px-4 py-2.5 text-xs text-black/60 hover:bg-black/5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Re-run
            </button>
          )}
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-black/30" />
          <p className="mt-4 text-sm text-black/50">
            Searching assessor records, tax records, deeds, people-search sites, social media, obituaries, probate filings, and ownership chain…
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-black/30">This can take 30-60 seconds</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="mt-6 space-y-4">
          {/* Top summary card */}
          <div className="grid gap-4 rounded-lg border border-black/10 bg-white p-6 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-black/40">
                <MapPin className="h-3 w-3" /> {result.property_address}
              </div>
              <h2 className="mt-2 font-display text-3xl font-light tracking-tight">{result.owner_name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-black/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-black/60">
                  {result.entity_type}
                </span>
                {result.deceased && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-red-700">
                    <Skull className="h-3 w-3" /> Deceased
                  </span>
                )}
                {result.co_owners?.length > 0 && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-blue-700">
                    Co-owners: {result.co_owners.join(", ")}
                  </span>
                )}
                {result.aka?.length > 0 && (
                  <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] text-purple-700">
                    AKA: {result.aka.join("; ")}
                  </span>
                )}
              </div>
              {result.summary && (
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-black/60">{result.summary}</p>
              )}
            </div>
            <ConfidenceRing score={result.confidence_score} />
          </div>

          {/* Contact info */}
          <div className="grid gap-4 md:grid-cols-3">
            <ContactCard icon={Phone} label="Phone" value={result.contact_phone} />
            <ContactCard icon={Mail} label="Email" value={result.contact_email} />
            <ContactCard icon={MapPin} label="Mailing Address" value={result.mailing_address} />
          </div>

          {/* Relatives / Heirs */}
          {result.relatives?.length > 0 && (
            <div className="rounded-lg border border-black/10 bg-white p-5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#c38a1b]" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em]">
                  Relatives & Heirs ({result.relatives.length})
                </h3>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {result.relatives.map((rel, i) => (
                  <div key={i} className="rounded-md border border-black/10 bg-[#faf9f6] p-3">
                    <p className="text-sm font-medium">{rel.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-black/40">{rel.relationship || "relative"}</p>
                    <div className="mt-1.5 space-y-0.5 text-xs text-black/60">
                      {rel.contact_phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {rel.contact_phone}</p>}
                      {rel.contact_email && <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {rel.contact_email}</p>}
                    </div>
                    {rel.source && <p className="mt-1.5 text-[10px] text-black/30">{rel.source}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ownership chain */}
          {result.ownership_chain?.length > 0 && (
            <div className="rounded-lg border border-black/10 bg-white p-5">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[#c38a1b]" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em]">Ownership Chain</h3>
              </div>
              <div className="mt-3 space-y-2">
                {result.ownership_chain.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-md border border-black/10 bg-[#faf9f6] px-3 py-2.5 text-xs">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black text-[#e4b653]">{i + 1}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {t.from_owner || "—"} <span className="text-black/30">→</span> {t.to_owner || "—"}
                      </p>
                      <p className="text-[10px] text-black/40">
                        {t.transfer_date || "Date unknown"} · {t.transfer_type || "Transfer"}
                        {t.sale_price ? ` · $${t.sale_price.toLocaleString()}` : ""}
                      </p>
                    </div>
                    {t.source && <span className="text-[10px] text-black/30">{t.source}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Methods attempted — the exhaustive checklist */}
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-[#c38a1b]" />
              <h3 className="text-sm font-semibold uppercase tracking-[0.15em]">
                Methods & Sources Exhausted ({result.methods?.length || 0})
              </h3>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(result.methods || []).map((m, i) => {
                const Icon = methodIcon(m.method);
                return (
                  <div key={i} className="flex items-start gap-2.5 rounded-md border border-black/10 bg-[#faf9f6] p-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-black/50" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-medium">{m.method}</p>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${statusStyle(m.status)}`}>
                          <StatusIcon status={m.status} /> {m.status}
                        </span>
                      </div>
                      {m.source && <p className="mt-0.5 text-[10px] text-black/40">{m.source}</p>}
                      {m.result && <p className="mt-1 text-[11px] leading-relaxed text-black/55">{m.result}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sources */}
          {result.sources?.length > 0 && (
            <div className="rounded-lg border border-black/10 bg-white p-5">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-[#c38a1b]" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em]">Sources Found ({result.sources.length})</h3>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {result.sources.map((s, i) => (
                  <span key={i} className="rounded-full border border-black/10 bg-black/[0.02] px-2.5 py-1 text-[10px] text-black/55">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="mt-6 rounded-lg border border-dashed border-black/15 bg-white/50 p-12 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-black/15" />
          <p className="mt-3 text-sm text-black/40">
            Enter a property address above and run the engine. It will search every public source to identify the owner.
          </p>
        </div>
      )}
    </div>
  );
}

function ContactCard({ icon: Icon, label, value }) {
  return (
    <div className={`rounded-lg border p-4 ${value ? "border-black/10 bg-white" : "border-dashed border-black/10 bg-white/40"}`}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-black/40">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className={`mt-1.5 text-sm ${value ? "font-medium text-black" : "text-black/30"}`}>
        {value || "Not found"}
      </p>
    </div>
  );
}

function UserSearch() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8" r="5" />
      <path d="M14.5 12.5 21 19" />
      <path d="M21 21l-1.5-1.5" />
    </svg>
  );
}