import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PenLine, Search, ArrowRight, Calendar, User } from "lucide-react";
import Seo from "@/components/Seo";

const SAMPLE_POSTS = [
  { id: 1, title: "Why distressed properties are the best-kept secret in real estate investing", excerpt: "Most investors chase the same MLS listings. The real deals — the ones with 40%+ equity spreads — never hit the public market. Here's how to find them before anyone else does.", category: "Investing", author: "Steve Giordano", date: "2025-08-28", readTime: "6 min", image: "https://images.unsplash.com/photo-1647265450512-339162927cd6?auto=format&fit=crop&w=800&q=80" },
  { id: 2, title: "How AI is changing the way we value distressed real estate", excerpt: "Traditional comps take hours and miss the nuance of distress. AI scoring does it in seconds — and weighs 15+ factors a human appraiser can't simultaneously hold in their head.", category: "Technology", author: "HPI Team", date: "2025-08-25", readTime: "5 min", image: "https://images.unsplash.com/photo-1518770660439-4636190ac4bb?auto=format&fit=crop&w=800&q=80" },
  { id: 3, title: "Smart-contract escrow: closing in 7 days instead of 30", excerpt: "Wire fraud cost real estate $446M last year. Smart contracts on Polygon eliminate the risk — and cut closing time by 75%. Here's how it works in plain English.", category: "Smart Contracts", author: "Steve Giordano", date: "2025-08-20", readTime: "8 min", image: "https://images.unsplash.com/photo-1625759886017-ccb98578f2f2?auto=format&fit=crop&w=800&q=80" },
  { id: 4, title: "The probate goldmine: finding inherited properties before they list", excerpt: "When someone inherits a house they don't want, they sell fast and cheap. Probate records are public — but finding them requires knowing where to look. We do.", category: "Deal Finding", author: "HPI Team", date: "2025-08-15", readTime: "7 min", image: "https://images.unsplash.com/photo-1616555670626-09496d2eed9e?auto=format&fit=crop&w=800&q=80" },
  { id: 5, title: "Selling a distressed property: how to get the highest price", excerpt: "If you're facing foreclosure or can't afford repairs, you might think you have to take the first lowball offer. You don't. Here's how to create competition for your property.", category: "For Sellers", author: "Steve Giordano", date: "2025-08-10", readTime: "6 min", image: "https://images.unsplash.com/photo-1606561959351-1e16db651db3?auto=format&fit=crop&w=800&q=80" },
  { id: 6, title: "The 5 biggest mistakes new investors make with distressed properties", excerpt: "I've watched investors lose six figures on deals that looked great on paper. Here are the five mistakes I see over and over — and how to avoid every one of them.", category: "Investing", author: "Steve Giordano", date: "2025-08-05", readTime: "9 min", image: "https://images.unsplash.com/photo-1598977946456-ae589f348af6?auto=format&fit=crop&w=800&q=80" },
];

const CATEGORIES = ["All", "Investing", "Technology", "Smart Contracts", "Deal Finding", "For Sellers"];

