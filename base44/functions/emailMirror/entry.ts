import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// Email Mirror — send, read, and mirror the Gmail inbox for
// info@hiddenpropertyintel.com business communications.
//
// Actions:
//   "send"    — send an email through the connected Gmail account
//   "read"    — list recent inbox emails
//   "mirror"  — read inbox and mirror (forward) to a specified address
//   "status" — check Gmail connection status

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'status';

    // Get Gmail connection
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('gmail');
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({
        action: 'status',
        connected: false,
        message: 'Gmail connector not authorized. Authorize it in Settings → Integrations.',
      });
    }

    const authHeader = { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' };

    // ─── STATUS ─────────────────────────────────────────────────
    if (action === 'status') {
      // Get profile
      const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers: authHeader });
      const profile = await profileRes.json();
      return Response.json({
        action: 'status',
        connected: true,
        email: profile.emailAddress,
        messages_total: profile.messagesTotal,
        threads_total: profile.threadsTotal,
        history_id: profile.historyId,
      });
    }

    // ─── SEND ────────────────────────────────────────────────────
    if (action === 'send') {
      const { to, subject, body: textBody, html } = body;
      if (!to || !subject) return Response.json({ error: 'to and subject required' }, { status: 400 });

      const rawMessage = buildRawEmail({ to, from: 'me', subject, body: textBody, html });
      const encoded = btoa(unescape(encodeURIComponent(rawMessage)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ raw: encoded }),
      });

      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: 'Gmail send failed: ' + err }, { status: 500 });
      }

      const data = await res.json();
      return Response.json({ action: 'send', status: 'sent', message_id: data.id, to, subject });
    }

    // ─── READ ────────────────────────────────────────────────────
    if (action === 'read') {
      const maxResults = body.max_results || 20;
      const labelIds = body.label_ids || ['INBOX'];

      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=${labelIds.join(',')}`,
        { headers: authHeader }
      );
      const list = await listRes.json();

      const messages = [];
      for (const msg of (list.messages || []).slice(0, maxResults)) {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
          { headers: authHeader }
        );
        const msgData = await msgRes.json();
        const headers = msgData.payload?.headers || [];
        messages.push({
          id: msgData.id,
          thread_id: msgData.threadId,
          subject: headers.find(h => h.name === 'Subject')?.value,
          from: headers.find(h => h.name === 'From')?.value,
          to: headers.find(h => h.name === 'To')?.value,
          date: headers.find(h => h.name === 'Date')?.value,
          snippet: msgData.snippet,
          unread: (msgData.labelIds || []).includes('UNREAD'),
        });
      }

      return Response.json({ action: 'read', messages, count: messages.length });
    }

    // ─── MIRROR ──────────────────────────────────────────────────
    // Read inbox and forward to a mirror address
    if (action === 'mirror') {
      const mirrorTo = body.mirror_to || 'info@hiddenpropertyintel.com';
      const maxResults = body.max_results || 10;

      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=INBOX`,
        { headers: authHeader }
      );
      const list = await listRes.json();

      let mirrored = 0;
      for (const msg of (list.messages || []).slice(0, maxResults)) {
        // Get full message
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=raw`,
          { headers: authHeader }
        );
        const msgData = await msgRes.json();

        // Forward the message
        const forwardSubject = 'Fwd: ' + (getHeader(msgData, 'Subject') || '(no subject)');
        const forwardBody = `\n\n---------- Forwarded message ----------\nFrom: ${getHeader(msgData, 'From')}\nDate: ${getHeader(msgData, 'Date')}\nSubject: ${getHeader(msgData, 'Subject')}\n\n${msgData.snippet}`;

        const rawMessage = buildRawEmail({ to: mirrorTo, from: 'me', subject: forwardSubject, body: forwardBody });
        const encoded = btoa(unescape(encodeURI(rawMessage)))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: authHeader,
          body: JSON.stringify({ raw: encoded }),
        });
        mirrored++;
      }

      return Response.json({ action: 'mirror', mirrored, mirror_to: mirrorTo });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('emailMirror error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function getHeader(msgData, name) {
  return msgData.payload?.headers?.find(h => h.name === name)?.value;
}

function buildRawEmail({ to, from, subject, body, html }) {
  const boundary = 'boundary_' + crypto.randomUUID();
  const lines = [
    'To: ' + to,
    'From: ' + from,
    'Subject: ' + subject,
    'MIME-Version: 1.0',
  ];

  if (html) {
    lines.push('Content-Type: multipart/alternative; boundary=' + boundary);
    lines.push('');
    lines.push('--' + boundary);
    lines.push('Content-Type: text/plain; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: quoted-printable');
    lines.push('');
    lines.push(body || '');
    lines.push('');
    lines.push('--' + boundary);
    lines.push('Content-Type: text/html; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: quoted-printable');
    lines.push('');
    lines.push(html);
    lines.push('');
    lines.push('--' + boundary + '--');
  } else {
    lines.push('Content-Type: text/plain; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: quoted-printable');
    lines.push('');
    lines.push(body || '');
  }

  return lines.join('\r\n');
}