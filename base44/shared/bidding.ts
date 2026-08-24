export const MIN_INCREMENT = 1000;

export const BID_EXPIRY_DAYS = 30;

export function bidExpiryIso() {
  return new Date(Date.now() + BID_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Evaluate proxy (auto) bids on a property after a new bid of `new_bid_amount`.
 * The highest proxy bidder whose max >= new_bid_amount is auto-raised to
 * min(their max, new_bid_amount + MIN_INCREMENT). Returns the proxy bid placed
 * (if any) so the caller can outbid the triggering bid accordingly.
 */
export async function processProxyBids(base44, { property_id, new_bid_amount, exclude_investor_id }) {
  const existing = await base44.asServiceRole.entities.Bid.filter({ property_id });
  const proxies = existing.filter(
    (b) =>
      b.is_proxy_bid &&
      b.status === 'active' &&
      b.max_proxy_amount >= new_bid_amount &&
      b.investor_id !== exclude_investor_id
  );
  if (!proxies.length) return { applied: false };

  const topProxy = proxies.sort((a, b) => b.max_proxy_amount - a.max_proxy_amount)[0];

  // Subscription re-validation: don't execute proxy bids for lapsed subscriptions
  const investor = await base44.asServiceRole.entities.Investor.filter({ user_id: topProxy.investor_id });
  const inv = investor[0];
  if (inv && !['active', 'trial'].includes(inv.subscription_status)) {
    // expire the stale proxy bid
    await base44.asServiceRole.entities.Bid.update(topProxy.id, { status: 'withdrawn' });
    return { applied: false, reason: 'subscription_lapsed' };
  }
  if (inv && inv.subscription_plan !== 'elite') {
    return { applied: false, reason: 'proxy_requires_elite' };
  }
  const proxyBidAmount = Math.min(topProxy.max_proxy_amount, new_bid_amount + MIN_INCREMENT);

  await base44.asServiceRole.entities.Bid.create({
    property_id,
    investor_id: topProxy.investor_id,
    investor_name: topProxy.investor_name,
    bid_amount: proxyBidAmount,
    bid_type: 'proxy',
    status: 'active',
    is_proxy_bid: true,
    max_proxy_amount: topProxy.max_proxy_amount,
    expires_at: bidExpiryIso()
  });

  return {
    applied: true,
    proxy_bid_amount: proxyBidAmount,
    proxy_investor_id: topProxy.investor_id,
    proxy_bid_id: topProxy.id
  };
}