// Address normalization + geohash dedup utilities.
// Lightweight, no external deps — runs on Railway.

// --- Address normalization ---
const ABBREV = {
  st: "street", str: "street",
  ave: "avenue", av: "avenue",
  blvd: "boulevard",
  rd: "road",
  ln: "lane",
  dr: "drive",
  ct: "court",
  cir: "circle",
  pl: "place",
  pkwy: "parkway",
  hwy: "highway",
  ter: "terrace",
  trl: "trail",
  sq: "square",
  way: "way",
  n: "north", s: "south", e: "east", w: "west",
  ne: "northeast", nw: "northwest", se: "southeast", sw: "southwest",
};

// Strip unit/apt/suite/# indicators
function stripUnit(addr) {
  return addr
    .replace(/\s+(apt|unit|suite|ste|#)\s*[\w-]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeAddress(addr) {
  if (!addr) return "";
  let s = addr.toLowerCase().trim();
  s = stripUnit(s);
  // Remove punctuation
  s = s.replace(/[.,#]/g, " ");
  // Expand abbreviations
  s = s.replace(/\b([a-z]+)\b/g, (m) => ABBREV[m] || m);
  // Collapse spaces
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

// Dedup key: normalized address + zip
export function dedupKey(addr, zip) {
  const na = normalizeAddress(addr);
  const z = (zip || "").toString().trim().slice(0, 5);
  return `${na}|${z}`;
}

// --- Geohash encoding (precision 7 ≈ 150m × 150m) ---
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

export function encodeGeohash(lat, lon, precision = 7) {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return null;
  let minLat = -90, maxLat = 90;
  let minLon = -180, maxLon = 180;
  let geohash = "";
  let bits = 0, bit = 0, even = true;

  while (geohash.length < precision) {
    if (even) {
      const mid = (minLon + maxLon) / 2;
      if (lon >= mid) { bits = (bits << 1) | 1; minLon = mid; }
      else { bits = bits << 1; maxLon = mid; }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) { bits = (bits << 1) | 1; minLat = mid; }
      else { bits = bits << 1; maxLat = mid; }
    }
    even = !even;
    bit++;
    if (bit === 5) {
      geohash += BASE32[bits];
      bits = 0;
      bit = 0;
    }
  }
  return geohash;
}

// --- Address regex parser for extracted page text ---
// Matches patterns like "123 Main St, Miami, FL 33101" or "123 NW 45th Ave, Miami FL 33101"
const ADDR_RE = /\b(\d{1,6})\s+([A-Za-z0-9]+\s+){1,6}(St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Ln|Lane|Dr|Drive|Ct|Court|Cir|Circle|Pl|Place|Pkwy|Parkway|Hwy|Highway|Ter|Terrace|Trl|Trail|Sq|Square|Way)\b\.?/gi;

export function extractAddresses(text) {
  if (!text) return [];
  const matches = [...text.matchAll(ADDR_RE)];
  return matches.map((m) => m[0].trim());
}

// --- City/state/zip parser ---
const CITY_STATE_ZIP_RE = /([A-Za-z\s]+),\s*(FL|GA|AL|SC|NC|TX|CA|NY|AZ|NV)\s+(\d{5})/gi;

export function extractCityStateZip(text) {
  if (!text) return [];
  const matches = [...text.matchAll(CITY_STATE_ZIP_RE)];
  return matches.map((m) => ({ city: m[1].trim(), state: m[2], zip: m[3] }));
}