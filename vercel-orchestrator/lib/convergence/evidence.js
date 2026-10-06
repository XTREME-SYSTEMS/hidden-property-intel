export async function fetchCanonicalSha({ repo, branch, githubToken = '', fetchImpl = fetch }) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'hpi-convergence/1.0' };
  if (githubToken) headers.Authorization = `Bearer ${githubToken}`;
  try {
    const response = await fetchImpl(`https://api.github.com/repos/${repo}/commits/${encodeURIComponent(branch)}`, { headers });
    if (!response.ok) return { status: 'FAIL', sha: null, detail: `GitHub HTTP ${response.status}` };
    const data = await response.json();
    if (!data?.sha) return { status: 'UNKNOWN', sha: null, detail: 'GitHub response did not contain sha' };
    return { status: 'PASS', sha: data.sha, detail: `${repo}@${branch}` };
  } catch (error) {
    return { status: 'UNKNOWN', sha: null, detail: error instanceof Error ? error.message : String(error) };
  }
}

export function buildSnapshotBenchmarks(snapshotResult, config) {
  const result = [];
  if (!snapshotResult?.ok) {
    result.push({ benchmark_id: 'app.snapshot', category: 'evidence', mandatory: true, status: snapshotResult?.status || 'UNKNOWN', detail: snapshotResult?.error || 'snapshot unavailable' });
    result.push({ benchmark_id: 'app.title_risk_coverage', category: 'data', mandatory: true, status: 'UNKNOWN' });
    result.push({ benchmark_id: 'app.image_coverage', category: 'data', mandatory: true, status: 'UNKNOWN' });
    result.push({ benchmark_id: 'app.owner_coverage', category: 'data', mandatory: true, status: 'UNKNOWN' });
    return result;
  }

  const metrics = snapshotResult.data?.metrics || {};
  const pct = (value, total) => total > 0 ? Math.round((value / total) * 10000) / 100 : 0;
  const properties = Number(metrics.properties || 0);
  const titlePct = Number(metrics.title_risk_coverage_pct ?? pct(Number(metrics.title_risks || 0), properties));
  const imagePct = Number(metrics.image_coverage_pct ?? pct(Number(metrics.properties_with_real_images || 0), properties));
  const ownerPct = Number(metrics.owner_coverage_pct ?? pct(Number(metrics.owners || 0), properties));

  result.push({ benchmark_id: 'app.snapshot', category: 'evidence', mandatory: true, status: 'PASS', actual: metrics });
  result.push({ benchmark_id: 'app.title_risk_coverage', category: 'data', mandatory: true, status: titlePct >= config.titleRiskTargetPct ? 'PASS' : 'FAIL', expected: `>=${config.titleRiskTargetPct}%`, actual: titlePct });
  result.push({ benchmark_id: 'app.image_coverage', category: 'data', mandatory: true, status: imagePct >= config.imageCoverageTargetPct ? 'PASS' : 'FAIL', expected: `>=${config.imageCoverageTargetPct}%`, actual: imagePct });
  result.push({ benchmark_id: 'app.owner_coverage', category: 'data', mandatory: true, status: ownerPct >= config.ownerCoverageTargetPct ? 'PASS' : 'FAIL', expected: `>=${config.ownerCoverageTargetPct}%`, actual: ownerPct });
  return result;
}
