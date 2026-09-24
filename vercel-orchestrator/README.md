# Hidden Property Intel Convergence Orchestrator

This Vercel project is the governed scheduling/control plane for Hidden Property Intel.

## Canonical heartbeat

Exactly one cron is declared:

`Vercel Cron every 5 minutes -> /api/reconcile`

The reconcile route is fail-closed. It acquires a global Supabase lease, refetches the canonical GitHub SHA, compares deployment parity, reads an aggregate Base44 convergence snapshot, evaluates mandatory evidence, deduplicates due recurring work, records immutable receipts, and refuses `VERIFIED_100` whenever mandatory evidence is FAIL, UNKNOWN, BLOCKED, SKIPPED, or STALE.

The previous 6-hour scrape and 30-minute mirror schedules are preserved as task cadences inside the reconcile loop. Their direct endpoints remain available for diagnostics, but they are no longer declared as Vercel crons in this branch.

## Protected repair lanes

The controller can detect low title-risk, real-image, owner-enrichment, and investor-outreach coverage. Those lanes are deliberately marked operator-gated. Detection creates blocker/work evidence only. It does not silently launch costly enrichment, customer outreach, contract actions, or destructive work.

## Required migration

Review `migrations/001_convergence_control_plane.sql` before applying it to Supabase. It creates:

- atomic global reconcile lease
- durable idempotent jobs
- state registry
- immutable reconciliation receipts
- RLS with no anon/authenticated access

The application never auto-applies this migration.

## Environment contract

Required for the control plane:

- `CRON_SECRET` or `VERCEL_CRON_SECRET`
- `HPI_SUPABASE_URL` or `SUPABASE_URL`
- `HPI_SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `BASE44_SYNC_TOKEN`

Required for safe recurring dispatch:

- `RAILWAY_SCRAPER_URL`
- `RAILWAY_TOKEN` when the scraper requires it
- `ALLOW_RECONCILE_DISPATCH=true`

Release evidence flags:

- `CONVERGENCE_HEARTBEAT_ACTIVE=true` only after the deployed cron is verified
- `LEGACY_SCHEDULERS_DISABLED=true` only after legacy Base44/Vercel schedulers are actually disabled and independently verified
- `REQUIRED_CLEAN_CYCLES=3` by default

Do not set release-evidence flags merely to make validation pass.

## Tests

```bash
npm test
```

Tests prove fail-closed certification, deterministic idempotency, persistence gating, and the single Vercel heartbeat declaration. They do not certify the external production system.

## Release rule

Branch/preview work is safe to validate automatically. Production scheduler changes, Supabase migration application, secret changes, deployment, customer messaging, and protected repair dispatch remain explicit operator approvals.
