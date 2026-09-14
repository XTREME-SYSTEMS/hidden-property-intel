export const HPI_GENERATOR_PROFILE = {
  profileId: 'hpi-uasg-v1',
  packageVersion: '2026-09-14-v3',
  packageReceipt: {
    sha256: '4bda716edad6c8e99c3f6ae095450d8802b63b9720b67c3fd25d329083b1afc0',
    observedFiles: 22,
    workbookSheets: 20,
    variableDefinitions: 106,
    generatorTaxonomyRows: 700,
    historicalValidationReproducible: false,
  },
  systemId: 'hidden-property-intel',
  systemName: 'Hidden Property Intel',
  archetype: 'marketplace',
  industryTaxonomy: 'CUSTOM',
  industryCode: 'distressed_real_estate_intelligence',
  businessModel: 'marketplace',
  personas: ['admin', 'investor', 'seller'],
  regions: ['US-FL'],
  operations: {
    heartbeatSeconds: 300,
    fullAuditHours: 24,
    optimizerHours: 1,
  },
  validation: {
    mandatoryCoverage: 1,
    allowUnknown: false,
    cleanCyclesRequired: 3,
    independentValidation: true,
    fullRegression: true,
    rollbackEvidence: true,
  },
  ui: {
    theme: 'brand',
    accentColor: '#D4AF37',
    navigation: 'adaptive',
    pwa: true,
  },
  initialWork: [
    {
      id: 'hpi-admin-isolation-coverage',
      priority: 'P1',
      objective: 'Complete live non-admin and unauthenticated behavioral coverage for admin isolation.',
      state: 'WAITING_DEPENDENCY',
    },
    {
      id: 'hpi-repair-loop-idempotency',
      priority: 'P1',
      objective: 'Prove repeated heartbeats cannot create duplicate active RepairTasks for the same failure lineage.',
      state: 'QUEUED',
    },
    {
      id: 'hpi-resilience-matrix',
      priority: 'P1',
      objective: 'Build and test recovery contracts for Base44 entity DB and workflow-runtime single points of failure.',
      state: 'QUEUED',
    },
  ],
} as const;

export function compileHpiGeneratorProfile() {
  return {
    ...HPI_GENERATOR_PROFILE,
    compiledAt: new Date().toISOString(),
    mode: 'PLAN_ONLY',
  };
}
