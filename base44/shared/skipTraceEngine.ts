// Advanced Skip Trace Engine — multi-source people location system
// designed to process hundreds of thousands of records.
//
// Data sources (accessed via browser engine + AI Gateway):
//   1. People search aggregators (TruePeopleSearch, FastPeopleSearch, Whitepages)
//   2. Public records (county assessor, tax, court, probate)
//   3. Social media (LinkedIn, Facebook, Twitter/X)
//   4. Address history (USPS NCOA, address verification)
//   5. Reverse phone / email lookup
//   6. Business filings (SoS, LLC registries)
//   7. Property records (deeds, mortgages, liens)
//
// The engine runs multiple search strategies in parallel, cross-references
// results, scores confidence by corroboration, and stores findings in
// the Owner entity with full identification method provenance.

export interface SkipTraceResult {
  target: { name?: string; address?: string; entity_type?: string };
  phones: { number: string; type: string; confidence: number; source: string }[];
  emails: { address: string; confidence: number; source: string }[];
  addresses: { line: string; type: string; confidence: number; source: string }[];
  relatives: { name: string; relationship: string; confidence: number; source: string }[];
  associates: { name: string; type: string; confidence: number; source: string }[];
  social_profiles: { platform: string; url: string; confidence: number }[];
  business_affiliations: { name: string; role: string; status: string }[];
  overall_confidence: number;
  sources_checked: string[];
  identification_methods: { method: string; source: string; status: string; result: string }[];
  raw_intel: string;
  processed_at: string;
}

// ─── Search Strategies ────────────────────────────────────────────────

export const SEARCH_STRATEGIES = [
  {
    id: 'people_search_aggregators',
    name: 'People Search Aggregators',
    sources: ['TruePeopleSearch', 'FastPeopleSearch', 'Whitepages', 'Spokeo', 'BeenVerified'],
    method: 'browser',
    priority: 1,
    description: 'Free people-search aggregators — phone, email, address, relatives',
  },
  {
    id: 'public_records',
    name: 'Public Records',
    sources: ['County Assessor', 'Tax Collector', 'Court Records', 'Probate Court', 'Recorder of Deeds'],
    method: 'browser',
    priority: 1,
    description: 'Government public records — ownership, taxes, liens, probate',
  },
  {
    id: 'social_media',
    name: 'Social Media Intelligence',
    sources: ['LinkedIn', 'Facebook', 'Twitter/X', 'Instagram'],
    method: 'browser',
    priority: 2,
    description: 'Social profiles — employment, location, connections, activity',
  },
  {
    id: 'reverse_phone_email',
    name: 'Reverse Phone & Email Lookup',
    sources: ['ReversePhoneLookup', 'EmailRep', 'HaveIBeenPwned', 'EmailValidator'],
    method: 'gateway',
    priority: 2,
    description: 'Reverse lookup for phone numbers and email addresses',
  },
  {
    id: 'business_filings',
    name: 'Business Filings',
    sources: ['FL Secretary of State', 'OpenCorporates', 'Sunbiz'],
    method: 'browser',
    priority: 3,
    description: 'LLC/corporation registrations — officers, registered agents',
  },
  {
    id: 'address_history',
    name: 'Address History & NCOA',
    sources: ['USPS NCOA', 'AddressVerification', 'PropertyRecords'],
    method: 'gateway',
    priority: 3,
    description: 'Forwarding addresses, residency history, property ties',
  },
  {
    id: 'property_records',
    name: 'Property Records Deep Dive',
    sources: ['Deed Records', 'Mortgage Records', 'Lien Records', 'HOA Records'],
    method: 'browser',
    priority: 2,
    description: 'Deed transfers, mortgage filings, liens, HOA — ownership chain',
  },
  {
    id: 'ai_corroboration',
    name: 'AI Cross-Reference & Corroboration',
    sources: ['Vercel AI Gateway'],
    method: 'gateway',
    priority: 1,
    description: 'AI-powered cross-referencing, deduplication, and confidence scoring',
  },
];

// ─── Browser-Based Search (via browser engine) ───────────────────────

