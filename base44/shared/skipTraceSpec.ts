// =============================================================================
// Skip-Trace Resolution Spec — NIST SP 800-63A aligned entity resolution.
//
// Core principle: identity resolution, evidence validation, attribute validation,
// and identity verification are DISTINCT operations. A data match is never called
// "verified" unless it passes the mandatory accuracy gates.
//
// This module is the single source of truth for:
//   - Purpose gateway validation
//   - The five independent scores (never combined)
//   - Verification verdicts (VERIFIED / PROBABLE / AMBIGUOUS / CONFLICTED / SUPPRESSED / NOT_FOUND)
//   - Source registry + independence scoring
//   - Seed normalization (name, phone, email, address, business)
//   - Name intelligence (phonetics + similarity)
//   - Contradiction engine
// =============================================================================

export type Verdict =
  | "VERIFIED"
  | "PROBABLE"
  | "AMBIGUOUS"
  | "CONFLICTED"
  | "SUPPRESSED"
  | "NOT_FOUND";

export type ScoreKind =
  | "IDENTITY_MATCH"
  | "RELATIONSHIP_MATCH"
  | "CHANNEL_OWNERSHIP"
  | "CONTACT_ELIGIBILITY"
  | "TARGET_PRIORITY";

export interface Score {
  kind: ScoreKind;
  value: number; // 0-100 calibrated
  label: "none" | "weak" | "fair" | "strong" | "definitive";
  rationale: string;
  signals: { field: string; value: number; weight: number; detail: string }[];
}

// ─── Purpose Gateway ───────────────────────────────────────────────────────

export interface PurposeGate {
  case_type: "property_owner" | "residential_lead" | "contractor_lead" | "heir_search" | "asset_recovery";
  authorized_user: string;   // user id
  jurisdiction: string;     // e.g. "US-FL"
  permissible_purpose: string; // e.g. "FCRA_firm_offer_of_credit", "DPPA_limited_use", "legitimate_business_interest"
  intended_use: string;     // e.g. "distressed_property_acquisition", "tenant_screening"
  retention_period_days: number;
  permitted_outreach: ("voice" | "sms" | "email" | "mail" | "none")[];
}

export interface PurposeGateResult {
  passed: boolean;
  violations: string[];
}

export function validatePurposeGate(gate: Partial<PurposeGate>): PurposeGateResult {
  const violations: string[] = [];
  if (!gate.case_type) violations.push("case_type is required");
  if (!gate.authorized_user) violations.push("authorized_user is required");
  if (!gate.jurisdiction) violations.push("jurisdiction is required");
  if (!gate.permissible_purpose) violations.push("permissible_purpose is required");
  if (!gate.intended_use) violations.push("intended_use is required");
  if (!gate.retention_period_days || gate.retention_period_days <= 0) violations.push("retention_period_days must be positive");
  if (!gate.permitted_outreach || gate.permitted_outreach.length === 0) violations.push("permitted_outreach must include at least one channel or 'none'");
  return { passed: violations.length === 0, violations };
}

// ─── Seed Normalization ─────────────────────────────────────────────────────

export interface NormalizedSeed {
  name?: string;
  name_tokens: string[];
  phonetic_keys: string[];
  phone_e164?: string;
  email_normalized?: string;
  email_domain?: string;
  address_normalized?: string;
  address_tokens: string[];
  zip?: string;
  business_name?: string;
  business_normalized?: string;
  parcel_id?: string;
  entity_type: "individual" | "business";
}

const STOPWORDS = new Set(["the", "a", "an", "of", "and", "or", "llc", "inc", "corp", "corporation", "co", "ltd", "trust", "estate"]);

export function normalizeSeed(input: {
  name?: string; phone?: string; email?: string; address?: string; zip?: string;
  business_name?: string; parcel_id?: string; entity_type?: "individual" | "business";
}): NormalizedSeed {
  const seed: NormalizedSeed = {
    name_tokens: [],
    phonetic_keys: [],
    address_tokens: [],
    entity_type: input.entity_type || "individual",
  };

  if (input.name) {
    seed.name = input.name.trim();
    seed.name_tokens = tokenizeName(input.name);
    seed.phonetic_keys = phoneticKeys(input.name);
  }
  if (input.business_name) {
    seed.business_name = input.business_name.trim();
    seed.business_normalized = normalizeBusinessName(input.business_name);
  }
  if (input.phone) seed.phone_e164 = normalizePhoneE164(input.phone);
  if (input.email) {
    const e = normalizeEmail(input.email);
    if (e) { seed.email_normalized = e.local + "@" + e.domain; seed.email_domain = e.domain; }
  }
  if (input.address) {
    seed.address_normalized = normalizeAddress(input.address);
    seed.address_tokens = seed.address_normalized.split(" ").filter(Boolean);
  }
  if (input.zip) seed.zip = input.zip.trim();
  if (input.parcel_id) seed.parcel_id = input.parcel_id.trim().toUpperCase();

  return seed;
}

