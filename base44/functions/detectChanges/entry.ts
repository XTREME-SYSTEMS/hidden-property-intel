import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { gatewayChat } from "../../shared/aiGateway.ts";
import { fenceExternalContent, securitySystemPrompt } from "../../shared/security.ts";

/**
 * detectChanges — Snapshot + Diff Engine (Phase 6 & 7).
 * Captures a normalized snapshot of source data, diffs it against the
 * previous snapshot, classifies changes, and creates IntelEvent records
 * for meaningful changes only. Only creates events when changes are
 * actually detected — no noise.
 *
 * Flow: SOURCE SNAPSHOT → NORMALIZATION → DIFF → CHANGE CLASSIFICATION
 *       → INTEL EVENT → RE-EVALUATION
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const db = base44.asServiceRole;

  const { source, target_ref, current_data, property_id, entity_id } = body;
  if (!source || !current_data) {
    return Response.json({ error: 'source and current_data required' }, { status: 400 });
  }

  // Normalize current data (deterministic key ordering)
  const normalizedData = normalizeForDiff(current_data);
  const snapshotHash = hashString(JSON.stringify(normalizedData));
  const now = new Date().toISOString();

  // Fetch previous snapshot for this source + target
  const prevSnapshots = await db.entities.SourceSnapshot.filter(
    { source, target_ref: target_ref || "" },
    "-captured_at", 1
  ).catch(() => []);

  const previous = prevSnapshots.length > 0 ? prevSnapshots[0] : null;

  // If hash matches previous, no changes — don't create a new snapshot or events
  if (previous && previous.snapshot_hash === snapshotHash) {
    return Response.json({
      source: 'snapshot_diff_engine',
      changed: false,
      reason: 'Snapshot hash matches previous — no changes detected',
      snapshot_hash: snapshotHash,
      previous_snapshot_id: previous.id,
    });
  }

  // Compute diff
  let diff: any = { added: {}, removed: {}, changed: {} };
  let diffSummary = 'Initial snapshot — no previous data to diff against';

  if (previous) {
    diff = computeDiff(previous.data || {}, normalizedData);
    const changes = Object.keys(diff.added).length + Object.keys(diff.removed).length + Object.keys(diff.changed).length;
    diffSummary = `${changes} changes: ${Object.keys(diff.added).length} added, ${Object.keys(diff.removed).length} removed, ${Object.keys(diff.changed).length} changed`;

    if (changes === 0) {
      // Hash differed but normalized data is same — store snapshot but no events
      const snap = await db.entities.SourceSnapshot.create({
        source,
        target_ref: target_ref || "",
        snapshot_hash: snapshotHash,
        data: normalizedData,
        captured_at: now,
        previous_snapshot_id: previous.id,
        diff,
        diff_summary: 'No meaningful changes',
        events_generated: 0,
      });
      return Response.json({ source: 'snapshot_diff_engine', changed: false, snapshot: snap, diff });
    }
  }

  // Classify changes into IntelEvents
  const events: any[] = [];

  // Ownership changes
  if (diff.changed.owner_name || diff.changed.ownership_percentage) {
    events.push({
      property_id: property_id || "",
      entity_id: entity_id || "",
      event_type: "ownership",
      event_date: now,
      classification: "fact",
      description: `Ownership changed: ${JSON.stringify(diff.changed.owner_name || diff.changed.ownership_percentage)}`,
      confidence: 90,
      source,
    });
  }

  // Tax changes
  if (diff.changed.tax_assessed_value || diff.changed.tax_delinquent_amount) {
    events.push({
      property_id: property_id || "",
      event_type: "tax_change",
      event_date: now,
      classification: "fact",
      description: `Tax change detected: ${JSON.stringify(diff.changed)}`,
      confidence: 90,
      source,
    });
  }

  // Price changes
  if (diff.changed.estimated_value || diff.changed.proposed_asking_price) {
    events.push({
      property_id: property_id || "",
      event_type: "price_change",
      event_date: now,
      classification: "fact",
      description: `Price change: ${JSON.stringify(diff.changed)}`,
      confidence: 90,
      source,
    });
  }

  // Listing changes
  if (diff.added.listing_url || diff.removed.listing_url) {
    events.push({
      property_id: property_id || "",
      event_type: diff.added.listing_url ? "listing_created" : "listing_removed",
      event_date: now,
      classification: "fact",
      description: diff.added.listing_url ? `New listing: ${diff.added.listing_url}` : `Listing removed`,
      confidence: 85,
      source,
    });
  }

  // Permit changes
  if (diff.added.permits) {
    events.push({
      property_id: property_id || "",
      event_type: "permit",
      event_date: now,
      classification: "fact",
      description: `New permit(s): ${JSON.stringify(diff.added.permits)}`,
      confidence: 85,
      source,
    });
  }

  // Distress signal changes
  if (diff.added.distress_signals || diff.changed.foreclosure_status) {
    events.push({
      property_id: property_id || "",
      event_type: "distress_signal",
      event_date: now,
      classification: "observation",
      description: `Distress signal detected: ${JSON.stringify(diff.added.distress_signals || diff.changed.foreclosure_status)}`,
      confidence: 75,
      source,
    });
  }

  // Contact changes
  if (diff.changed.contact_phone || diff.changed.contact_email) {
    events.push({
      property_id: property_id || "",
      entity_id: entity_id || "",
      event_type: "contact_change",
      event_date: now,
      classification: "fact",
      description: `Contact information changed`,
      confidence: 80,
      source,
    });
  }

  // Vacancy changes
  if (diff.changed.occupancy_status || diff.changed.vacancy_detected) {
    events.push({
      property_id: property_id || "",
      event_type: "vacancy_signal",
      event_date: now,
      classification: "observation",
      description: `Occupancy status changed: ${JSON.stringify(diff.changed.occupancy_status || diff.changed.vacancy_detected)}`,
      confidence: 70,
      source,
    });
  }

  // Create IntelEvent records
  const createdEvents = [];
  for (const evt of events) {
    try {
      const created = await db.entities.IntelEvent.create(evt);
      createdEvents.push(created);
    } catch (e) {
      console.error('Failed to create IntelEvent', e);
    }
  }

  // Store the new snapshot
  const snapshot = await db.entities.SourceSnapshot.create({
    source,
    target_ref: target_ref || "",
    snapshot_hash: snapshotHash,
    data: normalizedData,
    captured_at: now,
    previous_snapshot_id: previous?.id || "",
    diff,
    diff_summary: diffSummary,
    events_generated: createdEvents.length,
  });

  return Response.json({
    source: 'snapshot_diff_engine',
    changed: true,
    diff_summary: diffSummary,
    diff,
    events_generated: createdEvents.length,
    events: createdEvents.map((e: any) => ({ id: e.id, event_type: e.event_type, description: e.description })),
    snapshot_id: snapshot.id,
  });
}

// ─── Helpers ───

function normalizeForDiff(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(normalizeForDiff);
  const sorted: any = {};
  for (const key of Object.keys(data).sort()) {
    sorted[key] = normalizeForDiff(data[key]);
  }
  return sorted;
}

function hashString(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function computeDiff(prev: any, curr: any): { added: any; removed: any; changed: any } {
  const added: any = {};
  const removed: any = {};
  const changed: any = {};

  const allKeys = new Set([...Object.keys(prev), ...Object.keys(curr)]);

  for (const key of allKeys) {
    const prevVal = prev[key];
    const currVal = curr[key];

    if (prevVal === undefined && currVal !== undefined) {
      added[key] = currVal;
    } else if (prevVal !== undefined && currVal === undefined) {
      removed[key] = prevVal;
    } else if (JSON.stringify(prevVal) !== JSON.stringify(currVal)) {
      changed[key] = { from: prevVal, to: currVal };
    }
  }

  return { added, removed, changed };
}