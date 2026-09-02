import React, { useState } from "react";
import { Phone, Mail, MapPin, ShieldCheck } from "lucide-react";

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
    <div className="mx-auto max-w-[1100px] px-6 py-20 lg:px-12">
      <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Contact</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight sm:text-5xl">
        Talk to a licensed broker.
      </h1>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-black/60">
        Whether you're an investor looking for off-market inventory or a property owner facing a distressed situation,
        our team will respond within one business day. All inquiries are confidential.
      </p>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Direct contact</p>
          <div className="mt-6 space-y-6">
            <a href="tel:+17728123930" className="flex items-start gap-4 group">
              <Phone className="mt-0.5 h-5 w-5 text-black/60" />
              <div>
                <p className="font-display text-base">772-812-3930</p>
                <p className="text-xs text-black/50">Steve Giordano, Licensed Real Estate Broker</p>
              </div>
            </a>
            <a href="mailto:steve@giordanocustoms.com" className="flex items-start gap-4 group">
              <Mail className="mt-0.5 h-5 w-5 text-black/60" />
              <div>
                <p className="font-display text-base">steve@giordanocustoms.com</p>
                <p className="text-xs text-black/50">Email — replies within one business day</p>
              </div>
            </a>
            <div className="flex items-start gap-4">
              <MapPin className="mt-0.5 h-5 w-5 text-black/60" />
              <div>
                <p className="font-display text-base">951 SW Country Club Dr, Suite 102</p>
                <p className="text-xs text-black/50">Port St. Lucie, Florida 34986</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-black/60" />
              <div>
                <p className="font-display text-base">Giordano Customs</p>
                <p className="text-xs text-black/50">Licensed Florida Real Estate Brokerage</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-sm border border-black/10 p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Send a message</p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-black/60">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-sm border border-black/15 px-4 py-3 text-sm outline-none focus:border-black" />
            </div>
            <div>
              <label className="text-xs font-medium text-black/60">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-sm border border-black/15 px-4 py-3 text-sm outline-none focus:border-black" />
            </div>
            <div>
              <label className="text-xs font-medium text-black/60">Message</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} className="mt-1 w-full resize-none rounded-sm border border-black/15 px-4 py-3 text-sm outline-none focus:border-black" />
            </div>
            <button type="submit" className="w-full rounded-sm bg-black py-3.5 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-black/80">
              {sent ? "Opening your email app…" : "Send message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}