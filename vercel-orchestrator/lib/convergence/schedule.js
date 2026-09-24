export const TASKS = Object.freeze({
  mirror_to_supabase: { intervalMs: 30 * 60 * 1000, protected: false, priority: 20 },
  trigger_scrape: { intervalMs: 6 * 60 * 60 * 1000, protected: false, priority: 30 },
  repair_title_risk: { intervalMs: 60 * 60 * 1000, protected: true, priority: 5 },
  repair_property_images: { intervalMs: 60 * 60 * 1000, protected: true, priority: 5 },
  repair_owner_enrichment: { intervalMs: 60 * 60 * 1000, protected: true, priority: 10 },
  investor_outreach: { intervalMs: 60 * 60 * 1000, protected: true, priority: 15 },
});

export function isDue(lastSuccessAt, intervalMs, now = new Date()) {
  if (!lastSuccessAt) return true;
  const last = new Date(lastSuccessAt).getTime();
  if (!Number.isFinite(last)) return true;
  return now.getTime() - last >= intervalMs;
}

export function idempotencyKey(taskName, intervalMs, now = new Date()) {
  const bucket = Math.floor(now.getTime() / intervalMs);
  return `${taskName}:${bucket}`;
}
