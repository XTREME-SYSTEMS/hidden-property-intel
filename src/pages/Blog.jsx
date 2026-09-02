import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PenLine, Search, ArrowRight, Calendar, User, TrendingUp } from "lucide-react";
import Seo from "@/components/Seo";

const SAMPLE_POSTS = [
  {
    id: 1,
    title: "Why distressed properties are the best-kept secret in real estate investing",
    excerpt: "Most investors chase the same MLS listings. The real deals — the ones with 40%+ equity spreads — never hit the public market. Here's how to find them before anyone else does.",
    category: "Investing",
    author: "Steve Giordano",
    date: "2025-08-28",
    readTime: "6 min",
  },
  {
    id: 2,
    title: "How AI is changing the way we value distressed real estate",
    excerpt: "Traditional comps take hours and miss the nuance of distress. AI scoring does it in seconds — and weighs 15+ factors a human appraiser can't simultaneously hold in their head.",
    category: "Technology",
    author: "HPI Team",
    date: "2025-08-25",
    readTime: "5 min",
  },
  {
    id: 3,
    title: "Smart-contract escrow: closing in 7 days instead of 30",
    excerpt: "Wire fraud cost real estate $446M last year. Smart contracts on Polygon eliminate the risk — and cut closing time by 75%. Here's how it works in plain English.",
    category: "Smart Contracts",
    author: "Steve Giordano",
    date: "2025-08-20",
    readTime: "8 min",
  },
  {
    id: 4,
    title: "The probate goldmine: finding inherited properties before they list",
    excerpt: "When someone inherits a house they don't want, they sell fast and cheap. Probate records are public — but finding them requires knowing where to look. We do.",
    category: "Deal Finding",
    author: "HPI Team",
    date: "2025-08-15",
    readTime: "7 min",
  },
  {
    id: 5,
    title: "Selling a distressed property: how to get the highest price",
    excerpt: "If you're facing foreclosure or can't afford repairs, you might think you have to take the first lowball offer. You don't. Here's how to create competition for your property.",
    category: "For Sellers",
    author: "Steve Giordano",
    date: "2025-08-10",
    readTime: "6 min",
  },
  {
    id: 6,
    title: "The 5 biggest mistakes new investors make with distressed properties",
    excerpt: "I've watched investors lose six figures on deals that looked great on paper. Here are the five mistakes I see over and over — and how to avoid every one of them.",
    category: "Investing",
    author: "Steve Giordano",
    date: "2025-08-05",
    readTime: "9 min",
  },
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
    <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-12">
      <Seo
        title="Blog — Real Estate Investing Insights & Distressed Property Intelligence"
        description="The Hidden Property Intel blog covers distressed property investing, AI deal scoring, smart-contract escrow, probate real estate, and the technology reshaping how investors find off-market deals."
        keywords="real estate investing blog, distressed property blog, off-market real estate, AI property valuation, smart contract real estate, probate investing, foreclosure investing, real estate technology blog"
        path="/blog"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "Hidden Property Intel Blog",
          "description": "Real estate investing insights, distressed property intelligence, and smart-contract escrow education.",
          "url": "https://hiddenpropertyintel.com/blog",
        }}
      />

      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-black/40">
        <PenLine className="h-4 w-4" /> Blog
      </div>
      <h1 className="mt-3 font-display text-4xl font-light tracking-tight sm:text-6xl">
        Field notes from the <em className="not-italic text-gold">distressed property</em> trenches.
      </h1>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-black/60">
        Written by investors and operators who've been in the business for decades — not by AI. We cover deal-finding,
        AI scoring, smart-contract escrow, probate, and the technology that's quietly rewriting how distressed real
        estate gets bought and sold.
      </p>

      {/* Search + Categories */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-colors ${
                category === c ? "bg-black text-white" : "border border-black/15 text-black/60 hover:bg-black/5"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-sm border border-black/15 px-3 py-2">
          <Search className="h-4 w-4 text-black/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-black/30"
          />
        </div>
      </div>

      {/* Featured Post */}
      {filtered.length > 0 && category === "All" && !query && (
        <Link
          to="/blog"
          className="mt-12 grid gap-6 rounded-sm border border-black/10 bg-white p-6 transition-shadow hover:shadow-2xl lg:grid-cols-2 lg:p-8"
        >
          <div className="aspect-[16/10] overflow-hidden rounded-sm bg-black/5">
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-black/5 to-black/10">
              <TrendingUp className="h-12 w-12 text-black/20" />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[10px] uppercase tracking-[0.3em] text-gold">Featured · {filtered[0].category}</span>
            <h2 className="mt-3 font-display text-2xl font-light tracking-tight sm:text-3xl">{filtered[0].title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-black/60">{filtered[0].excerpt}</p>
            <div className="mt-4 flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-black/40">
              <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> {filtered[0].author}</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {filtered[0].date}</span>
              <span>{filtered[0].readTime} read</span>
            </div>
            <span className="mt-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-black">
              Read article <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      )}

      {/* Post Grid */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(query || category !== "All" ? filtered : filtered.slice(1)).map((p) => (
          <Link
            key={p.id}
            to="/blog"
            className="group flex flex-col rounded-sm border border-black/10 bg-white p-6 transition-shadow hover:shadow-xl"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-gold">{p.category}</span>
            <h3 className="mt-3 font-display text-lg font-medium leading-snug tracking-tight">{p.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-black/55">{p.excerpt}</p>
            <div className="mt-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-black/40">
              <span>{p.author}</span>
              <span>·</span>
              <span>{p.date}</span>
              <span>·</span>
              <span>{p.readTime}</span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-16 text-center text-sm text-black/40">
          No articles found. Try a different search or category.
        </div>
      )}

      {/* Newsletter */}
      <div className="mt-20 rounded-sm bg-black p-10 text-center text-white lg:p-16">
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-light leading-tight">
          Get the next article before it goes public.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60">
          One email per week. No fluff, no spam. Just the deals, data, and tools that matter.
        </p>
        <form className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 rounded-sm border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
          />
          <button className="rounded-sm bg-gold-warm px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-black hover:opacity-90">
            Subscribe
          </button>
        </form>
      </div>
    </div>
  );
}