-- Universal Property Intelligence — foundation schema
-- Prepared for Strategic Minds AI Supabase.
-- Safe target: NEW dedicated project only. Do not apply to X1 projects.
-- HPI is the first site on the universal property data plane.

create extension if not exists pgcrypto;

create table if not exists public.universal_property_sites (
  site_key text primary key,
  display_name text not null,
  primary_domain text,
  status text not null default 'active'
    check (status in ('active','staging','paused','retired')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.universal_property_site_domains (
  domain text primary key,
  site_key text not null references public.universal_property_sites(site_key) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.universal_property_sites(site_key, display_name, primary_domain, status)
values ('hidden-property-intel','Hidden Property Intel','hiddenpropertyintel.com','active')
on conflict (site_key) do update
set display_name = excluded.display_name,
    primary_domain = excluded.primary_domain,
    status = excluded.status,
    updated_at = now();

insert into public.universal_property_site_domains(domain, site_key, is_primary)
values
  ('hiddenpropertyintel.com','hidden-property-intel',true),
  ('www.hiddenpropertyintel.com','hidden-property-intel',false)
on conflict (domain) do update
set site_key = excluded.site_key,
    is_primary = excluded.is_primary;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  base44_id text,
  address text not null,
  normalized_address text,
  dedup_key text,
  city text,
  state text,
  zip_code text,
  lat numeric,
  lng numeric,
  property_type text not null default 'residential',
  distress_type text,
  status text not null default 'active',
  estimated_value numeric,
  proposed_asking_price numeric,
  property_score numeric,
  square_footage numeric,
  bedrooms numeric,
  bathrooms numeric,
  year_built numeric,
  lot_size numeric,
  description text,
  seller_id text,
  source text not null default 'scraped',
  source_name text,
  source_url text,
  scraped_at timestamptz,
  last_verified_at timestamptz,
  image_fetch_attempts integer not null default 0,
  days_on_market integer,
  images jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  raw_data jsonb not null default '{}'::jsonb,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_id text
);

create unique index if not exists uq_properties_dedup_key
  on public.properties(dedup_key) where dedup_key is not null;
create unique index if not exists uq_properties_base44_id
  on public.properties(base44_id) where base44_id is not null;
create index if not exists idx_properties_state_status
  on public.properties(state,status);
create index if not exists idx_properties_updated_at
  on public.properties(updated_at);
create index if not exists idx_properties_source
  on public.properties(source,source_name);

create table if not exists public.universal_site_properties (
  site_key text not null references public.universal_property_sites(site_key) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  listing_status text not null default 'visible'
    check (listing_status in ('visible','hidden','featured','archived')),
  display_overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(site_key,property_id)
);

create table if not exists public.property_scores (
  id uuid primary key default gen_random_uuid(),
  base44_id text,
  property_id text,
  overall_score numeric,
  distress_severity text,
  repair_cost_estimate numeric,
  after_repair_value numeric,
  estimated_roi numeric,
  ai_analysis text,
  scored_at timestamptz,
  model_version text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create unique index if not exists uq_property_scores_base44_id
  on public.property_scores(base44_id) where base44_id is not null;
create index if not exists idx_property_scores_property
  on public.property_scores(property_id);

create table if not exists public.owners (
  id uuid primary key default gen_random_uuid(),
  base44_id text,
  property_id text,
  name text not null,
  owner_type text not null default 'current',
  contact_phone text,
  contact_email text,
  contact_address text,
  relationship_to_property text,
  acquired_date date,
  ownership_percentage numeric,
  is_verified boolean not null default false,
  source text,
  outreach_status text not null default 'new',
  contacted_at timestamptz,
  follow_up_enabled boolean not null default false,
  next_follow_up_date timestamptz,
  automation_enabled boolean not null default false,
  is_reachable boolean not null default true,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text
);
create unique index if not exists uq_owners_base44_id
  on public.owners(base44_id) where base44_id is not null;
create index if not exists idx_owners_property on public.owners(property_id);

create table if not exists public.investor_leads (
  id uuid primary key default gen_random_uuid(),
  base44_id text,
  source_site_key text not null default 'hidden-property-intel'
    references public.universal_property_sites(site_key),
  name text not null,
  company text,
  email text,
  phone text,
  website text,
  target_markets text[] not null default '{}',
  investment_types text[] not null default '{}',
  region text,
  source text,
  outreach_status text not null default 'new',
  last_contacted timestamptz,
  contact_count integer not null default 0,
  notes text,
  follow_up_enabled boolean not null default false,
  follow_up_frequency_days integer not null default 7,
  next_follow_up_date timestamptz,
  automation_enabled boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text
);
create unique index if not exists uq_investor_leads_base44_id
  on public.investor_leads(base44_id) where base44_id is not null;
create index if not exists idx_investor_leads_site_status
  on public.investor_leads(source_site_key,outreach_status);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  base44_id text,
  site_key text not null default 'hidden-property-intel'
    references public.universal_property_sites(site_key),
  property_id text,
  investor_id text,
  seller_id text,
  user_id text,
  stage text,
  exit_strategy text,
  acquisition_price numeric,
  rehab_budget numeric,
  arv numeric,
  holding_costs numeric,
  projected_profit numeric,
  actual_profit numeric,
  status text not null default 'open',
  notes text,
  target_close_date date,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text
);
create unique index if not exists uq_deals_base44_id
  on public.deals(base44_id) where base44_id is not null;
create index if not exists idx_deals_site_status on public.deals(site_key,status);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  site_key text not null default 'hidden-property-intel'
    references public.universal_property_sites(site_key),
  property_id text not null,
  investor_id text,
  bid_amount numeric not null,
  status text not null default 'active',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text
);

create table if not exists public.smart_contracts (
  id uuid primary key default gen_random_uuid(),
  site_key text not null default 'hidden-property-intel'
    references public.universal_property_sites(site_key),
  property_id text not null,
  investor_id text not null,
  seller_id text not null,
  status text not null default 'draft',
  contract_address text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text
);

create table if not exists public.phone_numbers (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  country_code text not null default 'US',
  country text,
  line_type text not null default 'unknown',
  carrier text,
  status text not null default 'sandbox',
  tenant_id text not null,
  source text not null default 'api',
  verified boolean not null default false,
  imported_at timestamptz,
  last_lookup_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text
);
create index if not exists idx_phone_numbers_tenant_number
  on public.phone_numbers(tenant_id,number);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  tenant_id text not null,
  scopes text[] not null default array['lookups','numbers:read'],
  status text not null default 'active',
  last_used timestamptz,
  last_used_ip text,
  request_count integer not null default 0,
  expires_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text
);
create unique index if not exists uq_api_keys_active_hash
  on public.api_keys(key_hash) where status='active';

