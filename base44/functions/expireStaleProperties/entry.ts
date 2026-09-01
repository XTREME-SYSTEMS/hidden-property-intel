import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Daily freshness guard: marks properties as 'expired' when they are no longer
 * available. A property is considered stale when:
 *  - it has been 'active' for more than 45 days with no scrape verification, OR
 *  - its last_verified_at is older than 45 days, OR
 *  - it has been 'under_contract' for more than 60 days (deal likely fell through
 *    or closed — either way it should leave the active inventory).
 *
 * Runs nightly via the Daily Maintenance workflow and can be triggered manually.
 */
const STALE_DAYS = 45;
const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const now = Date.now();
    const properties = await base44.asServiceRole.entities.Property.list('-created_date', 2000);

    const toExpire = [];
    for (const p of properties) {
      if (p.status !== 'active' && p.status !== 'under_contract') continue;

      const verified = p.last_verified_at || p.scraped_at || p.created_date;
      const verifiedAge = verified ? now - new Date(verified).getTime() : Infinity;

      let stale = false;
      if (p.status === 'active' && verifiedAge > STALE_MS) stale = true;
      if (p.status === 'under_contract' && verifiedAge > 60 * 24 * 60 * 60 * 1000) stale = true;

      if (stale) toExpire.push(p.id);
    }

    // batch update — updateMany with $set on the matched ids
    let expired = 0;
    for (const id of toExpire) {
      try {
        await base44.asServiceRole.entities.Property.update(id, { status: 'expired' });
        expired++;
      } catch (e) {
        console.error('expire failed', id, e?.message);
      }
    }

    return Response.json({
      checked: properties.length,
      expired,
      expired_ids: toExpire.slice(0, 50)
    });
  } catch (error) {
    console.error('expireStaleProperties error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}