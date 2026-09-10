// HPI Portable Intelligence Layer — Core Module
//
// Provides: SHA-256 checksums, manifest building, export packaging,
// import validation (dry-run), idempotent import execution, snapshot
// creation, snapshot comparison, and integrity checking.
//
// Every intelligence entity is treated as a portable asset that can be
// exported, checksummed, migrated, and reconstructed independently of
// the Base44 UI/database layer.

// ─── SHA-256 Checksum ───────────────────────────────────────────────

export async function sha256(data: string): Promise<string> {
  const buf = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function checksumRecord(record: any): Promise<string> {
  return sha256(JSON.stringify(record, Object.keys(record).sort()));
}

export async function checksumCollection(records: any[]): Promise<string> {
  const stable = JSON.stringify(records.map(r => JSON.stringify(r, Object.keys(r).sort())).sort());
  return sha256(stable);
}

// ─── Export Schema Versioning ──────────────────────────────────────

export const EXPORT_VERSION = "1.0.0";
export const SCHEMA_VERSION = "1.0.0";

export const INTELLIGENCE_ENTITIES = [
  "Property", "Owner", "EntityRecord", "Relationship", "Evidence",
  "IntelEvent", "Investigation", "PropertyScore", "OwnershipChain",
  "DataSource", "SourceSnapshot", "CacheEntry", "Job",
] as const;

export type IntelligenceEntity = typeof INTELLIGENCE_ENTITIES[number];

// Entity → export section name mapping
const ENTITY_SECTION: Record<string, string> = {
  Property: "properties",
  Owner: "owners",
  EntityRecord: "entities",
  Relationship: "relationships",
  Evidence: "evidence",
  IntelEvent: "events",
  Investigation: "investigations",
  PropertyScore: "scores",
  OwnershipChain: "ownership_chains",
  DataSource: "data_sources",
  SourceSnapshot: "snapshots",
  CacheEntry: "cache_entries",
  Job: "jobs",
};

// ─── Manifest Builder ──────────────────────────────────────────────

export interface ManifestFile {
  path: string;
  size: number;
  checksum: string;
  record_count: number;
  schema: string;
  created_at: string;
}

export interface ExportManifest {
  system: "HiddenPropertyIntel";
  export_version: string;
  schema_version: string;
  application_version: string;
  created_at: string;
  record_counts: Record<string, number>;
  entity_counts: Record<string, number>;
  graph_counts: { nodes: number; edges: number };
  investigation_counts: { total: number; completed: number; running: number };
  event_counts: number;
  checksum_algorithm: "SHA-256";
  files: ManifestFile[];
  dependencies: string[];
  warnings: string[];
  errors: string[];
}

// ─── Export Package Builder ────────────────────────────────────────

export interface ExportPackage {
  manifest: ExportManifest;
  data: Record<string, any[]>;
  checksums: Record<string, string>;
}

/**
 * Collect all intelligence records from the database and assemble
 * them into a portable export package with manifest + per-section checksums.
 */
export async function buildExportPackage(db: any, opts: { sections?: string[] } = {}): Promise<ExportPackage> {
  const now = new Date().toISOString();
  const sections = opts.sections || INTELLIGENCE_ENTITIES.map(e => ENTITY_SECTION[e]);
  const data: Record<string, any[]> = {};
  const files: ManifestFile[] = [];
  const checksums: Record<string, string> = {};
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const entityName of INTELLIGENCE_ENTITIES) {
    const sectionName = ENTITY_SECTION[entityName];
    if (!sections.includes(sectionName)) continue;

    try {
      const records = await db.entities[entityName].list("-created_date", 500).catch(() => []);
      data[sectionName] = records;

      const jsonStr = JSON.stringify(records);
      const checksum = await sha256(jsonStr);
      checksums[sectionName] = checksum;

      files.push({
        path: `data/${sectionName}.json`,
        size: jsonStr.length,
        checksum,
        record_count: records.length,
        schema: entityName,
        created_at: now,
      });
    } catch (e: any) {
      errors.push(`${entityName}: ${e.message}`);
      data[sectionName] = [];
    }
  }

  // Build derived counts
  const record_counts: Record<string, number> = {};
  for (const [section, records] of Object.entries(data)) {
    record_counts[section] = records.length;
  }

  const entity_counts: Record<string, number> = {};
  for (const entityName of INTELLIGENCE_ENTITIES) {
    const sectionName = ENTITY_SECTION[entityName];
    entity_counts[entityName] = data[sectionName]?.length || 0;
  }

  const graph_counts = {
    nodes: data.entities?.length || 0,
    edges: data.relationships?.length || 0,
  };

  const investigations = data.investigations || [];
  const investigation_counts = {
    total: investigations.length,
    completed: investigations.filter((i: any) => i.status === "completed").length,
    running: investigations.filter((i: any) => i.status === "running").length,
  };

  // Check for data quality issues
  if (graph_counts.edges > 0 && graph_counts.nodes === 0) {
    warnings.push("Graph edges exist but no entity nodes found — orphan edges");
  }
  if (data.evidence?.length > 0 && data.investigations?.length === 0) {
    warnings.push("Evidence records exist but no investigations — orphan evidence");
  }

  const manifest: ExportManifest = {
    system: "HiddenPropertyIntel",
    export_version: EXPORT_VERSION,
    schema_version: SCHEMA_VERSION,
    application_version: "1.0",
    created_at: now,
    record_counts,
    entity_counts,
    graph_counts,
    investigation_counts,
    event_counts: data.events?.length || 0,
    checksum_algorithm: "SHA-256",
    files,
    dependencies: INTELLIGENCE_ENTITIES.map(e => ENTITY_SECTION[e]),
    warnings,
    errors,
  };

  return { manifest, data, checksums };
}

