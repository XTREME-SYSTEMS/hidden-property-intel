// Evidence-backed, read-only baseline. Unknowns cannot be converted to a passing certification.
export function convergenceBaseline({ properties, dataSources, scrapeJobs, jobs, systemHealth }: any) {
  const now = Date.now();
  const recent = (date: any, hours: number) => date && Number.isFinite(Date.parse(date)) && now - Date.parse(date) >= 0 && now - Date.parse(date) < hours * 3600000;
  const checks: any[] = [
    { id: 'property_data', label: 'Property inventory', status: properties.length ? 'PASS' : 'FAIL', evidence: `${properties.length} records in the latest sampled page; not a full database count.` },
    { id: 'sources', label: 'Data source configuration', status: dataSources.some((s: any) => s.status === 'active') ? 'PASS' : 'FAIL', evidence: `${dataSources.filter((s: any) => s.status === 'active').length} active sources in sampled records; configuration does not prove successful acquisition.` },
    { id: 'scraping', label: 'Recent acquisition', status: scrapeJobs.some((j: any) => j.status === 'complete' && recent(j.completed_at || j.updated_date, 48)) ? 'PASS' : 'UNKNOWN', evidence: 'Requires a completed scrape job in the last 48 hours; an unobserved run is not proof of failure.' },
    { id: 'queue', label: 'Job execution', status: jobs.some((j: any) => j.status === 'dead_letter' || (j.status === 'running' && !recent(j.started_at, 1))) ? 'FAIL' : 'UNKNOWN', evidence: 'Sample checked for dead-letter and stuck jobs; a healthy worker heartbeat and draining queue are not yet independently verified.' },
    { id: 'health', label: 'System health record', status: systemHealth.some((h: any) => h.overall_status === 'healthy' && recent(h.run_at, 24)) ? 'PASS' : 'UNKNOWN', evidence: 'Recent health record only; not independent end-to-end validation.' },
    ...['Canonical source and deployment parity','Authentication and tenant isolation','Independent user journey tests','Backup and restore drill','Rollback rehearsal','Independent repair validation'].map((label, i) => ({ id: `proof_${i}`, label, status: 'UNKNOWN', evidence: 'No fresh independently verified evidence available to this audit.' })),
  ];
  return { status: 'NOT_VERIFIED', verified_100: false, checked_at: new Date().toISOString(), checks, pass: checks.filter(c => c.status === 'PASS').length, fail: checks.filter(c => c.status === 'FAIL').length, unknown: checks.filter(c => c.status === 'UNKNOWN').length, next_action: 'Establish source and deployment identity, then collect independent evidence for each unknown gate.' };
}