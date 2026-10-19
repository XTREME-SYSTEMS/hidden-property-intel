-- Universal Property Intelligence authentication identity + site membership.
-- Supabase Auth is the identity authority. Roles are not client-writable.

create table if not exists public.universal_user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'investor'
    check (role in ('investor','seller','admin','service')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.universal_user_site_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  site_key text not null references public.universal_property_sites(site_key) on delete cascade,
  site_role text not null default 'member'
    check (site_role in ('member','investor','seller','admin')),
  status text not null default 'active'
    check (status in ('active','invited','suspended','revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(user_id,site_key)
);

create table if not exists public.universal_google_workspace_connections (
  user_id uuid not null references auth.users(id) on delete cascade,
  site_key text not null references public.universal_property_sites(site_key) on delete cascade,
  google_subject text,
  google_account_email text,
  scopes text[] not null default '{}',
  status text not null default 'disconnected'
    check (status in ('connected','disconnected','revoked','error')),
  credential_ref text,
  access_expires_at timestamptz,
  connected_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id,site_key)
);

create or replace function public.universal_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.universal_user_profiles(id,email,full_name,avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  on conflict(id) do nothing;

  insert into public.universal_user_site_memberships(user_id,site_key,site_role,status)
  values(new.id,'hidden-property-intel','member','active')
  on conflict(user_id,site_key) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_universal on auth.users;
create trigger on_auth_user_created_universal
after insert on auth.users
for each row execute function public.universal_handle_new_auth_user();

insert into public.universal_user_profiles(id,email,full_name,avatar_url)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name',raw_user_meta_data->>'name',''),
  coalesce(raw_user_meta_data->>'avatar_url',raw_user_meta_data->>'picture','')
from auth.users
on conflict(id) do nothing;

insert into public.universal_user_site_memberships(user_id,site_key,site_role,status)
select id,'hidden-property-intel','member','active'
from auth.users
on conflict(user_id,site_key) do nothing;

alter table public.universal_user_profiles enable row level security;
alter table public.universal_user_site_memberships enable row level security;
alter table public.universal_google_workspace_connections enable row level security;

revoke all on public.universal_user_profiles from anon, authenticated;
revoke all on public.universal_user_site_memberships from anon, authenticated;
revoke all on public.universal_google_workspace_connections from anon, authenticated;

grant select on public.universal_user_profiles to authenticated;
grant update(full_name,avatar_url) on public.universal_user_profiles to authenticated;
grant select on public.universal_user_site_memberships to authenticated;
grant select on public.universal_google_workspace_connections to authenticated;

drop policy if exists universal_profiles_select_own on public.universal_user_profiles;
create policy universal_profiles_select_own
on public.universal_user_profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists universal_profiles_update_own on public.universal_user_profiles;
create policy universal_profiles_update_own
on public.universal_user_profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists universal_memberships_select_own on public.universal_user_site_memberships;
create policy universal_memberships_select_own
on public.universal_user_site_memberships for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists universal_google_connections_select_own on public.universal_google_workspace_connections;
create policy universal_google_connections_select_own
on public.universal_google_workspace_connections for select
to authenticated
using (auth.uid() = user_id);

create index if not exists idx_universal_user_memberships_site
  on public.universal_user_site_memberships(site_key,status);
create index if not exists idx_universal_google_workspace_site
  on public.universal_google_workspace_connections(site_key,status);
