// Shared Supabase REST client for Base44 backend functions.
// Uses the service_role key (bypasses RLS) stored in app secrets.

import { secrets } from "base44:runtime";

export function getSupabaseConfig() {
  const url = secrets.get("SUPABASE_URL");
  const key = secrets.get("SUPABASE_SERVICE_KEY");
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY secrets must be set");
  }
  return { url, key };
}

// SELECT rows from a Supabase table
export async function supabaseSelect(table: string, params: Record<string, string> = {}) {
  const { url, key } = getSupabaseConfig();
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${url}/rest/v1/${table}${qs ? "?" + qs : ""}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase SELECT ${table} ${res.status}: ${text}`);
  }
  return res.json();
}

// UPSERT rows into a Supabase table (merge on conflict)
export async function supabaseUpsert(table: string, data: any, onConflict?: string) {
  const { url, key } = getSupabaseConfig();
  let path = table;
  if (onConflict) path += `?on_conflict=${onConflict}`;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase UPSERT ${table} ${res.status}: ${text}`);
  }
  return res.json();
}

// UPDATE rows in a Supabase table (filter is a PostgREST query string)
export async function supabaseUpdate(table: string, filter: string, data: any) {
  const { url, key } = getSupabaseConfig();
  const res = await fetch(`${url}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase UPDATE ${table} ${res.status}: ${text}`);
  }
  return res.json();
}