function tokenizeName(name: string): string[] {
  return name.toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function normalizeBusinessName(name: string): string {
  return name.toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,&/]/g, " ")
    .replace(/\b(llc|inc|incorporated|corp|corporation|co|company|ltd|limited|the|trust|pllc|pa|lp|llp)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePhoneE164(phone: string): string | undefined {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  if (digits.length > 6) return "+" + digits;
  return undefined;
}

export function normalizeEmail(email: string): { local: string; domain: string } | null {
  const m = email.toLowerCase().trim().match(/^([^@]+)@([^@]+\.[^@]+)$/);
  if (!m) return null;
  const local = m[1].replace(/\./g, "").replace(/\+.*$/, ""); // strip dots and plus-tags
  const domain = m[2].normalize("NFC");
  return { local, domain };
}

export function normalizeAddress(addr: string): string {
  const repl: Record<string, string> = {
    street: "st", avenue: "ave", boulevard: "blvd", road: "rd", lane: "ln",
    drive: "dr", court: "ct", place: "pl", north: "n", south: "s", east: "e", west: "w",
    apartment: "apt", suite: "ste", floor: "fl",
  };
  let a = addr.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s#]/g, " ").replace(/\s+/g, " ").trim();
  for (const [full, abbr] of Object.entries(repl)) {
    a = a.replace(new RegExp("\\b" + full + "\\b", "g"), abbr);
  }
  return a;
}

// ─── Name Intelligence (phonetics + similarity) ──────────────────────────────

// Simplified Double Metaphone — captures primary consonant key for surname matching.
function doubleMetaphonePrimary(word: string): string {
  const w = word.toUpperCase().replace(/[^A-Z]/g, "");
  if (!w) return "";
  let key = "";
  let i = 0;
  const rules: [RegExp, string][] = [
    [/^(KN|GN|PN|WR|AE)/, ""],
    [/^X/, "S"],
    [/^(PH)/, "F"],
    [/^(SCH)/, "SK"],
    [/^(SH|CH|TH)/, (m: string) => m[0] === "S" ? "X" : m[0] === "C" ? "X" : "0"],
  ];
  let rest = w;
  for (const [re, rep] of rules) {
    const m = rest.match(re);
    if (m) {
      if (typeof rep === "function") key += rep(m[0]);
      else key += rep;
      rest = rest.slice(m[0].length);
      break;
    }
  }
  // Walk remaining consonants, collapse vowels
  const vowels = "AEIOU";
  let prev = "";
  for (const ch of rest) {
    if (vowels.includes(ch)) continue;
    if (ch === prev) continue;
    key += ch;
    prev = ch;
  }
  return key.slice(0, 4);
}

// Simplified NYSIIS — phonetic for names
function nysiis(word: string): string {
  let s = word.toUpperCase().replace(/[^A-Z]/g, "");
  s = s.replace(/^(MAC)/, "MC").replace(/^(KN)/, "N").replace(/^(K)/, "C").replace(/^(PH)/, "FF").replace(/^(PF)/, "F");
  s = s.replace(/EE/g, "Y").replace(/IE/g, "Y").replace(/DT/g, "D").replace(/RT/g, "R").replace(/NT/g, "N").replace(/ND/g, "N");
  s = s.replace(/[^A-Z]/g, "");
  return s.slice(0, 6);
}

export function phoneticKeys(name: string): string[] {
  const tokens = tokenizeName(name);
  if (!tokens.length) return [];
  const surname = tokens[tokens.length - 1];
  return [doubleMetaphonePrimary(surname), nysiis(surname)].filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

export function jaroWinkler(a: string, b: string): number {
  const s1 = a.toLowerCase(), s2 = b.toLowerCase();
  if (s1 === s2) return 1;
  const len1 = s1.length, len2 = s2.length;
  if (!len1 || !len2) return 0;
  const matchDist = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);
  let matches = 0;
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDist), end = Math.min(i + matchDist + 1, len2);
    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) { s1Matches[i] = s2Matches[j] = true; matches++; break; }
    }
  }
  if (!matches) return 0;
  let t = 0, k = 0;
  for (let i = 0; i < len1; i++) {
    if (s1Matches[i]) { while (!s2Matches[k]) k++; if (s1[i] !== s2[k]) t++; k++; }
  }
  t /= 2;
  const jaro = (matches / len1 + matches / len2 + (matches - t) / matches) / 3;
  // Winkler prefix boost
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
    if (s1[i] === s2[i]) prefix++; else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

