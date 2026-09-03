import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

/**
 * Configures follow-up automation for an individual investor lead or property owner,
 * or enables it for all records of a type.
 *
 * Args:
 *   entity_type       — 'investor' | 'owner'
 *   record_id         — specific record ID, or 'all' to update every record
 *   enabled            — boolean (default true)
 *   frequency_days     — number (default 7)
 *   automation_enabled — boolean (default = enabled) — master automation toggle
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { entity_type, record_id, enabled = true, frequency_days = 7, automation_enabled } = body;
    if (!entity_type || !record_id) return Response.json({ error: 'entity_type and record_id required' }, { status: 400 });

    const entity = entity_type === 'investor' ? 'InvestorLead' : 'Owner';
    const autoVal = automation_enabled !== undefined ? automation_enabled : enabled;
    const now = new Date();
    const nextDate = new Date(now.getTime() + frequency_days * 86400000).toISOString();

    const update: any = {
      follow_up_enabled: enabled,
      follow_up_frequency_days: frequency_days,
      automation_enabled: autoVal,
    };
    if (enabled) update.next_follow_up_date = nextDate;

    if (record_id === 'all') {
      // Update all records of this type
      const records = await base44.asServiceRole.entities[entity].list('-created_date', 500);
      const ids = records.map((r) => r.id);
      // updateMany with $set
      await base44.asServiceRole.entities[entity].updateMany({}, { $set: update });
      return Response.json({ updated: ids.length, entity_type, all: true });
    }

    await base44.asServiceRole.entities[entity].update(record_id, update);
    return Response.json({ updated: 1, entity_type, record_id });
  } catch (error) {
    console.error('configureFollowUp error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}