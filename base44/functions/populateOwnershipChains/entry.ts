import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Populates OwnershipChain records for properties using LLM web search to
 * research public property records and historical transfer data.
 * Processes in batches to stay within serverless time limits.
 * Runs daily via the Daily Maintenance workflow.
 */

const BATCH_SIZE = 5;
const TIME_LIMIT_MS = 250000;

const CHAIN_SCHEMA = {
  type: 'object',
  properties: {
    transfers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          from_owner: { type: 'string' },
          to_owner: { type: 'string' },
          transfer_date: { type: 'string' },
          transfer_type: { type: 'string' },
          sale_price: { type: 'number' },
          source: { type: 'string' }
        }
      }
    }
  }
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Find properties without ownership chains
    const [properties, chains] = await Promise.all([
      base44.asServiceRole.entities.Property.list('-created_date', 500),
      base44.asServiceRole.entities.OwnershipChain.list('-created_date', 500)
    ]);

    const chainPropertyIds = new Set(chains.map(c => c.property_id));
    const needingChains = properties.filter(p =>
      (p.status === 'active' || p.status === 'draft') &&
      !chainPropertyIds.has(p.id) &&
      p.address && p.city && p.state
    );

    const toProcess = needingChains.slice(0, BATCH_SIZE);
    const results = [];
    let populated = 0;
    const startedAt = Date.now();

    for (const p of toProcess) {
      if (Date.now() - startedAt > TIME_LIMIT_MS) break;
      try {
        const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a property records researcher. Search the LIVE web for the ownership / transfer history of this property from public records (county property appraiser, clerk of court, deed records):
${p.address}, ${p.city}, ${p.state} ${p.zip_code || ''}

Return a chronological list of all known ownership transfers (oldest first). For each transfer include: from_owner, to_owner, transfer_date (YYYY-MM-DD or year), transfer_type (e.g. "warranty deed", "quitclaim", "inheritance", "tax deed sale", "foreclosure"), sale_price (number if known), and source (URL or agency name). If no history is findable, return an empty transfers array.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: CHAIN_SCHEMA
        });

        const transfers = (r.transfers || []).filter(t => t.from_owner || t.to_owner);

        await base44.asServiceRole.entities.OwnershipChain.create({
          property_id: p.id,
          transfers: transfers.map(t => ({
            from_owner: t.from_owner || '',
            to_owner: t.to_owner || '',
            transfer_date: t.transfer_date || '',
            transfer_type: t.transfer_type || '',
            sale_price: t.sale_price || null,
            source: t.source || ''
          }))
        });

        populated++;
        results.push({ id: p.id, address: p.address, action: 'populated', transfers: transfers.length });
      } catch (e) {
        console.error('ownership chain failed for', p.id, e?.message);
        results.push({ id: p.id, address: p.address, action: 'error', error: e.message });
      }
    }

    return Response.json({
      needing_chains: needingChains.length,
      processed: toProcess.length,
      populated,
      results
    });
  } catch (error) {
    console.error('populateOwnershipChains error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}