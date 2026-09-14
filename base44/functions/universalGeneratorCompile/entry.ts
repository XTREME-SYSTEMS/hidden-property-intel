import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { compileHpiGeneratorProfile } from '../../shared/universalGenerator/hpiProfile.ts';
import { HPI_RESILIENCE_MATRIX, summarizeResilience } from '../../shared/universalGenerator/resilienceMatrix.ts';

export default async function(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  return Response.json({
    compiler: 'xtreme-universal-generator',
    version: 'hpi-integration-v1',
    mutationPerformed: false,
    profile: compileHpiGeneratorProfile(),
    resilienceSummary: summarizeResilience(),
    resilienceMatrix: HPI_RESILIENCE_MATRIX,
  });
}
