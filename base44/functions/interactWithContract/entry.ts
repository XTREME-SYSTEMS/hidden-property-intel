import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

const STATUS_MAP = { sign_buyer: 'signed', sign_seller: 'signed', deposit_earnest: 'funded', release_funds: 'closed', refund: 'cancelled' };
const DEAL_STAGE_MAP = { signed: 'contract', funded: 'closing', closed: 'exit', cancelled: 'lost' };

const EMAIL_TEMPLATES = {
  sign_buyer: { subject: 'Contract Signed by Buyer', body: (a) => `The buyer has signed the smart contract escrow for ${a}. Awaiting seller signature.` },
  sign_seller: { subject: 'Contract Signed by Seller', body: (a) => `The seller has signed the smart contract escrow for ${a}. The contract is now fully executed — the buyer may deposit earnest money.` },
  deposit_earnest: { subject: 'Earnest Money Deposited', body: (a, t) => `Earnest money has been deposited into the escrow contract for ${a}. Amount: $${t?.earnest_money || 'N/A'}.` },
  release_funds: { subject: 'Escrow Funds Released', body: (a) => `The escrow funds have been released to the seller for ${a}. The transaction is complete.` },
  refund: { subject: 'Escrow Refund Processed', body: (a) => `The escrow funds have been refunded to the buyer for ${a}.` },
};

async function addAuditEntry(base44, contractId, action, actor, details, txHash) {
  const contracts = await base44.asServiceRole.entities.SmartContract.filter({ id: contractId });
  const c = contracts[0]; if (!c) return;
  const auditLog = c.audit_log || [];
  auditLog.push({ action, actor, timestamp: new Date().toISOString(), details, tx_hash: txHash || null });
  await base44.asServiceRole.entities.SmartContract.update(contractId, { audit_log: auditLog });
}

async function notifyParties(base44, contract, action, addr) {
  const tmpl = EMAIL_TEMPLATES[action]; if (!tmpl) return;
  const subject = `${tmpl.subject} — ${addr}`;
  const body = tmpl.body(addr, contract.terms);
  const emails = [];
  if (contract.investor_id) {
    const invs = await base44.asServiceRole.entities.Investor.filter({ user_id: contract.investor_id }).catch(() => []);
    if (invs[0]?.email) emails.push(invs[0].email);
  }
  if (contract.seller_id) {
    const sellers = await base44.asServiceRole.entities.Seller.filter({ user_id: contract.seller_id }).catch(() => []);
    if (sellers[0]?.email) emails.push(sellers[0].email);
  }
  for (const email of emails) {
    await base44.asServiceRole.integrations.Core.SendEmail({ to: email, subject, body }).catch(() => {});
  }
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { smart_contract_id, action, inspection_passed } = body;
    if (!smart_contract_id || !action) return Response.json({ error: 'smart_contract_id and action required' }, { status: 400 });

    const contracts = await base44.asServiceRole.entities.SmartContract.filter({ id: smart_contract_id });
    const contract = contracts[0];
    if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 });
    if (!contract.contract_address) return Response.json({ error: 'Contract not deployed yet' }, { status: 400 });

    const rpcUrl = process.env.POLYGON_RPC_URL;
    const privateKey = process.env.POLYGON_PRIVATE_KEY;
    if (!rpcUrl || !privateKey) return Response.json({ error: 'Polygon secrets not configured' }, { status: 400 });

    const { ethers } = await import('npm:ethers@6');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    let abi; try { abi = JSON.parse(contract.abi); } catch { abi = []; }
    const escrow = new ethers.Contract(contract.contract_address, abi, wallet);

    // Get property address for notifications
    const property = contract.property_id ? await base44.asServiceRole.entities.Property.get(contract.property_id).catch(() => null) : null;
    const addr = property ? `${property.address}, ${property.city}` : 'the property';

    let tx;
    switch (action) {
      case 'sign_buyer': tx = await escrow.signAsBuyer(); await tx.wait(); break;
      case 'sign_seller': tx = await escrow.signAsSeller(); await tx.wait(); break;
      case 'deposit_earnest': {
        const earnestWei = ethers.parseEther(String(contract.terms?.earnest_money || 0));
        tx = await escrow.depositEarnest({ value: earnestWei }); await tx.wait(); break;
      }
      case 'set_inspection': tx = await escrow.setInspection(inspection_passed ?? true); await tx.wait(); break;
      case 'release_funds': tx = await escrow.releaseFunds(); await tx.wait(); break;
      case 'refund': tx = await escrow.refund(); await tx.wait(); break;
      case 'get_state': {
        const result = await escrow.getContractState?.();
        const balance = await escrow.getBalance();
        return Response.json({
          buyer: result?.[0], seller: result?.[1], purchasePrice: result?.[2]?.toString(),
          earnestMoney: result?.[3]?.toString(), closingDate: result?.[4]?.toString(),
          state: Number(result?.[5]), buyerSigned: result?.[6], sellerSigned: result?.[7],
          inspectionPassed: result?.[8], balance: ethers.formatEther(balance),
          explorer: `https://polygonscan.com/address/${contract.contract_address}`,
        });
      }
      default: return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }

    // Update status
    const newStatus = STATUS_MAP[action];
    if (newStatus) {
      await base44.asServiceRole.entities.SmartContract.update(contract.id, { status: newStatus });
    }

    // Audit log
    await addAuditEntry(base44, contract.id, action, user?.email || 'system',
      `${action} executed on-chain. TX: ${tx?.hash}`, tx?.hash);

    // Email notification
    await notifyParties(base44, contract, action, addr);

    // Sync deal stage
    if (contract.deal_id && DEAL_STAGE_MAP[newStatus]) {
      await base44.asServiceRole.entities.Deal.update(contract.deal_id, { stage: DEAL_STAGE_MAP[newStatus] }).catch(() => {});
    }

    return Response.json({
      action, txHash: tx?.hash, status: newStatus || 'updated',
      explorer: `https://polygonscan.com/tx/${tx?.hash}`,
    });
  } catch (error) {
    console.error('interactWithContract error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}