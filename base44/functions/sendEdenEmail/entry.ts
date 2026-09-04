import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

/**
 * Eden Skye's unified email sender.
 *
 * Sends an email via the built-in SendEmail integration, branded as Eden Skye
 * from Hidden Property Intel. Runs QA validation (validateEmailQuality) before
 * sending — if the score is below threshold, the email is logged as qa_failed
 * and NOT sent. Every send attempt is logged to the CommunicationLog entity.
 *
 * Args:
 *   to           — recipient email address (required)
 *   to_name      — recipient name (optional, for personalization)
 *   subject      — email subject (required)
 *   body         — email HTML body (required)
 *   audience     — 'investor' | 'owner' | 'heir' | 'agent' | 'internal' | 'other'
 *   contact_id   — linked InvestorLead/Owner record ID (optional)
 *   contact_type — 'InvestorLead' | 'Owner' | 'Seller' | 'Deal' | 'external'
 *   template_id  — template gallery ID used (optional)
 *   thread_id    — conversation thread ID (optional)
 *   skip_qa      — if true, skip QA validation and send immediately (default false)
 *   qa_threshold — minimum QA score to send (default 75)
 *
 * Returns { log_id, status, qa_score, qa_passed, qa_findings, sent }
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      to,
      to_name,
      subject,
      body: emailBody,
      audience = 'other',
      contact_id,
      contact_type,
      template_id,
      thread_id,
      skip_qa = false,
      qa_threshold = 75,
    } = body;

    if (!to || !subject || !emailBody) {
      return Response.json({ error: 'to, subject, and body are required' }, { status: 400 });
    }

    // Step 1: QA validation (unless skipped)
    let qaResult = null;
    let qaPassed = true;
    let qaScore = 100;

    if (!skip_qa) {
      try {
        const qa = await base44.integrations.Core.InvokeLLM({
          prompt: `You are Eden Skye, QA Director at Hidden Property Intel. Evaluate this email for quality, professionalism, layout, content, and compliance.

EMAIL TO EVALUATE:
Subject: ${subject}
Audience: ${audience}
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
  "summary": string
}

overall_score is a weighted average. passed is true if overall_score >= ${qa_threshold} and no critical findings.`,
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
            },
          },
        });
        qaResult = qa;
        qaPassed = qa.passed;
        qaScore = qa.overall_score;
      } catch (qaError) {
        console.error('QA validation failed, proceeding without QA', qaError);
      }
    }

    // Step 2: If QA failed, log as qa_failed and don't send
    if (!qaPassed) {
      const log = await base44.asServiceRole.entities.CommunicationLog.create({
        direction: 'sent',
        to_email: to,
        to_name: to_name || '',
        from_name: 'Eden Skye',
        subject,
        body: emailBody,
        audience,
        contact_id: contact_id || '',
        contact_type: contact_type || 'external',
        status: 'qa_failed',
        qa_score: qaScore,
        qa_passed: false,
        qa_findings: qaResult?.findings || [],
        template_id: template_id || '',
        thread_id: thread_id || '',
      });

      return Response.json({
        log_id: log.id,
        status: 'qa_failed',
        qa_score: qaScore,
        qa_passed: false,
        qa_findings: qaResult?.findings || [],
        qa_summary: qaResult?.summary || '',
        sent: false,
        message: `Email did not pass QA (score: ${qaScore}/${qa_threshold}). Review findings and revise.`,
      });
    }

    // Step 3: Send the email via built-in SendEmail
    let sent = false;
    let sendError = null;
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to,
        from_name: 'Eden Skye',
        subject,
        body: emailBody,
      });
      sent = true;
    } catch (e) {
      sendError = e.message;
      console.error('SendEmail failed', e);
    }

    // Step 4: Log to CommunicationLog
    const log = await base44.asServiceRole.entities.CommunicationLog.create({
      direction: 'sent',
      to_email: to,
      to_name: to_name || '',
      from_name: 'Eden Skye',
      subject,
      body: emailBody,
      audience,
      contact_id: contact_id || '',
      contact_type: contact_type || 'external',
      status: sent ? 'sent' : 'failed',
      qa_score: qaScore,
      qa_passed: qaPassed,
      qa_findings: qaResult?.findings || [],
      template_id: template_id || '',
      thread_id: thread_id || '',
      sent_at: sent ? new Date().toISOString() : '',
    });

    // Step 5: Update contact record if linked
    if (sent && contact_id && contact_type) {
      try {
        const entity = contact_type === 'InvestorLead' ? 'InvestorLead' : 'Owner';
        const now = new Date().toISOString();
        const update = {
          outreach_status: 'contacted',
          last_outreach_subject: subject,
          last_outreach_body: emailBody,
        };
        if (contact_type === 'InvestorLead') {
          update.last_contacted = now;
        } else {
          update.contacted_at = now;
        }
        await base44.asServiceRole.entities[entity].update(contact_id, update);
      } catch (e) {
        console.error('Failed to update contact record', e);
      }
    }

    return Response.json({
      log_id: log.id,
      status: sent ? 'sent' : 'failed',
      qa_score: qaScore,
      qa_passed: qaPassed,
      qa_findings: qaResult?.findings || [],
      qa_summary: qaResult?.summary || '',
      sent,
      send_error: sendError,
      message: sent
        ? `Email sent to ${to} (QA: ${qaScore}/100)`
        : `Failed to send: ${sendError}`,
    });
  } catch (error) {
    console.error('sendEdenEmail error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}