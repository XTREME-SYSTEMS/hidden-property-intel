import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Search, Users, Heart, Building2, RefreshCw, Loader2, ChevronDown, ChevronRight,
  Calendar, Bell, Sparkles, ExternalLink, CheckCircle2, UserSearch,
} from "lucide-react";
import CommsBar from "@/components/portal/CommsBar";
import EnrichedPropertyPanel from "@/components/portal/EnrichedPropertyPanel";

const TABS = [
  { id: "owners", label: "Distressed Owners", icon: Building2 },
  { id: "heirs", label: "Heirs", icon: Heart },
  { id: "investors", label: "Investors", icon: Users },
];

export default function PortalProperties() {
  const { user, role } = useOutletContext();
  const [tab, setTab] = useState("owners");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [investors, setInvestors] = useState([]);
  const [owners, setOwners] = useState([]);
  const [properties, setProperties] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(null);
  const [followBusy, setFollowBusy] = useState(null);
  const [chains, setChains] = useState([]);
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [inv, own, props, ch] = await Promise.all([
          base44.entities.InvestorLead.list("-created_date", 200).catch(() => []),
          base44.entities.Owner.list("-created_date", 300).catch(() => []),
          base44.entities.Property.filter({ status: "active" }, "-created_date", 300).catch(() => []),
          base44.entities.OwnershipChain.list("-created_date", 300).catch(() => []),
        ]);
        setInvestors(inv);
        setOwners(own);
        setProperties(props);
        setChains(ch);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const propById = useMemo(() => {
    const m = new Map();
    properties.forEach((p) => m.set(p.id, p));
    return m;
  }, [properties]);

  const heirs = useMemo(() => owners.filter((o) => o.owner_type === "potential_heir"), [owners]);
  const ownerByProp = useMemo(() => {
    const m = new Map();
    owners.filter((o) => o.owner_type === "current").forEach((o) => { if (o.property_id) m.set(o.property_id, o); });
    return m;
  }, [owners]);
  const chainByProp = useMemo(() => {
    const m = new Map();
    chains.forEach((c) => {
      if (!c.property_id) return;
      const transfers = (c.transfers || []).filter((t) => t.to_owner);
      if (transfers.length) m.set(c.property_id, transfers[transfers.length - 1].to_owner);
    });
    return m;
  }, [chains]);
  const distressedProps = useMemo(() => properties.filter((p) => p.distress_type), [properties]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const match = (s) => !q || (s || "").toLowerCase().includes(q);
    if (tab === "investors") return investors.filter((i) => match(i.name) || match(i.company) || match(i.email));
    if (tab === "heirs") return heirs.filter((o) => match(o.name) || match(o.contact_email) || match(o.relationship_to_property));
    return distressedProps.filter((p) => match(p.address) || match(p.city) || match(p.distress_type));
  }, [tab, search, investors, heirs, distressedProps]);

  const syncSheets = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke("syncToGoogleSheets", {});
      setSheetUrl(res.spreadsheet_url);
    } catch (e) { alert(e.message || "Sync failed"); }
    setSyncing(false);
  };

  const scrapeNames = async () => {
    setScraping(true);
    setScrapeMsg(null);
    try {
      const res = await base44.functions.invoke("scrapeOwnerIntel", {});
      setScrapeMsg(`Cloud-browser scrape complete — ${res.found_names || 0} owner names found of ${res.processed || 0} processed (${res.remaining || 0} remaining).`);
      const [own, props, ch] = await Promise.all([
        base44.entities.Owner.list("-created_date", 300).catch(() => []),
        base44.entities.Property.filter({ status: "active" }, "-created_date", 300).catch(() => []),
        base44.entities.OwnershipChain.list("-created_date", 300).catch(() => []),
      ]);
      setOwners(own);
      setProperties(props);
      setChains(ch);
    } catch (e) { setScrapeMsg(e.message || "Scrape failed"); }
    setScraping(false);
  };

  const toggleFollow = async (entity, id, current) => {
    setFollowBusy(id);
    const next = !current;
    const patch = { follow_up_enabled: next };
    if (next) { const d = new Date(); d.setDate(d.getDate() + 7); patch.next_follow_up_date = d.toISOString(); }
    try {
      await base44.entities[entity].update(id, patch);
      if (entity === "InvestorLead") setInvestors((arr) => arr.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      else setOwners((arr) => arr.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    } catch {}
    setFollowBusy(null);
  };

  const counts = { investors: investors.length, heirs: heirs.length, owners: distressedProps.length };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <p className="eyebrow">Property Command Center</p>
        <h1 className="font-heading text-2xl font-bold" style={{ color: "var(--ink)" }}>Intelligence & Outreach</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Fully enriched properties, separate lists, and one-click SMS / MMS / WhatsApp / AI-voice outreach — fed straight into Xtreme Comms.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setExpanded(null); }} className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition" style={{ background: tab === t.id ? "var(--ink)" : "#fff", color: tab === t.id ? "var(--gold-2)" : "var(--muted)" }}>
              <t.icon className="h-4 w-4" /> {t.label} <span className="rounded-full px-1.5 text-[10px]" style={{ background: tab === t.id ? "rgba(255,255,255,0.15)" : "#f4f6fb" }}>{counts[t.id]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-lg px-3" style={{ border: "1px solid var(--border)", background: "#fff" }}>
          <Search className="h-4 w-4" style={{ color: "var(--muted)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, address, email…" className="h-10 flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--ink)" }} />
        </div>
        <button onClick={syncSheets} disabled={syncing} className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold" style={{ background: "var(--ink)", color: "var(--gold-2)" }}>
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Sync to Sheets
        </button>
        {tab === "owners" && (
          <button onClick={scrapeNames} disabled={scraping} className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold" style={{ border: "1px solid var(--border)", background: "#fff", color: "var(--ink)" }}>
            {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserSearch className="h-4 w-4" />} Scrape Names
          </button>
        )}
      </div>

      {sheetUrl && (
        <div className="mb-4 flex items-center gap-2 rounded-lg p-3" style={{ background: "#eef2fb", border: "1px solid var(--border)" }}>
          <CheckCircle2 className="h-4 w-4" style={{ color: "var(--success)" }} />
          <span className="text-sm" style={{ color: "var(--ink)" }}>Google Sheet ready.</span>
          <a href={sheetUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--gold-3)" }}>Open sheet <ExternalLink className="h-3.5 w-3.5" /></a>
        </div>
      )}
      {scrapeMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg p-3" style={{ background: "#eef2fb", border: "1px solid var(--border)" }}>
          <UserSearch className="h-4 w-4" style={{ color: "var(--gold-3)" }} />
          <span className="text-sm" style={{ color: "var(--ink)" }}>{scrapeMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--gold-3)" }} /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-10 text-center text-sm" style={{ border: "1px solid var(--border)", background: "#fff", color: "var(--muted)" }}>No records found.</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((rec) => {
            const isInvestor = tab === "investors";
            const isHeir = tab === "heirs";
            const prop = isHeir ? propById.get(rec.property_id) : tab === "owners" ? rec : null;
            const owner = isHeir ? rec : tab === "owners" ? ownerByProp.get(rec.id) : null;
            const id = rec.id;
            const open = expanded === id;
            const name = rec.name || (tab === "owners" ? (owner?.name || chainByProp.get(rec.id) || "") : "");
            const phone = rec.contact_phone || (tab === "owners" ? owner?.contact_phone : "");
            const email = rec.contact_email || (tab === "owners" ? owner?.contact_email : "");
            const address = tab === "owners" ? `${rec.address}, ${rec.city}, ${rec.state}` : prop ? `${prop.address}, ${prop.city}, ${prop.state}` : rec.contact_address || "";
            const contactType = isHeir ? "heir" : isInvestor ? "investor" : "owner";
            const followEntity = isInvestor ? "InvestorLead" : "Owner";
            const followOn = rec.follow_up_enabled;
            return (
              <div key={id} className="rounded-xl" style={{ border: "1px solid var(--border)", background: "#fff" }}>
                <div className="flex flex-wrap items-center gap-3 p-3.5">
                  <button onClick={() => setExpanded(open ? null : id)} className="flex items-center gap-3 text-left">
                    {open ? <ChevronDown className="h-4 w-4" style={{ color: "var(--muted)" }} /> : <ChevronRight className="h-4 w-4" style={{ color: "var(--muted)" }} />}
                    <div>
                      <p className="font-semibold" style={{ color: "var(--ink)" }}>{name || "Unknown"}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {isInvestor && [rec.company, rec.region].filter(Boolean).join(" · ")}
                        {isHeir && [rec.relationship_to_property, rec.contact_address].filter(Boolean).join(" · ")}
                        {tab === "owners" && address}
                      </p>
                    </div>
                  </button>
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    {phone && <a href={`tel:${phone}`} className="text-xs font-medium" style={{ color: "var(--gold-3)" }}>{phone}</a>}
                    {email && <a href={`mailto:${email}`} className="text-xs font-medium" style={{ color: "var(--muted)" }}>{email}</a>}
                    {tab === "owners" && rec.estimated_value && <span className="text-xs font-bold" style={{ color: "var(--ink)" }}>${rec.estimated_value.toLocaleString()}</span>}
                    {tab === "owners" && rec.investment_opportunity_score != null && <span className="rounded-md px-2 py-0.5 text-[10px] font-bold" style={{ background: "var(--ink)", color: "var(--gold-2)" }}>{rec.investment_opportunity_score}</span>}
                    <button onClick={() => toggleFollow(followEntity, id, followOn)} disabled={followBusy === id} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-semibold" style={{ border: "1px solid var(--border)", color: followOn ? "var(--success)" : "var(--muted)" }} title="Toggle follow-up">
                      {followOn ? <Bell className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />} {followOn ? "Following" : "Follow"}
                    </button>
                    <CommsBar phone={phone} name={name} address={address} contactType={contactType} propertyId={rec.property_id || id} />
                  </div>
                </div>
                {open && (
                  <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
                    {tab === "owners" || prop ? (
                      <EnrichedPropertyPanel property={tab === "owners" ? rec : prop} owner={owner} />
                    ) : (
                      <div className="text-sm" style={{ color: "var(--muted)" }}>
                        {isInvestor && (
                          <div className="space-y-1">
                            <p><span className="font-medium" style={{ color: "var(--ink)" }}>Target markets:</span> {(rec.target_markets || []).join(", ") || "—"}</p>
                            <p><span className="font-medium" style={{ color: "var(--ink)" }}>Investment types:</span> {(rec.investment_types || []).join(", ") || "—"}</p>
                            <p><span className="font-medium" style={{ color: "var(--ink)" }}>Outreach:</span> {rec.outreach_status} · contacted {rec.contact_count || 0}×</p>
                          </div>
                        )}
                        {isHeir && (
                          <div className="space-y-1">
                            <p><span className="font-medium" style={{ color: "var(--ink)" }}>Relationship:</span> {rec.relationship_to_property || "—"}</p>
                            <p><span className="font-medium" style={{ color: "var(--ink)" }}>Verified:</span> {rec.is_verified ? "Yes" : "No"}</p>
                            {rec.next_of_kin?.length > 0 && <p><span className="font-medium" style={{ color: "var(--ink)" }}>Next of kin:</span> {rec.next_of_kin.map((k) => k.name).join(", ")}</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex items-start gap-2 rounded-lg p-3 text-xs" style={{ background: "#eef2fb", border: "1px solid var(--border)", color: "var(--muted)" }}>
        <Sparkles className="h-4 w-4 shrink-0" style={{ color: "var(--gold-3)" }} />
        <p>AI calls originate from <span className="font-semibold" style={{ color: "var(--ink)" }}>Property Intel · +1-833-700-1239</span> with call recording enabled. Recordings are scored by the QA loop to continuously refine tone, script, and conversion. Run a Vision Cortex strategy session before any outbound batch to choose voice vs. SMS per lead.</p>
      </div>
    </div>
  );
}