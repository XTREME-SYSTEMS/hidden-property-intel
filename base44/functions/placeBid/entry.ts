import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { processProxyBids, bidExpiryIso } from '../../shared/bidding.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { property_id, bid_amount, is_proxy_bid, max_proxy_amount } = body || {};
    if (!property_id || !bid_amount) {
      return Response.json({ error: 'property_id and bid_amount required' }, { status: 400 });
    }

    const property = await base44.asServiceRole.entities.Property.get(property_id);
    if (!property) return Response.json({ error: 'Property not found' }, { status: 404 });
    if (property.status !== 'active') {
      return Response.json({ error: 'Property is not accepting bids' }, { status: 400 });
    }

    // Subscription gate (admin bypass)
    let investor;
    if (user.role !== 'admin') {
      const inv = await base44.asServiceRole.entities.Investor.filter({ user_id: user.id });
      investor = inv[0];
      if (!investor) return Response.json({ error: 'Investor profile required to bid' }, { status: 403 });
      if (!['active', 'trial'].includes(investor.subscription_status)) {
        return Response.json({ error: 'Active subscription required to bid' }, { status: 403 });
      }
      if (is_proxy_bid && investor.subscription_plan !== 'elite') {
        return Response.json({ error: 'Proxy bidding requires the Elite plan' }, { status: 403 });
      }
    } else {
      const inv = await base44.asServiceRole.entities.Investor.filter({ user_id: user.id });
      investor = inv[0];
    }

    const existing = await base44.asServiceRole.entities.Bid.filter({ property_id });
    const activeBids = existing.filter((b) => b.status === 'active');
    const highest = activeBids.reduce((max, b) => (b.bid_amount > max ? b.bid_amount : max), 0);
    if (bid_amount <= highest) {
      return Response.json({ error: `Bid must exceed the current highest bid of $${highest.toLocaleString()}` }, { status: 400 });
    }
    if (is_proxy_bid && (max_proxy_amount == null || max_proxy_amount < bid_amount)) {
      return Response.json({ error: 'Proxy max must be at least the bid amount' }, { status: 400 });
    }

    const bid = await base44.asServiceRole.entities.Bid.create({
      property_id,
      investor_id: user.id,
      investor_name: investor?.name || user.full_name || user.email,
      bid_amount,
      bid_type: is_proxy_bid ? 'proxy' : 'initial',
      status: 'active',
      is_proxy_bid: !!is_proxy_bid,
      max_proxy_amount: is_proxy_bid ? max_proxy_amount : undefined,
      expires_at: bidExpiryIso()
    });

    // Outbid all lower active bids not owned by this bidder
    if (highest > 0) {
      await base44.asServiceRole.entities.Bid.updateMany(
        { property_id, status: 'active', bid_amount: { $lt: bid_amount }, investor_id: { $ne: user.id } },
        { $set: { status: 'outbid' } }
      );
    }

    // Auto-raise proxy bidders
    const proxyResult = await processProxyBids(base44, {
      property_id,
      new_bid_amount: bid_amount,
      exclude_investor_id: user.id
    });
    if (proxyResult.applied && proxyResult.proxy_bid_amount > bid_amount) {
      await base44.asServiceRole.entities.Bid.update(bid.id, { status: 'outbid' });
    }

    // Best-effort notifications
    try {
      await base44.asServiceRole.functions.invoke('sendBidNotifications', {
        property_id,
        bid_id: bid.id,
        notification_type: 'new_bid'
      });
      if (proxyResult.applied) {
        await base44.asServiceRole.functions.invoke('sendBidNotifications', {
          property_id,
          notification_type: 'outbid',
          investor_id: user.id
        });
      }
    } catch (e) {
      // notifications are best-effort
    }

    return Response.json({
      bid_id: bid.id,
      status: proxyResult.applied && proxyResult.proxy_bid_amount > bid_amount ? 'outbid' : 'active',
      bid_amount: bid.bid_amount,
      proxy_applied: proxyResult.applied
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}