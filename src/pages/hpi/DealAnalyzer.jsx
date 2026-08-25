import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, TrendingUp } from 'lucide-react';


export default function DealAnalyzer() {
  const [form, setForm] = useState({ arv: 280000, price: 145000, repairs: 35000, holding: 8000, closing: 4000, selling: 14000 });
  const set = k => e => setForm(f => ({ ...f, [k]: +e.target.value || 0 }));

  const totalCost = form.price + form.repairs + form.holding + form.closing + form.selling;
  const profit = form.arv - totalCost;
  const roi = totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0;
  const margin = form.arv > 0 ? Math.round((profit / form.arv) * 100) : 0;

  const bars = [
    { label: 'Acquisition', val: form.price },
    { label: 'Repairs', val: form.repairs },
    { label: 'Holding', val: form.holding },
    { label: 'Closing', val: form.closing },
    { label: 'Selling', val: form.selling },
  ];
  const maxBar = Math.max(...bars.map(b => b.val), 1);

  return <>
    <div className="analyzer-page">
      <div className="section-head">
        <div>
          <span className="eyebrow">Deal Analyzer</span>
          <h2>Underwrite in real time.</h2>
          <p>Adjust the inputs to model your flip, BRRRR, or buy-and-hold scenario.</p>
        </div>
      </div>
      <div className="analyzer-grid">
        <div className="analyzer-form">
          <label>After Repair Value (ARV)<input type="number" value={form.arv} onChange={set('arv')} /></label>
          <label>Purchase Price<input type="number" value={form.price} onChange={set('price')} /></label>
          <label>Estimated Repairs<input type="number" value={form.repairs} onChange={set('repairs')} /></label>
          <label>Holding Costs<input type="number" value={form.holding} onChange={set('holding')} /></label>
          <label>Closing Costs<input type="number" value={form.closing} onChange={set('closing')} /></label>
          <label>Selling Costs<input type="number" value={form.selling} onChange={set('selling')} /></label>
        </div>
        <div className="analyzer-results">
          <div className="result-cards">
            <div><span>Total Cost</span><strong>${totalCost.toLocaleString()}</strong></div>
            <div><span>Projected Profit</span><strong style={{ color: profit > 0 ? 'var(--success)' : 'var(--danger)' }}>${profit.toLocaleString()}</strong></div>
            <div><span>ROI</span><strong>{roi}%</strong></div>
            <div><span>Margin</span><strong>{margin}%</strong></div>
          </div>
          <div className="bar-chart">
            {bars.map(b => <span key={b.label} style={{ height: `${(b.val / maxBar) * 100}%` }} />)}
            <div className="chart-label">Cost breakdown</div>
          </div>
          <div className="analysis-note">
            <Calculator size={14} /> {profit > 0
              ? `This deal projects a healthy ${roi}% ROI with $${profit.toLocaleString()} profit. The 70% rule suggests you pay no more than $${Math.max(0, Math.round(form.arv * 0.7 - form.repairs)).toLocaleString()} for this property.`
              : 'This deal projects a loss at current numbers. Consider negotiating a lower purchase price or reducing repair estimates.'}
          </div>
          <Link to="/marketplace" className="btn gold wide" style={{ marginTop: 12 }}>Find More Deals</Link>
        </div>
      </div>
    </div>
  </>;
}