import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, FileSignature, FlaskConical, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function AdminTestLab() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [results, setResults] = useState({});

  // test emails — Jeremy's addresses to clone the loop
  const [investorTestEmail, setInvestorTestEmail] = useState("jeremy@xtremepolishingsystems.com");
  const [sellerTestEmail, setSellerTestEmail] = useState("jeremy@xtremepolishingsystems.com");

  // smart-contract test data — Jeremy Bensen
  const [scForm, setScForm] = useState({
    buyer_name: "Jeremy Bensen",
    buyer_address: "1480 South Ocean Blvd, Pompano Beach, FL 33062",
    price: 175000,
    earnest_money: 5000,
    closing_date: "2026-10-15",
    contingencies: "inspection, financing, clear title",
  });
  const [scResult, setScResult] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const setRes = (key, val) => setResults((r) => ({ ...r, [key]: val }));

  const testInvestorEmail = async () => {
    setBusy("inv"); setRes("inv", null);
    try {
      const res = await base44.functions.invoke("outreachInvestors", { test_email: investorTestEmail });
      setRes("inv", { ok: true, data: res.data });
    } catch (e) { setRes("inv", { ok: false, error: e.response?.data?.error || e.message }); }
    setBusy("");
  };

  const testSellerEmail = async () => {
    setBusy("sell"); setRes("sell", null);
    try {
      const res = await base44.functions.invoke("outreachSellers", { test_email: sellerTestEmail });
      setRes("sell", { ok: true, data: res.data });
    } catch (e) { setRes("sell", { ok: false, error: e.response?.data?.error || e.message }); }
    setBusy("");
  };

  const testSmartContract = async () => {
    setBusy("sc"); setScResult(null);
    try {
      // find or create a test property + seller + investor for Jeremy
      const props = await base44.entities.Property.filter({ address: "1480 South Ocean Blvd" });
      let property = props[0];
      if (!property) {
        property = await base44.entities.Property.create({
          address: "1480 South Ocean Blvd",
          city: "Pompano Beach",
          state: "FL",
          zip_code: "33062",
          distress_type: "tax_delinquent",
          estimated_value: 210000,
          status: "active",
          source: "user_submitted",
        });
      }
      const u = user;
      const res = await base44.functions.invoke("generateSmartContract", {
        property_id: property.id,
        investor_id: u.id,
        seller_id: u.id,
        contract_type: "escrow",
        terms: {
          price: Number(scForm.price),
          earnest_money: Number(scForm.earnest_money),
          closing_date: scForm.closing_date,
          contingencies: scForm.contingencies.split(",").map((c) => c.trim()).filter(Boolean),
        },
      });
      setScResult({ ok: true, data: res.data, propertyId: property.id });
      setRes("sc", { ok: true, data: res.data });
    } catch (e) {
      setScResult({ ok: false, error: e.response?.data?.error || e.message });
      setRes("sc", { ok: false, error: e.response?.data?.error || e.message });
    }
    setBusy("");
  };

  const viewContract = async (id) => {
    try {
      const c = await base44.entities.SmartContract.get(id);
      setScResult((s) => ({ ...s, contract: c }));
    } catch (e) { setScResult((s) => ({ ...s, fetchError: e.message })); }
  };

  if (loading) return <div className="px-6 py-32 text-center text-sm text-black/50">Loading…</div>;
  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-6 py-32 text-center">
        <h1 className="font-display text-3xl font-light">Admin only</h1>
        <p className="mt-3 text-sm text-black/60">You need an admin account to access the test lab.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12">
      <div className="flex items-center gap-3">
        <FlaskConical className="h-7 w-7 text-gold" />
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Admin · Test Lab</p>
          <h1 className="mt-2 font-display text-4xl font-light tracking-tight">System Test Lab</h1>
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-black/60">
        Test the autonomous email engines and the smart-contract generator end-to-end using safe sample data.
        Emails send to the address you enter (use your own to clone the loop). Smart-contract tests create a real
        draft contract record you can inspect.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Investor email test */}
        <div className="rounded-sm border border-black/10 p-7">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-black/60" />
            <h2 className="font-display text-xl">Investor outreach email</h2>
          </div>
          <p className="mt-2 text-xs text-black/50">Sends the polished, personalized investor invitation to the address below (sample: Jeremy @ Xtreme Polishing).</p>
          <label className="mt-5 block text-[10px] uppercase tracking-[0.3em] text-black/40">Test recipient</label>
          <input value={investorTestEmail} onChange={(e) => setInvestorTestEmail(e.target.value)} className="mt-2 w-full rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
          <button onClick={testInvestorEmail} disabled={busy === "inv"} className="mt-4 inline-flex items-center gap-2 rounded-sm bg-black px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
            {busy === "inv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {busy === "inv" ? "Sending…" : "Send test email"}
          </button>
          {results.inv && (
            <div className={`mt-4 flex items-start gap-2 rounded-sm p-3 text-sm ${results.inv.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
              {results.inv.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{results.inv.ok ? `Sent to ${results.inv.data.to} — check the inbox.` : `Error: ${results.inv.error}`}</span>
            </div>
          )}
        </div>

        {/* Seller email test */}
        <div className="rounded-sm border border-black/10 p-7">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-black/60" />
            <h2 className="font-display text-xl">Seller / owner outreach email</h2>
          </div>
          <p className="mt-2 text-xs text-black/50">Sends the personalized cash-offer email (sample: Jeremy, 1480 South Ocean Blvd, Pompano Beach).</p>
          <label className="mt-5 block text-[10px] uppercase tracking-[0.3em] text-black/40">Test recipient</label>
          <input value={sellerTestEmail} onChange={(e) => setSellerTestEmail(e.target.value)} className="mt-2 w-full rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
          <button onClick={testSellerEmail} disabled={busy === "sell"} className="mt-4 inline-flex items-center gap-2 rounded-sm bg-black px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
            {busy === "sell" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {busy === "sell" ? "Sending…" : "Send test email"}
          </button>
          {results.sell && (
            <div className={`mt-4 flex items-start gap-2 rounded-sm p-3 text-sm ${results.sell.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
              {results.sell.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{results.sell.ok ? `Sent to ${results.sell.data.to} — check the inbox.` : `Error: ${results.sell.error}`}</span>
            </div>
          )}
        </div>
      </div>

      {/* Smart contract test */}
      <div className="mt-6 rounded-sm border border-black/10 p-7">
        <div className="flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-black/60" />
          <h2 className="font-display text-xl">Smart-contract generation test</h2>
        </div>
        <p className="mt-2 text-xs text-black/50">Generates a real Solidity 0.8.20 Polygon escrow contract using Jeremy Bensen's test data, stores it as a draft, and lets you inspect the source code + ABI.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-black/40">Buyer name</label>
            <input value={scForm.buyer_name} onChange={(e) => setScForm({ ...scForm, buyer_name: e.target.value })} className="mt-2 w-full rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-[10px] uppercase tracking-[0.3em] text-black/40">Buyer address</label>
            <input value={scForm.buyer_address} onChange={(e) => setScForm({ ...scForm, buyer_address: e.target.value })} className="mt-2 w-full rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-black/40">Price ($)</label>
            <input type="number" value={scForm.price} onChange={(e) => setScForm({ ...scForm, price: e.target.value })} className="mt-2 w-full rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-black/40">Earnest money ($)</label>
            <input type="number" value={scForm.earnest_money} onChange={(e) => setScForm({ ...scForm, earnest_money: e.target.value })} className="mt-2 w-full rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-black/40">Closing date</label>
            <input type="date" value={scForm.closing_date} onChange={(e) => setScForm({ ...scForm, closing_date: e.target.value })} className="mt-2 w-full rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-[10px] uppercase tracking-[0.3em] text-black/40">Contingencies (comma separated)</label>
            <input value={scForm.contingencies} onChange={(e) => setScForm({ ...scForm, contingencies: e.target.value })} className="mt-2 w-full rounded-sm border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
          </div>
        </div>

        <button onClick={testSmartContract} disabled={busy === "sc"} className="mt-5 inline-flex items-center gap-2 rounded-sm bg-black px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
          {busy === "sc" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
          {busy === "sc" ? "Generating contract…" : "Generate test contract"}
        </button>

        {scResult && (
          <div className={`mt-5 rounded-sm p-4 text-sm ${scResult.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
            <div className="flex items-start gap-2">
              {scResult.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <div className="flex-1">
                {scResult.ok ? (
                  <>
                    <p>Contract generated — ID <code className="font-mono text-xs">{scResult.data.smart_contract_id}</code> ({scResult.data.source_code_length} chars of Solidity, name: {scResult.data.contract_name}).</p>
                    <button onClick={() => viewContract(scResult.data.smart_contract_id)} className="mt-2 rounded-sm border border-emerald-700 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-700 hover:text-white">
                      View source code & ABI
                    </button>
                  </>
                ) : (
                  <p>Error: {scResult.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {scResult?.contract && (
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Solidity source code</p>
              <pre className="mt-2 max-h-80 overflow-auto rounded-sm bg-black p-4 text-[11px] leading-relaxed text-green-300"><code>{scResult.contract.source_code}</code></pre>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">ABI</p>
              <pre className="mt-2 max-h-60 overflow-auto rounded-sm bg-black p-4 text-[11px] leading-relaxed text-amber-200"><code>{scResult.contract.abi}</code></pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}