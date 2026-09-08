import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowRight, ArrowLeft, Check, Sparkles, TrendingUp, Home, ShieldCheck,
  Building2, LayoutDashboard, Bell, Loader2, AlertCircle,
} from "lucide-react";

const ROLES = [
  { id: "investor", label: "Investor", icon: TrendingUp, desc: "Find off-market distressed deals, bid, and close with smart-contract escrow." },
  { id: "seller", label: "Seller", icon: Home, desc: "List your distressed or inherited property and receive cash offers." },
  { id: "agent", label: "Agent / Broker", icon: ShieldCheck, desc: "Manage deals, disclosures, and digital signatures for your clients." },
  { id: "wholesaler", label: "Wholesaler", icon: Building2, desc: "Assign contracts and grow your buyer list with verified off-market inventory." },
  { id: "manager", label: "Property Manager", icon: LayoutDashboard, desc: "Track maintenance, occupancy, and vendor coordination across your portfolio." },
  { id: "partner", label: "Partner / Vendor", icon: Bell, desc: "Offer services (title, legal, contracting) to the PropertyIntel network." },
];

const INVESTMENT_TYPES = ["Fix & Flip", "BRRRR", "Buy & Hold", "Wholesale", "Multi-Family", "Land", "Commercial", "Short-Term Rental"];
const FL_COUNTIES = ["Miami-Dade", "Broward", "Palm Beach", "Orange", "Hillsborough", "Pinellas", "Duval", "Lee", "Polk", "St. Lucie", "Martin", "Brevard", "Volusia", "Sarasota", "Other / Out of state"];
const DISTRESS_TYPES = ["Pre-foreclosure", "Foreclosure", "Probate / Inherited", "Tax Delinquent", "Code Violation", "Divorce", "Bankruptcy", "None / Other"];
const TIMELINES = ["ASAP (0-30 days)", "1-3 months", "3-6 months", "6+ months / no rush"];
const GOALS = [
  "Find off-market deals", "Sell a property", "Build a buyer list", "Partner with investors",
  "Offer my services", "Learn the Florida market", "Use smart-contract closings", "Automate my outreach",
];

const STEPS = ["Role", "Profile", "Details", "Communication", "Goals", "Review"];

const inputStyle = { border: "1px solid var(--border)", borderRadius: 8, padding: "11px 12px", background: "#fff", width: "100%" };
const cardBorder = { border: "1px solid var(--border)", borderRadius: 12, background: "#fff" };

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3.5 py-2 text-xs font-medium transition"
      style={
        active
          ? { background: "var(--ink)", color: "var(--gold-2)", border: "1px solid var(--ink)" }
          : { background: "#fff", color: "var(--muted)", border: "1px solid var(--border)" }
      }
    >
      {children}
    </button>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--ink)" }}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px]" style={{ color: "var(--muted)" }}>{hint}</span>}
    </label>
  );
}

