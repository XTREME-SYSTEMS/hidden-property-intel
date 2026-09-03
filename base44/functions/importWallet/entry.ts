import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

/**
 * Validates an existing private key and returns the wallet address.
 * Optionally checks balance if an RPC URL is provided.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { private_key, rpc_url } = body;
    if (!private_key) return Response.json({ error: 'private_key required' }, { status: 400 });

    const { ethers } = await import('npm:ethers@6');
    const wallet = new ethers.Wallet(private_key);

    let balance = null, network = null;
    if (rpc_url) {
      try {
        const provider = new ethers.JsonRpcProvider(rpc_url);
        const [bal, net] = await Promise.all([provider.getBalance(wallet.address), provider.getNetwork()]);
        balance = ethers.formatEther(bal);
        network = Number(net.chainId) === 137 ? 'mainnet' : Number(net.chainId) === 80002 ? 'amoy-testnet' : `chain-${net.chainId}`;
      } catch (e) { /* ignore balance check errors */ }
    }

    return Response.json({ address: wallet.address, balance, network });
  } catch (error) {
    return Response.json({ error: 'Invalid private key' }, { status: 400 });
  }
}