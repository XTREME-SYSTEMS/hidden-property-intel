import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// Generate a cryptographically random API key and its SHA-256 hash
async function generateKey() {
  const rand1 = crypto.randomUUID().replace(/-/g, '');
  const rand2 = crypto.randomUUID().replace(/-/g, '');
  const rawKey = `xpi_live_${rand1}${rand2}`;
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawKey));
  const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  const keyPrefix = rawKey.slice(0, 12);
  return { rawKey, keyHash, keyPrefix };
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const action = body.action;

    // LIST — return all keys for this user (or all if admin)
    if (action === 'list') {
      const filter = user.role === 'admin' ? {} : { tenant_id: user.id };
      const keys = await base44.entities.ApiKey.filter(filter, '-created_date', 100);
      // Never return the hash — only prefix + metadata
      const safe = keys.map(k => ({
        id: k.id,
        name: k.name,
        description: k.description,
        key_prefix: k.key_prefix,
        scopes: k.scopes,
        system_type: k.system_type,
        status: k.status,
        last_used: k.last_used,
        request_count: k.request_count,
        expires_at: k.expires_at,
        created_date: k.created_date,
        tenant_id: k.tenant_id
      }));
      return Response.json({ keys: safe });
    }

    // GENERATE — create a new API key, return the raw key ONCE
    if (action === 'generate') {
      const { name, scopes, description, system_type } = body;
      if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });
      const { rawKey, keyHash, keyPrefix } = await generateKey();
      const key = await base44.entities.ApiKey.create({
        name,
        description: description || '',
        key_prefix: keyPrefix,
        key_hash: keyHash,
        tenant_id: user.id,
        scopes: scopes || ['properties:read'],
        system_type: system_type || 'general',
        status: 'active',
        request_count: 0
      });
      return Response.json({
        key: rawKey,
        key_id: key.id,
        key_prefix: keyPrefix,
        name: key.name,
        scopes: key.scopes,
        system_type: key.system_type,
        message: 'Save this key now — it will not be shown again.'
      });
    }

    // UPDATE — edit name, description, or scopes on an existing key
    if (action === 'update') {
      const { key_id, name, description, scopes } = body;
      if (!key_id) return Response.json({ error: 'key_id is required' }, { status: 400 });
      const existing = await base44.entities.ApiKey.get(key_id);
      if (!existing) return Response.json({ error: 'Key not found' }, { status: 404 });
      if (user.role !== 'admin' && existing.tenant_id !== user.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (scopes !== undefined) updates.scopes = scopes;
      await base44.entities.ApiKey.update(key_id, updates);
      return Response.json({ success: true, message: 'Key updated' });
    }

    // PRESETS — return the special system connector configurations
    if (action === 'presets') {
      return Response.json({
        system_connectors: [
          {
            system_type: 'vision_cortex',
            name: 'Vision Cortex — Autonomous AI Management',
            description: 'Full bi-directional live connection for the autonomous AI orchestrator. Enables insight, enrichment, analysis, fix, heal, harden, optimize, and continuous management oversight.',
            scopes: ['vision_cortex', 'properties', 'enrichment', 'analytics', 'shadow', 'scraping'],
            capabilities: [
              'Run forensic audits across all properties',
              'Trigger master enrichment cycles',
              'Analyze and score property data',
              'Auto-heal incomplete records',
              'Harden and optimize system state',
              'Continuous oversight & self-reflection',
              'Read/write property entities',
              'Invoke shadow orchestrator cycles',
              'Access analytics and reporting'
            ],
            endpoints: [
              'POST /functions/autonomousMasterLoop',
              'POST /functions/runMasterEnrichment',
              'POST /functions/validateEnrichment',
              'POST /functions/shadowOrchestrator',
              'POST /functions/shadowDealHunt',
              'POST /functions/scoreAllActiveProperties',
              'POST /functions/predictDistress',
              'GET  /functions/validateSystem'
            ]
          },
          {
            system_type: 'xtreme_comms',
            name: 'Xtreme Communication — Multi-Channel Orchestration',
            description: 'Full bi-directional live connection for the unified communication system. Enables campaigns, conversations, templates, events, and multi-channel messaging across email, SMS, voice, WhatsApp, and social.',
            scopes: ['xtreme_comms', 'comms', 'outreach', 'leads', 'owners', 'investor'],
            capabilities: [
              'Create and manage campaigns',
              'Track conversations and sentiment',
              'Generate and manage communication templates',
              'Log communication events',
              'Send outreach across all channels',
              'AI-powered reply generation',
              'Manage investor and owner leads',
              'Autonomous follow-up engine'
            ],
            endpoints: [
              'POST /functions/xtremeComms',
              'POST /functions/generateInvestorOutreach',
              'POST /functions/generateOwnerOutreach',
              'POST /functions/generateReplyEmail',
              'POST /functions/validateEmailQuality',
              'POST /functions/runDailyOutreach',
              'POST /functions/autonomousFollowUp',
              'POST /functions/processFollowUps'
            ]
          },
          {
            system_type: 'cloud_browser',
            name: 'Cloud Browser — Autonomous Scraping Engine',
            description: 'Full bi-directional live connection for the self-hosted cloud browser engine. Enables property scraping, image capture, JS-rendered page browsing, and data extraction with LLM-powered enrichment.',
            scopes: ['cloud_browser', 'scraping', 'properties', 'enrichment'],
            capabilities: [
              'Scrape distressed property listings',
              'Capture and ingest property images',
              'Browse JS-rendered pages',
              'Extract structured data via LLM',
              'Sync scraped data to Base44',
              'Process draft properties',
              'Run daily scrape pipeline',
              'Geocode and normalize addresses'
            ],
            endpoints: [
              'POST /functions/scrapeProperties',
              'POST /functions/scrapePropertyImages',
              'POST /functions/ingestPropertyImages',
              'POST /functions/processDraftProperties',
              'POST /functions/runDailyScrapePipeline',
              'POST /functions/manualScrapeTargets',
              'POST /functions/geocodeProperties',
              'POST /functions/normalizeAddresses'
            ]
          }
        ],
        platform_scopes: [
          { scope: 'admin', label: 'Admin', description: 'Full platform administrator access' },
          { scope: 'users', label: 'Users', description: 'User management and invitations' },
          { scope: 'agent', label: 'Agent', description: 'Agent dashboard, documents, commissions' },
          { scope: 'investor', label: 'Investor', description: 'Investor profiles, pipeline, bids' },
          { scope: 'seller', label: 'Seller', description: 'Seller dashboard and property posting' },
          { scope: 'properties', label: 'Properties', description: 'Full property CRUD access' },
          { scope: 'properties:read', label: 'Properties (Read)', description: 'Read-only property access' },
          { scope: 'deals', label: 'Deals', description: 'Deal management and pipeline' },
          { scope: 'bids', label: 'Bids', description: 'Bidding system access' },
          { scope: 'smart_contracts', label: 'Smart Contracts', description: 'Blockchain contract operations' },
          { scope: 'outreach', label: 'Outreach', description: 'Outreach and campaign management' },
          { scope: 'enrichment', label: 'Enrichment', description: 'Data enrichment engine access' },
          { scope: 'scraping', label: 'Scraping', description: 'Scraping engine control' },
          { scope: 'analytics', label: 'Analytics', description: 'Analytics and reporting data' },
          { scope: 'owners', label: 'Owners', description: 'Property owner records' },
          { scope: 'leads', label: 'Leads', description: 'Investor lead management' },
          { scope: 'shadow', label: 'Shadow Orchestrator', description: 'Shadow audit and deal hunt' },
          { scope: 'comms', label: 'Communications', description: 'Xtreme comms entities access' }
        ]
      });
    }

    // ROLL — create a replacement key, mark old as rolled
    if (action === 'roll') {
      const { key_id } = body;
      if (!key_id) return Response.json({ error: 'key_id is required' }, { status: 400 });
      const existing = await base44.entities.ApiKey.get(key_id);
      if (!existing) return Response.json({ error: 'Key not found' }, { status: 404 });
      if (user.role !== 'admin' && existing.tenant_id !== user.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      const { rawKey, keyHash, keyPrefix } = await generateKey();
      const newKey = await base44.entities.ApiKey.create({
        name: existing.name,
        description: existing.description,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        tenant_id: existing.tenant_id,
        scopes: existing.scopes,
        system_type: existing.system_type || 'general',
        status: 'active',
        request_count: 0
      });
      await base44.entities.ApiKey.update(key_id, { status: 'rolled' });
      return Response.json({
        key: rawKey,
        key_id: newKey.id,
        key_prefix: keyPrefix,
        message: 'Old key revoked. Save the new key now.'
      });
    }

    // REVOKE — mark key as revoked (soft delete)
    if (action === 'revoke') {
      const { key_id } = body;
      if (!key_id) return Response.json({ error: 'key_id is required' }, { status: 400 });
      const existing = await base44.entities.ApiKey.get(key_id);
      if (!existing) return Response.json({ error: 'Key not found' }, { status: 404 });
      if (user.role !== 'admin' && existing.tenant_id !== user.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      await base44.entities.ApiKey.update(key_id, { status: 'revoked' });
      return Response.json({ success: true, message: 'Key revoked' });
    }

    // DELETE — hard delete
    if (action === 'delete') {
      const { key_id } = body;
      if (!key_id) return Response.json({ error: 'key_id is required' }, { status: 400 });
      const existing = await base44.entities.ApiKey.get(key_id);
      if (!existing) return Response.json({ error: 'Key not found' }, { status: 404 });
      if (user.role !== 'admin' && existing.tenant_id !== user.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      await base44.entities.ApiKey.delete(key_id);
      return Response.json({ success: true, message: 'Key deleted' });
    }

    // VERIFY — validate a raw key against stored hashes (used by gateway middleware)
    if (action === 'verify') {
      const { key } = body;
      if (!key) return Response.json({ valid: false }, { status: 400 });
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
      const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      const found = await base44.asServiceRole.entities.ApiKey.filter({ key_hash: keyHash, status: 'active' }, '-created_date', 1);
      if (found.length === 0) return Response.json({ valid: false });
      const k = found[0];
      // Update last_used + request_count (fire-and-forget)
      base44.asServiceRole.entities.ApiKey.update(k.id, {
        last_used: new Date().toISOString(),
        request_count: (k.request_count || 0) + 1
      });
      return Response.json({
        valid: true,
        tenant_id: k.tenant_id,
        scopes: k.scopes,
        key_id: k.id
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}