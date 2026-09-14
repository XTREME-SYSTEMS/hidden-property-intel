export type RecoveryReadiness = 'PROVEN' | 'PARTIAL' | 'UNPROVEN';

export interface ResilienceEntry {
  id: string;
  critical: boolean;
  primary: string;
  secondary: string;
  failureDetector: string;
  failoverTrigger: string;
  recoveryMode: string;
  rpo: string;
  rto: string;
  writeAuthority: string;
  rollback: string;
  readiness: RecoveryReadiness;
  testStatus: 'PASS' | 'FAIL' | 'UNKNOWN' | 'BLOCKED';
  blocker?: string;
}

export const HPI_RESILIENCE_MATRIX: ResilienceEntry[] = [
  {
    id: 'base44-entity-db',
    critical: true,
    primary: 'Base44 entity database',
    secondary: 'Supabase mirror',
    failureDetector: 'admin-safe entity API health probe',
    failoverTrigger: 'sustained Base44 entity API unavailability',
    recoveryMode: 'read-only recovery from verified mirrored entities until write failover is explicitly proven',
    rpo: 'MEASURE_FROM_SYNC_RECEIPTS',
    rto: 'MEASURE_FROM_RECOVERY_TEST',
    writeAuthority: 'Base44 remains authoritative until tested failover is approved',
    rollback: 'return reads to Base44 after health and reconciliation checks',
    readiness: 'PARTIAL',
    testStatus: 'UNKNOWN',
    blocker: 'Supabase mirror does not yet prove complete entity coverage or write failover.',
  },
  {
    id: 'base44-workflow-runtime',
    critical: true,
    primary: 'Base44 workflow runtime',
    secondary: 'external recovery heartbeat candidate',
    failureDetector: 'heartbeat freshness plus workflow invocation probe',
    failoverTrigger: 'missed heartbeat window with independent confirmation',
    recoveryMode: 'incident monitoring and safe queue preservation outside the primary workflow runtime',
    rpo: 'N/A_FOR_CONTROL_LOOP',
    rto: 'MEASURE_FROM_RECOVERY_TEST',
    writeAuthority: 'no consequential external write during recovery without existing approval',
    rollback: 'disable recovery heartbeat after Base44 workflow health is restored and reconciled',
    readiness: 'UNPROVEN',
    testStatus: 'UNKNOWN',
    blocker: 'Independent recovery heartbeat has not yet been deployed and failure-injection tested.',
  },
  {
    id: 'github-source-truth',
    critical: true,
    primary: 'GitHub main',
    secondary: 'Base44 synchronized source snapshot plus receipts',
    failureDetector: 'GitHub API/source SHA probe',
    failoverTrigger: 'temporary GitHub unavailability',
    recoveryMode: 'freeze mutation, continue runtime monitoring, preserve receipts, reconcile when source returns',
    rpo: 'last verified source SHA',
    rto: 'provider dependent',
    writeAuthority: 'no source mutation while canonical source cannot be verified',
    rollback: 'resume normal source operations after SHA reconciliation',
    readiness: 'PARTIAL',
    testStatus: 'UNKNOWN',
  },
  {
    id: 'ai-gateway',
    critical: false,
    primary: 'configured AI gateway',
    secondary: 'deterministic non-AI degradation paths where available',
    failureDetector: 'gateway health probe',
    failoverTrigger: 'gateway timeout or provider failure',
    recoveryMode: 'degrade AI-dependent work to queued or blocked while deterministic validation continues',
    rpo: 'N/A',
    rto: 'provider dependent',
    writeAuthority: 'AI failure cannot bypass approval or deterministic validation',
    rollback: 'resume AI jobs after health validation',
    readiness: 'PARTIAL',
    testStatus: 'UNKNOWN',
  },
];

export function summarizeResilience() {
  return {
    total: HPI_RESILIENCE_MATRIX.length,
    critical: HPI_RESILIENCE_MATRIX.filter((x) => x.critical).length,
    proven: HPI_RESILIENCE_MATRIX.filter((x) => x.readiness === 'PROVEN' && x.testStatus === 'PASS').length,
    unresolvedCritical: HPI_RESILIENCE_MATRIX.filter((x) => x.critical && !(x.readiness === 'PROVEN' && x.testStatus === 'PASS')).map((x) => x.id),
  };
}
