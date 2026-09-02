import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { scrapeSource } from '../../shared/scraper.ts';
import { scorePropertyRecord } from '../../shared/scoring.ts';

const SOURCES_PER_RUN = 5; // each source = 1 LLM web-search call (~4s); 5 per run stays within time limits

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const allSources = await base44.asServiceRole.entities.DataSource.filter({ status: { $in: ['active', 'error'] } });

    // Filter out paused sources (auto-paused after consecutive failures)
    const eligible = allSources.filter((s) => {
      if (s.status === 'paused') return false;
      if (s.paused_until && new Date(s.paused_until) > now) return false;
      return true;
    });

    // Prioritize sources that haven't been scraped recently (oldest last_run_at first)
    // null last_run_at = never run = highest priority
    const sources = eligible
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

      const result = await scrapeSource(base44, { source });

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
          properties_yielded: (source.properties_yielded || 0) + (result.isNew || 0),
          consecutive_failures: 0,
          status: 'active',
          last_error: null
        });
        totalNew += (result.isNew || 0);
      } else {
        // Failure tracking — auto-pause after 3 consecutive failures
        const failures = (source.consecutive_failures || 0) + 1;
        const update: any = {
          consecutive_failures: failures,
          last_error: result.error,
        };
        if (failures >= 3) {
          update.status = 'paused';
          update.paused_until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        } else if (source.status !== 'error') {
          update.status = 'error';
        }
        await base44.asServiceRole.entities.DataSource.update(source.id, update);
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