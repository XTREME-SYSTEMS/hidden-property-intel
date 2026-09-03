import React, { useState } from "react";
import { Search, Zap, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ScrapePanel({ targetType, onComplete }) {
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("FL");
  const [keywords, setKeywords] = useState("");
  const [scraping, setScraping] = useState(false);
  const [automating, setAutomating] = useState(false);
  const [result, setResult] = useState(null);

  const handleScrape = async () => {
    setScraping(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("manualScrapeTargets", {
        target_type: targetType,
        city,
        state: stateVal,
        keywords,
      });
      setResult(res.data);
      onComplete?.();
    } catch (e) {
      setResult({ error: e.response?.data?.error || e.message });
    }
    setScraping(false);
  };

  const handleAutomateAll = async () => {
    setAutomating(true);
    try {
      const res = await base44.functions.invoke("configureFollowUp", {
        entity_type: targetType,
        record_id: "all",
        enabled: true,
        frequency_days: 7,
        automation_enabled: true,
      });
      setResult({ automated: res.data?.updated || 0 });
    } catch (e) {
      setResult({ error: e.response?.data?.error || e.message });
    }
    setAutomating(false);
  };

  return (
    <div className="border-b border-black/10 bg-[#faf9f6] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-black/40" />
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-black/50">
          Manual Scrape — Find {targetType === "investor" ? "Investors" : "Property Owners"}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[120px] flex-1">
          <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-black/40">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Miami"
            className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-black/40"
          />
        </div>
        <div className="w-20">
          <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-black/40">State</label>
          <input
            type="text"
            value={stateVal}
            onChange={(e) => setStateVal(e.target.value)}
            className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-black/40"
          />
        </div>
        <div className="min-w-[200px] flex-[2]">
          <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-black/40">Keywords</label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder={
              targetType === "investor"
                ? "wholesaler fix-and-flip cash buyer"
                : "probate foreclosure tax delinquent"
            }
            className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-black/40"
          />
        </div>
        <button
          onClick={handleScrape}
          disabled={scraping || !stateVal}
          className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
        >
          {scraping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          {scraping ? "Scraping…" : "Scrape & Add"}
        </button>
        <button
          onClick={handleAutomateAll}
          disabled={automating}
          className="inline-flex items-center gap-2 rounded-md border border-[#c38a1b] bg-[#fff8e9] px-4 py-2 text-xs font-medium text-[#8f6110] disabled:opacity-50"
        >
          {automating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          {automating ? "Enabling…" : "Automate All"}
        </button>
      </div>
      {result && (
        <div
          className={`mt-3 rounded-md p-2.5 text-xs ${
            result.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {result.error
            ? result.error
            : result.automated
            ? `Follow-up automation enabled for ${result.automated} records.`
            : `Found ${result.found}, added ${result.saved} new ${
                targetType === "investor" ? "investors" : "owners"
              } to the list.`}
        </div>
      )}
    </div>
  );
}