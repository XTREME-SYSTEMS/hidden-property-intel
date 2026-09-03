import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

/**
 * Returns all smart contracts with linked property/investor/seller/deal data,
 * plus the deployer wallet status (address, balance, network) and aggregate stats.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const contracts = await base44.asServiceRole.entities.SmartContract.list('-created_date', 200);

    // Collect IDs for batch loading
    const propIds = [...new Set(contracts.map((c) => c.property_id).filter(Boolean))];
    const invIds = [...new Set(contracts.map((c) => c.investor_id).filter(Boolean))];
    const sellerIds = [...new Set(contracts.map((c) => c.seller_id).filter(Boolean))];
    const dealIds = [...new Set(contracts.map((c) => c.deal_id).filter(Boolean))];

    const [props, invs, sellers, deals] = await Promise.all([
      Promise.all(propIds.map((id) => base44.asServiceRole.entities.Property.get(id).catch(() => null))),
      Promise.all(invIds.map((id) => base44.asServiceRole.entities.Investor.filter({ user_id: id }).catch(() => []))),
      Promise.all(sellerIds.map((id) => base44.asServiceRole.entities.Seller.filter({ user_id: id }).catch(() => []))),
      Promise.all(dealIds.map((id) => base44.asServiceRole.entities.Deal.get(id).catch(() => null))),
    ]);

    const propMap = {};
    props.forEach((p) => { if (p) propMap[p.id] = p; });
    const invMap = {};
    invs.forEach((arr) => { if (arr[0]) invMap[arr[0].user_id] = arr[0]; });
    const sellerMap = {};
    sellers.forEach((arr) => { if (arr[0]) sellerMap[arr[0].user_id] = arr[0]; });
    const dealMap = {};
    deals.forEach((d) => { if (d) dealMap[d.id] = d; });

    const enriched = contracts.map((c) => ({
      ...c,
      property: propMap[c.property_id] || null,
      investor: invMap[c.investor_id] || null,
      seller: sellerMap[c.seller_id] || null,
      deal: dealMap[c.deal_id] || null,
    }));

    const stats = {
      total: contracts.length,
      draft: contracts.filter((c) => c.status === 'draft').length,
      deployed: contracts.filter((c) => c.status === 'deployed').length,
      signed: contracts.filter((c) => c.status === 'signed').length,
      funded: contracts.filter((c) => c.status === 'funded').length,
      closed: contracts.filter((c) => c.status === 'closed').length,
    };

    // Wallet status
    let walletStatus = { configured: false };
    const rpcUrl = process.env.POLYGON_RPC_URL;
    const privateKey = process.env.POLYGON_PRIVATE_KEY;
    if (rpcUrl && privateKey) {
      try {
        const { ethers } = await import('npm:ethers@6');
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        const [balance, network] = await Promise.all([
          provider.getBalance(wallet.address),
          provider.getNetwork(),
        ]);
        walletStatus = {
          configured: true,
          address: wallet.address,
          balance: ethers.formatEther(balance),
          network: network.name || (Number(network.chainId) === 137 ? 'mainnet' : Number(network.chainId) === 80002 ? 'amoy-testnet' : `chain-${network.chainId}`),
          chainId: Number(network.chainId),
        };
      } catch (e) {
        walletStatus = { configured: true, error: e.message };
      }
    }

    return Response.json({ contracts: enriched, stats, walletStatus });
  } catch (error) {
    console.error('getSmartContractDashboard error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}