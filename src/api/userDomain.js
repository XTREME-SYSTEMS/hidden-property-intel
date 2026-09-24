import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, supabaseAuth } from "@/api/supabaseAuth";

async function request(table, { method="GET", query="", body, prefer }={}) {
  const token = await supabaseAuth.getAccessToken();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`, {
    method,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || data?.details || data?.hint || `Universal request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function orderParam(sort) {
  if (!sort) return "";
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return `order=${encodeURIComponent(field)}.${desc ? "desc" : "asc"}.nullslast`;
}

async function apiCall(path, body) {
  const token = await supabaseAuth.getAccessToken();
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error || `API request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const userDomain = {
  investor: {
    async get(userId) {
      const rows = await request("investor_profiles",{query:`user_id=eq.${encodeURIComponent(userId)}&limit=1`});
      return rows?.[0] || null;
    },
  },

  savedSearches: {
    async list(userId) {
      return (await request("saved_searches",{query:`user_id=eq.${encodeURIComponent(userId)}&order=created_date.desc`})) || [];
    },
    async create(payload) {
      const rows=await request("saved_searches",{method:"POST",body:payload,prefer:"return=representation"});
      return rows?.[0] || null;
    },
    async remove(id) {
      await request("saved_searches",{method:"DELETE",query:`id=eq.${encodeURIComponent(id)}`,prefer:"return=minimal"});
    },
  },
  sellerProperties: {
    async list() {
      const data = await apiCall("/api/properties/mine");
      return data?.properties || [];
    },
  },

  properties: {
    async create(payload) {
      const rows = await request("properties", { method:"POST", body: payload, prefer:"return=representation" });
      return rows?.[0] || null;
    },
  },

  deals: {
    async list(sort="-created_date", limit=200) {
      const q = [orderParam(sort), `limit=${Math.min(Number(limit)||200,500)}`].filter(Boolean).join("&");
      return (await request("deals",{query:q})) || [];
    },
    async create(payload) {
      const rows = await request("deals",{method:"POST",body:{site_key:"hidden-property-intel",status:"active",...payload},prefer:"return=representation"});
      return rows?.[0] || null;
    },
    async update(id,payload) {
      const rows = await request("deals",{method:"PATCH",query:`id=eq.${encodeURIComponent(id)}`,body:payload,prefer:"return=representation"});
      return rows?.[0] || null;
    },
    async remove(id) {
      await request("deals",{method:"DELETE",query:`id=eq.${encodeURIComponent(id)}`,prefer:"return=minimal"});
    },
  },

  bids: {
    async mine(userId) {
      return (await request("bids",{query:`investor_id=eq.${encodeURIComponent(userId)}&order=created_date.desc`})) || [];
    },
    async list(propertyId) {
      return (await request("bids",{query:`property_id=eq.${encodeURIComponent(propertyId)}&order=bid_amount.desc`})) || [];
    },
    async place(payload) {
      return apiCall("/api/bids/place", payload);
    },
    async accept(payload) {
      return apiCall("/api/bids/accept", payload);
    },
  },

  propertyParty: {
    async get(propertyId) {
      return apiCall(`/api/properties/party-context?property_id=${encodeURIComponent(propertyId)}`);
    },
  },

  alerts: {
    async list(limit=100) {
      return (await request("deal_alerts",{query:`order=created_date.desc&limit=${Math.min(Number(limit)||100,500)}`})) || [];
    },
    async markAllRead() {
      await request("deal_alerts",{method:"PATCH",query:"read=eq.false",body:{read:true},prefer:"return=minimal"});
    },
    async getPreferences() {
      const rows = await request("alert_preferences",{query:"select=*&limit=1"});
      return rows?.[0] || null;
    },
    async savePreferences(userId, patch) {
      const rows = await request("alert_preferences?dummy=1".split("?")[0],{
        method:"POST",
        query:"on_conflict=user_id",
        body:{user_id:userId,...patch,updated_date:new Date().toISOString()},
        prefer:"resolution=merge-duplicates,return=representation"
      });
      return rows?.[0] || null;
    },
  },
};
