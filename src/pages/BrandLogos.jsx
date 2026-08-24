import React from "react";
import { LOGOS } from "@/lib/luxury";
import { Image } from "@/components/ui/image";

export default function BrandLogos() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-12 lg:py-28">
      <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Brand exploration</p>
      <h1 className="mt-5 font-display text-4xl font-light tracking-tight sm:text-5xl">
        Ten professional logo directions.
      </h1>
      <p className="mt-6 max-w-xl leading-relaxed text-black/60">
        Each option blends a house with a building mark in a modern, professional style. Tell me the number of the
        one you like and I'll apply it to the top-left navigation across the site.
      </p>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LOGOS.map((logo) => (
          <div key={logo.id} className="group overflow-hidden rounded-2xl bg-white ring-1 ring-black/10 transition-shadow hover:shadow-xl">
            <div className="relative aspect-square bg-white">
              <Image src={logo.url} alt={`Logo option ${logo.id}`} fittingType="fit" className="h-full w-full object-contain p-8" />
            </div>
            <div className="flex items-center justify-between border-t border-black/10 px-5 py-4">
              <span className="text-[11px] uppercase tracking-[0.3em] text-black/40">{`Option ${String(logo.id).padStart(2, "0")}`}</span>
              <span className="font-display text-sm">{logo.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}