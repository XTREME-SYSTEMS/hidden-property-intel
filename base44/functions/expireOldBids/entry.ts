import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Expires all bids that have passed their expires_at timestamp.
 * Runs daily via the Daily Maintenance workflow.
 * Marks expired bids as 'withdrawn' so they no longer count as active.
 */

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date().toISOString();

    // Fetch all active bids (up to 500) and filter for expired ones
    const bids = await base44.asServiceRole.entities.Bid.filter({ status: 'active' }, '-created_date', 500);
    const expired = bids.filter(b => b.expires_at && new Date(b.expires_at) < new Date(now));

    let count = 0;
    for (const b of expired) {
      try {
        await base44.asServiceRole.entities.Bid.update(b.id, { status: 'withdrawn' });
        count++;
      } catch (e) {
        console.error('expire bid failed', b.id, e?.message);
      }
    }

    return Response.json({ expired: count, checked: bids.length });
  } catch (error) {
    console.error('expireOldBids error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}