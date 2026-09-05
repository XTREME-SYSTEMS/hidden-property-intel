import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Normalize to E.164
function normalizeNumber(raw: string): string | null {
  if (!raw) return null;
  let cleaned = String(raw).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned.length >= 11 && cleaned.length <= 16 ? cleaned : null;
  }
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
  if (cleaned.length >= 7 && cleaned.length <= 15) return `+${cleaned}`;
  return null;
}

// Basic line-type heuristic without a carrier API.
// Real carrier lookup requires Twilio Lookup API — staged until credentials are set.
function heuristicLineType(number: string): string {
  // US mobile numbers often have specific patterns, but without a carrier API
  // we return 'unknown' and flag for enrichment when credentials arrive.
  if (!number.startsWith('+1')) return 'unknown';
  return 'unknown';
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { numbers, tenant_id } = body;

    if (!Array.isArray(numbers) || numbers.length === 0) {
      return Response.json({ error: 'numbers array is required' }, { status: 400 });
    }

    const ownerTenant = tenant_id || user.id;
    const results = [] as any[];

    for (const raw of numbers) {
      const normalized = normalizeNumber(raw);
      if (!normalized) {
        results.push({ raw, valid: false, reason: 'invalid_format' });
        continue;
      }

      // Check if we already have this number staged
      const existing = await base44.entities.PhoneNumber.filter(
        { number: normalized, tenant_id: ownerTenant },
        '-created_date',
        1
      );

      const lookupResult: any = {
        number: normalized,
        valid: true,
        country_code: normalized.startsWith('+1') ? 'US' : 'unknown',
        line_type: heuristicLineType(normalized),
        carrier: null,
        carrier_lookup_available: false,
        staged: existing.length > 0,
        status: existing.length > 0 ? existing[0].status : 'not_imported'
      };

      // Update last_lookup_at if staged
      if (existing.length > 0) {
        base44.entities.PhoneNumber.update(existing[0].id, {
          last_lookup_at: new Date().toISOString()
        });
      }

      results.push(lookupResult);
    }

    return Response.json({
      total: results.length,
      valid: results.filter(r => r.valid).length,
      carrier_configured: false,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}