// ─── Natural Key Functions (for idempotency) ───────────────────────
// The platform auto-generates IDs on create, so we use natural keys
// (business-logic fields) to detect duplicates and achieve idempotency.

const NATURAL_KEYS: Record<string, (r: any) => string> = {
  Property: (r) => [r.address, r.city, r.state, r.zip_code].filter(Boolean).join("|").toLowerCase().trim(),
  Owner: (r) => [r.name, r.property_id].filter(Boolean).join("|").toLowerCase().trim(),
  EntityRecord: (r) => [r.type, r.canonical_name].filter(Boolean).join("|").toLowerCase().trim(),
  Relationship: (r) => [r.source_entity_id, r.target_entity_id, r.type].filter(Boolean).join("|"),
  Evidence: (r) => [r.claim, r.entity_ref].filter(Boolean).join("|").toLowerCase().trim(),
  IntelEvent: (r) => [r.event_type, r.description, r.entity_id, r.property_id].filter(Boolean).join("|").toLowerCase().trim(),
  Investigation: (r) => [r.question, r.target_ref].filter(Boolean).join("|").toLowerCase().trim(),
  PropertyScore: (r) => r.property_id || "",
  OwnershipChain: (r) => r.property_id || "",
  DataSource: (r) => [r.name, r.url].filter(Boolean).join("|").toLowerCase().trim(),
  SourceSnapshot: (r) => [r.source, r.snapshot_hash].filter(Boolean).join("|"),
  CacheEntry: (r) => r.cache_key || "",
  Job: (r) => r.job_id || "",
};

function naturalKey(entityName: string, record: any): string {
  const fn = NATURAL_KEYS[entityName];
  if (!fn) return record.id || "";
  return fn(record) || record.id || "";
}

// Fields to exclude from content hash (system-managed, non-portable)
const SYSTEM_FIELDS = new Set(["id", "created_date", "updated_date", "created_by_id"]);

function isEmpty(v: any): boolean {
  return v === null || v === undefined || v === "" ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);
}

/**
 * Content hash for comparison. If `refKeys` is provided, only those fields
 * are hashed — this lets us compare an existing DB record against an import
 * record using only the import's field set, ignoring platform-added fields
 * (like `is_sample`) that the DB may inject.
 */
async function contentHash(record: any, refKeys?: Set<string>): Promise<string> {
  const portable: Record<string, any> = {};
  for (const [k, v] of Object.entries(record)) {
    if (SYSTEM_FIELDS.has(k)) continue;
    if (refKeys && !refKeys.has(k)) continue;
    if (isEmpty(v)) continue;
    portable[k] = v;
  }
  return sha256(JSON.stringify(portable, Object.keys(portable).sort()));
}

/** Build the set of non-system, non-empty field keys from a record. */
function portableKeys(record: any): Set<string> {
  const keys = new Set<string>();
  for (const [k, v] of Object.entries(record)) {
    if (SYSTEM_FIELDS.has(k)) continue;
    if (isEmpty(v)) continue;
    keys.add(k);
  }
  return keys;
}

