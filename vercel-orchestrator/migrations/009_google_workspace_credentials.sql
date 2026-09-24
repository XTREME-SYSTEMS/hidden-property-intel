-- Encrypted Google Workspace OAuth credential storage.
-- No browser role gets table privileges or policies.

create table if not exists public.universal_google_workspace_credentials (
  user_id uuid not null references auth.users(id) on delete cascade,
  site_key text not null references public.universal_property_sites(site_key) on delete cascade,
  ciphertext text not null,
  iv text not null,
  auth_tag text not null,
  key_version text not null default 'v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(user_id,site_key)
);

alter table public.universal_google_workspace_credentials enable row level security;
revoke all on public.universal_google_workspace_credentials from anon, authenticated;

create index if not exists idx_universal_google_credentials_site
on public.universal_google_workspace_credentials(site_key,updated_at desc);
