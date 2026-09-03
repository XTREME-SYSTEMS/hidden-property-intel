import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

/**
 * AI-generates complete legal documents for a smart contract transaction:
 * purchase agreement, escrow instructions, property disclosure, closing
 * statement, and warranty deed. Stores them on the SmartContract record.
 *
 * Args:
 *   smart_contract_id — the SmartContract record
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { smart_contract_id } = body;
    if (!smart_contract_id) return Response.json({ error: 'smart_contract_id required' }, { status: 400 });

    const contracts = await base44.asServiceRole.entities.SmartContract.filter({ id: smart_contract_id });
    const contract = contracts[0];
    if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 });

    // Load linked entities
    let property = null, investor = null, seller = null;
    if (contract.property_id) {
      property = await base44.asServiceRole.entities.Property.get(contract.property_id).catch(() => null);
    }
    if (contract.investor_id) {
      const invs = await base44.asServiceRole.entities.Investor.filter({ user_id: contract.investor_id }).catch(() => []);
      investor = invs[0] || null;
    }
    if (contract.seller_id) {
      const sellers = await base44.asServiceRole.entities.Seller.filter({ user_id: contract.seller_id }).catch(() => []);
      seller = sellers[0] || null;
    }

    const terms = contract.terms || {};
    const addr = property ? `${property.address}, ${property.city}, ${property.state} ${property.zip_code}` : 'the Property';
    const buyerName = investor?.name || contract.investor_id || 'Buyer';
    const sellerName = seller?.name || contract.seller_id || 'Seller';

    const prompt = `You are a real estate attorney licensed in Florida. Generate complete, legally formatted documents for this real estate transaction. Fill in all blanks with the provided information.

TRANSACTION DETAILS:
- Property: ${addr}
- Buyer: ${buyerName}
- Seller: ${sellerName}
- Purchase Price: $${terms.price || 'TBD'}
- Earnest Money: $${terms.earnest_money || 'TBD'}
- Closing Date: ${terms.closing_date || 'TBD'}
- Contingencies: ${(terms.contingencies || []).join(', ') || 'standard inspection and financing contingencies'}
- Escrow: Smart contract on Polygon blockchain
- Contract Address: ${contract.contract_address || 'To be deployed'}

Generate these 5 documents, each complete and ready for signature:

1. REAL ESTATE PURCHASE AGREEMENT — A standard Florida residential purchase agreement with all clauses: parties, property description, purchase price, earnest money, closing date, contingencies, title, possession, disclosures, and signature blocks.

2. ESCROW INSTRUCTIONS — Instructions for the Polygon smart contract escrow, explaining the on-chain process: signing, depositing earnest money, inspection, fund release, and refund conditions.

3. SELLER'S PROPERTY DISCLOSURE STATEMENT — A disclosure of known defects and conditions, with standard categories (structural, roof, plumbing, electrical, HVAC, appliances, environmental, etc.) and a signature block.

4. CLOSING STATEMENT — An itemized HUD-1 style closing statement showing purchase price, earnest money, closing costs, and net proceeds to seller.

5. WARRANTY DEED — A Florida warranty deed transferring the property from seller to buyer, with legal description, grant clause, and notary acknowledgment block.

Return JSON: {
  "documents": [
    { "type": "purchase_agreement", "title": "Real Estate Purchase Agreement", "content": "full document text..." },
    { "type": "escrow_instructions", "title": "Smart Contract Escrow Instructions", "content": "..." },
    { "type": "property_disclosure", "title": "Seller's Property Disclosure Statement", "content": "..." },
    { "type": "closing_statement", "title": "Closing Statement", "content": "..." },
    { "type": "warranty_deed", "title": "Warranty Deed", "content": "..." }
  ]
}`;

    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          documents: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                title: { type: 'string' },
                content: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const documents = (r.documents || []).map((d) => ({
      ...d,
      generated_at: new Date().toISOString(),
    }));

    await base44.asServiceRole.entities.SmartContract.update(contract.id, { documents });

    return Response.json({ documents, smart_contract_id: contract.id });
  } catch (error) {
    console.error('generateContractDocuments error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}