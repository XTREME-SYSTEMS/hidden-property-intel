import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { PLATFORM_VALUE_PROPS, BROKER } from '../../shared/outreachTemplates.ts';

/**
 * Autonomous Follow-Up Engine — runs on a schedule, finds all contacts
 * with follow-ups due, generates a personalized follow-up email via LLM,
 * sends it, and reschedules the next follow-up.
 *
 * Processes both InvestorLead and Owner records.
 * Skips contacts with outreach_status === 'opted_out'.
 * Stops after 7 contacts (configurable) per run to avoid spamming.
 *
 * No args needed — runs fully autonomously.
 * Returns { processed, sent, skipped, errors, details }
 */
const MAX_PER_RUN = 20;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date().toISOString();

    // Find due follow-ups: follow_up_enabled=true, automation_enabled=true,
    // next_follow_up_date <= now, not opted_out
    const [investors, owners] = await Promise.all([
      base44.asServiceRole.entities.InvestorLead.filter({
        follow_up_enabled: true,
        automation_enabled: true,
        outreach_status: { $ne: 'opted_out' },
      }, '-next_follow_up_date', 100),
      base44.asServiceRole.entities.Owner.filter({
        follow_up_enabled: true,
        automation_enabled: true,
        outreach_status: { $ne: 'opted_out' },
      }, '-next_follow_up_date', 100),
    ]);

    // Filter to only those actually due (next_follow_up_date <= now)
    const dueInvestors = investors.filter(
      (i) => i.next_follow_up_date && new Date(i.next_follow_up_date) <= new Date(now)
    );
    const dueOwners = owners.filter(
      (o) => o.next_follow_up_date && new Date(o.next_follow_up_date) <= new Date(now)
    );

    // Combine and limit
    const allDue = [
      ...dueInvestors.map((r) => ({ record: r, type: 'investor' })),
      ...dueOwners.map((r) => ({ record: r, type: 'owner' })),
    ].slice(0, MAX_PER_RUN);

    const results = [];
    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const { record, type } of allDue) {
      try {
        const contactCount = record.contact_count || 0;
        const hasEmail = type === 'investor' ? record.email : record.contact_email;

        // Skip if no email on file
        if (!hasEmail) {
          skipped++;
          results.push({ id: record.id, type, name: record.name, status: 'skipped_no_email' });
          continue;
        }

        // Stop following up after 7 contacts with no response
        if (contactCount >= 7 && record.outreach_status !== 'responded') {
          await base44.asServiceRole.entities[type === 'investor' ? 'InvestorLead' : 'Owner'].update(record.id, {
            follow_up_enabled: false,
            automation_enabled: false,
          });
          skipped++;
          results.push({ id: record.id, type, name: record.name, status: 'stopped_max_contacts' });
          continue;
        }

        // Build property context for owners
        let propertyAddress = '';
        let distressType = '';
        if (type === 'owner' && record.property_id) {
          const prop = await base44.asServiceRole.entities.Property.get(record.property_id).catch(() => null);
          if (prop) {
            propertyAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
            distressType = prop.distress_type?.replace(/_/g, ' ') || '';
          }
        }

        // Determine follow-up tone based on contact count
        let tone = 'warm_checkin';
        if (contactCount >= 4) tone = 'urgency';
        else if (contactCount >= 2) tone = 'new_angle';

        const isResponded = record.outreach_status === 'responded';

        const prompt = `You are Steve Giordano, a licensed Florida real estate broker and founder of Hidden Property Intel. Write a follow-up email to a ${type === 'investor' ? 'real estate investor' : 'property owner'} who ${isResponded ? 'responded to our initial outreach' : 'has not yet responded to our outreach'}.

CONTACT INFO:
- Name: ${record.name}
- Type: ${type}
${type === 'investor' ? `- Company: ${record.company || 'N/A'}\n- Target markets: ${(record.target_markets || []).join(', ') || 'Florida'}\n- Investment types: ${(record.investment_types || []).join(', ') || 'distressed & off-market'}` : `- Property: ${propertyAddress || 'a property in Florida'}\n- Situation: ${distressType || 'potentially distressed'}`}
- Contact count so far: ${contactCount}
- Last contacted: ${record.last_contacted || record.contacted_at ? new Date(record.last_contacted || record.contacted_at).toLocaleDateString() : 'Never'}
- Status: ${record.outreach_status}
- Follow-up tone: ${tone}

${PLATFORM_VALUE_PROPS}

Write a follow-up email that:
${isResponded ? 
`- References their previous response and continues the conversation naturally
- Moves them toward a clear next step (a call, a property review, or signing up)
- Is warm and conversational — this is a live relationship` :
`- ${contactCount === 0 ? "Introduces yourself and the platform fresh" : "References that you've reached out before without being pushy"}
- ${tone === 'urgency' ? "Creates gentle urgency — mention a specific property or market opportunity that won't last" : tone === 'new_angle' ? "Takes a different angle than before — share a specific market insight or recent deal" : "Is a warm, low-pressure check-in"}
- Adds NEW value — don't repeat the same pitch, share something specific and useful
- Is concise (120-180 words) — ${type === 'investor' ? 'investors are busy' : 'people in distress skim emails'}
- Includes a single clear, low-friction call to action`}
- Signs off as Steve Giordano, Licensed Real Estate Broker, ${BROKER.phone}

Return JSON: { "subject": "...", "body": "..." }`;

        const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          model: 'claude_sonnet_4_6',
          response_json_schema: {
            type: 'object',
            properties: {
              subject: { type: 'string' },
              body: { type: 'string' },
            },
          },
        });

        // Send the email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: hasEmail,
          from_name: 'Hidden Property Intel',
          subject: r.subject,
          body: r.body,
        });

        // Update the record
        const nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + (record.follow_up_frequency_days || 7));

        const update = {
          last_outreach_subject: r.subject,
          last_outreach_body: r.body,
          contacted_at: now,
          next_follow_up_date: nextDate.toISOString(),
        };

        if (type === 'investor') {
          update.last_contacted = now;
          update.contact_count = contactCount + 1;
          if (record.outreach_status === 'new') update.outreach_status = 'contacted';
        } else {
          if (record.outreach_status === 'new') update.outreach_status = 'contacted';
        }

        await base44.asServiceRole.entities[type === 'investor' ? 'InvestorLead' : 'Owner'].update(record.id, update);

        sent++;
        results.push({ id: record.id, type, name: record.name, email: hasEmail, status: 'sent', subject: r.subject });
      } catch (e) {
        errors++;
        results.push({ id: record.id, type, name: record.name, status: 'error', error: e.message });
      }
    }

    return Response.json({
      processed: allDue.length,
      sent,
      skipped,
      errors,
      due_investors: dueInvestors.length,
      due_owners: dueOwners.length,
      details: results,
    });
  } catch (error) {
    console.error('processFollowUps error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}