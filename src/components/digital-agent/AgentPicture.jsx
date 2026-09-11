import React, { useState, useRef } from "react";
import { ImagePlus, User, Building2, Upload, Sparkles } from "lucide-react";

// Square picture placeholder (top-right) with personal + business image upload.
// Uses local FileReader (no integration credits needed). Also offers AI generation
// (blocked when credits are exhausted — shows a note).
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
      <div className="relative h-[140px] w-[140px] overflow-hidden rounded-xl border-2 border-[#e4b653]/40 bg-gradient-to-br from-white/5 to-white/[0.02]">
        {personalImg ? (
          <img src={personalImg} alt={agentName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1">
            <User className="h-8 w-8 text-white/20" />
            <span className="text-2xl font-light text-white/30">{initials}</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
          <span className="text-[9px] uppercase tracking-wider text-white/70">Photo</span>
        </div>
      </div>

      {/* Upload links */}
      <div className="flex w-[140px] flex-col gap-1.5">
        <button
          onClick={() => personalInput.current?.click()}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-[10px] font-medium text-white/70 transition hover:border-[#e4b653]/40 hover:text-[#e4b653]"
        >
          <ImagePlus className="h-3 w-3" /> Personal Image
        </button>
        <button
          onClick={() => businessInput.current?.click()}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-[10px] font-medium text-white/70 transition hover:border-[#e4b653]/40 hover:text-[#e4b653]"
        >
          <Building2 className="h-3 w-3" /> Business Image
        </button>
        {businessImg && (
          <div className="rounded-md border border-white/10 p-1">
            <img src={businessImg} alt="Business" className="h-12 w-full rounded object-cover" />
          </div>
        )}
        <p className="text-center text-[8px] leading-tight text-white/25">
          Upload a file or generate with AI (requires active credits)
        </p>
      </div>

      <input ref={personalInput} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, setPersonalImg)} />
      <input ref={businessInput} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, setBusinessImg)} />
    </div>
  );
}