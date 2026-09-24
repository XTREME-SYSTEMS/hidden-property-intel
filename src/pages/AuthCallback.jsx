import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function AuthCallback() {
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const returnTo = base44.auth.completeOAuthCallback();
      window.location.replace(returnTo || "/portal");
    } catch (err) {
      setError(err.message || "Authentication callback failed");
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">Sign-in could not be completed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <a href="/login" className="mt-4 inline-block text-sm font-medium underline">Return to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-black/10 border-t-black" />
    </div>
  );
}
