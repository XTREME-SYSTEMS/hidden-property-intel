# Backend deployment evidence contract

The mandatory `backend.functions_deploy` gate is intentionally fail-closed and requires two independent evidence layers for the exact canonical source SHA:

1. GitHub check `backend-functions-source-audit` must complete successfully. It parses every Base44 function entrypoint and proves source-level handler readiness only.
2. An independently produced `BackendDeployReceipt` for `environment=production` must stamp the exact same source SHA, report a positive deployed function count, and report `boot_failures=0`.

A source audit never proves deployment. A preview/sandbox receipt never proves production. A foreign or stale SHA never counts. Missing deployment evidence remains UNKNOWN. Any exact-SHA production receipt with one or more boot failures is FAIL.

Deployment automation is the only intended producer of deployment receipts. The validator itself does not create a deploy receipt and cannot self-prove this gate.
