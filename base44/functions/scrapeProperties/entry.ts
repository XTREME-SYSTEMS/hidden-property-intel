import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { scrapeSource } from '../../shared/scraper.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { source_id, url, distress_type, state } = body || {};

    let source = null;
    if (source_id) {
      const ds = await base44.asServiceRole.entities.DataSource.filter({ id: source_id });
      source = ds[0];
      if (!source) return Response.json({ error: 'DataSource not found' }, { status: 404 });
    }

    const job = await base44.asServiceRole.entities.ScrapeJob.create({
      source_id: source_id || 'manual',
      source_name: source?.name || 'manual',
      status: 'running',
      started_at: new Date().toISOString(),
      scrape_config: source?.scrape_config || {}
    });

    const result = await scrapeSource(base44, { secrets, source, url, distress_type, state });

    await base44.asServiceRole.entities.ScrapeJob.update(job.id, {
      status: result.error ? 'failed' : 'complete',
      properties_found: result.found || 0,
      properties_new: result.isNew || 0,
      properties_updated: result.updated || 0,
      error: result.error,
      completed_at: new Date().toISOString()
    });

    if (source && !result.error) {
      await base44.asServiceRole.entities.DataSource.update(source.id, {
        last_run_at: new Date().toISOString(),
        properties_yielded: (source.properties_yielded || 0) + (result.isNew || 0)
      });
    }

    if (result.error) return Response.json({ error: result.error }, { status: 502 });
    return Response.json({ job_id: job.id, found: result.found, new: result.isNew, updated: result.updated });
  } catch (error) {
    console.error('scrapeProperties error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}