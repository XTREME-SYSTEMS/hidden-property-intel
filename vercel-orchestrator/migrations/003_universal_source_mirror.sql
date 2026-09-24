-- Universal lossless source mirror for HPI + future property systems.

create table if not exists public.universal_source_records (
  source_system text not null,
  entity_type text not null,
  source_id text not null,
  site_key text not null default 'hidden-property-intel'
    references public.universal_property_sites(site_key),
  record jsonb not null,
  record_hash text not null,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  migrated_at timestamptz not null default now(),
  primary key(source_system, entity_type, source_id)
);

create index if not exists idx_universal_source_records_site_entity
  on public.universal_source_records(site_key, entity_type);
create index if not exists idx_universal_source_records_updated
  on public.universal_source_records(source_system, source_updated_at desc);

alter table public.universal_source_records enable row level security;
revoke all on table public.universal_source_records from anon, authenticated;

create table if not exists public.universal_entity_catalog (
  source_system text not null,
  entity_type text not null,
  site_key text not null default 'hidden-property-intel'
    references public.universal_property_sites(site_key),
  record_count bigint not null default 0,
  first_source_created_at timestamptz,
  latest_source_updated_at timestamptz,
  last_migrated_at timestamptz not null default now(),
  primary key(source_system, entity_type, site_key)
);

alter table public.universal_entity_catalog enable row level security;
revoke all on table public.universal_entity_catalog from anon, authenticated;
