import React, { useState, useMemo } from 'react';
import { Search, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { FLORIDA_SOURCE_CATEGORIES, TOTAL_SOURCES, TOTAL_CATEGORIES, TOTAL_SUBCATEGORIES } from '@/lib/floridaSources';

const TAG_COLORS = {
  'free': '#247a45',
  'paid': '#a6640b',
  'owner-data': '#375a7f',
  'parcel-maps': '#375a7f',
  'sales-history': '#375a7f',
  'tax-delinquent': '#b33a31',
  'tax-deed-sales': '#b33a31',
  'foreclosures': '#b33a31',
  'lis-pendens': '#b33a31',
  'probate': '#7b3fa3',
  'heirs': '#7b3fa3',
  'obituaries': '#7b3fa3',
  'code-violations': '#a6640b',
  'condemned': '#a6640b',
  'bankruptcy': '#b33a31',
  'divorce': '#b33a31',
  'hoa-foreclosures': '#b33a31',
  'auctions': '#c38a1b',
  'reo': '#c38a1b',
  'fsbo': '#247a45',
  'wholesale': '#c38a1b',
  'investor': '#c38a1b',
  'land': '#247a45',
  'mobile-homes': '#375a7f',
  'commercial': '#375a7f',
  'mls': '#375a7f',
  'skip-trace': '#7b3fa3',
  'crm': '#375a7f',
  'dialer': '#375a7f',
  'attorneys': '#7b3fa3',
  'lenders': '#c38a1b',
  'hard-money': '#c38a1b',
  'contractors': '#a6640b',
  'inspectors': '#a6640b',
  'appraisers': '#a6640b',
  'surveyors': '#a6640b',
  'title': '#375a7f',
  'escrow': '#375a7f',
  'insurance': '#375a7f',
  'reia': '#c38a1b',
  'realtors': '#375a7f',
  'agents': '#375a7f',
  'directory': '#6f6a60',
  'statewide': '#6f6a60',
  'all-counties': '#6f6a60',
  'facebook': '#1877f2',
  'linkedin': '#0a66c2',
  'meetup': '#e51937',
  'public-notices': '#7b3fa3',
  'api': '#375a7f',
  'proxy': '#375a7f',
  'captcha': '#375a7f',
  'browser': '#375a7f',
  'parsing': '#375a7f',
  'automation': '#375a7f',
};

function TagBadge({ tag }) {
  const color = TAG_COLORS[tag] || '#6f6a60';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: '999px',
        fontSize: '10px',
        fontWeight: 700,
        color: '#fff',
        background: color,
        whiteSpace: 'nowrap',
      }}
    >
      {tag}
    </span>
  );
}

function SourceCard({ source }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        padding: '16px',
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.2s ease',
        height: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--gold)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(30,25,15,.08)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
        <strong style={{ fontSize: '13px', lineHeight: '1.3', color: 'var(--ink)' }}>{source.name}</strong>
        <ExternalLink size={13} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }} />
      </div>
      <p style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: '1.5', margin: '0 0 8px 0' }}>{source.description}</p>
      {source.tags && source.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {source.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}
    </a>
  );
}

function SubcategorySection({ sub, search }) {
  const [expanded, setExpanded] = useState(true);

  const filtered = useMemo(() => {
    if (!search) return sub.sources;
    const q = search.toLowerCase();
    return sub.sources.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.tags && s.tags.some((t) => t.includes(q)))
    );
  }, [sub.sources, search]);

  if (filtered.length === 0) return null;

  return (
    <div style={{ marginBottom: '28px' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          background: 'transparent',
          border: '0',
          textAlign: 'left',
          cursor: 'pointer',
          padding: '0',
          marginBottom: '12px',
        }}
      >
        {expanded ? <ChevronDown size={16} style={{ color: 'var(--gold)' }} /> : <ChevronRight size={16} style={{ color: 'var(--gold)' }} />}
        <h3 style={{ fontSize: '16px', fontWeight: 750, margin: 0, color: 'var(--ink)' }}>{sub.name}</h3>
        <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>({filtered.length})</span>
      </button>
      {expanded && (
        <>
          <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.6', margin: '0 0 14px 24px', maxWidth: '900px' }}>
            {sub.description}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '12px',
              marginLeft: '24px',
            }}
          >
            {filtered.map((source) => (
              <SourceCard key={source.name} source={source} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CategorySection({ category, search, isActive }) {
  if (!isActive) return null;

  const hasResults = category.subcategories.some((sub) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return sub.sources.some(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.tags && s.tags.some((t) => t.includes(q)))
    );
  });

  if (!hasResults) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
        <p style={{ fontSize: '14px' }}>No sources found matching your search in this category.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--ink)' }}>{category.name}</h2>
        <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6', margin: 0, maxWidth: '900px' }}>
          {category.description}
        </p>
      </div>
      {category.subcategories.map((sub) => (
        <SubcategorySection key={sub.name} sub={sub} search={search} />
      ))}
    </div>
  );
}

