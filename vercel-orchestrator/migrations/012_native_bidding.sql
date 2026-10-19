alter table public.bids add column if not exists investor_name text;
alter table public.bids add column if not exists is_proxy_bid boolean not null default false;
alter table public.bids add column if not exists max_proxy_amount numeric;

create or replace function public.hpi_place_bid(
  p_user_id uuid,p_property_id text,p_bid_amount numeric,
  p_is_proxy_bid boolean default false,p_max_proxy_amount numeric default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_property public.properties%rowtype;
  v_profile public.investor_profiles%rowtype;
  v_role text;
  v_highest numeric;
  v_bid public.bids%rowtype;
  v_name text;
begin
  if p_bid_amount is null or p_bid_amount <= 0 then
    raise exception 'Bid amount must be positive';
  end if;
  if p_is_proxy_bid and (p_max_proxy_amount is null or p_max_proxy_amount < p_bid_amount) then
    raise exception 'Proxy maximum must be at least the current bid';
  end if;

  select * into v_property from public.properties
  where base44_id=p_property_id or id::text=p_property_id
  limit 1;
  if not found or v_property.status <> 'active' then
    raise exception 'Property is not available for bidding';
  end if;
  if v_property.seller_id = p_user_id::text then
    raise exception 'Seller cannot bid on own property';
  end if;

  select role into v_role from public.universal_user_profiles where id=p_user_id;
  select * into v_profile from public.investor_profiles where user_id=p_user_id;
  if coalesce(v_role,'investor') <> 'admin' and coalesce(v_profile.subscription_status,'inactive') <> 'active' then
    raise exception 'Active investor membership required';
  end if;
  if p_is_proxy_bid and coalesce(v_role,'investor') <> 'admin' and coalesce(v_profile.subscription_plan,'starter') <> 'elite' then
    raise exception 'Elite membership required for proxy bidding';
  end if;

  select max(bid_amount) into v_highest from public.bids
  where site_key='hidden-property-intel' and property_id=p_property_id and status='active';
  if v_highest is not null and p_bid_amount < v_highest + 1000 then
    raise exception 'Bid must be at least $1,000 above the current highest bid';
  end if;

  select coalesce(full_name,email,'Investor') into v_name from public.universal_user_profiles where id=p_user_id;
  insert into public.bids(site_key,property_id,investor_id,investor_name,bid_amount,status,is_proxy_bid,max_proxy_amount,created_by_id)
  values('hidden-property-intel',p_property_id,p_user_id::text,v_name,p_bid_amount,'active',p_is_proxy_bid,p_max_proxy_amount,p_user_id::text)
  returning * into v_bid;

  return jsonb_build_object('id',v_bid.id,'status',v_bid.status,'bid_amount',v_bid.bid_amount);
end; $$;

create or replace function public.hpi_accept_bid(
  p_user_id uuid,p_property_id text,p_bid_id uuid
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_property public.properties%rowtype;
  v_bid public.bids%rowtype;
  v_role text;
begin
  select * into v_property from public.properties
  where base44_id=p_property_id or id::text=p_property_id
  limit 1 for update;
  if not found then raise exception 'Property not found'; end if;

  select role into v_role from public.universal_user_profiles where id=p_user_id;
  if coalesce(v_role,'investor') <> 'admin' and v_property.seller_id <> p_user_id::text then
    raise exception 'Only the seller or admin can accept bids';
  end if;

  select * into v_bid from public.bids
  where id=p_bid_id and property_id=p_property_id and status='active'
  for update;
  if not found then raise exception 'Active bid not found'; end if;

  update public.bids set status='rejected',updated_date=now()
  where property_id=p_property_id and status='active' and id<>p_bid_id;
  update public.bids set status='accepted',updated_date=now() where id=p_bid_id;
  update public.properties set status='under_contract',updated_date=now(),updated_at=now()
  where id=v_property.id;

  return jsonb_build_object('accepted_bid_id',p_bid_id,'property_id',p_property_id,'status','under_contract');
end; $$;

revoke all on function public.hpi_place_bid(uuid,text,numeric,boolean,numeric) from public,anon,authenticated;
revoke all on function public.hpi_accept_bid(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.hpi_place_bid(uuid,text,numeric,boolean,numeric) to service_role;
grant execute on function public.hpi_accept_bid(uuid,text,uuid) to service_role;
