export type GeneratorState = 'UNBENCHMARKED' | 'COMPLETION_SPRINT' | 'BLOCKED' | 'VERIFIED_100' | 'PRESERVATION' | 'DEGRADED';
export type GateState = 'PASS' | 'FAIL' | 'UNKNOWN' | 'BLOCKED' | 'NOT_APPLICABLE';

export interface GeneratorGateSnapshot {
  mandatory: boolean;
  status: GateState;
  sourceSha?: string | null;
  evidenceRefs?: string[];
}

export function computeGeneratorState(args: {
  gates: GeneratorGateSnapshot[];
  cleanCycles: number;
  cleanCyclesRequired: number;
  sourceSha: string | null;
  priorState?: GeneratorState;
}): GeneratorState {
  const mandatory = args.gates.filter((g) => g.mandatory);
  const hasUnknown = mandatory.some((g) => g.status === 'UNKNOWN');
  const hasFailure = mandatory.some((g) => g.status === 'FAIL');
  const hasBlocked = mandatory.some((g) => g.status === 'BLOCKED');
  const missingEvidence = mandatory.some((g) => g.status === 'PASS' && (!g.evidenceRefs || g.evidenceRefs.length === 0));
  const staleSha = mandatory.some((g) => g.status === 'PASS' && args.sourceSha && g.sourceSha !== args.sourceSha);

  if (hasBlocked) return 'BLOCKED';
  if (hasFailure || missingEvidence || staleSha) return args.priorState === 'PRESERVATION' ? 'DEGRADED' : 'COMPLETION_SPRINT';
  if (hasUnknown || mandatory.length === 0) return 'UNBENCHMARKED';
  if (args.cleanCycles < args.cleanCyclesRequired) return 'VERIFIED_100';
  return 'PRESERVATION';
}
