import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { normalizeAddress, dedupeKey, proximityKey } from '../../shared/addressUtils.ts';

/**
 * Batch-normalizes all property addresses and merges duplicates.
 * - Sets normalized_address on every property
 * - Detects duplicates by normalized dedupe key + geohash proximity
 * - Merges duplicate records (keeps the richer one, links sources)
 *
 * Run on demand or via daily workflow.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const properties = await base44.asServiceRole.entities.Property.filter({}, null, 500);

    let normalized = 0;
    let duplicatesMerged = 0;
    const seen = new Map(); // dedupeKey → property record

    for (const p of properties) {
      const norm = normalizeAddress(p.address || '');
      const key = dedupeKey(p.address, p.zip_code);
      const proxKey = (p.lat && p.lng) ? proximityKey(p.lat, p.lng) : null;

      const existing = seen.get(key) || (proxKey ? seen.get(proxKey) : null);

      if (existing) {
        // Duplicate found — merge into the richer record
        const keep = (existing.description?.length || 0) >= (p.description?.length || 0) ? existing : p;
        const drop = keep === existing ? p : existing;

        // Move any bids, owners, scores to the kept record
        await base44.asServiceRole.entities.Bid.updateMany(
          { property_id: drop.id },
          { $set: { property_id: keep.id } }
        ).catch(() => {});
        await base44.asServiceRole.entities.Owner.updateMany(
          { property_id: drop.id },
          { $set: { property_id: keep.id } }
        ).catch(() => {});
        await base44.asServiceRole.entities.PropertyScore.updateMany(
          { property_id: drop.id },
          { $set: { property_id: keep.id } }
        ).catch(() => {});

        await base44.asServiceRole.entities.Property.delete(drop.id).catch(() => {});
        duplicatesMerged++;
      } else {
        seen.set(key, p);
        if (proxKey) seen.set(proxKey, p);
      }

      // Update normalized_address if changed
      if (norm && norm !== p.normalized_address) {
        await base44.asServiceRole.entities.Property.update(p.id, { normalized_address: norm }).catch(() => {});
        normalized++;
      }
    }

    return Response.json({
      total: properties.length,
      normalized,
      duplicates_merged: duplicatesMerged,
    });
  } catch (error) {
    console.error('normalizeAddresses error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}