import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { processProxyBids } from '../../shared/bidding.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { property_id, new_bid_amount, exclude_investor_id } = body || {};
    if (!property_id || !new_bid_amount) {
      return Response.json({ error: 'property_id and new_bid_amount required' }, { status: 400 });
    }

    const result = await processProxyBids(base44, {
      property_id,
      new_bid_amount,
      exclude_investor_id: exclude_investor_id || null
    });

    if (result.applied) {
      // Outbid the triggering bid if the proxy overbid it
      try {
        await base44.asServiceRole.functions.invoke('sendBidNotifications', {
          property_id,
          notification_type: 'outbid',
          investor_id: exclude_investor_id
        });
      } catch (e) {}
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}