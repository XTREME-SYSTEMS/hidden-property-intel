import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

interface ValidateEmailPayload {
  subject?: string;
  body: string;
  audience?: "investor" | "seller" | "owner" | "heir" | "agent" | "internal" | "social";
  template_id?: string;
}

export default async function validateEmailQuality({ subject, body, audience, template_id }: ValidateEmailPayload, req: Request) {
  const base44 = createClientFromRequest(req);

  const prompt = `You are Eden Skye, QA Director at Hidden Property Intel. Evaluate this email for quality, professionalism, layout, content, and compliance.

EMAIL TO EVALUATE:
Subject: ${subject || "(no subject)"}
Audience: ${audience || "unknown"}
Body:
${body}

Evaluate across these 6 dimensions, scoring each 0-100:

1. **Professionalism** — Grammar, tone, formatting, brand consistency. Is it polished and professional?
2. **Layout** — Visual structure, readability, use of headers/spacing, mobile-friendliness, HTML formatting quality.
3. **Content Quality** — Is the content specific, valuable, and relevant? Does it avoid generic filler? Is the CTA clear?
4. **Personalization** — Does it feel personal to the recipient? Uses their name, references specific details, matches their situation?
5. **Tone Match** — Does the tone match the audience? (Investors=peer-level/direct, Owners=empathetic, Heirs=gentle/grief-aware, Agents=professional)
6. **Compliance** — Fair Housing compliant? No discriminatory language? Proper disclosures? RESPA-compliant if transactional?

Also check for:
- Subject line quality (compelling but not clickbait, specific, relevant)
- CTA clarity (single, clear, low-friction call to action)
- Signature presence (should be signed by Eden Skye, Hidden Property Intel)
- Brand consistency (Hidden Property Intel branding, gold/black aesthetic)
- Length appropriateness (not too long, not too short for the audience)

Return a JSON object with:
{
  "overall_score": number (0-100, weighted average),
  "dimension_scores": { professionalism, layout, content, personalization, tone_match, compliance },
  "subject_score": number (0-100),
  "cta_score": number (0-100),
  "findings": [{ "dimension": string, "severity": "critical"|"high"|"medium"|"low"|"info", "finding": string, "recommendation": string }],
  "passed": boolean (true if overall_score >= 75 AND no critical findings),
  "summary": string (2-3 sentence summary of the evaluation),
  "improved_version": string (the full improved email body if score < 90, or null if already excellent)
}`;

  const response = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        overall_score: { type: "number" },
        dimension_scores: {
          type: "object",
          properties: {
            professionalism: { type: "number" },
            layout: { type: "number" },
            content: { type: "number" },
            personalization: { type: "number" },
            tone_match: { type: "number" },
            compliance: { type: "number" },
          },
        },
        subject_score: { type: "number" },
        cta_score: { type: "number" },
        findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              dimension: { type: "string" },
              severity: { type: "string" },
              finding: { type: "string" },
              recommendation: { type: "string" },
            },
          },
        },
        passed: { type: "boolean" },
        summary: { type: "string" },
        improved_version: { type: "string" },
      },
    },
  });

  return {
    template_id,
    audience,
    subject,
    ...response,
  };
}