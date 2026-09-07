/**
 * Cron: mirrors Base44 data into your Supabase every 30 minutes.
 * Calls the Base44 syncToSupabase function with the sync token.
 *
 * Env vars:
 *   BASE44_SYNC_TOKEN — the shared secret for Base44 function auth
 */
const BASE44_FUNCTION_URL = 'https://my-property-intel.base44.app/functions/syncToSupabase';

export default async function handler(req, res) {
  const syncToken = process.env.BASE44_SYNC_TOKEN;

  if (!syncToken) {
    return res.status(500).json({ error: 'BASE44_SYNC_TOKEN env var not set' });
  }

  try {
    const result = await fetch(BASE44_FUNCTION_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${syncToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trigger: 'mirror' }),
    });

    const data = await result.json().catch(() => ({}));
    return res.status(200).json({
      mirrored: true,
      base44_status: result.status,
      synced: data.synced,
      errors: data.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('mirror-to-supabase error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}