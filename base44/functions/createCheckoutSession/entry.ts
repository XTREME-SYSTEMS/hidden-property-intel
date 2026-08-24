import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

const PLAN_PRODUCTS = {
  starter: 'PropertyIntel Starter',
  pro: 'PropertyIntel Pro',
  elite: 'PropertyIntel Elite'
};

export default async function(req) {
  try {
    const body = await req.json();
    const { plan, user_id, email, success_url, cancel_url } = body || {};
    if (!plan || !PLAN_PRODUCTS[plan]) {
      return Response.json({ error: 'valid plan required (starter | pro | elite)' }, { status: 400 });
    }
    if (!success_url || !cancel_url) {
      return Response.json({ error: 'success_url and cancel_url required' }, { status: 400 });
    }

    const key = secrets.get('STRIPE_SECRET_KEY');
    const appId = Deno.env.get('BASE44_APP_ID') || secrets.get('BASE44_APP_ID') || '';
    const productName = PLAN_PRODUCTS[plan];

    const prodRes = await fetch('https://api.stripe.com/v1/products?limit=100', {
      headers: { Authorization: `Bearer ${key}` }
    });
    const prodJson = await prodRes.json();
    const product = (prodJson.data || []).find((p) => p.name === productName);
    if (!product || !product.default_price) {
      return Response.json({ error: `Stripe product "${productName}" not found. Create it first.` }, { status: 500 });
    }

    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('line_items[0][price]', product.default_price);
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', success_url);
    params.append('cancel_url', cancel_url);
    if (email) params.append('customer_email', email);
    params.append('metadata[base44_app_id]', appId);
    params.append('metadata[plan]', plan);
    if (user_id) params.append('metadata[user_id]', user_id);
    params.append('subscription_data[metadata][base44_app_id]', appId);
    params.append('subscription_data[metadata][plan]', plan);
    if (user_id) params.append('subscription_data[metadata][user_id]', user_id);

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Stripe-Version': '2025-10-29.clover',
        'Idempotency-Key': crypto.randomUUID()
      },
      body: params
    });
    const session = await res.json();
    if (!res.ok) {
      console.error('Stripe checkout error', session);
      return Response.json({ error: session.error?.message || 'Stripe error' }, { status: 502 });
    }
    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('createCheckoutSession error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}