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
        key_prefix: k.key_prefix,
        scopes: k.scopes,
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
      const { name, scopes } = body;
      if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });
      const { rawKey, keyHash, keyPrefix } = await generateKey();
      const key = await base44.entities.ApiKey.create({
        name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        tenant_id: user.id,
        scopes: scopes || ['lookups', 'numbers:read'],
        status: 'active',
        request_count: 0
      });
      return Response.json({
        key: rawKey,
        key_id: key.id,
        key_prefix: keyPrefix,
        name: key.name,
        scopes: key.scopes,
        message: 'Save this key now — it will not be shown again.'
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
        key_prefix: keyPrefix,
        key_hash: keyHash,
        tenant_id: existing.tenant_id,
        scopes: existing.scopes,
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

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}