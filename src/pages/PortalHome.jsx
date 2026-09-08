import React, { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  TrendingUp, Building2, ShieldCheck, Bell, ArrowRight, Sparkles,
  CheckCircle2, AlertCircle, Calculator, FileSignature, Search,
} from "lucide-react";

export default function PortalHome() {
  const { user, role } = useOutletContext();
  const [props, setProps] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p = await base44.entities.Property.list("-created_date", 4);
        setProps(p);
        if (role === "investor" && user?.id) {
          try { setBids(await base44.entities.Bid.filter({ investor_id: user.id })); } catch {}
        }
      } catch {}
      setLoading(false);
    })();
  }, [user, role]);

  const onboardingComplete = user?.portal_onboarding_complete;
  const roleLabel = role?.charAt(0).toUpperCase() + role?.slice(1);

  const quickActions = [
    { label: "Browse properties", to: "/listings", icon: Search, roles: ["investor", "seller", "agent", "wholesaler", "manager", "partner", "admin"] },
    { label: "Run deal calculator", to: "/deal-calculator", icon: Calculator, roles: ["investor", "agent", "wholesaler", "admin"] },
    { label: "Smart-contract escrow", to: "/smart-contracts", icon: FileSignature, roles: ["investor", "seller", "agent", "admin"] },
    { label: "Set up alerts", to: "/alerts", icon: Bell, roles: ["investor", "seller", "agent", "wholesaler", "admin"] },
  ].filter((a) => a.roles.includes(role || "investor"));

  return (
    <div className="mx-auto max-w-5xl">
      {/* Onboarding banner */}
      {!onboardingComplete && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl p-5" style={{ border: "1px solid var(--gold)", background: "#fff8e9" }}>
          <AlertCircle className="h-5 w-5 shrink-0" style={{ color: "var(--gold-3)" }} />
          <div className="flex-1">
            <p className="font-semibold" style={{ color: "var(--ink)" }}>Complete your onboarding</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Finish setup to unlock your {roleLabel || "role"} tools and personalized recommendations.</p>
          </div>
          <Link to="/portal/onboarding" className="btn gold">Start now <ArrowRight className="h-4 w-4" /></Link>
        </div>
      )}

      {/* Greeting */}
      <div className="mb-6">
        <p className="eyebrow">{roleLabel || "Member"} dashboard</p>
        <h1 className="font-heading text-3xl font-bold" style={{ color: "var(--ink)" }}>
          {onboardingComplete ? "Here's your pipeline at a glance." : "Let's get you set up."}
        </h1>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Building2} label="Live properties" value={loading ? "…" : props.length ? `${props.length}+` : "0"} />
        <StatCard icon={TrendingUp} label="My bids" value={loading ? "…" : bids.length} roles={["investor", "admin"]} show={role === "investor" || role === "admin"} />
        <StatCard icon={ShieldCheck} label="Smart contracts" value="Active" to="/smart-contracts" />
        <StatCard icon={Sparkles} label="Onboarding" value={onboardingComplete ? "Complete" : "Pending"} to="/portal/onboarding" />
      </div>

      {/* Quick actions */}
      <div className="mb-6">
        <h2 className="mb-3 font-heading text-lg font-bold" style={{ color: "var(--ink)" }}>Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.label} to={a.to} className="hpi-hover flex items-center gap-3 rounded-xl p-4 transition" style={{ border: "1px solid var(--border)", background: "#fff" }}>
                <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: "var(--ink)", color: "var(--gold-2)" }}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium hpi-pop" style={{ color: "var(--ink)" }}>{a.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent properties */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold" style={{ color: "var(--ink)" }}>Latest properties</h2>
          <Link to="/listings" className="text-xs font-semibold" style={{ color: "var(--gold-3)" }}>View all →</Link>
        </div>
        {loading ? (
          <div className="rounded-xl p-8 text-center text-sm" style={{ border: "1px solid var(--border)", background: "#fff", color: "var(--muted)" }}>Loading…</div>
        ) : props.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ border: "1px solid var(--border)", background: "#fff" }}>
            <p className="text-sm" style={{ color: "var(--muted)" }}>No properties available yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {props.map((p) => (
              <Link key={p.id} to={`/properties/${p.id}`} className="hpi-hover flex gap-3 rounded-xl p-3 transition" style={{ border: "1px solid var(--border)", background: "#fff" }}>
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg" style={{ background: "#f7f5f0" }}>
                  <Building2 className="h-6 w-6" style={{ color: "var(--gold-3)" }} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold" style={{ color: "var(--ink)" }}>{p.address || "Off-market property"}</p>
                  <p className="truncate text-xs" style={{ color: "var(--muted)" }}>{[p.city, p.state, p.zip_code].filter(Boolean).join(", ")}</p>
                  {p.estimated_value && <p className="mt-1 text-sm font-bold" style={{ color: "var(--gold-3)" }}>${p.estimated_value.toLocaleString()}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, to, show = true }) {
  if (!show) return null;
  const inner = (
    <div className="hpi-hover flex items-center gap-3 rounded-xl p-4 transition" style={{ border: "1px solid var(--border)", background: "#fff" }}>
      <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: "#fff8e9" }}>
        <Icon className="h-5 w-5" style={{ color: "var(--gold-3)" }} />
      </div>
      <div>
        <p className="text-xs" style={{ color: "var(--muted)" }}>{label}</p>
        <p className="font-heading text-lg font-bold hpi-pop" style={{ color: "var(--ink)" }}>{value}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}