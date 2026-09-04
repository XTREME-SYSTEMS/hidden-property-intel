import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Home, Brain, Loader2, Wrench, DollarSign, TrendingUp,
  AlertTriangle, CheckCircle2, Clock, Users,
} from "lucide-react";

export default function PropertyManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [newRequest, setNewRequest] = useState({ property_id: "", request_type: "plumbing", priority: "medium", description: "" });

  useEffect(() => {
    (async () => {
      try {
        const [propList, maintList] = await Promise.all([
          base44.entities.Property.filter({ status: "active" }, "-created_date", 30),
          base44.entities.MaintenanceRequest.list("-created_date", 30),
        ]);
        setProperties(propList);
        setMaintenanceRequests(maintList);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const createRequest = async () => {
    if (!newRequest.property_id || !newRequest.description) return;
    try {
      await base44.entities.MaintenanceRequest.create({
        ...newRequest,
        requested_at: new Date().toISOString(),
        status: "open",
      });
      const maintList = await base44.entities.MaintenanceRequest.list("-created_date", 30);
      setMaintenanceRequests(maintList);
      setNewRequest({ property_id: "", request_type: "plumbing", priority: "medium", description: "" });
    } catch (e) { console.error(e); }
  };

  const runAiAnalysis = async () => {
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI property management assistant for a real estate investment platform. Analyze the following portfolio and maintenance data and provide:
1. Portfolio health summary (occupancy, rent collection, maintenance backlog)
2. Maintenance priority ranking (which requests to address first and why)
3. Rent optimization recommendations (which properties are under/over market)
4. Tenant retention risk assessment
5. CapEx planning (major repairs anticipated in next 12 months)
6. Cash flow projection

Properties: ${JSON.stringify(properties.map(p => ({ id: p.id, address: p.address, estimated_value: p.estimated_value, bedrooms: p.bedrooms, bathrooms: p.bathrooms })))}

Maintenance requests: ${JSON.stringify(maintenanceRequests.map(m => ({ id: m.id, property_id: m.property_id, type: m.request_type, priority: m.priority, status: m.status, description: m.description, estimated_cost: m.estimated_cost })))}

Provide a structured, actionable response for a property manager.`,
        response_json_schema: {
          type: "object",
          properties: {
            portfolio_health: { type: "string" },
            maintenance_priority: { type: "array", items: { type: "object", properties: { request_id: { type: "string" }, priority_rank: { type: "number" }, reasoning: { type: "string" }, urgency: { type: "string" } } } },
            rent_recommendations: { type: "array", items: { type: "object", properties: { property_id: { type: "string" }, current_estimate: { type: "string" }, recommendation: { type: "string" } } } },
            retention_risks: { type: "array", items: { type: "string" } },
            capex_planning: { type: "array", items: { type: "string" } },
            cash_flow_projection: { type: "string" },
            overall_summary: { type: "string" }
          }
        }
      });
      setAiAnalysis(res);
    } catch (e) { setAiAnalysis({ error: e.message }); }
    setAiLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-sm text-black/40">Loading property manager dashboard…</div>;

  const openRequests = maintenanceRequests.filter(m => m.status === "open");
  const completedRequests = maintenanceRequests.filter(m => m.status === "completed");

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-[#c38a1b]" />
        <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Property Manager Dashboard</p>
      </div>
      <h1 className="mt-2 font-display text-3xl font-light tracking-tight">Portfolio & Maintenance Management</h1>
      <p className="mt-2 max-w-3xl text-sm text-black/50">
        Manage rental properties, track maintenance requests, optimize rent, and plan capex with AI-powered insights.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 lg:grid-cols-4">
        <Stat icon={Home} label="Managed Properties" value={properties.length} />
        <Stat icon={Wrench} label="Open Requests" value={openRequests.length} />
        <Stat icon={CheckCircle2} label="Completed" value={completedRequests.length} />
        <Stat icon={DollarSign} label="Portfolio Value" value={`$${properties.reduce((s, p) => s + (p.estimated_value || 0), 0).toLocaleString()}`} />
      </div>

      {/* AI Portfolio Analysis */}
      <div className="mt-8 rounded-sm border border-[#c38a1b]/30 bg-amber-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#c38a1b]" />
            <h2 className="font-display text-lg font-light">AI Portfolio & Maintenance Analysis</h2>
          </div>
          <button onClick={runAiAnalysis} disabled={aiLoading} className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            {aiLoading ? "Analyzing…" : "Run AI Analysis"}
          </button>
        </div>
        {aiAnalysis && !aiAnalysis.error && (
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">Portfolio Health</p>
              <p className="mt-1 text-amber-900">{aiAnalysis.portfolio_health}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">Overall Summary</p>
              <p className="mt-1 text-amber-900">{aiAnalysis.overall_summary}</p>
            </div>
            {aiAnalysis.maintenance_priority?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">Maintenance Priority</p>
                <div className="mt-1 space-y-1">
                  {aiAnalysis.maintenance_priority.map((m, i) => (
                    <div key={i} className="flex gap-2 text-amber-900">
                      <span className="font-bold">#{m.priority_rank}</span>
                      <span>{m.reasoning} <span className="text-amber-600">({m.urgency})</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {aiAnalysis.rent_recommendations?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">Rent Recommendations</p>
                <ul className="mt-1 space-y-1 text-amber-900">
                  {aiAnalysis.rent_recommendations.map((r, i) => <li key={i}>• {r.recommendation}</li>)}
                </ul>
              </div>
            )}
            {aiAnalysis.capex_planning?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700">CapEx Planning (Next 12 Months)</p>
                <ul className="mt-1 space-y-1 text-amber-900">
                  {aiAnalysis.capex_planning.map((c, i) => <li key={i}>• {c}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        {aiAnalysis?.error && <p className="mt-2 text-sm text-red-600">Error: {aiAnalysis.error}</p>}
      </div>

      {/* New Maintenance Request */}
      <div className="mt-8 rounded-sm border border-black/10 bg-white p-6">
        <h2 className="font-display text-lg font-light">Create Maintenance Request</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select value={newRequest.property_id} onChange={(e) => setNewRequest({ ...newRequest, property_id: e.target.value })} className="rounded-sm border border-black/15 px-3 py-2 text-sm">
            <option value="">Select Property</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.address}</option>)}
          </select>
          <select value={newRequest.request_type} onChange={(e) => setNewRequest({ ...newRequest, request_type: e.target.value })} className="rounded-sm border border-black/15 px-3 py-2 text-sm">
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="hvac">HVAC</option>
            <option value="appliance">Appliance</option>
            <option value="structural">Structural</option>
            <option value="landscaping">Landscaping</option>
            <option value="pest_control">Pest Control</option>
            <option value="roofing">Roofing</option>
            <option value="other">Other</option>
          </select>
          <select value={newRequest.priority} onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })} className="rounded-sm border border-black/15 px-3 py-2 text-sm">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="emergency">Emergency</option>
          </select>
          <button onClick={createRequest} className="rounded-sm bg-black px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-white">Create Request</button>
        </div>
        <textarea placeholder="Description of the issue…" value={newRequest.description} onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })} className="mt-3 w-full rounded-sm border border-black/15 px-3 py-2 text-sm" rows={3} />
      </div>

      {/* Maintenance Requests */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-light">Maintenance Requests</h2>
        <div className="mt-4 space-y-2">
          {maintenanceRequests.length === 0 ? (
            <div className="rounded-sm border border-black/10 p-6 text-center text-sm text-black/40">No maintenance requests</div>
          ) : maintenanceRequests.map((m) => (
            <div key={m.id} className="rounded-sm border border-black/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wrench className="h-4 w-4 text-black/60" />
                  <div>
                    <p className="font-medium">{m.request_type} — {m.priority} priority</p>
                    <p className="text-xs text-black/50">{m.description}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-white ${m.status === "completed" ? "bg-emerald-600" : m.status === "open" ? "bg-amber-500" : "bg-black/50"}`}>{m.status}</span>
              </div>
              {m.estimated_cost && <p className="mt-2 text-xs text-black/40">Est. cost: ${m.estimated_cost.toLocaleString()}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-white p-5">
      <Icon className="h-5 w-5 text-black/40" />
      <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-black/40">{label}</p>
      <p className="mt-1 font-display text-2xl font-light">{value}</p>
    </div>
  );
}