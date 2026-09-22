import { AGENT_PROFILES as RAW_AGENT_PROFILES, getDefaultHourlyPlan } from './digitalAgentProfiles.data.js';

/**
 * Machine-readable provenance for every persona in this module.
 * These records describe synthetic AI agents, not real employees or people.
 */
export const AGENT_PROFILE_PROVENANCE = Object.freeze({
  synthetic_agent: true,
  content_provenance: 'SYNTHETIC_AGENT',
  identity_type: 'fictional_ai_persona',
});

export const AGENT_PROFILES = Object.freeze(
  Object.fromEntries(
    Object.entries(RAW_AGENT_PROFILES).map(([role, profile]) => [
      role,
      Object.freeze({
        ...profile,
        synthetic_agent: true,
        content_provenance: 'SYNTHETIC_AGENT',
      }),
    ]),
  ),
);

export { getDefaultHourlyPlan };
