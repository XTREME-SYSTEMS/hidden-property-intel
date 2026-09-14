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

async function requireApprovedAction(base44, reviewId, expectedActionId) {
  if (!reviewId) return { ok: false, reason: 'approval_id required' };
  const reviews = await base44.asServiceRole.entities.GovernanceReview.filter({ review_id: reviewId }).catch(() => []);
  const review = reviews[0];
  if (!review) return { ok: false, reason: 'approval receipt not found' };
  if (review.decision !== 'approved') return { ok: false, reason: `approval decision is ${review.decision || 'unknown'}` };
  if (review.action_id !== expectedActionId) return { ok: false, reason: 'approval is not bound to this exact action' };
  return { ok: true, review };
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
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { smart_contract_id, estimate_only, approval_id, notify_parties, message_approval_id } = body;
    if (!smart_contract_id || typeof smart_contract_id !== 'string') {
      return Response.json({ error: 'smart_contract_id required' }, { status: 400 });
    }
    if (estimate_only !== undefined && typeof estimate_only !== 'boolean') {
      return Response.json({ error: 'estimate_only must be boolean' }, { status: 400 });
    }
    if (notify_parties !== undefined && typeof notify_parties !== 'boolean') {
      return Response.json({ error: 'notify_parties must be boolean' }, { status: 400 });
    }

    const contracts = await base44.asServiceRole.entities.SmartContract.filter({ id: smart_contract_id });
    const contract = contracts[0];
    if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 });

    const rpcUrl = process.env.POLYGON_RPC_URL;
    const privateKey = process.env.POLYGON_PRIVATE_KEY;
    if (!rpcUrl || !privateKey) {
      return Response.json({ error: 'Polygon deployment is not configured.' }, { status: 400 });
    }

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
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    const balance = await provider.getBalance(wallet.address);
    if (balance === 0n) {
      return Response.json({ error: 'Deployer wallet has zero gas balance.', wallet_address: wallet.address }, { status: 400 });
    }

    const terms = contract.terms || {};
    const buyerAddr = terms.buyer_address || wallet.address;
    const sellerAddr = terms.seller_address || wallet.address;
    const priceWei = ethers.parseEther(String(terms.price || 0));
    const earnestWei = ethers.parseEther(String(terms.earnest_money || 0));
    const closingTs = terms.closing_date ? Math.floor(new Date(terms.closing_date).getTime() / 1000) : Math.floor(Date.now() / 1000) + 30 * 86400;

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);

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
          chain_id: chainId,
          execution: 'estimate_only',
        });
      } catch (e) {
        return Response.json({ error: 'Gas estimation failed: ' + e.message }, { status: 500 });
      }
    }

    const deployActionId = `contract.deploy:${contract.id}:chain:${chainId}`;
    const deployApproval = await requireApprovedAction(base44, approval_id, deployActionId);
    if (!deployApproval.ok) {
      return Response.json({ error: 'Explicit live-contract approval required', action_id: deployActionId, reason: deployApproval.reason }, { status: 403 });
    }

    const deployed = await factory.deploy(buyerAddr, sellerAddr, priceWei, earnestWei, closingTs);
    await deployed.waitForDeployment();
    const address = await deployed.getAddress();
    const txHash = deployed.deploymentTransaction().hash;
    const receipt = await deployed.deploymentTransaction().wait();

    await base44.asServiceRole.entities.SmartContract.update(contract.id, {
      status: 'deployed', contract_address: address, deploy_tx_hash: txHash,
      abi: JSON.stringify(abi), source_code: ESCROW_SOURCE,
    });

    await addAuditEntry(base44, contract.id, 'deploy', user.email,
      `Approved deployment to chain ${chainId} at ${address}. Approval: ${approval_id}.`, txHash);

    let notification = 'not_requested';
    if (notify_parties === true) {
      const messageActionId = `contract.notify:${contract.id}`;
      const messageApproval = await requireApprovedAction(base44, message_approval_id, messageActionId);
      if (!messageApproval.ok) {
        notification = 'blocked_missing_message_approval';
      } else {
        const property = contract.property_id ? await base44.asServiceRole.entities.Property.get(contract.property_id).catch(() => null) : null;
        const addr = property ? `${property.address}, ${property.city}` : 'your property';
        await notifyParties(base44, contract,
          `Smart Contract Deployed — ${addr}`,
          `A smart contract escrow has been deployed for ${addr}.\n\nContract address: ${address}\nTransaction: https://polygonscan.com/tx/${txHash}\n\nPlease review the contract in the Hidden Property Intel portal.`);
        notification = 'sent_with_separate_approval';
      }
    }

    return Response.json({
      address, txHash, status: 'deployed',
      gas_used: receipt?.gasUsed?.toString(),
      gas_cost_matic: receipt ? ethers.formatEther(receipt.gasPrice * receipt.gasUsed) : null,
      network: chainId === 137 ? 'mainnet' : 'testnet',
      chain_id: chainId,
      approval_id,
      notification,
      explorer: `https://polygonscan.com/address/${address}`,
    });
  } catch (error) {
    console.error('deploySmartContract error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
