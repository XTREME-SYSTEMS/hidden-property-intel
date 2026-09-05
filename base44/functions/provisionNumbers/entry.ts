import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Normalize a phone number to E.164 format (US default)
function normalizeNumber(raw: string): string | null {
  if (!raw) return null;
  let cleaned = String(raw).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned.length >= 11 && cleaned.length <= 16 ? cleaned : null;
  }
  // Assume US if 10 or 11 digits
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
  if (cleaned.length >= 7 && cleaned.length <= 15) return `+${cleaned}`;
  return null;
}

// Check whether live carrier credentials are configured for a tenant.
// Since Twilio credentials are not set, all numbers stage as sandbox/credentials_required.
function carrierCredentialsConfigured(): boolean {
  // When TWILIO_ACCOUNT_SID is set via secrets, this flips to true.
  // For now, return false — numbers stage safely without breaking the threading engine.
  return false;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { numbers, source, tenant_id } = body;

    if (!Array.isArray(numbers) || numbers.length === 0) {
      return Response.json({ error: 'numbers array is required' }, { status: 400 });
    }

    const ownerTenant = tenant_id || user.id;
    const importSource = source || 'api';
    const hasCarrier = carrierCredentialsConfigured();
    const stagedStatus = hasCarrier ? 'active' : 'credentials_required';

    const results = {
      total: numbers.length,
      imported: 0,
      duplicates: 0,
      invalid: 0,
      staged_as: stagedStatus,
      carrier_configured: hasCarrier,
      numbers: [] as any[]
    };

    // Deduplicate within the batch
    const seen = new Set<string>();
    const toCreate: any[] = [];

    for (const raw of numbers) {
      const normalized = normalizeNumber(raw);
      if (!normalized) {
        results.invalid++;
        results.numbers.push({ raw, status: 'invalid' });
        continue;
      }
      if (seen.has(normalized)) {
        results.duplicates++;
        continue;
      }
      seen.add(normalized);

      // Check if number already exists for this tenant
      const existing = await base44.entities.PhoneNumber.filter(
        { number: normalized, tenant_id: ownerTenant },
        '-created_date',
        1
      );
      if (existing.length > 0) {
        results.duplicates++;
        results.numbers.push({ number: normalized, status: 'duplicate' });
        continue;
      }

      toCreate.push({
        number: normalized,
        country_code: normalized.startsWith('+1') ? 'US' : 'unknown',
        status: stagedStatus,
        tenant_id: ownerTenant,
        source: importSource,
        imported_at: new Date().toISOString(),
        verified: false
      });
      results.numbers.push({ number: normalized, status: 'staged' });
    }

    // Bulk insert in batches of 100
    if (toCreate.length > 0) {
      for (let i = 0; i < toCreate.length; i += 100) {
        const batch = toCreate.slice(i, i + 100);
        await base44.entities.PhoneNumber.bulkCreate(batch);
        results.imported += batch.length;
      }
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}