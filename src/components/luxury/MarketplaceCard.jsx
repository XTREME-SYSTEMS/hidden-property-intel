import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { money, num } from "@/lib/format";
import { labelFor } from "@/components/DistressBadge";
import { Bed, Bath, Maximize } from "lucide-react";

export default function MarketplaceCard({ property }) {
  const img = property.images?.[0]?.url;
  return (
    <Link to={`/properties/${property.id}`} className="group flex gap-4 rounded-xl border border-[#e0e0e0] bg-white p-3 transition-all hover:border-[#c5a059] hover:shadow-lg sm:gap-5 sm:p-4">
      <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-lg bg-[#121212] sm:w-44">
        {img ? (
          <Image src={img} fittingType="fill" alt={property.address} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-[9px] uppercase tracking-[0.2em] text-white/40">No image</div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-[#c5a059] px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.1em] text-[#0a0a0a]">
          {labelFor(property.distress_type)}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
        <div>
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-display text-sm font-medium tracking-tight sm:text-base">{property.city}, {property.state} {property.zip_code}</p>
            <span className="shrink-0 rounded-full bg-[#0a0a0a] px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-[#c5a059] tabular-nums">
              HPI {Math.round(property.property_score || 0)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.15em] text-[#707070]">{labelFor(property.property_type)} · {labelFor(property.distress_type)}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#707070] sm:text-xs">
            {property.bedrooms != null && <span className="inline-flex items-center gap-1"><Bed className="h-3 w-3" />{property.bedrooms}</span>}
            {property.bathrooms != null && <span className="inline-flex items-center gap-1"><Bath className="h-3 w-3" />{property.bathrooms}</span>}
            {property.square_footage != null && <span className="inline-flex items-center gap-1"><Maximize className="h-3 w-3" />{num(property.square_footage)} sqft</span>}
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#707070]">Asking</p>
            <p className="font-display text-base tabular-nums sm:text-lg">{money(property.proposed_asking_price)}</p>
          </div>
          <p className="text-xs tabular-nums text-[#707070]">Est. {money(property.estimated_value)}</p>
        </div>
      </div>
    </Link>
  );
}