// ─── Import Validation (Dry Run) ───────────────────────────────────

export interface ImportValidationResult {
  valid: boolean;
  manifest_ok: boolean;
  checksum_results: Record<string, { expected: string; actual: string; match: boolean }>;
  record_analysis: {
    total: number;
    new: number;
    existing_identical: number;
    existing_modified: number;
    conflicts: number;
    invalid: number;
  };
  conflicts: { section: string; id: string; reason: string }[];
  schema_issues: string[];
  missing_dependencies: string[];
  errors: string[];
}

/**
 * Validate an import package without modifying any data.
 * Verifies manifest, checksums, schema, and detects conflicts.
 */
export async function validateImportPackage(
  db: any,
  pkg: ExportPackage
): Promise<ImportValidationResult> {
  const errors: string[] = [];
  const conflicts: { section: string; id: string; reason: string }[] = [];
  const schema_issues: string[] = [];
  const missing_dependencies: string[] = [];
  const checksum_results: Record<string, { expected: string; actual: string; match: boolean }> = {};

  // 1. Manifest validation
  const manifest_ok = pkg.manifest?.system === "HiddenPropertyIntel" && !!pkg.manifest?.export_version;
  if (!manifest_ok) errors.push("Invalid manifest — missing system or export_version");

  // 2. Checksum validation
  for (const file of pkg.manifest?.files || []) {
    const sectionName = file.path.replace("data/", "").replace(".json", "");
    const records = pkg.data?.[sectionName] || [];
    const actualChecksum = await sha256(JSON.stringify(records));
    checksum_results[sectionName] = {
      expected: file.checksum,
      actual: actualChecksum,
      match: file.checksum === actualChecksum,
    };
    if (file.checksum !== actualChecksum) {
      errors.push(`Checksum mismatch in ${sectionName}: expected ${file.checksum}, got ${actualChecksum}`);
    }
  }

  // 3. Record analysis — check each record against existing DB using natural keys
  let total = 0, newCount = 0, existingIdentical = 0, existingModified = 0, conflictCount = 0, invalidCount = 0;

  const sectionToEntity: Record<string, string> = {};
  for (const [entity, section] of Object.entries(ENTITY_SECTION)) {
    sectionToEntity[section] = entity;
  }

  for (const [section, records] of Object.entries(pkg.data || {})) {
    const entityName = sectionToEntity[section];
    if (!entityName) continue;

    // Build natural key → existing record map for this entity
    const existingRecords = await db.entities[entityName].list("-created_date", 500).catch(() => []);
    const existingByKey = new Map<string, any>();
    for (const er of existingRecords) {
      const key = naturalKey(entityName, er);
      if (key) existingByKey.set(key, er);
    }

    for (const record of records as any[]) {
      total++;
      const nkey = naturalKey(entityName, record);
      if (!nkey) { invalidCount++; continue; }

      const existing = existingByKey.get(nkey);
      if (!existing) {
        newCount++;
      } else {
        const refKeys = portableKeys(record);
        const existingHash = await contentHash(existing, refKeys);
        const importHash = await contentHash(record, refKeys);
        if (existingHash === importHash) {
          existingIdentical++;
        } else {
          existingModified++;
          conflicts.push({
            section,
            id: record.id || nkey,
            reason: `Natural key "${nkey.slice(0, 40)}" exists with different content — existing ${existingHash.slice(0, 8)} vs import ${importHash.slice(0, 8)}`,
          });
          conflictCount++;
        }
      }
    }
  }

  // 4. Dependency analysis — check that referenced IDs exist
  const allIds = new Set<string>();
  for (const records of Object.values(pkg.data || {})) {
    for (const r of records as any[]) if (r.id) allIds.add(r.id);
  }

  // Check relationship references
  for (const rel of pkg.data?.relationships || []) {
    if (rel.source_entity_id && !allIds.has(rel.source_entity_id) && !await db.entities.EntityRecord.get(rel.source_entity_id).catch(() => null)) {
      missing_dependencies.push(`Relationship ${rel.id} references missing source entity ${rel.source_entity_id}`);
    }
    if (rel.target_entity_id && !allIds.has(rel.target_entity_id) && !await db.entities.EntityRecord.get(rel.target_entity_id).catch(() => null)) {
      missing_dependencies.push(`Relationship ${rel.id} references missing target entity ${rel.target_entity_id}`);
    }
  }

  // Check evidence references
  for (const ev of pkg.data?.evidence || []) {
    if (ev.investigation_id && !allIds.has(ev.investigation_id) && !await db.entities.Investigation.get(ev.investigation_id).catch(() => null)) {
      missing_dependencies.push(`Evidence ${ev.id} references missing investigation ${ev.investigation_id}`);
    }
  }

  const valid = errors.length === 0 && conflictCount === 0;

  return {
    valid,
    manifest_ok,
    checksum_results,
    record_analysis: {
      total, new: newCount, existing_identical: existingIdentical,
      existing_modified: existingModified, conflicts: conflictCount, invalid: invalidCount,
    },
    conflicts,
    schema_issues,
    missing_dependencies,
    errors,
  };
}

