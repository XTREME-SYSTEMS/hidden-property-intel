import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { supabaseSelect, supabaseUpsert } from '../../shared/supabaseClient.ts';
import { secrets } from 'base44:runtime';

/**
 * syncToSupabase — Mirrors Base44 entities (Property, PropertyScore, Owner,
 * InvestorLead, Deal) into your own Supabase tables so you own a complete,
 * SQL-queryable copy of all platform data.
 *
 * Incremental: only syncs records updated since the last run (tracked in
 * Supabase sync_state). First run syncs everything (batch of 500).
 *
 * Auth: admin OR BASE44_SYNC_TOKEN (for Vercel cron / external triggers).
 */

const BATCH = 500;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Auth: admin OR sync token
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('Authorization') || '';
    const syncToken = secrets.get('BASE44_SYNC_TOKEN') || '';
    const hasToken = syncToken && authHeader === `Bearer ${syncToken}`;

    if (!hasToken) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 1. Get last sync timestamp from Supabase sync_state
    let lastSync: string | null = null;
    try {
      const state = await supabaseSelect('sync_state', { id: 'eq.default', select: 'last_synced_at' });
      lastSync = (state as any[])[0]?.last_synced_at || null;
    } catch { /* first sync — sync_state not created yet */ }

    const stats: Record<string, number> = { properties: 0, scores: 0, owners: 0, leads: 0, deals: 0 };
    const errors: string[] = [];
    let maxUpdated = lastSync;

    const dateFilter = lastSync ? { updated_date: { $gte: lastSync } } : {};

    // 2. Sync Properties
    try {
      const properties = await base44.asServiceRole.entities.Property.filter(dateFilter, 'updated_date', BATCH);
      if (properties.length > 0) {
        const rows = properties.map((p: any) => ({
          base44_id: p.id,
          address: p.address,
          normalized_address: p.normalized_address,
          city: p.city,
          state: p.state,
          zip_code: p.zip_code,
          lat: p.lat,
          lng: p.lng,
          property_type: p.property_type,
          distress_type: p.distress_type,
          status: p.status,
          estimated_value: p.estimated_value,
          proposed_asking_price: p.proposed_asking_price,
          property_score: p.property_score,
          square_footage: p.square_footage,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          year_built: p.year_built,
          lot_size: p.lot_size,
          description: p.description,
          seller_id: p.seller_id,
          source: p.source,
          source_url: p.source_url,
          scraped_at: p.scraped_at,
          last_verified_at: p.last_verified_at,
          image_fetch_attempts: p.image_fetch_attempts,
          days_on_market: p.days_on_market,
          images: p.images || [],
          is_featured: p.is_featured || false,
        }));
        await supabaseUpsert('properties', rows, 'base44_id');
        stats.properties = rows.length;
        maxUpdated = properties[properties.length - 1]?.updated_date || maxUpdated;
      }
    } catch (e: any) { errors.push(`properties: ${e.message}`); }

    // 3. Sync PropertyScores
    try {
      const scores = await base44.asServiceRole.entities.PropertyScore.filter(dateFilter, 'updated_date', BATCH);
      if (scores.length > 0) {
        const rows = scores.map((s: any) => ({
          base44_id: s.id,
          property_id: s.property_id,
          overall_score: s.overall_score,
          distress_severity: s.distress_severity,
          repair_cost_estimate: s.repair_cost_estimate,
          after_repair_value: s.after_repair_value,
          estimated_roi: s.estimated_roi,
          ai_analysis: s.ai_analysis,
          scored_at: s.scored_at,
          model_version: s.model_version,
        }));
        await supabaseUpsert('property_scores', rows, 'base44_id');
        stats.scores = rows.length;
      }
    } catch (e: any) { errors.push(`scores: ${e.message}`); }

    // 4. Sync Owners
    try {
      const owners = await base44.asServiceRole.entities.Owner.filter(dateFilter, 'updated_date', BATCH);
      if (owners.length > 0) {
        const rows = owners.map((o: any) => ({
          base44_id: o.id,
          property_id: o.property_id,
          name: o.name,
          owner_type: o.owner_type,
          contact_phone: o.contact_phone,
          contact_email: o.contact_email,
          contact_address: o.contact_address,
          relationship_to_property: o.relationship_to_property,
          acquired_date: o.acquired_date,
          ownership_percentage: o.ownership_percentage,
          is_verified: o.is_verified,
          source: o.source,
          outreach_status: o.outreach_status,
          contacted_at: o.contacted_at,
          follow_up_enabled: o.follow_up_enabled,
          next_follow_up_date: o.next_follow_up_date,
          automation_enabled: o.automation_enabled,
          is_reachable: o.is_reachable,
        }));
        await supabaseUpsert('owners', rows, 'base44_id');
        stats.owners = rows.length;
      }
    } catch (e: any) { errors.push(`owners: ${e.message}`); }

    // 5. Sync InvestorLeads
    try {
      const leads = await base44.asServiceRole.entities.InvestorLead.filter(dateFilter, 'updated_date', BATCH);
      if (leads.length > 0) {
        const rows = leads.map((l: any) => ({
          base44_id: l.id,
          name: l.name,
          company: l.company,
          email: l.email,
          phone: l.phone,
          website: l.website,
          target_markets: l.target_markets || [],
          investment_types: l.investment_types || [],
          region: l.region,
          source: l.source,
          outreach_status: l.outreach_status,
          last_contacted: l.last_contacted,
          contact_count: l.contact_count,
          notes: l.notes,
          follow_up_enabled: l.follow_up_enabled,
          follow_up_frequency_days: l.follow_up_frequency_days,
          next_follow_up_date: l.next_follow_up_date,
          automation_enabled: l.automation_enabled,
        }));
        await supabaseUpsert('investor_leads', rows, 'base44_id');
        stats.leads = rows.length;
      }
    } catch (e: any) { errors.push(`leads: ${e.message}`); }

    // 6. Sync Deals
    try {
      const deals = await base44.asServiceRole.entities.Deal.filter(dateFilter, 'updated_date', BATCH);
      if (deals.length > 0) {
        const rows = deals.map((d: any) => ({
          base44_id: d.id,
          property_id: d.property_id,
          user_id: d.user_id,
          stage: d.stage,
          exit_strategy: d.exit_strategy,
          acquisition_price: d.acquisition_price,
          rehab_budget: d.rehab_budget,
          arv: d.arv,
          holding_costs: d.holding_costs,
          projected_profit: d.projected_profit,
          actual_profit: d.actual_profit,
          status: d.status,
          notes: d.notes,
          target_close_date: d.target_close_date,
        }));
        await supabaseUpsert('deals', rows, 'base44_id');
        stats.deals = rows.length;
      }
    } catch (e: any) { errors.push(`deals: ${e.message}`); }

    // 7. Update sync_state
    const newSyncTime = maxUpdated || new Date().toISOString();
    try {
      await supabaseUpsert('sync_state', { id: 'default', last_synced_at: newSyncTime, last_property_count: stats.properties }, 'id');
    } catch (e: any) { errors.push(`sync_state: ${e.message}`); }

    return Response.json({
      synced: stats,
      lastSync,
      newSyncTime,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}