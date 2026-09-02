import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function PortalRouter() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black/10 border-t-black" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login?returnTo=/portal" replace />;

  const dest = user.role === "admin" ? "/admin" : "/investor/dashboard";
  return <Navigate to={dest} replace />;
}