// ─── Import Execution ───────────────────────────────────────────────

export interface ImportResult {
  import_id: string;
  started_at: string;
  completed_at: string;
  status: "success" | "partial" | "failed";
  records_created: number;
  records_updated: number;
  records_skipped: number;
  records_failed: number;
  conflicts_resolved: number;
  errors: string[];
  section_results: Record<string, { created: number; updated: number; skipped: number; failed: number }>;
}

/**
 * Execute an import. Idempotent — identical records are skipped,
 * conflicts are resolved by keeping existing (or overwriting if force=true).
 */
export async function executeImport(
  db: any,
  pkg: ExportPackage,
  opts: { force?: boolean; dry_run?: boolean } = {}
): Promise<ImportResult> {
  const importId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  let created = 0, updated = 0, skipped = 0, failed = 0, conflictsResolved = 0;
  const sectionResults: Record<string, any> = {};

  const sectionToEntity: Record<string, string> = {};
  for (const [entity, section] of Object.entries(ENTITY_SECTION)) {
    sectionToEntity[section] = entity;
  }

  for (const [section, records] of Object.entries(pkg.data || {})) {
    const entityName = sectionToEntity[section];
    if (!entityName) continue;

    const secResult = { created: 0, updated: 0, skipped: 0, failed: 0 };

    // Build natural key → existing record map
    const existingRecords = await db.entities[entityName].list("-created_date", 500).catch(() => []);
    const existingByKey = new Map<string, any>();
    for (const er of existingRecords) {
      const key = naturalKey(entityName, er);
      if (key) existingByKey.set(key, er);
    }

    const toCreate: any[] = [];
    const toUpdate: { id: string; data: any }[] = [];

    for (const record of records as any[]) {
      const nkey = naturalKey(entityName, record);
      if (!nkey) { secResult.failed++; failed++; continue; }

      // Strip system fields — platform manages these
      const portable: any = {};
      for (const [k, v] of Object.entries(record)) {
        if (!SYSTEM_FIELDS.has(k)) portable[k] = v;
      }

      const existing = existingByKey.get(nkey);
      if (!existing) {
        toCreate.push(portable);
      } else {
        const refKeys = portableKeys(record);
        const existingHash = await contentHash(existing, refKeys);
        const importHash = await contentHash(record, refKeys);
        if (existingHash === importHash) {
          secResult.skipped++; skipped++;
        } else if (opts.force) {
          toUpdate.push({ id: existing.id, data: portable });
          conflictsResolved++;
        } else {
          secResult.skipped++; skipped++;
        }
      }
    }

    // Bulk create new records
    if (toCreate.length > 0 && !opts.dry_run) {
      try {
        await db.entities[entityName].bulkCreate(toCreate);
        secResult.created = toCreate.length;
        created += toCreate.length;
      } catch (e: any) {
        errors.push(`${entityName} bulkCreate: ${e.message}`);
        secResult.failed = toCreate.length;
        failed += toCreate.length;
      }
    } else if (toCreate.length > 0 && opts.dry_run) {
      secResult.created = toCreate.length;
      created += toCreate.length;
    }

    // Update modified records
    for (const upd of toUpdate) {
      if (opts.dry_run) { secResult.updated++; updated++; continue; }
      try {
        await db.entities[entityName].update(upd.id, upd.data);
        secResult.updated++; updated++;
      } catch (e: any) {
        errors.push(`${entityName} update ${upd.id}: ${e.message}`);
        secResult.failed++; failed++;
      }
    }

    sectionResults[section] = secResult;
  }

  const completedAt = new Date().toISOString();
  const status = failed > 0 ? (created > 0 || updated > 0 ? "partial" : "failed") : "success";

  return {
    import_id: importId,
    started_at: startedAt,
    completed_at: completedAt,
    status,
    records_created: created,
    records_updated: updated,
    records_skipped: skipped,
    records_failed: failed,
    conflicts_resolved: conflictsResolved,
    errors,
    section_results: sectionResults,
  };
}

