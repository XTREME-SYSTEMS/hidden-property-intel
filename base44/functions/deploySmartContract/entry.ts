import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { ESCROW_SOURCE } from '../../shared/escrowContract.ts';

/**
 * Compiles the standard escrow contract with solc and deploys it to Polygon
 * using ethers.js. Stores the contract address and tx hash on the record.
 *
 * Args:
 *   smart_contract_id — the SmartContract record to deploy
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

    const rpcUrl = process.env.POLYGON_RPC_URL;
    const privateKey = process.env.POLYGON_PRIVATE_KEY;
    if (!rpcUrl || !privateKey) {
      return Response.json({
        error: 'Polygon secrets not configured. Set POLYGON_RPC_URL and POLYGON_PRIVATE_KEY in Settings → Secrets, then try again.',
      }, { status: 400 });
    }

    // Compile the escrow contract
    const solc = (await import('npm:solc@0.8.20')).default;
    const input = {
      language: 'Solidity',
      sources: { 'RealEstateEscrow.sol': { content: ESCROW_SOURCE } },
      settings: {
        optimizer: { enabled: true, runs: 200 },
        outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
      },
    };
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors?.some((e) => e.severity === 'error')) {
      return Response.json({ error: 'Compilation failed', details: output.errors }, { status: 500 });
    }

    const compiled = output.contracts['RealEstateEscrow.sol']['RealEstateEscrow'];
    const abi = compiled.abi;
    const bytecode = '0x' + compiled.evm.bytecode.object;

    // Connect to Polygon
    const { ethers } = await import('npm:ethers@6');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    if (balance === 0n) {
      return Response.json({
        error: 'Deployer wallet has zero MATIC balance. Fund the wallet with MATIC tokens for gas before deploying.',
        wallet_address: wallet.address,
      }, { status: 400 });
    }

    // Prepare constructor args
    const terms = contract.terms || {};
    const buyerAddr = terms.buyer_address || wallet.address;
    const sellerAddr = terms.seller_address || wallet.address;
    const priceWei = ethers.parseEther(String(terms.price || 0));
    const earnestWei = ethers.parseEther(String(terms.earnest_money || 0));
    const closingTs = terms.closing_date
      ? Math.floor(new Date(terms.closing_date).getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 30 * 86400;

    // Deploy
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const deployed = await factory.deploy(buyerAddr, sellerAddr, priceWei, earnestWei, closingTs);
    await deployed.waitForDeployment();

    const address = await deployed.getAddress();
    const txHash = deployed.deploymentTransaction().hash;

    await base44.asServiceRole.entities.SmartContract.update(contract.id, {
      status: 'deployed',
      contract_address: address,
      deploy_tx_hash: txHash,
      abi: JSON.stringify(abi),
      source_code: ESCROW_SOURCE,
    });

    return Response.json({
      address,
      txHash,
      status: 'deployed',
      network: Number((await provider.getNetwork()).chainId) === 137 ? 'mainnet' : 'testnet',
      explorer: `https://polygonscan.com/address/${address}`,
    });
  } catch (error) {
    console.error('deploySmartContract error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}