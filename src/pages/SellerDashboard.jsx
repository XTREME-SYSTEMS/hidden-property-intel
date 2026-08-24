import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { money } from "@/lib/format";
import { Plus } from "lucide-react";

export default function SellerDashboard() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        const props = await base44.entities.Property.filter({ seller_id: u.id });
        setProperties(props);
      } catch (e) { /* not logged in */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="px-6 py-32 text-center text-sm text-black/50">Loading…</div>;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Seller dashboard</p>
          <h1 className="mt-3 font-display text-4xl font-light tracking-tight">Your properties</h1>
        </div>
        <Link to="/seller/post-property" className="inline-flex items-center gap-2 rounded-sm bg-black px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-white hover:bg-black/80">
          <Plus className="h-4 w-4" /> Post property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="mt-12 rounded-sm border border-dashed border-black/20 p-16 text-center">
          <p className="font-display text-xl font-light">No properties posted yet.</p>
          <p className="mt-2 text-sm text-black/50">List your distressed property free — AI pricing and negotiation included.</p>
          <Link to="/seller/post-property" className="mt-6 inline-flex rounded-sm bg-black px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-white">Post your property</Link>
        </div>
      ) : (
        <div className="mt-10 divide-y divide-black/10">
          {properties.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-5">
              <div>
                <Link to={`/properties/${p.id}`} className="font-display text-lg hover:underline">{p.address}, {p.city}, {p.state}</Link>
                <p className="text-xs uppercase tracking-[0.2em] text-black/40">{p.status} · {(p.distress_type || "").replace(/_/g, " ")}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">Asking</p>
                  <p className="font-display text-lg tabular-nums">{money(p.proposed_asking_price)}</p>
                </div>
                <Link to={`/seller/negotiation/${p.id}`} className="rounded-sm border border-black/15 px-4 py-2 text-[11px] uppercase tracking-[0.2em] hover:bg-black/5">Negotiate</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}