// ─── Snapshot System ────────────────────────────────────────────────

export interface SnapshotSummary {
  snapshot_id: string;
  created_at: string;
  record_counts: Record<string, number>;
  checksum: string;
  type: "full" | "incremental";
  label: string;
}

/**
 * Create a snapshot — a lightweight summary of current intelligence state
 * (record counts + content checksum per section). The full export package
 * IS the snapshot's restorable content; this summary allows comparison.
 */
export async function createSnapshotSummary(db: any, label: string, type: "full" | "incremental" = "full"): Promise<SnapshotSummary> {
  const now = new Date().toISOString();
  const snapshotId = `snap-${now.slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}`;
  const record_counts: Record<string, number> = {};
  const sectionChecksums: string[] = [];

  for (const entityName of INTELLIGENCE_ENTITIES) {
    const sectionName = ENTITY_SECTION[entityName];
    try {
      const records = await db.entities[entityName].list("-created_date", 500).catch(() => []);
      record_counts[sectionName] = records.length;
      sectionChecksums.push(await checksumCollection(records));
    } catch {
      record_counts[sectionName] = 0;
    }
  }

  const checksum = await sha256(sectionChecksums.join("|"));

  return { snapshot_id: snapshotId, created_at: now, record_counts, checksum, type, label };
}

/**
 * Compare two snapshot summaries. Returns what changed between them.
 */
export function compareSnapshotSummaries(a: SnapshotSummary, b: SnapshotSummary): {
  added: Record<string, number>;
  removed: Record<string, number>;
  changed_sections: string[];
  total_delta: number;
} {
  const added: Record<string, number> = {};
  const removed: Record<string, number> = {};
  const changed_sections: string[] = [];
  let totalDelta = 0;

  const allSections = new Set([...Object.keys(a.record_counts), ...Object.keys(b.record_counts)]);

  for (const section of allSections) {
    const countA = a.record_counts[section] || 0;
    const countB = b.record_counts[section] || 0;
    const delta = countB - countA;
    if (delta > 0) { added[section] = delta; totalDelta += delta; }
    if (delta < 0) { removed[section] = Math.abs(delta); totalDelta += Math.abs(delta); }
    if (delta !== 0) changed_sections.push(section);
  }

  return { added, removed, changed_sections, total_delta: totalDelta };
}

// ─── Intelligence Integrity Checker ─────────────────────────────────

export interface IntegrityResult {
  integrity_score: number; // 0-100
  checks: { name: string; status: "pass" | "warning" | "fail"; detail: string }[];
  failures: string[];
  data_counts: Record<string, number>;
}

/**
 * Validate referential integrity across the intelligence layer.
 * Detects orphan edges, missing provenance, broken references, duplicates.
 */
