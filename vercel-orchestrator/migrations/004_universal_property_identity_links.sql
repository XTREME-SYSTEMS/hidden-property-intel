-- Map every source property record to one canonical universal property.

create table if not exists public.universal_property_source_links (
  source_system text not null,
  entity_type text not null default 'Property',
  source_id text not null,
  property_id uuid not null references public.properties(id) on delete cascade,
  dedup_key text not null,
  is_canonical boolean not null default false,
  linked_at timestamptz not null default now(),
  primary key(source_system,entity_type,source_id)
);

create index if not exists idx_universal_property_source_links_property
  on public.universal_property_source_links(property_id);
create index if not exists idx_universal_property_source_links_dedup
  on public.universal_property_source_links(dedup_key);

alter table public.universal_property_source_links enable row level security;
revoke all on table public.universal_property_source_links from anon, authenticated;
