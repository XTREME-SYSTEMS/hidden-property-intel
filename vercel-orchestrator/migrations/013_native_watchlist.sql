create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id text not null,
  created_date timestamptz not null default now(),
  unique(user_id,property_id)
);
alter table public.watchlist enable row level security;
grant select,insert,delete on public.watchlist to authenticated;
drop policy if exists watchlist_own on public.watchlist;
create policy watchlist_own on public.watchlist for all to authenticated
using ((select auth.uid())=user_id)
with check ((select auth.uid())=user_id);
create index if not exists idx_watchlist_user on public.watchlist(user_id,created_date desc);