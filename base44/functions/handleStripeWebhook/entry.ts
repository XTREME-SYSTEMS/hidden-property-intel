import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

async function verifySignature(rawBody, sigHeader, secret) {
  const parts = Object.fromEntries(
    sigHeader.split(',').map((p) => p.trim().split('='))
  );
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signed = enc.encode(`${t}.${rawBody}`);
  const sig = await crypto.subtle.sign('HMAC', key, signed);
  const expected = [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return expected === v1;
}

const PLAN_PRICE = { starter: 49, pro: 149, elite: 499 };

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const raw = await req.text();
    const sig = req.headers.get('stripe-signature') || '';
    const secret = secrets.get('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      console.error('STRIPE_WEBHOOK_SECRET not set');
      return Response.json({ error: 'webhook secret not configured' }, { status: 500 });
    }
    const ok = await verifySignature(raw, sig, secret);
    if (!ok) return Response.json({ error: 'invalid signature' }, { status: 400 });

    const event = JSON.parse(raw);

    if (event.type === 'checkout.session.completed') {
      const s = event.data.object;
      const userId = s.metadata?.user_id;
      const plan = s.metadata?.plan;
      const email = s.customer_email || s.customer_details?.email;
      const subId = s.subscription;
      const customerId = s.customer;
      if (userId && plan) {
        const existing = await base44.asServiceRole.entities.Investor.filter({ user_id: userId });
        if (!existing[0]) {
          await base44.asServiceRole.entities.Investor.create({
            user_id: userId,
            name: email || 'Investor',
            email: email || '',
            subscription_plan: plan,
            subscription_status: 'active',
            verified: false
          });
        } else {
          await base44.asServiceRole.entities.Investor.update(existing[0].id, {
            subscription_plan: plan,
            subscription_status: 'active'
          });
        }
        const subs = await base44.asServiceRole.entities.Subscription.filter({
          stripe_subscription_id: subId
        });
        if (!subs[0]) {
          await base44.asServiceRole.entities.Subscription.create({
            investor_id: userId,
            plan,
            price: PLAN_PRICE[plan] || 0,
            billing_cycle: 'monthly',
            stripe_customer_id: customerId,
            stripe_subscription_id: subId,
            status: 'active',
            started_at: new Date().toISOString()
          });
        }
      }
    } else if (event.type === 'invoice.paid') {
      const inv = event.data.object;
      const subId = inv.subscription;
      const subs = await base44.asServiceRole.entities.Subscription.filter({
        stripe_subscription_id: subId
      });
      if (subs[0]) {
        const periodEnd = inv.lines?.data?.[0]?.period?.end;
        await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
          status: 'active',
          current_period_end: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : subs[0].current_period_end
        });
        const invs = await base44.asServiceRole.entities.Investor.filter({
          user_id: subs[0].investor_id
        });
        if (invs[0]) {
          await base44.asServiceRole.entities.Investor.update(invs[0].id, {
            subscription_status: 'active'
          });
        }
      }
    } else if (event.type === 'invoice.payment_failed') {
      const inv = event.data.object;
      const subs = await base44.asServiceRole.entities.Subscription.filter({
        stripe_subscription_id: inv.subscription
      });
      if (subs[0]) {
        await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
          status: 'past_due'
        });
        const invs = await base44.asServiceRole.entities.Investor.filter({
          user_id: subs[0].investor_id
        });
        if (invs[0]) {
          await base44.asServiceRole.entities.Investor.update(invs[0].id, {
            subscription_status: 'past_due'
          });
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const subs = await base44.asServiceRole.entities.Subscription.filter({
        stripe_subscription_id: sub.id
      });
      if (subs[0]) {
        await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
          status: 'cancelled'
        });
        const invs = await base44.asServiceRole.entities.Investor.filter({
          user_id: subs[0].investor_id
        });
        if (invs[0]) {
          await base44.asServiceRole.entities.Investor.update(invs[0].id, {
            subscription_status: 'cancelled'
          });
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('handleStripeWebhook error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}