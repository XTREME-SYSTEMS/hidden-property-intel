import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { TOOL_CATEGORIES, ALL_TOOLS, getToolById } from '../../shared/agentToolRegistry.ts';

// Agent Tool Generator — the central tool registry and executor for the
// digital workforce. Returns the full tool catalog, or executes a specific
// tool on behalf of a digital agent.
//
// Actions:
//   "list"     — return the full tool catalog (default)
//   "execute"  — execute a specific tool by id with provided inputs

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    // ─── LIST: return full tool catalog ─────────────────────────
    if (action === 'list') {
      return Response.json({
        source: 'agent_tool_generator',
        action: 'list',
        categories: TOOL_CATEGORIES,
        total_tools: ALL_TOOLS.length,
        summary: {
          google_workspace: TOOL_CATEGORIES[0].tools.length,
          daily_business: TOOL_CATEGORIES[1].tools.length,
          web_accounts: TOOL_CATEGORIES[2].tools.length,
          crypto: TOOL_CATEGORIES[3].tools.length,
          media: TOOL_CATEGORIES[4].tools.length,
        },
      });
    }

    // ─── EXECUTE: run a specific tool ───────────────────────────
    if (action === 'execute') {
      const toolId = body.tool_id;
      const inputs = body.inputs || {};
      const tool = getToolById(toolId);

      if (!tool) {
        return Response.json({ error: `Tool "${toolId}" not found in registry` }, { status: 404 });
      }

      let result;

      switch (tool.method) {
        // ── Connector-based tools (Google Workspace, HubSpot) ──
        case 'connector': {
          try {
            const { accessToken } = await base44.asServiceRole.connectors.getConnection(tool.connector);
            result = await executeConnectorTool(tool, inputs, accessToken);
          } catch (e) {
            result = { status: 'error', message: `Connector "${tool.connector}" not authorized: ${e.message}`, needs_auth: true };
          }
          break;
        }

        // ── Backend function tools ──
        case 'function': {
          const fnResult = await base44.functions.invoke(tool.function, inputs);
          result = { status: 'success', tool: tool.function, output: fnResult.data || fnResult };
          break;
        }

        // ── Browser engine tools (web account creation) ──
        case 'browser': {
          result = await executeBrowserTool(tool, inputs, secrets);
          break;
        }

        // ── AI Gateway image generation ──
        case 'gateway_image': {
          result = await executeImageGeneration(tool, inputs, secrets);
          break;
        }

        // ── AI Gateway reasoning / web search ──
        case 'gateway': {
          result = await executeGatewayTool(tool, inputs, secrets);
          break;
        }

        // ── Platform integration (SendEmail, etc.) ──
        case 'integration': {
          try {
            if (tool.integration === 'SendEmail') {
              const res = await base44.integrations.Core.SendEmail(inputs);
              result = { status: 'success', output: res };
            } else {
              result = { status: 'error', message: `Unknown integration: ${tool.integration}` };
            }
          } catch (e) {
            result = { status: 'error', message: e.message, credits_exhausted: true };
          }
          break;
        }

        default:
          result = { status: 'error', message: `Unknown method: ${tool.method}` };
      }

      return Response.json({
        source: 'agent_tool_generator',
        action: 'execute',
        tool_id: toolId,
        tool_name: tool.name,
        category: tool.category,
        result,
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('agentToolGenerator error', error);
    return Response.json({ error: error.message, stack: error.stack?.slice(0, 500) }, { status: 500 });
  }
}

// ─── Connector Tool Executor ─────────────────────────────────────────
async function executeConnectorTool(tool, inputs, accessToken) {
  const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  switch (tool.id) {
    // Google Calendar
    case 'gcal_list': {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=${inputs.max_results || 10}&timeMin=${new Date().toISOString()}`,
        { headers: authHeader }
      );
      const data = await res.json();
      return { status: 'success', events: data.items || [] };
    }
    case 'gcal_create': {
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          summary: inputs.summary,
          start: { dateTime: inputs.start_time },
          end: { dateTime: inputs.end_time },
          description: inputs.description || '',
        }),
      });
      const data = await res.json();
      return { status: 'success', event: data };
    }

    // Google Sheets
    case 'gsheets_read': {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${inputs.spreadsheet_id}/values/${inputs.range || 'A1:Z1000'}`,
        { headers: authHeader }
      );
      const data = await res.json();
      return { status: 'success', values: data.values || [] };
    }
    case 'gsheets_write': {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${inputs.spreadsheet_id}/values/${inputs.range}?valueInputOption=RAW`,
        { method: 'PUT', headers: authHeader, body: JSON.stringify({ values: inputs.values }) }
      );
      const data = await res.json();
      return { status: 'success', updated: data };
    }

    // Gmail
    case 'gmail_send': {
      const email = [
        `To: ${inputs.to}`,
        `Subject: ${inputs.subject}`,
        '',
        inputs.body || '',
      ].join('\r\n');
      const encoded = btoa(email).replace(/\+/g, '-').replace(/\//g, '_');
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ raw: encoded }),
      });
      const data = await res.json();
      return { status: 'success', message_id: data.id };
    }
    case 'gmail_read': {
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${inputs.max_results || 10}`,
        { headers: authHeader }
      );
      const list = await listRes.json();
      const messages = [];
      for (const msg of (list.messages || []).slice(0, 5)) {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
          { headers: authHeader }
        );
        const msgData = await msgRes.json();
        messages.push({
          id: msgData.id,
          subject: msgData.payload?.headers?.find(h => h.name === 'Subject')?.value,
          from: msgData.payload?.headers?.find(h => h.name === 'From')?.value,
        });
      }
      return { status: 'success', messages };
    }

    // Google Drive
    case 'gdrive_list': {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(inputs.query || '')}&pageSize=${inputs.max_results || 10}`,
        { headers: authHeader }
      );
      const data = await res.json();
      return { status: 'success', files: data.files || [] };
    }

    // Google Docs
    case 'gdocs_create': {
      const res = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ title: inputs.title }),
      });
      const doc = await res.json();
      return { status: 'success', document_id: doc.documentId };
    }

    // Google Tasks
    case 'gtasks_list': {
      const res = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${inputs.tasklist_id || '@default'}/tasks`,
        { headers: authHeader }
      );
      const data = await res.json();
      return { status: 'success', tasks: data.items || [] };
    }
    case 'gtasks_create': {
      const res = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks`,
        { method: 'POST', headers: authHeader, body: JSON.stringify({ title: inputs.title, notes: inputs.notes, due: inputs.due_date }) }
      );
      const data = await res.json();
      return { status: 'success', task: data };
    }

    default:
      return { status: 'error', message: `Connector tool "${tool.id}" not implemented` };
  }
}

// ─── Browser Engine Executor (web account creation) ──────────────────
async function executeBrowserTool(tool, inputs, secrets) {
  const browserUrl = secrets.get('BROWSER_ENGINE_URL');
  const browserKey = secrets.get('BROWSER_ENGINE_API_KEY');

  if (!browserUrl || !browserKey) {
    return { status: 'error', message: 'Browser engine not configured (BROWSER_ENGINE_URL / BROWSER_ENGINE_API_KEY missing)' };
  }

  // Build the browser automation task
  const task = {
    tool_id: tool.id,
    tool_name: tool.name,
    inputs,
    instructions: buildBrowserInstructions(tool, inputs),
    created_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${browserUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${browserKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create_account',
        target_url: inputs.url || getTargetUrl(tool, inputs),
        task,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { status: 'error', message: `Browser engine error: ${res.status} ${errText}` };
    }

    const data = await res.json();
    return {
      status: 'success',
      tool: tool.name,
      session_id: data.session_id || data.id,
      message: `Account creation task initiated for ${tool.name}`,
      details: data,
    };
  } catch (e) {
    return { status: 'error', message: `Browser engine request failed: ${e.message}` };
  }
}

function getTargetUrl(tool, inputs) {
  const urlMap = {
    create_facebook_page: 'https://www.facebook.com/pages/creation/',
    create_instagram_account: 'https://www.instagram.com/accounts/emailsignup/',
    create_linkedin_page: 'https://www.linkedin.com/company/setup/new/',
    create_twitter_account: 'https://twitter.com/i/flow/signup',
    create_tiktok_account: 'https://www.tiktok.com/signup',
    create_discord_server: 'https://discord.com/app',
    create_youtube_channel: 'https://www.youtube.com/create_channel',
    create_exchange_account: `https://${inputs.exchange || 'coinbase'}.com/signup`,
  };
  return urlMap[tool.id] || inputs.url || '';
}

