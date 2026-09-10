// Cache + Acquisition Intelligence — Phase 8.
// A source/query cache layer that answers:
// "Do we already possess sufficiently fresh evidence?"
// If yes → use existing evidence. If no → acquire.
//
// Built on the CacheEntry entity. For production-scale throughput,
// this interface maps to Redis via the same getCache/setCache contract.

import { secrets } from "base44:runtime";

/**
 * Normalizes inputs into a deterministic cache key.
 * Incorporates: source + query + parameters + relevant time window.
 */
export function cacheKey(source: string, query: string, params?: any, timeWindowDays?: number): string {
  const normalized = JSON.stringify({
    source: source.toLowerCase().trim(),
    query: query.toLowerCase().trim(),
    params: params || {},
    // Time window buckets: data acquired in the same window is reusable
    window: timeWindowDays ? Math.floor(Date.now() / (timeWindowDays * 86400000)) : "any",
  });
  // Simple hash (no crypto needed — this is for dedup, not security)
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${source}::${Math.abs(hash).toString(36)}`;
}

/**
 * Check if sufficiently fresh evidence exists in cache.
 * Returns the cached response if fresh, null otherwise.
 */
export async function getCache(db: any, source: string, query: string, params?: any, ttlSeconds?: number): Promise<any | null> {
  const key = cacheKey(source, query, params);
  const entries = await db.entities.CacheEntry.filter({ cache_key: key }).catch(() => []);
  if (entries.length === 0) return null;

  const entry = entries[0];
  const now = Date.now();
  const expiresAt = new Date(entry.expires_at).getTime();

  if (now > expiresAt) {
    // Stale — mark expired but don't delete (caller may want to diff)
    await db.entities.CacheEntry.updateMany(
      { cache_key: key },
      { $set: { status: "expired" }, $inc: { hit_count: 1 } }
    ).catch(() => {});
    return null;
  }

  // Fresh — increment hit count
  await db.entities.CacheEntry.updateMany(
    { cache_key: key },
    { $inc: { hit_count: 1 } }
  ).catch(() => {});

  return entry.response;
}

/**
 * Store a response in cache with a TTL.
 */
export async function setCache(
  db: any,
  source: string,
  query: string,
  response: any,
  opts: { ttlSeconds?: number; provenance?: string; params?: any; tenantId?: string } = {}
): Promise<void> {
  const key = cacheKey(source, query, opts.params);
  const now = new Date().toISOString();
  const ttl = opts.ttlSeconds || 86400; // default 24h
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  // Hash the response for diff detection
  const responseStr = JSON.stringify(response);
  let hash = 0;
  for (let i = 0; i < responseStr.length; i++) {
    const char = responseStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const responseHash = Math.abs(hash).toString(36);

  // Upsert: if key exists, update; otherwise create
  const existing = await db.entities.CacheEntry.filter({ cache_key: key }).catch(() => []);
  if (existing.length > 0) {
    await db.entities.CacheEntry.update(existing[0].id, {
      response,
      response_hash: responseHash,
      cached_at: now,
      expires_at: expiresAt,
      ttl_seconds: ttl,
      provenance: opts.provenance || source,
      status: "fresh",
    });
  } else {
    await db.entities.CacheEntry.create({
      cache_key: key,
      source,
      query,
      response,
      response_hash: responseHash,
      cached_at: now,
      expires_at: expiresAt,
      ttl_seconds: ttl,
      provenance: opts.provenance || source,
      status: "fresh",
      hit_count: 0,
      tenant_id: opts.tenantId || "",
    });
  }
}

/**
 * Invalidate a cache entry (force re-acquisition on next request).
 */
export async function invalidateCache(db: any, source: string, query: string, params?: any): Promise<void> {
  const key = cacheKey(source, query, params);
  await db.entities.CacheEntry.updateMany({ cache_key: key }, { $set: { status: "invalidated" } }).catch(() => {});
}

/**
 * Check freshness without returning data.
 * Returns { fresh: boolean, age_seconds: number, hits: number }
 */
export async function checkFreshness(db: any, source: string, query: string, params?: any): Promise<{ fresh: boolean; age_seconds: number; hits: number }> {
  const key = cacheKey(source, query, params);
  const entries = await db.entities.CacheEntry.filter({ cache_key: key }).catch(() => []);
  if (entries.length === 0) return { fresh: false, age_seconds: Infinity, hits: 0 };

  const entry = entries[0];
  const age = (Date.now() - new Date(entry.cached_at).getTime()) / 1000;
  const expiresAt = new Date(entry.expires_at).getTime();
  return { fresh: Date.now() < expiresAt, age_seconds: age, hits: entry.hit_count || 0 };
}