export default function PortalOnboarding() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    role: user?.portal_role || "",
    name: user?.full_name || "",
    company: "",
    phone: "",
    city: "",
    state: "FL",
    bio: "",
    roleDetails: {},
    communication: { email: user?.email || "", phone: "", channels: ["email"], bestTime: "morning" },
    goals: [],
  });

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));
  const updateDetails = (patch) => setForm((f) => ({ ...f, roleDetails: { ...f.roleDetails, ...patch } }));
  const updateComm = (patch) => setForm((f) => ({ ...f, communication: { ...f.communication, ...patch } }));
  const toggleArr = (key, val) =>
    setForm((f) => {
      const arr = f[key];
      return { ...f, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });
  const toggleDetailsArr = (key, val) =>
    setForm((f) => {
      const arr = f.roleDetails[key] || [];
      return { ...f, roleDetails: { ...f.roleDetails, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] } };
    });

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const canProceed = () => {
    if (step === 0) return !!form.role;
    if (step === 1) return form.name.trim() && form.communication.email.trim();
    return true;
  };

  const complete = async () => {
    setSaving(true);
    setError(null);
    try {
      await base44.auth.updateMe({
        portal_role: form.role,
        portal_onboarding_complete: true,
        portal_onboarding_completed_at: new Date().toISOString(),
        portal_profile: { name: form.name, company: form.company, phone: form.phone, city: form.city, state: form.state, bio: form.bio },
        portal_role_details: form.roleDetails,
        portal_communication: form.communication,
        portal_goals: form.goals,
      });
      if (form.role === "investor" && user?.id) {
        try {
          await base44.entities.Investor.create({
            user_id: user.id,
            name: form.name,
            email: form.communication.email,
            phone: form.phone,
            company: form.company,
            investment_types: form.roleDetails.investment_types || [],
            target_markets: form.roleDetails.target_markets || [],
            target_price_range: form.roleDetails.price_range || null,
          });
        } catch (e) { /* duplicate — ignore */ }
      }
      navigate("/portal");
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to save your profile.");
    }
    setSaving(false);
  };

  const renderDetails = () => {
    const r = form.role;
    if (r === "investor")
      return (
        <div className="grid gap-5">
          <div>
            <p className="mb-2 text-xs font-semibold" style={{ color: "var(--ink)" }}>Investment types</p>
            <div className="flex flex-wrap gap-2">
              {INVESTMENT_TYPES.map((t) => (
                <Chip key={t} active={(form.roleDetails.investment_types || []).includes(t)} onClick={() => toggleDetailsArr("investment_types", t)}>{t}</Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold" style={{ color: "var(--ink)" }}>Target markets (FL counties)</p>
            <div className="flex flex-wrap gap-2">
              {FL_COUNTIES.map((c) => (
                <Chip key={c} active={(form.roleDetails.target_markets || []).includes(c)} onClick={() => toggleDetailsArr("target_markets", c)}>{c}</Chip>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Target price range (min)">
              <input style={inputStyle} type="number" placeholder="50000" value={form.roleDetails.price_min || ""} onChange={(e) => updateDetails({ price_min: e.target.value })} />
            </Field>
            <Field label="Target price range (max)">
              <input style={inputStyle} type="number" placeholder="500000" value={form.roleDetails.price_max || ""} onChange={(e) => updateDetails({ price_max: e.target.value })} />
            </Field>
          </div>
          <Field label="Experience level">
            <select style={inputStyle} value={form.roleDetails.experience || ""} onChange={(e) => updateDetails({ experience: e.target.value })}>
              <option value="">Select…</option>
              <option>First deal</option>
              <option>1-5 deals</option>
              <option>5-20 deals</option>
              <option>20+ deals</option>
            </select>
          </Field>
        </div>
      );
    if (r === "seller")
      return (
        <div className="grid gap-5">
          <Field label="Property address (or city if unsure)">
            <input style={inputStyle} placeholder="123 Main St, Port St. Lucie, FL" value={form.roleDetails.property_address || ""} onChange={(e) => updateDetails({ property_address: e.target.value })} />
          </Field>
          <div>
            <p className="mb-2 text-xs font-semibold" style={{ color: "var(--ink)" }}>Situation</p>
            <div className="flex flex-wrap gap-2">
              {DISTRESS_TYPES.map((d) => (
                <Chip key={d} active={form.roleDetails.distress_type === d} onClick={() => updateDetails({ distress_type: d })}>{d}</Chip>
              ))}
            </div>
          </div>
          <Field label="Timeline to sell">
            <select style={inputStyle} value={form.roleDetails.timeline || ""} onChange={(e) => updateDetails({ timeline: e.target.value })}>
              <option value="">Select…</option>
              {TIMELINES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Estimated value (optional)">
            <input style={inputStyle} type="number" placeholder="250000" value={form.roleDetails.estimated_value || ""} onChange={(e) => updateDetails({ estimated_value: e.target.value })} />
          </Field>
        </div>
      );
    if (r === "agent")
      return (
        <div className="grid gap-5">
          <Field label="License number">
            <input style={inputStyle} placeholder="FL-RE-xxxxxx" value={form.roleDetails.license_number || ""} onChange={(e) => updateDetails({ license_number: e.target.value })} />
          </Field>
          <div>
            <p className="mb-2 text-xs font-semibold" style={{ color: "var(--ink)" }}>Specialties</p>
            <div className="flex flex-wrap gap-2">
              {["Residential", "Commercial", "Investment", "Probate", "Luxury", "Distressed", "Land"].map((s) => (
                <Chip key={s} active={(form.roleDetails.specialties || []).includes(s)} onClick={() => toggleDetailsArr("specialties", s)}>{s}</Chip>
              ))}
            </div>
          </div>
          <Field label="Years licensed">
            <input style={inputStyle} type="number" placeholder="5" value={form.roleDetails.years || ""} onChange={(e) => updateDetails({ years: e.target.value })} />
          </Field>
        </div>
      );
    if (r === "wholesaler")
      return (
        <div className="grid gap-5">
          <Field label="Buyer list size">
            <input style={inputStyle} type="number" placeholder="250" value={form.roleDetails.buyer_list_size || ""} onChange={(e) => updateDetails({ buyer_list_size: e.target.value })} />
          </Field>
          <div>
            <p className="mb-2 text-xs font-semibold" style={{ color: "var(--ink)" }}>Target markets</p>
            <div className="flex flex-wrap gap-2">
              {FL_COUNTIES.map((c) => (
                <Chip key={c} active={(form.roleDetails.target_markets || []).includes(c)} onClick={() => toggleDetailsArr("target_markets", c)}>{c}</Chip>
              ))}
            </div>
          </div>
          <Field label="Typical assignment fee range">
            <input style={inputStyle} placeholder="$5,000 - $15,000" value={form.roleDetails.fee_range || ""} onChange={(e) => updateDetails({ fee_range: e.target.value })} />
          </Field>
        </div>
      );
    if (r === "manager")
      return (
        <div className="grid gap-5">
          <Field label="Units under management">
            <input style={inputStyle} type="number" placeholder="50" value={form.roleDetails.units || ""} onChange={(e) => updateDetails({ units: e.target.value })} />
          </Field>
          <div>
            <p className="mb-2 text-xs font-semibold" style={{ color: "var(--ink)" }}>Markets</p>
            <div className="flex flex-wrap gap-2">
              {FL_COUNTIES.map((c) => (
                <Chip key={c} active={(form.roleDetails.target_markets || []).includes(c)} onClick={() => toggleDetailsArr("target_markets", c)}>{c}</Chip>
              ))}
            </div>
          </div>
        </div>
      );
    return (
      <Field label="What service do you offer the PropertyIntel network?">
        <textarea style={{ ...inputStyle, minHeight: 100 }} placeholder="e.g. Title services, legal, contracting, inspection…" value={form.roleDetails.service || ""} onChange={(e) => updateDetails({ service: e.target.value })} />
      </Field>
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">Onboarding · Step {step + 1} of {STEPS.length}</p>
          <p className="text-xs font-semibold" style={{ color: "var(--gold-3)" }}>{STEPS[step]}</p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: "var(--gold)" }} />
        </div>
      </div>

      <div className="p-6 sm:p-8" style={cardBorder}>
        {/* STEP 0 — ROLE */}
        {step === 0 && (
          <div>
            <div className="mb-6 flex items-center gap-2">
              <Sparkles className="h-5 w-5" style={{ color: "var(--gold)" }} />
              <h2 className="font-heading text-2xl font-bold" style={{ color: "var(--ink)" }}>How will you use PropertyIntel?</h2>
            </div>
            <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>Choose your role — we'll tailor your dashboard, tools, and recommendations to it. You can change this later in Settings.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const active = form.role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => update({ role: r.id })}
                    className="flex items-start gap-3 rounded-xl p-4 text-left transition"
                    style={active ? { border: "2px solid var(--gold)", background: "#fff8e9" } : { border: "1px solid var(--border)", background: "#fff" }}
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg" style={{ background: "var(--ink)", color: "var(--gold-2)" }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: "var(--ink)" }}>{r.label}</p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>{r.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 1 — PROFILE */}
        {step === 1 && (
          <div>
            <h2 className="mb-1 font-heading text-2xl font-bold" style={{ color: "var(--ink)" }}>Your profile</h2>
            <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>This is how you'll appear across the platform.</p>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name"><input style={inputStyle} value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Jane Doe" /></Field>
                <Field label="Company (optional)"><input style={inputStyle} value={form.company} onChange={(e) => update({ company: e.target.value })} placeholder="Doe Capital LLC" /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone"><input style={inputStyle} value={form.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="(772) 555-0100" /></Field>
                <Field label="Email"><input style={inputStyle} value={form.communication.email} onChange={(e) => updateComm({ email: e.target.value })} placeholder="you@email.com" /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City"><input style={inputStyle} value={form.city} onChange={(e) => update({ city: e.target.value })} placeholder="Port St. Lucie" /></Field>
                <Field label="State">
                  <select style={inputStyle} value={form.state} onChange={(e) => update({ state: e.target.value })}>
                    <option>FL</option><option>GA</option><option>AL</option><option>SC</option><option>NC</option><option>TN</option><option>TX</option><option>Other</option>
                  </select>
                </Field>
              </div>
              <Field label="Short bio (optional)">
                <textarea style={{ ...inputStyle, minHeight: 80 }} value={form.bio} onChange={(e) => update({ bio: e.target.value })} placeholder="Tell us about your real estate experience and goals…" />
              </Field>
            </div>
          </div>
        )}

        {/* STEP 2 — ROLE DETAILS */}
        {step === 2 && (
          <div>
            <h2 className="mb-1 font-heading text-2xl font-bold" style={{ color: "var(--ink)" }}>{ROLES.find((r) => r.id === form.role)?.label} details</h2>
            <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>The more we know, the better we can match you to deals and tools.</p>
            {renderDetails()}
          </div>
        )}

        {/* STEP 3 — COMMUNICATION */}
        {step === 3 && (
          <div>
            <h2 className="mb-1 font-heading text-2xl font-bold" style={{ color: "var(--ink)" }}>Communication preferences</h2>
            <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>How should PropertyIntel and Eden Skye reach you?</p>
            <div className="grid gap-5">
              <div>
                <p className="mb-2 text-xs font-semibold" style={{ color: "var(--ink)" }}>Preferred channels</p>
                <div className="flex flex-wrap gap-2">
                  {["email", "phone", "sms", "in_app"].map((c) => (
                    <Chip key={c} active={form.communication.channels.includes(c)} onClick={() =>
                      updateComm({ channels: form.communication.channels.includes(c) ? form.communication.channels.filter((x) => x !== c) : [...form.communication.channels, c] })
                    }>{c.replace("_", " ").toUpperCase()}</Chip>
                  ))}
                </div>
              </div>
              <Field label="Best time to contact">
                <select style={inputStyle} value={form.communication.bestTime} onChange={(e) => updateComm({ bestTime: e.target.value })}>
                  <option value="morning">Morning (8-12)</option>
                  <option value="afternoon">Afternoon (12-5)</option>
                  <option value="evening">Evening (5-8)</option>
                  <option value="anytime">Anytime</option>
                </select>
              </Field>
              <Field label="Contact phone (if different)">
                <input style={inputStyle} value={form.communication.phone} onChange={(e) => updateComm({ phone: e.target.value })} placeholder="Same as profile phone" />
              </Field>
            </div>
          </div>
        )}

        {/* STEP 4 — GOALS */}
        {step === 4 && (
          <div>
            <h2 className="mb-1 font-heading text-2xl font-bold" style={{ color: "var(--ink)" }}>What are your goals?</h2>
            <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>Select all that apply — we'll prioritize the right features and alerts.</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {GOALS.map((g) => {
                const active = form.goals.includes(g);
                return (
                  <button key={g} type="button" onClick={() => toggleArr("goals", g)} className="flex items-center gap-3 rounded-lg p-3 text-left text-sm transition"
                    style={active ? { border: "1px solid var(--gold)", background: "#fff8e9" } : { border: "1px solid var(--border)", background: "#fff" }}>
                    <div className="grid h-5 w-5 place-items-center rounded-full" style={active ? { background: "var(--gold)" } : { border: "1px solid var(--border)" }}>
                      {active && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span style={{ color: "var(--ink)" }}>{g}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5 — REVIEW */}
        {step === 5 && (
          <div>
            <h2 className="mb-1 font-heading text-2xl font-bold" style={{ color: "var(--ink)" }}>Review & finish</h2>
            <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>Confirm your details below — you can edit any of this later in Settings.</p>
            <div className="grid gap-4 text-sm">
              <ReviewRow label="Role" value={ROLES.find((r) => r.id === form.role)?.label} />
              <ReviewRow label="Name" value={form.name} />
              <ReviewRow label="Company" value={form.company || "—"} />
              <ReviewRow label="Email" value={form.communication.email} />
              <ReviewRow label="Phone" value={form.phone || "—"} />
              <ReviewRow label="Location" value={[form.city, form.state].filter(Boolean).join(", ") || "—"} />
              {form.role === "investor" && <ReviewRow label="Investment types" value={(form.roleDetails.investment_types || []).join(", ") || "—"} />}
              {form.role === "investor" && <ReviewRow label="Target markets" value={(form.roleDetails.target_markets || []).join(", ") || "—"} />}
              {form.role === "seller" && <ReviewRow label="Situation" value={form.roleDetails.distress_type || "—"} />}
              <ReviewRow label="Goals" value={form.goals.join(", ") || "—"} />
            </div>
            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg p-3 text-sm" style={{ background: "#fef2f2", color: "#b91c1c" }}>
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
          </div>
        )}

        {/* Nav buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button type="button" onClick={back} disabled={step === 0} className="btn ghost" style={{ opacity: step === 0 ? 0.4 : 1 }}>
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} disabled={!canProceed()} className="btn gold" style={{ opacity: canProceed() ? 1 : 0.5 }}>
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={complete} disabled={saving} className="btn gold">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" /> Complete setup</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2.5" style={{ borderColor: "var(--border)" }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span className="text-right font-medium" style={{ color: "var(--ink)" }}>{value}</span>
    </div>
  );
}