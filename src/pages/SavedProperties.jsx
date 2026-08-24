import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import LuxuryListingCard from "@/components/luxury/LuxuryListingCard";
import { Bookmark } from "lucide-react";

export default function SavedProperties() {
  const [items, setItems] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await base44.auth.me();
        if (!alive) return;
        setUser(u);
        if (!u) { setItems([]); return; }
        const saved = await base44.entities.Watchlist.filter({ user_id: u.id });
        const props = await Promise.all(
          saved.map((w) => base44.entities.Property.get(w.property_id).catch(() => null))
        );
        if (!alive) return;
        setItems(props.filter(Boolean));
      } catch {
        setItems([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!user) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-20 text-center lg:px-12">
        <Bookmark className="mx-auto h-8 w-8 text-[#707070]" />
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Sign in to view saved properties</h1>
        <p className="mt-2 text-sm text-[#707070]">Create a free account to bookmark distressed properties.</p>
        <Link to="/login" className="mt-6 inline-block rounded-md bg-[#c5a059] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0a0a0a]">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <section className="bg-[#0a0a0a] px-6 py-16 text-white lg:px-12 lg:py-20">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#c5a059]">Saved</p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Your watchlist.</h1>
          <p className="mt-4 text-sm text-white/60">{items === null ? "Loading…" : `${items.length} saved ${items.length === 1 ? "property" : "properties"}`}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-10 lg:px-12 lg:py-14">
        {items === null ? (
          <p className="text-sm text-[#707070]">Loading…</p>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <Bookmark className="mx-auto h-8 w-8 text-[#707070]" />
            <p className="mt-4 font-display text-xl font-light">No saved properties yet.</p>
            <p className="mt-2 text-sm text-[#707070]">Browse inventory and tap the bookmark icon to save properties.</p>
            <Link to="/listings" className="mt-6 inline-block rounded-md bg-[#c5a059] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0a0a0a]">Browse inventory</Link>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => <LuxuryListingCard key={p.id} property={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}