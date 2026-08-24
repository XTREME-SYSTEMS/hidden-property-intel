import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { money } from "@/lib/format";
import { labelFor } from "@/components/DistressBadge";

export default function LuxuryListingCard({ property }) {
  const img = property.images?.[0]?.url;
  return (
    <Link to={`/properties/${property.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-black">
        {img ? (
          <Image src={img} fittingType="fill" alt={property.address} className="h-full w-full object-cover opacity-90 transition-transform duration-[1200ms] ease-out group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-[10px] uppercase tracking-[0.3em] text-white/40">No image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-sm bg-white/90 px-2.5 py-1 text-[9px] uppercase tracking-[0.25em] text-black backdrop-blur">
          {labelFor(property.distress_type)}
        </span>
        <span className="absolute right-4 top-4 rounded-sm bg-black/70 px-2.5 py-1 text-[9px] uppercase tracking-[0.25em] text-white backdrop-blur tabular-nums">
          Score {Math.round(property.property_score || 0)}
        </span>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="font-display text-lg leading-tight tracking-tight">{property.address}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/60">{property.city}, {property.state}</p>
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-black/40">Asking</p>
          <p className="font-display text-xl tabular-nums">{money(property.proposed_asking_price)}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.3em] text-black/40">Est. value</p>
          <p className="text-sm tabular-nums text-black/60">{money(property.estimated_value)}</p>
        </div>
      </div>
    </Link>
  );
}