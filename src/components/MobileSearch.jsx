import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Sparkles, MapPin, DollarSign, TrendingDown, Loader2, Building2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const DISTRESS_TYPES = [
  "pre-foreclosure", "foreclosure", "probate_inherited", "tax_delinquent",
  "code_violation", "divorce", "bankruptcy", "auction", "short_sale", "bank_owned",
];

const QUICK_PROMPTS = [
  "Distressed properties under $150k in Atlanta",
  "Probate or inherited properties in Florida",
  "Tax-delinquent homes in Texas under $100k",
  "Pre-foreclosures in Los Angeles",
];

export default function MobileSearch({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFilters, setAiFilters] = useState(null);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const runSearch = useCallback(async (filters) => {
    setSearching(true);
    try {
      const query = {};
      if (filters.city) query.city = filters.city;
      if (filters.state) query.state = filters.state;
      if (filters.distress_type) query.distress_type = filters.distress_type;
      if (filters.min_price != null) query.estimated_value = { ...query.estimated_value, $gte: filters.min_price };
      if (filters.max_price != null) query.estimated_value = { ...query.estimated_value, $lte: filters.max_price };
      query.status = "active";
      const props = await base44.entities.Property.filter(query, "-property_score", 10);
      setResults(props);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleAiSearch = async () => {
    if (!query.trim()) return;
    setAiLoading(true);
    setAiFilters(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a real estate search assistant. Parse the user's natural language query into structured search filters for a distressed property database.\n\nUser query: "${query}"\n\nExtract: city, state (full state name or abbreviation), distress_type (must be one of: ${DISTRESS_TYPES.join(", ")} — use empty string if not specified), min_price, max_price (numbers, null if not specified), and a one-sentence summary of what they're looking for.\n\nOnly include fields that are clearly stated or strongly implied in the query. Omit unspecified fields.`,
        response_json_schema: {
          type: "object",
          properties: {
            city: { type: "string" },
            state: { type: "string" },
            distress_type: { type: "string" },
            min_price: { type: "number" },
            max_price: { type: "number" },
            summary: { type: "string" },
          },
        },
      });
      const filters = {
        city: res.city || undefined,
        state: res.state || undefined,
        distress_type: DISTRESS_TYPES.includes(res.distress_type) ? res.distress_type : undefined,
        min_price: res.min_price ?? undefined,
        max_price: res.max_price ?? undefined,
      };
      setAiFilters({ ...res, summary: res.summary || query });
      runSearch(filters);
    } catch {
      setAiFilters({ summary: "Search failed. Try simpler terms." });
    } finally {
      setAiLoading(false);
    }
  };

  const handleQuickPrompt = async (prompt) => {
    setQuery(prompt);
    // Run AI search with the tapped prompt
    setAiLoading(true);
    setAiFilters(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a real estate search assistant. Parse the user's natural language query into structured search filters for a distressed property database.\n\nUser query: "${prompt}"\n\nExtract: city, state (full state name or abbreviation), distress_type (must be one of: ${DISTRESS_TYPES.join(", ")} — use empty string if not specified), min_price, max_price (numbers, null if not specified), and a one-sentence summary of what they're looking for.\n\nOnly include fields that are clearly stated or strongly implied in the query. Omit unspecified fields.`,
        response_json_schema: {
          type: "object",
          properties: {
            city: { type: "string" },
            state: { type: "string" },
            distress_type: { type: "string" },
            min_price: { type: "number" },
            max_price: { type: "number" },
            summary: { type: "string" },
          },
        },
      });
      const filters = {
        city: res.city || undefined,
        state: res.state || undefined,
        distress_type: DISTRESS_TYPES.includes(res.distress_type) ? res.distress_type : undefined,
        min_price: res.min_price ?? undefined,
        max_price: res.max_price ?? undefined,
      };
      setAiFilters({ ...res, summary: res.summary || prompt });
      runSearch(filters);
    } catch {
      setAiFilters({ summary: "Search failed. Try simpler terms." });
    } finally {
      setAiLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-black/10 px-4 py-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center gap-2 rounded-full bg-black/5 px-4 py-2.5">
          <Search className="h-4 w-4 text-black/40" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setAiFilters(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
            placeholder="Search properties, cities, deals…"
            className="w-full bg-transparent text-sm text-black placeholder:text-black/40 focus:outline-none"
          />
        </div>
        <button
          onClick={handleAiSearch}
          disabled={aiLoading || !query.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white disabled:opacity-30"
          aria-label="AI Search"
        >
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 pb-24">
        {/* AI interpretation */}
        {aiFilters && (
          <div className="mb-5 rounded-xl border border-gold/30 bg-gold/5 p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-gold">
              <Sparkles className="h-3.5 w-3.5" /> AI Search Interpretation
            </div>
            <p className="mt-2 text-sm leading-relaxed text-black/80">{aiFilters.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {aiFilters.city && <Chip icon={MapPin} label={aiFilters.city} />}
              {aiFilters.state && <Chip icon={MapPin} label={aiFilters.state} />}
              {aiFilters.distress_type && <Chip icon={TrendingDown} label={aiFilters.distress_type.replace(/_/g, " ")} />}
              {aiFilters.min_price != null && <Chip icon={DollarSign} label={`$${aiFilters.min_price.toLocaleString()}+`} />}
              {aiFilters.max_price != null && <Chip icon={DollarSign} label={`≤ $${aiFilters.max_price.toLocaleString()}`} />}
            </div>
          </div>
        )}

        {/* Quick prompts */}
        {!aiFilters && !results.length && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">Try AI natural-language search</p>
            <div className="mt-3 space-y-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleQuickPrompt(p)}
                  className="flex w-full items-center gap-3 rounded-xl border border-black/10 px-4 py-3 text-left text-sm text-black/70 transition-colors hover:bg-black/5"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-gold" />
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {searching && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-black/50">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching inventory…
          </div>
        )}

        {/* Results */}
        {!searching && results.length > 0 && (
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-black/40">{results.length} matching properties</p>
            <div className="space-y-3">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { onClose(); navigate(`/properties/${p.id}`); }}
                  className="flex w-full items-center gap-3 rounded-xl border border-black/10 p-3 text-left transition-colors hover:bg-black/5"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-black/5">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    ) : (
                      <Building2Fallback />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-black">{p.city}, {p.state} {p.zip_code}</p>
                    <p className="mt-0.5 text-xs text-black/50 capitalize">{(p.distress_type || "—").replace(/_/g, " ")}</p>
                    <p className="mt-1 text-sm font-semibold text-black">${(p.proposed_asking_price || p.estimated_value || 0).toLocaleString()}</p>
                  </div>
                  {p.property_score != null && (
                    <span className="shrink-0 rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold text-white">{p.property_score}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {!searching && aiFilters && results.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-black/50">No properties matched. Try broadening your search.</p>
            <button onClick={() => { onClose(); navigate("/listings"); }} className="mt-4 rounded-full bg-black px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-white">
              Browse all inventory
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium text-black/70">
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

function Building2Fallback() {
  return <Building2 className="h-5 w-5 text-black/30" />;
}