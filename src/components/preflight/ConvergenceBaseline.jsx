import React from 'react';

export default function ConvergenceBaseline({ baseline }) {
  if (!baseline) return null;
  return <section className="mt-5 rounded-xl border border-border bg-card p-5 text-card-foreground" aria-labelledby="convergence-title">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h3 id="convergence-title" className="font-heading text-lg font-semibold">Convergence baseline</h3><p className="mt-1 text-sm text-muted-foreground">Read-only evidence, not an automatic repair or production certification.</p></div>
      <strong className="rounded-md bg-secondary px-3 py-1 text-xs text-secondary-foreground">{baseline.status.replaceAll('_', ' ')}</strong>
    </div>
    <p className="mt-3 text-sm">{baseline.pass} passed · {baseline.fail} failed · {baseline.unknown} unknown</p>
    <ul className="mt-4 divide-y divide-border border-t border-border">
      {baseline.checks.map(check => <li key={check.id} className="py-3 text-sm"><span className="font-semibold">{check.status} · {check.label}</span><p className="mt-1 text-xs text-muted-foreground">{check.evidence}</p></li>)}
    </ul>
    <p className="mt-3 text-sm"><strong>Next:</strong> {baseline.next_action}</p>
  </section>;
}