export function nameSimilarityScore(a: string, b: string): number {
  const ta = tokenizeName(a), tb = tokenizeName(b);
  if (!ta.length || !tb.length) return 0;
  // Token set similarity (Jaccard over token sets)
  const setA = new Set(ta), setB = new Set(tb);
  const inter = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  const jaccard = inter / union;
  // Surname phonetic match
  const phA = phoneticKeys(a), phB = phoneticKeys(b);
  const phMatch = phA.some((p) => phB.includes(p)) ? 1 : 0;
  // Full-string Jaro-Winkler
  const jw = jaroWinkler(ta.join(" "), tb.join(" "));
  // Levenshtein on surnames
  const sA = ta[ta.length - 1], sB = tb[tb.length - 1];
  const lev = 1 - levenshtein(sA, sB) / Math.max(sA.length, sB.length, 1);
  return Math.round(Math.max(jaccard * 100, jw * 100, (0.5 * jaccard + 0.3 * phMatch + 0.2 * lev) * 100));
}

// ─── Source Registry ─────────────────────────────────────────────────────────
// Two vendors using the same original dataset are NOT two independent confirmations.

export interface SourceRecord {
  id: string;
  name: string;
  authority: number;       // 0-100 (government/authoritative = high)
  coverage: number;        // 0-100 geographic/segment coverage
  freshness_days: number;  // typical data age
  licensing: "public" | "licensed" | "purchased" | "restricted";
  cost_per_query: number;
  latency_ms: number;
  false_match_rate: number; // 0-1 historical
  upstream_dataset?: string; // the original dataset this source derives from
}

// Independence groups: sources sharing an upstream dataset count as ONE confirmation.
export function independentConfirmations(sources: { source: string; upstream?: string }[]): number {
  const groups = new Set<string>();
  for (const s of sources) groups.add(s.upstream || s.source);
  return groups.size;
}

export function sourceScore(s: SourceRecord): number {
  // Weighted: authority 35, coverage 20, freshness 15, false-match penalty 30
  const freshnessScore = Math.max(0, 100 - s.freshness_days);
  const reliability = 100 - s.false_match_rate * 100;
  return Math.round(s.authority * 0.35 + s.coverage * 0.2 + freshnessScore * 0.15 + reliability * 0.3);
}

// ─── Evidence Provenance ─────────────────────────────────────────────────────

export interface EvidenceItem {
  claim: string;
  attribute: string;        // e.g. "phone", "address", "name"
  value: string;
  source: string;
  source_upstream?: string;
  authority: number;        // 0-100
  collected_at: string;     // ISO
  freshness_days: number;
  classification: "fact" | "observation" | "inference" | "hypothesis";
  contradicts?: string[];   // claim ids this contradicts
}

export function freshnessDays(collectedAt: string): number {
  return Math.floor((Date.now() - new Date(collectedAt).getTime()) / 86400000);
}

// ─── Contradiction Engine ────────────────────────────────────────────────────

export interface Contradiction {
  severity: "material" | "minor";
  description: string;
  claims: string[];
}

export function detectContradictions(evidence: EvidenceItem[]): Contradiction[] {
  const out: Contradiction[] = [];
  const byAttr = new Map<string, EvidenceItem[]>();
  for (const e of evidence) {
    if (!byAttr.has(e.attribute)) byAttr.set(e.attribute, []);
    byAttr.get(e.attribute)!.push(e);
  }
  for (const [attr, items] of byAttr) {
    // Different values for the same attribute from independent sources = contradiction
    const values = new Map<string, EvidenceItem[]>();
    for (const it of items) {
      const key = it.value.toLowerCase().trim();
      if (!values.has(key)) values.set(key, []);
      values.get(key)!.push(it);
    }
    if (values.size > 1) {
      const indGroups = new Set<string>();
      for (const it of items) indGroups.add(it.source_upstream || it.source);
      if (indGroups.size > 1) {
        out.push({
          severity: "material",
          description: `Conflicting ${attr} values: ${[...values.keys()].join(" vs ")}`,
          claims: items.map((i) => i.claim),
        });
      }
    }
  }
  return out;
}

