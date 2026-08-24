import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { money } from "@/lib/format";
import { labelFor } from "@/components/DistressBadge";

export default function LuxuryListingCard({ property }) {
  const img = property.images?.[0]?.url;
  return (
    <Link to={`/properties/${property.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#121212]">
        {img ? (
          <Image src={img} fittingType="fill" alt={property.address} className="h-full w-full object-cover opacity-90 transition-transform duration-[1200ms] ease-out group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-[10px] uppercase tracking-[0.3em] text-white/40">No image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-[#c5a059] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.15em] text-[#0a0a0a]">
          {labelFor(property.distress_type)}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-[#0a0a0a]/80 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.15em] text-[#c5a059] tabular-nums backdrop-blur">
          HPI {Math.round(property.property_score || 0)}
        </span>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <p className="font-display text-base leading-tight tracking-tight">{property.city}, {property.state}</p>
          <p className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-white/50">{property.zip_code}</p>
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.25em] text-[#707070]">Asking</p>
          <p className="font-display text-lg tabular-nums">{money(property.proposed_asking_price)}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.25em] text-[#707070]">Est. value</p>
          <p className="text-sm tabular-nums text-[#707070]">{money(property.estimated_value)}</p>
        </div>
      </div>
    </Link>
  );
}