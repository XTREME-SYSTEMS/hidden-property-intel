import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Home, FileText, Users, DollarSign, PenTool, Search, Calendar, BarChart3,
  Shield, Briefcase, ChevronRight, Loader2, Download, Send, Check, AlertTriangle,
  FileSignature, Building2, Scale, HelpCircle, Calculator
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import DashboardFAQ from "@/components/DashboardFAQ";

export default function AgentDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disclosures, setDisclosures] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [signLoading, setSignLoading] = useState(false);
  const [signResult, setSignResult] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.Deal.list().then(setDeals).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const genDisclosures = async () => {
    setGenLoading(true);
    try {
      const res = await base44.functions.invoke("generateLegalDisclosures", { disclosure_types: "all" });
      setDisclosures(res.data);
    } catch (e) { setDisclosures({ error: e.message }); }
    setGenLoading(false);
  };

  const signDoc = async (docTitle, docContent, role) => {
    setSignLoading(true); setSignResult(null);
    try {
      const res = await base44.functions.invoke("signDocument", {
        document_type: "disclosure",
        document_title: docTitle,
        document_content: docContent,
        signer_name: user?.full_name || "Agent",
        signer_email: user?.email || "agent@example.com",
        signer_role: role || "agent",
      });
      setSignResult(res.data);
    } catch (e) { setSignResult({ error: e.message }); }
    setSignLoading(false);
  };

  const downloadDoc = (title, content) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${title.replace(/\s+/g, "_")}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "deals", label: "Deal Pipeline", icon: Briefcase },
    { id: "documents", label: "Documents & Disclosures", icon: FileText },
    { id: "sign", label: "Digital Signatures", icon: PenTool },
    { id: "commissions", label: "Commission Tracker", icon: DollarSign },
    { id: "tools", label: "Agent Tools", icon: Shield },
    { id: "faq", label: "FAQ", icon: HelpCircle },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Agent Portal</p>
        <h1 className="mt-2 font-display text-3xl font-light tracking-tight">Agent Dashboard</h1>
        <p className="mt-2 text-sm text-black/50">Full toolkit for licensed Florida real estate professionals</p>
      </div>

      {/* License status */}
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <Shield className="h-5 w-5 text-emerald-600" />
        <div>
          <p className="text-sm font-medium text-emerald-800">Licensed Agent Access</p>
          <p className="text-xs text-emerald-600">Full MLS comps, commission tracking, co-marketing, and digital signature tools enabled</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-black/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs ${activeTab === t.id ? "border-black text-black" : "border-transparent text-black/40 hover:text-black"}`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Active Deals" value={deals.length} icon={Briefcase} />
            <StatCard label="Pipeline Value" value={`$${deals.reduce((s, d) => s + (d.acquisition_price || 0), 0).toLocaleString()}`} icon={DollarSign} />
            <StatCard label="Closing This Month" value={deals.filter(d => d.stage === "closing").length} icon={Calendar} />
            <StatCard label="Commission Earned" value={`$${deals.filter(d => d.status === "won").reduce((s, d) => s + (d.projected_profit || 0) * 0.03, 0).toLocaleString()}`} icon={DollarSign} />
          </div>
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <h3 className="text-sm font-medium">Quick Actions</h3>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <ActionCard icon={FileText} title="Generate Disclosures" desc="FL-mandated forms" onClick={() => setActiveTab("documents")} />
              <ActionCard icon={PenTool} title="Send for Signature" desc="Digital contract signing" onClick={() => setActiveTab("sign")} />
              <ActionCard icon={Search} title="Search Properties" desc="MLS comps & listings" to="/listings" />
              <ActionCard icon={Calculator} title="Deal Calculator" desc="Profit split analysis" to="/deal-calculator" />
              <ActionCard icon={Building2} title="Smart Contracts" desc="Blockchain escrow" to="/admin" />
              <ActionCard icon={Scale} title="Fair Housing Check" desc="Compliance audit" onClick={() => setActiveTab("tools")} />
            </div>
          </div>
        </div>
      )}

      {/* Deals */}
      {activeTab === "deals" && (
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h3 className="mb-4 text-sm font-medium">Deal Pipeline</h3>
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-black/30" /> : deals.length === 0 ? (
            <p className="text-sm text-black/40">No deals yet. Deals appear here when you create them from properties.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-black/10 text-left text-[10px] uppercase tracking-[0.2em] text-black/40">
                  <th className="pb-3 pr-4">Property</th><th className="pb-3 pr-4">Stage</th><th className="pb-3 pr-4">Acquisition</th><th className="pb-3 pr-4">ARV</th><th className="pb-3 pr-4">Est. Commission</th><th className="pb-3">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-black/5">
                  {deals.map((d) => (
                    <tr key={d.id}>
                      <td className="py-3 pr-4 font-medium">{d.property_id ? "Property #" + d.property_id.slice(0, 8) : "—"}</td>
                      <td className="py-3 pr-4 capitalize">{d.stage}</td>
                      <td className="py-3 pr-4">{d.acquisition_price ? `$${Number(d.acquisition_price).toLocaleString()}` : "—"}</td>
                      <td className="py-3 pr-4">{d.arv ? `$${Number(d.arv).toLocaleString()}` : "—"}</td>
                      <td className="py-3 pr-4 text-emerald-600">{d.acquisition_price ? `$${(d.acquisition_price * 0.03).toLocaleString()}` : "—"}</td>
                      <td className="py-3"><span className="rounded-full bg-black/5 px-2.5 py-1 text-[10px] uppercase">{d.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Documents */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Generate Florida-Mandated Disclosures</h3>
                <p className="mt-1 text-xs text-black/50">Auto-generates all required FL disclosure forms with one click</p>
              </div>
              <button onClick={genDisclosures} disabled={genLoading} className="inline-flex items-center gap-1.5 rounded-md bg-black px-4 py-2 text-xs text-white disabled:opacity-50">
                {genLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} Generate All
              </button>
            </div>
          </div>
          {disclosures?.error && <div className="rounded-md bg-red-50 p-3 text-xs text-red-700">{disclosures.error}</div>}
          {disclosures?.disclosures && (
            <div className="space-y-3">
              {Object.entries(disclosures.disclosures).map(([key, content]) => (
                <div key={key} className="rounded-lg border border-black/10 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium capitalize">{key.replace(/_/g, " ")} Disclosure</p>
                    <div className="flex gap-2">
                      <button onClick={() => signDoc(`${key} disclosure`, content, "agent")} disabled={signLoading} className="inline-flex items-center gap-1 rounded-md border border-black/15 px-3 py-1.5 text-xs hover:bg-black hover:text-white disabled:opacity-50">
                        {signLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PenTool className="h-3 w-3" />} Sign
                      </button>
                      <button onClick={() => downloadDoc(key, content)} className="rounded-md border border-black/15 p-1.5 hover:bg-black hover:text-white"><Download className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <pre className="mt-3 max-h-48 overflow-auto rounded bg-gray-900 p-3 text-[10px] leading-relaxed text-white/80 whitespace-pre-wrap">{content}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sign */}
      {activeTab === "sign" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <div className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-black/40" />
              <h3 className="text-sm font-medium">Digital Signature System</h3>
            </div>
            <p className="mt-2 text-xs text-black/50">ESIGN Act + FL Electronic Commerce Act compliant. Every signature is cryptographically hashed (SHA-256) with IP, timestamp, and user agent recorded for legal admissibility.</p>
            {signResult && !signResult.error && (
              <div className="mt-4 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700">
                <p className="flex items-center gap-1.5"><Check className="h-4 w-4" /> Document signed successfully</p>
                <p>Signature ID: <code>{signResult.signature_id}</code></p>
                <p>Document Hash: <code className="break-all text-[10px]">{signResult.document_hash}</code></p>
                <p>Signed At: {new Date(signResult.signed_at).toLocaleString()}</p>
                <button onClick={() => downloadDoc("signature_certificate", signResult.certificate)} className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 text-white"><Download className="h-3 w-3" /> Download Certificate</button>
              </div>
            )}
            {signResult?.error && <div className="mt-3 rounded-md bg-red-50 p-3 text-xs text-red-700">{signResult.error}</div>}
          </div>
        </div>
      )}

      {/* Commissions */}
      {activeTab === "commissions" && (
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h3 className="mb-4 text-sm font-medium">Commission Tracker</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-black/10 text-left text-[10px] uppercase tracking-[0.2em] text-black/40">
                <th className="pb-3 pr-4">Deal</th><th className="pb-3 pr-4">Stage</th><th className="pb-3 pr-4">Sale Price</th><th className="pb-3 pr-4">Rate</th><th className="pb-3 pr-4">Commission</th><th className="pb-3">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-black/5">
                {deals.filter(d => d.arv).map((d) => (
                  <tr key={d.id}>
                    <td className="py-3 pr-4 font-medium">Deal #{d.id.slice(0, 8)}</td>
                    <td className="py-3 pr-4 capitalize">{d.stage}</td>
                    <td className="py-3 pr-4">${Number(d.arv).toLocaleString()}</td>
                    <td className="py-3 pr-4">3%</td>
                    <td className="py-3 pr-4 text-emerald-600 font-medium">${(d.arv * 0.03).toLocaleString()}</td>
                    <td className="py-3"><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] uppercase text-amber-700">{d.status === "won" ? "Earned" : "Pending"}</span></td>
                  </tr>
                ))}
                {deals.filter(d => d.arv).length === 0 && <tr><td colSpan={6} className="py-6 text-center text-xs text-black/40">No commission-earning deals yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tools */}
      {activeTab === "tools" && (
        <div className="grid grid-cols-2 gap-3">
          <ToolCard icon={FileText} title="Buyer Representation Agreement" desc="FL BRBA generator with digital signature" />
          <ToolCard icon={Users} title="Co-Marketing Agreement" desc="Partner with investors, split commissions" />
          <ToolCard icon={Search} title="MLS Comps" desc="Pull comparable sales for ARV validation" />
          <ToolCard icon={Building2} title="Listing Syndication" desc="Push to MLS, Zillow, Realtor.com" />
          <ToolCard icon={Calendar} title="Showing Scheduler" desc="Online booking for property showings" />
          <ToolCard icon={Scale} title="Fair Housing Audit" desc="Auto-check outreach for compliance" />
          <ToolCard icon={PenTool} title="Offer Management" desc="Track offers, counter-offers, deadlines" />
          <ToolCard icon={FileSignature} title="Notary Integration" desc="Remote online notarization (RON)" />
        </div>
      )}

      {/* FAQ */}
      {activeTab === "faq" && <DashboardFAQ type="agent" />}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return <div className="rounded-lg border border-black/10 bg-white p-4"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-black/40" /><p className="text-[10px] uppercase tracking-[0.15em] text-black/40">{label}</p></div><p className="mt-2 font-display text-xl font-light">{value}</p></div>;
}

function ActionCard({ icon: Icon, title, desc, onClick, to }) {
  const inner = <div className="rounded-lg border border-black/10 p-4 transition hover:border-black/30 hover:bg-gray-50"><Icon className="h-5 w-5 text-black/40" /><p className="mt-2 text-sm font-medium">{title}</p><p className="text-[10px] text-black/40">{desc}</p></div>;
  return to ? <Link to={to}>{inner}</Link> : <button onClick={onClick} className="text-left">{inner}</button>;
}

function ToolCard({ icon: Icon, title, desc }) {
  return <div className="rounded-lg border border-black/10 bg-white p-4"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-black/40" /><p className="text-sm font-medium">{title}</p></div><p className="mt-1 text-xs text-black/50">{desc}</p></div>;
}