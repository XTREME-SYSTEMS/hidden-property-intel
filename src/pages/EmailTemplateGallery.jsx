import React, { useState, useMemo } from "react";
import { EMAIL_TEMPLATES, getCategories } from "../../base44/shared/emailTemplates";
import { Search, Mail, ShieldCheck, AlertTriangle, CheckCircle2, Loader2, X, Eye, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function EmailTemplateGallery() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState(null);
  const [copied, setCopied] = useState(false);

  const categories = ["All", ...getCategories()];

  const filtered = useMemo(() => {
    return EMAIL_TEMPLATES.filter((t) => {
      const matchCat = activeCategory === "All" || t.category === activeCategory;
      const matchSearch = !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.subject.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  const validateTemplate = async (template) => {
    setValidating(true);
    setValidation(null);
    try {
      const res = await base44.functions.invoke("validateEmailQuality", {
        subject: template.subject,
        body: template.body,
        audience: template.audience,
        template_id: template.id,
      });
      setValidation(res.data);
    } catch (e) {
      setValidation({ error: e.message });
    }
    setValidating(false);
  };

  const copyTemplate = (template) => {
    const text = `Subject: ${template.subject}\n\n${template.body.replace(/<[^>]*>/g, "")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12">
      <p className="text-[11px] uppercase tracking-[0.4em] text-black/40">Eden Skye · Email System</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight sm:text-5xl">Email template gallery</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-black/60">
        Every type of outgoing, outreach, response, and follow-up email used across the platform — {EMAIL_TEMPLATES.length} branded
        templates across {categories.length - 1} categories. Each is QA-validated for professionalism, layout, content,
        tone, and compliance.
      </p>

      {/* Controls */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-sm border border-black/15 px-3 py-2.5">
          <Search className="h-4 w-4 text-black/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] transition ${
              activeCategory === cat
                ? "bg-black text-white"
                : "border border-black/15 text-black/60 hover:bg-black/5"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <div key={t.id} className="flex flex-col rounded-sm border border-black/10 p-5 transition hover:border-black/30">
            <div className="flex items-start justify-between">
              <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-black/50">{t.type.replace("_", " ")}</span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-black/40">{t.audience}</span>
            </div>
            <p className="mt-3 font-display text-base">{t.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-black/50">{t.description}</p>
            <p className="mt-3 truncate text-xs font-medium text-black/70">{t.subject || "(no subject — social message)"}</p>
            <p className="mt-1 text-[10px] text-black/40">{t.tone}</p>
            <div className="mt-4 flex items-center gap-2 border-t border-black/10 pt-3">
              <button
                onClick={() => { setPreviewTemplate(t); setValidation(null); }}
                className="inline-flex items-center gap-1.5 rounded-sm border border-black/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-black/70 hover:bg-black hover:text-white"
              >
                <Eye className="h-3 w-3" /> Preview
              </button>
              <button
                onClick={() => copyTemplate(t)}
                className="inline-flex items-center gap-1.5 rounded-sm border border-black/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-black/70 hover:bg-black hover:text-white"
              >
                <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 text-center text-sm text-black/40">No templates match your search.</div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPreviewTemplate(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-sm border border-black/10 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-black/10 bg-white px-6 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-black/40">{previewTemplate.category}</p>
                <h3 className="font-display text-xl">{previewTemplate.name}</h3>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="rounded-sm p-1.5 text-black/40 hover:bg-black/5">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid gap-4 text-xs">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Audience</p>
                  <p className="mt-1 font-medium">{previewTemplate.audience}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Type</p>
                  <p className="mt-1 font-medium">{previewTemplate.type.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Tone</p>
                  <p className="mt-1 font-medium">{previewTemplate.tone}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Subject</p>
                  <p className="mt-1 font-medium">{previewTemplate.subject || "(no subject — social message)"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Variables</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {previewTemplate.variables.length === 0 ? (
                      <span className="text-black/40">None</span>
                    ) : (
                      previewTemplate.variables.map((v) => (
                        <span key={v} className="rounded bg-black/5 px-2 py-0.5 font-mono text-[10px]">{`{{${v}}}`}</span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">Email Preview</p>
                <div className="mt-2 overflow-hidden rounded-sm border border-black/10" dangerouslySetInnerHTML={{ __html: previewTemplate.body }} />
              </div>

              {/* QA Validation */}
              <div className="mt-6 border-t border-black/10 pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">QA Validation</p>
                  <button
                    onClick={() => validateTemplate(previewTemplate)}
                    disabled={validating}
                    className="inline-flex items-center gap-2 rounded-sm bg-black px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white disabled:opacity-50"
                  >
                    {validating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Validating…</> : <><ShieldCheck className="h-3.5 w-3.5" /> Run QA check</>}
                  </button>
                </div>

                {validation && !validation.error && (
                  <div className="mt-4">
                    <div className="flex items-center gap-3">
                      {validation.passed ? (
                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-8 w-8 text-amber-500" />
                      )}
                      <div>
                        <p className="font-display text-2xl">{validation.overall_score}/100</p>
                        <p className="text-xs text-black/50">{validation.passed ? "Passed QA" : "Needs improvement"}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-black/60">{validation.summary}</p>

                    {validation.dimension_scores && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {Object.entries(validation.dimension_scores).map(([dim, score]) => (
                          <div key={dim} className="rounded-sm border border-black/10 p-2.5">
                            <p className="text-[9px] uppercase tracking-[0.15em] text-black/40">{dim.replace("_", " ")}</p>
                            <p className="mt-1 font-display text-lg">{score}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {validation.findings?.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {validation.findings.map((f, i) => (
                          <div key={i} className="rounded-sm border border-black/10 p-3 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{f.dimension}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] ${
                                f.severity === "critical" ? "bg-red-600 text-white" :
                                f.severity === "high" ? "bg-amber-500 text-white" :
                                "bg-black/10 text-black/60"
                              }`}>{f.severity}</span>
                            </div>
                            <p className="mt-1 text-black/60">{f.finding}</p>
                            <p className="mt-1 text-black/50"><strong>Fix:</strong> {f.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {validation?.error && (
                  <div className="mt-4 rounded-sm border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    Error: {validation.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}