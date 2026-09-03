import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

/**
 * Interacts with a deployed smart contract on Polygon — sign as buyer/seller,
 * deposit earnest money, set inspection result, release funds, or refund.
 *
 * Args:
 *   smart_contract_id — the SmartContract record
 *   action            — 'sign_buyer' | 'sign_seller' | 'deposit_earnest' | 'set_inspection' | 'release_funds' | 'refund' | 'get_state'
 *   inspection_passed — boolean (for set_inspection)
 */
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
    if (!rpcUrl || !privateKey) {
      return Response.json({ error: 'Polygon secrets not configured' }, { status: 400 });
    }

    const { ethers } = await import('npm:ethers@6');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    let abi;
    try { abi = JSON.parse(contract.abi); } catch { abi = []; }
    const escrow = new ethers.Contract(contract.contract_address, abi, wallet);

    let tx;
    switch (action) {
      case 'sign_buyer':
        tx = await escrow.signAsBuyer();
        await tx.wait();
        break;
      case 'sign_seller':
        tx = await escrow.signAsSeller();
        await tx.wait();
        break;
      case 'deposit_earnest': {
        const earnestWei = ethers.parseEther(String(contract.terms?.earnest_money || 0));
        tx = await escrow.depositEarnest({ value: earnestWei });
        await tx.wait();
        break;
      }
      case 'set_inspection':
        tx = await escrow.setInspection(inspection_passed ?? true);
        await tx.wait();
        break;
      case 'release_funds':
        tx = await escrow.releaseFunds();
        await tx.wait();
        break;
      case 'refund':
        tx = await escrow.refund();
        await tx.wait();
        break;
      case 'get_state': {
        const [buyer, seller, price, earnest, closing, state, bSigned, sSigned, inspect] = await escrow.getContractState?.() || [];
        const balance = await escrow.getBalance();
        return Response.json({
          buyer, seller, purchasePrice: price?.toString(), earnestMoney: earnest?.toString(),
          closingDate: closing?.toString(), state: Number(state), buyerSigned: bSigned, sellerSigned: sSigned,
          inspectionPassed: inspect, balance: ethers.formatEther(balance),
          explorer: `https://polygonscan.com/address/${contract.contract_address}`,
        });
      }
      default:
        return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }

    // Update contract status based on action
    const statusMap = {
      sign_buyer: 'signed',
      sign_seller: 'signed',
      deposit_earnest: 'funded',
      release_funds: 'closed',
      refund: 'cancelled',
    };
    if (statusMap[action]) {
      await base44.asServiceRole.entities.SmartContract.update(contract.id, { status: statusMap[action] });
    }

    return Response.json({
      action,
      txHash: tx?.hash,
      status: statusMap[action] || 'updated',
      explorer: `https://polygonscan.com/tx/${tx?.hash}`,
    });
  } catch (error) {
    console.error('interactWithContract error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}