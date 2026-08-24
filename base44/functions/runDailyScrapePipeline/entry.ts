import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { scrapeSource } from '../../shared/scraper.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const sources = await base44.asServiceRole.entities.DataSource.filter({ status: 'active' });

    const results = [];
    for (const source of sources) {
      const job = await base44.asServiceRole.entities.ScrapeJob.create({
        source_id: source.id,
        source_name: source.name,
        status: 'running',
        started_at: new Date().toISOString(),
        scrape_config: source.scrape_config || {}
      });

      const result = await scrapeSource(base44, { secrets, source });

      await base44.asServiceRole.entities.ScrapeJob.update(job.id, {
        status: result.error ? 'failed' : 'complete',
        properties_found: result.found || 0,
        properties_new: result.isNew || 0,
        properties_updated: result.updated || 0,
        error: result.error,
        completed_at: new Date().toISOString()
      });

      if (!result.error) {
        await base44.asServiceRole.entities.DataSource.update(source.id, {
          last_run_at: new Date().toISOString(),
          properties_yielded: (source.properties_yielded || 0) + (result.isNew || 0)
        });
      }

      results.push({
        source: source.name,
        found: result.found,
        new: result.isNew,
        updated: result.updated,
        error: result.error
      });
    }

    return Response.json({ sources_run: results.length, results });
  } catch (error) {
    console.error('runDailyScrapePipeline error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}