// ─── The Five Scores ─────────────────────────────────────────────────────────

export function scoreLabel(v: number): Score["label"] {
  if (v >= 90) return "definitive";
  if (v >= 70) return "strong";
  if (v >= 50) return "fair";
  if (v >= 25) return "weak";
  return "none";
}

// IDENTITY_MATCH: are these records about the same person/entity?
export function scoreIdentityMatch(seed: NormalizedSeed, candidates: any[]): Score {
  const signals: Score["signals"] = [];
  if (!candidates.length) {
    return { kind: "IDENTITY_MATCH", value: 0, label: "none", rationale: "No candidates found", signals };
  }
  // Best candidate by name + address + phone/email overlap
  let best = 0;
  for (const c of candidates) {
    const nameS = nameSimilarityScore(seed.name || "", c.name || c.canonical_name || "");
    const addrS = seed.address_normalized && c.address
      ? 1 - levenshtein(seed.address_normalized, normalizeAddress(c.address)) / Math.max(seed.address_normalized.length, normalizeAddress(c.address).length, 1)
      : 0.5;
    const phoneS = seed.phone_e164 && c.phone ? (normalizePhoneE164(c.phone) === seed.phone_e164 ? 1 : 0) : 0.5;
    const emailS = seed.email_normalized && c.email ? (normalizeEmail(c.email)?.local === seed.email_normalized.split("@")[0] ? 1 : 0) : 0.5;
    const combined = nameS * 0.45 + addrS * 100 * 0.25 + phoneS * 100 * 0.15 + emailS * 100 * 0.15;
    best = Math.max(best, combined);
  }
  signals.push({ field: "name_similarity", value: Math.round(best), weight: 45, detail: "Best candidate name+attribute overlap" });
  const value = Math.round(best);
  return { kind: "IDENTITY_MATCH", value, label: scoreLabel(value), rationale: "Deterministic name + attribute overlap across candidates", signals };
}

// RELATIONSHIP_MATCH: is the person connected to the property/company/case?
export function scoreRelationshipMatch(seed: NormalizedSeed, relationships: any[]): Score {
  const signals: Score["signals"] = [];
  if (!relationships.length) {
    return { kind: "RELATIONSHIP_MATCH", value: 0, label: "none", rationale: "No relationships found", signals };
  }
  const direct = relationships.filter((r) => ["owns", "located_at", "operates", "manages"].includes(r.type));
  const value = direct.length > 0 ? Math.min(100, 60 + direct.length * 15) : 35;
  signals.push({ field: "direct_relationships", value: direct.length, weight: 60, detail: `${direct.length} direct ownership/operational links` });
  return { kind: "RELATIONSHIP_MATCH", value, label: scoreLabel(value), rationale: "Ownership / operational link strength to target", signals };
}

// CHANNEL_OWNERSHIP: does this phone/email/address belong to them NOW?
export function scoreChannelOwnership(channels: { type: string; value: string; ownership_verified: boolean; freshness_days: number }[]): Score {
  const signals: Score["signals"] = [];
  if (!channels.length) {
    return { kind: "CHANNEL_OWNERSHIP", value: 0, label: "none", rationale: "No contact channels found", signals };
  }
  let total = 0;
  for (const ch of channels) {
    let s = ch.ownership_verified ? 70 : 30;
    s -= Math.min(30, ch.freshness_days / 3); // stale channels lose points
    total += Math.max(0, s);
  }
  const value = Math.round(Math.min(100, total / channels.length));
  signals.push({ field: "channels_evaluated", value: channels.length, weight: 100, detail: `${channels.length} channels, ownership-verified: ${channels.filter((c) => c.ownership_verified).length}` });
  return { kind: "CHANNEL_OWNERSHIP", value, label: scoreLabel(value), rationale: "Per-channel ownership verification + freshness decay", signals };
}

