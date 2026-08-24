import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Check, ArrowRight, Lock } from "lucide-react";

const PLANS = [
  { id: "starter", name: "Starter", price: 49, tagline: "Explore the database", features: ["Browse all properties", "Search & filters", "Basic property details", "3 saved searches"] },
  { id: "pro", name: "Pro", price: 149, tagline: "For active investors", features: ["Everything in Starter", "Ownership chains + owner contacts", "Place bids", "ROI calculators", "Market analytics"] },
  { id: "elite", name: "Elite", price: 499, tagline: "Institutional grade", features: ["Everything in Pro", "Proxy (auto) bidding", "Smart-contract closing", "Unlimited saved searches", "Commercial properties"] }
];

export default function InvestorSignup() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { base44.auth.me().then(setUser).catch(() => setUser(null)); }, []);

  const subscribe = async (plan) => {
    setError("");
    if (window.self !== window.top) {
      alert("Checkout works only from the published app, not the editor preview.");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("createCheckoutSession", {
        plan, user_id: user?.id, email: user?.email,
        success_url: window.location.origin + "/investor/dashboard",
        cancel_url: window.location.origin + "/investor/signup"
      });
      if (res.data?.url) window.location.href = res.data.url;
      else setError(res.data?.error || "Failed to start checkout");
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-32 text-center">
        <Lock className="mx-auto h-10 w-10 text-black/40" />
        <h1 className="mt-6 font-display text-3xl font-light">Log in to subscribe</h1>
        <p className="mt-3 text-sm text-black/60">Investor subscriptions require an account.</p>
        <Link to="/login" className="mt-8 inline-flex items-center gap-2 rounded-sm bg-black px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-white">
          Log in <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-12">
      <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Investor membership</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight sm:text-5xl">Choose your access level.</h1>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.id} className={`flex flex-col rounded-sm p-8 ${p.id === "pro" ? "bg-black text-white" : "border border-black/15"}`}>
            <p className={`text-[11px] uppercase tracking-[0.3em] ${p.id === "pro" ? "text-white/60" : "text-black/50"}`}>{p.name}</p>
            <p className={`mt-5 font-display text-4xl font-light tabular-nums ${p.id === "pro" ? "text-white" : "text-black"}`}>
              ${p.price}<span className="text-base text-black/40">/mo</span>
            </p>
            <p className={`mt-1 text-sm ${p.id === "pro" ? "text-white/60" : "text-black/50"}`}>{p.tagline}</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0" />{f}</li>
              ))}
            </ul>
            <button
              onClick={() => subscribe(p.id)}
              disabled={loading}
              className={`mt-8 rounded-sm py-3.5 text-center text-[11px] uppercase tracking-[0.3em] transition-colors disabled:opacity-50 ${p.id === "pro" ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/80"}`}
            >
              Subscribe {p.name}
            </button>
          </div>
        ))}
      </div>
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
    </div>
  );
}