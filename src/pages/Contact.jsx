import React, { useState } from "react";
import { Phone, Mail, MapPin, ShieldCheck, ArrowRight } from "lucide-react";
import Seo from "@/components/Seo";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`PropertyIntel inquiry from ${form.name || "a visitor"}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name}\n${form.email}`);
    window.location.href = `mailto:steve@giordanocustoms.com?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div>
      <Seo
        title="Contact — Licensed Florida Real Estate Broker"
        description="Contact Hidden Property Intel and Steve Giordano, licensed Florida real estate broker. Whether you're an investor looking for off-market inventory or a property owner facing a distressed situation, we respond within one business day."
        keywords="contact distressed property buyer, sell distressed house Florida, real estate investor contact, cash offer contact, Florida real estate broker, Steve Giordano, Giordano Customs"
        path="/contact"
        jsonLd={[
          { "@context": "https://schema.org", "@type": "ContactPage", "name": "Contact Hidden Property Intel", "description": "Contact a licensed Florida real estate broker for off-market property deals and distressed property sales.", "url": "https://hiddenpropertyintel.com/contact" },
          {
            "@context": "https://schema.org", "@type": "LocalBusiness", "@id": "https://hiddenpropertyintel.com/#broker",
            "name": "Giordano Customs — Hidden Property Intel",
            "telephone": "+19548848885", "email": "steve@giordanocustoms.com", "url": "https://hiddenpropertyintel.com/contact", "priceRange": "$$$",
            "address": { "@type": "PostalAddress", "streetAddress": "951 SW Country Club Dr, Suite 102", "addressLocality": "Port St. Lucie", "addressRegion": "FL", "postalCode": "34986", "addressCountry": "US" },
            "geo": { "@type": "GeoCoordinates", "latitude": 27.2730, "longitude": -80.3580 },
            "areaServed": { "@type": "State", "name": "Florida" },
            "openingHoursSpecification": { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "09:00", "closes": "17:00" },
            "knowsAbout": ["Distressed Property", "Pre-Foreclosure", "Probate Real Estate", "Real Estate Investment", "Property Valuation", "Cash Offers", "Smart Contract Escrow"]
          }
        ]}
      />

      <section className="z-page-hero">
        <p className="z-page-eyebrow">Contact</p>
        <h1 className="z-page-h1">Talk to a licensed broker.</h1>
        <p className="z-page-lead">Whether you're an investor looking for off-market inventory or a property owner facing a distressed situation, our team will respond within one business day. All inquiries are confidential.</p>
      </section>

      <section className="z-section-pad" style={{ paddingTop: 8 }}>
        <div className="z-grid-2">
          {/* Direct contact */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--z-muted)" }}>Direct contact</p>
            <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
              <a href="tel:+19548848885" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--z-surface)", display: "grid", placeItems: "center", flexShrink: 0 }}><Phone size={18} style={{ color: "var(--z-blue)" }} /></span>
                <span><b style={{ display: "block", color: "var(--z-ink)", fontSize: 16 }}>954-884-8885</b><span style={{ fontSize: 13, color: "var(--z-muted)" }}>Steve Giordano, Licensed Real Estate Broker</span></span>
              </a>
              <a href="mailto:steve@giordanocustoms.com" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--z-surface)", display: "grid", placeItems: "center", flexShrink: 0 }}><Mail size={18} style={{ color: "var(--z-blue)" }} /></span>
                <span><b style={{ display: "block", color: "var(--z-ink)", fontSize: 16 }}>steve@giordanocustoms.com</b><span style={{ fontSize: 13, color: "var(--z-muted)" }}>Email — replies within one business day</span></span>
              </a>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--z-surface)", display: "grid", placeItems: "center", flexShrink: 0 }}><MapPin size={18} style={{ color: "var(--z-blue)" }} /></span>
                <span><b style={{ display: "block", color: "var(--z-ink)", fontSize: 16 }}>951 SW Country Club Dr, Suite 102</b><span style={{ fontSize: 13, color: "var(--z-muted)" }}>Port St. Lucie, Florida 34986</span></span>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--z-surface)", display: "grid", placeItems: "center", flexShrink: 0 }}><ShieldCheck size={18} style={{ color: "var(--z-blue)" }} /></span>
                <span><b style={{ display: "block", color: "var(--z-ink)", fontSize: 16 }}>Strategic Minds AI LLC</b><span style={{ fontSize: 13, color: "var(--z-muted)" }}>Technology & AI Operations · Hidden Property Intel</span></span>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--z-surface)", display: "grid", placeItems: "center", flexShrink: 0 }}><ShieldCheck size={18} style={{ color: "var(--z-blue)" }} /></span>
                <span><b style={{ display: "block", color: "var(--z-ink)", fontSize: 16 }}>Giordano Customs</b><span style={{ fontSize: 13, color: "var(--z-muted)" }}>Licensed Florida Real Estate Brokerage</span></span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="z-feature-card" style={{ padding: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--z-muted)" }}>Send a message</p>
            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--z-ink)" }}>Name
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ border: "1px solid var(--z-border)", borderRadius: 8, padding: "11px 12px", fontSize: 14, outline: "none", fontFamily: "inherit", color: "var(--z-ink)" }} onFocus={(e) => (e.target.style.borderColor = "var(--z-blue)")} onBlur={(e) => (e.target.style.borderColor = "var(--z-border)")} />
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--z-ink)" }}>Email
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ border: "1px solid var(--z-border)", borderRadius: 8, padding: "11px 12px", fontSize: 14, outline: "none", fontFamily: "inherit", color: "var(--z-ink)" }} onFocus={(e) => (e.target.style.borderColor = "var(--z-blue)")} onBlur={(e) => (e.target.style.borderColor = "var(--z-border)")} />
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--z-ink)" }}>Message
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} style={{ border: "1px solid var(--z-border)", borderRadius: 8, padding: "11px 12px", fontSize: 14, outline: "none", fontFamily: "inherit", color: "var(--z-ink)", resize: "vertical" }} onFocus={(e) => (e.target.style.borderColor = "var(--z-blue)")} onBlur={(e) => (e.target.style.borderColor = "var(--z-border)")} />
              </label>
              <button type="submit" className="v2-btn v2-btn-primary" style={{ width: "100%" }}>
                {sent ? "Opening your email app…" : <>Send message <ArrowRight size={16} /></>}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}