create table if not exists public.sync_state (
  id text primary key default 'default',
  last_synced_at timestamptz,
  last_property_count integer not null default 0,
  updated_date timestamptz not null default now()
);

create table if not exists public.universal_migration_receipts (
  receipt_id uuid primary key default gen_random_uuid(),
  migration_name text not null,
  source_system text not null,
  source_reference text,
  target_project_ref text,
  status text not null,
  counts jsonb not null default '{}'::jsonb,
  checks jsonb not null default '{}'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.universal_touch_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if to_jsonb(new) ? 'updated_date' then
    new.updated_date = now();
  end if;
  if to_jsonb(new) ? 'updated_at' then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_properties_touch on public.properties;
create trigger trg_properties_touch
before update on public.properties
for each row execute function public.universal_touch_timestamps();

drop trigger if exists trg_sites_touch on public.universal_property_sites;
create trigger trg_sites_touch
before update on public.universal_property_sites
for each row execute function public.universal_touch_timestamps();

drop trigger if exists trg_site_properties_touch on public.universal_site_properties;
create trigger trg_site_properties_touch
before update on public.universal_site_properties
for each row execute function public.universal_touch_timestamps();

-- Universal backend is server-side by default. Browser clients get no direct
-- table access until a future site receives explicit policies/API contracts.
alter table public.universal_property_sites enable row level security;
alter table public.universal_property_site_domains enable row level security;
alter table public.properties enable row level security;
alter table public.universal_site_properties enable row level security;
alter table public.property_scores enable row level security;
alter table public.owners enable row level security;
alter table public.investor_leads enable row level security;
alter table public.deals enable row level security;
alter table public.bids enable row level security;
alter table public.smart_contracts enable row level security;
alter table public.phone_numbers enable row level security;
alter table public.api_keys enable row level security;
alter table public.sync_state enable row level security;
alter table public.universal_migration_receipts enable row level security;

revoke all on table public.universal_property_sites from anon,authenticated;
revoke all on table public.universal_property_site_domains from anon,authenticated;
revoke all on table public.properties from anon,authenticated;
revoke all on table public.universal_site_properties from anon,authenticated;
revoke all on table public.property_scores from anon,authenticated;
revoke all on table public.owners from anon,authenticated;
revoke all on table public.investor_leads from anon,authenticated;
revoke all on table public.deals from anon,authenticated;
revoke all on table public.bids from anon,authenticated;
revoke all on table public.smart_contracts from anon,authenticated;
revoke all on table public.phone_numbers from anon,authenticated;
revoke all on table public.api_keys from anon,authenticated;
revoke all on table public.sync_state from anon,authenticated;
revoke all on table public.universal_migration_receipts from anon,authenticated;

-- Migration receipts are append-only.
create or replace function public.universal_block_receipt_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'universal_migration_receipts are immutable';
end;
$$;

drop trigger if exists universal_migration_receipts_immutable on public.universal_migration_receipts;
create trigger universal_migration_receipts_immutable
before update or delete on public.universal_migration_receipts
for each row execute function public.universal_block_receipt_mutation();