// CONTACT_ELIGIBILITY: may the business legally use that channel for this purpose?
export function scoreContactEligibility(gate: PurposeGate, channels: { type: string; dnc: boolean; consent: boolean; suppressed: boolean }[]): Score {
  const signals: Score["signals"] = [];
  if (!gate.permitted_outreach || gate.permitted_outreach.length === 0) {
    return { kind: "CONTACT_ELIGIBILITY", value: 0, label: "none", rationale: "No permitted outreach channels in purpose gate", signals };
  }
  let eligible = 0;
  for (const ch of channels) {
    if (ch.suppressed) continue;
    if (ch.type === "voice" && ch.dnc && !gate.permitted_outreach.includes("voice")) continue;
    if ((ch.type === "sms") && (!gate.permitted_outreach.includes("sms") || ch.dnc)) continue;
    if (ch.type === "email" && !gate.permitted_outreach.includes("email")) continue;
    eligible++;
  }
  const value = channels.length ? Math.round((eligible / channels.length) * 100) : 0;
  signals.push({ field: "eligible_channels", value: eligible, weight: 100, detail: `${eligible}/${channels.length} channels pass compliance gates` });
  return { kind: "CONTACT_ELIGIBILITY", value, label: scoreLabel(value), rationale: "FCRA/DPPA/TCPA/CAN-SPAM/DNC gate compliance per channel", signals };
}

// TARGET_PRIORITY: is the person worth contacting for the business objective?
export function scoreTargetPriority(factors: { verified_need: boolean; expected_value: number; freshness_days: number; response_probability: number; cost: number }): Score {
  const signals: Score["signals"] = [];
  let value = 0;
  if (factors.verified_need) value += 35;
  value += Math.min(25, factors.expected_value / 10000 * 5); // scale EV
  value += Math.max(0, 20 - factors.freshness_days / 7);
  value += factors.response_probability * 20;
  value -= Math.min(10, factors.cost / 5);
  value = Math.max(0, Math.min(100, Math.round(value)));
  signals.push({ field: "verified_need", value: factors.verified_need ? 100 : 0, weight: 35, detail: factors.verified_need ? "Distress event confirmed" : "No confirmed distress event" });
  return { kind: "TARGET_PRIORITY", value, label: scoreLabel(value), rationale: "Need + value + freshness + response probability minus cost", signals };
}

// ─── Verdict Decision Tree ───────────────────────────────────────────────────
// A record is VERIFIED only when ALL mandatory accuracy gates pass.

export function computeVerdict(scores: Score[], contradictions: Contradiction[], independentSources: number): Verdict {
  const identity = scores.find((s) => s.kind === "IDENTITY_MATCH")?.value ?? 0;
  const relationship = scores.find((s) => s.kind === "RELATIONSHIP_MATCH")?.value ?? 0;
  const channel = scores.find((s) => s.kind === "CHANNEL_OWNERSHIP")?.value ?? 0;
  const eligibility = scores.find((s) => s.kind === "CONTACT_ELIGIBILITY")?.value ?? 0;

  // NOT_FOUND: no identity evidence at all
  if (identity === 0 && independentSources === 0) return "NOT_FOUND";

  // SUPPRESSED: eligibility gate failed entirely (no permitted channel)
  if (eligibility === 0) return "SUPPRESSED";

  // CONFLICTED: material contradictions remain
  if (contradictions.some((c) => c.severity === "material")) return "CONFLICTED";

  // VERIFIED: all mandatory accuracy gates pass
  const twoIndependent = independentSources >= 2;
  const strongIdentity = identity >= 70;
  const strongRelationship = relationship >= 60;
  const channelOk = channel >= 50;
  if (twoIndependent && strongIdentity && strongRelationship && channelOk) return "VERIFIED";

  // PROBABLE: good identity + relationship, but missing a gate
  if (identity >= 60 && relationship >= 50) return "PROBABLE";

  // AMBIGUOUS: weak or competing candidates
  return "AMBIGUOUS";
}

// ─── Automation Gate ─────────────────────────────────────────────────────────
// Automation proceeds only when ALL required gates pass. A high target score
// must never compensate for weak identity evidence.

export function automationAllowed(scores: Score[], verdict: Verdict): boolean {
  if (verdict !== "VERIFIED" && verdict !== "PROBABLE") return false;
  const identity = scores.find((s) => s.kind === "IDENTITY_MATCH")?.value ?? 0;
  const eligibility = scores.find((s) => s.kind === "CONTACT_ELIGIBILITY")?.value ?? 0;
  return identity >= 60 && eligibility >= 50;
}