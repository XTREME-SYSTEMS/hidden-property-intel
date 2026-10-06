export const NON_PASS = new Set(['FAIL', 'UNKNOWN', 'BLOCKED', 'SKIPPED', 'STALE']);

export function diagnosticScore(benchmarks = []) {
  const mandatory = benchmarks.filter((item) => item.mandatory !== false);
  if (mandatory.length === 0) return 0;
  const passed = mandatory.filter((item) => item.status === 'PASS').length;
  return Math.round((passed / mandatory.length) * 10000) / 100;
}

export function mandatoryEvidencePasses(benchmarks = []) {
  const mandatory = benchmarks.filter((item) => item.mandatory !== false);
  return mandatory.length > 0 && mandatory.every((item) => item.status === 'PASS');
}

export function isVerified100({ benchmarks, p0Open = 0, p1Open = 0, cleanCycles = 0, requiredCleanCycles = 3 }) {
  if (!mandatoryEvidencePasses(benchmarks)) return false;
  if (p0Open !== 0 || p1Open !== 0) return false;
  if (cleanCycles < requiredCleanCycles) return false;
  return true;
}
