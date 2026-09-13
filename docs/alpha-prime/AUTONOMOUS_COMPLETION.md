# Alpha Prime Autonomous Completion

This branch runs the governed completion loop for Hidden Property Intel.

Rules:
- UNKNOWN creates validation work.
- FAIL creates repair work.
- BLOCKED creates escalation or approval work.
- PASS requires deterministic evidence tied to the current source SHA.
- Safe branch/sandbox repairs may continue automatically.
- A repair commit is never release evidence by itself. It must receive an independent exact-SHA validator run after the repair lands. If a GitHub Actions bot push does not recursively trigger workflows, the external completion watchdog must trigger a fresh branch commit/run and must never promote parent-SHA evidence.
- Production deployment, production scheduler removal, production RLS/schema changes, secrets, live payments, customer messaging, destructive actions, and spend remain operator-gated.

The Alpha Prime five-minute heartbeat is the in-app governor. The external completion watchdog reopens the project, takes the largest safe unresolved chunk, and continues until only protected approvals, genuine blockers, or release readiness remain.
