import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { money } from "@/lib/format";
import { Search, Mail, Users, Home, Heart, Loader2, RefreshCw, ChevronDown, ChevronUp, Phone, MapPin, UserCheck } from "lucide-react";

export default function AdminProbateDashboard() {
  const [properties, setProperties] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [expandedProp, setExpandedProp] = useState(null);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [outreachResult, setOutreachResult] = useState(null);
  const [heirSearchLoading, setHeirSearchLoading] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const props = await base44.entities.Property.filter({ distress_type: "probate_inherited" }, "-created_date", 100);
      setProperties(props);

      // Get all owners for these properties
      const ownerPromises = props.map((p) => base44.entities.Owner.filter({ property_id: p.id }));
      const ownerResults = await Promise.all(ownerPromises);
      const allOwners = ownerResults.flat();
      setOwners(allOwners);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runScrape = async () => {
    setScraping(true); setScrapeResult(null);
    try {
      const res = await base44.functions.invoke("scrapeProbateRecords", { state: "FL", max_results: 15 });
      setScrapeResult(res.data);
      await load();
    } catch (e) {
      setScrapeResult({ error: e.response?.data?.error || e.message });
    }
    setScraping(false);
  };

  const runOutreach = async () => {
    setOutreachLoading(true); setOutreachResult(null);
    try {
      const res = await base44.functions.invoke("outreachProbateHeirs", { limit: 30 });
      setOutreachResult(res.data);
      await load();
    } catch (e) {
      setOutreachResult({ error: e.response?.data?.error || e.message });
    }
    setOutreachLoading(false);
  };

  const findHeirs = async (propertyId) => {
    setHeirSearchLoading((prev) => ({ ...prev, [propertyId]: true }));
    try {
      await base44.functions.invoke("findHeirsForProperty", { property_id: propertyId });
      await load();
    } catch (e) {
      console.error(e);
    }
    setHeirSearchLoading((prev) => ({ ...prev, [propertyId]: false }));
  };

  const getOwnersForProperty = (propId) => owners.filter((o) => o.property_id === propId);
  const deceasedOwner = (propId) => getOwnersForProperty(propId).find((o) => o.owner_type === "previous" && o.relationship_to_property === "deceased owner");
  const heirs = (propId) => getOwnersForProperty(propId).filter((o) => o.owner_type === "potential_heir");

  const stats = {
    total: properties.length,
    withHeirs: properties.filter((p) => heirs(p.id).length > 0).length,
    contactedHeirs: owners.filter((o) => o.owner_type === "potential_heir" && o.outreach_status === "contacted").length,
    reachableHeirs: owners.filter((o) => o.owner_type === "potential_heir" && (o.contact_email || o.contact_phone)).length,
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-[#c38a1b]" />
            <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Probate & Inherited Properties</p>
          </div>
          <h1 className="mt-2 font-display text-3xl font-light tracking-tight">Probate Pipeline</h1>
          <p className="mt-1 text-sm text-black/50">Monitors obituaries and probate court filings for deceased homeowners, finds their heirs, and sends automated outreach.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={runScrape} disabled={scraping} className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2.5 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
            {scraping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5 text-[#c38a1b]" />}
            {scraping ? "Scanning…" : "Scan Now"}
          </button>
          <button onClick={runOutreach} disabled={outreachLoading} className="inline-flex items-center gap-2 rounded-sm border border-black/15 px-4 py-2.5 text-[11px] uppercase tracking-[0.3em] hover:bg-black hover:text-white disabled:opacity-50">
            {outreachLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
            {outreachLoading ? "Sending…" : "Outreach Heirs"}
          </button>
          <button onClick={load} disabled={loading} className="inline-flex items-center justify-center rounded-sm border border-black/15 px-3 py-2.5 text-[11px] hover:bg-black hover:text-white disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 lg:grid-cols-4">
        <Stat icon={Home} label="Probate Properties" value={stats.total} />
        <Stat icon={Users} label="Properties with Heirs" value={stats.withHeirs} tone="emerald" />
        <Stat icon={UserCheck} label="Reachable Heirs" value={stats.reachableHeirs} tone="amber" />
        <Stat icon={Mail} label="Heirs Contacted" value={stats.contactedHeirs} tone="emerald" />
      </div>

      {/* Scrape result */}
      {scrapeResult && (
        <div className={`mt-4 rounded-sm border p-4 text-sm ${scrapeResult.error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {scrapeResult.error ? (
            <p>{scrapeResult.error}</p>
          ) : (
            <div>
              <p className="font-medium">Probate scan complete</p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs">
                <span>Deceased found: <b>{scrapeResult.deceased_found}</b></span>
                <span>Properties created: <b>{scrapeResult.properties_created}</b></span>
                <span>Properties updated: <b>{scrapeResult.properties_updated}</b></span>
                <span>Owners created: <b>{scrapeResult.owners_created}</b></span>
                <span>Heirs identified: <b>{scrapeResult.heirs_identified}</b></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Outreach result */}
      {outreachResult && (
        <div className={`mt-4 rounded-sm border p-4 text-sm ${outreachResult.error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {outreachResult.error ? (
            <p>{outreachResult.error}</p>
          ) : (
            <p><span className="font-medium">Outreach sent:</span> {outreachResult.sent} emails · {outreachResult.skipped} skipped (already contacted) · {outreachResult.properties_scanned} properties scanned</p>
          )}
        </div>
      )}

      {/* Properties list */}
      {loading ? (
        <div className="mt-12 text-center text-sm text-black/40">Loading probate properties…</div>
      ) : properties.length === 0 ? (
        <div className="mt-12 rounded-sm border border-dashed border-black/20 p-16 text-center">
          <Heart className="mx-auto h-8 w-8 text-black/20" />
          <p className="mt-4 font-display text-lg font-light">No probate properties yet.</p>
          <p className="mt-1 text-sm text-black/50">Run a scan to search obituaries and probate filings for deceased homeowners.</p>
          <button onClick={runScrape} disabled={scraping} className="mt-6 inline-flex items-center gap-2 rounded-sm bg-black px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
            {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 text-[#c38a1b]" />}
            {scraping ? "Scanning…" : "Start Probate Scan"}
          </button>
        </div>
      ) : (
        <div className="mt-8 divide-y divide-black/10">
          {properties.map((p) => {
            const deceased = deceasedOwner(p.id);
            const propertyHeirs = heirs(p.id);
            const isExpanded = expandedProp === p.id;
            return (
              <div key={p.id} className="py-4">
                <div
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => setExpandedProp(isExpanded ? null : p.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-black/40" /> : <ChevronDown className="h-4 w-4 text-black/40" />}
                    <div>
                      <p className="font-display text-base">{p.address}, {p.city}, {p.state}</p>
                      <p className="text-xs text-black/50">
                        {deceased ? `Owner: ${deceased.name} (deceased)` : "Deceased owner unknown"}
                        {propertyHeirs.length > 0 && ` · ${propertyHeirs.length} heir(s) found`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {p.estimated_value && <span className="text-sm tabular-nums">{money(p.estimated_value)}</span>}
                    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-violet-700">Probate</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-7 mt-4 space-y-3">
                    {/* Deceased owner info */}
                    {deceased && (
                      <div className="rounded-sm border border-black/10 p-3">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Deceased Owner</p>
                        <p className="mt-1 text-sm font-medium">{deceased.name}</p>
                        <p className="text-xs text-black/50">{deceased.notes || "No additional notes"}</p>
                      </div>
                    )}

                    {/* Heirs */}
                    {propertyHeirs.length > 0 ? (
                      <div>
                        <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-black/40">Identified Heirs ({propertyHeirs.length})</p>
                        <div className="space-y-2">
                          {propertyHeirs.map((h) => (
                            <div key={h.id} className="flex items-center justify-between rounded-sm border border-black/10 p-3">
                              <div>
                                <p className="text-sm font-medium">{h.name}</p>
                                <p className="text-xs text-black/50">{h.relationship_to_property || "heir"} · Source: {h.source || "unknown"}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                {h.contact_email && <span className="flex items-center gap-1 text-xs text-black/60"><Mail className="h-3 w-3" /> {h.contact_email}</span>}
                                {h.contact_phone && <span className="flex items-center gap-1 text-xs text-black/60"><Phone className="h-3 w-3" /> {h.contact_phone}</span>}
                                {h.is_verified && <UserCheck className="h-4 w-4 text-emerald-500" />}
                                <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] ${
                                  h.outreach_status === "contacted" ? "bg-emerald-100 text-emerald-700" :
                                  h.outreach_status === "responded" ? "bg-blue-100 text-blue-700" :
                                  h.outreach_status === "opted_out" ? "bg-red-100 text-red-700" :
                                  "bg-gray-100 text-gray-600"
                                }`}>{h.outreach_status || "new"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-sm border border-dashed border-black/20 p-4 text-center">
                        <p className="text-sm text-black/50">No heirs identified yet.</p>
                        <button
                          onClick={() => findHeirs(p.id)}
                          disabled={heirSearchLoading[p.id]}
                          className="mt-3 inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white disabled:opacity-50"
                        >
                          {heirSearchLoading[p.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3 text-[#c38a1b]" />}
                          {heirSearchLoading[p.id] ? "Searching…" : "Find Heirs"}
                        </button>
                      </div>
                    )}

                    {/* Property details */}
                    <div className="flex flex-wrap gap-4 text-xs text-black/50">
                      {p.bedrooms && <span>Beds: {p.bedrooms}</span>}
                      {p.bathrooms && <span>Baths: {p.bathrooms}</span>}
                      {p.square_footage && <span>Sqft: {p.square_footage.toLocaleString()}</span>}
                      {p.source_url && <a href={p.source_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#c38a1b] hover:underline"><MapPin className="h-3 w-3" /> Source</a>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  const toneCls = tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-black";
  return (
    <div className="bg-white p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-black/40" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">{label}</p>
      </div>
      <p className={`mt-2 font-display text-2xl font-light ${toneCls}`}>{value}</p>
    </div>
  );
}