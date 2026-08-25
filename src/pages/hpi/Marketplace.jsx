import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Map as MapIcon, Search, SlidersHorizontal } from 'lucide-react';
import { PropertyCard } from '@/components/hpi/UI';
import { backend } from '@/api/hpiBackend';

const DISTRESS_TYPES = ['Pre-Foreclosure', 'Foreclosure', 'Inherited / Probate', 'Tax Delinquent', 'Code Violation', 'Auction', 'Short Sale', 'Bank Owned (REO)'];
const PROP_TYPES = ['residential', 'commercial', 'land', 'multi-family', 'mixed-use'];

export default function Marketplace() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [distress, setDistress] = useState([]);
  const [types, setTypes] = useState([]);
  const [sort, setSort] = useState('score');

  useEffect(() => { backend.listProperties().then(p => { setAll(p); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const filtered = useMemo(() => {
    let r = all.filter(p => {
      if (q && !`${p.address} ${p.city} ${p.state} ${p.zip}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (minPrice && p.price < +minPrice) return false;
      if (maxPrice && p.price > +maxPrice) return false;
      if (distress.length && !distress.includes(p.distress)) return false;
      if (types.length && !types.includes(p._raw?.property_type)) return false;
      return true;
    });
    if (sort === 'score') r = [...r].sort((a, b) => b.score - a.score);
    if (sort === 'price-low') r = [...r].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') r = [...r].sort((a, b) => b.price - a.price);
    if (sort === 'roi') r = [...r].sort((a, b) => b.roi - a.roi);
    return r;
  }, [all, q, minPrice, maxPrice, distress, types, sort]);

  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  return <>
    <div className="market-head">
      <div>
        <span className="eyebrow">Distressed Property Marketplace</span>
        <h1>Off-Market Inventory</h1>
        <p>{filtered.length} properties matching your criteria</p>
      </div>
      <div className="view-toggle">
        <button className="active"><LayoutGrid size={15} /> Grid</button>
        <Link to="/map-search"><MapIcon size={15} /> Map</Link>
      </div>
    </div>
    <div className="market-layout">
      <aside className="filters">
        <div className="filter-title"><SlidersHorizontal size={15} /> <strong>Filters</strong></div>
        <label>Location Search<input value={q} onChange={e => setQ(e.target.value)} placeholder="City, state, or ZIP" /></label>
        <div>
          <label>Price Range</label>
          <div className="range-row">
            <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min $" />
            <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max $" />
          </div>
        </div>
        <div>
          <label>Distress Type</label>
          <div className="filter-checks">
            {DISTRESS_TYPES.map(d => <label key={d} className="checkbox-line"><input type="checkbox" checked={distress.includes(d)} onChange={() => toggle(distress, setDistress, d)} /> {d}</label>)}
          </div>
        </div>
        <div>
          <label>Property Type</label>
          <div className="filter-checks">
            {PROP_TYPES.map(t => <label key={t} className="checkbox-line"><input type="checkbox" checked={types.includes(t)} onChange={() => toggle(types, setTypes, t)} /> {t}</label>)}
          </div>
        </div>
      </aside>
      <div className="market-results">
        <div className="results-toolbar">
          <div className="search-field"><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by address, city, or ZIP" /></div>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="score">Sort: HPI Score</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="roi">ROI: High to Low</option>
          </select>
        </div>
        <p className="result-count">{filtered.length} properties</p>
        <div className="property-grid marketplace-grid">
          {loading && <p className="route-loader">Loading…</p>}
          {!loading && filtered.map(p => <PropertyCard key={p.id} p={p} onSave={() => {}} />)}
          {!loading && !filtered.length && <p className="route-loader">No properties match your filters.</p>}
        </div>
      </div>
    </div>
  </>;
}