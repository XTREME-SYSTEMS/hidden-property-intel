import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

/**
 * Sends an outreach email to an investor lead or property owner, updates
 * their outreach status, and schedules the next follow-up if enabled.
 *
 * Args:
 *   entity_type — 'investor' | 'owner'
 *   record_id   — the record ID
 *   to_email    — recipient email (falls back to record's email)
 *   subject     — email subject
 *   body        — email body
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { entity_type, record_id, to_email, subject, body: emailBody } = body;
    if (!entity_type || !record_id || !subject || !emailBody) {
      return Response.json({ error: 'entity_type, record_id, subject, and body are required' }, { status: 400 });
    }

    const entity = entity_type === 'investor' ? 'InvestorLead' : 'Owner';
    const records = await base44.asServiceRole.entities[entity].filter({ id: record_id });
    const record = records[0];
    if (!record) return Response.json({ error: 'Record not found' }, { status: 404 });

    const recipient = to_email || record.email || record.contact_email;
    if (!recipient) return Response.json({ error: 'No email address on file for this record' }, { status: 400 });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipient,
      from_name: 'Hidden Property Intel',
      subject,
      body: emailBody,
    });

    const now = new Date();
    const update: any = {
      outreach_status: 'contacted',
      last_outreach_subject: subject,
      last_outreach_body: emailBody,
      contacted_at: now.toISOString(),
    };

    if (entity_type === 'investor') {
      update.last_contacted = now.toISOString();
      update.contact_count = (record.contact_count || 0) + 1;
    }

    // Schedule next follow-up if enabled
    if (record.follow_up_enabled && record.follow_up_frequency_days) {
      const next = new Date(now.getTime() + record.follow_up_frequency_days * 86400000);
      update.next_follow_up_date = next.toISOString();
    }

    await base44.asServiceRole.entities[entity].update(record_id, update);

    return Response.json({ sent: true, to: recipient, record_id, entity_type });
  } catch (error) {
    console.error('sendOutreach error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}