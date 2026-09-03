import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { contract_id } = body;
    if (!contract_id) return Response.json({ error: 'contract_id required' }, { status: 400 });

    const contract = await base44.entities.SmartContract.get(contract_id);
    if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 });

    const sourceCode = contract.source_code || '';
    if (!sourceCode) return Response.json({ error: 'No source code available for audit' }, { status: 400 });

    const prompt = `You are a smart contract security auditor. Analyze this Solidity smart contract for security vulnerabilities.

Contract Details:
- Type: ${contract.contract_type}
- Blockchain: ${contract.blockchain}
- Status: ${contract.status}
- Contract Address: ${contract.contract_address || 'Not deployed yet'}

Source Code:
${sourceCode}

Check for these vulnerability categories:
1. REENTRANCY — external calls that could re-enter the contract
2. INTEGER OVERFLOW/UNDERFLOW — unchecked arithmetic
3. ACCESS CONTROL — missing or improper modifier checks
4. UNCHECKED CALLS — return values not checked
5. TIMESTAMP DEPENDENCE — relying on block.timestamp for logic
6. REENTRANCY GUARDS — missing or improper guards
7. STATE VARIABLE VISIBILITY — public vs private concerns
8. DENIAL OF SERVICE — gas limit issues, unbounded loops
9. FRONT-RUNNING — transaction ordering dependence
10. CENTRALIZATION RISK — single point of failure

For each finding:
- Severity: Critical, High, Medium, Low, Informational
- Description of the vulnerability
- Line number or function affected
- Recommended fix

If no vulnerabilities found, return an empty findings array and a security score of 100.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          security_score: { type: "number" },
          overall_risk: { type: "string" },
          findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                severity: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                recommendation: { type: "string" }
              }
            }
          },
          summary: { type: "string" },
          deployment_ready: { type: "boolean" }
        }
      }
    });

    if (contract.audit_log) {
      await base44.asServiceRole.entities.SmartContract.update(contract.id, {
        audit_log: [...(contract.audit_log || []), {
          action: 'security_audit',
          actor: user.email,
          timestamp: new Date().toISOString(),
          details: `Security score: ${result.security_score}/100, Findings: ${result.findings?.length || 0}`,
        }],
      });
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}