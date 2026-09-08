import React, { useState } from "react";
import { MessageSquare, Image as ImageIcon, MessageCircle, Phone, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PROPERTY_INTEL_DISPLAY = "+1-833-700-1239";

function digits(phone) {
  if (!phone) return "";
  let d = phone.replace(/[^0-9]/g, "");
  if (d.length === 10) d = "1" + d;
  return d;
}

export default function CommsBar({ phone, name, address, contactType, propertyId }) {
  const [callModal, setCallModal] = useState(null);
  const [calling, setCalling] = useState(false);
  const d = digits(phone);
  const first = (name || "there").split(" ")[0];
  const msg = `Hi ${first}, this is Eden with Property Intel. We came across your property${address ? ` at ${address}` : ""} and wanted to share a potential opportunity — no pressure at all. Would it be ok to chat briefly? You can reach me at 833-700-1239. Warmly, Eden`;

  const openSMS = () => d && window.open(`sms:${d}?body=${encodeURIComponent(msg)}`, "_blank");
  const openMMS = async () => {
    if (d) window.open(`sms:${d}?body=${encodeURIComponent(msg)}`, "_blank");
    try {
      await base44.functions.invoke("xtremeComms", {
        action: "log_event", lead_id: propertyId, event_type: "sent",
        channel: "mms", direction: "outbound", status: "success", message_snippet: msg.slice(0, 200),
      });
    } catch {}
  };
  const openWhatsApp = () => d && window.open(`https://wa.me/${d}?text=${encodeURIComponent(msg)}`, "_blank");

  const aiCall = async () => {
    if (!name) return;
    setCalling(true);
    try {
      const res = await base44.functions.invoke("edenVoiceConfig", {
        action: "orchestrate",
        contact_name: name,
        contact_type: contactType,
        context: address ? `Property: ${address}` : "",
        call_purpose: "outbound introduction",
        voice: "honey",
      });
      setCallModal({ script: res.script, audio_url: res.audio_url });
    } catch (e) {
      setCallModal({ error: e.message || "Failed to generate call" });
    }
    setCalling(false);
  };

  const btn = "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition disabled:opacity-40";

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <button onClick={openSMS} disabled={!d} className={btn} style={{ border: "1px solid var(--border)", color: "var(--ink)" }} title="SMS"><MessageSquare className="h-3.5 w-3.5" /> SMS</button>
        <button onClick={openMMS} disabled={!d} className={btn} style={{ border: "1px solid var(--border)", color: "var(--ink)" }} title="MMS"><ImageIcon className="h-3.5 w-3.5" /> MMS</button>
        <button onClick={openWhatsApp} disabled={!d} className={btn} style={{ border: "1px solid var(--border)", color: "var(--ink)" }} title="WhatsApp"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</button>
        <button onClick={aiCall} disabled={calling || !name} className={btn} style={{ background: "var(--ink)", color: "var(--gold-2)" }} title="AI Voice Call">
          {calling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Phone className="h-3.5 w-3.5" />} AI Call
        </button>
      </div>

      {callModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setCallModal(null)}>
          <div className="w-full max-w-lg rounded-xl p-6" style={{ background: "#fff", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="eyebrow">AI Voice Call</p>
                <h3 className="font-heading text-lg font-bold" style={{ color: "var(--ink)" }}>Eden Skye → {name}</h3>
              </div>
              <button onClick={() => setCallModal(null)}><X className="h-5 w-5" style={{ color: "var(--muted)" }} /></button>
            </div>
            <div className="mb-3 flex items-center gap-2 rounded-lg p-3" style={{ background: "#eef2fb", border: "1px solid var(--border)" }}>
              <Phone className="h-4 w-4 shrink-0" style={{ color: "var(--gold-3)" }} />
              <div className="text-xs">
                <p className="font-semibold" style={{ color: "var(--ink)" }}>Caller ID: Property Intel · {PROPERTY_INTEL_DISPLAY}</p>
                <p style={{ color: "var(--muted)" }}>Call recording enabled · QA scoring & learning active</p>
              </div>
            </div>
            {callModal.error ? (
              <p className="text-sm" style={{ color: "var(--danger)" }}>{callModal.error}</p>
            ) : (
              <>
                <p className="mb-2 text-[10px] uppercase tracking-wide" style={{ color: "var(--muted)" }}>Voice script — sympathy tone · honey voice</p>
                <p className="mb-4 max-h-48 overflow-y-auto rounded-lg p-3 text-sm leading-relaxed" style={{ background: "#f4f6fb", color: "var(--ink)", border: "1px solid var(--border)" }}>{callModal.script}</p>
                {callModal.audio_url && <audio controls src={callModal.audio_url} className="w-full" />}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}