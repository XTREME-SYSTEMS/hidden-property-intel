import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { property_id, bid_id } = body || {};
    if (!property_id || !bid_id) {
      return Response.json({ error: 'property_id and bid_id required' }, { status: 400 });
    }

    const property = await base44.asServiceRole.entities.Property.get(property_id);
    if (!property) return Response.json({ error: 'Property not found' }, { status: 404 });
    const isSeller = property.seller_id && property.seller_id === user.id;
    if (user.role !== 'admin' && !isSeller) {
      return Response.json({ error: 'Only the seller or admin can accept bids' }, { status: 403 });
    }

    const bid = await base44.asServiceRole.entities.Bid.get(bid_id);
    if (!bid || bid.property_id !== property_id) {
      return Response.json({ error: 'Bid not found for this property' }, { status: 404 });
    }
    if (bid.status !== 'active') {
      return Response.json({ error: 'Bid is no longer active' }, { status: 400 });
    }

    // accept this bid, reject all other active bids, move property under contract
    await base44.asServiceRole.entities.Bid.update(bid_id, { status: 'accepted' });
    await base44.asServiceRole.entities.Bid.updateMany(
      { property_id, status: 'active', id: { $ne: bid_id } },
      { $set: { status: 'rejected' } }
    );
    await base44.asServiceRole.entities.Property.update(property_id, { status: 'under_contract' });

    // notify the winning investor
    try {
      await base44.asServiceRole.functions.invoke('sendBidNotifications', {
        property_id,
        bid_id,
        notification_type: 'bid_accepted'
      });
    } catch (e) { /* best-effort */ }

    return Response.json({ accepted: true, bid_id, property_status: 'under_contract' });
  } catch (error) {
    console.error('acceptBid error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}