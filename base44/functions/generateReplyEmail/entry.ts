import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { PLATFORM_VALUE_PROPS, BROKER } from '../../shared/outreachTemplates.ts';

/**
 * Generates a personalized reply / follow-up email for a contact who has
 * RESPONDED to initial outreach. Handles investors, property owners, and
 * heirs (next of kin). Each persona gets a tailored tone and goal.
 *
 * Args:
 *   contact_type   — 'investor' | 'owner' | 'heir'
 *   contact_id     — the InvestorLead or Owner record ID
 *   reply_content  — what the contact said in their response (required)
 *   kin_index      — index into owner.next_of_kin (for heir mode)
 *
 * Returns { subject, body, contact_id, contact_type } and saves the template.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { contact_type, contact_id, reply_content, kin_index } = body;
    if (!contact_type || !contact_id) return Response.json({ error: 'contact_type and contact_id required' }, { status: 400 });
    if (!reply_content) return Response.json({ error: 'reply_content required — what did they say?' }, { status: 400 });

    // Load the record
    let record;
    let isHeir = false;
    let kinRecord = null;

    if (contact_type === 'investor') {
      const leads = await base44.asServiceRole.entities.InvestorLead.filter({ id: contact_id });
      record = leads[0];
    } else {
      const owners = await base44.asServiceRole.entities.Owner.filter({ id: contact_id });
      record = owners[0];
      if (contact_type === 'heir') {
        isHeir = true;
        kinRecord = record?.next_of_kin?.[kin_index];
        if (!kinRecord) return Response.json({ error: 'Heir not found at that index' }, { status: 400 });
      }
    }
    if (!record) return Response.json({ error: 'Contact not found' }, { status: 404 });

    // Build property context for owners/heirs
    let propertyAddress = '';
    let distressType = '';
    if (contact_type !== 'investor' && record.property_id) {
      const prop = await base44.asServiceRole.entities.Property.get(record.property_id).catch(() => null);
      if (prop) {
        propertyAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
        distressType = prop.distress_type?.replace(/_/g, ' ') || '';
      }
    }

    let prompt;

    if (contact_type === 'investor') {
      prompt = `You are Steve Giordano, a licensed Florida real estate broker and founder of Hidden Property Intel. An investor has RESPONDED to your outreach email. This is a live conversation now — write a warm, human reply that moves them toward action.

INVESTOR INFO:
- Name: ${record.name}
- Company: ${record.company || 'N/A'}
- Target markets: ${(record.target_markets || []).join(', ') || 'Florida'}
- Investment types: ${(record.investment_types || []).join(', ') || 'distressed & off-market'}
- Contact count so far: ${record.contact_count || 1}

THEIR REPLY:
${reply_content}

${PLATFORM_VALUE_PROPS}

Write a response that:
- Addresses their specific questions, concerns, or interests from their reply DIRECTLY — don't gloss over what they said
- Is warm, conversational, and genuinely human — this is a relationship being built, not a sales push
- If they asked about deals: mention we have ${record.target_markets?.length ? record.target_markets.join('/') : 'Florida'} properties scored and ready to review
- If they asked about pricing: mention Starter $49, Pro $149, Elite $499 — all 20% below competitors
- If they seemed interested but hesitant: offer a quick 15-min walkthrough call
- If they asked about a specific property type: confirm we have those in our pipeline
- Includes a single clear, low-friction next step (schedule a call, review a property, or sign up)
- Is concise (150-250 words) — investors are busy
- Signs off as Steve Giordano, Licensed Real Estate Broker, ${BROKER.phone}

Return JSON: { "subject": "...", "body": "..." }
Subject should be a natural reply (e.g. "Re: their topic" or a relevant follow-up).`;
    } else if (isHeir) {
      prompt = `You are Steve Giordano, a licensed Florida real estate broker and founder of Hidden Property Intel. A potential heir (${kinRecord.name}) has RESPONDED to your outreach about a property that may be in probate. This is an extremely sensitive conversation — they may be grieving, confused, or overwhelmed. Write with deep empathy.

HEIR INFO:
- Name: ${kinRecord.name}
- Relationship to deceased owner: ${kinRecord.relationship || 'family member'}
- Deceased owner: ${record.name}
- Property: ${propertyAddress || 'a property in Florida'}
- Situation: ${distressType || 'probate / inherited property'}

THEIR REPLY:
${reply_content}

${PLATFORM_VALUE_PROPS}

Write a response that:
- Starts with genuine empathy — acknowledge their loss and their situation first, before anything else
- Addresses what they said directly — if they're confused, clarify gently; if they're angry, validate; if they're ready, guide
- Explains the probate property process in plain, simple language (no jargon, no pressure)
- If they want to sell: describe how we can help — fair cash offer, no commissions, close on their timeline, we handle the paperwork
- If they're not sure: offer a no-pressure phone call to explain their options, no obligation
- If they need time: say that's completely fine, give them your direct number, and let them know they can reach out whenever they're ready
- Never pushes, never pressures, never assumes — this person may be in mourning
- Is concise (150-200 words) — people in grief can't process long emails
- Signs off as Steve Giordano, Licensed Real Estate Broker, ${BROKER.phone}

Return JSON: { "subject": "...", "body": "..." }`;
    } else {
      // Property owner who responded
      prompt = `You are Steve Giordano, a licensed Florida real estate broker and founder of Hidden Property Intel. A property owner has RESPONDED to your outreach. They may be in a distressed situation (foreclosure, tax delinquency, probate, divorce, code violations). Write a warm, respectful reply that builds trust and moves toward a solution.

OWNER INFO:
- Name: ${record.name}
- Property: ${propertyAddress || 'a property in Florida'}
- Distress situation: ${distressType || 'potentially distressed'}

THEIR REPLY:
${reply_content}

${PLATFORM_VALUE_PROPS}

Write a response that:
- Addresses their specific situation from their reply directly — if they're worried about foreclosure, address that; if they want to know the value, address that; if they're not interested, be gracious
- Is warm, respectful, and human — this person may be going through one of the hardest times of their life
- If they want an offer: explain we can provide a fair cash offer within 24-48 hours, no obligation, no commissions
- If they want to know their options: briefly list (1) cash offer from us, (2) list on the MLS with AI pricing, (3) we can help them find an investor — let them choose
- If they're worried about timeline: reassure them we close on their schedule, as fast as 7 days or as slow as they need
- If they asked about the process: keep it simple — (1) we assess, (2) we make an offer, (3) you decide, (4) we close with smart-contract escrow for security
- Never pressures — always frames it as "here are your options" not "you should do this"
- Is concise (150-250 words)
- Signs off as Steve Giordano, Licensed Real Estate Broker, ${BROKER.phone}

Return JSON: { "subject": "...", "body": "..." }`;
    }

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

    // Save the reply template on the record
    if (contact_type === 'investor') {
      await base44.asServiceRole.entities.InvestorLead.update(record.id, {
        last_outreach_subject: r.subject,
        last_outreach_body: r.body,
        outreach_status: 'responded',
      });
    } else {
      await base44.asServiceRole.entities.Owner.update(record.id, {
        last_outreach_subject: r.subject,
        last_outreach_body: r.body,
        outreach_status: 'responded',
      });
    }

    return Response.json({ subject: r.subject, body: r.body, contact_id: record.id, contact_type });
  } catch (error) {
    console.error('generateReplyEmail error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}