import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { contact_id, contact_type } = body;
    if (!contact_id || !contact_type) return Response.json({ error: 'contact_id and contact_type required' }, { status: 400 });

    let record;
    if (contact_type === 'investor') {
      const leads = await base44.entities.InvestorLead.filter({ id: contact_id }, '-created_date', 1);
      record = leads[0];
    } else {
      const owners = await base44.entities.Owner.filter({ id: contact_id }, '-created_date', 1);
      record = owners[0];
    }

    if (!record) return Response.json({ error: 'Contact not found' }, { status: 404 });

    const contactCount = record.contact_count || 0;
    const lastContacted = record.last_contacted || record.contacted_at;
    const daysSinceContact = lastContacted
      ? Math.floor((Date.now() - new Date(lastContacted).getTime()) / 86400000)
      : 999;

    const prompt = `You are an Autonomous Follow-Up Intelligence AI. Analyze this contact's outreach history and decide the optimal follow-up strategy.

Contact Type: ${contact_type}
Name: ${record.name}
Company: ${record.company || 'N/A'}
Outreach Status: ${record.outreach_status}
Contact Count: ${contactCount}
Last Contacted: ${lastContacted ? new Date(lastContacted).toLocaleDateString() : 'Never'}
Days Since Last Contact: ${daysSinceContact}
Follow-Up Enabled: ${record.follow_up_enabled}
Follow-Up Frequency: ${record.follow_up_frequency_days || 7} days
Next Follow-Up Date: ${record.next_follow_up_date || 'Not set'}
Automation Enabled: ${record.automation_enabled}
Last Outreach Subject: ${record.last_outreach_subject || 'N/A'}

Analyze:
1. Should we follow up now? (based on days since contact, status, and frequency)
2. What channel should we use? (email is default — recommend SMS or direct mail if email hasn't worked after 3+ contacts)
3. What tone should the follow-up take? (check-in, new value prop, different angle, final attempt)
4. What's the optimal message content? (reference previous outreach, add new value)
5. Should we stop following up? (recommend stopping after 5+ contacts with no response)

Decision framework:
- 0-3 contacts: Warm follow-up, new value prop
- 4-6 contacts: Different angle, urgency
- 7+ contacts or opted_out: Stop following up`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          should_follow_up: { type: "boolean" },
          urgency: { type: "string" },
          recommended_channel: { type: "string" },
          tone: { type: "string" },
          suggested_subject: { type: "string" },
          suggested_message: { type: "string" },
          reasoning: { type: "string" },
          stop_following_up: { type: "boolean" },
          next_action_date: { type: "string" }
        }
      }
    });

    if (result.should_follow_up && !result.stop_following_up) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (record.follow_up_frequency_days || 7));
      await base44.asServiceRole.entities[contact_type === 'investor' ? 'InvestorLead' : 'Owner'].update(record.id, {
        next_follow_up_date: nextDate.toISOString(),
      });
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}