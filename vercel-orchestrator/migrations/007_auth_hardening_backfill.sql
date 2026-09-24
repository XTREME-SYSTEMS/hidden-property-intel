-- Harden the auth trigger and repair/optimize identity mappings.

revoke all on function public.universal_handle_new_auth_user()
  from public, anon, authenticated;
grant execute on function public.universal_handle_new_auth_user()
  to service_role;

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

drop policy if exists universal_profiles_select_own on public.universal_user_profiles;
create policy universal_profiles_select_own
on public.universal_user_profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists universal_profiles_update_own on public.universal_user_profiles;
create policy universal_profiles_update_own
on public.universal_user_profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists universal_memberships_select_own on public.universal_user_site_memberships;
create policy universal_memberships_select_own
on public.universal_user_site_memberships for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists universal_google_connections_select_own on public.universal_google_workspace_connections;
create policy universal_google_connections_select_own
on public.universal_google_workspace_connections for select
to authenticated
using ((select auth.uid()) = user_id);
