function normalizeBaseUrl(url) {
  return String(url || '').replace(/\/$/, '');
}

export class SupabaseConvergenceStore {
  constructor({ url, serviceKey, fetchImpl = fetch }) {
    this.url = normalizeBaseUrl(url);
    this.serviceKey = serviceKey || '';
    this.fetchImpl = fetchImpl;
    this.available = Boolean(this.url && this.serviceKey);
  }

  headers(extra = {}) {
    return {
      apikey: this.serviceKey,
      Authorization: `Bearer ${this.serviceKey}`,
      'Content-Type': 'application/json',
      ...extra,
    };
  }

  async rpc(name, payload) {
    const response = await this.fetchImpl(`${this.url}/rest/v1/rpc/${name}`, {
      method: 'POST', headers: this.headers(), body: JSON.stringify(payload || {}),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`${name} failed: HTTP ${response.status}`);
    return data;
  }

  async acquireLease(name, holder, ttlSeconds = 240) {
    if (!this.available) return false;
    const data = await this.rpc('hpi_acquire_reconcile_lease', { p_name: name, p_holder: holder, p_ttl_seconds: ttlSeconds });
    return data === true || data?.acquired === true;
  }

  async releaseLease(name, holder) {
    if (!this.available) return false;
    const data = await this.rpc('hpi_release_reconcile_lease', { p_name: name, p_holder: holder });
    return data === true || data?.released === true;
  }

  async getState(key) {
    if (!this.available) return null;
    const response = await this.fetchImpl(`${this.url}/rest/v1/hpi_convergence_state?select=state_value,updated_at&state_key=eq.${encodeURIComponent(key)}&limit=1`, { headers: this.headers() });
    const data = await response.json().catch(() => []);
    if (!response.ok) throw new Error(`getState failed: HTTP ${response.status}`);
    return data?.[0]?.state_value ?? null;
  }

  async setState(key, value) {
    if (!this.available) return false;
    const response = await this.fetchImpl(`${this.url}/rest/v1/hpi_convergence_state?on_conflict=state_key`, {
      method: 'POST',
      headers: this.headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify({ state_key: key, state_value: value, updated_at: new Date().toISOString() }),
    });
    if (!response.ok) throw new Error(`setState failed: HTTP ${response.status}`);
    return true;
  }

  async claimJob(job) {
    if (!this.available) return { claimed: false, jobId: null };
    const data = await this.rpc('hpi_claim_convergence_job', {
      p_job_id: job.jobId,
      p_job_type: job.jobType,
      p_idempotency_key: job.idempotencyKey,
      p_source_sha: job.sourceSha || null,
      p_payload: job.payload || {},
    });
    if (typeof data === 'boolean') return { claimed: data, jobId: data ? job.jobId : null };
    return { claimed: Boolean(data?.claimed), jobId: data?.job_id || job.jobId };
  }

  async completeJob(jobId, status, result = null, error = null) {
    if (!this.available) return false;
    const response = await this.fetchImpl(`${this.url}/rest/v1/hpi_convergence_jobs?job_id=eq.${encodeURIComponent(jobId)}`, {
      method: 'PATCH',
      headers: this.headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ status, result, error, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
    });
    if (!response.ok) throw new Error(`completeJob failed: HTTP ${response.status}`);
    return true;
  }

  async insertReceipt(receipt) {
    if (!this.available) return false;
    const response = await this.fetchImpl(`${this.url}/rest/v1/hpi_convergence_receipts`, {
      method: 'POST', headers: this.headers({ Prefer: 'return=minimal' }), body: JSON.stringify(receipt),
    });
    if (!response.ok) throw new Error(`insertReceipt failed: HTTP ${response.status}`);
    return true;
  }
}

export function createStoreFromEnv(env = process.env, fetchImpl = fetch) {
  return new SupabaseConvergenceStore({
    url: env.HPI_SUPABASE_URL || env.SUPABASE_URL,
    serviceKey: env.HPI_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl,
  });
}
