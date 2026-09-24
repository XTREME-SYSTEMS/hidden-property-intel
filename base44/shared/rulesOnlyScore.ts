// Evidence-limited scoring when AI integrations cannot run. No valuations or comparables are invented.
export function rulesOnlyScore(property: any) {
  const value = Number(property.estimated_value);
  const ask = Number(property.proposed_asking_price);
  const known = Number.isFinite(value) && value > 0 && Number.isFinite(ask) && ask > 0;
  const discount = known ? Math.max(0, Math.min(100, Math.round((1 - ask / value) * 100))) : null;
  const score = known ? Math.max(0, Math.min(100, Math.round(discount * 2))) : 0;
  return {
    overall_score: score,
    score_factors: { equity: score },
    distress_severity: 'medium',
    ai_analysis: known
      ? `Rules-only, unverified discount indicator: asking price is ${discount}% below the stored estimated value. This is NOT an AI valuation, verified market comp, repair estimate, title assessment, or investment recommendation. Check the underlying figures before making an offer.`
      : 'Rules-only assessment unavailable: asking price and estimated value must both be positive. No valuation, comparables, title assessment, or investment recommendation has been generated.',
    model_version: 'rules-only-unverified-v1',
    scored_at: new Date().toISOString(),
  };
}