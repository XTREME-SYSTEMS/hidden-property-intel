import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { content, content_type = 'email' } = body;

    if (!content) return Response.json({ error: 'content required' }, { status: 400 });

    const prompt = `You are a fair housing compliance auditor. Analyze the following ${content_type} for potential fair housing violations. The Fair Housing Act prohibits discrimination based on: race, color, religion, national origin, sex, familial status, and disability.

Content to audit:
"""
${content}
"""

For each potential violation found:
1. Identify the specific phrase or language that is problematic
2. Explain why it violates fair housing law
3. Cite the protected class involved
4. Suggest a compliant alternative

Also check for:
- Steering language (directing to specific neighborhoods based on demographics)
- Exclusionary language ("perfect for... [demographic]")
- Discriminatory preference language
- Accessibility-related issues

If no violations are found, return an empty violations array and a compliance score of 100.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          compliance_score: { type: "number" },
          violations_found: { type: "boolean" },
          violations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phrase: { type: "string" },
                protected_class: { type: "string" },
                explanation: { type: "string" },
                severity: { type: "string" },
                compliant_alternative: { type: "string" }
              }
            }
          },
          overall_assessment: { type: "string" }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}