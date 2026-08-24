import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { property_id, content, investor_id } = body || {};
    if (!property_id || !content) return Response.json({ error: 'property_id and content required' }, { status: 400 });

    const property = await base44.asServiceRole.entities.Property.get(property_id);
    const isSeller = property.seller_id && property.seller_id === user.id;
    const senderRole = isSeller ? 'seller' : 'investor';
    const sellerId = property.seller_id || user.id;

    let thread = (await base44.asServiceRole.entities.NegotiationThread.filter({ property_id, seller_id: sellerId }))[0];
    if (!thread) {
      thread = await base44.asServiceRole.entities.NegotiationThread.create({
        property_id,
        seller_id: sellerId,
        investor_id: investor_id || user.id,
        messages: [],
        status: 'active'
      });
    }

    const userMsg = { sender: 'user', role: senderRole, content, sent_at: new Date().toISOString() };
    const messages = [...(thread.messages || []), userMsg];

    const bids = await base44.asServiceRole.entities.Bid.filter({ property_id });
    const prompt = `You are an AI negotiation coach inside a real estate deal platform. A ${senderRole} just sent this message in the negotiation thread for ${property.address}, ${property.city}, ${property.state} (distress: ${property.distress_type}, estimated value: ${property.estimated_value ?? 'n/a'}, asking: ${property.proposed_asking_price ?? 'n/a'}).
Bids on file: ${JSON.stringify(bids.map(b => ({ amount: b.bid_amount, status: b.status })))}
Message: "${content}"

Coach the ${senderRole} concisely: assess the message's negotiating position, recommend the next move (accept/counter/reject/hold), suggest a counter amount if relevant, and give 2-3 talking points. Return JSON: { assessment, recommendation, counter_amount, reasoning, talking_points[]. }`;

    const schema = {
      type: 'object',
      properties: {
        assessment: { type: 'string' },
        recommendation: { type: 'string' },
        counter_amount: { type: 'number' },
        reasoning: { type: 'string' },
        talking_points: { type: 'array', items: { type: 'string' } }
      }
    };
    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });

    const aiMsg = {
      sender: 'ai',
      role: 'assistant',
      content: r.reasoning,
      ai_analysis: r.assessment,
      suggestions: r.talking_points,
      sent_at: new Date().toISOString()
    };
    messages.push(aiMsg);

    await base44.asServiceRole.entities.NegotiationThread.update(thread.id, { messages });
    return Response.json({ ok: true, analysis: r });
  } catch (error) {
    console.error('sendNegotiationMessage error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}