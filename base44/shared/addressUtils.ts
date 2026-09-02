/**
 * Address normalization + geohash proximity dedupe.
 * PropStream parity: normalized_address field + geohash-based duplicate detection.
 */

// Common street suffix abbreviations → full form
const SUFFIX_MAP: Record<string, string> = {
  'st': 'street', 'st.': 'street',
  'ave': 'avenue', 'ave.': 'avenue', 'av': 'avenue',
  'blvd': 'boulevard', 'blvd.': 'boulevard',
  'rd': 'road', 'rd.': 'road',
  'dr': 'drive', 'dr.': 'drive',
  'ln': 'lane', 'ln.': 'lane',
  'ct': 'court', 'ct.': 'court',
  'cir': 'circle', 'cir.': 'circle',
  'pl': 'place', 'pl.': 'place',
  'pkwy': 'parkway', 'pkwy.': 'parkway',
  'hwy': 'highway', 'hwy.': 'highway',
  'ter': 'terrace', 'ter.': 'terrace',
  'trl': 'trail', 'trl.': 'trail',
  'sq': 'square', 'sq.': 'square',
  'apt': 'apartment', 'apt.': 'apartment',
  'ste': 'suite', 'ste.': 'suite',
  'fl': 'floor', 'fl.': 'floor',
};

// Directional abbreviations → full form
const DIR_MAP: Record<string, string> = {
  'n': 'north', 'n.': 'north',
  's': 'south', 's.': 'south',
  'e': 'east', 'e.': 'east',
  'w': 'west', 'w.': 'west',
  'ne': 'northeast', 'ne.': 'northeast',
  'nw': 'northwest', 'nw.': 'northwest',
  'se': 'southeast', 'se.': 'southeast',
  'sw': 'southwest', 'sw.': 'southwest',
};

/**
 * Normalize a street address for dedupe.
 * - lowercases
 * - standardizes street suffixes (st → street)
 * - standardizes directionals (n → north)
 * - removes periods, extra spaces, unit-designator noise
 * - strips trailing punctuation
 */
export function normalizeAddress(address: string): string {
  if (!address) return '';
  let a = address.trim().toLowerCase();

  // Remove unit/apt designators entirely — "123 Main St Apt 4" and "123 Main St" are the same parcel
  a = a.replace(/\b(apt|apartment|ste|suite|fl|floor|unit|no)\s*#?\s*\w+/g, '');
  a = a.replace(/#\s*\w+/g, '');

  // Tokenize
  let tokens = a.split(/[\s,]+/).filter(Boolean);

  // Standardize each token
  tokens = tokens.map((t) => {
    const clean = t.replace(/[.,]/g, '');
    if (SUFFIX_MAP[clean]) return SUFFIX_MAP[clean];
    if (DIR_MAP[clean]) return DIR_MAP[clean];
    return clean;
  });

  return tokens.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Build a dedupe key from address + zip.
 * Two properties with the same key are the same parcel.
 */
export function dedupeKey(address: string, zipCode: string): string {
  return `${normalizeAddress(address)}|${(zipCode || '').trim()}`;
}

/**
 * Simple geohash-like proximity key.
 * Rounds lat/lng to 4 decimal places (~11m resolution).
 * Two properties with the same proximity key are within ~11m of each other.
 */
export function proximityKey(lat: number, lng: number): string {
  if (!lat || !lng) return '';
  return `${lat.toFixed(4)}|${lng.toFixed(4)}`;
}

/**
 * Check whether two addresses are likely the same parcel.
 */
export function isSameParcel(addr1: string, zip1: string, addr2: string, zip2: string): boolean {
  return dedupeKey(addr1, zip1) === dedupeKey(addr2, zip2);
}