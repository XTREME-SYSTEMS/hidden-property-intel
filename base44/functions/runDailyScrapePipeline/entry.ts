import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { scrapeSource } from '../../shared/scraper.ts';
import { scorePropertyRecord } from '../../shared/scoring.ts';

const SOURCES_PER_RUN = 20; // scraping is fast (images decoupled); cycles through all 126 sources over ~3 days

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const allSources = await base44.asServiceRole.entities.DataSource.filter({ status: 'active' });

    // Prioritize sources that haven't been scraped recently (oldest last_run_at first)
    // null last_run_at = never run = highest priority
    const sources = allSources
      .sort((a, b) => {
        const aTime = a.last_run_at ? new Date(a.last_run_at).getTime() : 0;
        const bTime = b.last_run_at ? new Date(b.last_run_at).getTime() : 0;
        return aTime - bTime;
      })
      .slice(0, SOURCES_PER_RUN);

    const results = [];
    let totalNew = 0;
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
        totalNew += (result.isNew || 0);
      }

      results.push({
        source: source.name,
        found: result.found,
        new: result.isNew,
        updated: result.updated,
        error: result.error
      });
    }

    return Response.json({ sources_run: results.length, new_properties: totalNew, results });
  } catch (error) {
    console.error('runDailyScrapePipeline error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}