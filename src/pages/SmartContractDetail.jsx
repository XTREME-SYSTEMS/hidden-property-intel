import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { money } from "@/lib/format";
import { ArrowLeft, FileCode2, CheckCircle2 } from "lucide-react";

export default function SmartContractDetail() {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [property, setProperty] = useState(null);
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const c = await base44.entities.SmartContract.get(id);
      setContract(c);
      const u = await base44.auth.me();
      setUser(u);
      if (c?.property_id) {
        try { const p = await base44.entities.Property.get(c.property_id); setProperty(p); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { load(); }, [id]);

  const sign = async () => {
    // Verify the user is authorized to sign (must be the buyer/investor or seller)
    const isBuyer = contract.investor_id === user?.id;
    const isSeller = contract.seller_id === user?.id;
    const isAdmin = user?.role === "admin";
    if (!isBuyer && !isSeller && !isAdmin) {
      setMsg("You are not a party to this contract and cannot sign it.");
      return;
    }
    setBusy(true);
    try {
      const signedBy = contract.signed_by || [];
      const entry = { user_id: user.id, name: user.full_name || user.email, signed_at: new Date().toISOString(), signature_hash: crypto.randomUUID() };
      const updated = [...signedBy, entry];
      const bothSigned = updated.length >= 2;
      await base44.entities.SmartContract.update(contract.id, { signed_by: updated, status: bothSigned ? "signed" : contract.status });
      setMsg(bothSigned ? "Both parties have signed — contract is fully executed." : "Signature recorded. Waiting for the other party.");
      load();
    } catch (e) { setMsg(e.response?.data?.error || e.message); }
    setBusy(false);
  };

  if (!contract) return <div className="px-6 py-32 text-center text-sm text-black/50">Loading contract…</div>;

  const alreadySigned = (contract.signed_by || []).some((s) => s.user_id === user?.id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 lg:px-12">
      <Link to={property ? `/properties/${property.id}` : "/listings"} className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.3em] text-black/50 hover:text-black">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to property
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Smart contract · Polygon</p>
          <h1 className="mt-2 font-display text-3xl font-light">Escrow agreement</h1>
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${contract.status === "signed" ? "bg-black text-white" : "border border-black/15 text-black/60"}`}>{contract.status}</span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[["Price", money(contract.terms?.price)], ["Earnest money", money(contract.terms?.earnest_money)], ["Closing date", contract.terms?.closing_date || "TBD"], ["Blockchain", "Polygon"]].map(([l, v]) => (
          <div key={l} className="rounded-sm border border-black/10 p-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">{l}</p>
            <p className="mt-1 font-display text-lg">{v}</p>
          </div>
        ))}
      </div>

      {contract.terms?.contingencies?.length > 0 && (
        <div className="mt-4 rounded-sm border border-black/10 p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Contingencies</p>
          <p className="mt-1 text-sm text-black/70">{contract.terms.contingencies.join(" · ")}</p>
        </div>
      )}

      <div className="mt-6 rounded-sm border border-black/10 p-5">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-black/60" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Generated Solidity source</p>
        </div>
        <pre className="mt-3 max-h-96 overflow-auto rounded-sm bg-black p-4 text-[11px] leading-relaxed text-white/90"><code>{contract.source_code || "// No source code on file"}</code></pre>
      </div>

      <div className="mt-6 rounded-sm border border-black/10 p-5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Signatures</p>
        <div className="mt-3 space-y-2">
          {(contract.signed_by || []).map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{s.name}</span>
              <span className="text-black/40">· {new Date(s.signed_at).toLocaleString()}</span>
            </div>
          ))}
          {(!contract.signed_by || contract.signed_by.length === 0) && <p className="text-sm text-black/50">No signatures yet.</p>}
        </div>
        {contract.status !== "signed" && (
          <button onClick={sign} disabled={busy || alreadySigned} className="mt-4 rounded-sm bg-black px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
            {alreadySigned ? "Signed by you" : busy ? "Signing…" : "Sign contract"}
          </button>
        )}
        {msg && <p className="mt-3 text-sm text-black/70">{msg}</p>}
      </div>
    </div>
  );
}