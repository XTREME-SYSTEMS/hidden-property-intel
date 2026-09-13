import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { emailSellerLeads } from '../../shared/investorOutreach.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return Response.json({ error: 'JSON object body required' }, { status: 400 });
    }
    const limit = body?.limit || 50;
    const testEmail = body?.test_email || null;
    const r = await emailSellerLeads(base44, limit, testEmail);
    return Response.json(r);
  } catch (error) {
    console.error('outreachSellers error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}