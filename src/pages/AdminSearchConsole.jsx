import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, FileText, TrendingUp, MousePointerClick, Eye, ArrowLeft, RefreshCw, ExternalLink, UploadCloud } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AdminSearchConsole() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);

  const submitSitemap = async (siteUrl) => {
    setSubmitting(true); setSubmitMsg(null);
    try {
      const res = await base44.functions.invoke("submitSitemap", { site_url: siteUrl });
      if (res.data?.error) setSubmitMsg({ site: siteUrl, error: res.data.error });
      else { setSubmitMsg({ site: siteUrl, ok: true, path: res.data.sitemap_path, status: res.data.status }); await load(); }
    } catch (e) {
      setSubmitMsg({ site: siteUrl, error: e.response?.data?.error || e.message });
    }
    setSubmitting(false);
  };

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await base44.functions.invoke("syncSearchConsole", {});
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load Search Console data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12">
      <Link to="/admin/architecture" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-black/50 hover:text-black">
        <ArrowLeft className="h-4 w-4" /> Architecture
      </Link>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Google Search Console</p>
          <h1 className="mt-2 font-display text-4xl font-light tracking-tight sm:text-5xl">Search performance & indexing</h1>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-sm border border-black/15 px-4 py-2.5 text-[11px] uppercase tracking-[0.3em] hover:bg-black hover:text-white disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mt-8 rounded-sm border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-medium">Couldn't pull Search Console data</p>
          <p className="mt-1 text-xs">{error}</p>
          <p className="mt-3 text-xs">Make sure you've added <code className="bg-red-100 px-1.5 py-0.5 rounded">https://my-property-intel.base44.app</code> as a property in Google Search Console and verified it.</p>
        </div>
      )}

      {loading && !data && <div className="mt-16 text-center text-sm text-black/40">Loading search performance…</div>}

      {data && (
        <>
          <p className="mt-3 text-xs text-black/50">Last 28 days · {data.startDate} → {data.endDate}</p>

          {data.report.length === 0 && (
            <div className="mt-8 rounded-sm border border-black/10 p-8 text-center text-sm text-black/50">
              No verified sites found in this Google account. Add your site in{" "}
              <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-black underline">
                Search Console <ExternalLink className="h-3 w-3" />
              </a>.
            </div>
          )}

          {data.report.map((site) => (
            <section key={site.siteUrl} className="mt-10">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-gold" />
                <h2 className="font-display text-2xl font-light">{site.siteUrl}</h2>
              </div>

              {/* Performance metrics */}
              <div className="mt-6 grid gap-px overflow-hidden rounded-sm border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
                <Metric icon={MousePointerClick} label="Clicks" value={site.performance.clicks.toLocaleString()} />
                <Metric icon={Eye} label="Impressions" value={site.performance.impressions.toLocaleString()} />
                <Metric icon={TrendingUp} label="Avg CTR" value={`${(site.performance.ctr || 0).toFixed(1)}%`} />
                <Metric icon={Search} label="Avg Position" value={(site.performance.position || 0).toFixed(1)} />
              </div>

              {/* Top queries */}
              {site.performance.topQueries.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-display text-lg font-light">Top search queries</h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-black/15 text-left text-[10px] uppercase tracking-[0.3em] text-black/40">
                          <th className="pb-3 pr-4">Query</th>
                          <th className="pb-3 pr-4 text-right">Clicks</th>
                          <th className="pb-3 pr-4 text-right">Impressions</th>
                          <th className="pb-3 pr-4 text-right">CTR</th>
                          <th className="pb-3 text-right">Position</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10">
                        {site.performance.topQueries.map((q) => (
                          <tr key={q.query} className="align-top">
                            <td className="py-3 pr-4 font-medium">{q.query}</td>
                            <td className="py-3 pr-4 text-right text-black/70">{q.clicks}</td>
                            <td className="py-3 pr-4 text-right text-black/70">{q.impressions.toLocaleString()}</td>
                            <td className="py-3 pr-4 text-right text-black/70">{(q.ctr * 100).toFixed(1)}%</td>
                            <td className="py-3 text-right text-black/70">{q.position.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sitemaps */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gold" />
                    <h3 className="font-display text-lg font-light">Sitemaps</h3>
                  </div>
                  {site.sitemaps.length > 0 && (
                    <button onClick={() => submitSitemap(site.siteUrl)} disabled={submitting} className="inline-flex items-center gap-2 rounded-sm border border-black/15 px-3 py-2 text-[10px] uppercase tracking-[0.3em] hover:bg-black hover:text-white disabled:opacity-50">
                      <UploadCloud className="h-3.5 w-3.5" /> {submitting ? "Submitting…" : "Resubmit"}
                    </button>
                  )}
                </div>
                {submitMsg && submitMsg.site === site.siteUrl && (
                  <div className={`mt-3 rounded-sm border p-3 text-xs ${submitMsg.error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                    {submitMsg.error ? submitMsg.error : `Sitemap ${submitMsg.status === "already_submitted" ? "already registered" : "submitted"}: ${submitMsg.path}`}
                  </div>
                )}
                {site.sitemaps.length === 0 ? (
                  <div className="mt-3">
                    <p className="text-xs text-black/50">No sitemaps submitted for this site.</p>
                    <button onClick={() => submitSitemap(site.siteUrl)} disabled={submitting} className="mt-3 inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2.5 text-[11px] uppercase tracking-[0.3em] text-white disabled:opacity-50">
                      <UploadCloud className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit sitemap.xml"}
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {site.sitemaps.map((s) => (
                      <div key={s.path} className="rounded-sm border border-black/10 p-4">
                        <div className="flex items-center justify-between">
                          <p className="truncate font-mono text-xs">{s.path}</p>
                          <span className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] ${
                            s.status === 'processed' ? 'bg-emerald-600 text-white' :
                            s.status === 'pending' ? 'bg-amber-500 text-white' :
                            'bg-red-600 text-white'
                          }`}>{s.status}</span>
                        </div>
                        <div className="mt-3 flex gap-4 text-[10px] text-black/50">
                          <span>Submitted: <b className="text-black/70">{s.submitted}</b></span>
                          <span>Indexed: <b className="text-black/70">{s.indexed}</b></span>
                          {s.errors > 0 && <span className="text-red-600">Errors: <b>{s.errors}</b></span>}
                          {s.warnings > 0 && <span className="text-amber-600">Warnings: <b>{s.warnings}</b></span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="bg-white p-6">
      <Icon className="h-5 w-5 text-black/40" />
      <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-black/40">{label}</p>
      <p className="mt-1 font-display text-2xl font-light tracking-tight">{value}</p>
    </div>
  );
}