import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const SCHEMA = {
  type: 'object',
  properties: {
    source_code: { type: 'string' },
    abi: { type: 'string' },
    contract_name: { type: 'string' }
  }
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { property_id, investor_id, seller_id, contract_type, terms } = body;
    if (!property_id || !investor_id || !seller_id) {
      return Response.json({ error: 'property_id, investor_id, seller_id required' }, { status: 400 });
    }

    const property = await base44.asServiceRole.entities.Property.get(property_id);
    const t = terms || {};
    const prompt = `Generate a complete, deployable Solidity 0.8.20 smart contract for a Polygon real estate escrow. Embed these deal terms as constants: purchase price $${t.price || 0}, earnest money $${t.earnest_money || 0}, closing date ${t.closing_date || 'TBD'}, contingencies: ${(t.contingencies || []).join(', ') || 'none'}. Property: ${property.address}, ${property.city}, ${property.state}. The contract must: hold earnest money, allow buyer and seller to sign, release funds to the seller on mutual agreement, refund the buyer if contingencies fail, and emit events for each action. Return JSON with source_code (the full Solidity file), abi (a JSON string of the contract ABI), and contract_name.`;

    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: SCHEMA
    });

    const created = await base44.asServiceRole.entities.SmartContract.create({
      property_id,
      investor_id,
      seller_id,
      contract_type: contract_type || 'escrow',
      terms: t,
      blockchain: 'polygon',
      status: 'draft',
      abi: r.abi,
      source_code: r.source_code
    });

    return Response.json({
      smart_contract_id: created.id,
      contract_name: r.contract_name,
      status: 'draft',
      source_code_length: (r.source_code || '').length
    });
  } catch (error) {
    console.error('generateSmartContract error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}