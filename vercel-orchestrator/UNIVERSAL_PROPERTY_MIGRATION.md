# Universal Property Intelligence Supabase Migration

## Authority
Target: a new dedicated Supabase project in the Strategic Minds AI organization.
Project naming intent: universal, reusable by Hidden Property Intel and future property sites.

## Architecture
- One global `properties` identity table, deduped by `dedup_key`.
- `universal_property_sites` + `universal_site_properties` bind shared property intelligence to individual brands/sites.
- HPI is seeded as the first site: `hidden-property-intel`.
- Leads and deals retain site attribution.
- Base44 and Railway continue to use server-side credentials; browser roles have no direct table access by default.
- Existing HPI sync contracts remain compatible: `properties`, `property_scores`, `owners`, `investor_leads`, `deals`, `sync_state`.

## Migration source order
1. Base44 PropertyIntel entities are the recoverable application-data source.
2. Existing Railway scraper contract defines raw property ingestion columns.
3. Old Supabase is a migration source only if access becomes available before closure.
4. GitHub DDL is historical schema evidence, not blindly trusted.

## Cutover
1. Create new universal Supabase project.
2. Apply `000_universal_property_platform.sql`.
3. Apply `001_convergence_control_plane.sql`.
4. Run security + performance advisors.
5. Populate HPI mirror from Base44 into the new project.
6. Validate counts, sampled identities, dedup keys, latest timestamps, and relationship coverage.
7. Pause scraper writes for the final cutover window.
8. Repoint Railway and Base44 server-side Supabase credentials.
9. Validate scraper -> Supabase -> Base44 -> HPI application flow.
10. Activate the five-minute convergence heartbeat with dispatch locked.
11. Require three clean cycles and independent validation before production release.

## Rollback
Until validation passes, the current HPI production runtime remains untouched. Restore prior Railway/Base44 environment bindings if the new backend fails validation.
