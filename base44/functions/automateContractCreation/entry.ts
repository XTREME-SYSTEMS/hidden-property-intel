import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

/**
 * Automatically creates smart contracts for deals that have reached the
 * "contract" stage but don't yet have a linked SmartContract record.
 * Uses the deal's acquisition_price as the purchase price.
 *
 * Returns { created, skipped, errors }.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    // Find deals at "contract" stage
    const deals = await base44.asServiceRole.entities.Deal.list('-created_date', 200);
    const contractStageDeals = deals.filter((d) => d.stage === 'contract');

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const deal of contractStageDeals) {
      // Check if a smart contract already exists for this deal
      const existing = await base44.asServiceRole.entities.SmartContract.filter({ deal_id: deal.id });
      if (existing.length > 0) { skipped++; continue; }

      // Need property_id
      if (!deal.property_id) { errors++; continue; }

      const property = await base44.asServiceRole.entities.Property.get(deal.property_id).catch(() => null);
      if (!property) { errors++; continue; }

      // Find investor and seller
      const investorId = deal.user_id;
      const sellerId = property.seller_id || deal.user_id; // fallback to deal owner if no seller linked

      if (!investorId || !sellerId) { errors++; continue; }

      const price = deal.acquisition_price || property.estimated_value || 0;
      const earnest = Math.round(price * 0.03); // 3% earnest money default
      const closingDate = deal.target_close_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

      try {
        await base44.asServiceRole.entities.SmartContract.create({
          property_id: deal.property_id,
          investor_id: investorId,
          seller_id: sellerId,
          deal_id: deal.id,
          contract_type: 'escrow',
          terms: {
            price,
            earnest_money: earnest,
            closing_date: closingDate,
            contingencies: ['Inspection', 'Financing', 'Title'],
          },
          blockchain: 'polygon',
          status: 'draft',
        });
        created++;
      } catch (e) {
        console.error('auto-create contract failed for deal', deal.id, e?.message);
        errors++;
      }
    }

    return Response.json({ created, skipped, errors, total_deals_checked: contractStageDeals.length });
  } catch (error) {
    console.error('automateContractCreation error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}