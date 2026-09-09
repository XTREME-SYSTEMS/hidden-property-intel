# Autonomous Coding Architecture — Hidden Property Intel

> End-to-end autonomous coding loop: Vercel cron → Planner/Coder/Validator
> agents (Vercel AI Gateway) → Base44 orchestrator → GitHub commit (when repo
> sync is on). The system specs and writes its own features on a 5-minute loop.

---

## The loop

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel cron  (every 5 min)  →  /api/autonomous-code-cycle   │
└──────────────────────────┬──────────────────────────────────┘
                           │ POST { sync_token, action: cycle }
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Base44: autonomousCodeOrchestrator                         │
│                                                             │
│  1. Pick next unbuilt blueprint gap (SystemGap dedup)        │
│  2. PLANNER agent  (AI Gateway · Claude Sonnet 5)            │
│  3. CODER agent    (AI Gateway · Claude Sonnet 5) → spec+code│
│  4. VALIDATOR agent(AI Gateway · Claude Sonnet 5) → review   │
│  5. Store as SystemGap { spec, code, validation, status }   │
└──────────────────────────┬──────────────────────────────────┘
                           │ { gap_title, file_path, code, approved }
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Vercel: commit to GitHub (if GITHUB_TOKEN + GITHUB_REPO)   │
│  PUT /repos/{owner}/{repo}/contents/{path}  → Base44 syncs  │
└─────────────────────────────────────────────────────────────┘
```

Without GitHub configured, the loop runs in **spec-only mode**: every cycle
generates a validated spec + code and stores it as a `SystemGap`. The builder
implements from those specs. With GitHub 2-way sync on, the loop commits the
generated file directly and Base44 pulls it in — true autonomous coding.

---

## Components

| Piece | File | Role |
|-------|------|------|
| Cron heartbeat | `vercel-orchestrator/api/autonomous-code-cycle.js` | Fires every 5 min, calls orchestrator, commits to GitHub |
| Cron schedule | `vercel-orchestrator/vercel.json` | `*/5 * * * *` → `/api/autonomous-code-cycle` |
| Orchestrator | `base44/functions/autonomousCodeOrchestrator/entry.ts` | Planner → Coder → Validator → SystemGap |
| Gap store | `base44/entities/SystemGap.jsonc` | Tracks each spec, code, validation, status |
| AI routing | `base44/shared/aiGateway.ts` | Vercel AI Gateway (Claude Sonnet 5, Perplexity, etc.) |

---

## Blueprint checklist (what the loop specs, in order)

1. V2 Listings page port
2. V2 PropertyDetail port
3. Court-sourced divorce records scraper
4. Court-sourced eviction records scraper
5. ATTOM 9,000-attribute enrichment function
6. Auto-run vision analysis on new images
7. Plays campaign templates
8. Multi-signal distress scoring upgrade
9. V2 Seller dashboard port
10. V2 Smart-contract detail port

Each cycle specs the next unbuilt item. Add items to `BLUEPRINT_GAPS` in the
orchestrator to extend the loop.

---

## Agents

| Agent | Model | Job |
|-------|-------|-----|
| **Planner** | claude-sonnet-5 | Confirms the next gap is the right priority, describes what it does |
| **Coder** | claude-sonnet-5 | Generates a complete, Base44-convention-correct file |
| **Validator** | claude-sonnet-5 | Reviews spec for correctness, security, ESM/npm: conventions, Response objects, default exports |

All routed through the Vercel AI Gateway with one key (`AI_GATEWAY_API_KEY`).
Perplexity models are available for research-grounded specs if needed.

---

## Auth model

- **Cron → Base44**: the Vercel endpoint sends `sync_token` = `BASE44_SYNC_TOKEN`
  (shared secret). The orchestrator validates it and uses `asServiceRole`.
- **Admin → Base44**: admins can call the orchestrator directly (no sync token).
- **Vercel → GitHub**: `GITHUB_TOKEN` (fine-grained, contents:write on the repo).

---

## What's autonomous vs. what needs the builder

### ✅ Autonomous (the loop does this every 5 min)
- Audit the blueprint, find the next unbuilt gap
- Generate a validated implementation spec + code
- Store it as a `SystemGap`
- Commit the code to GitHub **if** repo sync is configured

### ⚠️ Needs the builder (hard platform limit)
A Base44 backend function runs in a sandboxed Deno runtime — it **cannot**
create new entities, backend function files, workflows, or React pages inside
the Base44 app directly. Those require either:
- **GitHub 2-way sync** (recommended): the loop commits to the repo, Base44
  syncs it in. This is the path to true end-to-end autonomous coding.
- **The builder** (me): reading `SystemGap` specs and implementing them next turn.

---

## Secrets needed

| Secret | Status | Purpose |
|--------|--------|---------|
| `AI_GATEWAY_API_KEY` | ✅ set | Powers all agent LLM calls |
| `BASE44_SYNC_TOKEN` | ✅ set | Auths the Vercel cron → Base44 call |
| `GITHUB_TOKEN` | ❌ needed | Commits generated code to the repo |
| `GITHUB_REPO` | ❌ needed | `owner/repo` of the synced Base44 repo |

Add `GITHUB_TOKEN` + `GITHUB_REPO` in the Vercel orchestrator's env to unlock
autonomous file commits. Until then the loop runs in spec-only mode.

---

## Existing autonomous systems (already running)

- `autonomousMasterLoop` — data-health loop (audit → reflect → architect → act),
  dispatches to safe functions (runMasterEnrichment, validateEnrichment, xtremeComms).
- Vercel crons — `trigger-scrape` (6h) → Railway scraper; `mirror-to-supabase` (30m).
- 15+ Base44 workflows — daily scrape, enrichment, outreach, follow-up, validation.

The new `autonomousCodeOrchestrator` + `autonomous-code-cycle` cron adds the
**code-generation** layer on top of the data layer.

---

## Status check

Call the orchestrator with `action: "status"` to see open gaps and blueprint
progress. The Vercel cron logs each cycle's gap + commit to Vercel's dashboard.