export default function FloridaSourceDirectory() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(FLORIDA_SOURCE_CATEGORIES[0].id);

  return (
    <div style={{ minHeight: 'calc(100vh - var(--header-h))', background: '#faf8f3' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0e0e0d 0%, #1a1814 100%)',
          color: '#fff',
          padding: '40px 26px 30px',
        }}
      >
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '0.13em', fontWeight: 850, color: 'var(--gold-2)' }}>
              FLORIDA • END-TO-END SOURCE DIRECTORY
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 900, margin: '0 0 10px 0', letterSpacing: '-0.03em', lineHeight: '1.05' }}>
            Every Source for Finding <em style={{ color: 'var(--gold)', fontStyle: 'normal' }}>Everything</em>
          </h1>
          <p style={{ fontSize: '15px', color: '#aaa', maxWidth: '800px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
            The complete directory of every source for finding distressed properties, land, investors, heirs, images,
            agents, adjacent business partners, associations, Facebook groups, people who know about distress, data tools,
            and scraping infrastructure — all for Florida.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div>
              <strong style={{ fontSize: '28px', color: 'var(--gold-2)', display: 'block' }}>{TOTAL_CATEGORIES}</strong>
              <small style={{ fontSize: '11px', color: '#888' }}>Categories</small>
            </div>
            <div>
              <strong style={{ fontSize: '28px', color: 'var(--gold-2)', display: 'block' }}>{TOTAL_SUBCATEGORIES}</strong>
              <small style={{ fontSize: '11px', color: '#888' }}>Subcategories</small>
            </div>
            <div>
              <strong style={{ fontSize: '28px', color: 'var(--gold-2)', display: 'block' }}>{TOTAL_SOURCES}+</strong>
              <small style={{ fontSize: '11px', color: '#888' }}>Sources</small>
            </div>
            <div>
              <strong style={{ fontSize: '28px', color: 'var(--gold-2)', display: 'block' }}>67</strong>
              <small style={{ fontSize: '11px', color: '#888' }}>FL Counties</small>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: '600px' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}
            />
            <input
              type="text"
              placeholder="Search all sources by name, description, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 14px 14px 44px',
                border: '1px solid #333',
                borderRadius: '10px',
                background: '#1a1814',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
              onBlur={(e) => (e.target.style.borderColor = '#333')}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '24px 26px 60px',
          display: 'grid',
          gridTemplateColumns: '240px 1fr',
          gap: '24px',
        }}
      >
        {/* Category Sidebar */}
        <aside
          style={{
            position: 'sticky',
            top: '90px',
            height: 'max-content',
            maxHeight: 'calc(100vh - 110px)',
            overflowY: 'auto',
            paddingRight: '8px',
          }}
        >
          {FLORIDA_SOURCE_CATEGORIES.map((cat) => {
            const count = cat.subcategories.reduce((t, s) => t + s.sources.length, 0);
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 12px',
                  border: '0',
                  borderRadius: '8px',
                  background: isActive ? '#111' : 'transparent',
                  color: isActive ? 'var(--gold-2)' : 'var(--ink)',
                  fontSize: '12px',
                  fontWeight: isActive ? 750 : 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginBottom: '2px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = '#f0ede5';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ lineHeight: '1.3' }}>{cat.name}</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: isActive ? 'var(--gold-2)' : 'var(--muted)',
                    flexShrink: 0,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Main Content */}
        <main style={{ minWidth: 0 }}>
          {FLORIDA_SOURCE_CATEGORIES.map((cat) => (
            <CategorySection key={cat.id} category={cat} search={search} isActive={activeCategory === cat.id} />
          ))}
        </main>
      </div>

      {/* Mobile sidebar note */}
      <style>{`
        @media (max-width: 820px) {
          aside { position: static !important; max-height: none !important; display: flex !important; overflow-x: auto !important; gap: 8px; padding-bottom: 12px; }
          aside button { white-space: nowrap; flex-shrink: 0; }
          .content-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}