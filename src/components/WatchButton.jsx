import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bookmark, BookmarkCheck } from "lucide-react";

export default function WatchButton({ propertyId }) {
  const [watching, setWatching] = useState(false);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await base44.auth.me();
        if (!u) { setLoading(false); return; }
        const list = await base44.entities.Watchlist.filter({ property_id: propertyId });
        if (!alive) return;
        setWatching(list.length > 0);
        setRecord(list[0] || null);
      } catch (e) { /* not logged in */ }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [propertyId]);

  const toggle = async () => {
    try {
      const u = await base44.auth.me();
      if (!u) return;
      if (watching && record) {
        await base44.entities.Watchlist.delete(record.id);
        setWatching(false); setRecord(null);
      } else {
        const r = await base44.entities.Watchlist.create({ user_id: u.id, property_id: propertyId });
        setWatching(true); setRecord(r);
      }
    } catch (e) { /* ignore */ }
  };

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition-colors ${
        watching ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-white text-[#1A2B22] ring-1 ring-[#E5EDEA] hover:bg-[#F8FAF9]"
      }`}
    >
      {watching ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {watching ? "Watching" : "Watch"}
    </button>
  );
}