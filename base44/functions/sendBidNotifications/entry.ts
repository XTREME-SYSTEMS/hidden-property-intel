import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { property_id, bid_id, notification_type, investor_id } = body || {};
    if (!property_id || !notification_type) {
      return Response.json({ error: 'property_id and notification_type required' }, { status: 400 });
    }

    const property = await base44.asServiceRole.entities.Property.get(property_id);
    const bid = bid_id ? await base44.asServiceRole.entities.Bid.get(bid_id) : null;

    const sent = [];

    const emailFor = async (uid) => {
      if (!uid) return null;
      const inv = await base44.asServiceRole.entities.Investor.filter({ user_id: uid });
      if (inv[0]?.email) return inv[0].email;
      const sellers = await base44.asServiceRole.entities.Seller.filter({ user_id: uid });
      return sellers[0]?.email || null;
    };

    const send = async (to, subject, body) => {
      if (!to) return;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({ to, subject, body });
        sent.push(to);
      } catch (e) {
        // best-effort
      }
    };

    const propLabel = `${property.address}, ${property.city}, ${property.state}`;

    if (notification_type === 'new_bid') {
      const sellerEmail = await emailFor(property.seller_id);
      await send(
        sellerEmail,
        `New bid on ${propLabel}`,
        `A new bid of $${(bid?.bid_amount ?? 0).toLocaleString()} was placed on your property at ${propLabel}. ` +
          `Log in to PropertyIntel to review all bids and use the AI negotiation assistant.`
      );
    } else if (notification_type === 'outbid') {
      const target = investor_id || bid?.investor_id;
      const email = await emailFor(target);
      await send(
        email,
        `You've been outbid on ${propLabel}`,
        `You've been outbid on ${propLabel}. Log in to PropertyIntel to place a new bid.`
      );
    } else if (notification_type === 'bid_accepted') {
      const email = await emailFor(bid?.investor_id);
      await send(
        email,
        `Your bid on ${propLabel} was accepted`,
        `Congratulations — your bid of $${(bid?.bid_amount ?? 0).toLocaleString()} on ${propLabel} was accepted. ` +
          `Proceed to create a smart contract to close the deal.`
      );
    } else if (notification_type === 'auction_ending') {
      const active = await base44.asServiceRole.entities.Bid.filter({ property_id, status: 'active' });
      for (const b of active) {
        const email = await emailFor(b.investor_id);
        await send(
          email,
          `Auction ending soon — ${propLabel}`,
          `The auction for ${propLabel} is ending soon. The current highest bid is $${b.bid_amount.toLocaleString()}.`
        );
      }
    }

    return Response.json({ sent: sent.length, recipients: sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}