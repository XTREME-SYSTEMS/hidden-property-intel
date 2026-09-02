// Supabase REST API client — no SDK needed, just fetch.
// Uses the service_role key (bypasses RLS) for read/write.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

// SELECT: table, { select, filter, order, limit, offset }
export async function select(table, opts = {}) {
  const params = new URLSearchParams();
  if (opts.select) params.set("select", opts.select);
  if (opts.filter) params.set(opts.filter.column, opts.filter.op ? `${opts.filter.op}.${opts.filter.value}` : `eq.${opts.filter.value}`);
  if (opts.order) params.set("order", opts.order);
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.offset) params.set("offset", String(opts.offset));
  const qs = params.toString();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${qs ? "?" + qs : ""}`, { headers });
  if (!res.ok) throw new Error(`Supabase SELECT ${table} ${res.status}: ${await res.text()}`);
  return res.json();
}

// INSERT: single or array
export async function insert(table, data, { returnRepresentation = false } = {}) {
  const h = { ...headers };
  if (returnRepresentation) h.Prefer = "return=representation";
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: h,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase INSERT ${table} ${res.status}: ${await res.text()}`);
  return returnRepresentation ? res.json() : { ok: true };
}

// UPSERT: insert with merge on conflict
export async function upsert(table, data, onConflict = null) {
  const h = { ...headers, Prefer: "resolution=merge-duplicates,return=representation" };
  let path = table;
  if (onConflict) path += `?on_conflict=${onConflict}`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: h,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase UPSERT ${table} ${res.status}: ${await res.text()}`);
  return res.json();
}

// UPDATE: filter is { column, value } or raw query string
export async function update(table, filter, data) {
  const qs = typeof filter === "string" ? filter : new URLSearchParams(filter).toString();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase UPDATE ${table} ${res.status}: ${await res.text()}`);
  return res.json();
}

// RPC: call a Postgres function
export async function rpc(fnName, params = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Supabase RPC ${fnName} ${res.status}: ${await res.text()}`);
  return res.json();
}

export { SUPABASE_URL };