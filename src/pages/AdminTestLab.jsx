import React, { useState, useCallback } from "react";
import {
  FlaskConical, Play, Check, X, Loader2, AlertTriangle, RefreshCw,
  Database, Mail, Blocks, Scale, RefreshCw as Sync, TrendingUp, Gavel, FileText, Zap
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const TEST_GROUPS = [
  {
    name: "Scraping & Data Pipeline",
    icon: Database,
    color: "blue",
    tests: [
      { name: "syncFromSupabase", desc: "Sync properties from Supabase", payload: {} },
      { name: "normalizeAddresses", desc: "Normalize property addresses", payload: {} },
      { name: "geocodeProperties", desc: "Geocode properties", payload: {} },
      { name: "crossReferenceProperties", desc: "Cross-reference duplicates", payload: {} },
      { name: "manualScrapeTargets", desc: "Manual scrape targets", payload: { urls: [] } },
      { name: "scrapeProperties", desc: "Scrape properties", payload: {} },
      { name: "scrapeInvestors", desc: "Scrape investor leads", payload: {} },
      { name: "runDailyScrapePipeline", desc: "Full daily scrape pipeline", payload: {} },
    ],
  },
  {
    name: "AI Scoring & Analysis",
    icon: TrendingUp,
    color: "emerald",
    tests: [
      { name: "scoreAllActiveProperties", desc: "Score all active properties", payload: {} },
      { name: "scoreProperty", desc: "Score single property", payload: { property_id: "test" } },
      { name: "populateOwnershipChains", desc: "Build ownership chains", payload: {} },
      { name: "syncMarketAnalytics", desc: "Sync market analytics", payload: {} },
      { name: "optimizeListing", desc: "AI listing optimization", payload: {} },
      { name: "fetchPropertyImages", desc: "Fetch property images", payload: {} },
      { name: "ingestPropertyImages", desc: "Ingest property images", payload: {} },
    ],
  },
  {
    name: "Outreach & Communication",
    icon: Mail,
    color: "amber",
    tests: [
      { name: "generateInvestorOutreach", desc: "Generate investor outreach email", payload: {} },
      { name: "generateOwnerOutreach", desc: "Generate owner outreach email", payload: {} },
      { name: "outreachInvestors", desc: "Send investor outreach", payload: {} },
      { name: "outreachSellers", desc: "Send seller outreach", payload: {} },
      { name: "sendOutreach", desc: "Send outreach message", payload: {} },
      { name: "runDailyOutreach", desc: "Run daily outreach campaign", payload: {} },
      { name: "configureFollowUp", desc: "Configure follow-up schedule", payload: {} },
      { name: "searchNextOfKin", desc: "Search next of kin", payload: { owner_name: "test" } },
      { name: "skipTraceOwner", desc: "Skip trace owner", payload: { name: "test" } },
    ],
  },
  {
    name: "Smart Contracts & Blockchain",
    icon: Blocks,
    color: "purple",
    tests: [
      { name: "getSmartContractDashboard", desc: "Smart contract dashboard data", payload: {} },
      { name: "generateSmartContract", desc: "Generate Solidity contract", payload: {} },
      { name: "automateContractCreation", desc: "Auto-create from deals", payload: {} },
      { name: "deploySmartContract", desc: "Deploy to Polygon (estimate)", payload: { smart_contract_id: "test", estimate_only: true } },
      { name: "interactWithContract", desc: "Read contract state", payload: { smart_contract_id: "test", action: "get_state" } },
      { name: "syncAllContractStates", desc: "Sync all from chain", payload: {} },
      { name: "generateContractDocuments", desc: "AI document generation", payload: {} },
      { name: "generateWallet", desc: "Generate Polygon wallet", payload: {} },
    ],
  },
  {
    name: "Legal & Compliance",
    icon: Scale,
    color: "red",
    tests: [
      { name: "generateLegalDisclosures", desc: "Generate FL disclosure forms", payload: { disclosure_types: "all" } },
      { name: "signDocument", desc: "Digital signature (ESIGN)", payload: { document_title: "Test Doc", document_content: "Test content", signer_name: "Test", signer_email: "test@test.com" } },
    ],
  },
  {
    name: "Bidding & Negotiation",
    icon: Gavel,
    color: "indigo",
    tests: [
      { name: "placeBid", desc: "Place a bid", payload: { property_id: "test", bid_amount: 100000 } },
      { name: "acceptBid", desc: "Accept a bid", payload: { bid_id: "test" } },
      { name: "processProxyBids", desc: "Process proxy bids", payload: {} },
      { name: "expireOldBids", desc: "Expire old bids", payload: {} },
      { name: "sendBidNotifications", desc: "Send bid notifications", payload: {} },
      { name: "matchAndNotifyAlerts", desc: "Match and notify alerts", payload: {} },
      { name: "aiNegotiationAssistant", desc: "AI negotiation analysis", payload: { message: "test" } },
      { name: "sendNegotiationMessage", desc: "Send negotiation message", payload: {} },
    ],
  },
  {
    name: "Sync & System Health",
    icon: Sync,
    color: "gray",
    tests: [
      { name: "syncToGoogleSheets", desc: "Sync to Google Sheets", payload: {} },
      { name: "syncSearchConsole", desc: "Sync Google Search Console", payload: {} },
      { name: "submitSitemap", desc: "Submit sitemap to Google", payload: {} },
      { name: "dynamicSitemap", desc: "Generate dynamic sitemap", payload: {} },
      { name: "validateSystem", desc: "Full system health check", payload: {} },
      { name: "expireStaleProperties", desc: "Expire stale properties", payload: {} },
      { name: "processDraftProperties", desc: "Process draft properties", payload: {} },
      { name: "createCheckoutSession", desc: "Stripe checkout session", payload: { price_id: "test" } },
      { name: "handleStripeWebhook", desc: "Stripe webhook handler", payload: {} },
    ],
  },
];

const COLOR_MAP = {
  blue: "text-blue-600 bg-blue-50 border-blue-200",
  emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
  amber: "text-amber-600 bg-amber-50 border-amber-200",
  purple: "text-purple-600 bg-purple-50 border-purple-200",
  red: "text-red-600 bg-red-50 border-red-200",
  indigo: "text-indigo-600 bg-indigo-50 border-indigo-200",
  gray: "text-gray-600 bg-gray-50 border-gray-200",
};

export default function AdminTestLab() {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(null);
  const [runningAll, setRunningAll] = useState(false);
  const [allProgress, setAllProgress] = useState({ done: 0, total: 0 });

  const runTest = useCallback(async (funcName, payload) => {
    setRunning(funcName);
    setResults((prev) => ({ ...prev, [funcName]: { status: "running" } }));
    try {
      const res = await base44.functions.invoke(funcName, payload);
      const hasError = res.data?.error;
      setResults((prev) => ({
        ...prev,
        [funcName]: {
          status: hasError ? "warn" : "pass",
          message: hasError ? res.data.error : "Success",
          data: res.data,
        },
      }));
      return hasError ? "warn" : "pass";
    } catch (e) {
      const msg = e.response?.data?.error || e.message || "Unknown error";
      setResults((prev) => ({
        ...prev,
        [funcName]: { status: "fail", message: msg },
      }));
      return "fail";
    } finally {
      setRunning(null);
    }
  }, []);

  const runAllTests = async () => {
    setRunningAll(true);
    const allTests = TEST_GROUPS.flatMap((g) => g.tests);
    setAllProgress({ done: 0, total: allTests.length });
    let passed = 0, warned = 0, failed = 0;
    for (let i = 0; i < allTests.length; i++) {
      const result = await runTest(allTests[i].name, allTests[i].payload);
      if (result === "pass") passed++;
      else if (result === "warn") warned++;
      else failed++;
      setAllProgress({ done: i + 1, total: allTests.length });
    }
    setRunningAll(false);
  };

  const totalTests = TEST_GROUPS.reduce((s, g) => s + g.tests.length, 0);
  const passedCount = Object.values(results).filter((r) => r.status === "pass").length;
  const warnCount = Object.values(results).filter((r) => r.status === "warn").length;
  const failCount = Object.values(results).filter((r) => r.status === "fail").length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">System Test Suite</p>
          <h1 className="mt-1 font-display text-2xl font-light">Full System Test Lab</h1>
          <p className="mt-1 text-xs text-black/50">Test every backend function, automation, and integration — {totalTests} tests across {TEST_GROUPS.length} categories</p>
        </div>
        <button
          onClick={runAllTests}
          disabled={runningAll}
          className="inline-flex items-center gap-1.5 rounded-md bg-black px-4 py-2.5 text-xs text-white disabled:opacity-50"
        >
          {runningAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          {runningAll ? `Running ${allProgress.done}/${allProgress.total}…` : "Run Full System Test"}
        </button>
      </div>

      {/* Summary bar */}
      <div className="mb-5 grid grid-cols-4 gap-2">
        <div className="rounded-lg border border-black/10 bg-white p-3">
          <p className="text-[10px] uppercase tracking-[0.15em] text-black/40">Total Tests</p>
          <p className="mt-1 font-display text-xl font-light">{totalTests}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[10px] uppercase tracking-[0.15em] text-emerald-600">Passed</p>
          <p className="mt-1 font-display text-xl font-light text-emerald-700">{passedCount}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-[10px] uppercase tracking-[0.15em] text-amber-600">Warnings</p>
          <p className="mt-1 font-display text-xl font-light text-amber-700">{warnCount}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-[10px] uppercase tracking-[0.15em] text-red-600">Failed</p>
          <p className="mt-1 font-display text-xl font-light text-red-700">{failCount}</p>
        </div>
      </div>

      {/* Test groups */}
      <div className="space-y-4">
        {TEST_GROUPS.map((group) => (
          <div key={group.name} className="rounded-lg border border-black/10 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-md border ${COLOR_MAP[group.color]}`}>
                <group.icon className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm font-medium">{group.name}</p>
              <span className="text-[10px] text-black/30">{group.tests.length} tests</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {group.tests.map((test) => {
                const result = results[test.name];
                return (
                  <div
                    key={test.name}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      result?.status === "pass" ? "border-emerald-200 bg-emerald-50/50"
                      : result?.status === "warn" ? "border-amber-200 bg-amber-50/50"
                      : result?.status === "fail" ? "border-red-200 bg-red-50/50"
                      : "border-black/10 bg-white"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{test.name}</p>
                      <p className="text-[10px] text-black/40 truncate">{test.desc}</p>
                      {result?.status === "fail" && (
                        <p className="mt-1 text-[10px] text-red-600 leading-tight">⚠ {result.message}</p>
                      )}
                      {result?.status === "warn" && (
                        <p className="mt-1 text-[10px] text-amber-600 leading-tight">⚠ {result.message}</p>
                      )}
                    </div>
                    <button
                      onClick={() => runTest(test.name, test.payload)}
                      disabled={running === test.name || runningAll}
                      className="shrink-0 rounded-md border border-black/15 p-2 hover:bg-black hover:text-white disabled:opacity-50"
                    >
                      {running === test.name ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                       result?.status === "pass" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> :
                       result?.status === "fail" ? <X className="h-3.5 w-3.5 text-red-600" /> :
                       result?.status === "warn" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> :
                       <Play className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}