function buildBrowserInstructions(tool, inputs) {
  return `Navigate to ${getTargetUrl(tool, inputs)} and create a ${tool.name}. ` +
    `Use these credentials: email=${inputs.email || 'N/A'}, name=${inputs.name || inputs.page_name || inputs.company_name || 'N/A'}. ` +
    `Fill in all required fields and complete the account creation flow.`;
}

// ─── AI Gateway Image Generation ──────────────────────────────────────
async function executeImageGeneration(tool, inputs, secrets) {
  const gatewayKey = secrets.get('VERCEL_AI_GATEWAY_KEY') || secrets.get('AI_GATEWAY_API_KEY');

  if (!gatewayKey) {
    return { status: 'error', message: 'AI Gateway key not configured' };
  }

  // Build the image generation prompt
  let prompt = inputs.prompt;
  if (tool.id === 'generate_agent_avatar') {
    prompt = `Professional headshot portrait of ${inputs.agent_name || 'a professional'}, ${inputs.style || 'corporate, photorealistic, high quality'}, head and shoulders, neutral background`;
  } else if (tool.id === 'generate_social_graphic') {
    prompt = `Social media graphic for ${inputs.platform || 'general use'}: ${inputs.prompt}, modern design, eye-catching`;
  } else if (tool.id === 'generate_business_logo') {
    prompt = `Minimalist business logo for ${inputs.business_name || 'a company'}, ${inputs.style || 'modern, clean'}, vector style`;
  }

  try {
    const res = await fetch('https://ai-gateway.vercel.sh/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gatewayKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: inputs.width && inputs.height ? `${inputs.width}x${inputs.height}` : '1024x1024',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { status: 'error', message: `Image generation failed: ${res.status} ${errText}` };
    }

    const data = await res.json();
    return {
      status: 'success',
      tool: tool.name,
      image_url: data.data?.[0]?.url || data.url,
      prompt,
    };
  } catch (e) {
    return { status: 'error', message: `Image generation request failed: ${e.message}` };
  }
}

// ─── AI Gateway Reasoning / Web Search ────────────────────────────────
async function executeGatewayTool(tool, inputs, secrets) {
  const gatewayKey = secrets.get('VERCEL_AI_GATEWAY_KEY') || secrets.get('AI_GATEWAY_API_KEY');

  if (!gatewayKey) {
    return { status: 'error', message: 'AI Gateway key not configured' };
  }

  const model = inputs.model || (tool.id === 'web_search' ? 'perplexity/sonar' : 'anthropic/claude-sonnet-4-6');

  try {
    const res = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gatewayKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: inputs.prompt || inputs.query }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { status: 'error', message: `Gateway request failed: ${res.status} ${errText}` };
    }

    const data = await res.json();
    return {
      status: 'success',
      tool: tool.name,
      response: data.choices?.[0]?.message?.content,
      model,
    };
  } catch (e) {
    return { status: 'error', message: `Gateway request failed: ${e.message}` };
  }
}