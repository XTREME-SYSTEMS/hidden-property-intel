export const GENERATOR_JOB_STATES = [
  'QUEUED',
  'CLAIMED',
  'IN_PROGRESS',
  'READY_FOR_VALIDATION',
  'VALIDATING',
  'VERIFIED',
  'CLOSED',
  'WAITING_DEPENDENCY',
  'BLOCKED',
  'RETRY',
  'FAILED',
  'SUPERSEDED',
  'DEAD_LETTER',
  'APPROVAL_REQUIRED',
] as const;

export type GeneratorJobState = typeof GENERATOR_JOB_STATES[number];

export const GENERATOR_QUEUE_CLASSES = [
  'validation',
  'security',
  'visual',
  'repair',
  'regression',
  'incident',
  'monitor',
  'optimization',
] as const;

export function isTerminalGeneratorJobState(state: GeneratorJobState) {
  return ['CLOSED', 'FAILED', 'SUPERSEDED', 'DEAD_LETTER'].includes(state);
}

export function nextGeneratorJobState(state: GeneratorJobState, outcome?: 'pass' | 'fail' | 'blocked'): GeneratorJobState {
  if (state === 'QUEUED') return 'CLAIMED';
  if (state === 'CLAIMED') return 'IN_PROGRESS';
  if (state === 'IN_PROGRESS') return 'READY_FOR_VALIDATION';
  if (state === 'READY_FOR_VALIDATION') return 'VALIDATING';
  if (state === 'VALIDATING') {
    if (outcome === 'pass') return 'VERIFIED';
    if (outcome === 'blocked') return 'BLOCKED';
    return 'RETRY';
  }
  if (state === 'VERIFIED') return 'CLOSED';
  return state;
}
