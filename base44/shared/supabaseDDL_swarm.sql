-- AGI Swarm cycle log table (Supabase) — written by the Vercel swarm-cycle cron.
-- This is the observability store for autonomous operations on paid Supabase.
create table if not exists public.swarm_cycles (
  id uuid primary key default gen_random_uuid(),
  cycle_id text unique,
  status text default 'complete',
  trigger_source text default 'vercel-cron',
  coverage jsonb,
  decision jsonb,
  execution jsonb,
  actions jsonb,
  errors jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists swarm_cycles_started_at_idx on public.swarm_cycles (started_at desc);
alter table public.swarm_cycles enable row level security;