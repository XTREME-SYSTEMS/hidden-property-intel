import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { money } from "@/lib/luxury";
import { ArrowUpRight } from "lucide-react";

export default function EstateCard({ estate, large }) {
  return (
    <Link to="/listings" className="group block">
      <div className={`relative overflow-hidden bg-black ${large ? "aspect-[16/11]" : "aspect-[4/5]"}`}>
        <Image
          src={estate.img}
          alt={estate.name}
          fittingType="fill"
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
        <span className="absolute left-5 top-5 rounded-sm bg-white/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-black backdrop-blur">
          {estate.tag}
        </span>
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white">
          <div>
            <p className="font-display text-xl tracking-tight">{estate.name}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/70">{estate.location}</p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/40 bg-white/10 backdrop-blur transition-colors group-hover:bg-white group-hover:text-black">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm tabular-nums text-black">{money(estate.price)}</p>
        <p className="text-[11px] uppercase tracking-[0.2em] text-black/50">
          {estate.beds} bed · {estate.baths} bath · {estate.sqft.toLocaleString()} sqft
        </p>
      </div>
    </Link>
  );
}