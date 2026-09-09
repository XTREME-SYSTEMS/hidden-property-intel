import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Check, Loader2 } from "lucide-react";

const FEATURES = {
  updates: { title: "Deal Alerts & Updates", desc: "Get notified the moment distressed properties matching your criteria hit the market." },
  favorites: { title: "Save Favorites", desc: "Bookmark properties and track price changes and new bids on your watchlist." },
  plan: { title: "Your Investment Plan", desc: "Get a personalized deal roadmap from our AI based on your budget and goals." },
  inbox: { title: "Direct AI Messaging", desc: "Chat directly with Eden, your AI deal analyst, anytime." },
};

export default function V2LeadCapture({ open, onClose, feature = "updates" }) {
  const f = FEATURES[feature] || FEATURES.updates;
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [status, setStatus] = useState("idle");
  const [err, setErr] = useState("");

  if (!open) return null;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim()) { setErr("Please enter your first name."); return; }
    if (!form.email && !form.phone) { setErr("Enter either an email or a phone number."); return; }
    setStatus("loading");
    setErr("");
    try {
      const res = await base44.functions.invoke("captureLead", { ...form, feature });
      if (res?.error) throw new Error(res.error);
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setErr(e.message || "Something went wrong. Please try again.");
    }
  };

  const close = () => {
    setStatus("idle");
    setErr("");
    setForm({ first_name: "", last_name: "", email: "", phone: "" });
    onClose();
  };

  return (
    <div className="z-lead-overlay" onClick={close}>
      <div className="z-lead-modal" onClick={(e) => e.stopPropagation()}>
        <button className="z-lead-close" onClick={close} aria-label="Close"><X size={18} /></button>

        {status === "success" ? (
          <div className="z-lead-success">
            <div className="z-lead-check"><Check size={32} /></div>
            <h3>You're in, {form.first_name}!</h3>
            <p>Eden, our AI agent, just reached out to introduce herself and share matching deals. Check your {form.email ? "inbox" : "messages"} — she'll help you get started and tell you about our other services.</p>
            <button className="v2-btn v2-btn-primary" onClick={close}>Got it</button>
          </div>
        ) : (
          <>
            <div className="z-lead-head">
              <span className="z-lead-eyebrow">Hidden Property Intel</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
            <form className="z-lead-form" onSubmit={submit}>
              <div className="z-lead-row">
                <label>First name<input value={form.first_name} onChange={set("first_name")} placeholder="Jane" required /></label>
                <label>Last name<input value={form.last_name} onChange={set("last_name")} placeholder="Doe" /></label>
              </div>
              <label>Email<input type="email" value={form.email} onChange={set("email")} placeholder="jane@email.com" /></label>
              <label>Mobile (for SMS updates)<input type="tel" value={form.phone} onChange={set("phone")} placeholder="+1 555 000 1234" /></label>
              <p className="z-lead-hint">Eden, our AI agent, will text or email you to introduce herself and share matching deals. No spam, opt out anytime.</p>
              {err && <p className="z-lead-err">{err}</p>}
              <button className="v2-btn v2-btn-primary" type="submit" disabled={status === "loading"}>
                {status === "loading" ? <><Loader2 size={16} className="spin" /> Sending…</> : "Sign me up"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}