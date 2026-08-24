import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import DistressBadge from "@/components/DistressBadge";
import ScoreGauge from "@/components/ScoreGauge";
import { money, num } from "@/lib/format";
import { BedDouble, Bath, Ruler } from "lucide-react";

export default function PropertyCard({ property }) {
  const img = property.images?.[0]?.url;
  return (
    <Link
      to={`/properties/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[#E5EDEA] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#E5EDEA]">
        {img ? (
          <Image src={img} alt={property.address} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-xs text-[#6B7B72]">No image</div>
        )}
        <div className="absolute left-3 top-3"><DistressBadge type={property.distress_type} className="bg-white/95 backdrop-blur" /></div>
        <div className="absolute right-3 top-3 rounded-full bg-white/95 p-1 backdrop-blur">
          <ScoreGauge score={property.property_score || 0} size={44} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="font-medium leading-snug text-[#1A2B22]">{property.address}</p>
        <p className="mt-0.5 text-sm text-[#6B7B72]">{property.city}, {property.state} {property.zip_code}</p>

        <div className="mt-3 flex items-center gap-4 text-xs text-[#6B7B72] tabular-nums">
          <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{property.bedrooms ?? "—"}</span>
          <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.bathrooms ?? "—"}</span>
          <span className="inline-flex items-center gap-1"><Ruler className="h-3.5 w-3.5" />{num(property.square_footage)} sqft</span>
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-[#E5EDEA] pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#6B7B72]">Asking</p>
            <p className="text-lg font-semibold tabular-nums text-[#0F2A1D]">{money(property.proposed_asking_price)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-[#6B7B72]">Est. value</p>
            <p className="text-sm tabular-nums text-[#6B7B72]">{money(property.estimated_value)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}