import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { emailProbateHeirs } from '../../shared/probateOutreach.ts';

/**
 * OutreachProbateHeirs — sends personalized, empathetic outreach emails to
 * identified heirs of deceased homeowners. Only contacts heirs with email
 * who haven't been contacted yet.
 *
 * Args:
 *  limit — max emails to send per run (default: 30)
 *  test_email — optional test email (sends a sample, doesn't mark anything)
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const limit = body?.limit || 30;
    const testEmail = body?.test_email || null;

    if (testEmail) {
      const sampleHeir = { name: 'Jeremy', relationship_to_property: 'son', contact_email: testEmail };
      const sampleProperty = {
        address: '1480 South Ocean Blvd',
        city: 'Pompano Beach',
        state: 'FL',
        zip_code: '33062'
      };
      const { probateHeirSubject, probateHeirBody } = await import('../../shared/probateOutreach.ts');
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: testEmail,
        from_name: 'Hidden Property Intel',
        subject: probateHeirSubject(sampleHeir, sampleProperty, 'John Smith'),
        body: probateHeirBody(sampleHeir, sampleProperty, 'John Smith')
      });
      return Response.json({ sent: 1, test: true, to: testEmail });
    }

    const result = await emailProbateHeirs(base44, limit);
    return Response.json(result);
  } catch (error) {
    console.error('outreachProbateHeirs error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}