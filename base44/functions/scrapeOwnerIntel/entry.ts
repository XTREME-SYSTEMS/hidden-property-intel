import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { fetchRenderedHtml } from '../../shared/browserEngine.ts';
import { fetchPropertyImages, hasRealImages } from '../../shared/propertyImages.ts';

/**
 * Cloud-browser owner intelligence scraper.
 *
 * For distressed properties missing an owner name, uses the self-hosted
 * cloudbrowser engine to render a public-records web search, then parses it
 * with an LLM to extract: owner name, estimated value, distress summary,
 * property summary, investment score, and outreach background — enough
 * context to legitimately message or call the owner.
 *
 * Updates the Property (value, score, summaries) and creates/updates a
 * current Owner record with the scraped name.
 */

const SCHEMA = {
  type: 'object',
  properties: {
    owner_name: { type: 'string' },
    owner_confidence: { type: 'string', enum: ['high', 'medium', 'low', 'none'] },
    estimated_value: { type: 'number' },
    distress_summary: { type: 'string' },
    property_summary: { type: 'string' },
    investment_score: { type: 'number' },
    outreach_background: { type: 'string' },
    sources: { type: 'array', items: { type: 'string' } },
  },
};

const BATCH_SIZE = 4;
const TIME_LIMIT_MS = 240000;

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000);
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(body.limit || BATCH_SIZE, 10);
    const onlyId = body.property_id;
    const sr = base44.asServiceRole.entities;

    const [properties, owners] = await Promise.all([
      sr.Property.filter({ status: 'active' }, '-created_date', 400),
      sr.Owner.filter({ owner_type: 'current' }, '-created_date', 400),
    ]);
    const ownerByProp = new Map();
    owners.forEach((o) => { if (o.property_id) ownerByProp.set(o.property_id, o); });

    const distressed = properties
      .filter((p) => p.distress_type && p.address && p.city && p.state)
      .filter((p) => (onlyId ? p.id === onlyId : true))
      .sort((a, b) => {
        const aHas = ownerByProp.has(a.id) && ownerByProp.get(a.id).name;
        const bHas = ownerByProp.has(b.id) && ownerByProp.get(b.id).name;
        return aHas === bHas ? 0 : aHas ? 1 : -1;
      });
    const toProcess = distressed.slice(0, limit);

    const results = [];
    let foundNames = 0;
    let foundImages = 0;
    const startedAt = Date.now();

    for (const p of toProcess) {
      if (Date.now() - startedAt > TIME_LIMIT_MS) break;
      try {
        const query = `${p.address}, ${p.city}, ${p.state} ${p.zip_code || ''} property owner assessor records value`;
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        let pageText = '';
        try {
          const rendered = await fetchRenderedHtml(url, { timeout: 40000 });
          pageText = stripHtml(rendered.html);
        } catch (e) {
          console.error('cloudbrowser fetch failed', p.id, e?.message);
        }

        const prompt = `You are a property-records researcher and real estate investment analyst. Research this property and return JSON only.

Property:
- Address: ${p.address}, ${p.city}, ${p.state} ${p.zip_code || ''}
- Distress type: ${p.distress_type?.replace(/_/g, ' ')}
- Type: ${p.property_type}, Beds: ${p.bedrooms ?? 'n/a'}, Baths: ${p.bathrooms ?? 'n/a'}, Sqft: ${p.square_footage ?? 'n/a'}, Year built: ${p.year_built ?? 'n/a'}

${pageText ? `Rendered public-records web-search page (fetched via a real headless browser):\n"""\n${pageText}\n"""\n\nUse this page content as a primary source. ` : ''}Also search the live web (county property appraiser, tax records, assessor, clerk of court, people-search sites, news) to corroborate and fill gaps.

Return:
- owner_name: current legal owner's full name ("" if not found)
- owner_confidence: high/medium/low/none based on corroboration
- estimated_value: current estimated market value in USD (number)
- distress_summary: 1-2 sentences on the specific distressed problem (foreclosure, probate, tax delinquent, code violation, divorce, bankruptcy, etc.)
- property_summary: 2-3 sentences describing the property and its situation
- investment_score: 0-100 investment opportunity score
- outreach_background: 3-5 sentences of background context so a representative can legitimately and intelligently message or call the owner — what is known, why we are reaching out, and what would be relevant to mention
- sources: list of sites/URLs where info was found

CRITICAL: Only return an owner_name you actually found in public records. Do NOT invent names. If not found, return "" and confidence "none".`;

        const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: SCHEMA,
        });

        await sr.Property.update(p.id, {
          estimated_value: r.estimated_value ?? p.estimated_value,
          property_score: r.investment_score ?? p.property_score,
          investor_summary: [r.property_summary, r.outreach_background].filter(Boolean).join('\n\n'),
          description: r.distress_summary || p.description,
          last_verified_at: new Date().toISOString(),
        });

        if (r.owner_name && r.owner_confidence !== 'none') {
          foundNames++;
          const existing = ownerByProp.get(p.id);
          const isVerified = r.owner_confidence === 'high' || r.owner_confidence === 'medium';
          if (existing) {
            await sr.Owner.update(existing.id, { name: r.owner_name, source: 'cloud_browser', is_verified: isVerified });
          } else {
            const created = await sr.Owner.create({
              name: r.owner_name,
              owner_type: 'current',
              property_id: p.id,
              source: 'cloud_browser',
              is_verified: isVerified,
              contact_address: `${p.address}, ${p.city}, ${p.state} ${p.zip_code || ''}`.trim(),
            });
            ownerByProp.set(p.id, created);
          }
        }

        // Best-effort real listing photo fetch (cloud browser) for properties without images
        let imagesFound = 0;
        if (!hasRealImages(p)) {
          try {
            const imgRes = await fetchPropertyImages(base44, p);
            imagesFound = imgRes.found || 0;
          } catch (e) {
            console.error('image fetch failed', p.id, e?.message);
          }
        }

        foundImages += imagesFound;
        results.push({ id: p.id, address: p.address, owner: r.owner_name || null, confidence: r.owner_confidence, value: r.estimated_value, score: r.investment_score, images: imagesFound });
      } catch (e) {
        console.error('scrapeOwnerIntel property failed', p.id, e?.message);
        results.push({ id: p.id, address: p.address, error: e.message });
      }
    }

    return Response.json({
      processed: results.length,
      found_names: foundNames,
      found_images: foundImages,
      remaining: Math.max(0, distressed.length - results.length),
      results,
    });
  } catch (error) {
    console.error('scrapeOwnerIntel error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}