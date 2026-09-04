import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { subject, body: emailBody, audience, template_id } = body;

    if (!emailBody) return Response.json({ error: 'body is required' }, { status: 400 });

    const prompt = `You are Eden Skye, QA Director at Hidden Property Intel. Evaluate this email for quality, professionalism, layout, content, and compliance.

EMAIL TO EVALUATE:
Subject: ${subject || "(no subject)"}
Audience: ${audience || "unknown"}
Body:
${emailBody}

Evaluate across these 6 dimensions, scoring each 0-100:
1. Professionalism — Grammar, tone, formatting, brand consistency.
2. Layout — Visual structure, readability, HTML formatting quality.
3. Content Quality — Specific, valuable, relevant? Clear CTA? No generic filler?
4. Personalization — Uses recipient name? References specific details? Matches their situation?
5. Tone Match — Investors=peer-level/direct, Owners=empathetic, Heirs=gentle/grief-aware, Agents=professional.
6. Compliance — Fair Housing compliant? No discriminatory language? Proper disclosures?

Also evaluate: subject line quality (0-100) and CTA clarity (0-100).

Return JSON:
{
  "overall_score": number,
  "dimension_scores": { "professionalism": number, "layout": number, "content": number, "personalization": number, "tone_match": number, "compliance": number },
  "subject_score": number,
  "cta_score": number,
  "findings": [{ "dimension": string, "severity": string, "finding": string, "recommendation": string }],
  "passed": boolean,
  "summary": string,
  "improved_version": string
}

overall_score is a weighted average. passed is true if overall_score >= 75 and no critical findings. improved_version is the full improved email body, or empty string if already excellent (score >= 90).`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_score: { type: 'number' },
          dimension_scores: {
            type: 'object',
            properties: {
              professionalism: { type: 'number' },
              layout: { type: 'number' },
              content: { type: 'number' },
              personalization: { type: 'number' },
              tone_match: { type: 'number' },
              compliance: { type: 'number' },
            },
          },
          subject_score: { type: 'number' },
          cta_score: { type: 'number' },
          findings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                dimension: { type: 'string' },
                severity: { type: 'string' },
                finding: { type: 'string' },
                recommendation: { type: 'string' },
              },
            },
          },
          passed: { type: 'boolean' },
          summary: { type: 'string' },
          improved_version: { type: 'string' },
        },
      },
    });

    return Response.json({
      template_id,
      audience,
      subject,
      ...response,
    });
  } catch (error) {
    console.error('validateEmailQuality error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}