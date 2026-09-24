-- HPI Convergence Control Plane v1.0
-- DRAFT MIGRATION: review and apply explicitly. Do not auto-run from application code.

create table if not exists public.hpi_convergence_leases (
  name text primary key,
  holder text not null,
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.hpi_convergence_state (
  state_key text primary key,
  state_value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.hpi_convergence_jobs (
  job_id text primary key,
  job_type text not null,
  idempotency_key text not null unique,
  source_sha text,
  status text not null default 'queued' check (status in ('queued','running','complete','failed','dlq','blocked')),
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists hpi_convergence_jobs_status_idx on public.hpi_convergence_jobs(status, created_at);
create index if not exists hpi_convergence_jobs_source_sha_idx on public.hpi_convergence_jobs(source_sha);

create table if not exists public.hpi_convergence_receipts (
  receipt_id text primary key,
  run_id text not null,
  system_id text not null,
  created_at timestamptz not null,
  source_sha text,
  deployment_sha text,
  deployment_id text,
  status text not null,
  verified_100 boolean not null default false,
  diagnostic_score numeric(6,2) not null default 0,
  clean_cycles integer not null default 0,
  required_clean_cycles integer not null default 3,
  p0_open integer,
  p1_open integer,
  benchmarks jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  rollback_reference text
);

alter table public.hpi_convergence_leases enable row level security;
alter table public.hpi_convergence_state enable row level security;
alter table public.hpi_convergence_jobs enable row level security;
alter table public.hpi_convergence_receipts enable row level security;

revoke all on public.hpi_convergence_leases from anon, authenticated;
revoke all on public.hpi_convergence_state from anon, authenticated;
revoke all on public.hpi_convergence_jobs from anon, authenticated;
revoke all on public.hpi_convergence_receipts from anon, authenticated;

create or replace function public.hpi_acquire_reconcile_lease(p_name text, p_holder text, p_ttl_seconds integer default 240)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
begin
  insert into public.hpi_convergence_leases(name, holder, acquired_at, expires_at)
  values (p_name, p_holder, now(), now() + make_interval(secs => greatest(p_ttl_seconds, 30)))
  on conflict(name) do update
  set holder = excluded.holder,
      acquired_at = excluded.acquired_at,
      expires_at = excluded.expires_at
  where public.hpi_convergence_leases.expires_at <= now()
     or public.hpi_convergence_leases.holder = excluded.holder;
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

create or replace function public.hpi_release_reconcile_lease(p_name text, p_holder text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer := 0;
begin
  delete from public.hpi_convergence_leases where name = p_name and holder = p_holder;
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

create or replace function public.hpi_claim_convergence_job(
  p_job_id text,
  p_job_type text,
  p_idempotency_key text,
  p_source_sha text default null,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
begin
  insert into public.hpi_convergence_jobs(job_id, job_type, idempotency_key, source_sha, status, attempts, payload)
  values (p_job_id, p_job_type, p_idempotency_key, p_source_sha, 'running', 1, coalesce(p_payload, '{}'::jsonb))
  on conflict(idempotency_key) do nothing;
  get diagnostics v_rows = row_count;
  return jsonb_build_object('claimed', v_rows > 0, 'job_id', case when v_rows > 0 then p_job_id else null end);
end;
$$;

create or replace function public.hpi_block_receipt_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'hpi_convergence_receipts are immutable';
end;
$$;

drop trigger if exists hpi_convergence_receipts_immutable on public.hpi_convergence_receipts;
create trigger hpi_convergence_receipts_immutable
before update or delete on public.hpi_convergence_receipts
for each row execute function public.hpi_block_receipt_mutation();
