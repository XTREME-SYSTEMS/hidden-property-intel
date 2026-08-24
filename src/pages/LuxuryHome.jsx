import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { IMAGES, ESTATES, money } from "@/lib/luxury";
import EstateCard from "@/components/luxury/EstateCard";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export default function LuxuryHome() {
  const featured = ESTATES.slice(0, 4);
  return (
    <div className="font-body">
      {/* Hero */}
      <section className="relative h-[92vh] min-h-[640px] w-full overflow-hidden bg-black">
        <Image src={IMAGES.hero} alt="Villa Noir at dusk" fittingType="fill" className="absolute inset-0 h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
        <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-end px-6 pb-20 lg:px-12">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/60">PropertyIntel · A private collection · 2026</p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-light leading-[1.02] tracking-tight text-white sm:text-7xl lg:text-8xl">
            Residences of<br />extraordinary distinction.
          </h1>
          <p className="mt-7 max-w-md text-base leading-relaxed text-white/70">
            PropertyIntel curates the world's most exceptional homes — architectural masterpieces, private estates,
            and unseen sanctuaries — for a clientele that accepts nothing less.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/listings" className="group inline-flex items-center gap-3 rounded-sm bg-white px-7 py-4 text-[11px] uppercase tracking-[0.3em] text-black transition-colors hover:bg-black hover:text-white">
              View the collection
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/listings" className="inline-flex items-center gap-3 rounded-sm border border-white/40 px-7 py-4 text-[11px] uppercase tracking-[0.3em] text-white transition-colors hover:bg-white/10">
              Private enquiry
            </Link>
          </div>
        </div>
      </section>

      {/* Intro statement */}
      <section className="mx-auto max-w-[1400px] px-6 py-24 lg:px-12 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">The PropertyIntel standard</p>
          <p className="font-display text-2xl font-light leading-snug tracking-tight text-black sm:text-3xl">
            We represent fewer than one in a thousand properties we review. Each residence is selected for its
            architectural integrity, provenance, and the singular life it makes possible — then presented with
            the discretion our clients require.
          </p>
        </div>
      </section>

      {/* Featured estates */}
      <section className="mx-auto max-w-[1400px] px-6 pb-24 lg:px-12 lg:pb-32">
        <div className="flex items-end justify-between border-b border-black/10 pb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Featured</p>
            <h2 className="mt-3 font-display text-3xl font-light tracking-tight sm:text-4xl">Currently in the collection</h2>
          </div>
          <Link to="/listings" className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-black hover:text-black/60 sm:flex">
            All residences <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((e) => <EstateCard key={e.id} estate={e} />)}
        </div>
      </section>

      {/* Editorial split — pool estate */}
      <section className="bg-black text-white">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[480px] lg:min-h-[640px]">
            <Image src={IMAGES.pool} alt="Maison Argent" fittingType="fill" className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="flex flex-col justify-center px-6 py-20 lg:px-20">
            <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">Oceanfront · Malibu</p>
            <h3 className="mt-5 font-display text-4xl font-light tracking-tight sm:text-5xl">Maison Argent</h3>
            <p className="mt-6 max-w-md leading-relaxed text-white/60">
              An architectural monolith in white stone and glass, set above a private cove. Eight bedrooms,
              a submerged spa, and a gallery-grade garage — engineered for a life lived largely outdoors.
            </p>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-8 text-sm">
              {[["$32.75M", "Asking"], ["16,500", "Square feet"], ["8", "Bedrooms"]].map(([v, l]) => (
                <div key={l}>
                  <dd className="font-display text-2xl tabular-nums">{v}</dd>
                  <dt className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/40">{l}</dt>
                </div>
              ))}
            </dl>
            <Link to="/listings" className="mt-10 inline-flex w-fit items-center gap-3 border-b border-white/40 pb-2 text-[11px] uppercase tracking-[0.3em] text-white hover:border-white">
              View residence <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Interior triptych */}
      <section className="mx-auto max-w-[1400px] px-6 py-24 lg:px-12 lg:py-32">
        <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Interiors</p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-light tracking-tight sm:text-4xl">
          Considered spaces, photographed in detail.
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { img: IMAGES.living, label: "The Glass Pavilion", sub: "Living volume" },
            { img: IMAGES.kitchen, label: "Casa Bianca", sub: "Kitchen" },
            { img: IMAGES.bedroom, label: "The Monolith", sub: "Primary suite" },
          ].map((t) => (
            <div key={t.label} className="group">
              <div className="relative aspect-[4/5] overflow-hidden bg-black">
                <Image src={t.img} alt={t.label} fittingType="fill" className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="font-display text-lg tracking-tight">{t.label}</p>
                <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Penthouse CTA */}
      <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden bg-black">
        <Image src={IMAGES.penthouse} alt="Sky Residence" fittingType="fill" className="absolute inset-0 h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-[1400px] items-center px-6 lg:px-12">
          <div className="max-w-md text-white">
            <p className="text-[11px] uppercase tracking-[0.4em] text-white/60">Penthouse · Manhattan</p>
            <h3 className="mt-5 font-display text-4xl font-light tracking-tight sm:text-5xl">Sky Residence</h3>
            <p className="mt-5 leading-relaxed text-white/70">
              Five bedrooms above the city, wrapped in floor-to-ceiling glass. $21.4M. By private appointment only.
            </p>
            <Link to="/listings" className="mt-8 inline-flex items-center gap-3 border-b border-white/40 pb-2 text-[11px] uppercase tracking-[0.3em] hover:border-white">
              Request a viewing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-px bg-black/10 sm:grid-cols-4">
          {[
            ["$4.2B", "In closed sales"],
            ["340+", "Residences sold"],
            ["27", "Countries"],
            ["1:1000", "Acceptance rate"],
          ].map(([v, l]) => (
            <div key={l} className="bg-white px-6 py-12 text-center">
              <p className="font-display text-4xl font-light tabular-nums tracking-tight sm:text-5xl">{v}</p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-black/40">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Enquiry */}
      <section className="mx-auto max-w-[1400px] px-6 py-24 lg:px-12 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2">
          <h2 className="font-display text-4xl font-light leading-tight tracking-tight sm:text-5xl">
            Begin a private<br />conversation.
          </h2>
          <div>
            <p className="max-w-md leading-relaxed text-black/60">
              Whether acquiring, selling, or building a collection, our advisors operate with total discretion.
              Share your criteria and we will be in touch within one business day.
            </p>
            <Link to="/listings" className="mt-8 inline-flex items-center gap-3 rounded-sm bg-black px-7 py-4 text-[11px] uppercase tracking-[0.3em] text-white transition-colors hover:bg-black/80">
              Make an enquiry <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}