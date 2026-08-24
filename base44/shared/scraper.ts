const SCHEMA = {
  type: 'object',
  properties: {
    properties: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zip_code: { type: 'string' },
          distress_type: { type: 'string' },
          estimated_value: { type: 'number' },
          bedrooms: { type: 'number' },
          bathrooms: { type: 'number' },
          square_footage: { type: 'number' },
          owner_name: { type: 'string' },
          source_url: { type: 'string' }
        }
      }
    }
  }
};

/**
 * Scrape a single data source via Browserbase Fetch (structured-JSON extraction),
 * dedupe by address+zip, and upsert Property + Owner records.
 */
export async function scrapeSource(base44, { secrets, source, url, distress_type, state }) {
  const targetUrl = url || source?.url;
  const sourceName = source?.name || 'manual';
  const apiKey = secrets.get('BROWSERBASE_API_KEY');

  const fetchRes = await fetch('https://api.browserbase.com/v1/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-bb-api-key': apiKey },
    body: JSON.stringify({ url: targetUrl, format: 'json', schema: SCHEMA })
  });
  const text = await fetchRes.text();
  let fetchJson = {};
  try { fetchJson = JSON.parse(text); } catch (e) {
    fetchJson = { error: { message: text.slice(0, 200) } };
  }
  if (!fetchRes.ok) {
    return { error: fetchJson.error?.message || 'Browserbase fetch failed', found: 0, isNew: 0, updated: 0 };
  }

  let content = fetchJson.content;
  let props = [];
  if (typeof content === 'string') {
    try { content = JSON.parse(content); } catch (e) { /* not json */ }
  }
  if (content && Array.isArray(content.properties)) props = content.properties;
  else if (Array.isArray(content)) props = content;

  let found = props.length;
  let isNew = 0;
  let updated = 0;
  for (const p of props) {
    if (!p.address) continue;
    const existing = await base44.asServiceRole.entities.Property.filter({
      address: p.address,
      zip_code: p.zip_code
    });
    const payload = {
      address: p.address,
      city: p.city || source?.scrape_config?.city,
      state: p.state || state || source?.scrape_config?.state,
      zip_code: p.zip_code,
      distress_type: p.distress_type || distress_type || source?.scrape_config?.distress_type,
      estimated_value: p.estimated_value,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      square_footage: p.square_footage,
      source: 'scraped',
      source_url: p.source_url || targetUrl,
      scraped_at: new Date().toISOString(),
      status: 'active'
    };
    if (existing[0]) {
      await base44.asServiceRole.entities.Property.update(existing[0].id, payload);
      updated++;
    } else {
      const created = await base44.asServiceRole.entities.Property.create(payload);
      if (p.owner_name) {
        await base44.asServiceRole.entities.Owner.create({
          property_id: created.id,
          name: p.owner_name,
          owner_type: 'current',
          source: sourceName
        });
      }
      isNew++;
    }
  }
  return { found, isNew, updated, error: null };
}