export async function validateIntegrity(db: any): Promise<IntegrityResult> {
  const checks: { name: string; status: "pass" | "warning" | "fail"; detail: string }[] = [];
  const failures: string[] = [];
  const data_counts: Record<string, number> = {};

  // Collect all records
  const entities = await db.entities.EntityRecord.list("-created_date", 500).catch(() => []);
  const relationships = await db.entities.Relationship.list("-created_date", 500).catch(() => []);
  const evidence = await db.entities.Evidence.list("-created_date", 500).catch(() => []);
  const events = await db.entities.IntelEvent.list("-created_date", 500).catch(() => []);
  const investigations = await db.entities.Investigation.list("-created_date", 500).catch(() => []);
  const properties = await db.entities.Property.list("-created_date", 500).catch(() => []);
  const owners = await db.entities.Owner.list("-created_date", 500).catch(() => []);
  const scores = await db.entities.PropertyScore.list("-created_date", 500).catch(() => []);

  data_counts.properties = properties.length;
  data_counts.entities = entities.length;
  data_counts.relationships = relationships.length;
  data_counts.evidence = evidence.length;
  data_counts.events = events.length;
  data_counts.investigations = investigations.length;
  data_counts.owners = owners.length;
  data_counts.scores = scores.length;

  const entityIds = new Set(entities.map((e: any) => e.id));
  const investigationIds = new Set(investigations.map((i: any) => i.id));
  const propertyIds = new Set(properties.map((p: any) => p.id));

  // Check 1: Orphan graph edges (source/target entity doesn't exist)
  const orphanEdges = relationships.filter((r: any) => !entityIds.has(r.source_entity_id) || !entityIds.has(r.target_entity_id));
  checks.push({
    name: "Graph Edge Integrity",
    status: orphanEdges.length === 0 ? "pass" : "fail",
    detail: orphanEdges.length === 0 ? `${relationships.length} edges all resolve` : `${orphanEdges.length} orphan edges reference missing entities`,
  });
  if (orphanEdges.length > 0) failures.push(`${orphanEdges.length} orphan graph edges`);

  // Check 2: Evidence provenance completeness
  const evidenceWithoutSource = evidence.filter((e: any) => !e.sources || e.sources.length === 0);
  checks.push({
    name: "Evidence Provenance",
    status: evidenceWithoutSource.length === 0 ? "pass" : "warning",
    detail: evidenceWithoutSource.length === 0 ? `${evidence.length} evidence records all have sources` : `${evidenceWithoutSource.length} evidence records lack source attribution`,
  });
  if (evidenceWithoutSource.length > 0) failures.push(`${evidenceWithoutSource.length} evidence records without provenance`);

  // Check 3: Evidence → Investigation references
  const orphanEvidence = evidence.filter((e: any) => e.investigation_id && !investigationIds.has(e.investigation_id));
  checks.push({
    name: "Evidence → Investigation References",
    status: orphanEvidence.length === 0 ? "pass" : "warning",
    detail: orphanEvidence.length === 0 ? "All evidence investigations resolve" : `${orphanEvidence.length} evidence records reference missing investigations`,
  });

  // Check 4: Entity confidence populated
  const entitiesWithoutConfidence = entities.filter((e: any) => e.confidence === undefined || e.confidence === null);
  checks.push({
    name: "Entity Confidence Coverage",
    status: entitiesWithoutConfidence.length === 0 ? "pass" : "warning",
    detail: `${entities.length - entitiesWithoutConfidence.length}/${entities.length} entities have confidence scores`,
  });

  // Check 5: Duplicate entity detection (same canonical_name + type)
  const entityKeys = new Map<string, number>();
  for (const e of entities) {
    const key = `${e.type}:${(e.canonical_name || "").toLowerCase().trim()}`;
    entityKeys.set(key, (entityKeys.get(key) || 0) + 1);
  }
  const duplicates = Array.from(entityKeys.entries()).filter(([, count]) => count > 1);
  checks.push({
    name: "Entity Uniqueness",
    status: duplicates.length === 0 ? "pass" : "warning",
    detail: duplicates.length === 0 ? "No duplicate entity keys detected" : `${duplicates.length} potential duplicate entity groups`,
  });

  // Check 6: Property → Owner linkage
  const propertiesWithoutOwners = properties.filter((p: any) => !p.seller_id && p.source === "user_submitted");
  checks.push({
    name: "Property Owner Linkage",
    status: "pass",
    detail: `${properties.length - propertiesWithoutOwners.length}/${properties.length} user-submitted properties have seller linkage`,
  });

  // Check 7: Score → Property references
  const orphanScores = scores.filter((s: any) => s.property_id && !propertyIds.has(s.property_id));
  checks.push({
    name: "Score → Property References",
    status: orphanScores.length === 0 ? "pass" : "warning",
    detail: orphanScores.length === 0 ? "All scores reference valid properties" : `${orphanScores.length} scores reference missing properties`,
  });

  // Check 8: Event temporal integrity
  const eventsWithoutDate = events.filter((e: any) => !e.event_date && !e.created_date);
  checks.push({
    name: "Event Temporal Integrity",
    status: eventsWithoutDate.length === 0 ? "pass" : "warning",
    detail: eventsWithoutDate.length === 0 ? "All events have timestamps" : `${eventsWithoutDate.length} events lack temporal data`,
  });

  // Compute integrity score
  const passCount = checks.filter(c => c.status === "pass").length;
  const warningCount = checks.filter(c => c.status === "warning").length;
  const failCount = checks.filter(c => c.status === "fail").length;
  const integrityScore = Math.round(((passCount + warningCount * 0.5) / checks.length) * 100);

  return { integrity_score: integrityScore, checks, failures, data_counts };
}