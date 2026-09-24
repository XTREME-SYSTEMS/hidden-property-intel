import crypto from "node:crypto";

const SUPABASE_URL = process.env.HPI_SUPABASE_URL || process.env.SUPABASE_URL || "https://fwtchbsebygwifmmqhur.supabase.co";
const SITE_KEY = "hidden-property-intel";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    const error = new Error(`Missing required server configuration: ${name}`);
    error.status = 503;
    throw error;
  }
  return value;
}

export function json(res, status, body) {
  res.status(status).setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

export function bearer(req) {
  const value = String(req.headers.authorization || "");
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7) : "";
}

export async function requireSupabaseUser(req) {
  const token = bearer(req);
  if (!token) {
    const error = new Error("Authentication required");
    error.status = 401;
    throw error;
  }
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
    },
  });
  if (!response.ok) {
    const error = new Error("Invalid or expired session");
    error.status = 401;
    throw error;
  }
  return response.json();
}

function serviceHeaders(extra={}) {
  const key = requireEnv("HPI_SUPABASE_SERVICE_ROLE_KEY");
  return {
    apikey:key,
    Authorization:`Bearer ${key}`,
    "content-type":"application/json",
    ...extra,
  };
}

export async function serviceQuery(path, options={}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: serviceHeaders(options.headers || {}),
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`Supabase service request failed (${response.status})`);
    error.status = 502;
    throw error;
  }
  return text ? JSON.parse(text) : null;
}

function stateSecret() {
  return requireEnv("GOOGLE_WORKSPACE_STATE_SECRET");
}

function encode(value) {
  return Buffer.from(value).toString("base64url");
}

function decode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function signState(payload) {
  const body = encode(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", stateSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyState(value) {
  const [body,sig] = String(value || "").split(".");
  if (!body || !sig) throw Object.assign(new Error("Invalid OAuth state"), {status:400});
  const expected = crypto.createHmac("sha256", stateSecret()).update(body).digest();
  const provided = Buffer.from(sig,"base64url");
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected,provided)) {
    throw Object.assign(new Error("Invalid OAuth state signature"), {status:400});
  }
  const payload=JSON.parse(decode(body));
  if (!payload?.uid || !payload?.exp || Date.now() > payload.exp) {
    throw Object.assign(new Error("Expired OAuth state"), {status:400});
  }
  return payload;
}

function tokenKey() {
  const raw=requireEnv("GOOGLE_WORKSPACE_TOKEN_ENCRYPTION_KEY");
  let key;
  if (/^[a-f0-9]{64}$/i.test(raw)) key=Buffer.from(raw,"hex");
  else {
    try { key=Buffer.from(raw,"base64"); } catch { key=null; }
  }
  if (!key || key.length !== 32) {
    const error=new Error("GOOGLE_WORKSPACE_TOKEN_ENCRYPTION_KEY must be 32 bytes (base64) or 64 hex characters");
    error.status=503;
    throw error;
  }
  return key;
}

export function encryptCredential(value) {
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv("aes-256-gcm",tokenKey(),iv);
  const ciphertext=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);
  return {
    ciphertext:ciphertext.toString("base64"),
    iv:iv.toString("base64"),
    auth_tag:cipher.getAuthTag().toString("base64"),
  };
}

export function safeReturnTo(value) {
  try {
    const target=new URL(value || "/admin", "https://www.hiddenpropertyintel.com");
    if (!["hiddenpropertyintel.com","www.hiddenpropertyintel.com"].includes(target.hostname)) return "/admin";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/admin";
  }
}

export function googleConfig() {
  const scopes=(process.env.GOOGLE_WORKSPACE_SCOPES ||
    "openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events"
  ).trim().split(/\s+/);
  return {
    clientId:requireEnv("GOOGLE_WORKSPACE_CLIENT_ID"),
    clientSecret:requireEnv("GOOGLE_WORKSPACE_CLIENT_SECRET"),
    redirectUri:process.env.GOOGLE_WORKSPACE_REDIRECT_URI || "https://www.hiddenpropertyintel.com/api/google-workspace/callback",
    scopes,
  };
}

export { SUPABASE_URL, SITE_KEY };
