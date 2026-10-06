import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/api/supabaseAuth";

const FIELDS = [
  "id","base44_id","address","normalized_address","city","state","zip_code","lat","lng",
  "property_type","distress_type","status","estimated_value","proposed_asking_price",
  "property_score","square_footage","bedrooms","bathrooms","year_built","lot_size",
  "description","source","source_name","source_url","scraped_at","last_verified_at",
  "image_fetch_attempts","days_on_market","images","is_featured","created_date",
  "updated_date","updated_at"
];

const ALLOWED = new Set(FIELDS);

function headers() {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
  };
}

function normalize(row) {
  if (!row) return row;
  const { base44_id, ...rest } = row;
  return { ...rest, id: base44_id || row.id, universal_id: row.id };
}

function addFilter(params, key, value) {
  if (!ALLOWED.has(key) || value == null) return;
  if (typeof value !== "object" || Array.isArray(value)) {
    params.append(key, `eq.${value}`);
    return;
  }
  const ops = {
    $gte: "gte",
    $lte: "lte",
    $gt: "gt",
    $lt: "lt",
    $ne: "neq",
  };
  for (const [operator, postgrest] of Object.entries(ops)) {
    if (value[operator] != null) params.append(key, `${postgrest}.${value[operator]}`);
  }
  if (Array.isArray(value.$in) && value.$in.length) {
    params.append(key, `in.(${value.$in.map(String).join(",")})`);
  }
}

function addSort(params, sort) {
  if (!sort || typeof sort !== "string") return;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  if (!ALLOWED.has(field)) return;
  params.set("order", `${field}.${desc ? "desc" : "asc"}.nullslast`);
}

async function queryRows(params) {
  params.set("select", FIELDS.join(","));
  const response = await fetch(`${SUPABASE_URL}/rest/v1/properties?${params.toString()}`, {
    headers: headers(),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Universal property query failed (${response.status})${detail ? `: ${detail}` : ""}`);
  }
  const rows = await response.json();
  return rows.map(normalize);
}

export const publicProperties = {
  async filter(query = {}, sort = "-property_score", limit = 100) {
    const params = new URLSearchParams();
    params.set("status", "eq.active");
    Object.entries(query || {}).forEach(([key, value]) => addFilter(params, key, value));
    addSort(params, sort);
    params.set("limit", String(Math.max(1, Math.min(Number(limit) || 100, 500))));
    return queryRows(params);
  },

  async list(sort = "-created_date", limit = 100) {
    return this.filter({ status: "active" }, sort, limit);
  },

  async get(id) {
    const byLegacy = new URLSearchParams();
    byLegacy.set("status", "eq.active");
    byLegacy.set("base44_id", `eq.${id}`);
    byLegacy.set("limit", "1");
    let rows = await queryRows(byLegacy);
    if (!rows[0] && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id))) {
      const byUuid = new URLSearchParams();
      byUuid.set("status", "eq.active");
      byUuid.set("id", `eq.${id}`);
      byUuid.set("limit", "1");
      rows = await queryRows(byUuid);
    }
    if (!rows[0]) {
      const error = new Error("Property not found");
      error.status = 404;
      throw error;
    }
    return rows[0];
  },
};
