import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { DISTRESS_TYPES as DISTRESS, PROPERTY_TYPES as TYPES } from "@/lib/constants";
const inputCls = "w-full rounded-sm border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-black";

export default function SellerPostProperty() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState(null);
  const [f, setF] = useState({
    address: "", city: "", state: "", zip_code: "", property_type: "residential", distress_type: "pre-foreclosure",
    bedrooms: "", bathrooms: "", square_footage: "", lot_size: "", year_built: "",
    proposed_asking_price: "", description: ""
  });

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const optimize = async (id) => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("optimizeListing", { property_id: id });
      setAi(res.data?.suggestions);
    } catch (e) { /* ignore */ }
    setBusy(false);
  };

  const publish = async () => {
    if (!f.address.trim() || !f.city.trim() || !f.state.trim() || !f.zip_code.trim()) {
      alert("Please fill in the street address, city, state, and ZIP code before publishing.");
      return;
    }
    setBusy(true);
    try {
      const u = await base44.auth.me();
      // Deduplication: check for existing property with same address + zip
      if (f.address && f.zip_code) {
        const existing = await base44.entities.Property.filter({ address: f.address, zip_code: f.zip_code });
        if (existing.length > 0) {
          alert("A property with this address and ZIP code already exists. Redirecting you to it.");
          nav(`/properties/${existing[0].id}`);
          return;
        }
      }
      const payload = {
        ...f,
        bedrooms: f.bedrooms ? Number(f.bedrooms) : undefined,
        bathrooms: f.bathrooms ? Number(f.bathrooms) : undefined,
        square_footage: f.square_footage ? Number(f.square_footage) : undefined,
        lot_size: f.lot_size ? Number(f.lot_size) : undefined,
        year_built: f.year_built ? Number(f.year_built) : undefined,
        proposed_asking_price: f.proposed_asking_price ? Number(f.proposed_asking_price) : undefined,
        seller_id: u.id, source: "user_submitted", status: "active"
      };
      const res = await base44.entities.Property.create(payload);
      // Create or update Seller profile
      const existingSeller = await base44.entities.Seller.filter({ user_id: u.id });
      if (!existingSeller[0]) {
        await base44.entities.Seller.create({
          user_id: u.id,
          name: u.full_name || u.email,
          email: u.email,
          property_count: 1,
          joined_at: new Date().toISOString()
        });
      } else {
        await base44.entities.Seller.update(existingSeller[0].id, {
          property_count: (existingSeller[0].property_count || 0) + 1
        });
      }
      nav(`/properties/${res.id}`);
    } catch (e) { alert(e.message); }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-12">
      <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Post your property — free</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight">Step {step} of 4</h1>

      {step === 1 && (
        <div className="mt-10 space-y-5">
          <Field label="Street address"><input className={inputCls} value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="City"><input className={inputCls} value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
            <Field label="State"><input className={inputCls} value={f.state} onChange={(e) => set("state", e.target.value)} /></Field>
            <Field label="ZIP"><input className={inputCls} value={f.zip_code} onChange={(e) => set("zip_code", e.target.value)} /></Field>
          </div>
          <Field label="Property type"><select className={inputCls} value={f.property_type} onChange={(e) => set("property_type", e.target.value)}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
          <Field label="Distress situation"><select className={inputCls} value={f.distress_type} onChange={(e) => set("distress_type", e.target.value)}>{DISTRESS.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}</select></Field>
        </div>
      )}

      {step === 2 && (
        <div className="mt-10 grid grid-cols-2 gap-4">
          <Field label="Bedrooms"><input type="number" className={inputCls} value={f.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} /></Field>
          <Field label="Bathrooms"><input type="number" className={inputCls} value={f.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} /></Field>
          <Field label="Square footage"><input type="number" className={inputCls} value={f.square_footage} onChange={(e) => set("square_footage", e.target.value)} /></Field>
          <Field label="Lot size (sqft)"><input type="number" className={inputCls} value={f.lot_size} onChange={(e) => set("lot_size", e.target.value)} /></Field>
          <Field label="Year built"><input type="number" className={inputCls} value={f.year_built} onChange={(e) => set("year_built", e.target.value)} /></Field>
        </div>
      )}

      {step === 3 && (
        <div className="mt-10 space-y-5">
          <Field label="Asking price (optional — AI can suggest after publish)"><input type="number" className={inputCls} value={f.proposed_asking_price} onChange={(e) => set("proposed_asking_price", e.target.value)} /></Field>
          <Field label="Description"><textarea rows={5} className={inputCls} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
        </div>
      )}

      {step === 4 && (
        <div className="mt-10 space-y-5">
          <p className="text-sm text-black/60">Review and publish. After publishing, run AI listing optimization from the property page.</p>
          <div className="rounded-sm border border-black/10 p-5 text-sm">
            <p className="font-display text-lg">{f.address}, {f.city}, {f.state} {f.zip_code}</p>
            <p className="mt-1 text-black/60">{f.property_type} · {f.distress_type.replace(/_/g, " ")}</p>
            <p className="mt-1 text-black/60">{f.bedrooms || "—"} bed · {f.bathrooms || "—"} bath · {f.square_footage || "—"} sqft</p>
            {f.proposed_asking_price && <p className="mt-1 text-black/60">Asking ${Number(f.proposed_asking_price).toLocaleString()}</p>}
          </div>
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        {step > 1 ? (
          <button onClick={back} className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em]"><ArrowLeft className="h-4 w-4" /> Back</button>
        ) : <span />}
        {step < 4 ? (
          <button onClick={next} className="inline-flex items-center gap-2 rounded-sm bg-black px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-white">Continue <ArrowRight className="h-4 w-4" /></button>
        ) : (
          <button onClick={publish} disabled={busy} className="inline-flex items-center gap-2 rounded-sm bg-black px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">Publish</button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.3em] text-black/40">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}