export default function Blog() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = SAMPLE_POSTS.filter((p) => {
    const matchCat = category === "All" || p.category === category;
    const matchQ = !query || p.title.toLowerCase().includes(query.toLowerCase()) || p.excerpt.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div>
      <Seo
        title="Blog — Real Estate Investing Insights & Distressed Property Intelligence"
        description="The Hidden Property Intel blog covers distressed property investing, AI deal scoring, smart-contract escrow, probate real estate, and the technology reshaping how investors find off-market deals."
        keywords="real estate investing blog, distressed property blog, off-market real estate, AI property valuation, smart contract real estate, probate investing, foreclosure investing"
        path="/blog"
        jsonLd={{ "@context": "https://schema.org", "@type": "Blog", "name": "Hidden Property Intel Blog", "description": "Real estate investing insights, distressed property intelligence, and smart-contract escrow education.", "url": "https://hiddenpropertyintel.com/blog" }}
      />

      <section className="z-page-hero">
        <p className="z-page-eyebrow"><PenLine size={14} style={{ display: "inline", marginRight: 4 }} /> Blog</p>
        <h1 className="z-page-h1">Field notes from the <em>distressed property</em> trenches.</h1>
        <p className="z-page-lead">Written by investors and operators who've been in the business for decades — not by AI. We cover deal-finding, AI scoring, smart-contract escrow, probate, and the technology that's quietly rewriting how distressed real estate gets bought and sold.</p>
      </section>

      <section className="z-section-pad" style={{ paddingTop: 8 }}>
        {/* Search + Categories */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`z-chip-btn ${category === c ? "active" : ""}`} style={{ padding: "7px 14px", border: "1px solid var(--z-border)", borderRadius: 999, background: category === c ? "var(--z-ink)" : "#fff", color: category === c ? "#fff" : "var(--z-ink-soft)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{c}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--z-border)", borderRadius: 8, padding: "0 12px", height: 40, minWidth: 240 }}>
            <Search size={16} style={{ color: "var(--z-muted)" }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search articles..." style={{ border: 0, outline: 0, width: "100%", fontSize: 14, fontFamily: "inherit", color: "var(--z-ink)", background: "transparent" }} />
          </div>
        </div>

        {/* Featured Post */}
        {filtered.length > 0 && category === "All" && !query && (
          <Link to="/blog" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, border: "1px solid var(--z-border)", borderRadius: 14, overflow: "hidden", background: "#fff", marginBottom: 24, textDecoration: "none" }} className="z-blog-featured">
            <div style={{ aspectRatio: "16/10", overflow: "hidden" }}><img src={filtered[0].image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /></div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: 28 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--z-blue)" }}>Featured · {filtered[0].category}</span>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--z-ink)", margin: "10px 0", letterSpacing: "-.02em" }}>{filtered[0].title}</h2>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--z-muted)" }}>{filtered[0].excerpt}</p>
              <div style={{ display: "flex", gap: 16, marginTop: 16, fontSize: 12, color: "var(--z-muted-2)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><User size={13} /> {filtered[0].author}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Calendar size={13} /> {filtered[0].date}</span>
                <span>{filtered[0].readTime} read</span>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 18, fontSize: 14, fontWeight: 700, color: "var(--z-blue)" }}>Read article <ArrowRight size={15} /></span>
            </div>
          </Link>
        )}

        {/* Post Grid */}
        <div className="z-grid-3">
          {(query || category !== "All" ? filtered : filtered.slice(1)).map((p) => (
            <Link key={p.id} to="/blog" style={{ display: "flex", flexDirection: "column", border: "1px solid var(--z-border)", borderRadius: 12, overflow: "hidden", background: "#fff", textDecoration: "none", transition: ".15s" }} className="z-blog-card">
              <div style={{ aspectRatio: "16/10", overflow: "hidden" }}><img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /></div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--z-blue)" }}>{p.category}</span>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--z-ink)", margin: "8px 0", lineHeight: 1.3 }}>{p.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--z-muted)", flex: 1 }}>{p.excerpt}</p>
                <div style={{ display: "flex", gap: 10, marginTop: 14, fontSize: 11, color: "var(--z-muted-2)" }}>
                  <span>{p.author}</span><span>·</span><span>{p.date}</span><span>·</span><span>{p.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "var(--z-muted)" }}>No articles found. Try a different search or category.</div>
        )}
      </section>

      {/* Newsletter */}
      <div className="z-cta-band">
        <h2>Get the next article before it goes public.</h2>
        <p>One email per week. No fluff, no spam. Just the deals, data, and tools that matter.</p>
        <form style={{ display: "flex", gap: 10, maxWidth: 460, margin: "0 auto", flexWrap: "wrap" }} onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="your@email.com" style={{ flex: 1, minWidth: 200, border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.05)", borderRadius: 8, padding: "12px 14px", fontSize: 14, color: "#fff", fontFamily: "inherit", outline: "none" }} />
          <button className="v2-btn v2-btn-primary">Subscribe</button>
        </form>
      </div>
    </div>
  );
}