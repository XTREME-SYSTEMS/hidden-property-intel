import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import {
  SEARCH_STRATEGIES, runBrowserSearch, runAICorroboration,
  runBatchSkipTrace, buildSkipTraceEmailReport, SkipTraceResult,
} from '../../shared/skipTraceEngine.ts';

// Advanced Skip Trace — multi-source people location engine.
//
// Actions:
//   "trace"     — skip trace a single owner (by owner_id or name+address)
//   "batch"    — batch process unverified owners (designed for scale)
//   "strategies"— list all search strategies
//
// Results are emailed to info@hiddenpropertyintel.com via the Gmail connector.

const REPORT_TO = 'info@hiddenpropertyintel.com';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'trace';

    // ─── STRATEGIES: list all search strategies ─────────────────
    if (action === 'strategies') {
      return Response.json({
        action: 'strategies',
        strategies: SEARCH_STRATEGIES,
        total: SEARCH_STRATEGIES.length,
      });
    }

    // ─── BATCH: process hundreds of thousands of records ─────────
    if (action === 'batch') {
      const batchSize = body.batch_size || 50;
      const filter = body.filter || { is_verified: false };
      const sendEmail = body.send_email !== false;

      const batchResult = await runBatchSkipTrace(base44, secrets, {
        batch_size: batchSize,
        filter,
        send_email: sendEmail,
      });

      // Email batch summary
      if (sendEmail) {
        await sendEmailReport(base44, {
          subject: `Skip Trace Batch Report — ${batchResult.processed} owners processed`,
          html: buildBatchEmailReport(batchResult),
        });
      }

      return Response.json({ action: 'batch', ...batchResult });
    }

    // ─── TRACE: single owner skip trace ─────────────────────────
    if (action === 'trace') {
      const { owner_id, name, address, entity_type } = body;

      let target = { name, address, entity_type: entity_type || 'individual' };

      // If owner_id provided, load from DB
      if (owner_id) {
        const owners = await base44.asServiceRole.entities.Owner.filter({ id: owner_id });
        const owner = owners[0];
        if (!owner) return Response.json({ error: 'Owner not found' }, { status: 404 });

        let propertyAddress = '';
        if (owner.property_id) {
          const prop = await base44.asServiceRole.entities.Property.get(owner.property_id).catch(() => null);
          if (prop) propertyAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
        }

        target = {
          name: owner.name,
          address: propertyAddress || address || '',
          entity_type: owner.entity_type || 'individual',
        };
      }

      if (!target.name && !target.address) {
        return Response.json({ error: 'Either owner_id or name+address required' }, { status: 400 });
      }

      // Run all browser-based search strategies in parallel
      const browserStrategies = SEARCH_STRATEGIES.filter(s => s.method === 'browser');
      const strategyResults = await Promise.all(
        browserStrategies.map(strategy => runBrowserSearch(strategy, target, secrets))
      );

      // AI corroboration
      const aiResult = await runAICorroboration(target, strategyResults, secrets);

      // Build final result
      const result = {
        target,
        phones: aiResult.phones || [],
        emails: aiResult.emails || [],
        addresses: aiResult.addresses || [],
        relatives: aiResult.relatives || [],
        associates: aiResult.associates || [],
        social_profiles: aiResult.social_profiles || [],
        business_affiliations: aiResult.business_affiliations || [],
        overall_confidence: aiResult.overall_confidence || 0,
        sources_checked: SEARCH_STRATEGIES.map(s => s.name),
        identification_methods: aiResult.identification_methods || [],
        raw_intel: aiResult.executive_summary || '',
        contradictions: aiResult.contradictions || [],
        processed_at: new Date().toISOString(),
      };

      // Update Owner record if owner_id was provided
      if (owner_id) {
        const owners = await base44.asServiceRole.entities.Owner.filter({ id: owner_id });
        if (owners[0]) {
          const update = {
            is_verified: result.overall_confidence >= 50,
            last_identified_at: new Date().toISOString(),
            confidence_score: result.overall_confidence,
            identification_methods: result.identification_methods,
          };
          if (result.phones.length > 0) update.contact_phone = result.phones[0].number;
          if (result.emails.length > 0) update.contact_email = result.emails[0].address;
          if (result.addresses.length > 0) update.contact_address = result.addresses[0].line;
          if (result.relatives.length > 0) {
            update.next_of_kin = result.relatives.map(r => ({
              name: r.name, relationship: r.relationship,
              contact_phone: '', contact_email: '', source: r.source,
            }));
          }
          await base44.asServiceRole.entities.Owner.update(owners[0].id, update);
        }
      }

      // Email the report
      const emailSent = await sendEmailReport(base44, {
        subject: `Skip Trace Report — ${target.name || target.address}`,
        html: buildSkipTraceEmailReport(result),
      });

      return Response.json({
        action: 'trace',
        target,
        result,
        email_sent_to: emailSent ? REPORT_TO : null,
        email_error: emailSent ? null : 'Gmail connector not available or send failed',
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('advancedSkipTrace error', error);
    return Response.json({ error: error.message, stack: error.stack?.slice(0, 500) }, { status: 500 });
  }
}

// ─── Send Email via Gmail Connector ───────────────────────────────────
async function sendEmailReport(base44, { subject, html }) {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Build RFC 2822 message
    const boundary = 'boundary_' + crypto.randomUUID();
    const rawMessage = [
      'To: ' + REPORT_TO,
      'From: me',
      'Subject: ' + subject,
      'MIME-Version: 1.0',
      'Content-Type: multipart/alternative; boundary=' + boundary,
      '',
      '--' + boundary,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      html,
      '',
      '--' + boundary + '--',
    ].join('\r\n');

    // Base64url encode
    const encoded = btoa(unescape(encodeURIComponent(rawMessage)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encoded }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Gmail send error:', err);
      return false;
    }

    return true;
  } catch (e) {
    console.error('sendEmailReport error:', e.message);
    return false;
  }
}

