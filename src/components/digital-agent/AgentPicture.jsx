import React, { useState, useRef } from "react";
import { ImagePlus, User, Building2 } from "lucide-react";

// Square picture placeholder (top-right) with personal + business image upload.
// Light theme matching the HPI luxury design system.
export default function AgentPicture({ agentName, agentRole, avatarUrl }) {
  const [personalImg, setPersonalImg] = useState(avatarUrl || null);
  const [businessImg, setBusinessImg] = useState(null);
  const personalInput = useRef(null);
  const businessInput = useRef(null);

  const initials = agentName?.split(" ").map(n => n[0]).slice(0, 2).join("") || "??";

  const handleFile = (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setter(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Square picture area */}
      <div className="relative h-[140px] w-[140px] overflow-hidden rounded-xl border-2 border-[#e4b653] bg-gradient-to-br from-[#f7f5f0] to-white">
        {personalImg ? (
          <img src={personalImg} alt={agentName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1">
            <User className="h-8 w-8 text-[#c38a1b]/30" />
            <span className="text-2xl font-light text-[#c38a1b]/40">{initials}</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#12110f]/40 to-transparent px-2 py-1">
          <span className="text-[9px] uppercase tracking-wider text-white">Photo</span>
        </div>
      </div>

      {/* Upload links */}
      <div className="flex w-[140px] flex-col gap-1.5">
        <button
          onClick={() => personalInput.current?.click()}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#e7e1d6] bg-white px-2 py-1.5 text-[10px] font-medium text-[#12110f] transition hover:border-[#c38a1b]/40 hover:text-[#c38a1b]"
        >
          <ImagePlus className="h-3 w-3" /> Personal Image
        </button>
        <button
          onClick={() => businessInput.current?.click()}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#e7e1d6] bg-white px-2 py-1.5 text-[10px] font-medium text-[#12110f] transition hover:border-[#c38a1b]/40 hover:text-[#c38a1b]"
        >
          <Building2 className="h-3 w-3" /> Business Image
        </button>
        {businessImg && (
          <div className="rounded-md border border-[#e7e1d6] p-1">
            <img src={businessImg} alt="Business" className="h-12 w-full rounded object-cover" />
          </div>
        )}
        <p className="text-center text-[8px] leading-tight text-[#6f6a60]/60">
          Upload a file or generate with AI (requires active credits)
        </p>
      </div>

      <input ref={personalInput} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, setPersonalImg)} />
      <input ref={businessInput} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, setBusinessImg)} />
    </div>
  );
}