import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { PLATFORM_VALUE_PROPS } from '../../shared/outreachTemplates.ts';

/**
 * Generates a humanistic outreach email for a property owner or their next of kin.
 *
 * Args:
 *   owner_id          — the Owner record ID
 *   mode              — 'owner' (default) or 'next_of_kin'
 *   next_of_kin_index — index into owner.next_of_kin array (when mode='next_of_kin')
 *
 * Returns { subject, body, owner_id } and saves the template on the owner.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { owner_id, mode = 'owner', next_of_kin_index } = body;
    if (!owner_id) return Response.json({ error: 'owner_id required' }, { status: 400 });

    const owners = await base44.asServiceRole.entities.Owner.filter({ id: owner_id });
    const owner = owners[0];
    if (!owner) return Response.json({ error: 'Owner not found' }, { status: 404 });

    // Get property context if linked
    let propertyAddress = '';
    let distressType = '';
    if (owner.property_id) {
      const prop = await base44.asServiceRole.entities.Property.get(owner.property_id).catch(() => null);
      if (prop) {
        propertyAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
        distressType = prop.distress_type?.replace(/_/g, ' ') || '';
      }
    }
    if (!propertyAddress && owner.contact_address) propertyAddress = owner.contact_address;

    let prompt;
    if (mode === 'next_of_kin') {
      const kin = owner.next_of_kin?.[next_of_kin_index];
      if (!kin) return Response.json({ error: 'Next of kin not found at that index' }, { status: 400 });

      prompt = `You are Steve Giordano, a licensed Florida real estate broker and founder of Hidden Property Intel. You're trying to reach a property owner (${owner.name}) regarding their property at ${propertyAddress || 'a property in Florida'} but have been unable to reach them. You've identified ${kin.name} as a possible relative (${kin.relationship || 'family member'}) who may have contact with them.

Write a respectful, human, personalized email to ${kin.name} asking for their help connecting you with ${owner.name}.

Context:
- Owner name: ${owner.name}
- Property: ${propertyAddress || 'a property in Florida'}
- Distress situation: ${distressType || 'potentially distressed'}
- Relative name: ${kin.name}
- Relationship: ${kin.relationship || 'family member'}

${PLATFORM_VALUE_PROPS}

Write an email that:
- Is respectful, warm, and never pushy — you're asking a favor, not selling
- Explains briefly and honestly why you're trying to reach ${owner.name} (without revealing sensitive distress details bluntly — frame it as "regarding their property" and "an opportunity")
- Describes our services in plain language: we help property owners get fair cash offers with no commissions, and we use AI to price fairly
- Mentions our technology briefly (AI pricing, smart-contract escrow) as credibility, not as a sales pitch
- Asks ${kin.name} to pass along our contact info or connect us
- Is concise (150-200 words) and genuinely caring
- Signs off as Steve Giordano with broker credentials

Return JSON: { "subject": "...", "body": "..." }`;
    } else {
      prompt = `You are Steve Giordano, a licensed Florida real estate broker and founder of Hidden Property Intel. Write a personalized, humanistic outreach email to a property owner who may be in a distressed situation.

OWNER INFO:
- Name: ${owner.name}
- Property: ${propertyAddress || 'a property in Florida'}
- Distress situation: ${distressType || 'potentially distressed'}
- Owner type: ${owner.owner_type}

${PLATFORM_VALUE_PROPS}

Write an email that:
- Opens with genuine empathy for their situation — never generic, never template-like
- Is warm, respectful, and human — this person may be going through a hard time (probate, foreclosure, tax issues, divorce)
- Describes our services in plain, honest language: no commissions, no fees, AI-powered fair pricing, close on their timeline
- Mentions our technology naturally: AI pricing against comparable sales, AI negotiation assistant, smart-contract escrow for security
- Frames it as an opportunity, not pressure — "if you'd consider a cash offer" not "you should sell"
- Is concise (150-250 words) — people in distress don't read long emails
- Signs off as Steve Giordano with broker credentials

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

    await base44.asServiceRole.entities.Owner.update(owner.id, {
      last_outreach_subject: r.subject,
      last_outreach_body: r.body,
    });

    return Response.json({ subject: r.subject, body: r.body, owner_id: owner.id });
  } catch (error) {
    console.error('generateOwnerOutreach error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}