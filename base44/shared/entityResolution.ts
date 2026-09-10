// Entity Resolution Engine — Phase 4.
// Determines whether two EntityRecord instances represent the same
// real-world entity using explainable match scoring.
//
// SAME / LIKELY_SAME / POSSIBLY_SAME / DIFFERENT / CONFLICTED / UNKNOWN
//
// Evidence signals: name, address, parcel, phone, email, company,
// domain, ownership, historical relationships, source, temporal consistency.

import { gatewayChat } from "../shared/aiGateway.ts";
import { fenceExternalContent, securitySystemPrompt } from "../shared/security.ts";

export type ResolutionDecision = "SAME" | "LIKELY_SAME" | "POSSIBLY_SAME" | "DIFFERENT" | "CONFLICTED" | "UNKNOWN";

export interface MatchSignal {
  field: string;
  score: number; // 0-100
  weight: number;
  detail: string;
}

export interface ResolutionResult {
  decision: ResolutionDecision;
  overall_score: number; // 0-100
  signals: MatchSignal[];
  recommendation: "merge" | "link" | "keep_separate" | "investigate";
  explanation: string;
}

// ─── Deterministic similarity scoring ───

function normalizeString(s: string): string {
  return (s || "").toLowerCase().trim().replace(/[.,\s]+/g, " ").replace(/\b(llc|inc|corp|corporation|trust|co|ltd|the)\b/g, "").trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function nameSimilarity(a: string, b: string): number {
  const na = normalizeString(a), nb = normalizeString(b);
  if (!na || !nb) return 0;
  if (na === nb) return 100;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 0;
  return Math.round((1 - levenshtein(na, nb) / maxLen) * 100);
}

function addressSimilarity(a: string, b: string): number {
  const na = normalizeString(a), nb = normalizeString(b);
  if (!na || !nb) return 0;
  if (na === nb) return 100;
  // Check if one contains the other (e.g., "123 Main St" vs "123 Main St, Miami, FL")
  if (na.includes(nb) || nb.includes(na)) return 85;
  const maxLen = Math.max(na.length, nb.length);
  return Math.round((1 - levenshtein(na, nb) / maxLen) * 100);
}

function phoneMatch(a: string, b: string): number {
  const na = (a || "").replace(/\D/g, "").slice(-10);
  const nb = (b || "").replace(/\D/g, "").slice(-10);
  if (!na || !nb) return 0;
  return na === nb ? 100 : 0;
}

function emailMatch(a: string, b: string): number {
  const na = (a || "").toLowerCase().trim();
  const nb = (b || "").toLowerCase().trim();
  if (!na || !nb) return 0;
  return na === nb ? 100 : 0;
}

/**
 * Score two EntityRecords for similarity using deterministic signals.
 */
export function scoreEntityPair(a: any, b: any): ResolutionResult {
  const signals: MatchSignal[] = [];

  // Name similarity (weight: 30)
  const nameScore = nameSimilarity(a.canonical_name || "", b.canonical_name || "");
  signals.push({ field: "name", score: nameScore, weight: 30, detail: `Name similarity: ${nameScore}%` });

  // Type must match for high confidence
  if (a.type && b.type && a.type !== b.type) {
    signals.push({ field: "type", score: 0, weight: 20, detail: `Type mismatch: ${a.type} vs ${b.type}` });
  } else {
    signals.push({ field: "type", score: 100, weight: 10, detail: "Type match" });
  }

  // Address similarity (weight: 20)
  const addrA = a.properties?.address || a.properties?.contact_address || "";
  const addrB = b.properties?.address || b.properties?.contact_address || "";
  if (addrA && addrB) {
    const addrScore = addressSimilarity(addrA, addrB);
    signals.push({ field: "address", score: addrScore, weight: 20, detail: `Address similarity: ${addrScore}%` });
  }

  // Phone match (weight: 15)
  const phoneA = a.properties?.phone || a.properties?.contact_phone || "";
  const phoneB = b.properties?.phone || b.properties?.contact_phone || "";
  if (phoneA && phoneB) {
    const phoneScore = phoneMatch(phoneA, phoneB);
    signals.push({ field: "phone", score: phoneScore, weight: 15, detail: `Phone match: ${phoneScore}%` });
  }

  // Email match (weight: 15)
  const emailA = a.properties?.email || a.properties?.contact_email || "";
  const emailB = b.properties?.email || b.properties?.contact_email || "";
  if (emailA && emailB) {
    const emailScore = emailMatch(emailA, emailB);
    signals.push({ field: "email", score: emailScore, weight: 15, detail: `Email match: ${emailScore}%` });
  }

  // Aliases check (weight: 10)
  const aliasesA = a.aliases || [];
  const aliasesB = b.aliases || [];
  if (aliasesA.length > 0 || aliasesB.length > 0) {
    const allA = [a.canonical_name, ...aliasesA].map(normalizeString);
    const allB = [b.canonical_name, ...aliasesB].map(normalizeString);
    const aliasMatch = allA.some((x: string) => allB.some((y: string) => x === y));
    signals.push({ field: "aliases", score: aliasMatch ? 100 : 0, weight: 10, detail: aliasMatch ? "Alias overlap found" : "No alias overlap" });
  }

  // Compute weighted score
  const totalWeight = signals.reduce((s, sig) => s + sig.weight, 0);
  const weightedSum = signals.reduce((s, sig) => s + (sig.score * sig.weight), 0);
  const overallScore = Math.round(weightedSum / (totalWeight || 1));

  // Decision thresholds
  let decision: ResolutionDecision;
  let recommendation: "merge" | "link" | "keep_separate" | "investigate";

  if (overallScore >= 90) {
    decision = "SAME";
    recommendation = "merge";
  } else if (overallScore >= 75) {
    decision = "LIKELY_SAME";
    recommendation = "merge";
  } else if (overallScore >= 55) {
    decision = "POSSIBLY_SAME";
    recommendation = "link";
  } else if (overallScore >= 30) {
    decision = "UNKNOWN";
    recommendation = "investigate";
  } else {
    decision = "DIFFERENT";
    recommendation = "keep_separate";
  }

  // Check for conflicts (high name score but different type = conflict)
  if (nameScore >= 80 && a.type && b.type && a.type !== b.type) {
    decision = "CONFLICTED";
    recommendation = "investigate";
  }

  const explanation = signals.map((s) => `${s.field}: ${s.score}% (w${s.weight})`).join("; ");

  return { decision, overall_score: overallScore, signals, recommendation, explanation };
}

/**
 * Merge two EntityRecords, preserving merge history.
 * The surviving record absorbs the other's aliases, evidence, and properties.
 */
export async function mergeEntities(db: any, survivorId: string, absorbedId: string, reason: string): Promise<any> {
  const survivor = await db.entities.EntityRecord.get(survivorId);
  const absorbed = await db.entities.EntityRecord.get(absorbedId);

  const mergedAliases = Array.from(new Set([
    ...(survivor.aliases || []),
    absorbed.canonical_name,
    ...(absorbed.aliases || []),
  ])).filter(Boolean);

  const mergedEvidence = Array.from(new Set([
    ...(survivor.evidence_ids || []),
    ...(absorbed.evidence_ids || []),
  ]));

  const mergedProperties = { ...(absorbed.properties || {}), ...(survivor.properties || {}) };

  const mergeEntry = {
    merged_with: absorbedId,
    merged_at: new Date().toISOString(),
    reason,
  };

  const updated = await db.entities.EntityRecord.update(survivorId, {
    aliases: mergedAliases,
    evidence_ids: mergedEvidence,
    properties: mergedProperties,
    merge_history: [...(survivor.merge_history || []), mergeEntry],
    confidence: Math.max(survivor.confidence || 0, absorbed.confidence || 0),
    last_verified: new Date().toISOString(),
  });

  // Update relationships pointing to absorbed entity → point to survivor
  const rels = await db.entities.Relationship.filter({ $or: [{ source_entity_id: absorbedId }, { target_entity_id: absorbedId }] }).catch(() => []);
  for (const rel of rels) {
    const update: any = {};
    if (rel.source_entity_id === absorbedId) update.source_entity_id = survivorId;
    if (rel.target_entity_id === absorbedId) update.target_entity_id = survivorId;
    if (Object.keys(update).length > 0) {
      await db.entities.Relationship.update(rel.id, update).catch(() => {});
    }
  }

  // Mark absorbed entity as merged (don't delete — preserve audit trail)
  await db.entities.EntityRecord.update(absorbedId, {
    status: "conflicted",
    properties: { ...absorbed.properties, merged_into: survivorId, merged_at: new Date().toISOString() },
  });

  return updated;
}