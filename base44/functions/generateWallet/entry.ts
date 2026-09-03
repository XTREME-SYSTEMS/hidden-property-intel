import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

/**
 * Generates a new random Polygon/Ethereum wallet.
 * Returns address, private key, and mnemonic phrase.
 * The caller must save the private key to Settings → Secrets as POLYGON_PRIVATE_KEY.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const { ethers } = await import('npm:ethers@6');
    const wallet = ethers.Wallet.createRandom();

    return Response.json({
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase || null,
    });
  } catch (error) {
    console.error('generateWallet error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}