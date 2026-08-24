import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Bell } from "lucide-react";

export default function AlertsBell({ user }) {
  const [count, setCount] = useState(0);

  const refresh = () => {
    base44.entities.DealAlert.filter({ read: false })
      .then((a) => setCount(a.length))
      .catch(() => {});
  };

  useEffect(() => {
    if (!user) return;
    refresh();
    const unsub = base44.entities.DealAlert.subscribe(() => refresh());
    return unsub;
  }, [user]);

  if (!user) return null;

  return (
    <Link to="/alerts" className="relative inline-flex h-9 w-9 items-center justify-center text-black/70 hover:text-black" aria-label="Alerts">
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-semibold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}