// ─── Batch Email Report ────────────────────────────────────────────────
function buildBatchEmailReport(batchResult) {
  const lines = [];
  lines.push('<div style="font-family: Inter, sans-serif; max-width: 700px; margin: auto; padding: 24px;">');
  lines.push('<div style="background: #0d0d0c; color: #fff; padding: 24px; border-radius: 12px; border: 1px solid #c38a1b;">');
  lines.push('<h1 style="color: #e4b653; font-size: 22px; margin: 0 0 8px;">Skip Trace Batch Report</h1>');
  lines.push('<p style="color: #aaa; font-size: 13px; margin: 0;">Hidden Property Intel · Advanced Skip Trace Engine</p>');
  lines.push('</div>');
  lines.push('<div style="background: #f7f5f0; padding: 20px; border-radius: 0 0 12px 12px; border: 1px solid #e7e1d6; border-top: 0;">');
  lines.push(`<p style="font-size: 14px;"><strong>Processed:</strong> ${batchResult.processed}</p>`);
  lines.push(`<p style="font-size: 12px; color: #247a45;"><strong>Succeeded:</strong> ${batchResult.succeeded}</p>`);
  lines.push(`<p style="font-size: 12px; color: #b33a31;"><strong>Failed:</strong> ${batchResult.failed}</p>`);
  lines.push('<h3 style="font-size: 13px; color: #12110f; margin-top: 16px;">Results</h3>');
  for (const r of (batchResult.results || []).slice(0, 50)) {
    const color = r.status === 'success' ? '#247a45' : '#b33a31';
    lines.push(`<p style="font-size: 11px; margin: 3px 0;"><span style="color: ${color};">●</span> ${r.name || r.owner_id} ${r.confidence ? `(${r.confidence}%)` : ''} ${r.error ? '— ' + r.error : ''}</p>`);
  }
  lines.push('</div></div>');
  return lines.join('\n');
}