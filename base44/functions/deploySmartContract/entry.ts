import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { ESCROW_SOURCE } from '../../shared/escrowContract.ts';

async function addAuditEntry(base44, contractId, action, actor, details, txHash) {
  const contracts = await base44.asServiceRole.entities.SmartContract.filter({ id: contractId });
  const c = contracts[0];
  if (!c) return;
  const auditLog = c.audit_log || [];
  auditLog.push({ action, actor, timestamp: new Date().toISOString(), details, tx_hash: txHash || null });
  await base44.asServiceRole.entities.SmartContract.update(contractId, { audit_log: auditLog });
}

async function notifyParties(base44, contract, subject, body) {
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
    const { smart_contract_id, estimate_only } = body;
    if (!smart_contract_id) return Response.json({ error: 'smart_contract_id required' }, { status: 400 });

    const contracts = await base44.asServiceRole.entities.SmartContract.filter({ id: smart_contract_id });
    const contract = contracts[0];
    if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 });

    const rpcUrl = process.env.POLYGON_RPC_URL;
    const privateKey = process.env.POLYGON_PRIVATE_KEY;
    if (!rpcUrl || !privateKey) {
      return Response.json({ error: 'Polygon secrets not configured. Set POLYGON_RPC_URL and POLYGON_PRIVATE_KEY in Settings → Secrets.' }, { status: 400 });
    }

    // Compile
    const solc = (await import('npm:solc@0.8.20')).default;
    const input = {
      language: 'Solidity',
      sources: { 'RealEstateEscrow.sol': { content: ESCROW_SOURCE } },
      settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } },
    };
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    if (output.errors?.some((e) => e.severity === 'error')) {
      return Response.json({ error: 'Compilation failed', details: output.errors }, { status: 500 });
    }
    const compiled = output.contracts['RealEstateEscrow.sol']['RealEstateEscrow'];
    const abi = compiled.abi;
    const bytecode = '0x' + compiled.evm.bytecode.object;

    const { ethers } = await import('npm:ethers@6');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const balance = await provider.getBalance(wallet.address);
    if (balance === 0n) {
      return Response.json({ error: 'Deployer wallet has zero MATIC. Fund the wallet for gas.', wallet_address: wallet.address }, { status: 400 });
    }

    const terms = contract.terms || {};
    const buyerAddr = terms.buyer_address || wallet.address;
    const sellerAddr = terms.seller_address || wallet.address;
    const priceWei = ethers.parseEther(String(terms.price || 0));
    const earnestWei = ethers.parseEther(String(terms.earnest_money || 0));
    const closingTs = terms.closing_date ? Math.floor(new Date(terms.closing_date).getTime() / 1000) : Math.floor(Date.now() / 1000) + 30 * 86400;

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);

    // Gas estimation mode — return cost without deploying
    if (estimate_only) {
      try {
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || feeData.maxFeePerGas || 0n;
        const estimatedGas = await factory.deploy.estimateGas(buyerAddr, sellerAddr, priceWei, earnestWei, closingTs);
        return Response.json({
          estimated_gas: estimatedGas.toString(),
          gas_price_gwei: ethers.formatUnits(gasPrice, 'gwei'),
          estimated_cost_matic: ethers.formatEther(gasPrice * estimatedGas),
          wallet_balance: ethers.formatEther(balance),
        });
      } catch (e) {
        return Response.json({ error: 'Gas estimation failed: ' + e.message }, { status: 500 });
      }
    }

    // Deploy
    const deployed = await factory.deploy(buyerAddr, sellerAddr, priceWei, earnestWei, closingTs);
    await deployed.waitForDeployment();
    const address = await deployed.getAddress();
    const txHash = deployed.deploymentTransaction().hash;
    const receipt = await deployed.deploymentTransaction().wait();
    const network = await provider.getNetwork();

    await base44.asServiceRole.entities.SmartContract.update(contract.id, {
      status: 'deployed', contract_address: address, deploy_tx_hash: txHash,
      abi: JSON.stringify(abi), source_code: ESCROW_SOURCE,
    });

    // Audit log
    await addAuditEntry(base44, contract.id, 'deploy', user?.email || 'system',
      `Deployed to Polygon at ${address}. Gas used: ${receipt?.gasUsed?.toString() || 'unknown'}.`, txHash);

    // Email notification
    const property = contract.property_id ? await base44.asServiceRole.entities.Property.get(contract.property_id).catch(() => null) : null;
    const addr = property ? `${property.address}, ${property.city}` : 'your property';
    await notifyParties(base44, contract,
      `Smart Contract Deployed — ${addr}`,
      `A smart contract escrow has been deployed to the Polygon blockchain for ${addr}.\n\nContract address: ${address}\nTransaction: https://polygonscan.com/tx/${txHash}\n\nPlease review and sign the contract in the Hidden Property Intel portal.`);

    return Response.json({
      address, txHash, status: 'deployed',
      gas_used: receipt?.gasUsed?.toString(),
      gas_cost_matic: receipt ? ethers.formatEther(receipt.gasPrice * receipt.gasUsed) : null,
      network: Number(network.chainId) === 137 ? 'mainnet' : 'testnet',
      explorer: `https://polygonscan.com/address/${address}`,
    });
  } catch (error) {
    console.error('deploySmartContract error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}