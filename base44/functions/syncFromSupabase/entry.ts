import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { supabaseSelect, supabaseUpdate } from "../../shared/supabaseClient.ts";

/**
 * syncFromSupabase — Bridge function that syncs properties from Supabase
 * (the source of truth, written by the Railway scraper) into Base44 Property
 * entities, so the existing Base44 UI keeps working off the same data.
 *
 * Admin-only. Can be triggered:
 *   1. Automatically by the Railway scraper (POST to this function's endpoint)
 *   2. By a Base44 workflow on a schedule
 *   3. Manually from the admin dashboard
 */

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Allow unauthenticated calls if a sync token is provided (Railway scraper)
    // Otherwise require admin auth
    const body = await req.json().catch(() => ({}));
    const hasToken = req.headers.get("Authorization")?.startsWith("Bearer ") && body?.trigger;

    if (!hasToken) {
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
      if (user.role !== "admin") return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    // 1. Get last sync timestamp from sync_state
    let lastSync: string | null = null;
    try {
      const state = await supabaseSelect("sync_state", { id: "eq.default", select: "last_synced_at" });
      lastSync = (state as any[])[0]?.last_synced_at || null;
    } catch { /* first sync — no state yet */ }

    // 2. Query properties updated since last sync
    const params: Record<string, string> = {
      select: "*",
      order: "updated_at.asc",
      limit: "500",
    };
    if (lastSync) {
      params["updated_at"] = `gt.${lastSync}`;
    }

    const properties = await supabaseSelect("properties", params) as any[];

    if (!properties || properties.length === 0) {
      return Response.json({ synced: 0, created: 0, updated: 0, lastSync, message: "No new properties" });
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    // 3. Upsert each property into Base44 Property entity
    for (const prop of properties) {
      try {
        // Check if exists by source_url first (most reliable)
        let existing: any[] = [];
        if (prop.source_url) {
          existing = await base44.asServiceRole.entities.Property.filter({ source_url: prop.source_url });
        }
        // Fallback: check by dedup_key (normalized_address + zip_code)
        if (existing.length === 0 && prop.normalized_address) {
          existing = await base44.asServiceRole.entities.Property.filter({
            normalized_address: prop.normalized_address,
            zip_code: prop.zip_code,
          });
        }

        const propData = {
          address: prop.address,
          normalized_address: prop.normalized_address,
          city: prop.city,
          state: prop.state,
          zip_code: prop.zip_code,
          lat: prop.lat,
          lng: prop.lng,
          property_type: prop.property_type || "residential",
          distress_type: prop.distress_type,
          status: prop.status || "active",
          estimated_value: prop.estimated_value,
          proposed_asking_price: prop.proposed_asking_price,
          property_score: prop.property_score,
          square_footage: prop.square_footage,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          year_built: prop.year_built,
          lot_size: prop.lot_size,
          description: prop.description,
          source: prop.source || "scraped",
          source_url: prop.source_url,
          scraped_at: prop.scraped_at,
          last_verified_at: prop.last_verified_at || prop.scraped_at,
          days_on_market: prop.days_on_market,
          images: prop.images || [],
          is_featured: prop.is_featured || false,
        };

        if (existing.length > 0) {
          await base44.asServiceRole.entities.Property.update(existing[0].id, propData);
          updated++;
        } else {
          await base44.asServiceRole.entities.Property.create(propData);
          created++;
        }
      } catch (e: any) {
        errors.push(`${prop.address || prop.id}: ${e.message}`);
      }
    }

    // 4. Update sync_state with the latest property's updated_at
    const lastUpdated = properties[properties.length - 1]?.updated_at || new Date().toISOString();
    try {
      await supabaseUpdate("sync_state", "id=eq.default", {
        last_synced_at: lastUpdated,
        last_property_count: properties.length,
      });
    } catch (e) {
      // sync_state might not exist yet — try insert via upsert
    }

    return Response.json({
      synced: properties.length,
      created,
      updated,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
      lastSync,
      newSyncTime: lastUpdated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}