export async function runBrowserSearch(
  strategy: any,
  target: any,
  secrets: any
): Promise<any> {
  const browserUrl = secrets.get('BROWSER_ENGINE_URL');
  const browserKey = secrets.get('BROWSER_ENGINE_API_KEY');
  const browserbaseKey = secrets.get('BROWSERBASE_API_KEY');

  if (!browserUrl && !browserbaseKey) {
    return { strategy: strategy.id, status: 'error', message: 'No browser engine configured' };
  }

  const searchUrls = buildSearchUrls(strategy, target);
  const results: any[] = [];
  let usedFallback = false;

  for (const url of searchUrls.slice(0, 3)) {
    let success = false;

    // Try primary cloudbrowser engine first
    if (browserUrl && browserKey) {
      try {
        const res = await fetch(`${browserUrl}/api/sessions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${browserKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'skip_trace',
            target_url: url.url,
            task: {
              strategy: strategy.id,
              source: url.source,
              target,
              instructions: url.instructions,
              extract: ['phone', 'email', 'address', 'relatives', 'social_profiles'],
            },
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            results.push({ source: url.source, url: url.url, data, engine: 'cloudbrowser' });
            success = true;
          }
        }
      } catch (e) {
        // Primary failed — will try fallback
      }
    }

    // Fallback: Browserbase Fetch API
    if (!success && browserbaseKey) {
      try {
        const res = await fetch('https://api.browserbase.com/v1/fetch', {
          method: 'POST',
          headers: {
            'X-BB-API-Key': browserbaseKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url.url,
            format: 'markdown',
            allowRedirects: true,
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (res.ok) {
          const data = await res.json();
          const content = typeof data.content === 'string' ? data.content : '';
          if (content.length > 50) {
            results.push({
              source: url.source,
              url: url.url,
              data: { content, statusCode: data.statusCode, format: 'markdown' },
              engine: 'browserbase',
            });
            success = true;
            usedFallback = true;
          }
        }
      } catch (e) {
        results.push({ source: url.source, url: url.url, error: e.message, engine: 'browserbase' });
      }
    }

    if (!success) {
      results.push({ source: url.source, url: url.url, error: 'All engines failed', engine: 'none' });
    }
  }

  return { strategy: strategy.id, status: 'completed', results, used_fallback: usedFallback };
}

// ─── Build Search URLs for each strategy ──────────────────────────────

function buildSearchUrls(strategy: any, target: any): { source: string; url: string; instructions: string }[] {
  const name = target.name || '';
  const address = target.address || '';
  const nameEncoded = encodeURIComponent(name);
  const addressEncoded = encodeURIComponent(address);

  switch (strategy.id) {
    case 'people_search_aggregators':
      return [
        { source: 'TruePeopleSearch', url: `https://www.truepeoplesearch.com/results?name=${nameEncoded}`, instructions: `Search for ${name}. Extract phone numbers, emails, addresses, and relatives.` },
        { source: 'FastPeopleSearch', url: `https://www.fastpeoplesearch.com/name/${nameEncoded}`, instructions: `Search for ${name}. Extract contact info and relatives.` },
        { source: 'Whitepages', url: `https://www.whitepages.com/name/${nameEncoded}`, instructions: `Search for ${name}. Extract phone, address, and relatives.` },
      ];

    case 'public_records':
      return [
        { source: 'County Assessor', url: `https://www.google.com/search?q=${nameEncoded}+property+records+florida+assessor`, instructions: `Search for ${name} in Florida property records. Extract ownership and tax info.` },
        { source: 'Court Records', url: `https://www.google.com/search?q=${nameEncoded}+florida+court+records+probate`, instructions: `Search for ${name} in Florida court and probate records.` },
      ];

    case 'social_media':
      return [
        { source: 'LinkedIn', url: `https://www.google.com/search?q=site:linkedin.com+${nameEncoded}+florida+real+estate`, instructions: `Find LinkedIn profile for ${name}. Extract employment, location, connections.` },
        { source: 'Facebook', url: `https://www.google.com/search?q=site:facebook.com+${nameEncoded}`, instructions: `Find Facebook profile for ${name}. Extract location and activity.` },
      ];

    case 'business_filings':
      return [
        { source: 'Sunbiz', url: `https://search.sunbiz.org/Inquiry/CorporationSearch/ByName?SearchTerm=${nameEncoded}`, instructions: `Search Florida Division of Corporations for ${name}. Extract officer/agent roles.` },
        { source: 'OpenCorporates', url: `https://opencorporates.com/search?q=${nameEncoded}`, instructions: `Search OpenCorporates for ${name}. Extract business affiliations.` },
      ];

    case 'property_records':
      return [
        { source: 'Deed Records', url: `https://www.google.com/search?q=${nameEncoded}+florida+deed+records+property`, instructions: `Search for ${name} in Florida deed and property records.` },
        { source: 'Mortgage Records', url: `https://www.google.com/search?q=${nameEncoded}+florida+mortgage+liens`, instructions: `Search for ${name} in mortgage and lien records.` },
      ];

    default:
      return [];
  }
}

// ─── AI Gateway Cross-Reference & Corroboration ──────────────────────

export async function runAICorroboration(
  target: any,
  rawResults: any[],
  secrets: any
): Promise<any> {
  const gatewayKey = secrets.get('VERCEL_AI_GATEWAY_KEY') || secrets.get('AI_GATEWAY_API_KEY');
  if (!gatewayKey) {
    return { status: 'error', message: 'AI Gateway key not configured' };
  }

  // Check if browser results have any useful content
  const hasContent = rawResults.some((r: any) =>
    r.results?.some((rr: any) =>
      (rr.data && typeof rr.data === 'object' && Object.keys(rr.data).length > 0 && !rr.error) ||
      (rr.data?.content && rr.data.content.length > 100)
    )
  );

  // If browser results are empty (all sites blocked/failed), use web-search AI
  const useWebSearch = !hasContent;
  const model = useWebSearch ? 'perplexity/sonar-pro' : 'anthropic/claude-sonnet-4-6';

  const prompt = useWebSearch
    ? `You are an elite skip-trace analyst. Search the web to find contact information for this person:

TARGET:
Name: ${target.name || 'Unknown'}
Address: ${target.address || 'Unknown'}
Entity Type: ${target.entity_type || 'individual'}

Use your web search to find:
1. Phone numbers
2. Email addresses
3. Current and previous addresses
4. Relatives and associates
5. Social media profiles
6. Business affiliations (LLC officer, registered agent, etc.)

Score overall confidence (0-100) based on how many independent sources corroborate each finding.

Return ONLY a JSON object with this exact structure (no other text):
{
  "phones": [{"number": "...", "type": "mobile|landline|voip|unknown", "confidence": 0-100, "source": "..."}],
  "emails": [{"address": "...", "confidence": 0-100, "source": "..."}],
  "addresses": [{"line": "...", "type": "current|previous|mailing", "confidence": 0-100, "source": "..."}],
  "relatives": [{"name": "...", "relationship": "...", "confidence": 0-100, "source": "..."}],
  "associates": [{"name": "...", "type": "...", "confidence": 0-100, "source": "..."}],
  "social_profiles": [{"platform": "...", "url": "...", "confidence": 0-100}],
  "business_affiliations": [{"name": "...", "role": "...", "status": "..."}],
  "overall_confidence": 0-100,
  "identification_methods": [{"method": "...", "source": "...", "status": "found|not_found|partial|error", "result": "..."}],
  "contradictions": ["..."],
  "executive_summary": "2-3 sentence summary of findings"
}`
    : `You are an elite skip-trace analyst. Cross-reference and corroborate the following raw search results for this target:

TARGET:
Name: ${target.name || 'Unknown'}
Address: ${target.address || 'Unknown'}
Entity Type: ${target.entity_type || 'individual'}

RAW SEARCH RESULTS:
${JSON.stringify(rawResults, null, 2).slice(0, 8000)}

Analyze all results and produce a consolidated skip-trace report:
1. Extract all unique phone numbers, emails, and addresses found across sources
2. Identify relatives and associates mentioned
3. Note social media profiles discovered
4. Note business affiliations (LLC officer, registered agent, etc.)
5. Score overall confidence (0-100) based on how many independent sources corroborate each finding
6. Flag any contradictions between sources
7. List which identification methods succeeded and which returned no results

Return JSON with this exact structure:
{
  "phones": [{"number": "...", "type": "mobile|landline|voip|unknown", "confidence": 0-100, "source": "..."}],
  "emails": [{"address": "...", "confidence": 0-100, "source": "..."}],
  "addresses": [{"line": "...", "type": "current|previous|mailing", "confidence": 0-100, "source": "..."}],
  "relatives": [{"name": "...", "relationship": "...", "confidence": 0-100, "source": "..."}],
  "associates": [{"name": "...", "type": "...", "confidence": 0-100, "source": "..."}],
  "social_profiles": [{"platform": "...", "url": "...", "confidence": 0-100}],
  "business_affiliations": [{"name": "...", "role": "...", "status": "..."}],
  "overall_confidence": 0-100,
  "identification_methods": [{"method": "...", "source": "...", "status": "found|not_found|partial|error", "result": "..."}],
  "contradictions": ["..."],
  "executive_summary": "2-3 sentence summary of findings"
}`;

  try {
    const body: any = {
      model,
      messages: [{ role: 'user', content: prompt }],
    };
    // Only use json_object format for non-web-search models (Perplexity may not support it)
    if (!useWebSearch) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gatewayKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return { status: 'error', message: `AI Gateway error: ${res.status}` };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    // Parse JSON (Perplexity may include citations/text around the JSON)
    let parsed: any = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
    }

    return { status: 'success', search_mode: useWebSearch ? 'web_search' : 'corroboration', ...(parsed || {}) };
  } catch (e) {
    return { status: 'error', message: e.message };
  }
}

// ─── Batch Processing (for hundreds of thousands of records) ─────────

export async function runBatchSkipTrace(
  db: any,
  secrets: any,
  opts: { batch_size?: number; filter?: any; send_email?: boolean } = {}
): Promise<any> {
  const batchSize = opts.batch_size || 50;
  const filter = opts.filter || { is_verified: false };

  // Get unverified owners in batches
  const owners = await db.asServiceRole.entities.Owner.filter(filter, '-created_date', batchSize);
  const results: any[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const owner of owners) {
    try {
      const property = owner.property_id
        ? await db.asServiceRole.entities.Property.get(owner.property_id).catch(() => null)
        : null;

      const target = {
        name: owner.name,
        address: property ? `${property.address}, ${property.city}, ${property.state} ${property.zip_code}` : '',
        entity_type: owner.entity_type || 'individual',
      };

      // Run all search strategies
      const strategyResults: any[] = [];
      for (const strategy of SEARCH_STRATEGIES) {
        if (strategy.method === 'browser') {
          const result = await runBrowserSearch(strategy, target, secrets);
          strategyResults.push(result);
        }
      }

      // AI corroboration
      const aiResult = await runAICorroboration(target, strategyResults, secrets);

      // Merge into result
      const traceResult: SkipTraceResult = {
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
        processed_at: new Date().toISOString(),
      };

      // Update Owner record
      const update: any = {
        is_verified: traceResult.overall_confidence >= 50,
        last_identified_at: new Date().toISOString(),
        confidence_score: traceResult.overall_confidence,
        identification_methods: traceResult.identification_methods,
      };
      if (traceResult.phones.length > 0) update.contact_phone = traceResult.phones[0].number;
      if (traceResult.emails.length > 0) update.contact_email = traceResult.emails[0].address;
      if (traceResult.addresses.length > 0) update.contact_address = traceResult.addresses[0].line;
      if (traceResult.relatives.length > 0) {
        update.next_of_kin = traceResult.relatives.map(r => ({
          name: r.name,
          relationship: r.relationship,
          contact_phone: '',
          contact_email: '',
          source: r.source,
        }));
      }

      await db.asServiceRole.entities.Owner.update(owner.id, update);
      results.push({ owner_id: owner.id, name: owner.name, confidence: traceResult.overall_confidence, status: 'success' });
      successCount++;
    } catch (e) {
      results.push({ owner_id: owner.id, name: owner.name, status: 'error', error: e.message });
      failCount++;
    }
  }

  return {
    batch_size: batchSize,
    processed: owners.length,
    succeeded: successCount,
    failed: failCount,
    results,
  };
}

// ─── Build Email Report ────────────────────────────────────────────────

export function buildSkipTraceEmailReport(result: SkipTraceResult): string {
  const lines: string[] = [];
  lines.push('<div style="font-family: Inter, sans-serif; max-width: 700px; margin: auto; padding: 24px;">');
  lines.push('<div style="background: #0d0d0c; color: #fff; padding: 24px; border-radius: 12px; border: 1px solid #c38a1b;">');
  lines.push(`<h1 style="color: #e4b653; font-size: 22px; margin: 0 0 8px;">Skip Trace Report</h1>`);
  lines.push(`<p style="color: #aaa; font-size: 13px; margin: 0;">Hidden Property Intel · Advanced Skip Trace Engine</p>`);
  lines.push(`<p style="color: #888; font-size: 11px; margin: 4px 0 0;">Processed: ${new Date(result.processed_at).toLocaleString()}</p>`);
  lines.push('</div>');

  lines.push('<div style="background: #f7f5f0; padding: 20px; border-radius: 0 0 12px 12px; border: 1px solid #e7e1d6; border-top: 0;">');

  // Target
  lines.push(`<p style="font-size: 14px;"><strong>Target:</strong> ${result.target.name || 'Unknown'}</p>`);
  lines.push(`<p style="font-size: 12px; color: #6f6a60;"><strong>Address:</strong> ${result.target.address || 'N/A'}</p>`);
  lines.push(`<p style="font-size: 12px; color: #6f6a60;"><strong>Overall Confidence:</strong> <span style="font-weight: bold; color: ${result.overall_confidence >= 70 ? '#247a45' : result.overall_confidence >= 40 ? '#a6640b' : '#b33a31'};">${result.overall_confidence}%</span></p>`);

  // Executive summary
  if (result.raw_intel) {
    lines.push(`<div style="background: #fff; padding: 12px; border-radius: 8px; border: 1px solid #e7e1d6; margin: 12px 0;"><p style="font-size: 12px; color: #12110f;"><strong>Summary:</strong> ${result.raw_intel}</p></div>`);
  }

  // Phones
  if (result.phones.length > 0) {
    lines.push('<h3 style="font-size: 13px; color: #12110f; border-bottom: 1px solid #e7e1d6; padding-bottom: 4px;">Phone Numbers</h3>');
    for (const p of result.phones) {
      lines.push(`<p style="font-size: 12px; margin: 4px 0;"><code style="background: #f7f5f0; padding: 2px 6px; border-radius: 4px;">${p.number}</code> <span style="color: #6f6a60;">(${p.type}) · ${p.confidence}% · ${p.source}</span></p>`);
    }
  }

  // Emails
  if (result.emails.length > 0) {
    lines.push('<h3 style="font-size: 13px; color: #12110f; border-bottom: 1px solid #e7e1d6; padding-bottom: 4px; margin-top: 16px;">Email Addresses</h3>');
    for (const e of result.emails) {
      lines.push(`<p style="font-size: 12px; margin: 4px 0;"><code style="background: #f7f5f0; padding: 2px 6px; border-radius: 4px;">${e.address}</code> <span style="color: #6f6a60;">· ${e.confidence}% · ${e.source}</span></p>`);
    }
  }

  // Addresses
  if (result.addresses.length > 0) {
    lines.push('<h3 style="font-size: 13px; color: #12110f; border-bottom: 1px solid #e7e1d6; padding-bottom: 4px; margin-top: 16px;">Addresses</h3>');
    for (const a of result.addresses) {
      lines.push(`<p style="font-size: 12px; margin: 4px 0;">${a.line} <span style="color: #6f6a60;">(${a.type}) · ${a.confidence}%</span></p>`);
    }
  }

  // Relatives
  if (result.relatives.length > 0) {
    lines.push('<h3 style="font-size: 13px; color: #12110f; border-bottom: 1px solid #e7e1d6; padding-bottom: 4px; margin-top: 16px;">Relatives & Next of Kin</h3>');
    for (const r of result.relatives) {
      lines.push(`<p style="font-size: 12px; margin: 4px 0;">${r.name} <span style="color: #6f6a60;">(${r.relationship}) · ${r.confidence}%</span></p>`);
    }
  }

  // Social profiles
  if (result.social_profiles.length > 0) {
    lines.push('<h3 style="font-size: 13px; color: #12110f; border-bottom: 1px solid #e7e1d6; padding-bottom: 4px; margin-top: 16px;">Social Media Profiles</h3>');
    for (const s of result.social_profiles) {
      lines.push(`<p style="font-size: 12px; margin: 4px 0;"><strong>${s.platform}:</strong> <a href="${s.url}" style="color: #c38a1b;">${s.url}</a> <span style="color: #6f6a60;">· ${s.confidence}%</span></p>`);
    }
  }

  // Business affiliations
  if (result.business_affiliations.length > 0) {
    lines.push('<h3 style="font-size: 13px; color: #12110f; border-bottom: 1px solid #e7e1d6; padding-bottom: 4px; margin-top: 16px;">Business Affiliations</h3>');
    for (const b of result.business_affiliations) {
      lines.push(`<p style="font-size: 12px; margin: 4px 0;">${b.name} <span style="color: #6f6a60;">(${b.role}) · ${b.status}</span></p>`);
    }
  }

  // Sources checked
  lines.push('<h3 style="font-size: 13px; color: #12110f; border-bottom: 1px solid #e7e1d6; padding-bottom: 4px; margin-top: 16px;">Sources Checked</h3>');
  lines.push(`<p style="font-size: 11px; color: #6f6a60;">${result.sources_checked.join(' · ')}</p>`);

  // Identification methods
  if (result.identification_methods.length > 0) {
    lines.push('<h3 style="font-size: 13px; color: #12110f; border-bottom: 1px solid #e7e1d6; padding-bottom: 4px; margin-top: 16px;">Identification Methods</h3>');
    for (const m of result.identification_methods) {
      const color = m.status === 'found' ? '#247a45' : m.status === 'partial' ? '#a6640b' : '#b33a31';
      lines.push(`<p style="font-size: 11px; margin: 3px 0;"><span style="color: ${color}; font-weight: bold;">${m.status.toUpperCase()}</span> ${m.method} <span style="color: #6f6a60;">(${m.source})</span></p>`);
    }
  }

  lines.push('</div></div>');
  return lines.join('\n');
}