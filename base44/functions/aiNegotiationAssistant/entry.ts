import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { property_id, message, offer_data } = body || {};
    if (!property_id) return Response.json({ error: 'property_id required' }, { status: 400 });

    const property = await base44.asServiceRole.entities.Property.get(property_id);
    const isSeller = property.seller_id && property.seller_id === user.id;
    if (user.role !== 'admin' && !isSeller) {
      return Response.json({ error: 'Only the seller or admin can use the negotiation assistant' }, { status: 403 });
    }

    const bids = await base44.asServiceRole.entities.Bid.filter({ property_id });
    const scores = await base44.asServiceRole.entities.PropertyScore.filter({ property_id });

    const prompt = `You are an AI negotiation coach for a property seller. Analyze the situation and advise.
Property: ${property.address}, ${property.city}, ${property.state}
Estimated value: ${property.estimated_value ?? 'n/a'}, Proposed asking: ${property.proposed_asking_price ?? 'n/a'}
Distress: ${property.distress_type}
Latest score: ${scores[0] ? `overall ${scores[0].overall_score}, ARV ${scores[0].after_repair_value}, repair est ${scores[0].repair_cost_estimate}` : 'n/a'}
All bids: ${JSON.stringify(bids.map(b => ({ amount: b.bid_amount, status: b.status })))}
Seller message: ${message ?? '(none)'}
Offer data: ${JSON.stringify(offer_data ?? {})}

Return JSON: assessment (fair/below/above market), recommendation (accept/counter/reject), counter_amount (number or null), reasoning, and talking_points (array of strings for a phone conversation).`;

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

    const sellerId = property.seller_id || user.id;
    const existing = await base44.asServiceRole.entities.NegotiationThread.filter({ property_id, seller_id: sellerId });
    const msg = {
      sender: 'ai',
      role: 'assistant',
      content: r.reasoning,
      ai_analysis: r.assessment,
      suggestions: r.talking_points,
      sent_at: new Date().toISOString()
    };
    if (existing[0]) {
      const msgs = [...(existing[0].messages || []), msg];
      await base44.asServiceRole.entities.NegotiationThread.update(existing[0].id, { messages: msgs });
    } else {
      await base44.asServiceRole.entities.NegotiationThread.create({
        property_id,
        seller_id: sellerId,
        messages: [msg],
        status: 'active'
      });
    }

    return Response.json({ analysis: r });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}