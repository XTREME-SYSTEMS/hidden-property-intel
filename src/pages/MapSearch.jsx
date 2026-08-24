import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { money } from "@/lib/format";
import { labelFor } from "@/components/DistressBadge";
import { Search, List, X } from "lucide-react";

export default function MapSearch() {
  const [all, setAll] = useState(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    base44.entities.Property.filter({ status: "active" }, "-property_score", 200).then(setAll).catch(() => setAll([]));
  }, []);

  const filtered = useMemo(() => {
    if (!all) return [];
    const s = q.trim().toLowerCase();
    return all.filter((p) => {
      if (!p.lat || !p.lng) return false;
      if (s && ![p.address, p.city, p.state, p.zip_code].some((v) => (v || "").toLowerCase().includes(s))) return false;
      return true;
    });
  }, [all, q]);

  const center = filtered[0] ? [filtered[0].lat, filtered[0].lng] : [34.05, -118.24];

  return (
    <div className="relative h-[calc(100vh-154px)] w-full lg:h-[calc(100vh-112px)]">
      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-[1000] bg-[#0a0a0a]/90 px-4 py-3 backdrop-blur lg:px-6">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3">
            <Search className="h-4 w-4 text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by city, state, ZIP…" className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-white/40" />
          </div>
          <Link to="/listings" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-[11px] uppercase tracking-[0.15em] text-white hover:border-[#c5a059] hover:text-[#c5a059]">
            <List className="h-4 w-4" /> <span className="hidden sm:inline">List</span>
          </Link>
        </div>
      </div>

      {/* Map */}
      <MapContainer center={center} zoom={10} className="h-full w-full" style={{ background: "#1a1a1a" }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap &copy; CARTO' />
        {filtered.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={18}
            pathOptions={{ color: "#c5a059", fillColor: "#c5a059", fillOpacity: 0.9 }}
            eventHandlers={{ click: () => setSelected(p) }}
          >
            <Popup className="dark-map-popup">
              <div className="min-w-[180px]">
                <p className="font-medium text-[#0a0a0a]">{p.city}, {p.state}</p>
                <p className="text-xs text-[#707070]">{labelFor(p.distress_type)}</p>
                <p className="mt-1 font-semibold tabular-nums text-[#0a0a0a]">{money(p.proposed_asking_price)}</p>
                <Link to={`/properties/${p.id}`} className="mt-2 inline-block text-xs font-medium text-[#c5a059]">View details →</Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Selected property preview card */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] sm:right-auto sm:w-80">
          <div className="overflow-hidden rounded-xl border border-[#e0e0e0] bg-white shadow-2xl">
            <div className="relative aspect-[16/10] bg-[#121212]">
              {selected.images?.[0]?.url ? (
                <Image src={selected.images[0].url} fittingType="fill" alt={selected.address} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-[10px] uppercase tracking-[0.2em] text-white/40">No image</div>
              )}
              <span className="absolute left-2 top-2 rounded-full bg-[#c5a059] px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.1em] text-[#0a0a0a]">
                {labelFor(selected.distress_type)}
              </span>
              <button onClick={() => setSelected(null)} className="absolute right-2 top-2 rounded-full bg-[#0a0a0a]/80 p-1.5 text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-4">
              <p className="font-display text-sm font-medium">{selected.city}, {selected.state} {selected.zip_code}</p>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#707070]">Asking</p>
                  <p className="font-display text-lg tabular-nums">{money(selected.proposed_asking_price)}</p>
                </div>
                <span className="rounded-full bg-[#0a0a0a] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.1em] text-[#c5a059] tabular-nums">
                  HPI {Math.round(selected.property_score || 0)}
                </span>
              </div>
              <Link to={`/properties/${selected.id}`} className="mt-3 block rounded-lg bg-[#c5a059] py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0a0a0a] hover:bg-[#c5a059]/90">
                View Property
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Loading / empty */}
      {all === null && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
          <p className="text-sm text-white/60">Loading map…</p>
        </div>
      )}
      {all !== null && filtered.length === 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-[#0a0a0a] px-5 py-2.5 text-xs text-white/70">
          No properties with coordinates found.
        </div>
      )}
    </div>
  );
}