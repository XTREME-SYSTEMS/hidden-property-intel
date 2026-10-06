-- Universal Property Intelligence security/performance hardening

alter function public.hpi_block_receipt_mutation()
  set search_path = public;

revoke all on function public.hpi_acquire_reconcile_lease(text,text,integer)
  from public, anon, authenticated;
revoke all on function public.hpi_release_reconcile_lease(text,text)
  from public, anon, authenticated;
revoke all on function public.hpi_claim_convergence_job(text,text,text,text,jsonb)
  from public, anon, authenticated;

grant execute on function public.hpi_acquire_reconcile_lease(text,text,integer)
  to service_role;
grant execute on function public.hpi_release_reconcile_lease(text,text)
  to service_role;
grant execute on function public.hpi_claim_convergence_job(text,text,text,text,jsonb)
  to service_role;

create index if not exists idx_bids_site_key
  on public.bids(site_key);
create index if not exists idx_smart_contracts_site_key
  on public.smart_contracts(site_key);
create index if not exists idx_universal_property_site_domains_site_key
  on public.universal_property_site_domains(site_key);
create index if not exists idx_universal_site_properties_property_id
  on public.universal_site_properties(property_id);
