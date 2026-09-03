import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { PLATFORM_VALUE_PROPS } from '../../shared/outreachTemplates.ts';

/**
 * Generates a humanistic, personalized outreach email (or reply response)
 * for a specific investor lead using InvokeLLM.
 *
 * Args:
 *   lead_id       — the InvestorLead record ID
 *   mode          — 'outreach' (default) or 'reply'
 *   reply_content — the investor's reply text (required when mode='reply')
 *
 * Returns { subject, body, lead_id } and saves the template on the lead.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { lead_id, mode = 'outreach', reply_content } = body;
    if (!lead_id) return Response.json({ error: 'lead_id required' }, { status: 400 });

    const leads = await base44.asServiceRole.entities.InvestorLead.filter({ id: lead_id });
    const lead = leads[0];
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    const investorContext = `INVESTOR INFO:
- Name: ${lead.name}
- Company: ${lead.company || 'N/A'}
- Target markets: ${(lead.target_markets || []).join(', ') || 'Florida'}
- Investment types: ${(lead.investment_types || []).join(', ') || 'distressed & off-market'}
- Region: ${lead.region || 'Florida'}
- Contact count so far: ${lead.contact_count || 0}`;

    let prompt;
    if (mode === 'reply' && reply_content) {
      prompt = `You are Steve Giordano, a licensed Florida real estate broker and founder of Hidden Property Intel. An investor has replied to your outreach email. Write a warm, human, personalized response.

${investorContext}

THEIR REPLY:
${reply_content}

${PLATFORM_VALUE_PROPS}

Write a response that:
- Addresses their specific questions or concerns from their reply directly
- Is warm, conversational, and genuinely human — not salesy, not robotic, not a template
- References their specific investment focus and markets naturally
- Weaves in relevant platform benefits only where they fit the conversation (don't list them)
- Includes a clear, low-friction next step
- Signs off as Steve Giordano with broker credentials

Return JSON: { "subject": "...", "body": "..." }
Subject should be a natural reply to their message (e.g. "Re: their subject" or a relevant follow-up).`;
    } else {
      prompt = `You are Steve Giordano, a licensed Florida real estate broker and founder of Hidden Property Intel. Write a personalized, humanistic outreach email to a real estate investor inviting them to join our platform.

${investorContext}

${PLATFORM_VALUE_PROPS}

Write an email that:
- Opens with something specific and genuine about THEIR investment activity — never a generic template opener like "I hope this finds you well"
- Is warm, conversational, and human — reads like it was written by a real person who did their homework on this investor
- Naturally weaves in 2-3 key differentiators that matter to THIS investor based on their focus:
  * If they flip: mention AI repair-cost estimates, ARV scoring, and off-market access
  * If they wholesale: mention off-market deals before MLS, no buyer premiums
  * If they buy-and-hold: mention ownership chain tracing and market analytics
  * If they do probate: mention heir identification and ownership chain tracing
- Frames our advantages without directly naming competitors — say "unlike other platforms" or "what you won't find elsewhere"
- Includes a single clear, low-friction call to action
- Is concise (150-250 words) — investors are busy
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

    await base44.asServiceRole.entities.InvestorLead.update(lead.id, {
      last_outreach_subject: r.subject,
      last_outreach_body: r.body,
    });

    return Response.json({ subject: r.subject, body: r.body, lead_id: lead.id });
  } catch (error) {
    console.error('generateInvestorOutreach error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}