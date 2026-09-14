# Hidden Property Intel Universal Generator Implementation Packet

## Purpose

Integrate the operator-supplied XTREME Universal Generator package into Hidden Property Intel as a planning, configuration, queue, validation, resilience, and evidence-contract layer above the existing Alpha Prime governor.

Alpha Prime remains authoritative for local convergence and release truth. GitHub remains source truth. Base44 remains the current application runtime bridge.

## Source package receipt

- Package: XTREME_UNIVERSAL_GENERATOR_PACKAGE_2026-09-14.zip
- SHA256: 4bda716edad6c8e99c3f6ae095450d8802b63b9720b67c3fd25d329083b1afc0
- Observed files: 22
- Master workbook sheets: 20
- Variable definitions: 106
- Generator taxonomy rows: 700

The bundled historical validation report references additional artifacts that are not present in the received archive. Preserve that report as historical source evidence only. Revalidate this exact package and this exact integration from current source truth.

## Integration rules

1. Do not replace Alpha Prime.
2. Do not weaken the existing release constitution.
3. UNKNOWN never counts as PASS.
4. No package provider default may be treated as current HPI runtime truth unless independently verified.
5. The package SQL extension remains draft-only.
6. Environment samples remain documentation only.
7. MCP, OpenAPI, and A2A files are protocol examples, not proof of live endpoints.
8. All generated work must retain source/configuration lineage.
9. Safe repairs may run in branch/sandbox scope. Protected production actions remain approval-gated.

## HPI profile

- system_id: hidden-property-intel
- name: Hidden Property Intel
- archetype: marketplace
- industry taxonomy: CUSTOM
- industry code: distressed_real_estate_intelligence
- business model: marketplace
- personas: admin, investor, seller
- active region: US-FL
- current application runtime bridge: Base44 PropertyIntel
- canonical repository: XTREME-SYSTEMS/hidden-property-intel
- governor: Alpha Prime
- heartbeat: 300 seconds
- mandatory release coverage: 100 percent
- allow UNKNOWN for release: false
- independent validation: required
- full regression: required
- rollback evidence: required
- clean cycles before preservation: 3

## Map package concepts into existing HPI entities

### System manifest

Represent the resolved HPI configuration using deterministic versioned data. Every material configuration change creates a new revision identifier and invalidates affected evidence.

### Variable registry

Use the package variable registry as the definition catalog. Resolve only variables that HPI can support with operator input, current source truth, runtime evidence, or an explicitly identified safe default. Record source, assumption state, impact domains, and recalibration actions.

### Queue contract

Preserve this lifecycle:

QUEUED -> CLAIMED -> IN_PROGRESS -> READY_FOR_VALIDATION -> VALIDATING -> VERIFIED -> CLOSED

Alternative states may include WAITING_DEPENDENCY, BLOCKED, RETRY, FAILED, SUPERSEDED, DEAD_LETTER, and APPROVAL_REQUIRED.

Do not silently discard failed jobs. Retries must be bounded and idempotent.

### Validation contract

Map generator validation to the existing GateResult, ValidationTask, ValidationReceipt, Finding, RepairTask, HeartbeatReceipt, and SubsystemState model.

UNKNOWN -> ValidationTask
FAIL -> Finding and eligible RepairTask
BLOCKED -> blocker or approval record
PASS -> current evidence only
STALE SOURCE OR CONFIG REVISION -> revalidate

### VERIFIED_100 state model

Map package operating states to Alpha Prime modes without inventing release success:

UNBENCHMARKED -> completion
COMPLETION_SPRINT -> completion
BLOCKED -> completion or incident depending severity
VERIFIED_100 -> eligible for preservation only after Alpha Prime release requirements pass
PRESERVATION -> preservation
DEGRADED -> completion or incident

## Immediate implementation work

### 1. Admin isolation behavioral closure

Keep security.admin_isolation UNKNOWN until live evidence exists for all required contexts.

Required behavioral probes:
- unauthenticated caller denied
- authenticated investor denied
- authenticated seller denied
- authenticated admin allowed
- convergence entity access denied to non-admin
- runValidators denied to non-admin
- alphaPrime denied to authenticated non-admin

Do not replace behavioral proof with source inspection.

### 2. Repair-loop idempotency

Add deterministic regression coverage proving:
- UNKNOWN does not create RepairTask
- a FAIL creates at most one active RepairTask for the same finding/gate/source revision/repair version
- repeated heartbeats do not multiply active repair work
- completed or superseded work has explicit lineage

### 3. Resilience matrix

Create a deterministic matrix for each critical subsystem with:
- primary
- secondary
- failure detector
- failover trigger
- recovery mode
- recovery point objective
- recovery time objective
- write authority
- data-loss risk
- rollback method
- test evidence

Base44 entity DB and Base44 workflow runtime remain unresolved critical SPOFs until tested recovery evidence proves otherwise.

The existing Supabase mirror may be used as recovery evidence only for the entities and directions it actually supports. Do not call it full database failover without proof.

Design a recovery heartbeat outside the primary Base44 workflow runtime. Initially implement and test it in non-production scope. It must avoid duplicate execution, preserve incident evidence, and fail closed on consequential writes.

### 4. Read-only generator compiler

Add an admin-only compiler function that returns the resolved HPI profile, configuration revision, impacted domains, recalibration actions, queue classes, validation requirements, and proposed initial jobs.

The first version must be read-only. It may not directly deploy, mutate schemas, change environment variables, message customers, charge payments, execute contracts, or perform destructive data work.

### 5. Convergence Center integration

Add a Universal Generator panel showing:
- package/profile version
- current configuration revision
- resolved versus unresolved variables
- assumptions
- impacted domains
- recalibration queue
- generator state
- validation state
- resilience state
- package integrity result

The panel must remain behind AdminRoute and the same server/data authorization boundaries as the rest of Convergence Center.

## Package-reference handling

Preserve the package architecture, runbook, variable registry, workflow grammar, prompt library, resilience specification, validation contract, queue contracts, deployment guidance, test plan, and workbook as source evidence. Do not blindly convert every package example into executable HPI code.

Provider examples such as Vercel Workflow, Supabase/PGMQ, Railway, AI Gateway, Playwright, and OpenTelemetry should be mapped against actual HPI capabilities first. Unsupported providers become planned adapters or explicit gaps.

## Validation for this integration

At minimum require:
- package receipt matches expected SHA
- package inventory is recorded
- generator profile parses
- compiler is admin-only and read-only
- build passes
- lint passes
- typecheck passes
- existing Alpha Prime tests remain green
- admin isolation regression remains honest
- resilience gate remains honest
- no secret or environment value is added to source control
- no production schema migration is applied

## Stop conditions

Stop and request or use an existing explicit approval before:
- applying the database extension
- changing production secrets or environment variables
- live billing or payment mutation
- live customer messaging
- live contract execution
- destructive production data changes
- new paid spend

## Completion definition

This package is considered integrated when:
1. the HPI configuration profile is versioned and visible,
2. the read-only compiler operates under admin authorization,
3. package queue and validation laws are mapped into Alpha Prime,
4. the Convergence Center exposes the configuration/evidence state,
5. the integration passes deterministic CI against the current source revision,
6. package-induced work is present in durable validation/repair/hardening queues,
7. no package claim can override Alpha Prime evidence.
