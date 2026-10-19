-- Public HPI listing surface.
-- Opens only safe listing columns and only properties assigned to the HPI site.

grant select (site_key,property_id,listing_status)
on public.universal_site_properties to anon, authenticated;

drop policy if exists hpi_public_site_assignments on public.universal_site_properties;
create policy hpi_public_site_assignments
on public.universal_site_properties
for select
to anon, authenticated
using (
  site_key = 'hidden-property-intel'
  and listing_status in ('visible','featured')
);

grant select (
  id,base44_id,address,normalized_address,city,state,zip_code,lat,lng,
  property_type,distress_type,status,estimated_value,proposed_asking_price,
  property_score,square_footage,bedrooms,bathrooms,year_built,lot_size,
  description,source,source_name,source_url,scraped_at,last_verified_at,
  image_fetch_attempts,days_on_market,images,is_featured,created_date,
  updated_date,updated_at
)
on public.properties to anon, authenticated;

drop policy if exists hpi_public_active_properties on public.properties;
create policy hpi_public_active_properties
on public.properties
for select
to anon, authenticated
using (
  status = 'active'
  and exists (
    select 1
    from public.universal_site_properties usp
    where usp.property_id = properties.id
      and usp.site_key = 'hidden-property-intel'
      and usp.listing_status in ('visible','featured')
  )
);
