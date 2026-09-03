import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

/**
 * Batch-syncs all deployed contracts' on-chain state back to the database.
 * Reads the contract state from Polygon and updates the SmartContract status
 * if it differs from the chain. Also syncs linked deal stages.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const rpcUrl = process.env.POLYGON_RPC_URL;
    const privateKey = process.env.POLYGON_PRIVATE_KEY;
    if (!rpcUrl || !privateKey) return Response.json({ error: 'Polygon secrets not configured' }, { status: 400 });

    const contracts = await base44.asServiceRole.entities.SmartContract.filter({
      status: { $in: ['deployed', 'signed', 'funded'] }
    });

    const { ethers } = await import('npm:ethers@6');
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const STATE_TO_STATUS = ['deployed', 'signed', 'funded', 'closed', 'cancelled'];
    const DEAL_STAGE_MAP = { signed: 'contract', funded: 'closing', closed: 'exit', cancelled: 'lost' };

    let synced = 0, unchanged = 0, errors = 0;
    const results = [];

    for (const contract of contracts) {
      if (!contract.contract_address) { errors++; continue; }
      try {
        let abi; try { abi = JSON.parse(contract.abi); } catch { abi = []; }
        const escrow = new ethers.Contract(contract.contract_address, abi, provider);
        const stateResult = await escrow.getContractState?.();
        const stateIdx = Number(stateResult?.[5]);
        const newStatus = STATE_TO_STATUS[stateIdx] || contract.status;

        if (newStatus !== contract.status) {
          await base44.asServiceRole.entities.SmartContract.update(contract.id, { status: newStatus });
          // Sync deal
          if (contract.deal_id && DEAL_STAGE_MAP[newStatus]) {
            await base44.asServiceRole.entities.Deal.update(contract.deal_id, { stage: DEAL_STAGE_MAP[newStatus] }).catch(() => {});
          }
          // Audit log
          const auditLog = contract.audit_log || [];
          auditLog.push({ action: 'chain_sync', actor: 'system', timestamp: new Date().toISOString(), details: `Status auto-synced from chain: ${contract.status} → ${newStatus}` });
          await base44.asServiceRole.entities.SmartContract.update(contract.id, { audit_log: auditLog });
          synced++;
          results.push({ id: contract.id, old: contract.status, new: newStatus });
        } else {
          unchanged++;
        }
      } catch (e) {
        errors++;
        results.push({ id: contract.id, error: e.message });
      }
    }

    return Response.json({ synced, unchanged, errors, total: contracts.length, results });
  } catch (error) {
    console.error('syncAllContractStates error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}