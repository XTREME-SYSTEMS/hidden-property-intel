create table if not exists public.investor_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,email text,subscription_plan text not null default 'starter',
  subscription_status text not null default 'inactive',
  target_markets text[] not null default '{}',investment_types text[] not null default '{}',
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.seller_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,email text,property_count integer not null default 0,
  joined_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
  name text,filters jsonb not null default '{}',created_date timestamptz not null default now(),updated_date timestamptz not null default now()
);
create table if not exists public.deal_alerts (
  id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
  property_id text,title text not null,message text,alert_type text,read boolean not null default false,created_date timestamptz not null default now()
);
create table if not exists public.alert_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_alerts boolean not null default true,push_alerts boolean not null default true,sms_alerts boolean not null default false,
  updated_date timestamptz not null default now()
);
create table if not exists public.negotiation_threads (
  id uuid primary key default gen_random_uuid(),property_id text not null,
  seller_id uuid not null references auth.users(id) on delete cascade,
  investor_id uuid references auth.users(id) on delete set null,
  messages jsonb not null default '[]',status text not null default 'open',
  created_date timestamptz not null default now(),updated_date timestamptz not null default now()
);
alter table public.investor_profiles enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.saved_searches enable row level security;
alter table public.deal_alerts enable row level security;
alter table public.alert_preferences enable row level security;
alter table public.negotiation_threads enable row level security;
grant select,insert,update on public.investor_profiles,public.seller_profiles to authenticated;
grant select,insert,update,delete on public.saved_searches to authenticated;
grant select,update on public.deal_alerts to authenticated;
grant select,insert,update on public.alert_preferences to authenticated;
grant select on public.negotiation_threads to authenticated;
drop policy if exists investor_profiles_own on public.investor_profiles;
create policy investor_profiles_own on public.investor_profiles for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists seller_profiles_own on public.seller_profiles;
create policy seller_profiles_own on public.seller_profiles for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists saved_searches_own on public.saved_searches;
create policy saved_searches_own on public.saved_searches for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists deal_alerts_own on public.deal_alerts;
create policy deal_alerts_own on public.deal_alerts for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists deal_alerts_update_own on public.deal_alerts;
create policy deal_alerts_update_own on public.deal_alerts for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists alert_preferences_own on public.alert_preferences;
create policy alert_preferences_own on public.alert_preferences for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists negotiation_threads_party_read on public.negotiation_threads;
create policy negotiation_threads_party_read on public.negotiation_threads for select to authenticated using ((select auth.uid())=seller_id or (select auth.uid())=investor_id);

grant insert (address,normalized_address,city,state,zip_code,lat,lng,property_type,distress_type,status,estimated_value,proposed_asking_price,property_score,square_footage,bedrooms,bathrooms,year_built,lot_size,description,seller_id,source,source_name,source_url,images,is_featured,created_date,updated_date,updated_at,created_by_id) on public.properties to authenticated;
grant update (proposed_asking_price,description,status,images,updated_date,updated_at) on public.properties to authenticated;
drop policy if exists properties_seller_insert_own on public.properties;
create policy properties_seller_insert_own on public.properties for insert to authenticated with check (seller_id=(select auth.uid())::text and source='user_submitted');
drop policy if exists properties_seller_update_own on public.properties;
create policy properties_seller_update_own on public.properties for update to authenticated using (seller_id=(select auth.uid())::text) with check (seller_id=(select auth.uid())::text);

create or replace function public.hpi_attach_user_submitted_property() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.source='user_submitted' then
    insert into public.universal_site_properties(site_key,property_id,listing_status) values('hidden-property-intel',new.id,'visible') on conflict do nothing;
    insert into public.seller_profiles(user_id,name,email,property_count)
    select u.id,coalesce(u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name',u.email),u.email,1 from auth.users u where u.id=(new.seller_id)::uuid
    on conflict(user_id) do update set property_count=public.seller_profiles.property_count+1,updated_at=now();
  end if;
  return new;
end; $$;
revoke all on function public.hpi_attach_user_submitted_property() from public,anon,authenticated;
grant execute on function public.hpi_attach_user_submitted_property() to service_role;
drop trigger if exists hpi_user_submitted_property_attach on public.properties;
create trigger hpi_user_submitted_property_attach after insert on public.properties for each row execute function public.hpi_attach_user_submitted_property();

grant select,insert,update,delete on public.deals to authenticated;
drop policy if exists deals_own on public.deals;
create policy deals_own on public.deals for all to authenticated using (user_id=(select auth.uid())::text) with check (user_id=(select auth.uid())::text and site_key='hidden-property-intel');

grant select on public.bids to authenticated;
grant insert (site_key,property_id,investor_id,bid_amount,status,created_date,updated_date,created_by_id) on public.bids to authenticated;
drop policy if exists bids_authenticated_read on public.bids;
create policy bids_authenticated_read on public.bids for select to authenticated using (site_key='hidden-property-intel');
drop policy if exists bids_insert_own on public.bids;
create policy bids_insert_own on public.bids for insert to authenticated with check (site_key='hidden-property-intel' and investor_id=(select auth.uid())::text and created_by_id=(select auth.uid())::text and status='active');

create index if not exists idx_saved_searches_user on public.saved_searches(user_id,created_date desc);
create index if not exists idx_deal_alerts_user on public.deal_alerts(user_id,created_date desc);
create index if not exists idx_negotiation_threads_property on public.negotiation_threads(property_id,updated_date desc);